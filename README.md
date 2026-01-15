# JasoS - AI 기반 채용 공고 분석 및 자기소개서 작성 플랫폼

**JasoS**는 기업의 채용 공고(JD)를 AI로 심층 분석하고, 이를 바탕으로 합격 가능성을 높이는 맞춤형 자기소개서와 면접 질문을 생성해주는 지능형 플랫폼입니다.

---

## 🌟 주요 기능 (Key Features)

### 1. 📊 채용 공고(JD) 심층 분석
*   **파일 업로드**: PDF, 이미지, 텍스트 등 다양한 형식의 JD 파일 지원 (OCR 탑재)
*   **실시간 기업 분석**:
    *   **DART(전자공시 시스템)**: 매출액, 영업이익 등 재무제표 자동 시각화
    *   **국민연금(NPS) 배터리**: 총 임직원 수, **평균 연봉 추정**, 최근 3개월 입/퇴사율(이직률) 분석
*   **핵심 키워드 추출**: LLM(Ollama)이 직무에 필요한 핵심 역량과 인재상을 3줄 요약 및 태그로 추출

### 2. ✍️ AI 자기소개서 작성 (Writing)
*   **스타일 학습**: 사용자의 기존 합격 자소서를 학습하여 문체(Style)를 모방
*   **맞춤형 생성**: 분석된 JD의 핵심 키워드(`creative`, `communication` 등)를 반영하여 자소서 초안 생성
*   **실시간 글자수 계산기**: 공백 포함/제외 글자수 및 **Byte(한글 2byte)** 계산 기능 제공

### 3. 💬 면접 준비 (Interview)
*   **예상 질문 생성**: JD와 내 자소서를 바탕으로 예상되는 기술/인성 면접 질문 생성
*   **AI 면접관 챗봇**: 채용 담당자 페르소나를 가진 AI와 실시간 질의응답 가능

---

## 🛠️ 기술 스택 (Tech Stack)

### Backend
*   **Framework**: FastAPI, Uvicorn
*   **AI/LLM**: LangChain, Ollama (Llama 3.2), HuggingFace Embeddings
*   **Data Processing**: Pandas, OpenDartReader, xmltodict
*   **Database**: SQLite (SQLAlchemy ORM)

### Frontend
*   **Framework**: React (Vite)
*   **UI Library**: TailwindCSS, Shadcn/ui
*   **Visualization**: Recharts (재무 데이터 차트)
*   **State Management**: Wouter (Routing), React Hooks

---

## 🚀 설치 및 실행 가이드

### 1. 사전 요구사항 (Prerequisites)
*   Python 3.11+
*   Node.js 18+
*   **Ollama** 설치 및 모델 다운로드 (`ollama pull llama3.2`)

### 2. 백엔드 설정 (Backend Setup)

```bash
# 가상환경 생성 및 활성화
cd jasoS
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정 (.env 생성)
# DART_API_KEY, NPS_API_KEY, OLLAMA_BASE_URL 등 설정 필요
```

### 3. 프론트엔드 설정 (Frontend Setup)

```bash
cd front
npm install
```

### 4. 실행 (Run)

**백엔드 (Terminal 1)**
```bash
python -m uvicorn app.main:app --reload
```
*   Server: `http://localhost:8000`
*   Docs: `http://localhost:8000/docs`

**프론트엔드 (Terminal 2)**
```bash
cd front
npm run dev
```
*   Client: `http://localhost:5173`

---

## 🔑 환경 변수 설정 (.env)

프로젝트 루트의 `.env` 파일에 다음 정보를 입력해야 합니다.

```env
# AI Engine
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Open DART API (재무제표)
DART_API_KEY=your_dart_api_key

# 공공데이터포털 국민연금공단 API (연봉/이직률)
NPS_API_KEY=your_nps_api_key
```

---

## 📂 프로젝트 구조

```
jasoS/
├── app/                 # FastAPI Backend
│   ├── modules/         # Business Logic (Analysis, Writing, Learning)
│   └── common/          # Utilities
├── front/               # React Frontend
│   ├── client/src/pages # UI Pages (JDAnalysis, Writing, etc.)
│   └── components/      # Shared Components
├── data/                # Database & Local Storage (Ignored in Git)
├── RAG/                 # Legacy RAG Module
└── requirements.txt
```

---

## 🔒 보안 및 라이선스
*   이 프로젝트는 로컬 LLM을 사용하여 민감한 개인정보가 외부로 유출되지 않도록 설계되었습니다.
*   `data/` 및 `uploads/` 폴더는 Git 추적에서 제외되어 사용자 데이터를 보호합니다.

---

## 📦 Git Commands Log (History)

이 프로젝트를 설정하고 배포하는 데 사용된 주요 Git 명령어 기록입니다.

### 1. 초기 설정 및 리포지토리 연결
```bash
# 1. Git 초기화
git init

# 2. 사용자 정보 설정 (필요 시)
git config user.email "admin@jasos.ai"
git config user.name "JasoS Admin"

# 3. 원격 저장소 연결
git remote add origin https://github.com/chip-cookie/news.git
```

### 2. 보안 및 파일 관리 (.gitignore)
```bash
# 1. .gitignore 생성 (민감 정보 제외)
# (node_modules, .env, data/, uploads/ 등 제외 설정)

# 2. 실수로 포함된 데이터 제거 (캐시 삭제)
git rm -r --cached data/
git rm -r --cached .env

# 3. RAG 서브모듈 통합 (Nested Git 제거)
rm -rf RAG/.git
# .gitignore에서 RAG/ 제거 후
git add RAG/
```

### 3. 커밋 및 푸시
```bash
# 1. 변경사항 스테이징
git add .

# 2. 커밋
git commit -m "Update README and merge RAG module"

# 3. 원격 저장소로 푸시 (Main 브랜치)
git push -u origin main
```

> **Note**: 위 명령어들은 프로젝트 히스토리 관리를 위해 기록되었습니다. 실제 개발 시에는 `git add .`, `git commit`, `git push` 흐름을 주로 사용하게 됩니다.
