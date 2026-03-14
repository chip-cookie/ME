
// import { DART_API_KEY } from '../../shared/const';


// Helper to get API key
const getApiKey = () => process.env.DART_API_KEY || '';

export async function getDartCompanyInfo(companyName: string) {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn("DART_API_KEY is missing");
        return null;
    }

    try {
        // 1. Search for company to get corp_code
        // We use the Disclosure Search API (list.json) to find the corp_code by name
        // Request last 1 year of data to ensure we find something
        const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

        const searchUrl = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&corp_name=${encodeURIComponent(companyName)}&bgn_de=${startDate}&end_de=${endDate}&page_count=1`;

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.status !== '000' || !searchData.list || searchData.list.length === 0) {
            console.log(`DART: Company not found or API error: ${searchData.message}`);
            return null;
        }

        // Get the first matching corporation code
        const corpCode = searchData.list[0].corp_code;

        // 2. Get Company Outline (Basic Info)
        const companyUrl = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=${corpCode}`;
        const companyRes = await fetch(companyUrl);
        const companyData = await companyRes.json();

        if (companyData.status !== '000') {
            return null;
        }

        return {
            corp_name: companyData.corp_name || companyName,
            corp_name_eng: companyData.corp_name_eng,
            stock_name: companyData.stock_name,
            ceo_nm: companyData.ceo_nm,
            corp_cls: companyData.corp_cls, // Y: 유가, K: 코스닥, N: 코넥스, E: 기타
            induty_code: companyData.induty_code,
            est_dt: companyData.est_dt,
            hm_url: companyData.hm_url,
            phn_no: companyData.phn_no,
            adres: companyData.adres
        };

    } catch (error) {
        console.error("DART API Error:", error);
        return null;
    }
}
