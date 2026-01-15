import { useState, useEffect } from 'react';
import { getApiUrl } from "@/config";
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from 'sonner';
import { PenTool, Wand2, FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function Writing() {
    const [prompt, setPrompt] = useState('');
    const [styles, setStyles] = useState<{ id: number, name: string }[]>([]);
    const [selectedStyleId, setSelectedStyleId] = useState<string>("");
    const [result, setResult] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);

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

    // JD Analysis Context
    const [jdContext, setJdContext] = useState<{ keywords: string[], summary: string } | null>(null);
    const [isJdDialogOpen, setIsJdDialogOpen] = useState(false);
    const [analysisIdInput, setAnalysisIdInput] = useState("");

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

    useEffect(() => {
        fetch(getApiUrl('/api/learning/styles'))
            .then(res => res.json())
            .then(data => {
                setStyles(data);
                if (data.length > 0) setSelectedStyleId(data[0].id.toString());
            })
            .catch(console.error);
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        try {
            const response = await fetch(getApiUrl('/api/writing/generate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    style_id: parseInt(selectedStyleId),

                    context: {
                        jd_keywords: jdContext?.keywords,
                        jd_summary: jdContext?.summary
                    }
                })
            });

            if (!response.ok) throw new Error('Generation failed');

            const data = await response.json();
            setResult(data.generated_text);
            toast.success("작성이 완료되었습니다!");
        } catch (e) {
            console.error(e);
            toast.error("생성 실패");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24 h-[calc(100vh-6rem)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    {/* Left: Input */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <PenTool className="w-6 h-6 text-accent" />
                                자기소개서 작성
                            </h1>
                        </div>
                        <div className="flex-1 bg-card rounded-lg border border-border p-6 shadow-sm flex flex-col gap-4">

                            {/* Style Selection */}
                            <div>
                                <label className="text-sm font-medium mb-1 block text-muted-foreground">스타일 선택</label>
                                <select
                                    className="w-full p-2 rounded-md border border-gray-300 bg-background"
                                    value={selectedStyleId}
                                    onChange={(e) => setSelectedStyleId(e.target.value)}
                                >
                                    {styles.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                    {styles.length === 0 && <option value="">학습된 스타일 없음 (기본)</option>}
                                </select>
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
                                    disabled={isGenerating}
                                    className="gap-2 flex-1 bg-primary hover:bg-primary/90 text-white"
                                >
                                    <Wand2 className="w-5 h-5" />
                                    {isGenerating ? 'AI가 작성 중...' : 'AI로 생성하기'}
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
                        <div className="flex-1 bg-white rounded-lg border border-border p-8 shadow-sm overflow-auto whitespace-pre-wrap">
                            {result ? (
                                <div className="prose max-w-none">
                                    {result}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-center">
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

