import fitz  # PyMuPDF
from PIL import Image
import io
import os
import uuid
import logging
from typing import Optional
from app.core.config import settings

# 로거 설정
logger = logging.getLogger(__name__)

class ImageProcessor:
    @staticmethod
    def process_and_save(image_bytes: bytes, filename_prefix: str = "profile") -> str:
        """
        이미지 바이트 -> 리사이징(300x300 Center Crop) -> 저장 -> URL 반환
        """
        try:
            # 1. 바이트 -> 이미지 객체
            image = Image.open(io.BytesIO(image_bytes))
            
            # 2. 모드 변환 (PNG 투명값 호환)
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')

            # 3. 스마트 리사이징 (Center Crop 로직)
            target_size = (300, 300)
            width, height = image.size
            aspect_ratio = width / height
            target_ratio = target_size[0] / target_size[1]
            
            if aspect_ratio > target_ratio:
                new_height = target_size[1]
                new_width = int(new_height * aspect_ratio)
            else:
                new_width = target_size[0]
                new_height = int(new_width / target_ratio)
                
            img_resized = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # 중앙 크롭 좌표 계산
            left = (new_width - target_size[0]) / 2
            top = (new_height - target_size[1]) / 2
            right = (new_width + target_size[0]) / 2
            bottom = (new_height + target_size[1]) / 2
            
            img_final = img_resized.crop((left, top, right, bottom))

            # 4. 파일 저장
            unique_filename = f"{filename_prefix}_{uuid.uuid4().hex[:8]}.jpg"
            save_path = os.path.join(settings.PROFILE_DIR, unique_filename)
            
            img_final.save(save_path, "JPEG", quality=85)
            logger.info(f"프로필 이미지 저장 완료: {save_path}")
            
            # 5. URL 반환 (예: /static/uploads/profiles/xxxx.jpg)
            # 주의: main.py에서 '/static'을 'data' 폴더에 마운트해야 함
            return f"{settings.STATIC_URL}/uploads/profiles/{unique_filename}"
            
        except Exception as e:
            logger.error(f"이미지 처리 실패: {e}")
            return f"{settings.STATIC_URL}/default_profile.png"

    @staticmethod
    def extract_from_pdf(pdf_path: str) -> Optional[str]:
        """PDF 첫 페이지에서 가장 큰 이미지 추출"""
        try:
            doc = fitz.open(pdf_path)
            if len(doc) < 1:
                return None
                
            page = doc[0]
            images = page.get_images()
            
            if not images:
                return None
                
            # 가장 큰 이미지 찾기
            best_xref = 0
            max_area = 0
            
            for img in images:
                xref = img[0]
                width = img[1]
                height = img[2]
                area = width * height
                
                # 너무 작은 아이콘(50x50) 제외
                if width < 50 or height < 50:
                    continue
                    
                if area > max_area:
                    max_area = area
                    best_xref = xref
                    
            if best_xref == 0:
                return None
                
            # 이미지 바이트 추출
            extracted_image = doc.extract_image(best_xref)
            image_bytes = extracted_image["image"]
            
            return ImageProcessor.process_and_save(image_bytes, "pdf_extracted")
            
        except Exception as e:
            logger.error(f"PDF 이미지 추출 실패: {e}")
            return None
