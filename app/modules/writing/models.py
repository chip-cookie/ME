"""
Writing Module Models
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class WritingSession(Base):
    __tablename__ = "writing_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    style_id = Column(Integer, ForeignKey("style_profiles.id"), nullable=True)
    
    context_type = Column(String(50), nullable=True)
    initial_prompt = Column(Text, nullable=False)
    final_output = Column(Text, nullable=True)
    
    revision_count = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    style = relationship("StyleProfile", back_populates="writing_sessions")
    versions = relationship("VersionHistory", back_populates="session")


class VersionHistory(Base):
    __tablename__ = "version_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("writing_sessions.id"), nullable=False)
    
    version_num = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    diff_from_prev = Column(Text, nullable=True)
    edit_type = Column(String(50), default="user_revision")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("WritingSession", back_populates="versions")
    changes = relationship("ChangeLog", back_populates="version")


class ChangeLog(Base):
    __tablename__ = "change_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("version_histories.id"), nullable=False)
    
    change_type = Column(String(50), nullable=False)
    original_text = Column(Text, nullable=True)
    changed_text = Column(Text, nullable=True)
    reason_category = Column(String(50), nullable=True)
    
    version = relationship("VersionHistory", back_populates="changes")
