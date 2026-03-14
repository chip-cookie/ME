import cv2
import fitz  # PyMuPDF
import numpy as np
import os

# [ChromaDB Fix] SQLite3 버전 호환성 패치
try:
    import pysqlite3
    import sys
    sys.modules["sqlite3"] = pysqlite3
except ImportError:
    pass

import json
import time
from pathlib import Path
from difflib import SequenceMatcher
import traceback
from kiwipiepy import Kiwi  # 🥝 키위 호출!

# [Image Processor]
try:
    from backend.scripts.image_processor import ImageProcessor
except ImportError:
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__)))
    from image_processor import ImageProcessor

# 1. AI Libs
from paddleocr import PaddleOCR  # 일반 OCR
try:
    from ppstructure.predict_system import StructureSystem as PPStructure
except ImportError:
    # Fallback: 구버전 PaddleOCR 호환
    try:
        from paddleocr import PPStructure
    except ImportError:
        print("⚠️ PPStructure를 찾을 수 없습니다. PaddleOCR 버전을 확인하세요.")
        PPStructure = None
from openai import OpenAI
import chromadb
from sentence_transformers import SentenceTransformer



# ==========================================
# [UPDATED] Class 1: VLMGenerator (PaddleOCR v4 사용)
# ==========================================
class VLMGenerator:
    """
    [역할] PaddleOCR PP-OCRv4
    PDF를 이미지로 변환 후, 텍스트를 추출하여 Markdown으로 만듭니다.
    """
    def __init__(self):
        print("📥 [Init] PaddleOCR (PP-OCRv4) 로딩 중...")
        try:
            self.model = PaddleOCR(
                use_angle_cls=True,
                lang='korean',
                use_gpu=False,
                show_log=False,
                enable_mkldnn=False
            )
        except Exception as e:
            print(f"⚠️ 초기화 경고: {e}")
            self.model = PaddleOCR(lang='korean', enable_mkldnn=False)

    def generate_markdown(self, file_path: str) -> str:
        print(f"🎨 [OCR] 문서 텍스트 추출 시작: {file_path}")
        
        if not os.path.exists(file_path):
            print(f"❌ 파일이 없습니다: {file_path}")
            return ""

        markdown_output = ""
        
        try:
            # 1. PDF를 이미지로 변환 (PyMuPDF 사용)
            doc = fitz.open(file_path)
            
            for i, page in enumerate(doc):
                print(f"   ... {i+1}페이지 처리 중")
                
                # PDF -> 이미지(Pixmap) 변환
                pix = page.get_pixmap(dpi=150)  # 해상도 150dpi
                # 버퍼에서 Numpy 배열로 변환
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                
                # 색상 채널 보정 (RGB -> BGR for OpenCV/Paddle)
                if pix.n == 3:  # RGB
                    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                elif pix.n == 4:  # RGBA
                    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)

                # 2. OCR 실행 (PaddleOCR v5 API vs Legacy)
                if hasattr(self.model, 'predict'):
                    result = self.model.predict(img)
                else:
                    result = self.model.ocr(img, cls=True)
                
                markdown_output += f"\n\n## 페이지 {i+1}\n\n"
                
                # 3. 결과 파싱 (PaddleOCR v5 predict() 형식)
                # predict()는 OCRResult 객체 리스트를 반환
                if result:
                    for ocr_result in result:
                        # OCRResult 객체에서 텍스트 추출
                        if hasattr(ocr_result, 'rec_texts'):
                            # 새 API: rec_texts 속성 사용
                            for text in ocr_result.rec_texts:
                                if text.strip():
                                    markdown_output += f"{text}\n"
                        elif hasattr(ocr_result, 'text'):
                            # 다른 형식
                            if ocr_result.text.strip():
                                markdown_output += f"{ocr_result.text}\n"
                        elif isinstance(ocr_result, (list, tuple)):
                            # 구버전 형식 (nested list)
                            try:
                                for line in ocr_result:
                                    if isinstance(line, (list, tuple)) and len(line) >= 2:
                                        text = line[1][0] if isinstance(line[1], (list, tuple)) else str(line[1])
                                        markdown_output += f"{text}\n"
                            except:
                                pass
                        else:
                            # 문자열 변환 시도
                            try:
                                text_str = str(ocr_result)
                                if text_str.strip() and len(text_str) > 5:
                                    markdown_output += f"{text_str}\n"
                            except:
                                pass
            
            doc.close()
            print(f"✅ [OCR] 추출 완료! ({len(markdown_output)} 글자)")
            
        except Exception as e:
            print(f"❌ [Error] OCR 처리 실패: {e}")
            traceback.print_exc()
            return ""
            
        return markdown_output.strip()

# ==========================================
# Class 2: Inference Engine (vLLM 연결)
# ==========================================
from transformers import AutoTokenizer

class LocalLLMTransformer:
    def __init__(self):
        print("🚀 [Init] Gemma 2 (vLLM) 연결 시도...")
        # Docker 내부 주소 사용
        base_url = os.getenv("VLLM_API_URL", "http://inference-server:8000/v1")
        self.client = OpenAI(base_url=base_url, api_key="EMPTY")
        self.model_name = os.getenv("VLLM_MODEL_NAME", "google/gemma-2-2b-it")
        
        # ✂️ 토크나이저 로드 (HuggingFace)
        # 텍스트가 너무 길면 에러가 나므로, 토큰 단위로 정확히 자르기 위함
        try:
            print("📏 [Init] 토크나이저 로드 중...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        except Exception as e:
            print(f"⚠️ 토크나이저 로드 실패 (인터넷 연결 확인): {e}")
            self.tokenizer = None

    def transform(self, markdown_text: str) -> dict:
        print("🧠 [Gemma] 생각 중... (JSON 변환)")
        
        # 1. 텍스트 길이 제한 (토크나이저 사용)
        if self.tokenizer:
            tokens = self.tokenizer.encode(markdown_text)
            # 입력 토큰 제한 (System Prompt 등을 고려하여 여유있게 3000토큰)
            if len(tokens) > 3000:
                print(f"✂️ 텍스트가 너무 깁니다 ({len(tokens)} 토큰). 3000 토큰으로 자릅니다.")
                markdown_text = self.tokenizer.decode(tokens[:3000])
        else:
            # Fallback (글자 수 기반)
            markdown_text = markdown_text[:6000]

        prompt = f"""
        Extract resume data into this JSON schema compatible with the portfolio frontend.
        Ensure 'level' in skills is one of: "Expert", "Advanced", "Intermediate".
        Ensure 'type' in awards is one of: "Award", "Certificate".
        Make sure to generate 'tags' for projects based on keywords.

        Target Schema:
        {{
            "profile": {{
                "name": "string", "title": "string", "bio": "string", 
                "email": "string", "phone": "string", "website": "string", "image": "/images/default_profile.png"
            }},
            "projects": [
                {{
                    "id": "proj_01", "title": "string", "description": "string", 
                    "tags": [{{"name": "string"}}], "link": "#", "date": "YYYY.MM - YYYY.MM"
                }}
            ],
            "skills": [
                {{
                    "title": "Backend", 
                    "items": [
                        {{"name": "Python", "level": "Advanced"}}
                    ]
                }}
            ],
            "awards": [
                {{"title": "string", "date": "YYYY.MM", "type": "Award"}}
            ]
        }}

        Input Markdown:
        {markdown_text}
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a JSON converter. Output only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2048
            )
            res_text = response.choices[0].message.content
            clean_json = res_text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_json)
        except Exception as e:
            print(f"⚠️ [Gemma] 변환 실패 (원본 사용): {e}")
            return None

# ==========================================
# Class 3: Vector Storage (임베딩 & 저장)
# ==========================================
class VectorStorage:
    def __init__(self):
        print("💾 [Init] 임베딩 모델(bge-m3) & Kiwi(형태소 분석기) 로딩...")
        
        # 임베딩 모델 (로컬 다운로드, 최초 1회)
        embed_model = os.getenv("EMBED_MODEL", "BAAI/bge-m3")
        self.encoder = SentenceTransformer(embed_model)
        
        # Docker 내부 네트워크 (vector-db 컨테이너)
        host = os.getenv("CHROMA_HOST", "vector-db")
        port = int(os.getenv("CHROMA_PORT", "8000"))
        
        try:
            self.client = chromadb.HttpClient(host=host, port=port)
            print(f"   🔗 ChromaDB 연결: {host}:{port}")
        except Exception as e:
            print(f"   ⚠️ ChromaDB 연결 실패, 로컬 모드 사용: {e}")
            self.client = chromadb.PersistentClient(path="/app/data/chroma")
        
        collection_name = os.getenv("CHROMA_COLLECTION", "esg_os_index")
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

        # 🥝 Kiwi 초기화 (문장 분리용)
        try:
            self.kiwi = Kiwi()
        except Exception as e:
            print(f"⚠️ Kiwi 로딩 실패: {e}")
            self.kiwi = None

    # 🥝 [업그레이드] Kiwi + Overlap (문장 단위로 겹쳐서 자르기)
    def smart_chunking(self, text, chunk_size=500, overlap_size=100):
        if not self.kiwi or not text:
            # Kiwi 없으면 그냥 글자 수로 잘라서 리스트 반환 (Fallback)
            return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
        try:
            # 1. Kiwi로 문장 리스트 만들기
            # 예: ['안녕하세요.', '반갑습니다.', '오늘은 날씨가 좋네요.', ...]
            sents = [s.text for s in self.kiwi.split_into_sents(text)]
        except Exception:
             # 가끔 너무 긴 텍스트 등에서 에러나면 Fallback
             return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
        chunks = []
        current_chunk = []
        current_len = 0
        
        for sentence in sents:
            sent_len = len(sentence)
            
            # 2. 꽉 찼는지 확인
            if current_len + sent_len > chunk_size:
                # (A) 현재까지 모은 문장들을 하나의 청크로 저장
                full_text = " ".join(current_chunk)
                chunks.append(full_text)
                
                # (B) 핵심: 오버랩 로직 (다음 청크를 위해 뒷부분을 남겨둠)
                # 현재 청크의 마지막 문장들 중 overlap_size만큼만 건져서 새 청크의 시작으로 씀
                overlap_text = []
                overlap_len = 0
                
                # 뒤에서부터 문장을 하나씩 가져옴 (예: 100글자 찰 때까지)
                for s in reversed(current_chunk):
                    if overlap_len + len(s) < overlap_size:
                        overlap_text.insert(0, s) # 앞에다 붙임
                        overlap_len += len(s)
                    else:
                        break # 오버랩 한도 초과하면 멈춤
                
                # (C) 새 청크 시작 (오버랩된 문장 + 현재 문장)
                current_chunk = overlap_text + [sentence]
                current_len = overlap_len + sent_len
                
            else:
                # 아직 공간 남았으면 그냥 추가
                current_chunk.append(sentence)
                current_len += sent_len
        
        # 마지막 남은 조각 처리
        if current_chunk:
            chunks.append(" ".join(current_chunk))
            
        return chunks

    # 🕵️ [신규 기능] 검증용 리포트 파일 생성 함수
    def save_debug_report(self, file_name, chunks):
        # 1. 저장할 폴더 만들기 (도커 볼륨에 연결된 곳)
        debug_dir = "data/debug" 
        if not os.path.exists(debug_dir):
            os.makedirs(debug_dir)
            
        save_path = os.path.join(debug_dir, f"DEBUG_{file_name}.md")
        
        try:
            with open(save_path, "w", encoding="utf-8") as f:
                f.write(f"# 🕵️ 데이터 검증 리포트: {file_name}\n")
                f.write(f"- 총 청크 개수: {len(chunks)}개\n")
                f.write("- 확인 사항: 문장이 매끄럽게 연결되는지, 오타(OCR 에러)가 없는지 확인하세요.\n")
                f.write("\n" + "="*50 + "\n\n")
                
                for i, chunk in enumerate(chunks):
                    f.write(f"## 🧩 Chunk {i+1}\n")
                    f.write("```text\n") # 코드 블록으로 감싸서 구분하기 쉽게 함
                    f.write(chunk)
                    f.write("\n```\n")
                    f.write(f"\n> 📏 길이: {len(chunk)}자\n")
                    f.write("\n" + "-"*30 + "\n\n")
                    
            print(f"📝 [Debug] 검증 리포트 생성 완료: {save_path}")
            
        except Exception as e:
            print(f"⚠️ 리포트 생성 중 에러(무시됨): {e}")

    def save(self, data: dict, file_name: str) -> int:
        print(f"🧲 [Embedding] 데이터를 벡터화하여 저장합니다... ({file_name})")
        docs, metas, ids, embs = [], [], [], []
        
        # (1) 요약 저장
        if "summary" in data and data["summary"]:
            text = f"요약: {data['summary']}"
            docs.append(text)
            embs.append(self.encoder.encode(text).tolist())
            metas.append({"source": file_name, "type": "summary"})
            ids.append(f"{file_name}_sum")

        # (2) 스킬 저장
        if "skills" in data and data["skills"]:
            skills_text = f"스킬: {', '.join(data['skills'])}"
            docs.append(skills_text)
            embs.append(self.encoder.encode(skills_text).tolist())
            metas.append({"source": file_name, "type": "skills"})
            ids.append(f"{file_name}_skills")

        # (3) 원본 텍스트 저장 시 -> 🥝 Kiwi + Overlap 사용!
        if "raw_markdown" in data:
             raw_text = data["raw_markdown"]
             
             # 🟢 호출할 때 overlap_size 설정 (예: 500자 자르고, 100자 겹침)
             chunks = self.smart_chunking(raw_text, chunk_size=500, overlap_size=100)
             
             # 🕵️ [추가됨] 벡터 DB 넣기 전에 파일로 먼저 저장해서 확인!
             self.save_debug_report(file_name, chunks)
             
             for i, chunk in enumerate(chunks):
                 docs.append(chunk)
                 embs.append(self.encoder.encode(chunk).tolist())
                 metas.append({"source": file_name, "type": "raw_chunk"})
                 ids.append(f"{file_name}_chunk_{i}")

        if docs:
            self.collection.upsert(ids=ids, embeddings=embs, documents=docs, metadatas=metas)
            print(f"✅ [Saved] {len(docs)}개 항목 (Kiwi 오버랩 청킹 완료) 저장됨!")
            return len(docs)
        else:
            print("⚠️ 저장할 데이터가 없습니다.")
            return 0

    def search(self, query: str, n_results: int = 5) -> dict:
        """벡터 유사도 검색"""
        print(f"🔍 [Search] 쿼리: '{query}'")
        query_vector = self.encoder.encode(query).tolist()
        return self.collection.query(query_embeddings=[query_vector], n_results=n_results)

# ==========================================
# Main
# ==========================================
def main():
    # Docker 경로 (/app) 또는 로컬 경로 자동 감지
    if Path("/app").exists():
        base_dir = Path("/app")
    else:
        base_dir = Path(__file__).parent.parent
    
    target_file = base_dir / "data" / "personal" / "석상훈 신입 이력서.pdf"
    output_path = base_dir / "data" / "portfolio.json"
    
    if not target_file.exists():
        print(f"❌ 파일 없음: {target_file}")
        print("   (팁: data/personal 폴더에 PDF가 있는지 확인하세요)")
        return

    print("=" * 60)
    print("🚀 Robust Pipeline 시작")
    print("   [OCR(PPStructure) → LLM(Gemma) → Embedding → ChromaDB]")
    print("=" * 60)

    # 1. OCR (구조화) - PPStructure 사용
    ocr = VLMGenerator()
    md_text = ocr.generate_markdown(str(target_file))
    
    if not md_text:
        print("❌ OCR 실패. 종료합니다.")
        return

    # 2. LLM (Gemma) - JSON 변환
    llm = LocalLLMTransformer()
    final_json = llm.transform(md_text)

    # 2.5 [NEW] 이미지 추출 (Root2)
    print("📸 [Image] 프로필 사진 추출 시도...")
    profile_image_url = ImageProcessor.extract_from_pdf(str(target_file))
    if profile_image_url:
        print(f"   => 성공: {profile_image_url}")
    else:
        print("   => 실패 (기본값 사용)")
        profile_image_url = "/images/default_profile.png"

    # 데이터 정리
    if final_json:
        print("✅ [LLM] JSON 변환 성공!")
        save_data = final_json
        save_data["parsing_type"] = "FULL_LLM_PROCESSED"
        
        # 이미지 URL 주입
        if "profile" in save_data:
            save_data["profile"]["image"] = profile_image_url
            
    else:
        print("🔄 [Fallback] 원본 마크다운 + 기본 구조 생성")
        # Frontend Crash 방지를 위한 더미 구조 생성 (+ 추출된 이미지)
        save_data = {
            "parsing_type": "RAW_MARKDOWN_ONLY",
            "raw_markdown": md_text,
            "profile": {
                "name": "지원자 (분석 중)",
                "title": "이력서 분석 대기",
                "bio": "LLM 분석이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
                "email": "email@example.com",
                "phone": "010-0000-0000",
                "website": "#",
                "image": profile_image_url
            },
            "projects": [],
            "skills": [],
            "experience": [],
            "education": [],
            "awards": []
        }

    # 3. JSON 파일 저장
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(save_data, f, indent=4, ensure_ascii=False)
    print(f"📄 [Saved] JSON: {output_path}")

    # 4. Embedding & ChromaDB 저장
    try:
        db = VectorStorage()
        saved_count = db.save(save_data, str(target_file.name))
    except Exception as e:
        print(f"⚠️ [Warning] 벡터 저장 실패: {e}")
        saved_count = 0

    print("=" * 60)
    print("🎉 파이프라인 완료!")
    print(f"   - JSON: {output_path}")
    print(f"   - 벡터 저장: {saved_count}개 항목")
    print("=" * 60)

if __name__ == "__main__":
    main()
