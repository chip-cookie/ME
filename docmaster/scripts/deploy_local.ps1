# DocMaster AI — 로컬 배포 자동화 PowerShell 래퍼
# ============================================================
# 사용법:
#   .\scripts\deploy_local.ps1             # 데몬 모드 (백그라운드 창에서 계속 실행)
#   .\scripts\deploy_local.ps1 -Once       # 한 번만 확인
#   .\scripts\deploy_local.ps1 -Status     # 마지막 배포 상태 조회
#   .\scripts\deploy_local.ps1 -Auth       # Google Drive 최초 인증 (최초 1회)
#   .\scripts\deploy_local.ps1 -Interval 120  # 폴링 간격 변경(초)

param(
    [switch]$Once,
    [switch]$Status,
    [switch]$Auth,
    [int]$Interval = 60
)

$PROJECT = Split-Path -Parent $PSScriptRoot
Set-Location $PROJECT

# 가상환경 활성화
$venv = "$PROJECT\.venv\Scripts\Activate.ps1"
if (Test-Path $venv) {
    . $venv
} else {
    Write-Host "[WARN] 가상환경 없음. 시스템 Python 사용" -ForegroundColor Yellow
}

# ------------------------------------------------------------------
# -Auth: Google Drive 최초 인증
# ------------------------------------------------------------------
if ($Auth) {
    Write-Host "=== Google Drive OAuth2 인증 ===" -ForegroundColor Cyan
    Write-Host "브라우저가 열리면 Google 계정으로 로그인하세요." -ForegroundColor Yellow
    python "$PROJECT\scripts\gdrive_auth.py"
    exit 0
}

# ------------------------------------------------------------------
# -Status: 마지막 배포 상태 조회
# ------------------------------------------------------------------
if ($Status) {
    $statusFile = "$PROJECT\data\deploy_status.json"
    if (Test-Path $statusFile) {
        Write-Host "=== 마지막 배포 상태 ===" -ForegroundColor Cyan
        Get-Content $statusFile | ConvertFrom-Json | Format-List
    } else {
        Write-Host "[INFO] 배포 이력 없음 (아직 배포된 적 없음)" -ForegroundColor Yellow
    }

    $logFile = "$PROJECT\data\deploy.log"
    if (Test-Path $logFile) {
        Write-Host "`n=== 최근 로그 (마지막 20줄) ===" -ForegroundColor Cyan
        Get-Content $logFile -Tail 20
    }
    exit 0
}

# ------------------------------------------------------------------
# token.json 존재 여부 확인
# ------------------------------------------------------------------
$tokenFile = "$PROJECT\scripts\token.json"
if (-not (Test-Path $tokenFile)) {
    Write-Host "[ERROR] token.json 없음. 먼저 인증을 완료하세요:" -ForegroundColor Red
    Write-Host "  .\scripts\deploy_local.ps1 -Auth" -ForegroundColor Yellow
    exit 1
}

# ------------------------------------------------------------------
# 데몬 or 단발 실행
# ------------------------------------------------------------------
$args_list = @("$PROJECT\scripts\watch_and_deploy.py", "--interval", $Interval)
if ($Once) {
    $args_list += "--once"
}

Write-Host "=== DocMaster AI 배포 데몬 시작 ===" -ForegroundColor Cyan
Write-Host "  모드: $(if ($Once) { '단발 실행' } else { "데몬 (${Interval}초 폴링)" })"  -ForegroundColor Green
Write-Host "  프로젝트: $PROJECT"
Write-Host "  로그: $PROJECT\data\deploy.log"
Write-Host ""
Write-Host "중지: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

python @args_list
