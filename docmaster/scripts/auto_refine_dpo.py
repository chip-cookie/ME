"""
자기 교정형 DPO 데이터셋 생성 스크립트.

- 합격 문서(chosen)를 DB에서 로드
- vLLM에게 의도적으로 품질이 낮은 버전(rejected) 생성 요청
- SBERT 유사도 체크 → 너무 유사하면 재생성(최대 3회)
- 충분히 다른 경우에만 DB에 DPO 페어로 저장

사용법:
  python scripts/auto_refine_dpo.py --target_pairs 300
"""

import asyncio
import argparse
from pathlib import Path

from sentence_transformers import SentenceTransformer, util

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from app.models.schema import Document, TrainingDataset
from app.models.enums import OrgType, ResultLabel, DatasetType
from app.services.vllm_client import VLLMClient


SIMILARITY_UPPER = 0.85   # rejected가 chosen과 너무 비슷하면 재시도
MAX_RETRIES = 3
SBERT_MODEL = "snunlp/KR-SBERT-V40K-klueNLI-aug"


async def generate_rejected(vllm: VLLMClient, chosen_text: str, org_type: str) -> str:
    prompt = (
        f"다음 합격 수준의 자기소개서를 평범하고 구체성이 없는 버전으로 다시 써주세요. "
        f"수치와 사례를 제거하고 추상적인 표현으로 대체하세요. 글자수는 비슷하게 유지하세요.\n\n"
        f"원문:\n{chosen_text}"
    )
    return await vllm.chat(
        system="당신은 자기소개서 품질 저하 전문가입니다.",
        user=prompt,
        temperature=0.9,
    )


async def main(target_pairs: int):
    settings = get_settings()
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    vllm = VLLMClient()
    sbert = SentenceTransformer(SBERT_MODEL, device="cpu")

    pass_docs = (
        session.query(Document)
        .filter(Document.result_label == ResultLabel.PASS)
        .limit(target_pairs * 2)
        .all()
    )

    created = 0
    for doc in pass_docs:
        if created >= target_pairs:
            break
        chosen = doc.parsed_markdown or ""
        if len(chosen) < 200:
            continue

        rejected = None
        for attempt in range(MAX_RETRIES):
            candidate = await generate_rejected(vllm, chosen, doc.org_type.value)
            embs = sbert.encode([chosen, candidate], convert_to_tensor=True)
            sim = float(util.cos_sim(embs[0], embs[1]).item())

            if sim < SIMILARITY_UPPER:
                rejected = candidate
                break
            print(f"  [retry {attempt+1}] sim={sim:.3f} too high, regenerating…")

        if not rejected:
            print(f"  [skip] doc {doc.id}: could not generate sufficiently different rejected")
            continue

        record = TrainingDataset(
            dataset_type=DatasetType.DPO,
            source_doc_id=doc.id,
            prompt=f"[JD 기반 자기소개서 작성]\n회사: {doc.company_name or '미지정'}\n유형: {doc.org_type.value}",
            chosen=chosen,
            rejected=rejected,
        )
        session.add(record)
        created += 1
        if created % 10 == 0:
            session.commit()
            print(f"  {created}/{target_pairs} DPO 페어 생성됨")

    session.commit()
    session.close()
    print(f"\n✅ DPO 데이터셋 {created}건 생성 완료")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--target_pairs", type=int, default=300)
    args = parser.parse_args()
    asyncio.run(main(args.target_pairs))
