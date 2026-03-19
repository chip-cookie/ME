import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.config import get_settings
from app.models.schema import Document
from app.models.enums import DocType, OrgType, ResultLabel
from app.services.parser_service import ParserService, SUPPORTED_EXTENSIONS
from app.services.matcher_service import MatcherService

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


class DocumentResponse(BaseModel):
    id: str
    doc_type: str
    org_type: str
    company_name: str | None
    result_label: str | None
    created_at: str

    class Config:
        from_attributes = True


@router.post("/upload", summary="문서 업로드 + 자동 파싱")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: DocType = Form(...),
    org_type: OrgType = Form(...),
    company_name: str = Form(default=""),
    result_label: ResultLabel = Form(default=None),
    db: Session = Depends(get_db),
):
    # 확장자 검증
    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=(
                f"지원하지 않는 파일 형식: '{ext}'. "
                f"지원 형식: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            ),
        )

    # Save file
    upload_dir = settings.uploads_dir
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = str(upload_dir / file.filename)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse
    parser = ParserService()
    parsed = await parser.parse_document(file_path)

    doc_id = str(uuid.uuid4())

    # Store in ChromaDB
    try:
        matcher = MatcherService()
        matcher.store_document(
            doc_id,
            parsed["raw_markdown"],
            {"doc_type": doc_type.value, "org_type": org_type.value, "company": company_name},
        )
        embedding_id = doc_id
    except Exception:
        embedding_id = None

    # Persist to PostgreSQL
    doc = Document(
        id=doc_id,
        doc_type=doc_type,
        org_type=org_type,
        company_name=company_name or None,
        result_label=result_label,
        parsed_markdown=parsed["raw_markdown"],
        structured_json={"sections": parsed["sections"]},
        embedding_id=embedding_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "doc_type": doc.doc_type.value,
        "org_type": doc.org_type.value,
        "company_name": doc.company_name,
        "file_ext": parsed["ext"],
        "sections_count": len(parsed["sections"]),
        "char_count": parsed["char_count"],
    }


@router.post("/analyze", summary="JD 대비 의미 매칭")
async def analyze_document(
    document_id: str,
    jd_text: str,
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    matcher = MatcherService()
    similarity = matcher.calculate_similarity(jd_text, doc.parsed_markdown or "")

    return {"document_id": document_id, "similarity_score": round(similarity, 4)}


@router.get("/{document_id}", summary="문서 조회")
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "doc_type": doc.doc_type.value,
        "org_type": doc.org_type.value,
        "company_name": doc.company_name,
        "result_label": doc.result_label.value if doc.result_label else None,
        "parsed_markdown": doc.parsed_markdown,
        "created_at": str(doc.created_at),
    }
