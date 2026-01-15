"""
JasoS 설정 관리
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "JasoS"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "dev-secret-key"
    
    # 경로
    base_dir: Path = Path(__file__).parent.parent.parent
    data_dir: Path = base_dir / "data"
    db_dir: Path = data_dir / "db"
    learning_dir: Path = data_dir / "learning"
    successful_examples_dir: Path = learning_dir / "successful_examples"
    
    # DB
    database_url: str = "sqlite:///./data/db/jasos.db"
    
    # AI
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    
    # Server
    host: str = "127.0.0.1"
    port: int = 8000
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
