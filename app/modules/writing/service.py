"""
Writing Module Service
"""
import difflib
import logging
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func

from app.core.config import get_settings
from app.modules.writing.models import WritingSession, VersionHistory, ChangeLog
from app.modules.style.service import StyleService
from app.modules.learning.models import SuccessfulExample

settings = get_settings()
logger = logging.getLogger(__name__)


class WritingService:
    def __init__(self, db: Session):
        self.db = db
        self.style_service = StyleService(db)
    
    async def generate_text(
        self, 
        prompt: str, 
        style_id: Optional[int] = None,
        context: Optional[dict] = None
    ) -> dict:
        style_prompt = ""
        style_name = None
        
        if style_id:
            style_prompt = self.style_service.build_style_prompt(style_id)
            style = self.style_service.get_style_by_id(style_id)
            style_name = style.name if style else None
            
        success_insights = self._get_success_insights()
        
        full_prompt = self._build_full_prompt(prompt, style_prompt, context, success_insights)
        generated_text = await self._generate_with_ai(full_prompt)
        
        session = WritingSession(
            style_id=style_id,
            context_type=context.get("type") if context else None,
            initial_prompt=prompt,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        version = VersionHistory(
            session_id=session.id,
            version_num=1,
            content=generated_text,
            edit_type="ai_generated"
        )
        self.db.add(version)
        self.db.commit()
        
        return {
            "session_id": session.id,
            "generated_text": generated_text,
            "style_applied": style_name,
            "version": 1
        }
    
    def _build_full_prompt(self, user_prompt: str, style_prompt: str, context: Optional[dict], insights: str = "") -> str:
        parts = []
        if style_prompt:
            parts.append(f"스타일 가이드:\n{style_prompt}\n")
        
        if insights:
            parts.append(f"우수 자소서 분석(참고용):\n{insights}\n위 분석 내용을 바탕으로 더 완성도 높은 글을 작성해줘.\n")
            
        if context:
            if context.get("company"): parts.append(f"회사: {context['company']}")
            if context.get("position"): parts.append(f"직무: {context['position']}")
        parts.append(f"\n요청: {user_prompt}")
        return "\n".join(parts)

    def _get_success_insights(self) -> str:
        try:
            # Get random 3 examples
            examples = self.db.query(SuccessfulExample).order_by(func.random()).limit(3).all()
            if not examples: return ""
            
            lines = []
            for ex in examples:
                if ex.analysis:
                    # Simplify output
                    if isinstance(ex.analysis, dict):
                        summary = ex.analysis.get('summary', '')
                        flow = ex.analysis.get('flow', '')
                        key = ex.analysis.get('key_expressions', [])
                        lines.append(f"- 특징: {summary} / 흐름: {flow} / 주요표현: {key}")
                    else:
                        lines.append(f"- 분석: {str(ex.analysis)[:200]}...")
            return "\n".join(lines)
        except Exception as e:
            logger.warning(f"Insight Error: {e}")
            return ""
    
    async def _generate_with_ai(self, prompt: str) -> str:
        try:
            if settings.openai_api_key:
                return await self._generate_with_openai(prompt)
            return await self._generate_with_ollama(prompt)
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            return f"[AI 생성 결과]\n\n{prompt[:100]}...\n\n(API 연결 실패)"
    
    async def _generate_with_openai(self, prompt: str) -> str:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    
    async def _generate_with_ollama(self, prompt: str) -> str:
        from ollama import AsyncClient
        try:
            client = AsyncClient(host=settings.ollama_base_url)
            response = await client.chat(
                model=settings.ollama_model,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return response.message.content
        except Exception as e:
            logger.error(f"Ollama Error: {e}")
            raise
            
    def add_version(self, session_id: int, content: str, edit_type: str = "user_revision") -> dict:
        session = self.db.query(WritingSession).filter(WritingSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다")
        
        prev_version = self.db.query(VersionHistory)\
            .filter(VersionHistory.session_id == session_id)\
            .order_by(VersionHistory.version_num.desc()).first()
        
        new_version_num = (prev_version.version_num + 1) if prev_version else 1
        diff = None
        if prev_version:
            diff = self._calculate_diff(prev_version.content, content)
        
        version = VersionHistory(
            session_id=session_id,
            version_num=new_version_num,
            content=content,
            diff_from_prev=str(diff) if diff else None,
            edit_type=edit_type
        )
        self.db.add(version)
        session.revision_count = new_version_num - 1
        if edit_type == "user_revision":
            session.final_output = content
        
        if diff:
            self._log_changes(version.id, diff)
        
        self.db.commit()
        self.db.refresh(version)
        
        return {
            "version_id": version.id,
            "version_num": new_version_num,
            "diff": diff,
            "learning_scheduled": bool(diff and diff.get("changes"))
        }
    
    def _calculate_diff(self, old: str, new: str) -> dict:
        differ = difflib.unified_diff(old.splitlines(keepends=True), new.splitlines(keepends=True), lineterm="")
        adds, dels = [], []
        for line in differ:
            if line.startswith('+') and not line.startswith('+++'): adds.append(line[1:].strip())
            elif line.startswith('-') and not line.startswith('---'): dels.append(line[1:].strip())
        return {"additions": adds, "deletions": dels, "changes": len(adds) + len(dels)}
    
    def _log_changes(self, version_id: int, diff: dict):
        for t in diff.get("additions", []):
            if t: self.db.add(ChangeLog(version_id=version_id, change_type="addition", changed_text=t))
        for t in diff.get("deletions", []):
            if t: self.db.add(ChangeLog(version_id=version_id, change_type="deletion", original_text=t))

    def get_session_with_versions(self, session_id: int) -> Optional[WritingSession]:
        return self.db.query(WritingSession).filter(WritingSession.id == session_id).first()

    def get_recent_sessions(self, limit: int = 20):
        return self.db.query(WritingSession)\
            .order_by(WritingSession.started_at.desc())\
            .limit(limit)\
            .all()
