import fitz  # PyMuPDF
from PIL import Image
import io
import os
import uuid
from typing import Optional

# 이미지 저장 경로 (Frontend Public 폴더로 설정하여 직접 접근 가능하게 함)
# Docker 컨테이너 내부 경로 기준: /app/frontend/public/images/profiles
UPLOAD_DIR = "/app/frontend/public/images/profiles"

class ImageProcessor:
    @staticmethod
    def process_and_save(image_bytes: bytes, filename_prefix: str = "profile") -> str:
        """
        이미지 바이트를 받아서 -> 리사이징(300x300) -> UUID 파일명 저장 -> URL 반환
        """
        try:
            # 폴더가 없으면 생성
            os.makedirs(UPLOAD_DIR, exist_ok=True)

            # 1. 바이트를 이미지 객체로 변환
            image = Image.open(io.BytesIO(image_bytes))
            
            # 2. 이미지 모드 변환 (RGBA -> RGB) : PNG 투명 배경 호환
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')

            # 3. 스마트 리사이징 (Center Crop)
            # 이미지를 찌그러뜨리지 않고 정사각형(300x300) 중앙을 잘라냄
            target_size = (300, 300)
            
            # 비율 계산
            width, height = image.size
            aspect_ratio = width / height
            target_ratio = target_size[0] / target_size[1]
            
            if aspect_ratio > target_ratio:
                # 이미지가 더 넓음 -> 높이에 맞춤
                new_height = target_size[1]
                new_width = int(new_height * aspect_ratio)
            else:
                # 이미지가 더 김 -> 너비에 맞춤
                new_width = target_size[0]
                new_height = int(new_width / target_ratio)
                
            img_resized = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # 중앙 크롭
            left = (new_width - target_size[0]) / 2
            top = (new_height - target_size[1]) / 2
            right = (new_width + target_size[0]) / 2
            bottom = (new_height + target_size[1]) / 2
            
            img_final = img_resized.crop((left, top, right, bottom))

            # 4. 고유 파일명 생성 (UUID 사용)
            unique_filename = f"{filename_prefix}_{uuid.uuid4().hex[:8]}.jpg"
            save_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            # 5. 저장 (JPEG 압축)
            img_final.save(save_path, "JPEG", quality=85)
            
            # 6. 접근 가능한 URL 경로 반환 (Frontend에서 사용할 경로)
            return f"/images/profiles/{unique_filename}"
            
        except Exception as e:
            print(f"⚠️ [ImageProcessor] 이미지 처리 중 에러 발생: {e}")
            return "/static/default_profile.png" # 실패 시 기본 이미지 (또는 frontend 기본값)

    @staticmethod
    def extract_from_pdf(pdf_path: str) -> Optional[str]:
        """PDF 첫 페이지에서 가장 큰 이미지를 찾아 추출 및 저장"""
        try:
            doc = fitz.open(pdf_path)
            if len(doc) < 1:
                return None
                
            page = doc[0]
            images = page.get_images()
            
            if not images:
                print("⚠️ [ImageProcessor] PDF 첫 페이지에서 이미지를 찾을 수 없습니다.")
                return None
                
            # 가장 큰 이미지 찾기 (너비*높이)
            best_xref = 0
            max_area = 0
            
            for img in images:
                xref = img[0]
                width = img[1]
                height = img[2]
                area = width * height
                
                # 너무 작은 아이콘/로고(50x50 이하)는 제외
                if width < 50 or height < 50:
                    continue
                    
                if area > max_area:
                    max_area = area
                    best_xref = xref
                    
            if best_xref == 0:
                print("⚠️ [ImageProcessor] 적절한 크기의 이미지가 없습니다.")
                return None
                
            # 이미지 추출
            extracted_image = doc.extract_image(best_xref)
            image_bytes = extracted_image["image"]
            
            print(f"📸 [ImageProcessor] 이미지 추출 성공 (xref={best_xref})")
            
            # 위에서 만든 처리 함수로 넘김 (리사이징 & 저장)
            return ImageProcessor.process_and_save(image_bytes, "pdf_extracted")
            
        except Exception as e:
            print(f"⚠️ [ImageProcessor] PDF 이미지 추출 실패: {e}")
            return None
