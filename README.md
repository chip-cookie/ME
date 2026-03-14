# JasoS - AI 기반 취업 준비 통합 플랫폼

<div align="center">

![JasoS Hero Banner](docs/images/hero_banner.png)

**AI를 활용하여 기업 분석, 자기소개서 작성, 면접 준비를 통합 지원하는 지능형 취업 준비 플랫폼**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596BE)](https://trpc.io/)

</div>

---

## 🌟 주요 기능

### 1. 🏢 기업 분석 (Corporate Analysis)
- **DART API 연동**: 법인명, 대표자, 설립일, 업종코드 등 공시 정보 자동 조회
- **NPS(국민연금) API 연동**: 직원 수, 월평균 급여, 신규 입사/퇴사자, 이직률 추정
- **웹사이트 크롤링**: 기업 홈페이지에서 인재상, 핵심 가치, 최신 이슈 추출
- **SWOT 분석**: AI가 수집된 데이터를 바탕으로 기업의 SWOT 분석 제공

```mermaid
flowchart LR
    subgraph Input["입력"]
        A[기업명]
        B[홈페이지 URL]
    end
    
    subgraph APIs["외부 API"]
        C[DART API]
        D[NPS API]
        E[웹 크롤러]
    end
    
    subgraph Processing["처리"]
        F[LLM 분석]
        G[(DB 저장)]
    end
    
    A --> C --> F
    A --> D --> F
    B --> E --> F
    F --> G
    
    style C fill:#4ECDC4
    style D fill:#45B7D1
    style F fill:#96CEB4
```

---

### 2. ✍️ 자기소개서 작성 (Writing)
- **스타일 학습**: 사용자의 기존 합격 자소서를 학습하여 문체 모방
- **경험 소재 분석**: STAR 기법으로 경험 구조화 및 성향 분석
- **기업 맞춤형 생성**: 저장된 기업 분석 데이터를 활용하여 인재상에 맞는 자소서 생성
- **글자수 자동 조절**: 목표 글자수에 맞춰 자동 조정

```mermaid
flowchart TB
    subgraph Inputs["입력 소스"]
        A[스타일 프로필]
        B[경험 소재]
        C[기업 분석 데이터]
        D[작성 프롬프트]
    end
    
    subgraph RAG["RAG 처리"]
        E[관련 예시 추출]
        F[컨텍스트 구성]
    end
    
    subgraph Generation["생성"]
        G[LLM 생성]
        H[글자수 조정]
    end
    
    A --> E
    B --> F
    C --> F
    D --> F
    E --> G
    F --> G
    G --> H
    H --> I[자기소개서]
    
    style G fill:#FF6B6B
    style I fill:#4ECDC4
```

---

### 3. 💬 면접 준비 (Interview)
- **예상 질문 생성**: 자소서와 기업 분석 데이터를 바탕으로 맞춤형 면접 질문 생성
- **답변 컨설팅**: 각 질문에 대한 모범 답변과 전략 제공
- **스타일 학습**: 면접 답변 스타일 학습 및 적용

```mermaid
flowchart LR
    subgraph Source["입력"]
        A[자기소개서]
        B[기업 분석]
        C[답변 스타일]
    end
    
    subgraph Generate["생성"]
        D[질문 생성]
        E[답변 전략]
        F[모범 답변]
    end
    
    A --> D
    B --> D
    C --> E
    D --> E
    D --> F
    
    style D fill:#FFE66D
    style E fill:#4ECDC4
    style F fill:#96CEB4
```

---

### 4. 📊 경험 분석 (Sentiment Analysis)
- **STAR 기법 분석**: 경험을 Situation, Task, Action, Result로 구조화
- **성향 분석**: 경험에서 드러나는 리더십, 창의성, 공감능력 등 성향 파악
- **자소서 소재 발굴**: 분석된 경험을 자소서 작성에 직접 활용

```mermaid
flowchart TB
    A[경험 텍스트 입력] --> B[LLM 분석]
    
    B --> C[STAR 구조화]
    B --> D[성향 분석]
    
    subgraph STAR["STAR 기법"]
        C --> C1[Situation]
        C --> C2[Task]
        C --> C3[Action]
        C --> C4[Result]
    end
    
    subgraph Personality["성향 점수"]
        D --> D1[리더십]
        D --> D2[창의성]
        D --> D3[분석력]
        D --> D4[공감능력]
    end
    
    C1 & C2 & C3 & C4 --> E[(DB 저장)]
    D1 & D2 & D3 & D4 --> E
    
    style B fill:#FF6B6B
    style E fill:#4ECDC4
```

---

### 5. 🗂️ 경험 관리 시스템 (Experience Management)
- **나만의 경험 아카이빙**: 프로젝트, 인턴, 동아리 등 다양한 경험을 체계적으로 저장
- **자동 파일 분석**: PDF, DOCX, **HWP** 파일을 업로드하면 AI가 내용을 자동 추출 및 요약
- **STAR 자동 분류**: 입력된 경험을 LLM이 분석하여 STAR(Situation, Task, Action, Result) 프레임워크로 자동 변환 저장
- **자소서 활용**: 저장된 경험을 자기소개서 작성 시 클릭 한 번으로 불러오기 (RAG)

```mermaid
flowchart LR
    A[파일 업로드] --> B(텍스트 추출)
    B --> C{LLM 분석}
    
    D[직접 입력] --> C
    
    C --> E[STAR 구조화]
    E --> F[(DB 저장)]
    
    F --> G[자소서 작성 시 활용]
    
    style C fill:#FF6B6B
    style F fill:#4ECDC4
```

---

## � 전체 시스템 아키텍처

```mermaid
flowchart TB
    subgraph Client["Frontend (React + Vite)"]
        UI[사용자 인터페이스]
        Store[Zustand/Context]
    end
    
    subgraph NodeServer["Node.js Server (BFF)"]
        TRPC[tRPC Router]
        Auth[인증 (Auth.js)]
        Drizzle[Drizzle ORM]
        NodeLLM[LLM Helper (LangChain)]
    end
    
    subgraph PythonServer["Python Backend (FastAPI)"]
        FastAPI[API Endpoints]
        DocParser[문서 파서 (HWP/PDF)]
        PyLLM[RAG / Vector Store]
    end
    
    subgraph External["외부 AI/API"]
        Gemini[Google Gemini]
        Groq[Groq (Llama)]
        DART[DART/NPS 공시정보]
    end
    
    subgraph Infr["인프라/DB"]
        MySQL[(MySQL 8.0)]
        vLLM[Local LLM (Optional)]
    end
    
    %% Flow
    UI <-->|"API (Queries/Mutations)"| TRPC
    UI --"파일 업로드 (분석)"--> FastAPI
    
    TRPC --> Drizzle
    TRPC --> NodeLLM
    TRPC --> DART
    
    NodeLLM <--> Gemini
    NodeLLM --> Groq
    
    FastAPI --> DocParser
    FastAPI --> MySQL
    FastAPI -.-> vLLM
    
    Drizzle <--> MySQL
    
    style Gemini fill:#FF6B6B
    style MySQL fill:#4ECDC4
    style PythonServer fill:#FFE66D
    style NodeServer fill:#96CEB4
```

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| **Backend (Node.js)** | Express.js, tRPC, Drizzle ORM |
| **Backend (Python)** | **FastAPI** (File Processing/OCR), SQLAlchemy |
| **Frontend** | React 19, Vite, TailwindCSS, Shadcn/ui |
| **AI/LLM** | Gemini 2.5 Flash, Groq (Llama 3), **vLLM (Local)** |
| **Database** | MySQL 8.0+ |
| **External APIs** | DART(전자공시), NPS(국민연금) |

---

## 🚀 설치 및 실행

### 1. 사전 요구사항
- Node.js 18+
- Python 3.10+
- MySQL 8.0+

### 2. 설치

**Frontend (Node.js)**
```bash
cd front
npm install
cd ..
```

**Backend (Python)**
```bash
# 가상환경 생성 및 라이브러리 설치
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. 환경 변수 설정
`.env` 파일을 프로젝트 루트에 생성:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/jasos

# LLM Keys
GEMINI_API_KEY=your_gemini_key
GROK_API_KEY=your_grok_key
OLLAMA_BASE_URL=http://localhost:11434

# External APIs
DART_API_KEY=your_dart_key
NPS_API_KEY=your_nps_key
```

### 4. 실행

**전체 시스템 시작 (권장)**
```bash
./start.sh
# 백엔드(:8000) 실행 및 파일 감시
```

**프론트엔드 시작 (별도 터미널)**
```bash
cd front
npm run dev
# 프론트엔드(:5173) 실행
```

---

## 📂 프로젝트 구조

```
jasoS/
├── app/                        # Python Backend (FastAPI)
│   ├── main.py                 # 앱 진입점
│   ├── modules/                # 기능 모듈 (Learning, Analysis, etc.)
│   └── core/                   # DB, Config 설정
├── front/                      # TypeScript Frontend/BFF
│   ├── client/src/pages/       # React Pages
│   │   ├── MyPage.tsx          # 경험 관리 (NEW)
│   │   ├── Writing.tsx         # 자소서 작성
│   │   └── CorporateAnalysis.tsx
│   └── server/                 # tRPC Routers
│       ├── routers.ts          # API Endpoints
│       └── llm-helpers.ts      # Node.js LLM Logic
├── requirements.txt            # Python 의존성
├── start.sh                    # 서버 시작 스크립트
└── .env                        # 환경 변수
```

---

## 🔐 인증 시스템 수정 (2026-01-25)

### 변경 사항 요약

#### 1. User 스키마 수정
**파일**: `drizzle/schema.ts`

- `users` 테이블에 `username` 필드 추가
- 로컬 인증 시스템에서 사용하는 username을 User 타입에서 정식으로 지원

```diff
 openId: varchar("openId", { length: 64 }).notNull().unique(),
+/** Username for local authentication */
+username: varchar("username", { length: 64 }),
 name: text("name"),
```

---

#### 2. Context 타입 변환 수정
**파일**: `server/_core/context.ts`

- `username` 필드를 올바른 위치에 배치
- `updatedAt` 필드 추가 (스키마에서 notNull로 정의됨)
- `as any` 타입 캐스팅을 `as User`로 변경하여 타입 안전성 향상

```diff
 user = {
   id: localUser.id,
   openId: `local_${localUser.id}`,
+  username: localUser.username,
   name: localUser.name,
   email: null,
-  role: localUser.role as any,
+  role: localUser.role,
   loginMethod: "local",
   lastSignedIn: new Date(),
   createdAt: localUser.createdAt || new Date(),
-  username: localUser.username,
-} as any;
+  updatedAt: new Date(),
+} as User;
```

---

#### 수정된 인증 흐름

```mermaid
sequenceDiagram
    participant Client as 프론트엔드
    participant Server as 백엔드
    participant Auth as auth.ts
    participant Context as context.ts
    participant Cookie as 쿠키

    Note over Client,Cookie: 회원가입/로그인 흐름
    Client->>Server: POST /api/trpc/auth.login or auth.register
    Server->>Auth: loginUser() / registerUser()
    Auth-->>Server: { success, user }
    Server->>Cookie: Set jasos_user_id cookie
    Server-->>Client: { success, user }

    Note over Client,Cookie: 인증된 요청 흐름
    Client->>Server: Any tRPC request (with cookie)
    Server->>Context: createContext()
    Context->>Cookie: Parse jasos_user_id
    Context->>Auth: getUserById()
    Auth-->>Context: LocalUser
    Context->>Context: Convert to User type (fixed!)
    Context-->>Server: { req, res, user }
```

---

## 📝 라이선스

MIT License
