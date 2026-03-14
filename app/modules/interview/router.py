"""
Interview Module Router
"""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.interview.service import InterviewService
from app.shared.file_upload import extract_text_from_upload
from app.modules.interview.schemas import QuestionGenerateRequest, QuestionGenerateResponse

router = APIRouter(prefix="/api/interview", tags=["interview"])


@router.post("/questions")
async def generate_questions(
    request: QuestionGenerateRequest,
    db: Session = Depends(get_db)
):
    """학습된 스타일 기반 예상 면접 질문 생성"""
    service = InterviewService(db)
    return await service.generate_questions(
        style_name=request.style_name,
        job_title=request.job_title,
        company=request.company
    )


@router.post("/style/upload")
async def upload_style_file(file: UploadFile = File(...)):
    """면접 스타일 분석을 위한 파일을 업로드하고 텍스트를 추출합니다."""
    return await extract_text_from_upload(file)
