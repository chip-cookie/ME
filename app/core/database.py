"""
JasoS 데이터베이스 연결
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path
from typing import Generator

from app.core.config import get_settings

settings = get_settings()

# 데이터 디렉토리 생성
Path(settings.db_dir).mkdir(parents=True, exist_ok=True)

# Handle MySQL connection string for pymysql
db_url = settings.database_url
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif db_url.startswith("mysql://"):
    db_url = db_url.replace("mysql://", "mysql+pymysql://")

engine = create_engine(
    db_url,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # 모델 임포트 (테이블 생성을 위해 필요)
    # 리팩토링된 모듈 경로로 수정
    from app.modules.style.models import StyleProfile, ExplicitRule
    from app.modules.writing.models import WritingSession, VersionHistory, ChangeLog
    from app.modules.learning.models import LearningLog, StyleUpdate
    
    Base.metadata.create_all(bind=engine)
