# === DocMaster AI Windows 11 Setup Script ===
# PowerShell 관리자 권한으로 실행: Right-click PowerShell → "Run as Administrator"

$PROJECT = "C:\docmaster"

Write-Host "=== DocMaster AI 설치 시작 ===" -ForegroundColor Cyan

# 1. 프로젝트 디렉토리
New-Item -ItemType Directory -Force -Path $PROJECT | Out-Null
New-Item -ItemType Directory -Force -Path "$PROJECT\data\uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "$PROJECT\data\models" | Out-Null
Set-Location $PROJECT
Write-Host "[1/7] 디렉토리 생성 완료" -ForegroundColor Green

# 2. Python 가상환경
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
Write-Host "[2/7] Python 가상환경 + 패키지 설치 완료" -ForegroundColor Green

# 3. .env 파일 초기화 (없을 경우)
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[3/7] .env 생성됨 — 비밀번호/토큰을 직접 수정하세요" -ForegroundColor Yellow
} else {
    Write-Host "[3/7] .env 이미 존재함" -ForegroundColor Green
}

# 4. PostgreSQL DB 생성
Write-Host "[4/7] PostgreSQL 설정..." -ForegroundColor Cyan
$env:PGPASSWORD = "postgres"   # postgres 슈퍼유저 비밀번호 (설치 시 설정한 것)
psql -U postgres -c "CREATE USER docmaster WITH PASSWORD 'your_pw';" 2>$null
psql -U postgres -c "CREATE DATABASE docmaster_db OWNER docmaster;" 2>$null
Write-Host "[4/7] PostgreSQL DB 생성 완료 (이미 존재하면 무시)" -ForegroundColor Green

# 5. ChromaDB 서버 (백그라운드)
Write-Host "[5/7] ChromaDB 서버 시작..." -ForegroundColor Cyan
Start-Process python -ArgumentList "-m chromadb.cli.cli run --host 0.0.0.0 --port 8100 --path $PROJECT\data\chroma_db" -WindowStyle Minimized
Write-Host "[5/7] ChromaDB 서버 시작됨 (port 8100)" -ForegroundColor Green

# 6. Docker vLLM 시작
Write-Host "[6/7] vLLM Docker 컨테이너 시작 (첫 실행 시 모델 다운로드 2~5분 소요)..." -ForegroundColor Cyan
docker compose up -d
Write-Host "[6/7] vLLM Docker 시작 명령 실행됨" -ForegroundColor Green

# 7. Alembic 마이그레이션
Write-Host "[7/7] DB 스키마 마이그레이션..." -ForegroundColor Cyan
Start-Sleep -Seconds 5  # DB 서비스 안정화 대기
alembic upgrade head
Write-Host "[7/7] DB 마이그레이션 완료" -ForegroundColor Green

Write-Host ""
Write-Host "=== 설치 완료 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "vLLM 로드 확인 (모델 다운로드 완료 후):" -ForegroundColor Yellow
Write-Host "  Invoke-RestMethod http://localhost:8000/v1/models"
Write-Host ""
Write-Host "FastAPI 서버 시작:" -ForegroundColor Yellow
Write-Host "  uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload"
Write-Host ""
Write-Host "API 문서: http://localhost:9000/docs" -ForegroundColor Cyan
