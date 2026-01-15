import { getApiUrl } from "@/config";
import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { Toaster, toast } from 'sonner';

export default function StyleLearning() {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('style_name', 'MyStyle'); // TODO: Allow user input
        formData.append('category', 'good');
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const response = await fetch(getApiUrl('/api/learning/upload'), {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const result = await response.json();
            toast.success(result.message || '학습이 완료되었습니다.');
        } catch (error) {
            console.error(error);
            toast.error('학습 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24">
                <h1 className="text-4xl font-bold mb-8">스타일 학습</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    과거에 작성한 글이나 합격 자소서를 업로드하여 나만의 글쓰기 스타일을 AI에게 학습시키세요.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="bg-card p-8 rounded-lg border border-border shadow-sm">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <Upload className="w-6 h-6 text-accent" />
                            학습 자료 업로드
                        </h2>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-accent transition-colors">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                id="file-upload"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center gap-4"
                            >
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-gray-500" />
                                </div>
                                <div>
                                    <span className="text-accent font-semibold">클릭하여 파일 선택</span>
                                    <span className="text-muted-foreground"> 또는 여기로 드래그</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    PDF, DOCX, HWP, TXT, 이미지 파일 지원
                                </p>
                            </label>
                        </div>
                    </div>

                    {/* Style List Section (Placeholder) */}
                    <div className="bg-card p-8 rounded-lg border border-border shadow-sm">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            학습된 스타일
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="font-semibold text-lg">기본 스타일</h3>
                                <p className="text-sm text-gray-600">JasoS가 제공하는 기본 비즈니스 스타일입니다.</p>
                            </div>
                            {/* Add more styles dynamically */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
