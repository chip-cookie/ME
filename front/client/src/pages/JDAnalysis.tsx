
import { getApiUrl } from "@/config";
import React, { useState, useRef } from "react";
import { Link } from "wouter";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    UploadCloud,
    FileText,
    BarChart3,
    MessageSquare,
    Building2,
    CheckCircle2,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface AnalysisResult {
    id: number;
    created_at: string;
    file_name: string;
    analysis_result?: {
        corporate_name?: string;
        job_title?: string;
        job_summary?: string;
        talent_keywords?: string[];
        raw_llm_output?: string; // Fallback
    };
    financial_data?: {
        status?: string;
        // DART financial data structure stub
        // DART financial data structure stub
        columns?: string[];
        data?: any[];
        // NPS Data
        nps?: {
            status: string;
            employees: number;
            new_hires: number;
            departures: number;
            avg_monthly_income: number;
            corp_addr: string;
        };
    };
}

export default function JDAnalysis() {
    const [isUploading, setIsUploading] = useState(false);
    const [analysisId, setAnalysisId] = useState<number | null>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Chat State
    const [chatMessage, setChatMessage] = useState("");
    const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
    const [isChatting, setIsChatting] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // 1. Upload & Create Session
            const res = await fetch(getApiUrl("/api/analysis/upload"), {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            setAnalysisId(data.id);

            // 2. Poll for results (Simulated with simple delay -> real poll preferably)
            // For UX, we'll confirm upload and ask user to refresh or auto-refresh
            // Let's do a simple polling loop
            pollAnalysis(data.id);

        } catch (error) {
            console.error(error);
            alert("파일 업로드 중 오류가 발생했습니다.");
            setIsUploading(false);
        }
    };

    const pollAnalysis = async (id: number) => {
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            try {
                const res = await fetch(getApiUrl(`/api/analysis/${id}`));
                if (res.ok) {
                    const data = await res.json();
                    // Check if analysis is populated (assuming it starts null)
                    // Since our backend sets it in background, we check for presence
                    if (data.analysis_result) {
                        setAnalysisData(data);
                        setIsUploading(false);
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                console.error(err);
            }

            if (attempts > 20) { // Timeout after 40s
                clearInterval(interval);
                setIsUploading(false);
                alert("분석 시간이 오래 걸립니다. 나중에 다시 확인해주세요.");
            }
        }, 2000);
    };

    const handleChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim() || !analysisId) return;

        const userMsg = chatMessage;
        setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
        setChatMessage("");
        setIsChatting(true);

        try {
            const res = await fetch(getApiUrl("/api/analysis/chat"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: analysisId, message: userMsg }),
            });
            const data = await res.json();
            setChatHistory((prev) => [...prev, { role: "bot", text: data.response }]);
        } catch (err) {
            setChatHistory((prev) => [...prev, { role: "bot", text: "오류가 발생했습니다." }]);
        } finally {
            setIsChatting(false);
        }
    };

    // Mock Data for Charts if real data missing
    const chartData = [
        { name: "2021", 매출액: 4000, 영업이익: 2400 },
        { name: "2022", 매출액: 3000, 영업이익: 1398 },
        { name: "2023", 매출액: 2000, 영업이익: 9800 },
        { name: "2024", 매출액: 2780, 영업이익: 3908 },
    ];

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">JD 분석 (기업 & 직무)</h1>
                <p className="text-gray-500">
                    채용공고(JD)를 업로드하면 기업 정보(DART)와 인재상을 AI가 분석해드립니다.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Upload & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-accent" />
                                JD 업로드
                            </CardTitle>
                            <CardDescription>PDF, 이미지, 텍스트 파일 지원</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,.txt,.docx,.png,.jpg,.jpeg"
                                    onChange={handleFileUpload}
                                />
                                {isUploading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
                                        <p className="text-sm text-gray-600">AI가 분석 중입니다...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <FileText className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-sm font-medium text-gray-700">클릭하여 파일 선택</p>
                                        <p className="text-xs text-gray-500 mt-1">또는 여기로 드래그</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {analysisData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-accent" />
                                    분석 요약
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-gray-500 text-xs">기업명</Label>
                                    <p className="font-semibold text-lg">
                                        {analysisData.analysis_result?.corporate_name || "미식별"}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-gray-500 text-xs">채용 직무</Label>
                                    <p className="font-medium">
                                        {analysisData.analysis_result?.job_title || "전체"}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <Label className="text-gray-500 text-xs mb-2 block">인재상/키워드</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisData.analysis_result?.talent_keywords?.map((kw, i) => (
                                            <Badge key={i} variant="secondary" className="bg-secondary/10 text-secondary-foreground">
                                                {kw}
                                            </Badge>
                                        )) || <span className="text-sm text-gray-400">키워드 없음</span>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Detailed Analysis & Chat */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="dashboard">
                        <TabsList>
                            <TabsTrigger value="dashboard" className="gap-2">
                                <BarChart3 className="w-4 h-4" /> 기업 분석 대시보드
                            </TabsTrigger>
                            <TabsTrigger value="chat" className="gap-2">
                                <MessageSquare className="w-4 h-4" /> JD Q&A 챗봇
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard" className="space-y-6 mt-4">
                            {analysisData ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-gray-500">주요 사업 요약</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm leading-relaxed text-gray-700">
                                                    {/* Placeholder for business summary from DART */}
                                                    {analysisData.analysis_result?.job_summary || "사업 내용 요약 데이터가 없습니다."}
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-gray-500">재무 하이라이트</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-[200px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={chartData}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="name" fontSize={12} />
                                                            <YAxis fontSize={12} />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="매출액" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                                                            <Bar dataKey="영업이익" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* NPS Data Section */}
                                    {analysisData.financial_data?.nps?.status === "Success" && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-gray-500">총 임직원 수</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold">
                                                        {analysisData.financial_data.nps.employees.toLocaleString()}명
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">국민연금 가입 기준</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-gray-500">평균 연봉 (추정)</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-primary">
                                                        {(analysisData.financial_data.nps.avg_monthly_income * 12 / 10000).toLocaleString()}만원
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">월 평균 소득액 기준</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-gray-500">최근 입/퇴사율</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-sm text-primary">입사 {((analysisData.financial_data.nps.new_hires / analysisData.financial_data.nps.employees) * 100).toFixed(1)}%</span>
                                                        <span className="text-sm text-destructive">퇴사 {((analysisData.financial_data.nps.departures / analysisData.financial_data.nps.employees) * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden flex">
                                                        <div
                                                            className="bg-primary h-full"
                                                            style={{ width: `${(analysisData.financial_data.nps.new_hires / (analysisData.financial_data.nps.new_hires + analysisData.financial_data.nps.departures)) * 100}%` }}
                                                        />
                                                        <div
                                                            className="bg-destructive h-full"
                                                            style={{ width: `${(analysisData.financial_data.nps.departures / (analysisData.financial_data.nps.new_hires + analysisData.financial_data.nps.departures)) * 100}%` }}
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}

                                    <Card className="bg-primary/5 border-primary/10">
                                        <CardContent className="p-4 flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-primary mb-1">자소서 작성 팁</h4>
                                                <p className="text-sm text-primary/80">
                                                    이 기업은 <strong>{analysisData.analysis_result?.talent_keywords?.[0]}</strong> 역량을 특히 강조하고 있습니다.
                                                    경험을 서술할 때 해당 키워드와 관련된 구체적인 성과를 포함해보세요.
                                                </p>
                                                <Button variant="link" className="p-0 h-auto text-primary mt-2 font-semibold" asChild>
                                                    <Link href="/writing">자소서 작성하러 가기 &rarr;</Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg text-gray-400 bg-gray-50">
                                    왼쪽에서 JD 파일을 업로드하면 분석 결과가 여기에 표시됩니다.
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="chat" className="mt-4">
                            <Card className="h-[500px] flex flex-col">
                                <CardHeader className="py-3 border-b">
                                    <CardTitle className="text-base">채용 담당자 AI 챗봇</CardTitle>
                                    <CardDescription className="text-xs">공고 내용에 대해 자유롭게 물어보세요 (예: 야근이 많은가요?)</CardDescription>
                                </CardHeader>
                                <div className="flex-1 overflow-hidden">
                                    <ScrollArea className="h-full p-4">
                                        <div className="space-y-4">
                                            {chatHistory.length === 0 && (
                                                <div className="text-center text-gray-400 text-sm py-10">
                                                    대화 내역이 없습니다.
                                                </div>
                                            )}
                                            {chatHistory.map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                                        }`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.role === "user"
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted text-foreground"
                                                            }`}
                                                    >
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))}
                                            {isChatting && (
                                                <div className="flex justify-start">
                                                    <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500 animate-pulse">
                                                        입력 중...
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                                <div className="p-4 border-t">
                                    <form onSubmit={handleChat} className="flex gap-2">
                                        <Input
                                            value={chatMessage}
                                            onChange={(e) => setChatMessage(e.target.value)}
                                            placeholder="질문을 입력하세요..."
                                            disabled={!analysisId || isChatting}
                                        />
                                        <Button type="submit" disabled={!analysisId || isChatting}>
                                            전송
                                        </Button>
                                    </form>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
