"""
Style Module Schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class StyleProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    tone_patterns: dict = Field(default_factory=dict)
    structure_rules: dict = Field(default_factory=dict)
    expression_dict: dict = Field(default_factory=dict)


class StyleProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tone_patterns: Optional[dict] = None
    structure_rules: Optional[dict] = None
    expression_dict: Optional[dict] = None


class StyleProfileResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    tone_patterns: dict
    structure_rules: dict
    expression_dict: dict
    confidence_score: float
    sample_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ExplicitRuleCreate(BaseModel):
    rule_type: str
    description: str
    example_text: Optional[str] = None
    priority: int = 0
    detected_from: str = "manual"


class ExplicitRuleResponse(BaseModel):
    id: int
    style_id: int
    rule_type: str
    description: str
    example_text: Optional[str]
    is_active: bool
    priority: int
    detected_from: str
    created_at: datetime
    
    class Config:
        from_attributes = True
