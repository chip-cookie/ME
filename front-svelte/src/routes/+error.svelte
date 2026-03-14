<script lang="ts">
    import { page } from '$app/stores';
    import { Home, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';
</script>

<div class="min-h-screen bg-white flex flex-col items-center justify-center px-4">
    <div class="relative mb-12" in:fly={{ y: -20, duration: 800 }}>
        <!-- Large 404 Text -->
        <h1 class="text-[12rem] md:text-[20rem] font-black text-gray-50 leading-none select-none">
            {$page.status}
        </h1>
        
        <!-- Floating Elements -->
        <div class="absolute inset-0 flex items-center justify-center">
            <div class="bg-indigo-600 p-8 rounded-[3rem] shadow-2xl shadow-indigo-200 text-white flex flex-col items-center gap-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <AlertCircle class="w-16 h-16 opacity-50" />
                <span class="text-xs font-black uppercase tracking-[0.3em]">System Alert</span>
            </div>
        </div>
    </div>

    <div class="text-center max-w-xl relative i-10" in:fade={{ delay: 400 }}>
        <h2 class="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">
            길을 잃으신 것 같아요.
        </h2>
        <p class="text-xl text-gray-500 font-medium mb-12 leading-relaxed">
            찾으시는 페이지가 삭제되었거나, 주소가 변경되었을 수 있습니다. <br />
            아래 버튼을 필용해 안전한 곳으로 안내해 드릴게요.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/" class="group flex items-center gap-3 px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-2xl shadow-gray-200">
                <Home class="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                홈으로 이동
            </a>
            <button 
                onclick={() => window.location.reload()}
                class="group flex items-center gap-3 px-10 py-5 bg-white text-gray-500 border border-gray-100 rounded-2xl font-black text-lg hover:border-indigo-200 hover:text-indigo-600 transition-all"
            >
                <RefreshCw class="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                다시 시도
            </button>
        </div>

        <div class="mt-20 pt-12 border-t border-gray-50 flex flex-wrap items-center justify-center gap-8 opacity-50">
            <a href="/contact" class="text-xs font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">Support Center</a>
            <a href="/blog" class="text-xs font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">Knowledge Base</a>
            <a href="/results" class="text-xs font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">System Status</a>
        </div>
    </div>
</div>
