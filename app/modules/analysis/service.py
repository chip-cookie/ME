
import os
import json
import logging
import requests
import xmltodict
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

import OpenDartReader
from langchain_community.llms import Ollama
from langchain_community.embeddings import OpenAIEmbeddings 
# Note: Using OpenAIEmbeddings for now if key exists, else we might need a local embedding model. 
# Given .env has OPENAI_API_KEY empty, we should probably use a local embedding or assume the user will fill it 
# OR use OllamaEmbeddings if available and reliable. Reliability of OllamaEmbeddings varies.
# Let's stick to a generic interface or try to use what's available. 
# Actually, for "local" usually HuggingFaceEmbeddings is best.
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field

from app.modules.analysis.models import AnalysisSession
from app.core.config import get_settings

settings = get_settings()

# Setup Logger
logger = logging.getLogger(__name__)

class AnalysisService:
    def __init__(self, db: Session):
        self.db = db
        self.dart_api_key = os.getenv("DART_API_KEY")
        self.nps_api_key = os.getenv("NPS_API_KEY")
        self.dart = OpenDartReader(self.dart_api_key) if self.dart_api_key else None
        
        # LLM Setup (Ollama)
        self.llm = Ollama(
            base_url=settings.OLLAMA_BASE_URL, 
            model=settings.OLLAMA_MODEL, 
            temperature=0.1
        )
        
        # Embeddings (Local)
        self.embeddings = HuggingFaceEmbeddings(model_name="jhgan/ko-sroberta-multitask")

    async def create_session(self, file: UploadFile) -> AnalysisSession:
        # 1. Save File (Basic implementation) - In prod, use S3 or distinct storage
        upload_dir = "data/uploads/jd"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        # 2. Extract Text (Simplistic for now, can extend to PDF/Images using LearningService logic later)
        # Using a simple text extraction for POC if text based, or just placeholder if binary.
        # Ideally we reuse the 'ingest' logic from Learning module if it exists and is decoupled.
        # For now, let's assume text/pdf processing is handled or add a simple loader.
        text_content = ""
        if file.filename.endswith(".txt"):
             text_content = content.decode("utf-8")
        else:
            # Placeholder for PDF/Docx extraction - To be implemented or integrated
            text_content = "File content extraction pending..." 

        # 3. Create Session DB Entry
        session = AnalysisSession(
            file_name=file.filename,
            file_type=file.content_type,
            file_path=file_path,
            raw_text=text_content
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        return session

    def analyze_jd(self, session_id: int):
        session = self.db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
        if not session or not session.raw_text:
            return None

        # 1. Analyze with LLM using PydanticOutputParser (Hard Prompting)
        parser = PydanticOutputParser(pydantic_object=JDAnalysisSchema)
        
        prompt = PromptTemplate(
            template="""
            당신은 전문 채용 분석가입니다. 다음 채용공고(JD)를 분석하여 요청된 구조로 정보를 추출하세요.
            
            [채용공고]
            {text}
            
            {format_instructions}
            
            반드시 위 JSON 형식만을 출력하고 다른 설명은 하지 마세요.
            """,
            input_variables=["text"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )
        
        try:
            # Generate Prompt
            _input = prompt.format_prompt(text=session.raw_text[:4000])
            
            # Invoke LLM
            output = self.llm.invoke(_input.to_string())
            
            # Use Parser to validate and extract
            try:
                # Provide a more robust parsing attempt by stripping markdown code blocks if present
                clean_output = output.strip()
                if clean_output.startswith("```json"):
                    clean_output = clean_output.split("```json")[1]
                if clean_output.endswith("```"):
                    clean_output = clean_output.rsplit("```", 1)[0]
                
                parsed_data = parser.parse(clean_output)
                
                # Convert back to dict for storage
                session.analysis_result = parsed_data.dict()
                
                # Extract corp name for API calls
                corp_name = parsed_data.corporate_name
                
                financial_data = {}
                if corp_name:
                    # DART
                    if self.dart:
                        dart_info = self.fetch_dart_info(corp_name)
                        financial_data['dart'] = dart_info
                        
                    # NPS
                    nps_info = self.fetch_nps_data(corp_name)
                    financial_data['nps'] = nps_info
                    
                session.financial_data = financial_data
                
            except Exception as e:
                 logger.error(f"Output Parsing failed: {e}. Raw output: {output}")
                 # Fallback to saving raw output if parsing fails completely
                 session.analysis_result = {"raw_llm_output": output, "error": "Parsing Failed"}
            
            #     dart_info = self.fetch_dart_info(extracted_corp_name)
            #     session.financial_data = dart_info


            self.db.commit()
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            
        return session

    def fetch_dart_info(self, corp_name: str) -> Dict:
        """Fetch financial summary from DART"""
        if not self.dart:
            return {"error": "DART API Key missing"}
            
        try:
            # find_corp_code returns code or None
            # This is a wrapper call, exact method depends on OpenDartReader version
            # Usually users do dart.find_corp_code("Samsung Electronics")
            
            # Getting brief info
            # This part requires diving into OpenDartReader docs/methods. 
            # Assuming standard usage:
            report = self.dart.company(corp_name) # Basic info
            # We can also get finstate: self.dart.finstate(corp_name, 2023)
            
            return report if report else {"status": "Not Found"}
        except Exception as e:
            logger.error(f"DART fetch failed: {e}")
            return {"error": str(e)}

    def fetch_nps_data(self, corp_name: str) -> Dict:
        """Fetch National Pension Service data for salary/turnover estimation"""
        if not self.nps_api_key:
            return {"status": "No API Key"}
            
        url = "http://apis.data.go.kr/B552015/NpsBplcInfoInqSv/getNpsBplcInfoInqSv"
        params = {
            "serviceKey": self.nps_api_key,
            "wkpl_nm": corp_name,
            "pageNo": 1,
            "numOfRows": 1
        }
        
        try:
            # The serviceKey might need decoding if passed as string directly depending on library
            # requests usually handles encoding if given as params, but public portal keys are often pre-encoded.
            # If key contains %, it might be encoded. Let's try sending as is.
            # Sometimes we need to pass unquoted key in query string directly if requests double-encodes.
            
            # Using get directly
            response = requests.get(url, params=params)
            
            if response.status_code != 200:
                return {"status": "API Error", "code": response.status_code}
                
            # Parse XML
            data_dict = xmltodict.parse(response.content)
            
            # Log structure for debugging
            # print(json.dumps(data_dict, indent=2, ensure_ascii=False))
            
            # Navigate XML structure (Response -> Body -> Items -> Item)
            # This path depends on exact API response
            try:
                body = data_dict['response']['body']
                if body['totalCount'] == '0':
                    return {"status": "Not Found"}
                    
                item = body['items']['item']
                # If multiple items, 'item' is list. If one, it's dict.
                if isinstance(item, list):
                    item = item[0] # Pick first match
                    
                return {
                    "status": "Success",
                    "employees": int(item.get('adptCnt', 0)), # 가입자수
                    "new_hires": int(item.get('newAcqsCnt', 0)), # 신규
                    "departures": int(item.get('lssCnt', 0)), # 상실(퇴사)
                    "avg_monthly_income": int(item.get('avrgMthAmt', 0)), # 월평균소득
                    "corp_addr": item.get('addr', '')
                }
            except KeyError:
                return {"status": "Structure Error", "raw": str(data_dict)}
                
        except Exception as e:
            logger.error(f"NPS fetch failed: {e}")
            return {"error": str(e)}

    def chat_with_jd(self, session_id: int, query: str) -> str:
        # FAISS retrieval + LLM 
        # To be implemented
        return "Chat functionality coming soon."
