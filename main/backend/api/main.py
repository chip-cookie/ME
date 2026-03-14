from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import chromadb
from sentence_transformers import SentenceTransformer
from openai import OpenAI
import os
from typing import List, Optional

# ==========================================
# FastAPI 서버 설정
# ==========================================
app = FastAPI(title="Resume Intelligence API", description="포트폴리오용 검색 및 채팅 API")

# 1. 환경 변수 설정
CHROMA_HOST = os.getenv("CHROMA_HOST", "vector-db")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
VLLM_API_URL = os.getenv("VLLM_API_URL", "http://inference-server:8000/v1")
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-m3")

# 2. 클라이언트 초기화 (시작 시 한 번만 로드)
try:
    print("💾 ChromaDB 연결 중...")
    chroma_client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    collection = chroma_client.get_or_create_collection(name="esg_os_index")
    
    print("🧲 임베딩 모델 로드 중 (BAAI/bge-m3)...")
    encoder = SentenceTransformer(EMBED_MODEL)
    
    print("🧠 vLLM 클라이언트 연결 중...")
    llm_client = OpenAI(base_url=VLLM_API_URL, api_key="EMPTY")
    
except Exception as e:
    print(f"❌ 초기화 실패: {e}")

# ==========================================
# API 요청/응답 모델
# ==========================================
class SearchRequest(BaseModel):
    query: str
    top_k: int = 3

class ChatRequest(BaseModel):
    message: str

# ==========================================
# Endpoints
# ==========================================
@app.get("/")
def health_check():
    return {"status": "online", "message": "이력서 지능형 서버가 실행 중입니다."}

@app.post("/search")
def search_resume(req: SearchRequest):
    """
    이력서 내용에서 의미 기반 검색 (Semantic Search)
    """
    try:
        # 1. 쿼리 벡터화
        query_vector = encoder.encode(req.query).tolist()
        
        # 2. ChromaDB 검색
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=req.top_k
        )
        
        # 3. 결과 정리
        documents = results['documents'][0]
        metadatas = results['metadatas'][0]
        
        response = []
        for doc, meta in zip(documents, metadatas):
            response.append({"content": doc, "meta": meta})
            
        return {"results": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat_with_resume(req: ChatRequest):
    """
    RAG (Retrieval-Augmented Generation) 기반 채팅
    이력서 내용을 참고하여 답변합니다.
    """
    try:
        # 1. 관련 내용 검색 (Context Retrieval)
        query_vector = encoder.encode(req.message).tolist()
        search_res = collection.query(query_embeddings=[query_vector], n_results=3)
        context_list = search_res['documents'][0]
        context_text = "\n\n".join(context_list)
        
        # 2. 프롬프트 구성
        system_prompt = """
        당신은 이력서 데이터를 기반으로 대답하는 AI 채용 담당관입니다.
        아래 [참고 자료]를 바탕으로 질문에 친절하고 전문적으로 답변하세요.
        자료에 없는 내용은 솔직하게 "이력서에 해당 내용이 없습니다"라고 말하세요.
        """
        
        user_prompt = f"""
        [질문]: {req.message}
        
        [참고 자료]:
        {context_text}
        
        [답변]:
        """
        
        # 3. LLM 생성 (Gemma)
        response = llm_client.chat.completions.create(
            model="google/gemma-2-2b-it",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        return {"reply": response.choices[0].message.content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# [NEW] Endpoint: /update (실시간 콘텐츠 수정)
# ==========================================
import json
from pathlib import Path

# 포트폴리오 JSON 경로 설정 (Docker 볼륨 마운트 경로 기준)
PORTFOLIO_PATH = Path("/app/data/portfolio.json")

class UpdateRequest(BaseModel):
    command: str  # 자연어 명령 (예: "내 이메일을 abc@test.com으로 바꿔줘")

@app.post("/update")
def update_portfolio(req: UpdateRequest):
    """
    자연어 명령으로 포트폴리오 내용을 수정합니다.
    예: "내 이름을 '김철수'로 바꿔줘"
    """
    try:
        # 1. 현재 포트폴리오 데이터 로드
        if not PORTFOLIO_PATH.exists():
            raise HTTPException(status_code=404, detail="portfolio.json 파일을 찾을 수 없습니다.")
        
        with open(PORTFOLIO_PATH, 'r', encoding='utf-8') as f:
            portfolio_data = json.load(f)
        
        # 2. LLM에게 수정 명령 해석 요청
        interpreter_prompt = f"""
        당신은 JSON 편집 도우미입니다. 사용자의 자연어 명령을 분석하여 JSON 수정 명령을 생성하세요.
        
        [현재 포트폴리오 데이터 (축약)]
        - profile.name: {portfolio_data['profile']['name']}
        - profile.title: {portfolio_data['profile']['title']}
        - profile.email: {portfolio_data['profile']['email']}
        - profile.phone: {portfolio_data['profile']['phone']}
        - profile.website: {portfolio_data['profile']['website']}
        - projects 개수: {len(portfolio_data.get('projects', []))}
        - skills 카테고리 개수: {len(portfolio_data.get('skills', []))}
        - awards 개수: {len(portfolio_data.get('awards', []))}
        
        [사용자 명령]: {req.command}
        
        [지시사항]
        1. 사용자의 명령을 분석하여 어떤 필드를 어떤 값으로 변경해야 하는지 판단하세요.
        2. 반드시 아래 JSON 형식으로만 응답하세요. 다른 설명은 하지 마세요.
        3. 변경할 수 없거나 이해할 수 없는 경우 action을 "none"으로 설정하세요.
        
        [응답 형식]
        {{"action": "update", "path": "profile.email", "value": "new@email.com", "description": "이메일을 변경했습니다."}}
        또는
        {{"action": "none", "reason": "해당 필드를 찾을 수 없습니다."}}
        """
        
        response = llm_client.chat.completions.create(
            model="google/gemma-2-2b-it",
            messages=[
                {"role": "system", "content": "You are a JSON editor. Output only valid JSON."},
                {"role": "user", "content": interpreter_prompt}
            ],
            temperature=0.1,
            max_tokens=300
        )
        
        llm_response = response.choices[0].message.content
        # JSON 마크다운 제거
        clean_json = llm_response.replace("```json", "").replace("```", "").strip()
        
        try:
            edit_command = json.loads(clean_json)
        except json.JSONDecodeError:
            return {"success": False, "message": "AI가 명령을 이해하지 못했습니다. 다시 시도해주세요."}
        
        # 3. 변경 가능 여부 확인
        if edit_command.get("action") == "none":
            return {"success": False, "message": edit_command.get("reason", "변경할 수 없는 명령입니다.")}
        
        # 4. 실제 JSON 수정 수행
        path_parts = edit_command["path"].split(".")
        target = portfolio_data
        for part in path_parts[:-1]:
            if part.isdigit():
                target = target[int(part)]
            else:
                target = target[part]
        
        # 최종 키 업데이트
        final_key = path_parts[-1]
        old_value = target.get(final_key, "(없음)")
        target[final_key] = edit_command["value"]
        
        # 5. 파일에 저장
        with open(PORTFOLIO_PATH, 'w', encoding='utf-8') as f:
            json.dump(portfolio_data, f, ensure_ascii=False, indent=4)
        
        return {
            "success": True,
            "message": edit_command.get("description", "수정 완료"),
            "changed": {
                "path": edit_command["path"],
                "old": old_value,
                "new": edit_command["value"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/portfolio")
def get_portfolio():
    """현재 포트폴리오 데이터를 반환합니다."""
    try:
        if not PORTFOLIO_PATH.exists():
            raise HTTPException(status_code=404, detail="portfolio.json not found")
        with open(PORTFOLIO_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
