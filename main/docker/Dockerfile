# 1. Base Image: 호환성 좋은 Bullseye 유지
FROM python:3.10-bullseye

# 2. 시스템 패키지 설치
# [핵심] libjemalloc2: 메모리 충돌을 막아줄 구원투수 ⚾
# libgomp1: 병렬 처리 필수
RUN apt-get update && apt-get install -y \
    build-essential \
    libjemalloc2 \
    libgomp1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libopenblas-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 3. 환경 변수 설정 (여기가 승부처! 🚩)
# 리눅스에게 명령합니다: "메모리 관리는 무조건 jemalloc에게 맡겨라!"
# 이렇게 하면 Paddle 내부의 메모리 충돌이 사라집니다.
ENV LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libjemalloc.so.2"

WORKDIR /app

# 4. 파이썬 라이브러리 설치
# - paddlepaddle==2.6.2: 사용자님이 확인한 설치 가능한 최신 버전 사용
# - paddleocr>=2.7.3: 이에 맞춘 최신 OCR
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    "numpy<2.0.0" \
    "paddlepaddle==2.6.2" \
    "paddleocr==2.6.1.3" \
    "opencv-python-headless==4.8.0.74" \
    "pysqlite3-binary" \
    pymupdf \
    kiwipiepy \
    openai \
    chromadb \
    sentence-transformers \
    python-dotenv && \
    pip uninstall -y opencv-python opencv-contrib-python || true

COPY . .

CMD ["tail", "-f", "/dev/null"]
