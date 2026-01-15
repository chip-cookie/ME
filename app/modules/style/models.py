"""
Style Module Models
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class StyleProfile(Base):
    __tablename__ = "style_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    tone_patterns = Column(JSON, default=dict)
    structure_rules = Column(JSON, default=dict)
    expression_dict = Column(JSON, default=dict)
    
    # Contrastive Learning Data
    good_examples = Column(JSON, default=list) # List[str]
    bad_examples = Column(JSON, default=list)  # List[str]
    
    confidence_score = Column(Float, default=0.0)
    sample_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    explicit_rules = relationship("ExplicitRule", back_populates="style")
    writing_sessions = relationship("WritingSession", back_populates="style")


class ExplicitRule(Base):
    __tablename__ = "explicit_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    style_id = Column(Integer, ForeignKey("style_profiles.id"), nullable=False)
    
    rule_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    example_text = Column(Text, nullable=True)
    
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    detected_from = Column(String(50), default="manual")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    style = relationship("StyleProfile", back_populates="explicit_rules")
