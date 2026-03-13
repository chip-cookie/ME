import re
import subprocess
from pathlib import Path

from docling.document_converter import DocumentConverter


class ParserService:
    def __init__(self):
        self.converter = DocumentConverter()

    async def parse_document(self, file_path: str) -> dict:
        ext = Path(file_path).suffix.lower()
        raw = self._parse_hwp(file_path) if ext == ".hwp" else self._parse_with_docling(file_path)
        structured = self._structure_markdown(raw)
        return {"raw_markdown": raw, "sections": structured["sections"]}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _parse_hwp(self, file_path: str) -> str:
        try:
            result = subprocess.run(
                ["hwp5txt", file_path],
                capture_output=True,
                text=True,
                timeout=60,
            )
            return result.stdout.strip() if result.returncode == 0 else ""
        except Exception:
            return self._parse_with_docling(file_path)

    def _parse_with_docling(self, file_path: str) -> str:
        try:
            result = self.converter.convert(file_path)
            return result.document.export_to_markdown()
        except Exception:
            return ""

    def _structure_markdown(self, markdown_text: str) -> dict:
        # Split on common Korean cover-letter section headers
        pattern = re.compile(
            r"(?m)^(?:\s*#+\s*)?(?:\[?\d+\]?[\.\)]\s+.*|성장과정.*|지원동기.*|입사\s*후\s*포부.*|자기소개.*)$"
        )
        parts = pattern.split(markdown_text)
        headers = pattern.findall(markdown_text)

        sections = []
        body_parts = parts[1:] if len(parts) > 1 else parts
        for i, body in enumerate(body_parts):
            title = headers[i].strip() if i < len(headers) else f"section_{i+1}"
            for idx, chunk in enumerate(self._chunk_text_with_overlap(body.strip())):
                sections.append({"title": f"{title}_part{idx+1}", "content": chunk})

        # Fallback: no recognizable headers → treat whole text as one section
        if not sections and markdown_text.strip():
            for idx, chunk in enumerate(self._chunk_text_with_overlap(markdown_text.strip())):
                sections.append({"title": f"section_part{idx+1}", "content": chunk})

        return {"sections": sections}

    def _chunk_text_with_overlap(
        self, text: str, max_length: int = 800, overlap: int = 150
    ) -> list[str]:
        if len(text) <= max_length:
            return [text]
        chunks, start = [], 0
        while start < len(text):
            end = start + max_length
            if end >= len(text):
                chunks.append(text[start:])
                break
            safe_end = text.rfind(". ", start + 400, end)
            actual_end = safe_end + 1 if safe_end != -1 else end
            chunks.append(text[start:actual_end])
            start = actual_end - overlap
        return chunks
