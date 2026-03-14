"""
Google Drive OAuth2 최초 인증 스크립트 (로컬에서 한 번만 실행)
=================================================================
1. Google Cloud Console에서 OAuth2 데스크톱 앱 자격증명 다운로드
   → https://console.cloud.google.com/apis/credentials
   → "OAuth 2.0 클라이언트 ID" → "데스크톱 앱" → JSON 다운로드
   → 파일명을 'credentials.json'으로 변경 후 scripts/ 에 저장

2. 이 스크립트 실행:
   python scripts/gdrive_auth.py

3. 브라우저에서 Google 계정 인증 완료
   → scripts/token.json 자동 생성

이후 watch_and_deploy.py 는 token.json을 자동으로 재사용합니다.
"""

from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

SCOPES          = ["https://www.googleapis.com/auth/drive.readonly"]
SCRIPT_DIR      = Path(__file__).parent
CREDENTIALS     = SCRIPT_DIR / "credentials.json"
TOKEN_FILE      = SCRIPT_DIR / "token.json"


def main():
    if not CREDENTIALS.exists():
        print(f"[ERROR] credentials.json 없음: {CREDENTIALS}")
        print("\n[안내]")
        print("  1. https://console.cloud.google.com/apis/credentials 접속")
        print("  2. '사용자 인증 정보 만들기' → 'OAuth 클라이언트 ID'")
        print("  3. 애플리케이션 유형: 데스크톱 앱")
        print("  4. JSON 다운로드 → scripts/credentials.json 저장")
        return

    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            print("[OK] 토큰 갱신 완료")
        else:
            flow  = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS), SCOPES)
            creds = flow.run_local_server(port=0)
            print("[OK] Google Drive 인증 완료")
        TOKEN_FILE.write_text(creds.to_json())

    print(f"[OK] token.json 저장됨: {TOKEN_FILE}")
    print("[OK] 이제 watch_and_deploy.py 를 실행할 수 있습니다.")


if __name__ == "__main__":
    main()
