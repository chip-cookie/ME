"""
자소서 생성 서비스 — Gemma 라우터(분류) + Qwen 메인 작가(생성) 역할을
vLLM HTTP 호출 두 번으로 대체합니다.

파이프라인:
  1. classify()  → vLLM에 경량 분류 요청 → "공기업" / "사기업" / "범용" 반환
  2. generate()  → 규칙을 조립한 뒤 vLLM에 자소서 생성 요청
"""

from app.services.vllm_client import VLLMClient
from app.prompts.cover_letter import (
    COVER_LETTER_RULES,
    CLASSIFIER_SYSTEM,
    CLASSIFIER_USER_TEMPLATE,
    COVER_LETTER_SYSTEM,
    COVER_LETTER_USER_TEMPLATE,
)


class CoverLetterService:
    """vLLM HTTP 기반 자소서 생성 서비스"""

    def __init__(self, vllm: VLLMClient):
        self.vllm = vllm

    # ------------------------------------------------------------------
    # 1단계: 기업 유형 분류 (Gemma 역할 → vLLM 경량 호출로 대체)
    # ------------------------------------------------------------------
    async def classify(self, user_input: str) -> str:
        """
        사용자 요청 텍스트를 분석하여 기업 유형을 반환합니다.
        반환값: "공기업" | "사기업" | "범용"
        """
        user_prompt = CLASSIFIER_USER_TEMPLATE.format(user_input=user_input)
        result = await self.vllm.chat(
            system=CLASSIFIER_SYSTEM,
            user=user_prompt,
            temperature=0.1,   # 분류는 결정론적으로
            max_tokens=10,     # 단어 하나만 필요
        )
        result = result.strip()
        if "공기업" in result:
            return "공기업"
        elif "사기업" in result:
            return "사기업"
        return "범용"

    # ------------------------------------------------------------------
    # 2단계: 자소서 생성
    # ------------------------------------------------------------------
    async def generate(self, user_input: str, company_type: str) -> str:
        """
        분류된 기업 유형에 맞는 규칙을 조립하여 자소서를 생성합니다.
        """
        # 규칙 레고 조립: 범용 규칙은 항상 포함, 특화 규칙 추가
        rules = COVER_LETTER_RULES["범용"]
        if company_type != "범용":
            rules += "\n" + COVER_LETTER_RULES[company_type]

        user_prompt = COVER_LETTER_USER_TEMPLATE.format(
            rules=rules,
            user_input=user_input,
        )
        return await self.vllm.chat(
            system=COVER_LETTER_SYSTEM,
            user=user_prompt,
            temperature=0.6,
            max_tokens=800,
        )

    # ------------------------------------------------------------------
    # 통합 파이프라인 (분류 → 생성 한 번에)
    # ------------------------------------------------------------------
    async def run(self, user_input: str) -> dict:
        """
        분류와 생성을 순차 실행하고
        {"company_type": str, "cover_letter": str} 을 반환합니다.
        """
        company_type = await self.classify(user_input)
        cover_letter = await self.generate(user_input, company_type)
        return {
            "company_type": company_type,
            "cover_letter": cover_letter,
        }
