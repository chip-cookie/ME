import streamlit as st
from streamlit_calendar import calendar

class CalendarApp:
    def __init__(self):
        self.calendar_options = {
            "editable": True,
            "selectable": True,
            "headerToolbar": {
                "left": "prev,next today",
                "center": "title",
                "right": "dayGridMonth,listMonth",
            },
            "initialView": "dayGridMonth",
        }

        self.calendar_events = []

        # 색상 설정
        self.color_map = {
            "발표": "#FF6F61",         # 부드러운 주황색
            "서류 시작": "#4FC3F7",    # 밝은 하늘색
            "서류 마감": "#81C784",    # 연한 초록색
            "시험일": "#BA68C8",        # 연한 보라색
            "발표일": "#9575CD",       # 은은한 보라색
            "면접": "#FFA726",         # 오렌지색
            "시험 접수": "#B0BEC5"     # 차분한 회색
        }

        # 캘린더 데이터
        calendar_data = {
            "12월": {
               "1일": ["하나손해보험 서류 마감"],
                "2일": ["기업은행 면접"],
                "3일": ["국민은행 최종 발표", "신한은행 2차 면접 발표", "국민은행 동계 인턴십 서류 마감"],
                "4일": ["예금보험공사 인턴 서류 발표", "우리자산운용 서류 발표", "신협중앙회 서류 마감", "미래에셋증권 서류 마감"],
                "5일": ["우체국금융개발원 서류 마감", "우리자산운용 1차 면접", "재경관리사 시작", "회계관리 시작", "AT자격시험 시작"],
                "6일": ["농협은행 5급 최종 발표", "농협중앙회 5급 최종 발표", "농협손해보험 최종 발표", "신용보증재단중앙회 1차 면접 발표", "신용보증재단중앙회 1차면접 발표", "매경테스트 발표", "파생상품투자권 발표", "유자문인력 발표", "외환전문역 발표"],
                "7일": ["우리금융캐피탈 필기 시험", "전산세무회계 시험"],
                "8일": [],
                "9일": ["농협은행 6급 최종 발표", "교보증권 인턴 필기 시험", "우체국금융개발원 면접", "경기신용보증재단 서류 마감"],
                "10일": ["한국재정정보원 인턴 최종 발표", "신용보증재단중앙회 인턴 면접 발표", "수협중앙회 2차 면접", "재경관리사 마감", "회계관리 마감"],
                "11일": ["국민은행 동계인턴십 서류 발표", "예금보험공사 인턴 면접", "신용보증재단중앙회 2차 면접", "AT자격시험"],
                "12일": ["국민연금공단 최종 발표", "기업은행 동계인턴 서류 발표"],
                "13일": ["AFPK 발표", "국민은행 동계인턴십 면접"],
                "14일": ["경기신용보증재단 필기 시험"],
                "15일": ["교보증권 인턴 서류 마감"],
                "16일": ["예금보험공사 인턴 면접 발표", "신용보증재단중앙회 최종 발표", "우체국금융개발원 최종 발표", "테셋 마감"],
                "17일": ["유통관리사 2급 발표"],
                "18일": ["우리은행 체험형 인턴 서류 발표", "교보증권 인턴 실무 면접"],
                "19일": ["지역농협 최종 발표","국민은행 동계 인턴십 최종 발표", "펀드투자자문사 인력 발표"],
                "20일": ["수협중앙회 최종 발표"],
                "21일": ["재경관리사 시험", "AT자격 시험", "회계관리 시험"],
                "22일": [],
                "23일": ["우리은행 체험형 인턴 면접"],
                "24일": ["우리자산운용 최종 발표"],
                "25일": [],
                "26일": ["신협중앙회 서류 발표", "전산세무회계 발표"],
                "27일": ["재경관리사 발표", "회계관리 발표"],
                "28일": ["테셋 시험"]
            }
        }

        # 이벤트로 변환
        for day, events in calendar_data["12월"].items():
            if events:  # 이벤트가 있는 경우에만 추가
                date = f"2024-12-{int(day[:-1]):02d}"  # "1일" -> "2024-12-01"
                for event in events:
                    category = self.get_event_category(event)
                    self.calendar_events.append(
                        {
                            "title": event,
                            "start": date,
                            "color": self.color_map[category],
                            "category": category
                        }
                    )

    def get_event_category(self, event):
        """이벤트 제목에 따라 카테고리를 반환"""
        if "발표" in event and "면접" not in event and "서류" not in event:
            return "발표일"
        elif "면접" in event:
            return "면접"
        elif "발표" in event:
            return "발표"
        elif "서류 시작" in event:
            return "서류 시작"
        elif "서류 마감" in event:
            return "서류 마감"
        elif "시험" in event:
            return "시험일"
        else:
            return "시험 접수"

    def render(self):
        st.subheader("📅 금융권 채용 & 자격증 캘린더")

        # 셀렉트 박스 카테고리 선택
        categories = [
            "전체 보기", "발표", "면접", "서류 시작", "서류 마감",
            "시험일", "발표일", "시험 접수"
        ]
        selected_category = st.selectbox("카테고리 선택", categories)

        # 필터링된 이벤트
        if selected_category == "전체 보기":
            filtered_events = self.calendar_events  # 모든 이벤트 표시
        else:
            filtered_events = [
                event for event in self.calendar_events
                if event["category"] == selected_category
            ]

        # 캘린더 출력
        calendar(events=filtered_events, options=self.calendar_options)

def show():
    app = CalendarApp()
    app.render()

if __name__ == "__main__":
    show()
