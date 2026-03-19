import pandas as pd
from fastapi import UploadFile
import io
import os
import uuid
import logging
from pathlib import Path
from app.modules.analysis.extraction_service import extract_document
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class UniversalFileParser:
    """
    모든 종류의 기업 분석 파일(PDF, HWP, Excel, TXT 등)을 
    텍스트나 구조화된 데이터로 변환하는 파서 팩토리
    """

    async def parse_file(self, file: UploadFile) -> str:
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()
        content = await file.read()
        
        logger.info(f"Parsing file: {filename} with extension: {ext}")
        
        try:
            # Excel/CSV Strategy (using pandas)
            if ext in ['.xlsx', '.xls']:
                return self._parse_excel(content)
            elif ext == '.csv':
                return self._parse_csv(content)
            
            # For other formats, use the existing Dual-Path Extraction Pipeline
            # We need to save to a temp file first because extract_document expects a path
            temp_dir = Path(settings.data_dir) / "temp_uploads"
            temp_dir.mkdir(parents=True, exist_ok=True)
            # UUID 기반 파일명으로 경로 탐색 공격 방지
            safe_ext = Path(filename).suffix.lower() if filename else ".tmp"
            temp_path = temp_dir / f"{uuid.uuid4().hex}{safe_ext}"

            try:
                with open(temp_path, "wb") as f:
                    f.write(content)
                result = extract_document(str(temp_path))
            finally:
                # 성공/실패 여부와 무관하게 임시파일 항상 삭제
                temp_path.unlink(missing_ok=True)

            return result.text
            
        except Exception as e:
            logger.error(f"Failed to parse file {filename}: {e}")
            raise ValueError(f"파일 파싱 중 오류가 발생했습니다: {str(e)}")

    def _parse_excel(self, content: bytes) -> str:
        """Excel: Pandas로 읽어서 Markdown 표로 변환"""
        try:
            df = pd.read_excel(io.BytesIO(content))
            return df.to_markdown(index=False)
        except Exception as e:
            logger.error(f"Excel parsing failed: {e}")
            return f"[Excel Parsing Error: {str(e)}]"

    def _parse_csv(self, content: bytes) -> str:
        """CSV: Pandas로 읽어서 Markdown 표로 변환"""
        try:
            # Try UTF-8 first, then EUC-KR for Korean CSVs
            try:
                df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(content), encoding='euc-kr')
                
            return df.to_markdown(index=False)
        except Exception as e:
            logger.error(f"CSV parsing failed: {e}")
            return f"[CSV Parsing Error: {str(e)}]"
