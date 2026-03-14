import os

class Settings:
    # 프로젝트 루트 기준 데이터 저장 경로
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_DIR = os.path.join(BASE_DIR, "data")
    
    # 업로드 경로 설정
    UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
    PROFILE_DIR = os.path.join(UPLOAD_DIR, "profiles")
    
    # URL 접두사 (프론트엔드에서 접근할 경로)
    STATIC_URL = "/static"

settings = Settings()

# 폴더가 없으면 미리 생성
os.makedirs(settings.PROFILE_DIR, exist_ok=True)
