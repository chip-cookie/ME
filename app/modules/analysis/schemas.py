from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AnalysisSessionCreate(BaseModel):
    pass # File upload handles creation

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
