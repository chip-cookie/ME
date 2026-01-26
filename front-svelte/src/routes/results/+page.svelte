<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { BarChart3, TrendingUp, Award, Target, Zap } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    let results = $state<any[]>([]);
    let isLoading = $state(true);

    $effect(() => {
        trpc($page).clientResults.list.query()
            .then(res => results = res)
            .finally(() => isLoading = false);
    });

    const categories = ['전체', '대기업', '스타트업', '금융권', 'IT/테크'];
    let activeCategory = $state('전체');

    const filteredResults = $derived(
        results.length > 0 ? results : [
            { id: 1, clientName: '삼성전자 지원자 A', metric: '서류 합격률', beforeValue: '15%', afterValue: '85%', improvement: '70%p 상승', category: '대기업' },
            { id: 2, clientName: '토스 지원자 B', metric: '면접 응답 만족도', beforeValue: 'B', afterValue: 'A+', improvement: '2단계 상승', category: 'IT/테크' },
            { id: 3, clientName: '현대자동차 지원자 C', metric: '자소서 작성 시간', beforeValue: '12시간', afterValue: '2시간', improvement: '83% 단축', category: '대기업' },
            { id: 4, clientName: '배달의민족 지원자 D', metric: '직무 적합도 점수', beforeValue: '62점', afterValue: '94점', improvement: '32점 상승', category: 'IT/테크' },
            { id: 5, clientName: '신한은행 지원자 E', metric: '키워드 매칭률', beforeValue: '40%', afterValue: '92%', improvement: '52%p 상승', category: '금융권' },
            { id: 6, clientName: '유망 스타트업 지원자 F', metric: '포트폴리오 완성도', beforeValue: '미흡', afterValue: '탁월', improvement: '완벽 보완', category: '스타트업' }
        ]
    );

    const filteredDisplay = $derived(
        activeCategory === '전체' ? filteredResults : filteredResults.filter(r => r.category === activeCategory)
    );
</script>

<div class="min-h-screen bg-[#fcfcfd]">
    <!-- Hero Section -->
    <section class="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white">
        <!-- Decoration -->
        <div class="absolute top-0 right-0 w-1/2 h-full bg-indigo-50/30 rounded-l-[10rem] -z-10 translate-x-20"></div>
        <div class="absolute bottom-10 left-10 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl"></div>

        <div class="container mx-auto px-4 relative z-10">
            <div class="max-w-3xl">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <Award class="w-3.5 h-3.5" />
                    Success Stories
                </div>
                <h1 class="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tight leading-none">
                    Measurable <span class="text-indigo-600">Impact.</span>
                </h1>
                <p class="text-xl text-gray-500 leading-relaxed font-medium">
                    JasoS를 통해 꿈꾸던 기업에 한 걸음 더 다가간 커리어 전문가들의 성과입니다.<br class="hidden md:block" /> 
                    우리는 숫자와 결과로 증명합니다.
                </p>
            </div>
        </div>
    </section>

    <!-- Stats Overview -->
    <section class="py-12 bg-white border-y border-gray-100">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                <div class="text-center md:text-left">
                    <div class="text-4xl md:text-5xl font-black text-gray-900 mb-2">10k+</div>
                    <p class="text-sm font-bold text-gray-400 uppercase tracking-widest">Successful Users</p>
                </div>
                <div class="text-center md:text-left">
                    <div class="text-4xl md:text-5xl font-black text-indigo-600 mb-2">92%</div>
                    <p class="text-sm font-bold text-gray-400 uppercase tracking-widest">Satisfaction Rate</p>
                </div>
                <div class="text-center md:text-left">
                    <div class="text-4xl md:text-5xl font-black text-gray-900 mb-2">85%</div>
                    <p class="text-sm font-bold text-gray-400 uppercase tracking-widest">Doc Pass Rate</p>
                </div>
                <div class="text-center md:text-left">
                    <div class="text-4xl md:text-5xl font-black text-indigo-600 mb-2">5x</div>
                    <p class="text-sm font-bold text-gray-400 uppercase tracking-widest">Faster Writing</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Category Filter -->
    <section class="py-12">
        <div class="container mx-auto px-4">
            <div class="flex flex-wrap items-center gap-3 justify-center mb-16">
                {#each categories as category}
                    <button 
                        class="px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border
                               {activeCategory === category 
                                 ? 'bg-gray-900 text-white border-gray-900 shadow-xl' 
                                 : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600 shadow-sm'}"
                        onclick={() => activeCategory = category}
                    >
                        {category}
                    </button>
                {/each}
            </div>

            <!-- Results Grid -->
            {#if isLoading && results.length === 0}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {#each Array(6) as _}
                        <div class="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm animate-pulse h-64"></div>
                    {/each}
                </div>
            {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {#each filteredDisplay as result, i}
                        <div 
                            class="group bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative"
                            in:fly={{ y: 20, delay: i * 50 }}
                        >
                            <div class="flex items-center justify-between mb-8">
                                <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                                    <TrendingUp class="w-6 h-6" />
                                </div>
                                <div class="text-xs font-black text-gray-300 uppercase tracking-widest">Case 0{result.id}</div>
                            </div>

                            <div class="mb-8">
                                <h3 class="text-xl font-black text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{result.metric}</h3>
                                <p class="text-sm font-bold text-gray-400 flex items-center gap-2">
                                    <Target class="w-3.5 h-3.5" />
                                    {result.clientName}
                                </p>
                            </div>

                            <div class="grid grid-cols-2 gap-8 border-t border-gray-50 pt-8 relative z-10">
                                <div class="text-center md:text-left">
                                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Before</p>
                                    <p class="text-2xl font-black text-gray-400">{result.beforeValue}</p>
                                </div>
                                <div class="text-center md:text-left border-l border-gray-50 pl-8">
                                    <p class="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">After</p>
                                    <p class="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{result.afterValue}</p>
                                </div>
                            </div>

                            {#if result.improvement}
                                <div class="mt-8">
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <Zap class="w-3 h-3 fill-current" />
                                        {result.improvement}
                                    </span>
                                </div>
                            {/if}
                            
                            <!-- Large Background text -->
                             <div class="absolute -bottom-6 -right-6 text-8xl font-black text-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 select-none pointer-events-none">
                                SUCCESS
                             </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </section>

    <!-- Detailed Analysis Call-to-action -->
    <section class="py-24 bg-gray-900 text-white overflow-hidden relative">
        <div class="container mx-auto px-4 text-center">
            <h2 class="text-3xl md:text-5xl font-black tracking-tight mb-8">당신의 성공 스토리도<br class="md:hidden" /> 우리가 만듭니다.</h2>
            <p class="text-lg text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
                우리는 단순히 텍스트를 생성하는 것이 아니라, 당신의 커리어를 디자인합니다.<br />
                검증된 데이터를 바탕으로 한 합격의 기쁨을 누리세요.
            </p>
            <a href="/writing" class="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-500 hover:scale-105 transition-all shadow-2xl shadow-indigo-600/20 group">
                성과 분석 시작하기
                <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
        </div>
    </section>
</div>
