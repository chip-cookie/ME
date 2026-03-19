/**
 * API Configuration
 *
 * 로컬 개발 시에는 빈 문자열("")로 설정되어 Express 프록시를 사용합니다.
 * 외부 배포 시 VITE_API_URL 환경변수에 백엔드 주소를 설정하세요.
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
