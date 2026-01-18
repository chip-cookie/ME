#!/bin/bash
cd "$(dirname "$0")"

# 가상환경 자동 생성 및 활성화
if [ ! -d ".venv" ]; then
    echo "🔧 가상환경 생성 중..."
    python3 -m venv .venv
    source .venv/bin/activate
    echo "📦 의존성 설치 중..."
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

echo "🚀 서버 시작..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
