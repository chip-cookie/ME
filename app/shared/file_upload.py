"""
JasoS 공통 파일 업로드 핸들러
- 3개 라우터(analysis, writing, interview)에서 동일하게 쓰던 로직을 통합
"""
import shutil
from pathlib import Path
from fastapi import UploadFile

from app.core.config import get_settings

settings = get_settings()

_TEMP_DIR = settings.data_dir / "temp_uploads"


async def save_upload_to_temp(file: UploadFile) -> Path:
    """UploadFile을 임시 디렉토리에 저장하고 경로를 반환합니다."""
    _TEMP_DIR.mkdir(parents=True, exist_ok=True)
    file_path = _TEMP_DIR / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return file_path


async def extract_text_from_upload(file: UploadFile) -> dict:
    """파일을 임시 저장 후 텍스트를 추출하여 반환합니다."""
    from app.shared.extraction_service import extract_document
    file_path = await save_upload_to_temp(file)
    result = extract_document(str(file_path))
    return {"text": result.text, "filename": file.filename}
