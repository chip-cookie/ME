import json
import logging
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.schema import Document, EvaluationResult, GleaningSession
from app.models.enums import GleaningStatus
from app.services.writer_service import WriterService
from app.services.judge_service import JudgeService
from app.services.parser_service import ParserService
from app.services.analyzer_service import AnalyzerService

logger = logging.getLogger(__name__)


class GleaningService:
    MAX_ITERATIONS = 5
    PASS_THRESHOLDS = {"PUBLIC": 3.5, "PRIVATE": 4.0}

    def __init__(
        self,
        writer_service: WriterService,
        judge_service: JudgeService,
        parser_service: ParserService,
        analyzer_service: AnalyzerService,
        db_session: Session,
    ):
        self.w = writer_service
        self.j = judge_service
        self.p = parser_service
        self.a = analyzer_service
        self.db = db_session

    async def run_gleaning(
        self, document_id: str, jd_content: str, org_type: str, doc_type: str
    ) -> dict:
        doc_record = self.db.query(Document).filter(Document.id == document_id).first()
        if not doc_record:
            raise HTTPException(status_code=404, detail="Document not found")

        current_text = doc_record.parsed_markdown or ""
        paragraphs = current_text.split("\n\n")

        session_record = GleaningSession(
            document_id=doc_record.id,
            status=GleaningStatus.RUNNING,
            rewrite_log={
                "initial_text": current_text,
                "iterations": [],
                "fallback_used": False,
                "system_logs": [],
            },
        )
        self.db.add(session_record)
        self.db.commit()
        self.db.refresh(session_record)

        # Initial global context via LLM (best-effort)
        context_dict = await self._generate_global_context(current_text, jd_content)
        global_context_text = (
            f"[전체 요약]: {context_dict['summary']}\n[핵심 엔티티]: {context_dict['entities']}"
        )

        best_score, best_text = 0.0, current_text
        iteration_logs: list[dict] = []
        threshold = self.PASS_THRESHOLDS.get(org_type, 3.5)

        for iteration in range(1, self.MAX_ITERATIONS + 1):
            eval_result = await self.j.evaluate(current_text, jd_content, org_type, doc_type)
            current_score = eval_result.get("total_score", 0.0)

            # Persist evaluation result
            eval_record = EvaluationResult(
                document_id=doc_record.id,
                gleaning_session_id=session_record.id,
                iteration_num=iteration,
                dimension_scores=eval_result.get("scores"),
                total_score=current_score,
                pass_fail=eval_result.get("pass_fail", False),
                feedback_json=eval_result,
            )
            self.db.add(eval_record)

            if current_score > best_score:
                best_score, best_text = current_score, current_text

            if current_score >= threshold:
                session_record.status = GleaningStatus.PASSED
                break

            failures = eval_result.get("rubric_failures", [])
            iter_log = {"iteration": iteration, "score": current_score, "changes": []}

            for failure in failures:
                idx = failure.get("failed_paragraph_index", 0)
                if idx >= len(paragraphs):
                    continue

                jd_keywords = [
                    k.strip()
                    for k in context_dict.get("entities", "").split(",")
                    if k.strip()
                ]
                missing_points = self.a.analyze_gap(jd_keywords, paragraphs[idx])
                gap_instruction = (
                    "\n[보강 지시]: " + ", ".join(p["keyword"] for p in missing_points)
                    if missing_points
                    else ""
                )

                user_prompt = self.w.GLEANING_USER_TEMPLATE.format(
                    full_document=current_text,
                    target_paragraph=paragraphs[idx],
                    para_index=idx,
                    failed_dimension=failure.get("dimension", ""),
                    issue=failure.get("issue", ""),
                    suggestion=failure.get("suggestion", "") + gap_instruction,
                    jd_requirements=jd_content,
                    previous_feedbacks=json.dumps(iteration_logs, ensure_ascii=False),
                    char_limit=800,
                )
                system_prompt = self.w.GLEANING_SYSTEM_PROMPT.format(org_type=org_type)
                rewritten = await self.w.vllm.chat(system=system_prompt, user=user_prompt)

                status, drift_sim = self.a.check_drift(paragraphs[idx], rewritten.strip())
                if status == "HALLUCINATION":
                    logger.warning("Hallucination detected (sim=%.3f), retrying with strict prompt", drift_sim)
                    session_record.rewrite_log["fallback_used"] = True
                    rewritten = await self.w.vllm.chat(
                        system=system_prompt,
                        user=user_prompt + "\n사실관계 유지 필수. 원본 소재를 그대로 유지하고 표현만 개선하세요.",
                        temperature=0.3,
                    )

                paragraphs[idx] = rewritten.strip()
                iter_log["changes"].append(
                    {"para_index": idx, "dimension": failure.get("dimension"), "drift_sim": drift_sim}
                )

            current_text = "\n\n".join(paragraphs)
            iteration_logs.append(iter_log)
        else:
            session_record.status = GleaningStatus.MAX_ITER

        session_record.initial_score = iteration_logs[0]["score"] if iteration_logs else 0.0
        session_record.final_score = best_score
        session_record.total_iterations = len(iteration_logs)
        session_record.rewrite_log["iterations"] = iteration_logs

        doc_record.parsed_markdown = best_text
        self.db.commit()

        return {
            "status": session_record.status.value,
            "final_text": best_text,
            "score": best_score,
            "iterations": len(iteration_logs),
            "session_id": session_record.id,
        }

    async def _generate_global_context(self, document_text: str, jd_content: str) -> dict:
        """Ask LLM for a short summary + key entity list (best-effort)."""
        prompt_system = "당신은 문서 분석 전문가입니다."
        prompt_user = (
            f"다음 자기소개서와 JD를 분석하여 JSON으로 답하세요.\n"
            f'형식: {{"summary": "3줄 요약", "entities": "키워드1, 키워드2, ..."}}\n\n'
            f"[JD]\n{jd_content[:1000]}\n\n[자기소개서]\n{document_text[:2000]}"
        )
        try:
            raw = await self.w.vllm.chat(
                system=prompt_system, user=prompt_user, temperature=0.3, json_mode=True
            )
            import json as _json
            return _json.loads(raw)
        except Exception:
            return {"summary": "", "entities": ""}
