from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from datetime import datetime
from app.core.database import Base

class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Uploaded File Info
    file_name = Column(String(255))
    file_type = Column(String(50)) # pdf, docx, image, url
    file_path = Column(String(512), nullable=True) # Path if saved locally
    
    # Extracted Text (Raw)
    raw_text = Column(Text, nullable=True)
    
    # Analyzed Data (JSON)
    # Expected keys: corp_name, job_title, job_summary, talent_keywords, etc.
    analysis_result = Column(JSON, nullable=True)
    
    # Financial Data from DART (JSON)
    financial_data = Column(JSON, nullable=True)
    
    # Conversation History for Chat (JSON List)
    chat_history = Column(JSON, default=list)
