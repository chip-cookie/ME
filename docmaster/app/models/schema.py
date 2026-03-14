import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Float, Integer, Boolean,
    DateTime, ForeignKey, Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, declarative_base

from app.models.enums import DocType, OrgType, ResultLabel, GleaningStatus, DatasetType

Base = declarative_base()


def _uuid():
    return str(uuid.uuid4())


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    doc_type = Column(SAEnum(DocType), nullable=False)
    org_type = Column(SAEnum(OrgType), nullable=False)
    company_name = Column(String(200))
    result_label = Column(SAEnum(ResultLabel))
    parsed_markdown = Column(Text)
    structured_json = Column(JSONB)
    embedding_id = Column(String(200))          # ChromaDB document ID
    created_at = Column(DateTime, default=datetime.utcnow)

    evaluation_results = relationship("EvaluationResult", back_populates="document")
    gleaning_sessions = relationship("GleaningSession", back_populates="document")
    training_datasets = relationship("TrainingDataset", back_populates="source_doc")


class EvaluationRubric(Base):
    __tablename__ = "evaluation_rubrics"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    rubric_name = Column(String(100), unique=True, nullable=False)
    org_type = Column(SAEnum(OrgType))
    dimension = Column(String(100))
    score_1_desc = Column(Text)
    score_2_desc = Column(Text)
    score_3_desc = Column(Text)
    score_4_desc = Column(Text)
    score_5_desc = Column(Text)
    weight = Column(Float, default=1.0)

    evaluation_results = relationship("EvaluationResult", back_populates="rubric")


class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    document_id = Column(UUID(as_uuid=False), ForeignKey("documents.id"))
    rubric_id = Column(UUID(as_uuid=False), ForeignKey("evaluation_rubrics.id"), nullable=True)
    gleaning_session_id = Column(UUID(as_uuid=False), ForeignKey("gleaning_sessions.id"), nullable=True)
    iteration_num = Column(Integer, default=1)
    dimension_scores = Column(JSONB)            # {"requirement_fulfillment": {"score": 4, "reason": "..."}, ...}
    total_score = Column(Float)
    pass_fail = Column(Boolean)
    feedback_json = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="evaluation_results")
    rubric = relationship("EvaluationRubric", back_populates="evaluation_results")
    gleaning_session = relationship("GleaningSession", back_populates="evaluation_results")


class GleaningSession(Base):
    __tablename__ = "gleaning_sessions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    document_id = Column(UUID(as_uuid=False), ForeignKey("documents.id"))
    initial_score = Column(Float)
    final_score = Column(Float)
    total_iterations = Column(Integer, default=0)
    status = Column(SAEnum(GleaningStatus), default=GleaningStatus.RUNNING)
    rewrite_log = Column(JSONB)                 # {initial_text, iterations[], fallback_used, system_logs[]}
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="gleaning_sessions")
    evaluation_results = relationship("EvaluationResult", back_populates="gleaning_session")


class TrainingDataset(Base):
    __tablename__ = "training_datasets"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    dataset_type = Column(SAEnum(DatasetType), nullable=False)
    source_doc_id = Column(UUID(as_uuid=False), ForeignKey("documents.id"), nullable=True)
    prompt = Column(Text)
    chosen = Column(Text)
    rejected = Column(Text, nullable=True)      # NULL for SFT
    reward_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    source_doc = relationship("Document", back_populates="training_datasets")


class DocStylePattern(Base):
    __tablename__ = "doc_style_patterns"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    org_type = Column(SAEnum(OrgType), nullable=False)
    section_structure = Column(JSONB)
    writing_rules = Column(JSONB)
    keyword_patterns = Column(JSONB)
    tone_profile = Column(JSONB)
    pass_rate = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
