"""
PostgreSQL에서 학습 데이터를 JSONL 파일로 내보내는 스크립트.
생성된 파일을 Google Drive에 업로드한 뒤 Colab에서 학습에 사용합니다.

사용법:
  python scripts/export_training_data.py --output_dir ./data/training_export
"""

import json
import argparse
from pathlib import Path
from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.models.schema import TrainingDataset
from app.models.enums import DatasetType
from app.prompts.style_guide import SFT_TEMPLATE


def export_sft(session, output_path: Path):
    rows = session.query(TrainingDataset).filter(
        TrainingDataset.dataset_type == DatasetType.SFT
    ).all()

    records = []
    for row in rows:
        records.append({
            "text": SFT_TEMPLATE.format(
                system_prompt="당신은 한국 취업 문서 작성 전문가입니다.",
                user_prompt=row.prompt or "",
                response=row.chosen or "",
            )
        })

    out = output_path / "sft_data.jsonl"
    with open(out, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"[SFT] {len(records)}건 → {out}")


def export_dpo(session, output_path: Path):
    rows = session.query(TrainingDataset).filter(
        TrainingDataset.dataset_type == DatasetType.DPO,
        TrainingDataset.rejected.isnot(None),
    ).all()

    records = []
    for row in rows:
        sys_msg = "당신은 한국 취업 문서 작성 전문가입니다."
        prompt = SFT_TEMPLATE.format(
            system_prompt=sys_msg,
            user_prompt=row.prompt or "",
            response="",
        ).rsplit("<|im_start|>assistant\n", 1)[0] + "<|im_start|>assistant\n"

        records.append({
            "prompt": prompt,
            "chosen": row.chosen or "",
            "rejected": row.rejected or "",
        })

    out = output_path / "dpo_data.jsonl"
    with open(out, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"[DPO] {len(records)}건 → {out}")


def main():
    parser = argparse.ArgumentParser(description="Export training data from PostgreSQL")
    parser.add_argument("--output_dir", default="./data/training_export", help="Output directory")
    args = parser.parse_args()

    output_path = Path(args.output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    settings = get_settings()
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        export_sft(session, output_path)
        export_dpo(session, output_path)
        print(f"\n✅ 내보내기 완료: {output_path.resolve()}")
        print("다음 단계: Google Drive에 업로드 → Colab에서 training/colab_training.py 실행")
    finally:
        session.close()


if __name__ == "__main__":
    main()
