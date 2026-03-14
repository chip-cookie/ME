<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { User, Lock, Heart, ArrowRight, Loader2, Mail, ShieldAlert } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';
    
    let username = $state('');
    let password = $state('');
    let confirmPassword = $state('');
    let name = $state('');
    let error = $state('');
    let loading = $state(false);

    async function handleRegister(e: Event) {
        e.preventDefault();
        error = '';
        loading = true;

        if (password !== confirmPassword) {
            error = '비밀번호가 일치하지 않습니다.';
            loading = false;
            return;
        }

        try {
            await trpc($page).auth.register.mutate({ 
                username, 
                password,
                name: name || undefined
            });
            window.location.href = '/';
        } catch (e: any) {
            console.error(e);
            error = e.message || 'Registration failed';
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen bg-[#fcfcfd] flex items-center justify-center py-20 px-4">
    <div class="max-w-md w-full" in:fly={{ y: 20, duration: 800 }}>
        <!-- Header -->
        <div class="text-center mb-10">
            <div class="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">J</div>
            <h2 class="text-3xl font-black text-gray-900 tracking-tight">Join JasoS</h2>
            <p class="mt-3 text-gray-500 font-medium whitespace-pre-wrap">미래를 준비하는 스마트한 시작,<br/>지금 바로 함께 하세요.</p>
        </div>

        <div class="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16"></div>

            <form class="space-y-6 relative z-10" onsubmit={handleRegister}>
                <div class="space-y-4">
                    <div class="space-y-2">
                        <label for="username" class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Account ID</label>
                        <div class="relative group">
                            <User class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                            <input id="username" type="text" required class="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium" placeholder="아이디" bind:value={username} />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label for="name" class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Real Name</label>
                        <div class="relative group">
                            <Heart class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                            <input id="name" type="text" class="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium" placeholder="이름 (선택)" bind:value={name} />
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <label for="password" class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Password</label>
                        <div class="relative group">
                            <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                            <input id="password" type="password" required class="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium" placeholder="비밀번호" bind:value={password} />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label for="confirm-password" class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Confirm Password</label>
                        <div class="relative group">
                            <ShieldAlert class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                            <input id="confirm-password" type="password" required class="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium" placeholder="비밀번호 확인" bind:value={confirmPassword} />
                        </div>
                    </div>
                </div>

                {#if error}
                    <div class="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100" transition:fade>
                        {error}
                    </div>
                {/if}

                <div class="pt-2">
                    <button 
                        type="submit" 
                        disabled={loading} 
                        class="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        {#if loading}
                            <Loader2 class="w-4 h-4 animate-spin text-white/50" />
                            Creating Account...
                        {:else}
                            Start Journey
                            <ArrowRight class="w-4 h-4" />
                        {/if}
                    </button>
                </div>
            </form>

            <div class="mt-8 pt-8 border-t border-gray-50 text-center">
                <p class="text-sm text-gray-400 font-medium">
                    이미 계정이 있으신가요? 
                    <a href="/login" class="text-indigo-600 font-black ml-1 hover:underline">로그인 하기</a>
                </p>
            </div>
        </div>

        <p class="mt-12 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
            Verified User Enrollment &copy; 2026 JasoS
        </p>
    </div>
</div>
