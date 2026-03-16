"""
ai_cover_letter.py — DocMaster FastAPI vLLM HTTP 클라이언트
=============================================================
직접 모델을 메모리에 올리지 않고,
docmaster FastAPI 서버(/api/v1/cover-letter)로 HTTP 요청을 보내
자소서를 생성합니다.

사전 준비:
  1. docker compose up -d          (vLLM 서버 실행)
  2. uvicorn app.main:app --reload  (FastAPI 서버 실행, docmaster/ 안에서)
  3. 이 스크립트 실행

사용법:
  python ai_cover_letter.py
  python ai_cover_letter.py --url http://localhost:8001  (포트 변경 시)
  python ai_cover_letter.py --query "원하는 자소서 질문"
"""

import argparse
import json
import sys

import httpx

# ==========================================
# 설정
# ==========================================
DEFAULT_API_URL = "http://localhost:8000"
ENDPOINT = "/api/v1/cover-letter"


# ==========================================
# HTTP 클라이언트 함수
# ==========================================
def generate_cover_letter(user_input: str, api_url: str = DEFAULT_API_URL) -> dict:
    """
    DocMaster FastAPI 서버에 자소서 생성 요청을 보내고 결과를 반환합니다.
    반환: {"company_type": str, "cover_letter": str}
    """
    url = api_url.rstrip("/") + ENDPOINT
    payload = {"user_input": user_input}

    print(f"\n[📡 서버 연결]: {url}")
    print(f"[📥 입력]: {user_input}")
    print("-" * 50)

    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
    except httpx.ConnectError:
        print(
            f"❌ 서버에 연결할 수 없습니다: {url}\n"
            "DocMaster FastAPI 서버가 실행 중인지 확인하세요:\n"
            "  cd docmaster && uvicorn app.main:app --reload"
        )
        sys.exit(1)
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP 오류 {e.response.status_code}: {e.response.text}")
        sys.exit(1)

    return response.json()


def print_result(result: dict):
    """결과를 포맷하여 출력합니다."""
    company_type = result.get("company_type", "알 수 없음")
    cover_letter = result.get("cover_letter", "")

    type_emoji = {"공기업": "🏛️", "사기업": "🏢", "범용": "📄"}.get(company_type, "📄")

    print(f"\n🚦 [판별된 기업 유형]: {type_emoji} {company_type}")
    print("\n================[ ✨ 최종 자소서 ]================")
    print(cover_letter)
    print("=" * 50)
    print(f"📝 글자 수: {len(cover_letter)}자")


# ==========================================
# 실전 테스트 실행
# ==========================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DocMaster AI 자소서 생성 클라이언트")
    parser.add_argument(
        "--url",
        default=DEFAULT_API_URL,
        help=f"FastAPI 서버 주소 (기본값: {DEFAULT_API_URL})",
    )
    parser.add_argument(
        "--query",
        default=(
            "한국전력공사 체험형 인턴 지원할 건데, "
            "과거 데이터 분석 프로젝트에서 팀원들과 소통 문제로 갈등을 겪었지만 해결했던 경험을 써줘."
        ),
        help="자소서 질문 (기본값: 한국전력공사 예시)",
    )
    args = parser.parse_args()

    result = generate_cover_letter(user_input=args.query, api_url=args.url)
    print_result(result)
