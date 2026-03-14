"""
Learning Module Router
"""
import json
from pathlib import Path
from typing import List, Optional

import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.modules.learning.service import LearningService
from app.modules.learning.schemas import ImageLearningResponse, AutoIngestRequest
from app.modules.style.models import StyleProfile

router = APIRouter(prefix="/api/learning", tags=["learning"])
settings = get_settings()


@router.get("/styles")
def get_styles(db: Session = Depends(get_db)):
    """학습된 스타일 목록을 조회합니다."""
    return db.query(StyleProfile).all()


@router.post("/upload")
async def upload_learning_files(
    files: List[UploadFile] = File(...),
    style_name: str = Form(...),
    category: str = Form("good"),
    db: Session = Depends(get_db)
):
    """파일을 업로드하고 학습을 시작합니다."""
    if not files:
        raise HTTPException(status_code=400, detail="파일이 없습니다")

    save_dir = Path(settings.learning_dir) / "import" / style_name / category
    save_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    for file in files:
        file_path = save_dir / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(str(file_path))

    service = LearningService(db)
    result = await service.ingest_from_local()

    return {
        "status": "success",
        "message": f"{len(saved_files)}개 파일 업로드 및 학습 완료",
        "result": result
    }


@router.post("/images", response_model=ImageLearningResponse)
async def learn_from_images(
    images: List[UploadFile] = File(...),
    style_name: str = Form(...),
    meta_tags: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not images:
        raise HTTPException(status_code=400, detail="이미지가 필요합니다")

    image_bytes = [await img.read() for img in images]

    meta = None
    if meta_tags:
        try:
            meta = json.loads(meta_tags)
        except Exception:
            pass

    service = LearningService(db)
    result = await service.learn_from_images(image_bytes, style_name, meta)

    if result["status"] == "failed":
        raise HTTPException(status_code=400, detail=result["message"])

    return ImageLearningResponse(**result)


@router.post("/ingest")
async def ingest_local_files(db: Session = Depends(get_db)):
    """로컬 'data/learning/import' 폴더의 파일들을 일괄 학습합니다."""
    service = LearningService(db)
    return await service.ingest_from_local()


@router.post("/auto-ingest")
async def auto_ingest_files(request: AutoIngestRequest, db: Session = Depends(get_db)):
    """AI가 자동으로 Good/Bad 분류 후 학습합니다."""
    service = LearningService(db)
    return await service.auto_ingest_and_classify(request.style_name, request.criteria)


@router.post("/ingest/successful")
async def ingest_successful_examples(db: Session = Depends(get_db)):
    """성공적인 자소서 예시를 분석하여 DB에 저장합니다."""
    service = LearningService(db)
    return await service.ingest_successful_examples()
