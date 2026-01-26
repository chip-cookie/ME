<script lang="ts">
    import { page } from '$app/stores';
    import { trpc } from '$lib/trpc';
    import { 
        Clock, 
        FileText, 
        Copy, 
        Target, 
        CheckCircle2, 
        ChevronRight,
        BarChart3,
        Search,
        X
    } from 'lucide-svelte';
    import { fade, slide, fly } from 'svelte/transition';

    // State
    let history = $state<any[]>([]);
    let isLoading = $state(true);
    let selectedItem = $state<any>(null);

    // Fetch History
    $effect(() => {
        const client = trpc($page);
        client.writing.getHistory.query().then(res => {
            history = res;
            isLoading = false;
        }).catch(() => {
            isLoading = false;
        });
    });

    function handleCopy(text: string) {
        navigator.clipboard.writeText(text);
        alert('클립보드에 복사되었습니다!');
    }

    // Computed Stats
    let totalCount = $derived(history.length);
    let avgChars = $derived(Math.round(history.reduce((sum, h) => sum + (h.actualCharCount || 0), 0) / (history.length || 1)));
    let uniqueTypes = $derived(new Set(history.map(h => h.itemType)).size);
</script>

<div class="container-px py-24 md:py-32 space-y-16">
    <!-- Header -->
    <div class="space-y-4">
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Clock class="w-10 h-10 text-blue-600" />
            작성 기록 (Writing History)
        </h1>
        <p class="text-lg text-gray-500 max-w-2xl">
            지금까지 작성한 모든 자기소개서와 면접 답변 기록을 한데 모았습니다.
        </p>
    </div>

    {#if isLoading}
        <div class="h-64 flex flex-col items-center justify-center space-y-4 opacity-50">
            <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="font-bold text-gray-400">기록을 불러오고 있습니다...</p>
        </div>
    {:else if history.length === 0}
        <div class="bg-white rounded-[2rem] border-2 border-dashed border-gray-100 p-20 text-center space-y-6 shadow-sm">
            <div class="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileText class="w-10 h-10 text-gray-300" />
            </div>
            <div class="space-y-2">
                <h3 class="text-2xl font-black text-gray-900">아직 작성된 기록이 없습니다</h3>
                <p class="text-gray-400 font-medium">첫 번째 자소서를 작성하고 커리어를 시작해 보세요.</p>
            </div>
            <a href="/writing" class="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                새 자소서 작성하기 <ArrowRight class="w-5 h-5" />
            </a>
        </div>
    {:else}
        <!-- Summary Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6" in:fade>
            <div class="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 flex items-center gap-6 group hover:scale-[1.02] transition-transform">
                <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText class="w-8 h-8" />
                </div>
                <div>
                    <p class="text-3xl font-black text-gray-900">{totalCount}</p>
                    <p class="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">총 작성 횟수</p>
                </div>
            </div>
            <div class="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 flex items-center gap-6 group hover:scale-[1.02] transition-transform">
                <div class="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Target class="w-8 h-8" />
                </div>
                <div>
                    <p class="text-3xl font-black text-gray-900">{avgChars.toLocaleString()}자</p>
                    <p class="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">평균 글자수</p>
                </div>
            </div>
            <div class="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 flex items-center gap-6 group hover:scale-[1.02] transition-transform">
                <div class="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <CheckCircle2 class="w-8 h-8" />
                </div>
                <div>
                    <p class="text-3xl font-black text-gray-900">{uniqueTypes}종류</p>
                    <p class="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">항목 유형</p>
                </div>
            </div>
        </div>

        <!-- History Container -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each history as item (item.id)}
                <div 
                    class="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                    onclick={() => selectedItem = item}
                    in:fly={{ y: 20, duration: 500 }}
                >
                    <div class="relative z-10 space-y-6">
                        <div class="flex justify-between items-center">
                            <span class="px-3 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            <span class="text-[10px] font-bold text-gray-400 italic">
                                {item.itemType || '자유양식'}
                            </span>
                        </div>
                        
                        <div class="space-y-3">
                            <h3 class="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {item.prompt || "프롬프트 없음"}
                            </h3>
                            <p class="text-sm text-gray-400 font-medium line-clamp-2 leading-relaxed h-10">
                                {item.generatedText || "생성된 내용 없음"}
                            </p>
                        </div>

                        <div class="pt-4 border-t border-gray-50 flex items-center justify-between">
                            <div class="flex gap-3">
                                <span class="text-[11px] font-bold text-gray-400">
                                    목표 <span class="text-gray-900">{item.targetCharCount || '-'}자</span>
                                </span>
                                <span class="text-[11px] font-bold text-gray-400">
                                    실제 <span class="text-blue-600">{item.actualCharCount || '-'}자</span>
                                </span>
                            </div>
                            <ChevronRight class="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    <!-- Bg Glow -->
                    <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Detail Modal -->
{#if selectedItem}
    <div 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
        onclick={() => selectedItem = null}
        transition:fade
    >
        <div 
            class="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative"
            onclick={(e) => e.stopPropagation()}
            in:fly={{ y: 50, duration: 400 }}
        >
            <button 
                class="absolute top-6 right-8 p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"
                onclick={() => selectedItem = null}
            >
                <X class="w-6 h-6 text-gray-400" />
            </button>

            <div class="p-12 overflow-y-auto space-y-10 custom-scrollbar">
                <div class="space-y-4 pr-10">
                    <div class="flex items-center gap-3">
                         <span class="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest leading-none">
                            HISTORY DETAIL
                        </span>
                        <span class="text-gray-400 font-medium text-sm">
                            {new Date(selectedItem.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <h2 class="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                        {selectedItem.itemType || '자유양식'} 항목 작성 기록
                    </h2>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     <div class="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-center space-y-1">
                        <p class="text-3xl font-black text-blue-600">{selectedItem.targetCharCount || '-'}</p>
                        <p class="text-[10px] font-black text-blue-300 uppercase tracking-widest">목표 글자수</p>
                    </div>
                    <div class="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 text-center space-y-1">
                        <p class="text-3xl font-black text-emerald-600">{selectedItem.actualCharCount || '-'}</p>
                        <p class="text-[10px] font-black text-emerald-300 uppercase tracking-widest">실제 글자수</p>
                    </div>
                    <div class="p-6 bg-purple-50/50 rounded-3xl border border-purple-100 text-center space-y-1">
                        <p class="text-3xl font-black text-purple-600">
                            {selectedItem.targetCharCount && selectedItem.actualCharCount
                                ? Math.round((selectedItem.actualCharCount / selectedItem.targetCharCount) * 100)
                                : '-'}%
                        </p>
                        <p class="text-[10px] font-black text-purple-300 uppercase tracking-widest">분량 달성률</p>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="space-y-3">
                        <h4 class="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <Search class="w-4 h-4" /> 입력된 질문/프롬프트
                        </h4>
                        <div class="p-8 bg-gray-50 rounded-[2rem] text-gray-700 font-medium leading-relaxed border border-gray-100">
                            {selectedItem.prompt}
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <h4 class="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles class="w-4 h-4 text-purple-500" /> AI 생성 결과물
                            </h4>
                            <button 
                                onclick={() => handleCopy(selectedItem.generatedText)}
                                class="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                            >
                                <Copy class="w-4 h-4" />
                                텍스트 복사하기
                            </button>
                        </div>
                        <div class="p-10 bg-white rounded-[2rem] text-gray-900 font-medium leading-[1.8] border-2 border-gray-100 shadow-inner whitespace-pre-wrap relative">
                             <div class="absolute top-8 right-8 text-gray-50 font-black text-8xl pointer-events-none select-none italic">AI</div>
                            {selectedItem.generatedText}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #f1f5f9;
        border-radius: 10px;
        border: 2px solid white;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: white;
    }
</style>
