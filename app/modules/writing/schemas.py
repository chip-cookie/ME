"""
Writing Module Schemas
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class EditType(str, Enum):
    ai_generated = "ai_generated"
    user_revision = "user_revision"
    ai_suggestion = "ai_suggestion"


class WritingGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    style_id: Optional[int] = None
    context: Optional[dict] = None


class WritingGenerateResponse(BaseModel):
    session_id: int
    generated_text: str
    style_applied: Optional[str] = None
    version: int = 1


class VersionCreateRequest(BaseModel):
    content: str
    edit_type: EditType = EditType.user_revision


class VersionResponse(BaseModel):
    version_id: int
    version_num: int
    content: str
    edit_type: EditType
    created_at: Optional[datetime]
    diff: Optional[dict] = None
    
    class Config:
        from_attributes = True


class WritingSessionResponse(BaseModel):
    id: int
    style_id: Optional[int]
    context_type: Optional[str]
    initial_prompt: str
    final_output: Optional[str]
    revision_count: int
    started_at: datetime
    completed_at: Optional[datetime]
    versions: List[VersionResponse] = []
    
    class Config:
        from_attributes = True
