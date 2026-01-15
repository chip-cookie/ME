"""
Interview Module - 면접 질문 생성 서비스
"""
import json
import re
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.modules.style.models import StyleProfile

settings = get_settings()


class InterviewService:
    def __init__(self, db: Session):
        self.db = db
    
    async def generate_questions(
        self,
        style_name: str,
        job_title: Optional[str] = None,
        company: Optional[str] = None,
        count: int = 5
    ) -> dict:
        """학습된 스타일 기반으로 예상 면접 질문 생성"""
        from ollama import AsyncClient
        
        # 스타일 조회
        style = self.db.query(StyleProfile).filter(
            StyleProfile.name == style_name
        ).first()
        
        if not style:
            return {"error": f"스타일 '{style_name}'을 찾을 수 없습니다."}
        
        # 예시 텍스트 수집
        examples = []
        if style.good_examples:
            examples.extend(style.good_examples[:3])
        
        if not examples:
            return {"error": "학습된 예시가 없습니다. 먼저 자료를 학습시켜주세요."}
        
        # 프롬프트 생성
        context = "\n---\n".join(examples)
        job_info = f"지원 직무: {job_title}\n" if job_title else ""
        company_info = f"지원 회사: {company}\n" if company else ""
        
        prompt = f"""다음은 지원자가 작성한 자기소개서/경험 정리입니다:

{context}

{job_info}{company_info}
위 내용을 바탕으로 면접관이 물어볼 가능성이 높은 예상 질문 {count}개를 생성해주세요.
다음 형식으로 JSON 배열만 출력해주세요:
[
  {{"category": "경험", "question": "질문 내용", "reasoning": "이 질문을 물어볼 수 있는 이유"}}
]
카테고리는: 기본, 직무, 회사, 경험 중 하나입니다."""

        # AI 호출
        client = AsyncClient(host=settings.ollama_base_url)
        try:
            response = await client.chat(
                model=settings.ollama_model,
                messages=[{'role': 'user', 'content': prompt}]
            )
            content = response.message.content.strip()
            
            # JSON 파싱
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group())
            else:
                questions = []
            
            return {
                "style_name": style_name,
                "questions": questions,
                "total": len(questions)
            }
        except Exception as e:
            return {"error": f"AI 호출 실패: {str(e)}"}
