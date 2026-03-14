import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/api';
import Navbar from '@/components/Navbar';

type AnalysisType = 'competency' | 'value' | 'pdf' | 'cover_letter';
type TabType = 'experiences' | 'api-settings';

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

const OPENROUTER_MODELS = [
    { value: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku (빠름 · 저렴)' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (고품질)' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus (최고 품질)' },
    { value: 'google/gemini-flash-1.5', label: 'Gemini 1.5 Flash (빠름)' },
    { value: 'google/gemini-pro-1.5', label: 'Gemini 1.5 Pro (고품질)' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o mini (빠름 · 저렴)' },
    { value: 'openai/gpt-4o', label: 'GPT-4o (고품질)' },
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B (무료 · 오픈소스)' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat (저렴)' },
];

function ApiSettingsTab() {
    const utils = trpc.useUtils();
    const { data: settings, isLoading } = trpc.user.getSettings.useQuery();

    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('anthropic/claude-3.5-haiku');
    const [isEditing, setIsEditing] = useState(false);

    const saveMutation = trpc.user.saveOpenRouterKey.useMutation({
        onSuccess: () => {
            utils.user.getSettings.invalidate();
            setApiKey('');
            setIsEditing(false);
            toast.success('OpenRouter API 키가 저장되었습니다.');
        },
        onError: (err: any) => toast.error(`저장 실패: ${err.message}`),
    });

    const deleteMutation = trpc.user.deleteOpenRouterKey.useMutation({
        onSuccess: () => {
            utils.user.getSettings.invalidate();
            toast.success('API 키가 삭제되었습니다. 기본 LLM을 사용합니다.');
        },
        onError: (err: any) => toast.error(`삭제 실패: ${err.message}`),
    });

    if (isLoading) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* 현재 상태 카드 */}
            <div className={`rounded-xl border-2 p-5 ${settings?.hasKey ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${settings?.hasKey ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <h3 className="font-semibold text-gray-800">
                        {settings?.hasKey ? 'OpenRouter 연동됨' : '기본 LLM 사용 중'}
                    </h3>
                </div>
                {settings?.hasKey ? (
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                            API 키: <span className="font-mono text-gray-800">{settings.maskedKey}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                            사용 모델: <span className="font-medium text-indigo-700">
                                {OPENROUTER_MODELS.find(m => m.value === settings.openRouterModel)?.label ?? settings.openRouterModel}
                            </span>
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">
                        API 키를 연동하면 본인의 OpenRouter 계정으로 글 작성 및 분석이 수행됩니다.
                    </p>
                )}
            </div>

            {/* API 키 입력 폼 */}
            {(!settings?.hasKey || isEditing) && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <h3 className="font-semibold text-gray-800">
                        {isEditing ? 'API 키 변경' : 'OpenRouter API 키 연동'}
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API 키</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="sk-or-v1-..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
                                className="text-indigo-500 hover:underline">openrouter.ai/keys</a>
                            에서 발급받을 수 있습니다.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">사용할 모델</label>
                        <select
                            value={selectedModel}
                            onChange={e => setSelectedModel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            {OPENROUTER_MODELS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        {isEditing && (
                            <button onClick={() => setIsEditing(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                                취소
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (!apiKey.trim()) { toast.error('API 키를 입력해주세요.'); return; }
                                saveMutation.mutate({ apiKey: apiKey.trim(), model: selectedModel });
                            }}
                            disabled={saveMutation.isPending}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {saveMutation.isPending ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </div>
            )}

            {settings?.hasKey && !isEditing && (
                <div className="flex gap-2">
                    <button onClick={() => setIsEditing(true)}
                        className="flex-1 py-2 border border-indigo-300 text-indigo-700 rounded-lg text-sm hover:bg-indigo-50 transition">
                        API 키 변경
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('API 키를 삭제하면 기본 LLM으로 전환됩니다. 계속하시겠습니까?')) {
                                deleteMutation.mutate();
                            }
                        }}
                        disabled={deleteMutation.isPending}
                        className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition disabled:opacity-50"
                    >
                        {deleteMutation.isPending ? '삭제 중...' : '연동 해제'}
                    </button>
                </div>
            )}

            {/* 안내 */}
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 space-y-1">
                <p className="font-semibold">OpenRouter 연동 시 달라지는 점</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                    <li>자소서 작성 · 수정 · 보완을 본인 API 키로 처리</li>
                    <li>면접 질문 생성 · 경험 분석 · 기업 분석도 동일하게 적용</li>
                    <li>원하는 모델 자유 선택 (Claude, GPT-4o, Gemini, Llama 등)</li>
                    <li>서버 API 키 소진 시에도 서비스 이용 가능</li>
                </ul>
            </div>
        </div>
    );
}

export default function MyPage() {
    const [activeTab, setActiveTab] = useState<TabType>('experiences');
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
            setNewTitle(''); setNewContent(''); setShowAddForm(false);
            toast.success('경험이 추가되었습니다!');
        },
        onError: (error: any) => toast.error(`오류: ${error.message}`),
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
            const formData = new FormData();
            formData.append('file', file);
            const API_BASE = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/api/writing/style/upload`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('파일 업로드 실패');
            const data = await response.json();
            if (!data.text || data.text.length < 50) {
                toast.error('텍스트 추출에 실패했거나 내용이 너무 짧습니다.'); return;
            }
            setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
            setNewContent(data.text);
            toast.success('파일에서 텍스트가 추출되었습니다.');
        } catch (error) {
            toast.error('파일 처리 중 오류가 발생했습니다.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim() || !newContent.trim()) { toast.error('제목과 내용을 모두 입력해주세요.'); return; }
        if (newContent.length < 50) { toast.error('경험 내용은 최소 50자 이상 입력해주세요.'); return; }
        setIsAnalyzing(true);
        try { await createMutation.mutateAsync({ title: newTitle, content: newContent, analysisType }); }
        finally { setIsAnalyzing(false); }
    };

    const categoryColors: Record<string, string> = {
        '역량': 'bg-blue-100 text-blue-800', '가치관': 'bg-purple-100 text-purple-800',
        '성과': 'bg-green-100 text-green-800', '리더십': 'bg-orange-100 text-orange-800',
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
                {/* 탭 헤더 */}
                <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit">
                    {([
                        { id: 'experiences' as TabType, label: '경험/이력 관리' },
                        { id: 'api-settings' as TabType, label: 'API 설정' },
                    ]).map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'api-settings' && <ApiSettingsTab />}

                {activeTab === 'experiences' && (
                    <>
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">경험/이력 관리</h1>
                        <div className="grid grid-cols-12 gap-6">
                            {/* Left Sidebar */}
                            <div className="col-span-3 bg-white rounded-lg shadow p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-semibold text-gray-700">경험 목록</h2>
                                    <span className="text-sm text-gray-400">총 {experiences.length}개</span>
                                </div>
                                <button onClick={() => setShowAddForm(true)}
                                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition mb-4 flex items-center justify-center gap-2">
                                    <span>+</span> 새 경험 추가
                                </button>
                                {isLoading ? (
                                    <div className="text-center py-8 text-gray-400">로딩 중...</div>
                                ) : experiences.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">등록된 경험이 없습니다.</div>
                                ) : (
                                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                        {experiences.map((exp: any) => (
                                            <div key={exp.id} onClick={() => setSelectedExperience(exp)}
                                                className={`p-3 rounded-lg cursor-pointer transition ${selectedExperience?.id === exp.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'}`}>
                                                <div className="flex items-start gap-2">
                                                    {exp.category && (
                                                        <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[exp.category] || 'bg-gray-100 text-gray-600'}`}>
                                                            {exp.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-medium text-gray-800 mt-1 truncate">{exp.title}</h3>
                                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{exp.content.substring(0, 80)}...</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Center */}
                            <div className="col-span-5 bg-white rounded-lg shadow p-6">
                                {showAddForm ? (
                                    <>
                                        <h2 className="text-lg font-semibold text-gray-800 mb-4">새 경험 추가</h2>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">분석 유형</label>
                                            <div className="space-y-2">
                                                {(Object.keys(analysisLabels) as AnalysisType[]).map((type) => (
                                                    <label key={type}
                                                        className={`flex items-center p-3 rounded-lg cursor-pointer border transition ${analysisType === type ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                        <input type="radio" name="analysisType" value={type}
                                                            checked={analysisType === type} onChange={() => setAnalysisType(type)} className="sr-only" />
                                                        <div className="ml-2">
                                                            <div className="font-medium text-gray-800">{analysisLabels[type].name}</div>
                                                            <div className="text-sm text-gray-500">{analysisLabels[type].desc}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        {(analysisType === 'pdf' || analysisType === 'cover_letter') && (
                                            <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">파일 업로드 (PDF, DOCX, HWP, TXT)</label>
                                                <input type="file" accept=".pdf,.docx,.hwp,.hwpx,.txt"
                                                    onChange={handleFileUpload} disabled={isAnalyzing}
                                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                            </div>
                                        )}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                                            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                                                placeholder="예: 팀 프로젝트 리더 경험"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">경험 내용</label>
                                            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)}
                                                placeholder="경험을 자세히 적어주세요. (최소 50자)" rows={8}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" />
                                            <div className="text-right text-sm text-gray-400">{newContent.length}자</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowAddForm(false)}
                                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">취소</button>
                                            <button onClick={handleCreate} disabled={isAnalyzing}
                                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                                                {isAnalyzing ? '분석 중...' : '저장 및 분석'}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-20 text-gray-400">
                                        <p className="text-lg mb-2">왼쪽에서 경험을 선택하거나</p>
                                        <p>"새 경험 추가" 버튼을 클릭하세요</p>
                                    </div>
                                )}
                            </div>

                            {/* Right */}
                            <div className="col-span-4 bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">경험 분석 결과</h2>
                                {selectedExperience?.analysis ? (
                                    <div className="space-y-4">
                                        {[
                                            { label: '문제상황', key: 'situation', color: 'red' },
                                            { label: '해결방법', key: 'action', color: 'yellow' },
                                            { label: '구체적 결과', key: 'result', color: 'green' },
                                            { label: '주요 성과', key: 'achievement', color: 'blue' },
                                            { label: '배운 점', key: 'lesson', color: 'purple' },
                                            { label: '핵심 가치관', key: 'core_value', color: 'indigo' },
                                        ].map(({ label, key, color }) => (
                                            <div key={key} className={`p-3 bg-${color}-50 border-l-4 border-${color}-400 rounded`}>
                                                <div className={`text-sm font-medium text-${color}-700`}>{label}</div>
                                                <div className="text-gray-700">{(selectedExperience.analysis as any)[key] || '분석이 필요합니다'}</div>
                                            </div>
                                        ))}
                                        <button onClick={() => { if (confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate(selectedExperience.id); }}
                                            className="w-full mt-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition">
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
                    </>
                )}
            </div>
        </div>
    );
}
