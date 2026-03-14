# JasoS API Reference

JasoS 백엔드 서버가 제공하는 API 엔드포인트 명세입니다.
서버 주소: `http://localhost:8000` (기본값)
API 문서(Swagger UI): `http://localhost:8000/docs`

---

## 1. Learning (학습)

이미지를 분석하여 글쓰기 스타일을 학습합니다.

| Method | Endpoint | 설명 | Request Body | Response |
|:---:|---|---|---|---|
| `POST` | **/api/learning/images** | 이미지 업로드 및 스타일 학습 | `multipart/form-data`<br>- `images`: 파일들<br>- `style_name`: 스타일 명 | `ImageLearningResponse`<br>(추출된 특징, 스타일ID) |

## 2. Styles (스타일 관리)

학습된 스타일 프로필을 조회하고 관리합니다.

| Method | Endpoint | 설명 | Request Body | Response |
|:---:|---|---|---|---|
| `GET` | **/api/styles** | 모든 스타일 목록 조회 | - | `List[StyleProfile]` |
| `POST` | **/api/styles** | 새 스타일 생성 (수동) | `StyleProfileCreate` | `StyleProfile` |
| `GET` | **/api/styles/{id}** | 특정 스타일 상세 조회 | - | `StyleProfile` |
| `PUT` | **/api/styles/{id}** | 스타일 정보 수정 | `StyleProfileUpdate` | `StyleProfile` |
| `DELETE`| **/api/styles/{id}** | 스타일 삭제 | - | `{"message": "..."}` |
| `GET` | **/api/styles/{id}/rules**| 스타일별 규칙 조회 | - | `List[ExplicitRule]` |
| `POST` | **/api/styles/{id}/rules**| 스타일에 명시적 규칙 추가 | `ExplicitRuleCreate` | `ExplicitRule` |

## 3. Writing (글쓰기)

스타일을 적용하여 글을 생성하고 버전을 관리합니다.

| Method | Endpoint | 설명 | Request Body | Response |
|:---:|---|---|---|---|
| `POST` | **/api/writing/generate** | AI 글 생성 요청 | `WritingGenerateRequest`<br>{`prompt`: "...", `style_id`: 1} | `WritingGenerateResponse`<br>(생성된 텍스트, 세션ID) |
| `GET` | **/api/writing/sessions/{id}**| 작성 세션(히스토리) 조회 | - | `WritingSession` |
| `POST` | **/api/writing/sessions/{id}/versions** | 새 버전(수정본) 저장 | `VersionCreateRequest`<br>{`content`: "..."} | `VersionResponse` |

---

## 4. External Dependencies (필수 외부 API)

JasoS 실행을 위해 필요한 외부 서비스/설정입니다.

### 🔹 Local AI (Ollama) - 권장

로컬에서 무료로 AI 모델을 실행합니다. 데이터가 외부로 유출되지 않습니다.

- **설치**: [Ollama.ai](https://ollama.ai) 다운로드
- **실행**: `ollama run llama3.2` (또는 `mistral`)
- **설정**: `.env` 파일의 `OLLAMA_BASE_URL=http://localhost:11434`

### 🔹 Cloud AI (OpenAI) - 선택

더 높은 품질의 생성을 위해 OpenAI GPT 모델을 사용할 수 있습니다.

- **API Key 발급**: [OpenAI Platform](https://platform.openai.com)
- **설정**: `.env` 파일의 `OPENAI_API_KEY=sk-...` 입력

---

## 5. Analysis (JD/기업 분석)

채용공고(JD)를 업로드하고 분석 결과를 조회합니다.

| Method | Endpoint | 설명 | Request Body | Response |
|:---:|---|---|---|---|
| `POST` | **/api/analysis/upload** | JD 파일(PDF/Img) 업로드 및 분석 시작 | `multipart/form-data`<br>- `file`: JD 파일 | `AnalysisSession`<br>(세션ID 포함) |
| `GET` | **/api/analysis/{session_id}** | 분석 결과 조회 (기업정보/인재상) | - | `AnalysisSession` |
| `POST` | **/api/analysis/chat** | JD 내용 기반 질의응답 | `ChatRequest`<br>{`session_id`: 1, `message`: "..."} | `ChatResponse` |
