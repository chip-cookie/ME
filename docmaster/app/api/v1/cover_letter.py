"""
자소서 생성 API 라우터
POST /api/v1/cover-letter  →  기업 분류 + 자소서 생성
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.vllm_client import VLLMClient
from app.services.cover_letter_service import CoverLetterService

router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])


class CoverLetterRequest(BaseModel):
    user_input: str = Field(
        ...,
        description="자소서 작성 요청 (예: '한국전력공사 인턴 지원, 팀 갈등 해결 경험 작성해줘')",
        min_length=10,
    )


class CoverLetterResponse(BaseModel):
    company_type: str = Field(description="판별된 기업 유형: 공기업 | 사기업 | 범용")
    cover_letter: str = Field(description="생성된 자소서 본문")


@router.post(
    "",
    response_model=CoverLetterResponse,
    summary="AI 자소서 생성",
    description=(
        "사용자의 요청을 분석하여 기업 유형(공기업/사기업/범용)을 자동 분류하고, "
        "전용 규칙이 적용된 자소서를 vLLM으로 생성합니다."
    ),
)
async def generate_cover_letter(req: CoverLetterRequest):
    vllm = VLLMClient()
    service = CoverLetterService(vllm)
    result = await service.run(req.user_input)
    return CoverLetterResponse(**result)
