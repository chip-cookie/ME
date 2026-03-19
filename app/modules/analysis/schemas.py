from pydantic import BaseModel, Field
from langchain_core.pydantic_v1 import BaseModel as LCBaseModel, Field as LCField
from typing import Optional, List, Dict, Any
from datetime import datetime


class JDAnalysisSchema(LCBaseModel):
    """채용공고(JD) 분석 결과 스키마 — LangChain PydanticOutputParser 용"""
    corporate_name: str = LCField(description="기업명")
    job_title: str = LCField(description="채용 직무명")
    required_skills: List[str] = LCField(default_factory=list, description="필수 기술/역량 목록")
    preferred_skills: List[str] = LCField(default_factory=list, description="우대 기술/역량 목록")
    responsibilities: List[str] = LCField(default_factory=list, description="주요 업무 목록")
    qualifications: List[str] = LCField(default_factory=list, description="지원 자격 요건")
    company_culture: Optional[str] = LCField(None, description="기업 문화 및 가치관")
    employment_type: Optional[str] = LCField(None, description="고용 형태 (정규직/계약직 등)")
    location: Optional[str] = LCField(None, description="근무 위치")


class AnalysisSessionCreate(BaseModel):
    pass  # File upload handles creation


class AnalysisResponse(BaseModel):
    id: int
    created_at: datetime
    file_name: str
    analysis_result: Optional[Dict[str, Any]] = None
    financial_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    session_id: int
    message: str


class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None
