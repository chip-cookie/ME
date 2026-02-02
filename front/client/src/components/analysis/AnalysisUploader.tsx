import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisUploaderProps {
    onUploadComplete: (summary: string) => void;
    companyName?: string;
}

export const AnalysisUploader: React.FC<AnalysisUploaderProps> = ({
    onUploadComplete,
    companyName = "미지정 기업"
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('company_name', companyName);

        setIsLoading(true);
        try {
            // API 호출 (Proxy를 통해 백엔드로 전달)
            const response = await fetch('/api/v1/analysis/upload-insight', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 'success' && data.summary) {
                onUploadComplete(data.summary);
            } else {
                console.error("Analysis failed or no summary returned", data);
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("파일 업로드 및 분석 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-500" />
                <h3 className="font-semibold text-gray-700">기업 분석 자료 업로드</h3>
                <p className="text-sm text-gray-500 text-center">
                    PDF, HWP, Excel, Word, MD 파일을 지원합니다.<br />
                    AI가 자동으로 내용을 분석하여 인사이트를 도출합니다.
                </p>

                <input
                    type="file"
                    id="analysis-file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.hwp,.xlsx,.xls,.csv,.txt,.md"
                    onChange={handleFileChange}
                    disabled={isLoading}
                />

                <label htmlFor="analysis-file">
                    <Button variant="outline" className="mt-2 cursor-pointer" type="button" disabled={isLoading} asChild>
                        <span className="pointer-events-auto">
                            {isLoading ? "분석 중..." : "파일 선택하기"}
                        </span>
                    </Button>
                </label>
            </div>
        </div>
    );
};
