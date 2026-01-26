<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { Heart, Brain, Star, Save, Loader2, Sparkles, ThumbsUp, ThumbsDown, History } from 'lucide-svelte';
    import { fade, fly, slide } from 'svelte/transition';

    let text = $state('');
    let isAnalyzing = $state(false);
    let result = $state<any>(null);
    let history = $state<any[]>([]);

    const trpcService = trpc($page);

    $effect(() => {
        loadHistory();
    });

    async function loadHistory() {
        try {
            const data = await trpcService.experience.list.query();
            history = data;
        } catch (e) {
            console.error(e);
        }
    }

    async function handleAnalyze() {
        if (!text.trim() || text.length < 10) {
            alert('최소 10자 이상 입력해주세요.');
            return;
        }

        isAnalyzing = true;
        try {
            result = await trpcService.experience.analyze.mutate({ text });
        } catch (e) {
            alert('분석 중 오류가 발생했습니다.');
        } finally {
            isAnalyzing = false;
        }
    }

    async function handleSave() {
        if (!result) return;
        try {
            await trpcService.experience.create.mutate({
                content: text,
                analysisResult: JSON.stringify(result)
            });
            alert('저장되었습니다.');
            loadHistory();
        } catch (e) {
            alert('저장 실패');
        }
    }

    function parseResult(log: any) {
        return typeof log.analysisResult === 'string' ? JSON.parse(log.analysisResult) : log.analysisResult;
    }

    const traitLabels: Record<string, string> = {
        analytical: '분석적 사고',
        creativity: '창의성',
        leadership: '리더십',
        empathy: '공감 능력',
        persistence: '집요함'
    };
</script>

<div class="min-h-screen bg-[#f9fafb]">
    <div class="max-w-7xl mx-auto px-4 py-32">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <!-- Left: Input & History (lg:col-span-5) -->
            <div class="lg:col-span-5 space-y-8">
                <header>
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider mb-4 border border-indigo-100">
                        <Heart class="w-3 h-3 fill-current" />
                        Psychological Analysis
                    </div>
                    <h1 class="text-3xl font-black text-gray-900 tracking-tight mb-4 flex items-center gap-3">
                        경험 & <span class="text-indigo-600">감정 분석</span>
                    </h1>
                    <p class="text-gray-500 font-medium leading-relaxed">
                        당신의 소중한 경험과 그 순간의 감정을 들려주세요.<br />
                        AI가 STAR 기법으로 정리하고 성향을 정밀 분석합니다.
                    </p>
                </header>

                <div class="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 relative">
                    <textarea 
                        bind:value={text}
                        placeholder="예: 팀 프로젝트에서 의견 충돌이 있었는데, 감정적으로 대응하지 않고 데이터를 근거로 설득했습니다. 그때 참 힘들었지만 뿌듯했습니다..."
                        class="w-full h-48 bg-transparent border-none outline-none text-gray-700 font-medium leading-relaxed resize-none p-0 placeholder:text-gray-300"
                    ></textarea>
                    
                    <div class="mt-8">
                        <button 
                            onclick={handleAnalyze}
                            disabled={isAnalyzing}
                            class="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-200"
                        >
                            {#if isAnalyzing}
                                <Loader2 class="w-6 h-6 animate-spin text-white/50" />
                                ANALYZING...
                            {:else}
                                <Brain class="w-6 h-6" />
                                분석 시작하기
                            {/if}
                        </button>
                    </div>
                </div>

                <!-- History Section -->
                {#if history.length > 0}
                    <div class="pt-8">
                        <div class="flex items-center gap-2 mb-6 text-gray-400">
                            <History class="w-4 h-4" />
                            <h3 class="text-xs font-black uppercase tracking-widest">Recent Analysis History</h3>
                        </div>
                        <div class="space-y-4">
                            {#each history.slice(0, 5) as log}
                                {@const parsed = parseResult(log)}
                                <button 
                                    class="w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 hover:shadow-lg transition-all text-left group"
                                    onclick={() => { result = parsed; text = log.content; }}
                                >
                                    <div class="text-sm font-bold text-gray-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">
                                        {parsed?.star_summary?.T || 'Untitled Experience'}
                                    </div>
                                    <p class="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                        {log.content}
                                    </p>
                                    <div class="mt-4 flex flex-wrap gap-2">
                                        {#each (parsed?.personality?.keywords || []).slice(0, 2) as k}
                                            <span class="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 rounded uppercase tracking-widest">{k}</span>
                                        {/each}
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Right: Results (lg:col-span-7) -->
            <div class="lg:col-span-7">
                {#if result}
                    <div class="space-y-8" in:fly={{ y: 20 }}>
                        <div class="flex items-center justify-between">
                            <h2 class="text-xs font-black uppercase tracking-[0.2em] text-gray-300">Analysis Result Report</h2>
                            <button 
                                onclick={handleSave}
                                class="flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest"
                            >
                                <Save class="w-4 h-4" />
                                Save Report
                            </button>
                        </div>

                        <!-- STAR Summary Card -->
                        <div class="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
                            <h3 class="text-xl font-black text-gray-900 mb-10 flex items-center gap-3">
                                <Star class="w-6 h-6 text-yellow-400 fill-current" />
                                STAR Technique 요약
                            </h3>
                            
                            <div class="space-y-8">
                                {#each ['S', 'T', 'A', 'R'] as key}
                                    <div class="grid grid-cols-[40px_1fr] gap-6">
                                        <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-indigo-600 border border-gray-100">{key}</div>
                                        <div class="pt-2">
                                            <p class="text-gray-700 font-medium leading-relaxed">{result.star_summary[key]}</p>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <!-- Personality Analysis Card -->
                        <div class="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
                            <h3 class="text-xl font-black text-gray-900 mb-10 flex items-center gap-3">
                                <Sparkles class="w-6 h-6 text-indigo-600" />
                                성향 및 감정 입체 분석
                            </h3>

                            <div class="flex flex-wrap gap-2 mb-10">
                                {#each result.personality.keywords as k}
                                    <span class="px-4 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-xs font-black uppercase tracking-widest select-none">
                                        #{k}
                                    </span>
                                {/each}
                            </div>

                            <div class="space-y-6 mb-12">
                                {#each Object.entries(result.personality.score) as [trait, value]}
                                    <div class="space-y-2">
                                        <div class="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                                            <span>{traitLabels[trait] || trait}</span>
                                            <span class="text-indigo-600">{value}%</span>
                                        </div>
                                        <div class="h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                                            <div 
                                                class="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                                style="width: {value}%"
                                            ></div>
                                        </div>
                                    </div>
                                {/each}
                            </div>

                            <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group overflow-hidden mb-12">
                                <div class="absolute top-0 right-0 p-4 text-indigo-100 group-hover:scale-125 transition-transform duration-700">
                                    <Brain class="w-16 h-16" />
                                </div>
                                <p class="relative z-10 text-gray-600 font-medium leading-relaxed italic">
                                    " {result.personality.comment} "
                                </p>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div class="space-y-4">
                                    <div class="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest">
                                        <ThumbsUp class="w-4 h-4" />
                                        Strengths
                                    </div>
                                    <div class="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-sm font-medium text-gray-700 leading-relaxed min-h-[100px]">
                                        {result.personality.strengths || '데이터 부족'}
                                    </div>
                                </div>
                                <div class="space-y-4">
                                    <div class="flex items-center gap-2 text-red-600 text-xs font-black uppercase tracking-widest">
                                        <ThumbsDown class="w-4 h-4" />
                                        Growth Areas
                                    </div>
                                    <div class="p-6 bg-red-50/50 rounded-2xl border border-red-100 text-sm font-medium text-gray-700 leading-relaxed min-h-[100px]">
                                        {result.personality.weaknesses || '데이터 부족'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="h-[600px] bg-white rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-12" in:fade>
                        <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-300">
                            <Brain class="w-12 h-12" />
                        </div>
                        <h4 class="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Ready for analysis</h4>
                        <p class="text-gray-400 font-medium max-w-xs leading-relaxed">
                            왼쪽 입력 칸에 당신의 경험을 기록해 보세요. <br />
                            AI가 심리 분석 기반의 리포트를 생성해 드립니다.
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
