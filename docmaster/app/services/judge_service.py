import json
import logging
from app.services.vllm_client import VLLMClient
from app.prompts.judge_rubric import JUDGE_SYSTEM_PROMPT, JUDGE_USER_TEMPLATE

logger = logging.getLogger(__name__)


class JudgeService:
    WEIGHTS = {
        "requirement_fulfillment": 1.5,
        "structure_quality": 1.0,
        "writing_quality": 1.0,
        "specificity_evidence": 1.2,
        "differentiation": 1.3,
    }
    PASS_THRESHOLDS = {"PUBLIC": 3.5, "PRIVATE": 4.0}

    def __init__(self, vllm_client: VLLMClient):
        self.vllm = vllm_client

    async def evaluate(
        self,
        document_content: str,
        jd_content: str,
        org_type: str,
        doc_type: str,
    ) -> dict:
        system_prompt = JUDGE_SYSTEM_PROMPT.format(org_type=org_type)
        user_prompt = JUDGE_USER_TEMPLATE.format(
            document_content=document_content,
            jd_content=jd_content,
            doc_type=doc_type,
            org_type=org_type,
        )
        raw = await self.vllm.chat(
            system=system_prompt,
            user=user_prompt,
            temperature=0.1,
            json_mode=True,
        )
        try:
            result = json.loads(raw)
            scores = result.get("scores", {})
            total_weight = sum(self.WEIGHTS.values())
            weighted_sum = sum(
                scores.get(k, {}).get("score", 0) * self.WEIGHTS[k] for k in self.WEIGHTS
            )
            result["total_score"] = round(weighted_sum / total_weight, 2)
            result["pass_fail"] = result["total_score"] >= self.PASS_THRESHOLDS.get(org_type, 3.5)
            return result
        except Exception as exc:
            logger.error("Judge parse error: %s | raw: %s", exc, raw[:200])
            return {"error": "Invalid JSON", "total_score": 0.0, "pass_fail": False, "raw": raw}
