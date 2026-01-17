import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Copy, Target, CheckCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { trpc } from '@/lib/api';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function History() {
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const { data: history = [], isLoading } = trpc.writing.getHistory.useQuery(undefined, { retry: false });

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('클립보드에 복사되었습니다!');
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Clock className="w-8 h-8 text-accent" />
                    작성 기록
                </h1>
                <p className="text-muted-foreground mb-8">
                    지금까지 작성한 자기소개서 목록입니다. ({history.length}개)
                </p>

                {isLoading ? (
                    <div className="text-center py-20 text-muted-foreground">
                        로딩 중...
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground mb-4">아직 작성된 기록이 없습니다.</p>
                        <a href="/writing" className="text-accent hover:underline">
                            새로 작성하러 가기
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-blue-500" />
                                        <div>
                                            <p className="text-2xl font-bold">{history.length}</p>
                                            <p className="text-sm text-muted-foreground">총 작성 횟수</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-r from-green-50 to-green-100">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <Target className="w-8 h-8 text-green-500" />
                                        <div>
                                            <p className="text-2xl font-bold">
                                                {Math.round(history.reduce((sum, h) => sum + (h.actualCharCount || 0), 0) / (history.length || 1))}자
                                            </p>
                                            <p className="text-sm text-muted-foreground">평균 글자수</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-8 h-8 text-purple-500" />
                                        <div>
                                            <p className="text-2xl font-bold">
                                                {new Set(history.map(h => h.itemType)).size}종류
                                            </p>
                                            <p className="text-sm text-muted-foreground">항목 유형</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* History Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {history.map((item) => (
                                <Card
                                    key={item.id}
                                    className="hover:shadow-md transition-shadow cursor-pointer group"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {format(new Date(item.createdAt), 'PPP', { locale: ko })}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {item.itemType || '자유양식'}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg line-clamp-1 group-hover:text-accent transition-colors">
                                            {item.prompt?.substring(0, 50) || "프롬프트 없음"}...
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {item.generatedText?.substring(0, 100) || "생성된 내용 없음"}...
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <span>목표: {item.targetCharCount || '-'}자</span>
                                                <span>/</span>
                                                <span>실제: {item.actualCharCount || '-'}자</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>{selectedItem?.itemType || '자유양식'} 상세보기</span>
                            <Badge variant="outline">
                                {selectedItem && format(new Date(selectedItem.createdAt), 'PPP p', { locale: ko })}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedItem && (
                        <div className="space-y-6 mt-4">
                            {/* Stats */}
                            <div className="flex gap-4">
                                <div className="flex-1 p-3 bg-blue-50 rounded-lg text-center">
                                    <p className="text-xl font-bold">{selectedItem.targetCharCount || '-'}</p>
                                    <p className="text-xs text-muted-foreground">목표 글자수</p>
                                </div>
                                <div className="flex-1 p-3 bg-green-50 rounded-lg text-center">
                                    <p className="text-xl font-bold">{selectedItem.actualCharCount || '-'}</p>
                                    <p className="text-xs text-muted-foreground">실제 글자수</p>
                                </div>
                                <div className="flex-1 p-3 bg-purple-50 rounded-lg text-center">
                                    <p className="text-xl font-bold">
                                        {selectedItem.targetCharCount && selectedItem.actualCharCount
                                            ? Math.round((selectedItem.actualCharCount / selectedItem.targetCharCount) * 100)
                                            : '-'}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">달성률</p>
                                </div>
                            </div>

                            {/* Prompt */}
                            <div>
                                <h4 className="font-semibold mb-2">프롬프트</h4>
                                <p className="p-3 bg-gray-50 rounded-lg text-sm">{selectedItem.prompt}</p>
                            </div>

                            {/* Generated Text */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">생성된 자소서</h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopy(selectedItem.generatedText)}
                                        className="gap-1"
                                    >
                                        <Copy className="w-3 h-3" />
                                        복사
                                    </Button>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                                    {selectedItem.generatedText}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
