<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc';
	import { onMount } from 'svelte';
    import Navbar from '$lib/components/Navbar.svelte';
	
	let { children, data } = $props();

</script>

<div class="min-h-screen flex flex-col bg-[#fcfcfd] font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
	<Navbar user={data.user} />

	<main class="flex-1 w-full relative">
		{@render children()}
	</main>
    
    <footer class="bg-white border-t border-gray-100 py-20">
        <div class="container-px">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div class="col-span-1 md:col-span-2">
                    <a href="/" class="flex items-center mb-6 px-1">
                        <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-100/50">J</div>
                    </a>
                    <p class="text-gray-400 font-medium max-w-sm leading-relaxed">
                        JasoS는 AI 기술을 활용하여 당신의 커리어 성공을 돕는 차세대 자기소개서&면접 준비 플랫폼입니다. 
                        우리는 기술을 통해 취업의 장벽을 낮추고, 모든 지원자가 자신의 가치를 완벽하게 증명할 수 있도록 돕습니다.
                    </p>
                </div>
                <div>
                    <h4 class="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Product</h4>
                    <ul class="space-y-4 text-sm font-bold text-gray-400">
                        <li><a href="/writing" class="hover:text-indigo-600 transition-colors">자기소개서 작성</a></li>
                        <li><a href="/interview" class="hover:text-indigo-600 transition-colors">AI 면접 준비</a></li>
                        <li><a href="/corporate" class="hover:text-indigo-600 transition-colors">기업 정밀 분석</a></li>
                        <li><a href="/analysis" class="hover:text-indigo-600 transition-colors">JD 매칭 분석</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Company</h4>
                    <ul class="space-y-4 text-sm font-bold text-gray-400">
                        <li><a href="/services" class="hover:text-indigo-600 transition-colors">우리 정보</a></li>
                        <li><a href="/blog" class="hover:text-indigo-600 transition-colors">최신 소식</a></li>
                        <li><a href="/contact" class="hover:text-indigo-600 transition-colors">지원 문의</a></li>
                        <li><a href="/results" class="hover:text-indigo-600 transition-colors">성공 사례</a></li>
                    </ul>
                </div>
            </div>
            <div class="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <p class="text-xs font-bold text-gray-300 uppercase tracking-widest">
                    &copy; 2026 JasoS. Built with Svelte 5 & Stratify Logic.
                </p>
                <div class="flex gap-6">
                    <a href="/" class="text-xs font-bold text-gray-300 hover:text-indigo-600 transition-colors uppercase tracking-widest">Privacy Policy</a>
                    <a href="/" class="text-xs font-bold text-gray-300 hover:text-indigo-600 transition-colors uppercase tracking-widest">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>
</div>

<style>
    :global(html) {
        scroll-behavior: smooth;
    }
    
    :global(body) {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
</style>
