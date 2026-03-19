"""
JasoS 공통 파일 업로드 핸들러
- 3개 라우터(analysis, writing, interview)에서 동일하게 쓰던 로직을 통합
- 경로 탐색 공격 방지, 파일 크기 제한, 임시파일 cleanup 보장
"""
import uuid
import os
import re
from pathlib import Path
from fastapi import UploadFile, HTTPException

from app.core.config import get_settings

settings = get_settings()

_TEMP_DIR = settings.data_dir / "temp_uploads"

# 허용 확장자 (소문자)
_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".hwp", ".hwpx", ".txt"}


def _safe_filename(original: str) -> str:
    """
    원본 파일명에서 안전한 저장용 파일명을 생성합니다.
    - 경로 탐색 문자(../, \\) 제거
    - UUID 접두사로 충돌 방지
    - 확장자 보존
    """
    # 경로 구분자 제거 후 basename만 추출
    basename = Path(original).name
    # 위험 문자 제거 (알파벳, 숫자, 한글, 점, 하이픈, 언더스코어만 허용)
    safe_stem = re.sub(r'[^\w\uAC00-\uD7A3\u3131-\u314E\u314F-\u3163.-]', '_', Path(basename).stem)
    ext = Path(basename).suffix.lower()
    return f"{uuid.uuid4().hex}_{safe_stem}{ext}"


def _validate_upload(file: UploadFile, max_bytes: int | None = None) -> str:
    """
    파일 확장자 및 크기를 검증하고 안전한 저장 파일명을 반환합니다.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="파일명이 없습니다.")

    ext = Path(file.filename).suffix.lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 허용 형식: {', '.join(sorted(_ALLOWED_EXTENSIONS))}"
        )

    limit = max_bytes or settings.max_upload_size_bytes
    # Content-Length 헤더 기반 사전 검사 (없을 수도 있음)
    if file.size and file.size > limit:
        raise HTTPException(
            status_code=413,
            detail=f"파일 크기가 제한({settings.max_upload_size_mb}MB)을 초과합니다."
        )

    return _safe_filename(file.filename)


async def save_upload_to_temp(file: UploadFile) -> Path:
    """UploadFile을 임시 디렉토리에 저장하고 경로를 반환합니다."""
    safe_name = _validate_upload(file)
    _TEMP_DIR.mkdir(parents=True, exist_ok=True)

    file_path = _TEMP_DIR / safe_name

    # 파일 크기 제한 검사 (스트리밍 방식으로 읽으며 체크)
    max_bytes = settings.max_upload_size_bytes
    total = 0
    try:
        with open(file_path, "wb") as f:
            while chunk := await file.read(1024 * 64):  # 64KB 청크
                total += len(chunk)
                if total > max_bytes:
                    f.close()
                    file_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=413,
                        detail=f"파일 크기가 제한({settings.max_upload_size_mb}MB)을 초과합니다."
                    )
                f.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"파일 저장 중 오류가 발생했습니다: {str(e)}")

    return file_path


async def extract_text_from_upload(file: UploadFile) -> dict:
    """파일을 임시 저장 후 텍스트를 추출하여 반환합니다. 임시파일은 항상 정리됩니다."""
    from app.shared.extraction_service import extract_document
    file_path = await save_upload_to_temp(file)
    try:
        result = extract_document(str(file_path))
        return {"text": result.text, "filename": Path(file.filename or "unknown").name}
    finally:
        file_path.unlink(missing_ok=True)
