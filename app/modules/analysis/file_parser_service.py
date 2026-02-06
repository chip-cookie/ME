import pandas as pd
from fastapi import UploadFile
import io
import os
import logging
from typing import Optional
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
            temp_dir = settings.data_dir / "temp_uploads"
            os.makedirs(temp_dir, exist_ok=True)
            temp_path = os.path.join(temp_dir, f"temp_{filename}")
            
            with open(temp_path, "wb") as f:
                f.write(content)
            
            result = extract_document(temp_path)
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
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
