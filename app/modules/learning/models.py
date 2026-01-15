"""
Learning Module Models
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class LearningLog(Base):
    __tablename__ = "learning_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    learned_at = Column(DateTime, default=datetime.utcnow)
    samples_count = Column(Integer, default=0)
    metrics = Column(JSON, default=dict)
    model_checkpoint = Column(String(255), nullable=True)
    
    style_updates = relationship("StyleUpdate", back_populates="log")


class StyleUpdate(Base):
    __tablename__ = "style_updates"
    
    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("learning_logs.id"), nullable=False)
    style_id = Column(Integer, ForeignKey("style_profiles.id"), nullable=False)
    before_params = Column(JSON, default=dict)
    after_params = Column(JSON, default=dict)
    improvement_score = Column(Float, default=0.0)
    
    log = relationship("LearningLog", back_populates="style_updates")


class SuccessfulExample(Base):
    __tablename__ = "successful_examples"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    analysis = Column(JSON, default=dict)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

