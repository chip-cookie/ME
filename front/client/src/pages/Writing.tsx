import { useState, useEffect } from 'react';
import { getApiUrl } from "@/config";
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PenTool, Wand2, FileText, Building2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from '@/lib/api';

export default function Writing() {
    const [prompt, setPrompt] = useState('');
    const [selectedStyleId, setSelectedStyleId] = useState<number | undefined>();
    const [selectedExperienceId, setSelectedExperienceId] = useState<number | undefined>();
    const [selectedCorporateId, setSelectedCorporateId] = useState<number | undefined>();
    const [result, setResult] = useState('');
    const [itemType, setItemType] = useState('자유양식');
    const [targetCharCount, setTargetCharCount] = useState<number>(1000);

    // JD Analysis Context
    const [jdContext, setJdContext] = useState<{ keywords: string[], summary: string } | null>(null);
    const [isJdDialogOpen, setIsJdDialogOpen] = useState(false);
    const [analysisIdInput, setAnalysisIdInput] = useState("");

    // tRPC hooks
    const { data: styles = [] } = trpc.writingLearning.listStyles.useQuery(undefined, {
        retry: false,
        enabled: true,
    });
    const { data: experiences = [] } = trpc.experiences.list.useQuery(undefined, {
        retry: false,
        enabled: true,
    });
    const { data: corporates = [] } = trpc.corporate.list.useQuery(undefined, {
        retry: false,
        enabled: true,
    });
    const generateMutation = trpc.writing.generate.useMutation();

    // Character Count State
    const [charCount, setCharCount] = useState({
        total: 0,
        noSpace: 0,
        bytes: 0
    });

    const calculateCounts = (text: string) => {
        // 1. Total Chars
        const total = text.length;

        // 2. No Space
        const noSpace = text.replace(/\s/g, '').length;

        // 3. Bytes (Korean: 2bytes, English: 1byte standard)
        // Note: Some sites treat Korean as 3bytes (UTF-8), but typical hiring sites use 2byte (EUC-KR standard legacy)
        // Let's implement the standard 2-byte calculation often used in Korea
        let bytes = 0;
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            // Korean/Multibyte range -> 2 bytes (simplification for recruiting sites)
            // Or calculate real UTF-8 bytes if needed. 
            // Usually: Hangul = 2 or 3. Let's go with 2 for general conformity or 3 for UTF-8.
            // Let's stick to simple byte loop:
            bytes += (charCode > 127) ? 2 : 1;
            // If user wants UTF-8 specifically (3bytes for Hangul), we can adjust.
            // Conventionally "2byte" is widely accepted term in Resume sites.
        }

        setCharCount({ total, noSpace, bytes });
    };

    // Update counts when result changes
    useEffect(() => {
        calculateCounts(result);
    }, [result]);



    const fetchJdAnalysis = async () => {
        if (!analysisIdInput) return;
        try {
            const res = await fetch(getApiUrl(`/api/analysis/${analysisIdInput}`));
            if (res.ok) {
                const data = await res.json();
                if (data.analysis_result) {
                    setJdContext({
                        keywords: data.analysis_result.talent_keywords || [],
                        summary: data.analysis_result.job_summary || ""
                    });
                    toast.success("JD 분석 내용을 불러왔습니다.");
                    setIsJdDialogOpen(false);
                } else {
                    toast.error("아직 분석이 완료되지 않았습니다.");
                }
            } else {
                toast.error("분석 결과를 찾을 수 없습니다.");
            }
        } catch (e) {
            console.error(e);
            toast.error("불러오기 실패");
        }
    };

    // Set default style when styles load
    useEffect(() => {
        if (styles.length > 0 && !selectedStyleId) {
            setSelectedStyleId(styles[0].id);
        }
    }, [styles, selectedStyleId]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        try {
            const data = await generateMutation.mutateAsync({
                prompt,
                styleId: selectedStyleId,
                itemType,
                targetCharCount,
                experienceId: selectedExperienceId,
                corporateId: selectedCorporateId,
                context: {
                    jd_keywords: jdContext?.keywords,
                    jd_summary: jdContext?.summary,
                },
            });

            setResult(data.generatedText);
            const charDiff = data.actualCharCount - (data.targetCharCount || 0);
            const diffPercent = data.targetCharCount
                ? Math.abs(charDiff / data.targetCharCount * 100).toFixed(1)
                : 0;

            // Show similarity score if available
            const similarityMsg = data.styleSimilarity
                ? `\n스타일 일치도: ${data.styleSimilarity}%`
                : '';
            const similarityEmoji = data.styleSimilarity && data.styleSimilarity >= 30 ? '✅' : data.styleSimilarity ? '⚠️' : '';

            toast.success(
                `${similarityEmoji} 작성 완료!\n목표: ${data.targetCharCount}자 / 실제: ${data.actualCharCount}자${similarityMsg}`
            );
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "생성 실패");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Input */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <PenTool className="w-6 h-6 text-accent" />
                                자기소개서 작성
                            </h1>
                        </div>
                        <div className="bg-card rounded-lg border border-border p-6 shadow-sm flex flex-col gap-4">

                            {/* Item Type */}
                            <div>
                                <label className="text-sm font-medium mb-1 block text-muted-foreground">항목 유형</label>
                                <select
                                    className="w-full p-2 rounded-md border border-gray-300 bg-background"
                                    value={itemType.startsWith('custom:') ? 'custom' : itemType}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setItemType('custom:');
                                        } else {
                                            setItemType(e.target.value);
                                        }
                                    }}
                                >
                                    <option value="지원동기">지원동기</option>
                                    <option value="입사후포부">입사 후 포부</option>
                                    <option value="성장과정">성장과정</option>
                                    <option value="성격의장단점">성격의 장단점</option>
                                    <option value="직무역량">직무 역량/경험</option>
                                    <option value="자유양식">자유양식</option>
                                    <option value="custom">📝 직접입력</option>
                                </select>
                            </div>

                            {/* Custom Item Type Input */}
                            {itemType.startsWith('custom:') && (
                                <div className="animate-in slide-in-from-top-2">
                                    <label className="text-sm font-medium mb-1 block text-muted-foreground">
                                        실제 자소서 항목 (질문)
                                    </label>
                                    <Textarea
                                        className="min-h-[80px] resize-none"
                                        placeholder="예: 본인이 겪은 가장 큰 도전과 그 경험을 통해 배운 점을 기술해 주세요. (500자 이내)"
                                        value={itemType.replace('custom:', '')}
                                        onChange={(e) => setItemType(`custom:${e.target.value}`)}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        실제 지원하는 회사의 자소서 항목을 그대로 입력하면 더 정확한 답변이 생성됩니다.
                                    </p>
                                </div>
                            )}

                            {/* Target Character Count */}
                            <div>
                                <label className="text-sm font-medium mb-1 block text-muted-foreground">목표 글자수</label>
                                <input
                                    type="number"
                                    className="w-full p-2 rounded-md border border-gray-300 bg-background"
                                    value={targetCharCount}
                                    onChange={(e) => setTargetCharCount(parseInt(e.target.value) || 1000)}
                                    min={100}
                                    max={3000}
                                    step={100}
                                />
                            </div>

                            {/* Style Selection */}
                            <div>
                                <label className="text-sm font-medium mb-1 block text-muted-foreground">스타일 선택 (선택사항)</label>
                                <select
                                    className="w-full p-2 rounded-md border border-gray-300 bg-background"
                                    value={selectedStyleId || ''}
                                    onChange={(e) => setSelectedStyleId(e.target.value ? parseInt(e.target.value) : undefined)}
                                >
                                    <option value="">기본 스타일</option>
                                    {styles.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Experience Selection */}
                            <div>
                                <label className="text-sm font-medium mb-1 block text-muted-foreground">경험 소재 선택 (선택사항)</label>
                                <select
                                    className="w-full p-2 rounded-md border border-gray-300 bg-background"
                                    value={selectedExperienceId || ''}
                                    onChange={(e) => setSelectedExperienceId(e.target.value ? parseInt(e.target.value) : undefined)}
                                >
                                    <option value="">선택 안 함 (직접 입력)</option>
                                    {experiences.map((exp: any) => {
                                        // analysis column is already JSON type in DB/Drizzle
                                        // but handled as unknown/any in frontend due to loose typing
                                        const analysis = exp.analysis as any;
                                        const label = analysis?.summary
                                            ? `[${analysis.category || '기타'}] ${analysis.summary.substring(0, 30)}...`
                                            : analysis?.situation
                                                ? `[${analysis.category || '기타'}] ${analysis.situation.substring(0, 30)}...`
                                                : exp.title;

                                        return (
                                            <option key={exp.id} value={exp.id}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                                {selectedExperienceId && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        선택한 경험의 분석 내용(STAR 기법)이 프롬프트에 자동으로 포함됩니다.
                                    </p>
                                )}
                            </div>

                            {/* Corporate Analysis Selection */}
                            <div>
                                <label className="text-sm font-medium mb-1 block text-muted-foreground">기업 분석 선택 (선택사항)</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <select
                                        className="w-full p-2 pl-9 rounded-md border border-gray-300 bg-background"
                                        value={selectedCorporateId || ''}
                                        onChange={(e) => setSelectedCorporateId(e.target.value ? parseInt(e.target.value) : undefined)}
                                    >
                                        <option value="">선택 안 함</option>
                                        {corporates.map((corp: any) => (
                                            <option key={corp.id} value={corp.id}>
                                                {corp.companyName} ({new Date(corp.createdAt).toLocaleDateString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {selectedCorporateId && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        기업의 인재상/핵심가치/최신이슈가 반영되어 작성됩니다.
                                    </p>
                                )}
                            </div>

                            <label className="font-medium text-muted-foreground">어떤 자소서를 쓰고 싶으신가요?</label>
                            <Textarea
                                placeholder="예: 마케팅 직무 지원동기를 작성해줘. 강조하고 싶은 점은 창의적인 문제 해결 능력이야."
                                className="flex-1 resize-none text-lg p-4"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                            <div className="flex gap-2 w-full">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsJdDialogOpen(true)}
                                    className="gap-2 flex-1 hover:bg-muted text-accent"
                                >
                                    <FileText className="w-4 h-4" />
                                    {jdContext ? "JD 적용됨" : "JD 불러오기"}
                                </Button>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generateMutation.isPending}
                                    className="gap-2 flex-1 bg-primary hover:bg-primary/90 text-white"
                                >
                                    <Wand2 className="w-5 h-5" />
                                    {generateMutation.isPending ? 'AI가 작성 중...' : 'AI로 생성하기'}
                                </Button>
                            </div>

                            <Dialog open={isJdDialogOpen} onOpenChange={setIsJdDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>JD 분석 결과 불러오기</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <p className="text-sm text-gray-500">
                                            'JD 분석' 페이지에서 분석한 ID를 입력하세요.
                                            (추후 리스트 선택으로 개선 예정)
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                placeholder="분석 ID 입력 (예: 1)"
                                                value={analysisIdInput}
                                                onChange={(e) => setAnalysisIdInput(e.target.value)}
                                            />
                                            <Button onClick={fetchJdAnalysis}>불러오기</Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Right: Output */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-gray-400">결과물</h2>
                        <div className="bg-white rounded-lg border border-border p-8 shadow-sm max-h-[600px] overflow-y-auto whitespace-pre-wrap">
                            {result ? (
                                <div className="prose max-w-none">
                                    {result}
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-muted-foreground text-center">
                                    <p>왼쪽에서 내용을 입력하고<br />생성 버튼을 눌러주세요.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Character Counter Footer */}
                    <div className="bg-gray-50 border-t p-4 flex justify-between items-center text-sm text-gray-600">
                        <div className="flex gap-4">
                            <span>공백포함 <strong className="text-gray-900">{charCount.total}</strong>자</span>
                            <span>공백제외 <strong className="text-gray-900">{charCount.noSpace}</strong>자</span>
                        </div>
                        <div>
                            <span className="text-gray-400">|</span>
                            <span className="ml-4"><strong className="text-gray-900">{charCount.bytes}</strong> bytes</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

