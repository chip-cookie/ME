<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { Briefcase, Zap, TrendingUp, Users, ArrowRight, Star, CheckCircle2 } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    let services = $state<any[]>([]);
    let isLoading = $state(true);

    const defaultServices = [
        {
            id: 1,
            title: '자기소개서 전략 수립',
            description: '당신의 강점과 기업의 요구사항을 결합한 최적의 자소서 전략을 수립합니다.',
            details: '단순한 글쓰기를 넘어, 합격 가능성을 극대화하는 스토리라인과 핵심 키워드를 도출합니다.',
            icon: 'briefcase'
        },
        {
            id: 2,
            title: '실시간 AI 고도화',
            description: '학습된 스타일을 바탕으로 즉각적이고 완성도 높은 초안을 생성합니다.',
            details: '수천 건의 합격 사례를 학습한 모델이 당신만의 고유한 문체를 유지하며 내용을 풍성하게 채워줍니다.',
            icon: 'zap'
        },
        {
            id: 3,
            title: '성과 지표 최적화',
            description: '수치화된 성과와 정량적 지표를 활용하여 설득력을 높입니다.',
            details: '모호한 표현 대신 데이터 기반의 성과 기술법을 적용하여 인사담당자의 시선을 사로잡습니다.',
            icon: 'trending'
        },
        {
            id: 4,
            title: '맞춤형 면접 컨설팅',
            description: '자소서 기반 맞춤형 질문과 완벽한 답변 가이드를 제공합니다.',
            details: '압박 면접부터 인성 면접까지, 나올 수 있는 모든 시나리오를 예측하고 대응 방안을 마련합니다.',
            icon: 'users'
        }
    ];

    $effect(() => {
        trpc($page).services.list.query()
            .then(res => services = res.length > 0 ? res : defaultServices)
            .finally(() => isLoading = false);
    });

    const benefits = [
        { title: '검증된 합격 사례', description: '수만 건의 실제 합격 자소서 데이터를 기반으로 한 정확한 분석 능력을 갖추고 있습니다.' },
        { title: '독보적인 AI 기술', description: 'DeepMind 기반의 최신 언어 모델과 JasoS만의 특화된 스타일 엔진을 결합했습니다.' },
        { title: '데이터 기반 인사이트', description: '직관이 아닌 철저한 데이터와 지표 분석을 통해 성공 확률을 높입니다.' },
        { title: '1:1 맞춤화', description: '공장형 출력이 아닌, 개인의 고유한 경험과 문체에 맞춘 초정밀 맞춤형 솔루션을 지향합니다.' },
        { title: '완벽한 사후 관리', description: '자소서 작성부터 최종 합격까지의 여정을 함께하며 지속적인 피드백을 제공합니다.' },
        { title: '최신 트렌드 반영', description: '실시간 채용 시장 트렌드와 기업별 핵심 인재상을 상시 업데이트하여 반영합니다.' }
    ];
</script>

<div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-gray-900 text-white">
        <div class="absolute inset-0 opacity-20">
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-600 via-transparent to-purple-600"></div>
            <div class="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div class="container mx-auto px-4 relative z-10 text-center">
            <header in:fly={{ y: 20 }}>
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-6 border border-white/10">
                    <Star class="w-3 h-3 fill-current" />
                    Premium Excellence
                </div>
                <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                    Your Path to <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Success</span>
                </h1>
                <p class="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                    JasoS는 단순한 AI 툴을 넘어, 당신의 커리어 성공을 위한 전략적 파트너입니다.<br class="hidden md:block" /> 
                    완벽한 분석과 창의적인 글쓰기로 당신의 가치를 증명해 드립니다.
                </p>
            </header>
        </div>
    </section>

    <!-- Services Section -->
    <section class="py-24 md:py-32 bg-white">
        <div class="container-px">
            <div class="space-y-32">
                {#each services as service, i}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div class={i % 2 === 1 ? 'md:order-2' : ''} in:fade>
                            <div class="flex items-center gap-4 mb-6">
                                <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                    {#if service.icon === 'zap'}
                                        <Zap class="w-7 h-7" />
                                    {:else if service.icon === 'trending'}
                                        <TrendingUp class="w-7 h-7" />
                                    {:else if service.icon === 'users'}
                                        <Users class="w-7 h-7" />
                                    {:else}
                                        <Briefcase class="w-7 h-7" />
                                    {/if}
                                </div>
                                <span class="text-xs font-black uppercase tracking-[0.2em] text-indigo-600/50">Service 0{i + 1}</span>
                            </div>

                            <h2 class="text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
                                {service.title}
                            </h2>
                            <p class="text-xl text-gray-600 mb-6 font-medium leading-relaxed">
                                {service.description}
                            </p>
                            {#if service.details}
                                <p class="text-gray-500 mb-10 leading-relaxed italic border-l-4 border-indigo-100 pl-6">
                                    {service.details}
                                </p>
                            {/if}

                            <button class="group flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all duration-300 shadow-xl shadow-gray-200 hover:shadow-indigo-200">
                                상담 신청하기
                                <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div class="relative group" in:fade>
                            <div class="absolute -inset-4 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-50 transition-all duration-700"></div>
                            <div class="relative aspect-square md:aspect-auto md:h-[500px] w-full bg-gray-50 rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center">
                                <div class="text-indigo-100 group-hover:scale-110 group-hover:text-indigo-200 transition-all duration-700">
                                    {#if service.icon === 'zap'}
                                        <Zap class="w-48 h-48" strokeWidth={0.5} />
                                    {:else if service.icon === 'trending'}
                                        <TrendingUp class="w-48 h-48" strokeWidth={0.5} />
                                    {:else if service.icon === 'users'}
                                        <Users class="w-48 h-48" strokeWidth={0.5} />
                                    {:else}
                                        <Briefcase class="w-48 h-48" strokeWidth={0.5} />
                                    {/if}
                                </div>
                                
                                <div class="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent"></div>
                                <div class="absolute bottom-10 left-10">
                                    <div class="px-4 py-2 bg-white/80 backdrop-blur rounded-xl text-xs font-bold text-gray-900 shadow-sm border border-white/50">
                                        Service Visualization 0{i + 1}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- Why Us Section -->
    <section class="py-24 md:py-32 bg-gray-50/50">
        <div class="container-px">
            <div class="text-center mb-20">
                <h2 class="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">WHY CHOOSE JASOS?</h2>
                <div class="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each benefits as benefit, i}
                    <div class="group bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative" in:fly={{ y: 20, delay: i * 100 }}>
                        <div class="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[5rem] translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-500"></div>
                        
                        <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                            <CheckCircle2 class="w-6 h-6" />
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                        <p class="text-gray-500 leading-relaxed font-medium">{benefit.description}</p>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 md:py-32 relative overflow-hidden bg-indigo-600">
        <div class="absolute inset-0 opacity-10">
            <div class="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
            <div class="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div class="container mx-auto px-4 relative z-10 text-center text-white">
            <h2 class="text-4xl md:text-6xl font-black tracking-tight mb-8">Ready to Get Started?</h2>
            <p class="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto leading-relaxed">
                지금 JasoS와 함께 당신의 인생 자소서를 완성하세요.<br />
                합격이라는 결과로 보답하겠습니다.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/contact" class="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-2xl">
                    무료 컨설팅 예약
                </a>
                <a href="/writing" class="px-10 py-5 bg-indigo-500 text-white rounded-2xl font-black text-lg hover:bg-indigo-400 transition-all border border-indigo-400">
                    지금 작성하기
                </a>
            </div>
        </div>
    </section>
</div>
