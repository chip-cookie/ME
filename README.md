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

## � 전체 시스템 아키텍처

```mermaid
flowchart TB
    subgraph Client["Frontend (React)"]
        UI[사용자 인터페이스]
    end
    
    subgraph Server["Backend (Express + tRPC)"]
        API[tRPC Router]
        LLM[LLM Helpers]
        DB[Drizzle ORM]
    end
    
    subgraph External["외부 서비스"]
        DART[DART API]
        NPS[NPS API]
        FORGE[Forge LLM API]
    end
    
    subgraph Database["Database"]
        MYSQL[(MySQL)]
    end
    
    UI <--> API
    API --> LLM
    API --> DB
    LLM --> FORGE
    API --> DART
    API --> NPS
    DB --> MYSQL
    
    style FORGE fill:#FF6B6B
    style MYSQL fill:#4ECDC4
```

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| **Backend** | Express.js, tRPC, Drizzle ORM |
| **Frontend** | React 19, Vite, TailwindCSS, Shadcn/ui |
| **AI/LLM** | Gemini 2.5 Flash (via Forge API) |
| **Database** | MySQL 8+ |
| **External APIs** | DART(전자공시), NPS(국민연금공단) |

---

## 🚀 설치 및 실행

### 1. 사전 요구사항
- Node.js 18+
- MySQL 8+

### 2. 설치

```bash
cd jasoS/front
npm install
```

### 3. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/jasos

# LLM (Forge API)
BUILT_IN_FORGE_API_URL=https://forge.example.com
BUILT_IN_FORGE_API_KEY=your_forge_api_key

# External APIs
DART_API_KEY=your_dart_api_key
NPS_API_KEY=your_nps_api_key
GROK_API_KEY=your_grok_api_key
```

### 4. 실행

```bash
cd front
npm run dev
```

서버: `http://localhost:3000`

---

## 📂 프로젝트 구조

```
jasoS/
├── front/                      # TypeScript Full-Stack
│   ├── client/src/pages/       # React Pages
│   │   ├── CorporateAnalysis.tsx  # 기업 분석
│   │   ├── Writing.tsx            # 자소서 작성
│   │   ├── Interview.tsx          # 면접 준비
│   │   └── SentimentAnalysis.tsx  # 경험 분석
│   ├── server/
│   │   ├── routers.ts          # tRPC API Routes
│   │   ├── llm-helpers.ts      # LLM 호출 헬퍼
│   │   ├── tools/
│   │   │   ├── dart.ts         # DART API 클라이언트
│   │   │   ├── nps.ts          # NPS API 클라이언트
│   │   │   └── crawler.ts      # 웹 크롤러
│   │   └── db.ts               # Database 쿼리
│   └── drizzle/schema.ts       # DB 스키마
├── docs/images/                # README 이미지
└── .env                        # 환경 변수
```

---

## 📝 라이선스

MIT License
