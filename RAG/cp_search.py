import pandas as pd
from fuzzywuzzy import process
import streamlit as st

class CompanySearch:
    def __init__(self, file_path):
        """초기화 및 기업 데이터 로드."""
        self.file_path = file_path
        self.df = pd.read_csv(file_path)
        self.corp_names = self.df['corp_name'].tolist()
        
    def search_similar_names(self, query, limit=8):
        """FuzzyWuzzy를 사용해 가장 유사한 기업명을 반환."""
        matches = process.extract(query, self.corp_names, limit=limit)
        return [match[0] for match in matches]

# 기업 검색 섹션을 표시하는 함수 추가
def show_company_search_section():
    """기업 검색 섹션을 표시하는 함수"""
    st.title("🔍 기업 검색")
    st.write("기업명을 검색하세요")

    # CompanySearch 클래스 초기화
    file_path = "data/corp_list_2.csv"
    company_search = CompanySearch(file_path)

    # 세션 상태 초기화
    if "query" not in st.session_state:
        st.session_state["query"] = ""
    if "results" not in st.session_state:
        st.session_state["results"] = []

    # 검색 입력 상자
    query = st.text_input("기업명을 입력하세요", key="query_input")
    if query:
        st.session_state["query"] = query
        st.session_state["results"] = company_search.search_similar_names(query, limit=8)

    # 입력된 쿼리에 대한 정확한 일치 여부 확인
    if query in company_search.corp_names:
        st.write(f"✅ **일치하는 기업은 `{query}` 입니다.**")
    else:
        # 추천 검색어 표시
        if st.session_state["results"]:
            st.write("🔍 **추천 검색어**")
            for result in st.session_state["results"]:
                st.markdown(f"- **{result}**")
