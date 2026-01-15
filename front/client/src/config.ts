/**
 * API Configuration
 * 
 * Vercel 배포 시 백엔드(Ngrok) 주소를 연결하기 위한 설정입니다.
 * 로컬 개발 시에는 빈 문자열("")로 설정되어 프록시를 사용합니다.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * API 경로 생성 유틸리티
 * @param path - '/api/...'로 시작하는 경로
 * @returns 전체 URL
 */
export const getApiUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    // path가 /로 시작하지 않으면 추가
    const safePath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${safePath}`;
};
