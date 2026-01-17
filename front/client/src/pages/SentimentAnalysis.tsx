import { useState } from 'react';
import { trpc } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Save, Trash2, Heart, Brain, Star } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function SentimentAnalysis() {
    const [text, setText] = useState('');
    const [analyzing, setAnalyzing] = useState(false);

    // Analysis Result State
    const [result, setResult] = useState<any>(null);

    // Mutations
    const analyzeMutation = trpc.experience.analyze.useMutation();
    const saveMutation = trpc.experience.create.useMutation();
    const utils = trpc.useContext();

    // History Query
    const { data: history = [] } = trpc.experience.list.useQuery();

    const handleAnalyze = async () => {
        if (!text.trim() || text.length < 10) {
            toast.error("최소 10자 이상 입력해주세요.");
            return;
        }

        setAnalyzing(true);
        try {
            const data = await analyzeMutation.mutateAsync({ text });
            setResult(data);
            toast.success("분석이 완료되었습니다!");
        } catch (e) {
            console.error(e);
            toast.error("분석 중 오류가 발생했습니다.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        try {
            await saveMutation.mutateAsync({
                content: text,
                analysisResult: JSON.stringify(result)
            });
            toast.success("분석 결과가 저장되었습니다.");
            utils.experience.list.invalidate();
            // Reset or keep? Let's keep for now.
        } catch (e) {
            console.error(e);
            toast.error("저장 실패");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left: Input & History */}
                    <div className="flex flex-col gap-6">
                        {/* Input Area */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Heart className="w-6 h-6 text-accent" />
                                경험 & 감정 분석
                            </h1>
                            <p className="text-muted-foreground mb-2">
                                경험했던 상황과 그때 느꼈던 감정, 생각을 자유롭게 적어주세요.
                                AI가 STAR 기법으로 정리하고 성향을 분석해드립니다.
                            </p>
                            <Textarea
                                className="min-h-[200px] resize-none p-4 text-base"
                                placeholder="예: 팀 프로젝트에서 의견 충돌이 있었는데, 감정적으로 대응하지 않고 데이터를 근거로 설득했습니다. 그때 참 힘들었지만 뿌듯했습니다..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                            <Button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="w-full h-12 text-lg bg-accent hover:bg-accent/90"
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        분석 중...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="mr-2 h-5 w-5" />
                                        분석하기
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* History List */}
                        {history.length > 0 && (
                            <div className="mt-8">
                                <h3 className="font-semibold mb-4 text-lg">최근 분석 기록</h3>
                                <div className="flex flex-col gap-3">
                                    {history.map((log: any) => {
                                        const analysis = typeof log.analysisResult === 'string'
                                            ? JSON.parse(log.analysisResult)
                                            : log.analysisResult;

                                        return (
                                            <Card key={log.id} className="hover:bg-accent/5 transition-colors cursor-pointer border-l-4 border-l-accent">
                                                <CardHeader className="p-4">
                                                    <CardTitle className="text-sm font-medium line-clamp-1">
                                                        {analysis?.star_summary?.T || "제목 없음"}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs line-clamp-2 mt-1">
                                                        {log.content}
                                                    </CardDescription>
                                                    <div className="flex gap-2 mt-2">
                                                        {analysis?.personality?.keywords?.slice(0, 3).map((k: string) => (
                                                            <span key={k} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                                                                {k}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </CardHeader>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Analysis Result */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-400">분석 결과</h2>
                            {result && (
                                <Button onClick={handleSave} variant="outline" className="gap-2">
                                    <Save className="w-4 h-4" />
                                    저장하기
                                </Button>
                            )}
                        </div>

                        {result ? (
                            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* STAR Summary */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Star className="w-5 h-5 text-yellow-500" />
                                            STAR 요약
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-[30px_1fr] gap-2">
                                            <span className="font-bold text-accent">S</span>
                                            <p className="text-sm">{result.star_summary.S}</p>
                                        </div>
                                        <div className="grid grid-cols-[30px_1fr] gap-2">
                                            <span className="font-bold text-accent">T</span>
                                            <p className="text-sm">{result.star_summary.T}</p>
                                        </div>
                                        <div className="grid grid-cols-[30px_1fr] gap-2">
                                            <span className="font-bold text-accent">A</span>
                                            <p className="text-sm">{result.star_summary.A}</p>
                                        </div>
                                        <div className="grid grid-cols-[30px_1fr] gap-2">
                                            <span className="font-bold text-accent">R</span>
                                            <p className="text-sm">{result.star_summary.R}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Personality Analysis */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Brain className="w-5 h-5 text-purple-500" />
                                            성향 & 감정 분석
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Keywords */}
                                        <div className="flex flex-wrap gap-2">
                                            {result.personality.keywords.map((keyword: string) => (
                                                <span key={keyword} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Scores */}
                                        <div className="space-y-3">
                                            {Object.entries(result.personality.score).map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-4">
                                                    <span className="w-24 text-sm font-medium capitalize text-muted-foreground">
                                                        {key === 'analytical' ? '분석적 사고' :
                                                            key === 'creativity' ? '창의성' :
                                                                key === 'leadership' ? '리더십' :
                                                                    key === 'empathy' ? '공감 능력' :
                                                                        key === 'persistence' ? '끈기/집요함' : key}
                                                    </span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-accent transition-all duration-1000 ease-out"
                                                            style={{ width: `${value}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold w-8 text-right">{value as number}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Comment */}
                                        <div className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed border border-border">
                                            💡 {result.personality.comment}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground bg-card border border-border rounded-lg border-dashed">
                                <p>왼쪽에서 내용을 입력하고<br />분석하기 버튼을 눌러주세요.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
