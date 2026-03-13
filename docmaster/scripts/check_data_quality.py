"""
학습 데이터 품질 검수 스크립트.
JSONL 파일을 읽어 통계, 유사도 분포, 포맷 오류를 분석합니다.

사용법:
  python scripts/check_data_quality.py --sft ./data/training_export/sft_data.jsonl
  python scripts/check_data_quality.py --dpo ./data/training_export/dpo_data.jsonl
"""

import json
import argparse
import statistics
from pathlib import Path

from sentence_transformers import SentenceTransformer, util


SBERT_MODEL = "snunlp/KR-SBERT-V40K-klueNLI-aug"


def check_sft(path: str):
    records = [json.loads(l) for l in open(path, encoding="utf-8")]
    print(f"\n[SFT] 총 {len(records)}건")

    lengths = [len(r.get("text", "")) for r in records]
    fmt_errors = [i for i, r in enumerate(records) if "text" not in r]

    print(f"  평균 길이: {statistics.mean(lengths):.0f}자")
    print(f"  최솟값: {min(lengths)}자 / 최댓값: {max(lengths)}자")
    print(f"  포맷 오류: {len(fmt_errors)}건 (line {fmt_errors[:5]}...)")
    return records


def check_dpo(path: str):
    records = [json.loads(l) for l in open(path, encoding="utf-8")]
    print(f"\n[DPO] 총 {len(records)}건")

    fmt_errors = [i for i, r in enumerate(records) if not all(k in r for k in ("prompt", "chosen", "rejected"))]
    print(f"  포맷 오류: {len(fmt_errors)}건")

    # Similarity distribution
    print("  SBERT 유사도 분포 계산 중 (최대 100건)…")
    sbert = SentenceTransformer(SBERT_MODEL, device="cpu")
    sims = []
    for r in records[:100]:
        embs = sbert.encode([r["chosen"], r["rejected"]], convert_to_tensor=True)
        sims.append(float(util.cos_sim(embs[0], embs[1]).item()))

    print(f"  평균 유사도: {statistics.mean(sims):.3f}")
    print(f"  중앙값: {statistics.median(sims):.3f}")
    print(f"  너무 유사(>0.85): {sum(1 for s in sims if s > 0.85)}건")
    print(f"  너무 다름(<0.3):  {sum(1 for s in sims if s < 0.3)}건")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sft", help="SFT JSONL path")
    parser.add_argument("--dpo", help="DPO JSONL path")
    args = parser.parse_args()

    if not args.sft and not args.dpo:
        parser.print_help()
        return

    if args.sft and Path(args.sft).exists():
        check_sft(args.sft)

    if args.dpo and Path(args.dpo).exists():
        check_dpo(args.dpo)


if __name__ == "__main__":
    main()
