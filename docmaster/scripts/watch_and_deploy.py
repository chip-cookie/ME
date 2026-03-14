"""
DocMaster AI — 로컬 자동 배포 데몬
====================================
Google Drive의 deploy_manifest.json을 주기적으로 폴링하여
새 버전이 감지되면 자동으로:
  1. AWQ 모델 전체 다운로드
  2. SHA-256 무결성 검증
  3. docker-compose .env 패치 (MODEL_PATH)
  4. docker compose restart
  5. vLLM 헬스체크 (최대 5분)
  6. 스모크 테스트 (1문장 생성)
  7. deploy_status.json 결과 기록

사전 요구사항:
  pip install google-api-python-client google-auth-oauthlib
  → scripts/gdrive_auth.py 를 먼저 실행하여 token.json 생성

사용법:
  python scripts/watch_and_deploy.py             # 데몬 모드 (60초 폴링)
  python scripts/watch_and_deploy.py --once      # 한 번만 확인 후 종료
  python scripts/watch_and_deploy.py --interval 120  # 폴링 간격 변경
"""

import os
import sys
import json
import time
import shutil
import hashlib
import logging
import argparse
import subprocess
import traceback
from datetime import datetime, timezone
from pathlib import Path

import httpx
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# ---------------------------------------------------------------------------
# 설정
# ---------------------------------------------------------------------------
BASE_DIR        = Path(__file__).parent.parent          # docmaster/ 루트
MODELS_DIR      = BASE_DIR / "data" / "models"
ENV_FILE        = BASE_DIR / ".env"
COMPOSE_FILE    = BASE_DIR / "docker-compose.yml"
STATUS_FILE     = BASE_DIR / "data" / "deploy_status.json"
LAST_MANIFEST   = BASE_DIR / "data" / "last_manifest.json"
TOKEN_FILE      = Path(__file__).parent / "token.json"
CREDENTIALS     = Path(__file__).parent / "credentials.json"
SCOPES          = ["https://www.googleapis.com/auth/drive.readonly"]

VLLM_URL        = os.getenv("VLLM_BASE_URL", "http://localhost:8000")
POLL_INTERVAL   = 60          # 기본 폴링 간격(초)
HEALTH_TIMEOUT  = 300         # vLLM 헬스체크 최대 대기(초)
HEALTH_INTERVAL = 10          # 헬스체크 재시도 간격(초)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(BASE_DIR / "data" / "deploy.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("deploy")


# ---------------------------------------------------------------------------
# Google Drive 인증
# ---------------------------------------------------------------------------
def _get_drive_service():
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CREDENTIALS.exists():
                raise FileNotFoundError(
                    f"credentials.json 없음: {CREDENTIALS}\n"
                    "Google Cloud Console에서 OAuth2 자격증명을 다운로드하고\n"
                    "scripts/credentials.json 에 저장하세요."
                )
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_FILE.write_text(creds.to_json())
    return build("drive", "v3", credentials=creds, cache_discovery=False)


# ---------------------------------------------------------------------------
# Manifest 가져오기
# ---------------------------------------------------------------------------
def _fetch_manifest(service) -> dict | None:
    """Drive에서 deploy_manifest.json 내용을 dict로 반환"""
    try:
        q = "name='deploy_manifest.json' and trashed=false"
        results = service.files().list(q=q, fields="files(id, modifiedTime)", orderBy="modifiedTime desc").execute()
        files = results.get("files", [])
        if not files:
            return None
        file_id = files[0]["id"]
        import io
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, service.files().get_media(fileId=file_id))
        done = False
        while not done:
            _, done = downloader.next_chunk()
        fh.seek(0)
        return json.loads(fh.read().decode("utf-8"))
    except Exception as e:
        log.warning("Manifest 조회 실패: %s", e)
        return None


def _is_new_version(manifest: dict) -> bool:
    """마지막 배포 버전과 비교"""
    if not LAST_MANIFEST.exists():
        return True
    last = json.loads(LAST_MANIFEST.read_text(encoding="utf-8"))
    return manifest.get("version") != last.get("version")


# ---------------------------------------------------------------------------
# 모델 다운로드
# ---------------------------------------------------------------------------
def _download_model(service, manifest: dict) -> Path:
    """Drive 폴더의 모든 파일을 로컬 models/ 에 다운로드하고 경로 반환"""
    import io

    model_name   = manifest["model_name"]
    folder_id    = manifest["drive_folder_id"]
    target_dir   = MODELS_DIR / model_name
    target_dir.mkdir(parents=True, exist_ok=True)

    log.info("모델 다운로드 시작: %s → %s", model_name, target_dir)

    # Drive 폴더 내 파일 목록
    q = f"'{folder_id}' in parents and trashed=false"
    files = service.files().list(q=q, fields="files(id,name,size)").execute().get("files", [])

    total = len(files)
    for i, f in enumerate(files, 1):
        dest = target_dir / f["name"]
        log.info("  [%d/%d] %s (%s KB)", i, total, f["name"], int(f.get("size", 0)) // 1024)
        fh = io.FileIO(str(dest), mode="wb")
        downloader = MediaIoBaseDownload(fh, service.files().get_media(fileId=f["id"]))
        done = False
        while not done:
            status, done = downloader.next_chunk()
        fh.close()

    log.info("다운로드 완료: %d개 파일", total)
    return target_dir


def _verify_checksum(model_dir: Path, expected: str) -> bool:
    h = hashlib.sha256()
    for fpath in sorted(model_dir.rglob("*")):
        if fpath.is_file():
            h.update(fpath.read_bytes())
    actual = h.hexdigest()
    if actual != expected:
        log.error("SHA-256 불일치!\n  expected: %s\n  actual:   %s", expected, actual)
        return False
    log.info("SHA-256 검증 통과: %s...", actual[:32])
    return True


# ---------------------------------------------------------------------------
# docker-compose .env 패치
# ---------------------------------------------------------------------------
def _patch_env(model_name: str, vllm_command: str):
    """
    .env 파일의 MODEL_PATH를 업데이트하고
    docker-compose.yml이 ${MODEL_PATH}를 참조하도록 합니다.
    """
    model_path = f"/models/{model_name}"
    env_lines  = ENV_FILE.read_text(encoding="utf-8").splitlines() if ENV_FILE.exists() else []

    # MODEL_PATH 라인 업데이트 또는 추가
    new_lines, updated = [], False
    for line in env_lines:
        if line.startswith("MODEL_PATH="):
            new_lines.append(f"MODEL_PATH={model_path}")
            updated = True
        else:
            new_lines.append(line)
    if not updated:
        new_lines.append(f"MODEL_PATH={model_path}")

    ENV_FILE.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    log.info(".env 업데이트: MODEL_PATH=%s", model_path)


# ---------------------------------------------------------------------------
# Docker 재시작
# ---------------------------------------------------------------------------
def _docker_restart():
    log.info("Docker vLLM 컨테이너 재시작...")
    project_dir = str(BASE_DIR)

    down = subprocess.run(
        ["docker", "compose", "down"],
        cwd=project_dir, capture_output=True, text=True
    )
    if down.returncode != 0:
        log.warning("docker compose down 경고: %s", down.stderr[:200])

    up = subprocess.run(
        ["docker", "compose", "up", "-d"],
        cwd=project_dir, capture_output=True, text=True
    )
    if up.returncode != 0:
        raise RuntimeError(f"docker compose up 실패:\n{up.stderr}")
    log.info("컨테이너 시작 명령 완료")


# ---------------------------------------------------------------------------
# vLLM 헬스체크
# ---------------------------------------------------------------------------
def _wait_for_vllm(timeout: int = HEALTH_TIMEOUT) -> bool:
    log.info("vLLM 헬스체크 대기 (최대 %ds)...", timeout)
    deadline = time.time() + timeout
    attempt  = 0
    while time.time() < deadline:
        attempt += 1
        try:
            r = httpx.get(f"{VLLM_URL}/v1/models", timeout=5)
            if r.status_code == 200:
                models = r.json().get("data", [])
                log.info("vLLM 준비 완료 (시도 %d) | 모델: %s", attempt, [m["id"] for m in models])
                return True
        except Exception:
            pass
        remaining = int(deadline - time.time())
        log.info("  대기 중... (%ds 남음, 시도 %d)", remaining, attempt)
        time.sleep(HEALTH_INTERVAL)
    log.error("vLLM 헬스체크 타임아웃 (%ds)", timeout)
    return False


# ---------------------------------------------------------------------------
# 스모크 테스트
# ---------------------------------------------------------------------------
def _smoke_test(model_name: str) -> bool:
    """vLLM에 짧은 생성 요청을 보내 정상 작동 확인"""
    log.info("스모크 테스트 시작...")
    try:
        payload = {
            "model": f"/models/{model_name}",
            "messages": [
                {"role": "system", "content": "한국어로 답변하세요."},
                {"role": "user",   "content": "안녕하세요. 자기소개서 작성을 도와주세요."},
            ],
            "max_tokens": 64,
            "temperature": 0.1,
        }
        r = httpx.post(f"{VLLM_URL}/v1/chat/completions", json=payload, timeout=60)
        if r.status_code == 200:
            reply = r.json()["choices"][0]["message"]["content"]
            log.info("스모크 테스트 통과 | 응답: %s...", reply[:80])
            return True
        log.error("스모크 테스트 실패: HTTP %d | %s", r.status_code, r.text[:200])
        return False
    except Exception as e:
        log.error("스모크 테스트 예외: %s", e)
        return False


# ---------------------------------------------------------------------------
# 상태 기록
# ---------------------------------------------------------------------------
def _write_status(manifest: dict, success: bool, detail: str = ""):
    STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
    status = {
        "last_deploy_at": datetime.now(timezone.utc).isoformat(),
        "version": manifest.get("version"),
        "model_name": manifest.get("model_name"),
        "success": success,
        "detail": detail,
        "training_metrics": manifest.get("training_metrics", {}),
    }
    STATUS_FILE.write_text(json.dumps(status, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info("상태 기록: %s", STATUS_FILE)


# ---------------------------------------------------------------------------
# 메인 배포 루틴
# ---------------------------------------------------------------------------
def deploy_once(service) -> bool:
    manifest = _fetch_manifest(service)
    if manifest is None:
        log.info("deploy_manifest.json 없음. 대기 중...")
        return False

    if manifest.get("status") != "ready":
        log.info("Manifest 상태 '%s' → 건너뜀", manifest.get("status"))
        return False

    if not _is_new_version(manifest):
        log.info("이미 최신 버전 배포됨: %s", manifest.get("version"))
        return False

    version    = manifest["version"]
    model_name = manifest["model_name"]
    log.info("=" * 60)
    log.info("새 버전 감지: %s", version)
    log.info("모델명: %s", model_name)
    log.info("학습 지표: %s", manifest.get("training_metrics", {}))
    log.info("=" * 60)

    try:
        # 1. 다운로드
        model_dir = _download_model(service, manifest)

        # 2. SHA-256 검증
        if not _verify_checksum(model_dir, manifest["sha256"]):
            log.error("무결성 검증 실패 — 배포 취소")
            shutil.rmtree(model_dir, ignore_errors=True)
            _write_status(manifest, False, "checksum mismatch")
            return False

        # 3. .env 패치
        _patch_env(model_name, manifest["vllm_command"])

        # 4. Docker 재시작
        _docker_restart()

        # 5. 헬스체크
        if not _wait_for_vllm():
            _write_status(manifest, False, "health check timeout")
            return False

        # 6. 스모크 테스트
        if not _smoke_test(model_name):
            _write_status(manifest, False, "smoke test failed")
            return False

        # 7. 성공 기록
        LAST_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        LAST_MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
        _write_status(manifest, True)

        log.info("=" * 60)
        log.info("배포 성공! 버전: %s", version)
        log.info("모델: %s", model_name)
        log.info("=" * 60)
        return True

    except Exception:
        log.error("배포 중 예외:\n%s", traceback.format_exc())
        _write_status(manifest, False, traceback.format_exc()[:500])
        return False


# ---------------------------------------------------------------------------
# 엔트리포인트
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="DocMaster AI 자동 배포 데몬")
    parser.add_argument("--once",     action="store_true", help="한 번만 확인 후 종료")
    parser.add_argument("--interval", type=int, default=POLL_INTERVAL, help="폴링 간격(초)")
    args = parser.parse_args()

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    (BASE_DIR / "data").mkdir(parents=True, exist_ok=True)

    log.info("DocMaster AI 배포 데몬 시작")
    log.info("  vLLM: %s", VLLM_URL)
    log.info("  폴링 간격: %ds", args.interval)
    log.info("  토큰: %s", TOKEN_FILE)

    service = _get_drive_service()

    if args.once:
        deploy_once(service)
        return

    while True:
        try:
            deploy_once(service)
        except Exception:
            log.error("폴링 루프 예외:\n%s", traceback.format_exc())
        log.info("다음 폴링까지 %ds 대기...", args.interval)
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
