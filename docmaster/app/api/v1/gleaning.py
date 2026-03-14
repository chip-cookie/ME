from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.schema import GleaningSession, Document
from app.services.vllm_client import VLLMClient
from app.services.writer_service import WriterService
from app.services.judge_service import JudgeService
from app.services.parser_service import ParserService
from app.services.analyzer_service import AnalyzerService
from app.services.gleaning_service import GleaningService

router = APIRouter(prefix="/gleaning", tags=["gleaning"])


class GleaningRequest(BaseModel):
    document_id: str
    jd_content: str
    org_type: str = "PUBLIC"
    doc_type: str = "자기소개서"


@router.post("/start", summary="Gleaning 세션 시작")
async def start_gleaning(req: GleaningRequest, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == req.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    vllm = VLLMClient()
    service = GleaningService(
        writer_service=WriterService(vllm),
        judge_service=JudgeService(vllm),
        parser_service=ParserService(),
        analyzer_service=AnalyzerService(),
        db_session=db,
    )

    result = await service.run_gleaning(
        document_id=req.document_id,
        jd_content=req.jd_content,
        org_type=req.org_type,
        doc_type=req.doc_type,
    )
    return result


@router.get("/{session_id}", summary="Gleaning 세션 상태 조회")
def get_gleaning_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(GleaningSession).filter(GleaningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": session.id,
        "document_id": session.document_id,
        "status": session.status.value,
        "initial_score": session.initial_score,
        "final_score": session.final_score,
        "total_iterations": session.total_iterations,
        "created_at": str(session.created_at),
    }
