import { useState } from 'react';
import { useLocation } from 'wouter';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { trpc } from '@/lib/api';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();

    // Login form state
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register form state
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerName, setRegisterName] = useState('');

    const loginMutation = trpc.auth.login.useMutation({
        onSuccess: (data) => {
            toast.success(`환영합니다, ${data.user?.name || data.user?.username}님!`);
            utils.auth.me.invalidate();
            setLocation('/');
        },
        onError: (error) => {
            toast.error(error.message || '로그인에 실패했습니다.');
        },
    });

    const registerMutation = trpc.auth.register.useMutation({
        onSuccess: (data) => {
            toast.success('회원가입이 완료되었습니다!');
            utils.auth.me.invalidate();
            setLocation('/');
        },
        onError: (error) => {
            toast.error(error.message || '회원가입에 실패했습니다.');
        },
    });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginUsername || !loginPassword) {
            toast.error('사용자명과 비밀번호를 입력해주세요.');
            return;
        }
        loginMutation.mutate({ username: loginUsername, password: loginPassword });
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerUsername || !registerPassword) {
            toast.error('사용자명과 비밀번호를 입력해주세요.');
            return;
        }
        registerMutation.mutate({
            username: registerUsername,
            password: registerPassword,
            name: registerName || undefined,
        });
    };

    const isLoading = loginMutation.isPending || registerMutation.isPending;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-md mx-auto">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">JasoS</CardTitle>
                            <CardDescription>로그인하거나 새 계정을 만드세요</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="login" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="login">
                                        <LogIn className="w-4 h-4 mr-2" />
                                        로그인
                                    </TabsTrigger>
                                    <TabsTrigger value="register">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        회원가입
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="login">
                                    <form onSubmit={handleLogin} className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="login-username">사용자명</Label>
                                            <Input
                                                id="login-username"
                                                type="text"
                                                placeholder="사용자명을 입력하세요"
                                                value={loginUsername}
                                                onChange={(e) => setLoginUsername(e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="login-password">비밀번호</Label>
                                            <Input
                                                id="login-password"
                                                type="password"
                                                placeholder="비밀번호를 입력하세요"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? '로그인 중...' : '로그인'}
                                        </Button>
                                    </form>
                                </TabsContent>

                                <TabsContent value="register">
                                    <form onSubmit={handleRegister} className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="register-username">사용자명</Label>
                                            <Input
                                                id="register-username"
                                                type="text"
                                                placeholder="3-20자 사이로 입력하세요"
                                                value={registerUsername}
                                                onChange={(e) => setRegisterUsername(e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-name">이름 (선택)</Label>
                                            <Input
                                                id="register-name"
                                                type="text"
                                                placeholder="표시될 이름"
                                                value={registerName}
                                                onChange={(e) => setRegisterName(e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-password">비밀번호</Label>
                                            <Input
                                                id="register-password"
                                                type="password"
                                                placeholder="최소 6자 이상"
                                                value={registerPassword}
                                                onChange={(e) => setRegisterPassword(e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? '가입 중...' : '회원가입'}
                                        </Button>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
