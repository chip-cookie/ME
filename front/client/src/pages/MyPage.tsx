import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/api';
import Navbar from '@/components/Navbar';

type AnalysisType = 'competency' | 'value' | 'pdf' | 'cover_letter';

interface Analysis {
    situation: string;
    action: string;
    result: string;
    achievement: string;
    lesson: string;
    core_value: string;
    category: string;
    summary: string;
}

interface Experience {
    id: number;
    title: string;
    category: string | null;
    content: string;
    analysisType: string | null;
    analysis: Analysis | null;
    createdAt: Date;
}

export default function MyPage() {
    const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [analysisType, setAnalysisType] = useState<AnalysisType>('competency');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const utils = trpc.useUtils();
    const { data: experiences = [], isLoading } = trpc.experiences.list.useQuery();

    const createMutation = trpc.experiences.create.useMutation({
        onSuccess: () => {
            utils.experiences.list.invalidate();
            setNewTitle('');
            setNewContent('');
            setShowAddForm(false);
            toast.success('경험이 추가되었습니다!');
        },
        onError: (error: any) => {
            toast.error(`오류: ${error.message}`);
        },
    });

    const deleteMutation = trpc.experiences.delete.useMutation({
        onSuccess: () => {
            utils.experiences.list.invalidate();
            setSelectedExperience(null);
            toast.success('경험이 삭제되었습니다.');
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['.pdf', '.docx', '.hwp', '.hwpx', '.txt'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(ext)) {
            toast.error('지원하지 않는 파일 형식입니다. (PDF, DOCX, HWP, TXT만 가능)');
            return;
        }

        setIsAnalyzing(true);
        try {
            // Upload to Python backend for text extraction
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:8000/api/writing/style/upload', {
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

            // Auto-fill title from filename and content from extracted text
            setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
            setNewContent(extractedText);
            toast.success('파일에서 텍스트가 추출되었습니다. 필요시 수정 후 저장하세요.');
        } catch (error) {
            console.error(error);
            toast.error('파일 처리 중 오류가 발생했습니다.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            toast.error('제목과 내용을 모두 입력해주세요.');
            return;
        }
        if (newContent.length < 50) {
            toast.error('경험 내용은 최소 50자 이상 입력해주세요.');
            return;
        }

        setIsAnalyzing(true);
        try {
            await createMutation.mutateAsync({
                title: newTitle,
                content: newContent,
                analysisType,
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            deleteMutation.mutate(id);
        }
    };

    const categoryColors: Record<string, string> = {
        '역량': 'bg-blue-100 text-blue-800',
        '가치관': 'bg-purple-100 text-purple-800',
        '성과': 'bg-green-100 text-green-800',
        '리더십': 'bg-orange-100 text-orange-800',
        '팀워크': 'bg-teal-100 text-teal-800',
    };

    const analysisLabels: Record<AnalysisType, { name: string; desc: string }> = {
        competency: { name: '역량 경험 분석', desc: '나도 몰랐던 나의 역량 심층 분석' },
        value: { name: '가치관 분석', desc: '까다로운 심층 과정, 지원 동기 한 방에 해결!' },
        pdf: { name: 'PDF 분석', desc: '이력서, 자소서, 포트폴리오 파일 업로드로 경험 추출' },
        cover_letter: { name: '자소서 분석', desc: '이미 썼었는 자소서로 경험 추출' },
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-24 pb-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">경험/이력 관리</h1>

                <div className="grid grid-cols-12 gap-6">
                    {/* Left Sidebar - Experience List */}
                    <div className="col-span-3 bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-gray-700">경험 목록</h2>
                            <span className="text-sm text-gray-400">총 {experiences.length}개</span>
                        </div>

                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition mb-4 flex items-center justify-center gap-2"
                        >
                            <span>+</span> 새 경험 추가
                        </button>

                        {isLoading ? (
                            <div className="text-center py-8 text-gray-400">로딩 중...</div>
                        ) : experiences.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                등록된 경험이 없습니다.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {experiences.map((exp: any) => (
                                    <div
                                        key={exp.id}
                                        onClick={() => setSelectedExperience(exp)}
                                        className={`p-3 rounded-lg cursor-pointer transition ${selectedExperience?.id === exp.id
                                            ? 'bg-indigo-50 border-l-4 border-indigo-500'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {exp.category && (
                                                <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[exp.category] || 'bg-gray-100 text-gray-600'}`}>
                                                    {exp.category}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-gray-800 mt-1 truncate">{exp.title}</h3>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                            {exp.content.substring(0, 80)}...
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Center - Input / Add Form */}
                    <div className="col-span-5 bg-white rounded-lg shadow p-6">
                        {showAddForm ? (
                            <>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">새 경험 추가</h2>

                                {/* Analysis Type Selection */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        어떤 타입의 경험을 분석해볼까요?
                                    </label>
                                    <div className="space-y-2">
                                        {(Object.keys(analysisLabels) as AnalysisType[]).map((type) => (
                                            <label
                                                key={type}
                                                className={`flex items-center p-3 rounded-lg cursor-pointer border transition ${analysisType === type
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="analysisType"
                                                    value={type}
                                                    checked={analysisType === type}
                                                    onChange={() => setAnalysisType(type)}
                                                    className="sr-only"
                                                />
                                                <div className="ml-2">
                                                    <div className="font-medium text-gray-800">{analysisLabels[type].name}</div>
                                                    <div className="text-sm text-gray-500">{analysisLabels[type].desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* File Upload - Show for PDF or Cover Letter types */}
                                {(analysisType === 'pdf' || analysisType === 'cover_letter') && (
                                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            📁 파일 업로드 (PDF, DOCX, HWP, TXT)
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.docx,.hwp,.hwpx,.txt"
                                            onChange={handleFileUpload}
                                            disabled={isAnalyzing}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            파일을 업로드하면 텍스트가 자동 추출됩니다.
                                        </p>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                                    <input
                                        type="text"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="예: 팀 프로젝트 리더 경험"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">경험 내용</label>
                                    <textarea
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        placeholder="경험을 자세히 적어주세요. (최소 50자)"
                                        rows={8}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                    <div className="text-right text-sm text-gray-400">{newContent.length}자</div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={isAnalyzing}
                                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                    >
                                        {isAnalyzing ? '분석 중...' : '저장 및 분석'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <p className="text-lg mb-2">👈 왼쪽에서 경험을 선택하거나</p>
                                <p>"새 경험 추가" 버튼을 클릭하세요</p>
                            </div>
                        )}
                    </div>

                    {/* Right - Analysis Results */}
                    <div className="col-span-4 bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">경험 분석 결과</h2>

                        {selectedExperience?.analysis ? (
                            <div className="space-y-4">
                                <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
                                    <div className="text-sm font-medium text-red-700">문제상황</div>
                                    <div className="text-gray-700">{selectedExperience.analysis.situation || '분석이 필요합니다'}</div>
                                </div>

                                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                                    <div className="text-sm font-medium text-yellow-700">해결방법</div>
                                    <div className="text-gray-700">{selectedExperience.analysis.action || '분석이 필요합니다'}</div>
                                </div>

                                <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                                    <div className="text-sm font-medium text-green-700">구체적 결과</div>
                                    <div className="text-gray-700">{selectedExperience.analysis.result || '분석이 필요합니다'}</div>
                                </div>

                                <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                                    <div className="text-sm font-medium text-blue-700">주요 성과</div>
                                    <div className="text-gray-700">{selectedExperience.analysis.achievement || '분석이 필요합니다'}</div>
                                </div>

                                <div className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
                                    <div className="text-sm font-medium text-purple-700">배운 점</div>
                                    <div className="text-gray-700">{selectedExperience.analysis.lesson || '분석이 필요합니다'}</div>
                                </div>

                                <div className="p-3 bg-indigo-50 border-l-4 border-indigo-400 rounded">
                                    <div className="text-sm font-medium text-indigo-700">핵심 가치관</div>
                                    <div className="text-gray-700">{selectedExperience.analysis.core_value || '분석이 필요합니다'}</div>
                                </div>

                                <button
                                    onClick={() => handleDelete(selectedExperience.id)}
                                    className="w-full mt-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                                >
                                    삭제
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <p>경험을 선택하면</p>
                                <p>AI 분석 결과가 표시됩니다</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
