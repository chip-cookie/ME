"""
JasoS - AI 면접 관리 플랫폼
FastAPI 메인 애플리케이션
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path

from app.core.config import get_settings
from app.core.database import init_db

# 기능별 라우터 임포트
from app.modules.learning.router import router as learning_router
from app.modules.style.router import router as styles_router
from app.modules.writing.router import router as writing_router
from app.modules.interview.router import router as interview_router
from app.modules.analysis.router import router as analysis_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 수명주기 관리"""
    from app.common.file_watcher import get_watcher_service
    
    # 시작 시: DB 초기화 및 파일 감시 시작
    print("🚀 JasoS 서버 시작...")
    init_db()
    print("✅ 데이터베이스 초기화 완료")
    
    watcher = get_watcher_service()
    watcher.start()
    print("👀 파일 감시 활성화됨")
    
    yield
    
    # 종료 시
    watcher.stop()
    print("👋 JasoS 서버 종료")


# FastAPI 앱 생성
app = FastAPI(
    title=settings.app_name,
    description="AI 에이전트를 활용한 지능형 면접 관리 및 합격 전략 자동화 플랫폼",
    version="0.2.0-modular",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(learning_router)
app.include_router(styles_router)
app.include_router(writing_router)
app.include_router(interview_router)
app.include_router(analysis_router)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    file_path = Path("app/static/favicon.png")
    if file_path.exists():
        return FileResponse(file_path)
    return FileResponse("favicon.png") # Fallback if in root


@app.get("/")
def root():
    """헬스 체크"""
    return {
        "name": settings.app_name,
        "status": "running",
        "version": "0.2.0-modular",
        "architecture": "modular-monolith"
    }


@app.get("/health")
def health_check():
    """상세 헬스 체크"""
    return {
        "status": "healthy",
        "database": "connected (sqlite)",
        "environment": settings.app_env
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
