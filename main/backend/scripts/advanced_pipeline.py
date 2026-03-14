import os
import json
import pypdf
from typing import List, Dict, Any
from pathlib import Path

# AI & Parsing Tools
import google.generativeai as genai
from openai import OpenAI
from docling.document_converter import DocumentConverter
from langchain_text_splitters import MarkdownHeaderTextSplitter
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROK_API_KEY = os.getenv("GROK_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Grok API 클라이언트 (OpenAI 호환)
grok_client = None
if GROK_API_KEY and GROK_API_KEY != "your_grok_api_key_here":
    grok_client = OpenAI(
        api_key=GROK_API_KEY,
        base_url="https://api.x.ai/v1"
    )


class IntelligentParser:
    """
    [Router & Dispatch]
    디지털/스캔 여부를 판단하고 최적의 도구로 Markdown 변환
    """
    def __init__(self):
        self.docling = DocumentConverter()
        self.vision_model = genai.GenerativeModel('gemini-2.0-flash')

    def _is_scanned(self, file_path: str) -> bool:
        try:
            reader = pypdf.PdfReader(file_path)
            # 페이지당 텍스트가 50자 미만이면 스캔본으로 의심
            for page in reader.pages:
                text = page.extract_text()
                if text and len(text.strip()) > 50:
                    return False
            return True
        except:
            return False

    def to_markdown(self, file_path: str) -> str:
        is_scanned = self._is_scanned(file_path)
        
        if is_scanned:
            print("👁️ [Mode] Scanned Document detected -> Using Gemini Vision")
            f = genai.upload_file(file_path, display_name="Resume_Doc")
            response = self.vision_model.generate_content(
                [f, "문서의 구조(헤더, 표)를 유지하며 Markdown으로 변환해. 불필요한 장식은 제거해."]
            )
            genai.delete_file(f.name)
            return response.text
        else:
            print("🚀 [Mode] Digital Document detected -> Using Docling")
            res = self.docling.convert(file_path)
            return res.document.export_to_markdown()


class HierarchicalExtractor:
    """
    [Splitting & 1-Pass Extraction]
    Overlap 없이 헤더 기준으로 문서를 쪼개고(Child), 섹션별로 정밀 추출 수행.
    Gemini 실패 시 Grok API로 자동 폴백.
    """
    def __init__(self):
        self.gemini_model = genai.GenerativeModel(
            'gemini-2.0-flash',
            generation_config={"response_mime_type": "application/json", "temperature": 0.1}
        )

    def split_by_header(self, markdown_text: str) -> Dict[str, str]:
        """
        Overlap 없이 헤더 단위로 깔끔하게 절단 (Parent-Child Indexing 개념 응용)
        """
        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]
        splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=headers_to_split_on, 
            strip_headers=False
        )
        docs = splitter.split_text(markdown_text)
        
        # 섹션별로 텍스트 묶기
        sections = {}
        for doc in docs:
            header = doc.metadata.get("Header 2") or doc.metadata.get("Header 1") or "General"
            if header not in sections:
                sections[header] = ""
            sections[header] += "\n" + doc.page_content
            
        return sections

    def _build_prompt(self, section_name: str, text: str) -> str:
        """섹션별 추출 프롬프트 생성"""
        if "Project" in section_name or "프로젝트" in section_name:
            target = "projects list (id, title, description, tags, date)"
        elif "Skill" in section_name or "기술" in section_name:
            target = "skills categories (title, items[name, level])"
        elif "Experience" in section_name or "Profile" in section_name or "Education" in section_name:
            target = "profile info or experience/education history"
        else:
            target = "general information"

        return f"""
        Extract '{target}' from the text below in JSON format.
        If no relevant data exists, return empty JSON {{}}.
        
        [Text Section: {section_name}]
        {text}
        """

    def _extract_with_gemini(self, section_name: str, text: str) -> Dict:
        """Gemini API로 섹션 데이터 추출"""
        prompt = self._build_prompt(section_name, text)
        res = self.gemini_model.generate_content(prompt)
        return json.loads(res.text)

    def _extract_with_grok(self, section_name: str, text: str) -> Dict:
        """Grok API로 섹션 데이터 추출 (폴백)"""
        if not grok_client:
            raise ValueError("GROK_API_KEY가 설정되지 않았습니다.")
        
        prompt = self._build_prompt(section_name, text)
        
        response = grok_client.chat.completions.create(
            model="grok-2-latest",
            messages=[
                {"role": "system", "content": "You are a data extraction assistant. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        
        json_text = response.choices[0].message.content.strip()
        if json_text.startswith("```json"):
            json_text = json_text[7:-3]
        if json_text.startswith("```"):
            json_text = json_text[3:-3]
        return json.loads(json_text)

    def extract_section_data(self, section_name: str, text: str) -> Dict:
        """
        각 섹션(Child)에 특화된 추출 수행.
        Gemini 실패 시 Grok으로 폴백.
        """
        # 1차: Gemini
        try:
            return self._extract_with_gemini(section_name, text)
        except Exception as e:
            print(f"   ⚠️ Gemini 실패 ({section_name}): {e}")
            
            # 2차: Grok 폴백
            if grok_client:
                try:
                    print(f"   🤖 Grok으로 재시도 ({section_name})...")
                    return self._extract_with_grok(section_name, text)
                except Exception as grok_e:
                    print(f"   ❌ Grok도 실패: {grok_e}")
                    return {}
            else:
                return {}


class IntegrityVerifier:
    """
    [2-Pass Verification]
    합쳐진 결과물(Draft)을 원본 전체와 비교하여 검증.
    Gemini 실패 시 Grok API로 자동 폴백.
    """
    def __init__(self):
        self.gemini_model = genai.GenerativeModel(
            'gemini-2.0-flash',
            generation_config={"response_mime_type": "application/json", "temperature": 0.1}
        )

    def _build_prompt(self, full_markdown: str, fragmented_json: List[Dict]) -> str:
        draft_data_str = json.dumps(fragmented_json, ensure_ascii=False)

        return f"""
        You are a Data Integrity Specialist.
        I have extracted JSON fragments from parts of a resume.
        
        Your Task:
        1. Merge the fragments into one final 'Portfolio' JSON structure.
        2. **Verify** against the [Original Markdown] to fix any missing details, wrong dates, or context errors.
        3. Ensure the output strictly follows the target schema.

        [Original Markdown]
        {full_markdown}

        [Extracted Fragments]
        {draft_data_str}

        [Target Schema]
        {{
            "profile": {{ "name": "", "title": "", "bio": "", "email": "", "phone": "", "website": "", "image": "" }},
            "projects": [ {{ "id": "", "title": "", "description": "", "tags": [{{"name": ""}}], "link": "", "date": "" }} ],
            "skills": [ {{ "title": "", "items": [{{"name": "", "level": ""}}] }} ],
            "awards": [ {{ "title": "", "date": "", "type": "" }} ]
        }}
        """

    def _verify_with_gemini(self, full_markdown: str, fragmented_json: List[Dict]) -> Dict:
        """Gemini API로 검증 및 병합"""
        prompt = self._build_prompt(full_markdown, fragmented_json)
        res = self.gemini_model.generate_content(prompt)
        return json.loads(res.text)

    def _verify_with_grok(self, full_markdown: str, fragmented_json: List[Dict]) -> Dict:
        """Grok API로 검증 및 병합 (폴백)"""
        if not grok_client:
            raise ValueError("GROK_API_KEY가 설정되지 않았습니다.")
        
        prompt = self._build_prompt(full_markdown, fragmented_json)
        
        response = grok_client.chat.completions.create(
            model="grok-2-latest",
            messages=[
                {"role": "system", "content": "You are a data integrity specialist. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        
        json_text = response.choices[0].message.content.strip()
        if json_text.startswith("```json"):
            json_text = json_text[7:-3]
        if json_text.startswith("```"):
            json_text = json_text[3:-3]
        return json.loads(json_text)

    def verify_and_merge(self, full_markdown: str, fragmented_json: List[Dict]) -> Dict:
        """
        전체 문맥을 통한 데이터 검증 및 병합.
        Gemini 실패 시 Grok으로 폴백.
        """
        print("🧠 [2-Pass] 전체 문맥을 통한 데이터 검증 및 병합 중...")
        
        # 1차: Gemini
        try:
            return self._verify_with_gemini(full_markdown, fragmented_json)
        except Exception as e:
            print(f"⚠️ Gemini 검증 실패: {e}")
            
            # 2차: Grok 폴백
            if grok_client:
                try:
                    print("🤖 Grok으로 검증 재시도...")
                    return self._verify_with_grok(full_markdown, fragmented_json)
                except Exception as grok_e:
                    print(f"❌ Grok 검증도 실패: {grok_e}")
                    raise Exception(f"모든 API 실패. Gemini: {e}, Grok: {grok_e}")
            else:
                raise e


def run_pipeline(pdf_path: str) -> Dict[str, Any]:
    """
    메인 파이프라인 함수.
    update_portfolio.py에서 호출하는 진입점.
    """
    # 1. 문서 변환 (Hybrid: Docling or Gemini Vision)
    parser = IntelligentParser()
    markdown_text = parser.to_markdown(pdf_path)
    
    # 2. 계층적 분할 (Splitting - No Overlap)
    extractor = HierarchicalExtractor()
    sections = extractor.split_by_header(markdown_text)
    
    print(f"🧩 섹션 분할 완료: {list(sections.keys())}")
    
    # 3. 1차 추출 (Extraction Loop with Fallback)
    fragments = []
    for header, content in sections.items():
        print(f"   - Processing Section: {header}")
        data = extractor.extract_section_data(header, content)
        fragments.append(data)
        
    # 4. 2차 검증 및 병합 (Verification with Fallback)
    verifier = IntegrityVerifier()
    final_json = verifier.verify_and_merge(markdown_text, fragments)
    
    return final_json


# 직접 실행 시 테스트
if __name__ == "__main__":
    base_dir = Path(__file__).parent.parent
    pdf_path = base_dir / "data" / "personal" / "석상훈 신입 이력서.pdf"
    output_path = base_dir / "src" / "data" / "portfolio_final.json"
    
    if not pdf_path.exists():
        print("❌ 파일 없음")
    else:
        result = run_pipeline(str(pdf_path))
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=4, ensure_ascii=False)
            
        print(f"✨ 최종 파이프라인 완료! 저장됨: {output_path}")
