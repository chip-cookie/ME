"""
Writing Module Router
"""
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.writing.service import WritingService
from app.shared.file_upload import extract_text_from_upload
from app.modules.writing.schemas import (
    WritingGenerateRequest, WritingGenerateResponse,
    VersionCreateRequest, VersionResponse, WritingSessionResponse
)

router = APIRouter(prefix="/api/writing", tags=["writing"])


@router.get("/history", response_model=List[WritingSessionResponse])
def get_writing_history(limit: int = 50, db: Session = Depends(get_db)):
    """작성 이력을 조회합니다."""
    service = WritingService(db)
    return service.get_recent_sessions(limit)


@router.post("/generate", response_model=WritingGenerateResponse)
async def generate_text(request: WritingGenerateRequest, db: Session = Depends(get_db)):
    service = WritingService(db)
    result = await service.generate_text(
        prompt=request.prompt,
        style_id=request.style_id,
        context=request.context
    )
    return WritingGenerateResponse(**result)


@router.post("/sessions/{session_id}/versions", response_model=VersionResponse)
def add_version(session_id: int, request: VersionCreateRequest, db: Session = Depends(get_db)):
    service = WritingService(db)
    result = service.add_version(
        session_id=session_id,
        content=request.content,
        edit_type=request.edit_type
    )
    return VersionResponse(
        version_id=result["version_id"],
        version_num=result["version_num"],
        content=request.content,
        edit_type=request.edit_type,
        diff=result.get("diff")
    )


@router.get("/sessions/{session_id}", response_model=WritingSessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    service = WritingService(db)
    session = service.get_session_with_versions(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다")
    return session


@router.post("/style/upload")
async def upload_style_file(file: UploadFile = File(...)):
    """스타일 분석을 위한 파일을 업로드하고 텍스트를 추출합니다."""
    return await extract_text_from_upload(file)
