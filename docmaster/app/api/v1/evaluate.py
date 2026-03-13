from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.schema import Document, EvaluationResult
from app.services.vllm_client import VLLMClient
from app.services.judge_service import JudgeService

router = APIRouter(prefix="/evaluate", tags=["evaluate"])


class EvaluateRequest(BaseModel):
    document_id: str
    jd_content: str
    org_type: str = "PUBLIC"
    doc_type: str = "자기소개서"


@router.post("", summary="Judge 평가 (5개 척도)")
async def evaluate(req: EvaluateRequest, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == req.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    vllm = VLLMClient()
    judge = JudgeService(vllm)
    result = await judge.evaluate(
        document_content=doc.parsed_markdown or "",
        jd_content=req.jd_content,
        org_type=req.org_type,
        doc_type=req.doc_type,
    )

    # Persist
    eval_record = EvaluationResult(
        document_id=doc.id,
        iteration_num=1,
        dimension_scores=result.get("scores"),
        total_score=result.get("total_score", 0.0),
        pass_fail=result.get("pass_fail", False),
        feedback_json=result,
    )
    db.add(eval_record)
    db.commit()

    return result
