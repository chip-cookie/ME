import { useState } from 'react';
import { trpc } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Save, Trash2, Building2, Globe, TrendingUp, AlertTriangle, Target, Briefcase } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function CorporateAnalysis() {
    const [companyName, setCompanyName] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [analyzing, setAnalyzing] = useState(false);

    // Analysis Result State
    const [result, setResult] = useState<any>(null);

    // Mutations
    const analyzeMutation = trpc.corporate.analyze.useMutation();
    const saveMutation = trpc.corporate.create.useMutation();
    const deleteMutation = trpc.corporate.delete.useMutation();
    const utils = trpc.useContext();

    // History Query
    const { data: history = [] } = trpc.corporate.list.useQuery();

    const handleAnalyze = async () => {
        if (!companyName.trim()) {
            toast.error("기업명을 입력해주세요.");
            return;
        }

        setAnalyzing(true);
        try {
            const data = await analyzeMutation.mutateAsync({
                companyName,
                websiteUrl: websiteUrl.trim() || undefined
            });
            setResult(data);
            toast.success("분석이 완료되었습니다!");
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "분석 중 오류가 발생했습니다.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        try {
            await saveMutation.mutateAsync({
                companyName,
                websiteUrl: websiteUrl.trim() || undefined,
                analysisResult: JSON.stringify(result)
            });
            toast.success("분석 결과가 저장되었습니다.");
            utils.corporate.list.invalidate();
        } catch (e) {
            console.error(e);
            toast.error("저장 실패");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success("삭제되었습니다.");
            utils.corporate.list.invalidate();
        } catch (e) {
            toast.error("삭제 실패");
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
                        <div className="flex flex-col gap-4">
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-primary" />
                                기업 분석 (Corporate Analysis)
                            </h1>
                            <p className="text-muted-foreground mb-2">
                                지원하려는 기업의 홈페이지를 분석하여 인재상, 최신 이슈, SWOT 분석 등을 제공합니다.
                            </p>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">기업명 *</label>
                                <Input
                                    placeholder="예: 삼성전자, 네이버"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">홈페이지 URL (선택)</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="예: https://www.samsung.com"
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    URL을 입력하면 해당 사이트의 정보를 크롤링하여 더 정확하게 분석합니다. 미입력 시 AI의 지식에 의존합니다.
                                </p>
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        기업 분석 중... (시간이 소요될 수 있습니다)
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="mr-2 h-5 w-5" />
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
                                        return (
                                            <Card key={log.id} className="hover:bg-accent/5 transition-colors border-l-4 border-l-primary relative group">
                                                <CardHeader className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-sm font-medium line-clamp-1">
                                                                {log.companyName}
                                                            </CardTitle>
                                                            <CardDescription className="text-xs mt-1 truncate max-w-[200px]">
                                                                {log.websiteUrl || "URL 없음"}
                                                            </CardDescription>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(log.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
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
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                                {/* Mission & Vision */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Target className="w-5 h-5 text-red-500" />
                                            미션 / 비전 / 핵심가치
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm leading-relaxed">{result.mission}</p>
                                    </CardContent>
                                </Card>

                                {/* Ideal Candidate */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-blue-500" />
                                            인재상 키워드
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {result.ideal_candidate.map((k: string) => (
                                                <span key={k} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                                                    {k}
                                                </span>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Business Areas */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-green-500" />
                                            주요 사업 영역
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {result.business.map((b: string, i: number) => (
                                                <li key={i} className="text-sm">{b}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* SWOT Analysis */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-purple-500" />
                                            SWOT 분석
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                <h4 className="font-semibold text-blue-700 mb-1 flex items-center gap-1">💪 강점 (Strength)</h4>
                                                <p className="text-sm">{result.swot.strength}</p>
                                            </div>
                                            <div className="bg-red-50/50 p-3 rounded-lg border border-red-100">
                                                <h4 className="font-semibold text-red-700 mb-1 flex items-center gap-1">📉 약점 (Weakness)</h4>
                                                <p className="text-sm">{result.swot.weakness}</p>
                                            </div>
                                            <div className="bg-green-50/50 p-3 rounded-lg border border-green-100">
                                                <h4 className="font-semibold text-green-700 mb-1 flex items-center gap-1">🚀 기회 (Opportunity)</h4>
                                                <p className="text-sm">{result.swot.opportunity}</p>
                                            </div>
                                            <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                                                <h4 className="font-semibold text-orange-700 mb-1 flex items-center gap-1">⚠️ 위협 (Threat)</h4>
                                                <p className="text-sm">{result.swot.threat}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* DART/NPS data is stored for LLM context but not displayed in UI */}

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            주요 이슈 및 재무 요약
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 text-muted-foreground">최신 이슈</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {result.recent_issues.map((issue: string, i: number) => (
                                                    <li key={i} className="text-sm">{issue}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="pt-2 border-t border-dashed">
                                            <h4 className="font-semibold text-sm mb-2 text-muted-foreground mt-2">재무/성장성</h4>
                                            <p className="text-sm">{result.financials}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground bg-card border border-border rounded-lg border-dashed">
                                <p>기업명과 URL을 입력하고<br />분석하기 버튼을 눌러주세요.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
