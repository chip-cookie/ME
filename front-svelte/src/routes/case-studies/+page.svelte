<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { Filter, ArrowRight, Building2, Briefcase, Zap, Globe } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    let caseStudies = $state<any[]>([]);
    let isLoading = $state(true);
    let selectedIndustry = $state<string | undefined>(undefined);

    const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'];

    $effect(() => {
        trpc($page).caseStudies.list.query()
            .then(res => caseStudies = res)
            .finally(() => isLoading = false);
    });

    const displayCases = $derived(
        caseStudies.length > 0 ? caseStudies : [
            { id: 1, title: 'Global Tech Corp: AI Transformation', description: '전사적 AI 도입을 통한 문서 작성 효율성 400% 향상 사례입니다.', industry: 'Technology', scope: 'Enterprise', impact: 'High' },
            { id: 2, title: 'Finance Leaders: Risk Analysis', description: '데이터 분석 기반의 정교한 지원 전략으로 금융권 합격률을 혁신적으로 높였습니다.', industry: 'Finance', scope: 'Mid-Market', impact: 'High' },
            { id: 3, title: 'HealthCare Innovators', description: '의료 전문 지식과 커리어를 결합한 독보적인 자소서 최적화 프로젝트입니다.', industry: 'Healthcare', scope: 'Startup', impact: 'Medium' },
            { id: 4, title: 'Retail Giant: Scaling Careers', description: '유통 대기업의 인재상에 맞춘 다각도 역량 분석 및 자소서 고도화 사례입니다.', industry: 'Retail', scope: 'Enterprise', impact: 'High' }
        ]
    );

    const filteredDisplay = $derived(
        selectedIndustry === undefined ? displayCases : displayCases.filter(c => c.industry === selectedIndustry)
    );
</script>

<div class="min-h-screen bg-[#f8f9fb]">
    <!-- Hero Section -->
    <header class="pt-32 pb-20 md:pt-48 md:pb-32 bg-white relative overflow-hidden">
        <div class="absolute top-0 right-0 w-1/3 h-full bg-indigo-50/50 rounded-l-[10rem] -z-10 translate-x-10"></div>
        <div class="container mx-auto px-4 relative z-10">
            <div class="max-w-3xl">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <Building2 class="w-3.5 h-3.5" />
                    Success Validation
                </div>
                <h1 class="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tight leading-none">
                    Real Cases. <br />
                    <span class="text-indigo-600">Real Results.</span>
                </h1>
                <p class="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl">
                    어떻게 JasoS가 수많은 전문가들의 커리어 전환과 성공을 도왔는지 확인하세요. 
                    체계적인 분석과 전략이 만들어낸 실제 성공 시나리오입니다.
                </p>
            </div>
        </div>
    </header>

    <!-- Filter Section -->
    <section class="sticky top-16 bg-white/80 backdrop-blur-md border-y border-gray-100 z-30 py-6">
        <div class="container mx-auto px-4">
            <div class="flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-3 text-gray-400">
                    <Filter class="w-4 h-4" />
                    <span class="text-xs font-black uppercase tracking-widest">Filter by Industry</span>
                </div>
                
                <div class="flex flex-wrap gap-2">
                    <button 
                        class="px-5 py-2 rounded-full text-xs font-black transition-all border
                               {selectedIndustry === undefined 
                                 ? 'bg-gray-900 text-white border-gray-900 shadow-lg' 
                                 : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200'}"
                        onclick={() => selectedIndustry = undefined}
                    >
                        ALL
                    </button>
                    {#each industries as industry}
                        <button 
                            class="px-5 py-2 rounded-full text-xs font-black transition-all border
                                   {selectedIndustry === industry 
                                     ? 'bg-gray-900 text-white border-gray-900 shadow-lg' 
                                     : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200'}"
                            onclick={() => selectedIndustry = industry}
                        >
                            {industry.toUpperCase()}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </section>

    <!-- Grid Section -->
    <main class="py-16 md:py-24">
        <div class="container mx-auto px-4">
            {#if isLoading && caseStudies.length === 0}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {#each Array(6) as _}
                        <div class="bg-white rounded-[2.5rem] h-96 animate-pulse border border-gray-100"></div>
                    {/each}
                </div>
            {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {#each filteredDisplay as study, i}
                        <div 
                            class="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
                            in:fly={{ y: 20, delay: i * 50 }}
                        >
                            <!-- Header / Image -->
                            <div class="h-56 bg-gradient-to-br from-indigo-50 to-purple-50 relative flex items-center justify-center overflow-hidden">
                                <div class="absolute inset-0 opacity-20 group-hover:scale-110 transition-transform duration-700">
                                    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')]"></div>
                                </div>
                                
                                <div class="relative z-10 text-indigo-100 group-hover:text-indigo-200 transition-colors duration-500">
                                    {#if study.industry === 'Technology'}
                                        <Zap class="w-24 h-24" strokeWidth={0.5} />
                                    {:else if study.industry === 'Finance'}
                                        <Briefcase class="w-24 h-24" strokeWidth={0.5} />
                                    {:else}
                                        <Globe class="w-24 h-24" strokeWidth={0.5} />
                                    {/if}
                                </div>

                                <div class="absolute top-6 left-6 flex gap-2">
                                    {#if study.impact === 'High'}
                                        <span class="px-2 py-1 bg-gray-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">High Impact</span>
                                    {/if}
                                    <span class="px-2 py-1 bg-white/80 backdrop-blur text-gray-900 rounded-lg text-[8px] font-black uppercase tracking-widest">{study.scope}</span>
                                </div>
                            </div>

                            <!-- Content -->
                            <div class="p-10 flex-1 flex flex-col">
                                <div class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">
                                    {study.industry}
                                </div>
                                <h3 class="text-2xl font-black text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
                                    {study.title}
                                </h3>
                                <p class="text-gray-500 font-medium leading-relaxed mb-8 flex-1">
                                    {study.description}
                                </p>
                                
                                <button class="w-full py-4 rounded-2xl bg-gray-50 text-gray-900 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                                    READ FULL STUDY
                                    <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </main>

    <!-- Contact CTA -->
    <section class="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div class="container mx-auto px-4 text-center">
            <h2 class="text-3xl md:text-5xl font-black tracking-tight mb-8">당신도 다음 성공의 주인공이<br class="md:hidden" /> 될 수 있습니다.</h2>
            <p class="text-lg text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
                기업 규모와 업종에 상관없이 최적화된 성공 전략을 제안합니다.<br />
                지금 바로 맞춤형 상담을 시작하세요.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/contact" class="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-500 shadow-2xl shadow-indigo-600/20 group">
                    전문가와 상담하기
                </a>
            </div>
        </div>
        
        <!-- Decoration -->
        <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
    </section>
</div>
