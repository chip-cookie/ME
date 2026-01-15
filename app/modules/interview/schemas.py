"""
Interview Module Schemas
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class QuestionGenerateRequest(BaseModel):
    style_name: str = Field(..., description="학습된 스타일 이름")
    job_title: Optional[str] = Field(None, description="지원 직무 (선택)")
    company: Optional[str] = Field(None, description="지원 회사 (선택)")


class InterviewQuestion(BaseModel):
    category: str  # 기본/직무/회사/경험
    question: str
    reasoning: str  # 이 질문을 물어볼 수 있는 이유


class QuestionGenerateResponse(BaseModel):
    style_name: str
    questions: List[InterviewQuestion]
    total: int
