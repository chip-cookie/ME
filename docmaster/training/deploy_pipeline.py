"""
DocMaster AI — Colab 완전 자동 배포 파이프라인
==============================================
실행 환경: Google Colab Pro (T4 16GB)

사용법:
  Cell 1:  !pip install -q autoawq trl peft transformers datasets google-api-python-client
  Cell 2:  from google.colab import drive; drive.mount('/content/drive')
  Cell 3:  exec(open('/content/drive/MyDrive/docmaster/training/deploy_pipeline.py').read())

흐름: SFT → DPO → LoRA 병합 → AWQ 변환 → Google Drive 업로드 → deploy_manifest.json 기록
로컬 watch_and_deploy.py가 manifest를 감지하면 자동으로 vLLM에 이식합니다.
"""

import os, json, hashlib, shutil, time, traceback
from datetime import datetime, timezone
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TrainingArguments
from peft import LoraConfig, PeftModel
from trl import SFTTrainer, DPOTrainer, SFTConfig, DPOConfig
from datasets import load_dataset
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.colab import auth

# ---------------------------------------------------------------------------
# 0. 설정 — 필요 시 여기만 수정
# ---------------------------------------------------------------------------
BASE_MODEL       = "Qwen/Qwen2.5-3B-Instruct"
DRIVE_ROOT       = "/content/drive/MyDrive/docmaster"
SFT_DATA         = f"{DRIVE_ROOT}/sft_data.jsonl"
DPO_DATA         = f"{DRIVE_ROOT}/dpo_data.jsonl"
MODEL_VERSION    = datetime.now(timezone.utc).strftime("v%Y%m%d_%H%M")
MODEL_NAME       = f"qwen35-4b-docmaster-awq-{MODEL_VERSION}"
DRIVE_MODELS_DIR = f"{DRIVE_ROOT}/models/{MODEL_NAME}"
MANIFEST_PATH    = f"{DRIVE_ROOT}/deploy_manifest.json"

# vLLM에서 사용할 명령 (로컬 /models/<name> 경로)
VLLM_COMMAND = (
    f"--model /models/{MODEL_NAME} "
    "--quantization awq "
    "--max-model-len 4096 "
    "--gpu-memory-utilization 0.85 "
    "--dtype half "
    "--port 8000"
)

# ---------------------------------------------------------------------------
# 유틸리티
# ---------------------------------------------------------------------------
def log(tag: str, msg: str):
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
    print(f"[{ts}] [{tag}] {msg}")


def sha256_dir(directory: str) -> str:
    """디렉토리 내 모든 파일의 SHA-256 합산 해시"""
    h = hashlib.sha256()
    for fpath in sorted(Path(directory).rglob("*")):
        if fpath.is_file():
            h.update(fpath.read_bytes())
    return h.hexdigest()


# ---------------------------------------------------------------------------
# 1. 4-bit 양자화 설정 + 모델 로드 (학습용 BnB)
# ---------------------------------------------------------------------------
log("LOAD", f"Base model: {BASE_MODEL}")
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
)
model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL, quantization_config=bnb_config, device_map="auto", trust_remote_code=True
)
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token
log("LOAD", "모델 로드 완료")

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
# 3. SFT 학습
# ---------------------------------------------------------------------------
log("SFT", "학습 시작")
sft_dataset = load_dataset("json", data_files=SFT_DATA, split="train")
sft_trainer = SFTTrainer(
    model=model,
    train_dataset=sft_dataset,
    peft_config=lora_config,
    args=SFTConfig(
        output_dir="/content/sft_results",
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        save_steps=100,
        max_seq_length=2048,
    ),
)
sft_train_result = sft_trainer.train()
sft_trainer.save_model("/content/sft_results/final")
sft_loss = round(sft_train_result.training_loss, 4)
log("SFT", f"완료 | loss={sft_loss}")

# ---------------------------------------------------------------------------
# 4. DPO 학습
# ---------------------------------------------------------------------------
log("DPO", "학습 시작")
dpo_dataset = load_dataset("json", data_files=DPO_DATA, split="train")
dpo_trainer = DPOTrainer(
    model=model,
    args=DPOConfig(
        output_dir="/content/dpo_results",
        num_train_epochs=3,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,
        learning_rate=5e-5,
        fp16=True,
        beta=0.1,
        logging_steps=10,
        save_steps=100,
    ),
    train_dataset=dpo_dataset,
    tokenizer=tokenizer,
)
dpo_train_result = dpo_trainer.train()
dpo_trainer.save_model("/content/dpo_results/final")
dpo_loss = round(dpo_train_result.training_loss, 4)
log("DPO", f"완료 | loss={dpo_loss}")

# ---------------------------------------------------------------------------
# 5. LoRA 병합 (BnB 해제 → float16 기반 재로드)
# ---------------------------------------------------------------------------
log("MERGE", "BnB 없이 base model 재로드 후 LoRA 병합")
base_for_merge = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL, torch_dtype=torch.float16, device_map="auto", trust_remote_code=True
)
merged_model = PeftModel.from_pretrained(base_for_merge, "/content/dpo_results/final")
merged_model = merged_model.merge_and_unload()

MERGED_PATH = "/content/merged_model"
merged_model.save_pretrained(MERGED_PATH)
tokenizer.save_pretrained(MERGED_PATH)
del merged_model, base_for_merge
torch.cuda.empty_cache()
log("MERGE", f"병합 완료 → {MERGED_PATH}")

# ---------------------------------------------------------------------------
# 6. AWQ 변환 (GTX 1660S 최적화: 4-bit, group_size=128, GEMM 커널)
# ---------------------------------------------------------------------------
log("AWQ", "양자화 시작 (4-bit GEMM, group_size=128)")
from awq import AutoAWQForCausalLM

awq_model = AutoAWQForCausalLM.from_pretrained(MERGED_PATH, safetensors=True)
awq_model.quantize(
    tokenizer,
    quant_config={
        "w_bit": 4,
        "q_group_size": 128,
        "zero_point": True,
        "version": "GEMM",       # GTX 1660S: GEMM이 GEMV보다 빠름
    },
)

AWQ_LOCAL = "/content/awq_model"
awq_model.save_quantized(AWQ_LOCAL)
tokenizer.save_pretrained(AWQ_LOCAL)
del awq_model
torch.cuda.empty_cache()
log("AWQ", f"변환 완료 → {AWQ_LOCAL}")

# ---------------------------------------------------------------------------
# 7. Google Drive 업로드
# ---------------------------------------------------------------------------
log("UPLOAD", f"대상 경로: {DRIVE_MODELS_DIR}")
os.makedirs(DRIVE_MODELS_DIR, exist_ok=True)

# Drive API 인증 (Colab 환경에서 자동 처리)
auth.authenticate_user()
drive_service = build("drive", "v3", cache_discovery=False)


def _get_or_create_folder(service, name: str, parent_id: str) -> str:
    """Drive 폴더 ID를 반환 (없으면 생성)"""
    q = f"name='{name}' and mimeType='application/vnd.google-apps.folder' and '{parent_id}' in parents and trashed=false"
    result = service.files().list(q=q, fields="files(id)").execute()
    if result["files"]:
        return result["files"][0]["id"]
    meta = {"name": name, "mimeType": "application/vnd.google-apps.folder", "parents": [parent_id]}
    return service.files().create(body=meta, fields="id").execute()["id"]


def _upload_file(service, local_path: str, folder_id: str) -> dict:
    """파일을 Drive에 업로드하고 {id, name, size} 반환"""
    name = Path(local_path).name
    size = Path(local_path).stat().st_size

    # 기존 파일 삭제 후 재업로드 (clean slate)
    q = f"name='{name}' and '{folder_id}' in parents and trashed=false"
    for f in service.files().list(q=q, fields="files(id)").execute().get("files", []):
        service.files().delete(fileId=f["id"]).execute()

    media = MediaFileUpload(local_path, resumable=True)
    meta  = {"name": name, "parents": [folder_id]}
    uploaded = service.files().create(body=meta, media_body=media, fields="id").execute()
    return {"id": uploaded["id"], "name": name, "size": size}


def _get_drive_root_id(service, drive_path: str) -> str:
    """'/content/drive/MyDrive/docmaster' → Drive folder ID"""
    # 마운트된 경로에서 폴더 이름만 추출하여 순차 탐색
    parts = drive_path.replace("/content/drive/MyDrive/", "").split("/")
    q = f"name='{parts[0]}' and 'root' in parents and mimeType='application/vnd.google-apps.folder'"
    result = service.files().list(q=q, fields="files(id)").execute()
    parent_id = result["files"][0]["id"] if result["files"] else "root"
    for part in parts[1:]:
        parent_id = _get_or_create_folder(service, part, parent_id)
    return parent_id


log("UPLOAD", "Drive 폴더 구조 확인 중...")
docmaster_folder_id = _get_drive_root_id(drive_service, DRIVE_ROOT)
model_folder_id     = _get_or_create_folder(drive_service, f"models/{MODEL_NAME}", docmaster_folder_id)

# AWQ 디렉토리의 모든 파일 업로드
uploaded_files = []
awq_files = sorted(Path(AWQ_LOCAL).rglob("*"))
total = len([f for f in awq_files if f.is_file()])
for i, fpath in enumerate([f for f in awq_files if f.is_file()], 1):
    log("UPLOAD", f"[{i}/{total}] {fpath.name} ({fpath.stat().st_size // 1024}KB)")
    uploaded_files.append(_upload_file(drive_service, str(fpath), model_folder_id))

checksum = sha256_dir(AWQ_LOCAL)
log("UPLOAD", f"업로드 완료 | {total}개 파일 | sha256={checksum[:16]}...")

# ---------------------------------------------------------------------------
# 8. deploy_manifest.json 기록 (로컬 watch_and_deploy.py가 이것을 감지)
# ---------------------------------------------------------------------------
manifest = {
    "version": MODEL_VERSION,
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "model_name": MODEL_NAME,
    "drive_folder_id": model_folder_id,
    "files": uploaded_files,
    "sha256": checksum,
    "vllm_command": VLLM_COMMAND,
    "training_metrics": {
        "sft_loss": sft_loss,
        "dpo_loss": dpo_loss,
        "base_model": BASE_MODEL,
    },
    "status": "ready",
}

# Drive에 manifest 저장
manifest_local = "/content/deploy_manifest.json"
Path(manifest_local).write_text(json.dumps(manifest, indent=2, ensure_ascii=False))

manifest_folder_id = docmaster_folder_id
q = f"name='deploy_manifest.json' and '{manifest_folder_id}' in parents and trashed=false"
for f in drive_service.files().list(q=q, fields="files(id)").execute().get("files", []):
    drive_service.files().delete(fileId=f["id"]).execute()
media  = MediaFileUpload(manifest_local, mimetype="application/json")
meta   = {"name": "deploy_manifest.json", "parents": [manifest_folder_id]}
result = drive_service.files().create(body=meta, media_body=media, fields="id").execute()

log("MANIFEST", f"deploy_manifest.json 업로드 완료 (id={result['id']})")
log("MANIFEST", f"모델 버전: {MODEL_VERSION}")
log("DONE", "=" * 60)
log("DONE", "로컬 watch_and_deploy.py가 자동으로 vLLM에 이식합니다.")
log("DONE", f"  모델명: {MODEL_NAME}")
log("DONE", f"  SFT loss: {sft_loss} | DPO loss: {dpo_loss}")
log("DONE", f"  sha256: {checksum[:32]}...")
log("DONE", "=" * 60)
