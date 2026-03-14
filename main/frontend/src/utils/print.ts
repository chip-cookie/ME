/**
 * PDF 내보내기 함수
 * 브라우저의 인쇄 대화상자를 열어 PDF로 저장
 */
export const exportToPDF = (): void => {
    window.print();
};
