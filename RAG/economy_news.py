import os
import streamlit as st
import pandas as pd
from PIL import Image
from datetime import datetime, timedelta
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


@st.cache_data
def load_data(img_file_path):
    """CSV 파일을 캐시하여 불러오기"""
    try:
        data = pd.read_csv(img_file_path, encoding='utf-8-sig')
        data['date'] = pd.to_datetime(data['date'])
        return data
    except Exception as e:
        st.error(f"파일을 읽는 중 오류가 발생했습니다: {e}")
        return pd.DataFrame()


@st.cache_data
def get_news_content(data, date):
    """선택한 날짜에 해당하는 뉴스 기사 내용 가져오기"""
    news_content = data[data['date'] == date]
    news_content_str = ' '.join(news_content['information'].dropna())
    if not news_content_str:
        st.error("해당 날짜의 뉴스 기사 내용이 없습니다.")
    return news_content_str


def get_headline(news_content):
    """LangChain을 통해 헤드라인 생성하기 (캐시하지 않음)"""
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.5)

    @st.cache_data
    def get_answer(news_content):
        """LangChain을 통해 헤드라인 생성"""
        prompt = PromptTemplate(
            input_variables=["news_content"],
            template="""다음 뉴스 기사들의 핵심 내용을 바탕으로 간결하고 매력적인 헤드라인 4개를 생성해주세요. 
            각 헤드라인은 고유하고 서로 다른 주요 포인트를 강조해야 합니다. 헤드라인만 표시합니다.
            글머리 기호를 사용합니다.
        뉴스 기사 내용:
        {news_content}
        지침:
        - 간결하고 명확한 헤드라인 작성
        - 중복 없이 고유한 내용 강조
        - 한국어로 작성
        - 각 헤드라인은 다른 관점이나 측면을 다뤄야 함
        """
        )
        #- divider는 4개 헤드라인을 모두 포함하여 다음과 같이 style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;"
        
        # LLMChain 설정
        chain = prompt | llm

        # LangChain을 통해 헤드라인 추출
        headlines = chain.invoke({'news_content': news_content})
        
        return headlines

    return get_answer(news_content)


class Headline:
    def __init__(self, img_file_path):
        self.img_file_path = img_file_path
        
    def _date_selection(self):
        """날짜 선택 기능"""
        if 'current_date' not in st.session_state:
            st.session_state['current_date'] = datetime(2024, 11, 30)
        
        col1, col2, col3 = st.columns([1,4,1])
        with col1:
            if st.button('⬅️'):
                st.session_state['current_date'] -= timedelta(days=1)
                
                if st.session_state['current_date'] < datetime(2024, 11, 1):
                    st.session_state['current_date'] = datetime(2024, 11, 1)
                st.rerun()
        
        with col3:
            if st.button('➡️'):
                st.session_state['current_date'] += timedelta(days=1)
                if st.session_state['current_date'] > datetime(2024, 11, 30):
                    st.session_state['current_date'] = datetime(2024, 11, 30)
                st.rerun()
        
        year = st.session_state['current_date'].year
        month = st.session_state['current_date'].month
        day = st.session_state['current_date'].day
        
        with col2:
            st.markdown(f"<h1 style='text-align: center;'>📈 {year}년 {month}월 {day}일 헤드라인</h1>", unsafe_allow_html=True)
        #st.markdown(f'# 📈 {year}년 {month}월 {day}일 헤드라인')
        
        return st.session_state['current_date']
    
    def _get_headline(self, news_content):
        """LangChain을 통해 헤드라인 생성하기"""
        # LangChain을 통해 헤드라인 추출 (캐시 적용)
        headlines = get_headline(news_content)
        
        return headlines
    
class keyword_analysis:
    def __init__(self, img_file_path):
        self.img_file_path = img_file_path
    def show(self):
        img_path = os.path.join(self.img_file_path, 'wordcloud.png')
        img = Image.open(img_path)
        st.subheader('🔑 경제 키워드 분석')
        st.image(img, use_column_width=False)
        
class trend_analysis:
    def __init__(self, csv_file_path):
        self.csv_file_path = csv_file_path
        self.data = self._load_data()
    def _load_data(self):
        df = pd.read_csv(self.csv_file_path, encoding='cp949')
        top_keyword = df['keyword'].value_counts().head(10).index.tolist()
        top_df = df[df['keyword'].isin(top_keyword)]
        pivot_df = top_df.pivot_table(index='month',columns='keyword',values='keyword',aggfunc='size', fill_value=0)
        return pivot_df
    def show(self):
        st.subheader('📉 경제 트렌드 분석')
        st.line_chart(self.data,height=600, use_container_width=True)
        

def show():
    # CSV 데이터를 캐시하여 불러옴
    base_path = os.path.dirname(__file__)
    img_file_path = os.path.join(base_path, "./image")
    csv_file_path = os.path.join(base_path, "./data/trend_df.csv")
    news_file_path = os.path.join(base_path, "./data/newsdata.csv")
    
    data = load_data(news_file_path)

    # 날짜 선택 및 뉴스 콘텐츠 추출
    headline = Headline(news_file_path)
    date = headline._date_selection()
    news_content = get_news_content(data, date)

    # 헤드라인 생성 (캐시 적용)
    headlines = headline._get_headline(news_content)
    st.write(f'{headlines.content}')
    
    # 키워드 분석 및 트렌드 분석
    keyword_app = keyword_analysis(img_file_path)
    keyword_app.show()
    
    trend_app = trend_analysis(csv_file_path)
    trend_app.show()

if __name__ == '__main__':
    show()