<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { BookOpen, Download, FileText, Share2, Search } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    let insights = $state<any[]>([]);
    let isLoading = $state(true);

    $effect(() => {
        trpc($page).insights.list.query()
            .then(res => insights = res)
            .finally(() => isLoading = false);
    });

    const categories = ['전체', '취업 리포트', '자소서 가이드', '면접 전략', '직무 분석'];
    let activeCategory = $state('전체');

    const displayInsights = $derived(
        insights.length > 0 ? insights : [
            { id: 1, title: '2026 하반기 대기업 채용 트렌드 정밀 분석', description: 'AI 면접 도입 확대와 직무 역량 중심 평가의 변화에 따른 대응 전략 리포트입니다.', category: '취업 리포트', featured: true },
            { id: 2, title: '합격을 부르는 스타트업 자소서 작성법', description: '자유 양식 자소서에서 나의 성과를 가장 효과적으로 어필하는 기술적인 접근 방법입니다.', category: '자소서 가이드', featured: false },
            { id: 3, title: '비대면 AI 면접 완벽 대비 가이드', description: '주요 기업들의 AI 면접 알고리즘 분석과 카메라 너머의 나를 어필하는 팁을 담았습니다.', category: '면접 전략', featured: true },
            { id: 4, title: 'IT 서비스 기획자 핵심 역량 기술서', description: '주니어 기획자가 갖춰야 할 정량적/정성적 역량과 이를 자소서에 녹여내는 예시입니다.', category: '직무 분석', featured: false }
        ]
    );

    const filteredDisplay = $derived(
        activeCategory === '전체' ? displayInsights : displayInsights.filter(i => i.category === activeCategory)
    );
</script>

<div class="min-h-screen bg-white">
    <!-- Header Section -->
    <header class="pt-32 pb-16 md:pt-48 md:pb-24 bg-gray-900 text-white relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
            <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500 rounded-full blur-[160px] translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div class="container mx-auto px-4 relative z-10">
            <div class="max-w-3xl">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/10">
                    <FileText class="w-3.5 h-3.5" />
                    Knowledge Hub
                </div>
                <h1 class="text-5xl md:text-7xl font-black mb-8 leading-none tracking-tight">
                    Insights & <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Research.</span>
                </h1>
                <p class="text-xl text-gray-400 font-medium leading-relaxed">
                    변화하는 채용 시장의 핵심을 짚어드립니다. <br class="hidden md:block" />
                    JasoS 연구소의 데이터를 기반으로 한 전략적 리포트를 확인하세요.
                </p>
            </div>
        </div>
    </header>

    <!-- Content Section -->
    <main class="py-16 md:py-24">
        <div class="container mx-auto px-4">
            <!-- Search & Filters -->
            <div class="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 px-4 py-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                <div class="flex flex-wrap items-center gap-2">
                    {#each categories as category}
                        <button 
                            class="px-5 py-2 rounded-full text-xs font-black transition-all duration-300 uppercase tracking-widest
                                   {activeCategory === category 
                                     ? 'bg-gray-900 text-white shadow-lg' 
                                     : 'text-gray-400 hover:text-gray-900 hover:bg-white'}"
                            onclick={() => activeCategory = category}
                        >
                            {category}
                        </button>
                    {/each}
                </div>

                <div class="relative w-full md:w-72">
                    <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input 
                        type="text" 
                        placeholder="Search research..." 
                        class="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none shadow-sm"
                    />
                </div>
            </div>

            <!-- Grid -->
            {#if isLoading && insights.length === 0}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {#each Array(4) as _}
                        <div class="h-80 bg-gray-50 rounded-[2.5rem] animate-pulse"></div>
                    {/each}
                </div>
            {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {#each filteredDisplay as insight, i}
                        <div 
                            class="group bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 relative flex flex-col justify-between"
                            in:fly={{ y: 20, delay: i * 50 }}
                        >
                            <div class="relative z-10">
                                <div class="flex items-start justify-between mb-8">
                                    <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                        <BookOpen class="w-7 h-7" />
                                    </div>
                                    {#if insight.featured}
                                        <span class="px-3 py-1 bg-yellow-400 text-gray-900 rounded-full text-[10px] font-black uppercase tracking-widest">Featured</span>
                                    {/if}
                                </div>

                                <h3 class="text-2xl font-black text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
                                    {insight.title}
                                </h3>
                                <p class="text-gray-500 font-medium leading-relaxed mb-8">
                                    {insight.description}
                                </p>
                            </div>

                            <div class="flex items-center justify-between mt-auto pt-8 border-t border-gray-50">
                                <button class="flex items-center gap-2 group/btn">
                                    <div class="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center group-hover/btn:bg-indigo-600 transition-colors">
                                        <Download class="w-4 h-4" />
                                    </div>
                                    <span class="text-xs font-black uppercase tracking-widest text-gray-500 group-hover/btn:text-gray-900">Download PDF</span>
                                </button>
                                
                                <button class="p-3 text-gray-300 hover:text-indigo-600 transition-colors">
                                    <Share2 class="w-4 h-4" />
                                </button>
                            </div>
                            
                            <!-- Category Badge Background -->
                            <div class="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100">{insight.category}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </main>

    <!-- Newsletter CTA -->
    <section class="py-24 bg-gray-50 border-t border-gray-100">
        <div class="container mx-auto px-4 text-center">
            <h2 class="text-3xl font-black text-gray-900 mb-6 tracking-tight">Stay Updated on Modern Careers.</h2>
            <p class="text-gray-500 mb-10 font-medium">매주 발행되는 JasoS의 최신 취업 트렌드 리포트를 이메일로 받아보세요.</p>
            
            <div class="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
                <input 
                    type="email" 
                    placeholder="your@email.com" 
                    class="flex-1 px-6 py-4 rounded-2xl bg-white border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
                />
                <button class="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200">
                    구독하기
                </button>
            </div>
        </div>
    </section>
</div>
