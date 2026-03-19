# ME — AI 취업 준비 플랫폼

로컬 LLM 기반 취업 준비 통합 모노레포. 기업 분석 → 자소서 생성 → 면접 준비까지 하나의 흐름.

---

## 프로젝트 구성

| 서브 프로젝트 | 위치 | 설명 |
|---|---|---|
| **JasoS** | `app/` `front/` | AI 취업 준비 통합 플랫폼 |
| **DocMaster AI** | `docmaster/` | LLM 기반 취업 문서 자동 평가·개선 시스템 |

---

## 기술 스택

### JasoS

| 영역 | 스택 |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS, Shadcn/ui |
| **BFF** | Node.js, tRPC v11, Drizzle ORM |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2 |
| **LLM** | Ollama (`qwen3-next:80b`) / OpenAI GPT (선택) |
| **문서 파싱** | Docling, pyhwp, python-docx, pypdf, pytesseract |
| **DB** | SQLite (개발) / MySQL 8 (프로덕션) |
| **외부 API** | DART (전자공시), NPS (국민연금) |

### DocMaster AI

| 영역 | 스택 |
|---|---|
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2, Alembic |
| **LLM** | vLLM + Qwen3.5-4B AWQ (GTX 1660S 6GB) |
| **벡터 검색** | ChromaDB, SBERT, BM25 |
| **학습 파이프라인** | SFT → DPO → LoRA → AWQ (Google Colab) |
| **DB** | PostgreSQL 16, Redis |
| **자동 배포** | Google Drive → 로컬 vLLM 핫스왑 |

---

## JasoS 주요 기능

**기업 분석** — DART·NPS API + 웹 크롤러 → LLM SWOT 분석

**자소서 작성** — 합격 자소서 스타일 학습 → 기업/직무 맞춤 생성 → 글자수 자동 조절

**면접 준비** — 자소서 + 기업 데이터 기반 예상 질문 및 답변 전략 생성

**경험 구조화** — 파일 업로드(PDF·DOCX·HWP) → LLM이 STAR 기법으로 자동 분류

### 아키텍처

```
React 19 (Vite)
    ↕ tRPC
Node.js BFF (tRPC + Drizzle + MySQL)
    ↕ REST
FastAPI (SQLAlchemy + SQLite)
    ↕
Ollama / OpenAI
```

### 지원 파일 형식

`.pdf` `.docx` `.doc` `.hwp` `.hwpx` `.pptx` `.txt` `.md` `.png` `.jpg`

---

## DocMaster AI 핵심 개념

| 개념 | 설명 |
|---|---|
| **LLM-as-a-Judge** | 요구충족도·구조·표현력·구체성·차별화 5개 척도 가중 평가 |
| **Gleaning Loop** | Judge 피드백 → 단락 재작성 → 재평가 (최대 5회) |
| **BM25 + SBERT** | 하이브리드 갭 분석 + 할루시네이션 드리프트 감지 |
| **SFT + DPO** | 합격 문서 스타일 미세조정 후 vLLM 자동 이식 |

### 실행 환경

| 컴포넌트 | 환경 | 포트 |
|---|---|---|
| FastAPI | Windows 네이티브 | 9000 |
| vLLM (Qwen3.5-4B AWQ) | Docker | 8000 |
| PostgreSQL 16 | Windows 네이티브 | 5432 |
| Redis | Windows 네이티브 | 6379 |
| ChromaDB | Windows 네이티브 | 8100 |

---

## 빠른 시작

### JasoS

```bash
# Python 백엔드
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
./start.sh                    # :8000

# Node.js BFF + 프론트엔드
cd front && npm install && npm run dev   # :5173
```

`.env` 설정:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3-next:80b
DART_API_KEY=
NPS_API_KEY=
DATABASE_URL=sqlite:///./data/db/jasos.db
```

### DocMaster AI

```powershell
cd docmaster
.\setup_windows.ps1
uvicorn app.main:app --host 0.0.0.0 --port 9000
```

`docmaster/.env` 설정:

```env
POSTGRES_PASSWORD=your_pw
VLLM_BASE_URL=http://localhost:8000
MODEL_NAME=cyankiwi/Qwen3.5-4B-Instruct-AWQ-4bit
DART_API_KEY=
HF_TOKEN=
```

---

## 레포지토리 구조

```
ME/
├── app/                  # JasoS Python Backend (FastAPI)
│   ├── core/             # DB, Config, 설정
│   ├── shared/           # 파일 파싱, 업로드 공통 로직
│   └── modules/          # analysis / learning / writing / interview / style
├── front/                # JasoS Frontend + BFF
│   ├── client/src/       # React 페이지 & 컴포넌트
│   └── server/           # tRPC 라우터, LLM 헬퍼, Drizzle
├── front-svelte/         # SvelteKit 버전 (실험적)
├── docmaster/            # DocMaster AI
│   ├── app/              # FastAPI (서비스, 프롬프트, API)
│   ├── training/         # Colab SFT/DPO 파이프라인
│   └── scripts/          # 자동 배포 데몬
├── RAG/                  # 재무 문서 RAG 챗봇 (독립)
└── requirements.txt
```

---

## API 문서

- JasoS: `http://localhost:8000/docs`
- DocMaster: `http://localhost:9000/docs`

---

MIT License
