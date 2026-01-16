import { useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import ReactMarkdown from 'react-markdown';

export default function BlogPost() {
    const [match, params] = useRoute('/blog/:slug');
    const slug = params?.slug || '';

    const { data: post, isLoading, error } = trpc.content.getBySlug.useQuery(slug, {
        enabled: Boolean(slug),
    });

    if (!match) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-3xl mx-auto">
                    <Link href="/blog">
                        <Button variant="ghost" className="mb-6">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            블로그로 돌아가기
                        </Button>
                    </Link>

                    {isLoading && (
                        <Card className="animate-pulse">
                            <CardContent className="pt-6">
                                <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-muted rounded"></div>
                                    <div className="h-4 bg-muted rounded"></div>
                                    <div className="h-4 bg-muted rounded w-2/3"></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {error && (
                        <Card className="border-destructive">
                            <CardContent className="pt-6">
                                <p className="text-destructive">포스트를 불러오는 데 실패했습니다.</p>
                            </CardContent>
                        </Card>
                    )}

                    {!isLoading && !post && (
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-muted-foreground">포스트를 찾을 수 없습니다.</p>
                            </CardContent>
                        </Card>
                    )}

                    {post && (
                        <article>
                            <header className="mb-8">
                                <h1 className="text-4xl font-bold text-foreground mb-4">
                                    {post.frontmatter.title}
                                </h1>

                                <div className="flex items-center gap-4 text-muted-foreground mb-4">
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
                                    <div className="flex flex-wrap gap-2">
                                        {post.frontmatter.tags.map((tag: string) => (
                                            <Badge key={tag} variant="secondary">{tag}</Badge>
                                        ))}
                                    </div>
                                )}
                            </header>

                            <Card>
                                <CardContent className="pt-6 prose prose-slate dark:prose-invert max-w-none">
                                    <ReactMarkdown>{post.content}</ReactMarkdown>
                                </CardContent>
                            </Card>
                        </article>
                    )}
                </div>
            </main>
        </div>
    );
}
