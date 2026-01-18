/**
 * NPS (국민연금공단) API Client
 * Fetches company employment data: employee count, turnover, average salary
 */

// Helper to get API key
const getApiKey = () => process.env.NPS_API_KEY || '';

export interface NpsCompanyInfo {
    status: string;
    employees?: number;       // 가입자수
    newHires?: number;        // 신규 입사
    departures?: number;      // 퇴사자
    avgMonthlyIncome?: number;  // 월평균 소득
    corpAddr?: string;        // 주소
    error?: string;
}

/**
 * Fetch company employment data from NPS API
 * @param companyName - Korean company name
 * @returns Company employment data or error
 */
export async function getNpsCompanyInfo(companyName: string): Promise<NpsCompanyInfo> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn("NPS_API_KEY is missing");
        return { status: "error", error: "NPS_API_KEY not configured" };
    }

    const url = "http://apis.data.go.kr/B552015/NpsBplcInfoInqSv/getNpsBplcInfoInqSv";

    try {
        const params = new URLSearchParams({
            serviceKey: apiKey,
            wkpl_nm: companyName,
            pageNo: "1",
            numOfRows: "1"
        });

        const response = await fetch(`${url}?${params.toString()}`);

        if (!response.ok) {
            return { status: "error", error: `API Error: ${response.status}` };
        }

        const text = await response.text();

        // Parse XML response
        // Simple XML parsing without external library
        const getTagValue = (xml: string, tag: string): string | null => {
            const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
            const match = xml.match(regex);
            return match ? match[1] : null;
        };

        const totalCount = getTagValue(text, 'totalCount');

        if (!totalCount || totalCount === '0') {
            return { status: "not_found" };
        }

        // Extract item data
        const employees = parseInt(getTagValue(text, 'jnngpCnt') || '0', 10);    // 가입자수
        const newHires = parseInt(getTagValue(text, 'crrmmNwacqzCnt') || '0', 10); // 당월 신규 취득
        const departures = parseInt(getTagValue(text, 'crrmmLssqzCnt') || '0', 10); // 당월 상실
        const avgMonthlyIncome = parseInt(getTagValue(text, 'jngpTotStdMhlyAmt') || '0', 10); // 가입자 총 기준월액 평균
        const corpAddr = getTagValue(text, 'wkplRoadNmDtlAddr') || '';

        return {
            status: "success",
            employees,
            newHires,
            departures,
            avgMonthlyIncome: Math.round(avgMonthlyIncome / (employees || 1)), // Per-person average
            corpAddr
        };

    } catch (error) {
        console.error("NPS API Error:", error);
        return { status: "error", error: error instanceof Error ? error.message : "Unknown error" };
    }
}
