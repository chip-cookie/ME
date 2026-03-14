from fastapi import APIRouter, UploadFile, File, HTTPException
from app.modules.common.utils.image_processor import ImageProcessor
import shutil
import os
from app.core.config import settings

router = APIRouter()

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    # 임시 파일 경로
    temp_dir = os.path.join(settings.DATA_DIR, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    
    try:
        # 1. 파일 임시 저장
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. PDF 파싱 및 정보 추출 로직 (기존 코드)
        # ... (Docling 또는 다른 파서 호출)
        
        # 3. [신규] 프로필 이미지 추출
        profile_image_url = ImageProcessor.extract_from_pdf(temp_path)
        
        # 이미지가 없으면 기본값 (프론트엔드에서 처리하거나 여기서 기본 URL 제공)
        if not profile_image_url:
            profile_image_url = f"{settings.STATIC_URL}/default_profile.png"
            
        return {
            "status": "success",
            "data": {
                "image": profile_image_url,
                "filename": file.filename
                # ... 기타 파싱 데이터
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # (선택) 임시 파일 삭제
        if os.path.exists(temp_path):
            os.remove(temp_path)
