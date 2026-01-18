from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.analysis.service import AnalysisService
from app.modules.analysis.schemas import AnalysisResponse, ChatRequest, ChatResponse

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

@router.post("/upload", response_model=AnalysisResponse)
async def upload_jd(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    JD 파일을 업로드하고 분석 세션을 생성합니다.
    분석 작업은 백그라운드에서 비동기로 실행됩니다.
    """
    service = AnalysisService(db)
    session = await service.create_session(file)
    
    # Trigger AI Analysis & DART Fetch in background
    background_tasks.add_task(service.analyze_jd, session.id)
    
    return session

@router.post("/upload/extract")
async def extract_text_only(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    파일을 업로드하고 즉시 텍스트를 추출하여 반환합니다.
    (세션 생성 없음, 인터뷰 생성용 임시 업로드)
    """
    service = AnalysisService(db)
    
    # 임시 파일로 저장
    import os
    import shutil
    from app.core.config import get_settings
    
    settings = get_settings()
    temp_dir = settings.data_dir / "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    file_path = os.path.join(temp_dir, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    # 추출 실행 (Dual-Path)
    from app.modules.analysis.extraction_service import extract_document
    result = extract_document(file_path)
    
    # 텍스트 반환
    return {"text": result.text, "filename": file.filename}

@router.get("/{session_id}", response_model=AnalysisResponse)
def get_analysis_result(session_id: int, db: Session = Depends(get_db)):
    """
    분석 결과(기업 정보, 인재상 등)를 조회합니다.
    """
    service = AnalysisService(db)
    session = service.db.query(service.db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first.__class__).get(session_id) # Simplify query in service preferred
    # Actually let's use service method or direct db query properly here.
    # Re-instantiating service to use its db session is fine.
    
    session_obj = db.query(service.db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first.__class__).filter_by(id=session_id).first()
    # Correcting the query logic
    from app.modules.analysis.models import AnalysisSession
    session_obj = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_obj

@router.post("/chat", response_model=ChatResponse)
def chat_with_jd(request: ChatRequest, db: Session = Depends(get_db)):
    """
    JD 내용을 바탕으로 질문에 답변합니다.
    """
    service = AnalysisService(db)
    answer = service.chat_with_jd(request.session_id, request.message)
    return ChatResponse(response=answer)
