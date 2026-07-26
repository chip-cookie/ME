import os
import requests
import xmltodict
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class NPSService:
    def __init__(self):
        self.api_key = os.getenv("NPS_API_KEY")
        self.base_url = "http://apis.data.go.kr/B552015/NpsBplcInfoInqSv/getNpsBplcInfoInqSv"

    def fetch_company_data(self, corp_name: str) -> Dict:
        """Fetch National Pension Service data and calculate turnover rate"""
        if not self.api_key:
            return {"status": "error", "message": "NPS_API_KEY is missing"}

        params = {
            "serviceKey": self.api_key,
            "wkpl_nm": corp_name,
            "pageNo": 1,
            "numOfRows": 1
        }

        try:
            response = requests.get(self.base_url, params=params)
            if response.status_code != 200:
                return {"status": "error", "code": response.status_code, "message": "NPS API Error"}

            data_dict = xmltodict.parse(response.content)

            try:
                body = data_dict['response']['body']
                if body['totalCount'] == '0':
                    return {"status": "not_found", "message": "Company not found in NPS data"}

                item = body['items']['item']
                if isinstance(item, list):
                    item = item[0]

                employees = int(item.get('adptCnt', 0))
                new_hires = int(item.get('newAcqsCnt', 0))
                departures = int(item.get('lssCnt', 0))
                avg_monthly_income = int(item.get('avrgMthAmt', 0))

                # Calculate turnover rate (퇴사율) = (퇴사자 수 / 전체 가입자 수) * 100
                turnover_rate = 0.0
                if employees > 0:
                    turnover_rate = round((departures / employees) * 100, 2)

                return {
                    "status": "success",
                    "employees": employees,
                    "new_hires": new_hires,
                    "departures": departures,
                    "turnover_rate_percent": turnover_rate,
                    "avg_monthly_income": avg_monthly_income,
                    "corp_addr": item.get('addr', '')
                }
            except KeyError:
                return {"status": "error", "message": "Invalid XML structure from NPS"}

        except Exception as e:
            logger.error(f"NPS fetch failed: {e}")
            return {"status": "error", "message": str(e)}
