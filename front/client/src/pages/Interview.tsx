import { useState } from 'react';
import { MessageSquare, Wand2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import { trpc } from '@/lib/api';

interface Question {
    question: string;
    suggestedAnswer: string;
    answerStrategy: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export default function Interview() {
    const [inputMode, setInputMode] = useState<'select' | 'text'>('text');
    const [coverLetterText, setCoverLetterText] = useState('');
    const [selectedWritingId, setSelectedWritingId] = useState<number | undefined>();
    const [selectedInterviewStyleId, setSelectedInterviewStyleId] = useState<number | undefined>();
    const [questionCount, setQuestionCount] = useState(5);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    // tRPC queries
    const { data: writingHistory = [] } = trpc.writing.getHistory.useQuery(undefined, { retry: false });
    const { data: interviewStyles = [] } = trpc.interviewLearning.listStyles.useQuery(undefined, { retry: false });

    const generateMutation = trpc.interview.generateQuestions.useMutation({
        onSuccess: (data) => {
            setQuestions(data.questions);
            toast.success(`${data.questions.length}개의 면접 질문이 생성되었습니다!`);
        },
        onError: (error) => {
            toast.error(error.message || '질문 생성 실패');
        }
    });

    const handleGenerate = () => {
        if (inputMode === 'text' && !coverLetterText.trim()) {
            toast.error('자소서 내용을 입력해주세요.');
            return;
        }
        if (inputMode === 'select' && !selectedWritingId) {
            toast.error('자소서를 선택해주세요.');
            return;
        }

        generateMutation.mutate({
            writingId: inputMode === 'select' ? selectedWritingId : undefined,
            coverLetterText: inputMode === 'text' ? coverLetterText : undefined,
            interviewStyleId: selectedInterviewStyleId,
            questionCount,
        });
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'hard': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return '기본';
            case 'medium': return '중급';
            case 'hard': return '심화';
            default: return difficulty;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24">
                <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
                    <MessageSquare className="w-10 h-10 text-accent" />
                    면접 질문 생성
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                    자소서를 분석하여 예상 면접 질문과 답변 전략을 제공합니다.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">자소서 입력</h2>

                        {/* Input Mode Toggle */}
                        <div className="flex gap-2 mb-4">
                            <Button
                                variant={inputMode === 'text' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setInputMode('text')}
                            >
                                직접 입력
                            </Button>
                            <Button
                                variant={inputMode === 'select' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setInputMode('select')}
                            >
                                작성 이력에서 선택
                            </Button>
                        </div>

                        {inputMode === 'text' ? (
                            <Textarea
                                className="min-h-[200px] mb-4"
                                placeholder="면접 질문을 생성할 자소서 내용을 입력하세요..."
                                value={coverLetterText}
                                onChange={(e) => setCoverLetterText(e.target.value)}
                            />
                        ) : (
                            <select
                                className="w-full p-3 rounded-md border border-gray-300 bg-background mb-4"
                                value={selectedWritingId || ''}
                                onChange={(e) => setSelectedWritingId(e.target.value ? parseInt(e.target.value) : undefined)}
                            >
                                <option value="">자소서 선택...</option>
                                {writingHistory.map((history) => (
                                    <option key={history.id} value={history.id}>
                                        {history.itemType || '자유양식'} - {history.prompt?.substring(0, 30)}... ({new Date(history.createdAt).toLocaleDateString('ko-KR')})
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Options */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">면접 답변 스타일 (선택)</label>
                                <select
                                    className="w-full p-2 rounded-md border border-gray-300 bg-background"
                                    value={selectedInterviewStyleId || ''}
                                    onChange={(e) => setSelectedInterviewStyleId(e.target.value ? parseInt(e.target.value) : undefined)}
                                >
                                    <option value="">기본 스타일</option>
                                    {interviewStyles.map((style) => (
                                        <option key={style.id} value={style.id}>{style.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">생성할 질문 개수</label>
                                <select
                                    className="w-full p-2 rounded-md border border-gray-300 bg-background"
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                >
                                    <option value={3}>3개</option>
                                    <option value={5}>5개</option>
                                    <option value={7}>7개</option>
                                    <option value={10}>10개</option>
                                </select>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={generateMutation.isPending}
                                className="w-full gap-2"
                            >
                                <Wand2 className="w-4 h-4" />
                                {generateMutation.isPending ? 'AI가 질문 생성 중...' : '면접 질문 생성'}
                            </Button>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">
                            생성된 질문 ({questions.length}개)
                        </h2>

                        {questions.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>왼쪽에서 자소서를 입력하고</p>
                                <p>면접 질문을 생성해보세요!</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                {questions.map((q, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-gray-200 rounded-lg overflow-hidden"
                                    >
                                        {/* Question Header */}
                                        <div
                                            className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
                                            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-accent">Q{idx + 1}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(q.difficulty)}`}>
                                                        {getDifficultyLabel(q.difficulty)}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                        {q.category}
                                                    </span>
                                                </div>
                                                <p className="font-medium">{q.question}</p>
                                            </div>
                                            {expandedIndex === idx ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>

                                        {/* Expanded Content */}
                                        {expandedIndex === idx && (
                                            <div className="p-4 border-t border-gray-200 space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-green-600 mb-2">💡 모범 답변 예시</h4>
                                                    <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
                                                        {q.suggestedAnswer}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-blue-600 mb-2">📋 답변 전략 및 팁</h4>
                                                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                                                        {q.answerStrategy}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
