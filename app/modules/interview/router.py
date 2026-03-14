"""
Interview Module Router
"""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.interview.service import InterviewService
from app.modules.interview.schemas import (
    QuestionGenerateRequest,
    QuestionGenerateResponse
)

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
async def upload_style_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    면접 스타일 분석을 위한 파일을 업로드하고 텍스트를 추출합니다.
    """
    # 임시 파일로 저장
    import os
    import shutil
    from app.core.config import get_settings
    
    settings = get_settings()
    temp_dir = settings.data_dir / "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    file_path = os.path.join(temp_dir, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    # 추출 실행 (Dual-Path)
    from app.modules.analysis.extraction_service import extract_document
    result = extract_document(file_path)
    
    # 텍스트 반환
    return {"text": result.text, "filename": file.filename}
