from fastapi import APIRouter
from pydantic import BaseModel

from app.services.vllm_client import VLLMClient
from app.services.writer_service import WriterService

router = APIRouter(prefix="/generate", tags=["generate"])


class GenerateRequest(BaseModel):
    jd_content: str
    user_profile: str
    org_type: str = "PUBLIC"
    doc_type: str = "자기소개서"
    requirement_analysis: str = ""
    char_limits: str = "성장과정 800자, 지원동기 800자, 입사후포부 1000자"


@router.post("", summary="자기소개서 생성")
async def generate_document(req: GenerateRequest):
    vllm = VLLMClient()
    writer = WriterService(vllm)
    text = await writer.generate(
        jd_content=req.jd_content,
        user_profile=req.user_profile,
        org_type=req.org_type,
        doc_type=req.doc_type,
        requirement_analysis=req.requirement_analysis,
        char_limits=req.char_limits,
    )
    return {"generated_text": text}
