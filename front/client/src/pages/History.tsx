import { useState, useEffect } from 'react';
import { getApiUrl } from "@/config";
import Navbar from '@/components/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface HistoryItem {
    id: number;
    initial_prompt: string;
    final_output: string;
    started_at: string;
    style_id: number;
    revision_count: number;
}

export default function History() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(getApiUrl('/api/writing/history'))
            .then(res => res.json())
            .then(data => {
                setHistory(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Clock className="w-8 h-8 text-accent" />
                    작성 기록
                </h1>
                <p className="text-muted-foreground mb-8">
                    지금까지 작성한 자기소개서 목록입니다.
                </p>

                {isLoading ? (
                    <div className="text-center py-20 text-muted-foreground">
                        로딩 중...
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground mb-4">아직 작성된 기록이 없습니다.</p>
                        <a href="/writing" className="text-accent hover:underline">
                            새로 작성하러 가기
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((item) => (
                            <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="secondary" className="text-xs">
                                            {format(new Date(item.started_at), 'PPP p', { locale: ko })}
                                        </Badge>
                                        {item.revision_count > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                                {item.revision_count}회 수정됨
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-lg line-clamp-1 group-hover:text-accent transition-colors">
                                        {item.initial_prompt}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {item.final_output || "생성된 내용 없음"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <FileText className="w-4 h-4 mr-1" />
                                        <span>자소서 생성</span>
                                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
