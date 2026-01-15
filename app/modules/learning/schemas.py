"""
Learning Module Schemas
"""
from typing import Optional
from pydantic import BaseModel, Field


class ImageLearningRequest(BaseModel):
    style_name: str = Field(..., min_length=1, max_length=100)
    meta_tags: Optional[dict] = None


class ImageLearningResponse(BaseModel):
    style_id: Optional[int]
    extracted_features: dict
    status: str
    message: str
