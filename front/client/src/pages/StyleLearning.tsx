import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, Trash2, BookOpen, MessageSquare, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import { trpc } from '@/lib/api';
import { getApiUrl } from '@/config';

type TabType = 'writing' | 'interview';

export default function StyleLearning() {
    const [activeTab, setActiveTab] = useState<TabType>('writing');
    const [styleName, setStyleName] = useState('');
    const [description, setDescription] = useState('');
    const [trainingText, setTrainingText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedCharacteristics, setAnalyzedCharacteristics] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // tRPC queries and mutations
    const { data: writingStyles = [], refetch: refetchWriting } = trpc.writingLearning.listStyles.useQuery(undefined, { retry: false });
    const { data: interviewStyles = [], refetch: refetchInterview } = trpc.interviewLearning.listStyles.useQuery(undefined, { retry: false });

    const createWritingStyle = trpc.writingLearning.createStyle.useMutation({
        onSuccess: () => {
            toast.success('자소서 스타일이 학습되었습니다!');
            resetForm();
            refetchWriting();
        },
        onError: (error) => {
            toast.error(error.message || '학습 실패');
        }
    });

    const createInterviewStyle = trpc.interviewLearning.createStyle.useMutation({
        onSuccess: () => {
            toast.success('면접 답변 스타일이 학습되었습니다!');
            resetForm();
            refetchInterview();
        },
        onError: (error) => {
            toast.error(error.message || '학습 실패');
        }
    });

    const deleteWritingStyle = trpc.writingLearning.deleteStyle.useMutation({
        onSuccess: () => {
            toast.success('스타일이 삭제되었습니다.');
            refetchWriting();
        }
    });

    const deleteInterviewStyle = trpc.interviewLearning.deleteStyle.useMutation({
        onSuccess: () => {
            toast.success('스타일이 삭제되었습니다.');
            refetchInterview();
        }
    });

    // Style analysis mutations (preview before save)
    const analyzeWritingMutation = trpc.writingLearning.analyzePreview.useMutation();
    const analyzeInterviewMutation = trpc.interviewLearning.analyzePreview.useMutation();

    const resetForm = () => {
        setStyleName('');
        setDescription('');
        setTrainingText('');
        setAnalyzedCharacteristics(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const MAX_FILE_SIZE_MB = 20;
    const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.hwp', '.hwpx', '.txt'];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            toast.error('지원하지 않는 파일 형식입니다. (PDF, DOCX, HWP, TXT만 가능)');
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast.error(`파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE_MB}MB까지 가능합니다.`);
            return;
        }

        setIsAnalyzing(true);
        try {
            // 1. Upload to backend for extraction
            const formData = new FormData();
            formData.append('file', file);

            const uploadEndpoint = activeTab === 'writing'
                ? getApiUrl('/api/writing/style/upload')
                : getApiUrl('/api/interview/style/upload');

            const response = await fetch(uploadEndpoint, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('파일 업로드 실패');

            const data = await response.json();
            const extractedText = data.text;

            if (!extractedText || extractedText.length < 50) {
                toast.error('텍스트 추출에 실패했거나 내용이 너무 짧습니다.');
                setIsAnalyzing(false);
                return;
            }

            setTrainingText(extractedText);

            // 2. API Call for Analysis (Preview)
            // Note: This relies on the endpoint I will add next
            let result;
            if (activeTab === 'writing') {
                result = await analyzeWritingMutation.mutateAsync({ text: extractedText });
            } else {
                result = await analyzeInterviewMutation.mutateAsync({ text: extractedText });
            }

            setAnalyzedCharacteristics(result);
            if (result.suggested_name) {
                setStyleName(result.suggested_name);
            }
            toast.success('스타일 분석이 완료되었습니다!');

        } catch (error) {
            console.error(error);
            toast.error('분석 중 오류가 발생했습니다.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleManualAnalyze = async () => {
        if (trainingText.length < 50) {
            toast.error('텍스트가 너무 짧습니다. 최소 50자 이상 입력해주세요.');
            return;
        }

        setIsAnalyzing(true);
        try {
            let result;
            if (activeTab === 'writing') {
                result = await analyzeWritingMutation.mutateAsync({ text: trainingText });
            } else {
                result = await analyzeInterviewMutation.mutateAsync({ text: trainingText });
            }

            setAnalyzedCharacteristics(result);
            if (result.suggested_name) {
                setStyleName(result.suggested_name);
            }
            toast.success('스타일 분석이 완료되었습니다!');
        } catch (error) {
            console.error(error);
            toast.error('분석 중 오류가 발생했습니다.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = () => {
        if (!styleName.trim() || !trainingText.trim()) return;

        const input = {
            name: styleName,
            description: description || undefined,
            trainingText,
        };

        if (activeTab === 'writing') {
            createWritingStyle.mutate(input);
        } else {
            createInterviewStyle.mutate(input);
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        if (activeTab === 'writing') {
            deleteWritingStyle.mutate(id);
        } else {
            deleteInterviewStyle.mutate(id);
        }
    };

    const styles = activeTab === 'writing' ? writingStyles : interviewStyles;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24">
                <h1 className="text-4xl font-bold mb-4">스타일 학습</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    {activeTab === 'writing'
                        ? '본인이 작성한 자기소개서나 글을 업로드하여 나만의 문체를 학습시키세요.'
                        : '본인의 면접 답변 녹취록이나 스크립트를 업로드하여 답변 스타일을 학습시키세요.'}
                </p>

                {/* Tab Selector */}
                <div className="flex gap-2 mb-8">
                    <Button
                        variant={activeTab === 'writing' ? 'default' : 'outline'}
                        onClick={() => { setActiveTab('writing'); resetForm(); }}
                        className="gap-2"
                    >
                        <BookOpen className="w-4 h-4" />
                        자소서 스타일
                    </Button>
                    <Button
                        variant={activeTab === 'interview' ? 'default' : 'outline'}
                        onClick={() => { setActiveTab('interview'); resetForm(); }}
                        className="gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        면접 답변 스타일
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-card p-8 rounded-lg border border-border shadow-sm">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <Upload className="w-6 h-6 text-accent" />
                            스타일 업로드 및 분석
                        </h2>

                        {!analyzedCharacteristics ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-accent transition-colors">
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
                                        <p className="text-lg font-medium">스타일 문서를 분석 중입니다...</p>
                                        <p className="text-sm text-gray-500 mt-2">텍스트 추출 및 AI 스타일 분석 진행 중</p>
                                    </div>
                                ) : (
                                    <>
                                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">파일을 이곳에 드래그하거나 클릭하여 업로드</h3>
                                        <p className="text-sm text-gray-500 mb-6">
                                            PDF, DOCX, HWP, TXT 파일 지원 (본인의 작성물 권장)
                                        </p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept=".pdf,.docx,.doc,.txt,.hwp"
                                        />
                                        <Button onClick={() => fileInputRef.current?.click()}>
                                            파일 선택하기
                                        </Button>

                                        {/* Manual Input Section */}
                                        <div className="mt-8 pt-6 border-t border-gray-200 w-full text-left">
                                            <details className="group">
                                                <summary className="cursor-pointer text-lg font-semibold text-gray-700 hover:text-accent flex items-center gap-2">
                                                    <span>직접입력</span>
                                                    <span className="text-sm text-gray-400">(클릭하여 펼치기)</span>
                                                </summary>
                                                <div className="mt-4 space-y-4">
                                                    <Textarea
                                                        className="min-h-[200px] resize-none"
                                                        placeholder={
                                                            activeTab === 'writing'
                                                                ? "과거에 작성한 자소서 내용을 붙여넣어주세요.\n\n예시:\n저는 어려서부터 도전을 두려워하지 않았습니다..."
                                                                : "과거 면접 답변 예시를 입력해주세요.\n\n예시:\n저의 가장 큰 장점은 문제 해결 능력입니다..."
                                                        }
                                                        value={trainingText}
                                                        onChange={(e) => setTrainingText(e.target.value)}
                                                    />
                                                    <p className="text-sm text-muted-foreground">
                                                        {trainingText.length}자 입력됨 (최소 100자 권장)
                                                    </p>
                                                    <Button
                                                        onClick={handleManualAnalyze}
                                                        disabled={trainingText.length < 50 || isAnalyzing}
                                                        className="w-full"
                                                    >
                                                        {isAnalyzing ? '분석 중...' : '텍스트 분석하기'}
                                                    </Button>
                                                </div>
                                            </details>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-semibold text-green-800">분석 완료</span>
                                    </div>
                                    <p className="text-sm text-green-700">
                                        문서에서 스타일 특징을 성공적으로 추출했습니다. 아래 내용을 확인하고 저장하세요.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">스타일 이름 (자동 생성됨)</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-md border border-gray-300 bg-background font-medium"
                                        value={styleName}
                                        onChange={(e) => setStyleName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">설명 (선택)</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-md border border-gray-300 bg-background"
                                        placeholder="이 스타일에 대한 메모"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                {/* Keyword Tags Display */}
                                {analyzedCharacteristics.key_patterns && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">주요 특징</label>
                                        <div className="flex flex-wrap gap-2">
                                            {analyzedCharacteristics.tone && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">#{analyzedCharacteristics.tone}</span>
                                            )}
                                            {activeTab === 'writing' ? (
                                                <>
                                                    {analyzedCharacteristics.sentence_structure && (
                                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">#{analyzedCharacteristics.sentence_structure}</span>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {analyzedCharacteristics.communication_style && (
                                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">#{analyzedCharacteristics.communication_style}</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-2">
                                    <Button onClick={handleSave} className="flex-1" size="lg">
                                        스타일 저장하기
                                    </Button>
                                    <Button variant="outline" onClick={resetForm} size="lg">
                                        <X className="w-4 h-4 mr-2" />
                                        취소
                                    </Button>
                                </div>
                                <details className="text-xs text-gray-500 cursor-pointer">
                                    <summary>추출된 텍스트 확인 ({trainingText.length}자)</summary>
                                    <div className="mt-2 p-2 bg-gray-100 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                                        {trainingText}
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>

                    {/* Learned Styles List */}
                    <div className="bg-card p-8 rounded-lg border border-border shadow-sm">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            학습된 스타일 ({styles.length}개)
                        </h2>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {styles.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>아직 학습된 스타일이 없습니다.</p>
                                    <p className="text-sm mt-2">왼쪽에서 파일을 업로드하여 학습을 시작하세요!</p>
                                </div>
                            ) : (
                                styles.map((style) => (
                                    <div
                                        key={style.id}
                                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-accent transition-colors"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">{style.name}</h3>
                                                {style.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{style.description}</p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(style.createdAt).toLocaleDateString('ko-KR')} 생성
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(style.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
