"""
DocMaster AI — SFT + DPO 통합 학습 스크립트
실행 환경: Google Colab Pro (T4 16GB)

사용법:
  1. Google Colab에서 노트북 열기
  2. Google Drive 마운트: drive.mount('/content/drive')
  3. 학습 데이터 업로드: /content/drive/MyDrive/docmaster/sft_data.jsonl
  4. 이 스크립트 실행
"""

import torch
from trl import SFTTrainer, DPOTrainer, SFTConfig, DPOConfig
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, PeftModel
from datasets import load_dataset


# ---------------------------------------------------------------------------
# 1. 4-bit 양자화 설정 및 모델 로드
# ---------------------------------------------------------------------------
BASE_MODEL = "Qwen/Qwen2.5-3B-Instruct"   # Hugging Face 원본 (AWQ 이전)

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
)

model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token


# ---------------------------------------------------------------------------
# 2. LoRA 설정
# ---------------------------------------------------------------------------
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)


# ---------------------------------------------------------------------------
# 3. SFT 학습 (합격 문서 스타일 학습)
# ---------------------------------------------------------------------------
sft_dataset = load_dataset(
    "json",
    data_files="/content/drive/MyDrive/docmaster/sft_data.jsonl",
    split="train",
)

sft_args = SFTConfig(
    output_dir="/content/sft_results",
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    fp16=True,
    logging_steps=10,
    save_steps=100,
    max_seq_length=2048,
)

sft_trainer = SFTTrainer(
    model=model,
    train_dataset=sft_dataset,
    peft_config=lora_config,
    args=sft_args,
)
sft_trainer.train()
sft_trainer.save_model("/content/sft_results/final")
print("[SFT] 학습 완료 → /content/sft_results/final")


# ---------------------------------------------------------------------------
# 4. DPO 학습 (Gleaning 결과로 합격/불합격 페어 학습)
# ---------------------------------------------------------------------------
dpo_dataset = load_dataset(
    "json",
    data_files="/content/drive/MyDrive/docmaster/dpo_data.jsonl",
    split="train",
)

dpo_args = DPOConfig(
    output_dir="/content/dpo_results",
    num_train_epochs=3,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    learning_rate=5e-5,
    fp16=True,
    beta=0.1,
    logging_steps=10,
    save_steps=100,
)

dpo_trainer = DPOTrainer(
    model=model,
    args=dpo_args,
    train_dataset=dpo_dataset,
    tokenizer=tokenizer,
)
dpo_trainer.train()
dpo_trainer.save_model("/content/dpo_results/final")
print("[DPO] 학습 완료 → /content/dpo_results/final")


# ---------------------------------------------------------------------------
# 5. LoRA 병합 + AWQ 변환 → Google Drive 저장
# ---------------------------------------------------------------------------
MERGED_PATH = "/content/merged_model"

merged_model = PeftModel.from_pretrained(
    AutoModelForCausalLM.from_pretrained(BASE_MODEL, torch_dtype=torch.float16, device_map="auto"),
    "/content/dpo_results/final",
)
merged_model = merged_model.merge_and_unload()
merged_model.save_pretrained(MERGED_PATH)
tokenizer.save_pretrained(MERGED_PATH)
print(f"[MERGE] LoRA 병합 완료 → {MERGED_PATH}")

# AWQ 변환 (autoawq 필요: pip install autoawq)
try:
    from awq import AutoAWQForCausalLM

    awq_model = AutoAWQForCausalLM.from_pretrained(MERGED_PATH)
    awq_model.quantize(
        tokenizer,
        quant_config={"w_bit": 4, "q_group_size": 128, "zero_point": True, "version": "GEMM"},
    )
    AWQ_SAVE = "/content/drive/MyDrive/docmaster/qwen35-4b-docmaster-awq"
    awq_model.save_quantized(AWQ_SAVE)
    tokenizer.save_pretrained(AWQ_SAVE)
    print(f"[AWQ] 양자화 완료 → {AWQ_SAVE}")
    print("Windows: C:\\docmaster\\data\\models\\ 에 복사 후 docker-compose 재시작")
except ImportError:
    print("[AWQ] autoawq 미설치. 병합 모델만 저장됨: ", MERGED_PATH)
