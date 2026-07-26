import os
import logging
from typing import Dict
import OpenDartReader

logger = logging.getLogger(__name__)

class DartService:
    def __init__(self):
        self.api_key = os.getenv("DART_API_KEY")
        self.dart = OpenDartReader(self.api_key) if self.api_key else None

    def fetch_company_summary(self, corp_name: str) -> Dict:
        """Fetch basic company info and recent financial summary from DART"""
        if not self.dart:
            return {"status": "error", "message": "DART_API_KEY is missing"}

        try:
            # 1. Get basic company info
            corp_info = self.dart.company(corp_name)
            if not corp_info:
                return {"status": "not_found", "message": "Company not found in DART"}

            # OpenDartReader returns a dict for company()
            if isinstance(corp_info, dict) and corp_info.get("status") != "000":
                # Check for standard DART API error
                pass

            result = {
                "status": "success",
                "corp_name": corp_info.get("corp_name"),
                "corp_name_eng": corp_info.get("corp_name_eng"),
                "ceo_nm": corp_info.get("ceo_nm"),
                "jurir_no": corp_info.get("jurir_no"),
                "bizr_no": corp_info.get("bizr_no"),
                "adres": corp_info.get("adres"),
                "est_dt": corp_info.get("est_dt")
            }

            # 2. Try to get latest finstate (financial statement) - requires corp_code which is handled by OpenDartReader
            # Usually we fetch the previous year's annual report
            try:
                # OpenDartReader's finstate takes (corp, bsns_year, reprt_code)
                # reprt_code: '11011' is annual report
                fin_data = self.dart.finstate(corp_name, 2023) 
                
                if fin_data is not None and not fin_data.empty:
                    # Filter for Revenue (매출액) and Operating Profit (영업이익)
                    # This requires parsing the dataframe returned by OpenDartReader
                    revenue_row = fin_data[fin_data['account_nm'] == '매출액']
                    op_profit_row = fin_data[fin_data['account_nm'] == '영업이익']
                    
                    if not revenue_row.empty:
                        result["revenue_2023"] = revenue_row.iloc[0]['thstrm_amount']
                    if not op_profit_row.empty:
                        result["operating_profit_2023"] = op_profit_row.iloc[0]['thstrm_amount']
            except Exception as e:
                logger.warning(f"Failed to fetch finstate for {corp_name}: {e}")

            return result

        except Exception as e:
            logger.error(f"DART fetch failed for {corp_name}: {e}")
            return {"status": "error", "message": str(e)}
