<div align="center">

# 🗂 ME — AI 취업 준비 플랫폼

**로컬 LLM 기반 취업 준비 통합 모노레포**
기업 분석 → 자소서 생성 → 면접 준비까지 하나의 흐름

<br/>

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Ollama](https://img.shields.io/badge/Ollama-qwen3--next:80b-black?style=flat-square&logo=ollama&logoColor=white)](https://ollama.ai)
[![vLLM](https://img.shields.io/badge/vLLM-Qwen3.5--4B_AWQ-orange?style=flat-square)](https://vllm.ai)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

<br/>

[**JasoS**](#-jasos) · [**DocMaster AI**](#-docmaster-ai) · [**빠른 시작**](#-빠른-시작) · [**구조**](#-레포지토리-구조)

</div>

---

## 프로젝트 구성

| | 서브 프로젝트 | 위치 | 설명 |
|---|---|---|---|
| 🎯 | **JasoS** | `app/` `front/` | AI 취업 준비 통합 플랫폼 |
| 📄 | **DocMaster AI** | `docmaster/` | LLM 기반 문서 자동 평가·개선 시스템 |
| 🤖 | **RAG 챗봇** | `RAG/` | 재무 문서 RAG 챗봇 (독립 모듈) |

---

## 🎯 JasoS

<details>
<summary><b>⚙️ 기술 스택</b></summary>

<br/>

| 영역 | 스택 |
|---|---|
| **Frontend** | ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Shadcn](https://img.shields.io/badge/Shadcn%2Fui-000?style=flat-square) |
| **BFF** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![tRPC](https://img.shields.io/badge/tRPC_v11-2596BE?style=flat-square) ![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logoColor=black) |
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy_2-D71F00?style=flat-square) |
| **LLM** | ![Ollama](https://img.shields.io/badge/Ollama-qwen3--next:80b-black?style=flat-square) ![OpenAI](https://img.shields.io/badge/OpenAI-optional-412991?style=flat-square&logo=openai) |
| **문서 파싱** | ![Docling](https://img.shields.io/badge/Docling-dual--path-blue?style=flat-square) `pyhwp` `python-docx` `pypdf` `pytesseract` |
| **DB** | ![SQLite](https://img.shields.io/badge/SQLite-개발-003B57?style=flat-square&logo=sqlite) ![MySQL](https://img.shields.io/badge/MySQL_8-프로덕션-4479A1?style=flat-square&logo=mysql&logoColor=white) |
| **외부 API** | DART (전자공시) · NPS (국민연금) |

</details>

<details>
<summary><b>🔑 주요 기능</b></summary>

<br/>

**기업 분석**
- DART·NPS API 자동 수집 (공시 정보·직원수·월평균 급여·입퇴사 통계)
- 웹 크롤러 + LLM SWOT 종합 분석

**자소서 작성**
- 합격 자소서 문체 학습 → 스타일 프로파일 생성
- 기업 분석 데이터 + 스타일 + 경험 소재 → RAG 기반 맞춤 생성
- 항목별 글자수 자동 조절

**면접 준비**
- 자소서 + 기업 데이터 기반 예상 질문 생성
- 질문별 답변 프레임워크 및 핵심 포인트 제공

**경험 구조화 (STAR)**
- 파일 업로드 → LLM이 STAR 기법으로 자동 분류
- 리더십·창의성·분석력 등 성향 점수 산출
- 자소서 생성 시 RAG로 즉시 활용

</details>

<details>
<summary><b>📐 아키텍처</b></summary>

<br/>

```
┌─────────────────────────────────────┐
│        React 19 + Vite (SPA)        │
└──────────────┬──────────────────────┘
               │ tRPC (type-safe RPC)
┌──────────────▼──────────────────────┐
│   Node.js BFF  │  tRPC · Drizzle    │
│                │  MySQL · Auth      │
└──────────────┬──────────────────────┘
               │ REST API
┌──────────────▼──────────────────────┐
│   FastAPI  │  SQLAlchemy · SQLite   │
│            │  Docling · pyhwp       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Ollama (qwen3-next:80b)           │
│   OpenAI GPT (선택)                  │
└─────────────────────────────────────┘
```

</details>

<details>
<summary><b>📁 지원 파일 형식</b></summary>

<br/>

| 형식 | 파서 |
|---|---|
| `.hwp` `.hwpx` | pyhwp API → hwp5txt CLI |
| `.pdf` | Docling → pypdf |
| `.docx` | Docling → python-docx |
| `.doc` | antiword → Docling |
| `.pptx` | python-pptx |
| `.txt` `.md` | 직접 읽기 |
| `.png` `.jpg` `.jpeg` | pytesseract OCR (kor+eng) |

> 모든 형식은 Docling(레이아웃 인식) + Native(원시 추출) **이중 경로**로 처리 후 유사도 기반 자동 병합

</details>

---

## 📄 DocMaster AI

<details>
<summary><b>⚙️ 기술 스택</b></summary>

<br/>

| 영역 | 스택 |
|---|---|
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy_2-D71F00?style=flat-square) ![Alembic](https://img.shields.io/badge/Alembic-6BA81E?style=flat-square) |
| **LLM** | ![vLLM](https://img.shields.io/badge/vLLM-Docker-orange?style=flat-square) `Qwen3.5-4B AWQ` (GTX 1660S 6GB) |
| **벡터 검색** | ![ChromaDB](https://img.shields.io/badge/ChromaDB-FF6B35?style=flat-square) SBERT · BM25 |
| **학습** | SFT → DPO → LoRA → AWQ (Google Colab) |
| **DB** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white) |
| **자동 배포** | Google Drive 감지 → Docker vLLM 핫스왑 |

</details>

<details>
<summary><b>🔑 핵심 개념</b></summary>

<br/>

| 개념 | 설명 |
|---|---|
| **LLM-as-a-Judge** | 요구충족도·구조·표현력·구체성·차별화 5개 척도 가중 평가 |
| **Gleaning Loop** | Judge 피드백 → 단락 재작성 → 재평가 (최대 5회 반복) |
| **BM25 + SBERT** | 하이브리드 갭 분석 + 할루시네이션 드리프트 감지 |
| **SFT + DPO** | 합격 문서 스타일 미세조정 |
| **자동 배포** | Colab 학습 완료 → Google Drive → 로컬 vLLM 자동 이식 |

</details>

<details>
<summary><b>🖥️ 실행 환경</b></summary>

<br/>

| 컴포넌트 | 환경 | 포트 |
|---|---|---|
| FastAPI | Windows 네이티브 | `9000` |
| vLLM (Qwen3.5-4B AWQ) | Docker | `8000` |
| PostgreSQL 16 | Windows 네이티브 | `5432` |
| Redis | Windows 네이티브 | `6379` |
| ChromaDB | Windows 네이티브 | `8100` |

</details>

---

## 🚀 빠른 시작

<details>
<summary><b>JasoS 설치 및 실행</b></summary>

<br/>

**사전 요구사항**

- Python 3.11+
- Node.js 18+
- Ollama 실행 중 (`ollama run qwen3-next:80b`)
- `pip install pyhwp` — HWP 파일 지원 시

**백엔드**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./start.sh                    # http://localhost:8000
```

**프론트엔드**

```bash
cd front
npm install
npm run dev                   # http://localhost:5173
```

**`.env`**

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3-next:80b
OPENAI_API_KEY=               # 선택
DART_API_KEY=
NPS_API_KEY=
DATABASE_URL=sqlite:///./data/db/jasos.db
```

📖 API 문서: `http://localhost:8000/docs`

</details>

<details>
<summary><b>DocMaster AI 설치 및 실행</b></summary>

<br/>

**사전 요구사항**

- Windows 11, Python 3.11+, Docker Desktop
- NVIDIA GPU (GTX 1660S 이상)

```powershell
cd docmaster
.\setup_windows.ps1
uvicorn app.main:app --host 0.0.0.0 --port 9000
```

**`docmaster/.env`**

```env
POSTGRES_PASSWORD=your_pw
VLLM_BASE_URL=http://localhost:8000
MODEL_NAME=cyankiwi/Qwen3.5-4B-Instruct-AWQ-4bit
DART_API_KEY=
HF_TOKEN=
```

**Colab 학습 → 자동 배포**

```python
# Google Colab에서 실행
from google.colab import drive; drive.mount('/content/drive')
exec(open('/content/drive/MyDrive/docmaster/training/deploy_pipeline.py').read())
# 완료 시 로컬 deploy_local.ps1 데몬이 vLLM 자동 교체
```

📖 API 문서: `http://localhost:9000/docs`

</details>

---

## 📁 레포지토리 구조

<details>
<summary><b>전체 구조 보기</b></summary>

<br/>

```
ME/
├── app/                  # JasoS — Python Backend
│   ├── core/             # DB, Config
│   ├── shared/           # 파일 파싱, 업로드 공통
│   └── modules/
│       ├── analysis/     # JD 분석, DART/NPS
│       ├── learning/     # 스타일 학습, 합격 예시
│       ├── writing/      # 자소서 생성, 버전 관리
│       ├── interview/    # 면접 질문 생성
│       └── style/        # 스타일 프로파일 CRUD
│
├── front/                # JasoS — Frontend + BFF
│   ├── client/src/       # React 페이지 & 컴포넌트
│   └── server/           # tRPC 라우터, LLM 헬퍼
│
├── front-svelte/         # SvelteKit 버전 (실험적)
│
├── docmaster/            # DocMaster AI
│   ├── app/
│   │   ├── services/     # vLLM, 파서, Judge, Writer, Gleaning
│   │   ├── prompts/      # 프롬프트 템플릿
│   │   └── api/v1/       # REST 엔드포인트
│   ├── training/         # Colab SFT/DPO 파이프라인
│   └── scripts/          # 자동 배포 데몬
│
├── RAG/                  # 재무 문서 RAG 챗봇
└── requirements.txt
```

</details>

---

<div align="center">

MIT License · Made with ☕

</div>
