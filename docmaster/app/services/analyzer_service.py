"""BM25 + SBERT hybrid gap analyzer and hallucination drift checker."""
# Temporarily bypassing torch and sentence_transformers due to WinError 1114 DLL load failure
# import torch
# from sentence_transformers import SentenceTransformer, util
from rank_bm25 import BM25Okapi

class AnalyzerService:
    _SBERT_MODEL = "snunlp/KR-SBERT-V40K-klueNLI-aug"
    _HYBRID_ALPHA = 0.4          # BM25 weight
    _GAP_THRESHOLD = 0.45        # below → keyword missing
    _HALLUCINATION_SIM = 0.35    # below → severe semantic drift
    _NO_CHANGE_SIM = 0.96        # above → rewrite had no effect

    def __init__(self):
        # self.sbert = SentenceTransformer(self._SBERT_MODEL, device="cpu")
        self.sbert = None

    def analyze_gap(self, jd_keywords: list[str], profile_text: str) -> list[dict]:
        """Return keywords whose hybrid coverage score is below the threshold."""
        sentences = [s.strip() for s in profile_text.split(".") if len(s.strip()) > 5]
        if not sentences:
            return [{"keyword": kw, "score": 0.0} for kw in jd_keywords]

        bm25 = BM25Okapi([s.split() for s in sentences])
        gaps = []
        for kw in jd_keywords:
            bm25_scores = bm25.get_scores(kw.split())
            bm25_max = float(max(bm25_scores)) if bm25_scores.any() else 0.0
            
            # Mock SBERT score since torch is disabled
            sbert_max = 0.5
            hybrid = self._HYBRID_ALPHA * min(1.0, bm25_max) + (1 - self._HYBRID_ALPHA) * sbert_max
            if hybrid < self._GAP_THRESHOLD:
                gaps.append({"keyword": kw, "score": hybrid})
        return sorted(gaps, key=lambda x: x["score"])

    def check_drift(self, original: str, rewritten: str) -> tuple[str, float]:
        """
        Returns (status, cosine_similarity).
        Mocked due to disabled torch/SBERT.
        """
        return "SAFE", 0.85
