import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/api';

interface PostSummary {
    frontmatter: {
        title: string;
        slug: string;
        description?: string;
        author?: string;
        date?: string;
        tags?: string[];
        featured?: boolean;
    };
    slug: string;
}

export default function Blog() {
    const { data: posts, isLoading, error } = trpc.content.list.useQuery();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold text-foreground mb-4">블로그</h1>
                    <p className="text-muted-foreground text-lg mb-8">
                        JasoS 사용법, 취업 팁, 그리고 업데이트 소식을 확인하세요.
                    </p>

                    {isLoading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardHeader>
                                        <div className="h-6 bg-muted rounded w-3/4"></div>
                                        <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}

                    {error && (
                        <Card className="border-destructive">
                            <CardContent className="pt-6">
                                <p className="text-destructive">콘텐츠를 불러오는 데 실패했습니다.</p>
                            </CardContent>
                        </Card>
                    )}

                    {posts && posts.length === 0 && (
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-muted-foreground">아직 작성된 글이 없습니다.</p>
                            </CardContent>
                        </Card>
                    )}

                    {posts && posts.length > 0 && (
                        <div className="space-y-6">
                            {posts.map((post: PostSummary) => (
                                <Link key={post.slug} href={`/blog/${post.slug}`}>
                                    <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-xl group-hover:text-accent transition-colors">
                                                        {post.frontmatter.title}
                                                        {post.frontmatter.featured && (
                                                            <Badge variant="secondary" className="ml-2">추천</Badge>
                                                        )}
                                                    </CardTitle>
                                                    {post.frontmatter.description && (
                                                        <CardDescription className="mt-2 line-clamp-2">
                                                            {post.frontmatter.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {post.frontmatter.author && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {post.frontmatter.author}
                                                    </span>
                                                )}
                                                {post.frontmatter.date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(post.frontmatter.date).toLocaleDateString('ko-KR')}
                                                    </span>
                                                )}
                                            </div>
                                            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {post.frontmatter.tags.map((tag: string) => (
                                                        <Badge key={tag} variant="outline">{tag}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
