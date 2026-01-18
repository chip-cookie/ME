# JasoS - AI 기반 취업 준비 통합 플랫폼

**JasoS**는 AI를 활용하여 기업 분석, 자기소개서 작성, 면접 준비를 통합 지원하는 지능형 취업 준비 플랫폼입니다.

---

## 🌟 주요 기능

### 1. 🏢 기업 분석 (Corporate Analysis)
- **DART API 연동**: 법인명, 대표자, 설립일, 업종코드 등 공시 정보 자동 조회
- **NPS(국민연금) API 연동**: 직원 수, 월평균 급여, 신규 입사/퇴사자, 이직률 추정
- **웹사이트 크롤링**: 기업 홈페이지에서 인재상, 핵심 가치, 최신 이슈 추출
- **SWOT 분석**: AI가 수집된 데이터를 바탕으로 기업의 SWOT 분석 제공

### 2. ✍️ 자기소개서 작성 (Writing)
- **스타일 학습**: 사용자의 기존 합격 자소서를 학습하여 문체 모방
- **경험 소재 분석**: STAR 기법으로 경험 구조화 및 성향 분석
- **기업 맞춤형 생성**: 저장된 기업 분석 데이터(DART/NPS)를 활용하여 인재상에 맞는 자소서 생성
- **글자수 자동 조절**: 목표 글자수에 맞춰 자동 조정

### 3. 💬 면접 준비 (Interview)
- **예상 질문 생성**: 자소서와 기업 분석 데이터를 바탕으로 맞춤형 면접 질문 생성
- **답변 컨설팅**: 각 질문에 대한 모범 답변과 전략 제공
- **스타일 학습**: 면접 답변 스타일 학습 및 적용

### 4. 📊 경험 분석 (Sentiment Analysis)
- **STAR 기법 분석**: 경험을 Situation, Task, Action, Result로 구조화
- **성향 분석**: 경험에서 드러나는 리더십, 창의성, 공감능력 등 성향 파악
- **자소서 소재 발굴**: 분석된 경험을 자소서 작성에 직접 활용

---

## 🛠️ 기술 스택

### Backend (TypeScript)
- **Framework**: Express.js + tRPC
- **AI/LLM**: Gemini 2.5 Flash (via Forge API)
- **Database**: MySQL (Drizzle ORM)
- **External APIs**: DART(전자공시), NPS(국민연금공단)

### Frontend
- **Framework**: React (Vite)
- **UI**: TailwindCSS, Shadcn/ui
- **State**: tRPC + React Query

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
├── app/                        # (Legacy) Python Backend
└── .env                        # 환경 변수
```

---

## 🔗 데이터 흐름

```
[기업 분석]
    │
    ├─→ DART API → 기업 공시 정보
    ├─→ NPS API  → 고용/급여 정보
    └─→ 크롤링   → 웹사이트 텍스트
            │
            ▼
    [LLM 분석] → DB 저장
            │
            ▼
┌───────────┴───────────┐
│                       │
[자소서 작성]      [면접 질문 생성]
    │                   │
    └─→ 기업 데이터 자동 활용 ←─┘
```

---

## 📝 라이선스

MIT License
