import { useState } from 'react';
import { Upload, FileText, CheckCircle, Trash2, BookOpen, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import { trpc } from '@/lib/api';

type TabType = 'writing' | 'interview';

export default function StyleLearning() {
    const [activeTab, setActiveTab] = useState<TabType>('writing');
    const [styleName, setStyleName] = useState('');
    const [description, setDescription] = useState('');
    const [trainingText, setTrainingText] = useState('');

    // tRPC queries and mutations
    const { data: writingStyles = [], refetch: refetchWriting } = trpc.writingLearning.listStyles.useQuery(undefined, { retry: false });
    const { data: interviewStyles = [], refetch: refetchInterview } = trpc.interviewLearning.listStyles.useQuery(undefined, { retry: false });

    const createWritingStyle = trpc.writingLearning.createStyle.useMutation({
        onSuccess: () => {
            toast.success('자소서 스타일이 학습되었습니다!');
            setStyleName('');
            setDescription('');
            setTrainingText('');
            refetchWriting();
        },
        onError: (error) => {
            toast.error(error.message || '학습 실패');
        }
    });

    const createInterviewStyle = trpc.interviewLearning.createStyle.useMutation({
        onSuccess: () => {
            toast.success('면접 답변 스타일이 학습되었습니다!');
            setStyleName('');
            setDescription('');
            setTrainingText('');
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

    const handleSubmit = async () => {
        if (!styleName.trim() || !trainingText.trim()) {
            toast.error('스타일 이름과 학습 텍스트를 입력해주세요.');
            return;
        }

        if (trainingText.length < 100) {
            toast.error('학습 텍스트는 최소 100자 이상 입력해주세요.');
            return;
        }

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

    const isLoading = createWritingStyle.isPending || createInterviewStyle.isPending;
    const styles = activeTab === 'writing' ? writingStyles : interviewStyles;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24">
                <h1 className="text-4xl font-bold mb-4">스타일 학습</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    과거에 작성한 글을 입력하여 나만의 글쓰기 스타일을 AI에게 학습시키세요.
                </p>

                {/* Tab Selector */}
                <div className="flex gap-2 mb-8">
                    <Button
                        variant={activeTab === 'writing' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('writing')}
                        className="gap-2"
                    >
                        <BookOpen className="w-4 h-4" />
                        자소서 스타일
                    </Button>
                    <Button
                        variant={activeTab === 'interview' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('interview')}
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
                            {activeTab === 'writing' ? '자소서 스타일 학습' : '면접 답변 스타일 학습'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">스타일 이름 *</label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-md border border-gray-300 bg-background"
                                    placeholder={activeTab === 'writing' ? "예: 열정적인 스타일" : "예: STAR 기법 답변"}
                                    value={styleName}
                                    onChange={(e) => setStyleName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">설명 (선택)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-md border border-gray-300 bg-background"
                                    placeholder="이 스타일에 대한 간단한 설명"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {activeTab === 'writing'
                                        ? '학습할 자소서 텍스트 *'
                                        : '학습할 면접 답변 예시 *'}
                                </label>
                                <Textarea
                                    className="min-h-[300px] resize-none"
                                    placeholder={
                                        activeTab === 'writing'
                                            ? "과거에 작성한 자소서 내용을 붙여넣어주세요. 여러 개를 합쳐서 입력해도 됩니다.\n\n예시:\n저는 어려서부터 도전을 두려워하지 않았습니다..."
                                            : "과거 면접 답변 예시를 입력해주세요.\n\n예시:\n저의 가장 큰 장점은 문제 해결 능력입니다. 지난 프로젝트에서..."
                                    }
                                    value={trainingText}
                                    onChange={(e) => setTrainingText(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    {trainingText.length}자 입력됨 (최소 100자)
                                </p>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                {isLoading ? 'AI가 분석 중...' : '스타일 학습하기'}
                            </Button>
                        </div>
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
                                    <p className="text-sm mt-2">왼쪽에서 텍스트를 입력하여 학습을 시작하세요!</p>
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
