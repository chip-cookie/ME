<script lang="ts">
    import { 
        ArrowRight, 
        PenTool, 
        BookOpen, 
        MessageSquare, 
        Heart, 
        Building2,
        Sparkles,
        BarChart3,
        FileText
    } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    let { data } = $props();

    const features = [
        {
            icon: Sparkles,
            title: "스타일 학습",
            description: "기존에 작성한 글을 분석하여 당신만의 고유한 문체와 스타일을 AI가 학습합니다.",
            link: "/learning",
            color: "text-purple-600",
            bg: "bg-purple-50"
        },
        {
            icon: PenTool,
            title: "자기소개서 생성",
            description: "학습된 스타일을 바탕으로 지원 동기, 입사 후 포부 등 맞춤형 자소서를 작성합니다.",
            link: "/writing",
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            icon: MessageSquare,
            title: "면접 질문 예측",
            description: "자소서 내용을 분석하여 나올 수 있는 예상 면접 질문과 답변 가이드를 제공합니다.",
            link: "/interview",
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        },
        {
            icon: BarChart3,
            title: "JD 분석",
            description: "채용 공고를 분석하여 기업 현황과 직무 핵심 역량을 정밀 분석해 드립니다.",
            link: "/analysis",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            icon: Building2,
            title: "기업 분석",
            description: "지원하려는 기업의 비전, 최신 이슈, 재무 상태 등을 분석하여 지원 전략을 수립합니다.",
            link: "/corporate",
            color: "text-amber-600",
            bg: "bg-amber-50"
        },
        {
            icon: Heart,
            title: "감정 및 성향 분석",
            description: "작성한 글의 톤앤매너와 성향을 분석하여 더 설득력 있는 표현을 제안합니다.",
            link: "/sentiment",
            color: "text-pink-600",
            bg: "bg-pink-50"
        }
    ];
</script>

<div class="min-h-screen bg-white overflow-hidden pb-40">
    <!-- Hero Section -->
    <section class="relative pt-60 pb-80">
        <!-- Abstract backgrounds -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
            <div class="absolute top-20 -left-20 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] opacity-60"></div>
            <div class="absolute bottom-20 -right-20 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-[120px] opacity-40"></div>
        </div>

        <div class="container-px relative z-10 text-center space-y-12">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900/5 text-gray-900 text-xs font-black tracking-widest uppercase mb-4 transition-transform hover:scale-105 cursor-default" in:fade>
                <Sparkles class="w-3 h-3 text-indigo-600" />
                AI Generated Excellence
            </div>
            
            <h1 class="text-6xl md:text-[7rem] font-black text-gray-900 leading-[1] tracking-tighter" in:fly={{ y: 30, duration: 800 }}>
                합격을 향한 최후의 <br />
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
                    AI 파트너, JasoS
                </span>
            </h1>

            <p class="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto font-medium leading-[1.6] pt-4" in:fly={{ y: 20, delay: 200, duration: 800 }}>
                당신의 고유한 글쓰기 스타일을 학습하여, <br class="hidden md:block" />
                가장 당신다운 자기소개서와 면접 답변을 AI가 완성해 드립니다.
            </p>

            <div class="flex flex-col sm:flex-row gap-6 justify-center pt-8" in:fly={{ y: 20, delay: 400, duration: 800 }}>
                {#if data.user}
                    <a href="/dashboard" class="px-12 py-6 bg-gray-900 hover:bg-black text-white rounded-3xl font-black text-lg transition-all shadow-2xl shadow-gray-200 flex items-center gap-3 active:scale-95 group">
                        대시보드로 가기 
                        <ArrowRight class="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </a>
                {:else}
                    <a href="/register" class="px-12 py-6 bg-gray-900 hover:bg-black text-white rounded-3xl font-black text-lg transition-all shadow-2xl shadow-gray-200 flex items-center gap-3 active:scale-95 group">
                        무료로 시작하기 
                        <ArrowRight class="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </a>
                {/if}
                <a href="/learning" class="px-12 py-6 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 rounded-3xl font-black text-lg transition-all flex items-center gap-3 active:scale-95">
                    내 스타일 학습시키기
                </a>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="section-gap bg-gray-50/30 border-y border-gray-50">
        <div class="container-px space-y-24">
            <div class="text-center space-y-6">
                <h2 class="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">강력한 AI 도구 모음</h2>
                <p class="text-xl text-gray-400 font-medium max-w-2xl mx-auto">취업 준비의 모든 과정을 JasoS의 정밀한 AI 엔진이 책임집니다.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {#each features as feature, i}
                    <a 
                        href={feature.link} 
                        class="group bg-white p-10 rounded-[3rem] border border-transparent shadow-sm hover:shadow-2xl hover:border-gray-50 transition-all duration-700 relative overflow-hidden"
                        in:fly={{ y: 20, delay: 500 + i * 100, duration: 800 }}
                    >
                        <div class="relative z-10 space-y-8">
                            <div class="w-20 h-20 {feature.bg} {feature.color} rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-700 shadow-sm">
                                <feature.icon class="w-10 h-10" />
                            </div>
                            <div class="space-y-4">
                                <h3 class="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{feature.title}</h3>
                                <p class="text-gray-400 text-sm leading-relaxed font-bold">
                                    {feature.description}
                                </p>
                            </div>
                            <div class="pt-4 flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[.25em] opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-700">
                                Launch Tool <ArrowRight class="w-4 h-4" />
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="section-gap relative overflow-hidden">
        <div class="max-w-6xl mx-auto px-6">
            <div class="bg-gray-900 rounded-[4rem] p-16 md:p-32 text-center relative overflow-hidden shadow-2xl shadow-indigo-100">
                <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[150px]"></div>
                
                <div class="relative z-10 space-y-10">
                    <h2 class="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
                        더 나은 자소서, <br />
                        AI와 함께 시작하세요.
                    </h2>
                    <p class="text-gray-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        수만 개의 합격 자기소개서와 채용 공고를 학습한 JasoS AI가 당신의 성공적인 취업을 응원합니다.
                    </p>
                    <div class="pt-8">
                         <a href="/register" class="px-16 py-6 bg-white text-gray-900 rounded-[2rem] font-black text-xl hover:bg-gray-50 transition-all shadow-xl active:scale-95 inline-block tracking-tight">
                            Free Trial Start
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>

<style>
    :global(html) {
        scroll-behavior: smooth;
    }
</style>
