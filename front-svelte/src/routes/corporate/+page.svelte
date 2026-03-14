<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { Building2, Globe, TrendingUp, Target, Briefcase, AlertTriangle, Save, Trash2, Loader2, Search, ExternalLink } from 'lucide-svelte';
    import { fade, fly, slide } from 'svelte/transition';

    let companyName = $state('');
    let websiteUrl = $state('');
    let isAnalyzing = $state(false);
    let result = $state<any>(null);
    let history = $state<any[]>([]);

    const trpcService = trpc($page);

    $effect(() => {
        loadHistory();
    });

    async function loadHistory() {
        try {
            history = await trpcService.corporate.list.query();
        } catch (e) {
            console.error(e);
        }
    }

    async function handleAnalyze() {
        if (!companyName.trim()) {
            alert('기업명을 입력해주세요.');
            return;
        }

        isAnalyzing = true;
        try {
            result = await trpcService.corporate.analyze.mutate({
                companyName,
                websiteUrl: websiteUrl.trim() || undefined
            });
        } catch (e: any) {
            alert(e.message || '분석 중 오류가 발생했습니다.');
        } finally {
            isAnalyzing = false;
        }
    }

    async function handleSave() {
        if (!result) return;
        try {
            await trpcService.corporate.create.mutate({
                companyName,
                websiteUrl: websiteUrl.trim() || undefined,
                analysisResult: JSON.stringify(result)
            });
            alert('저장되었습니다.');
            loadHistory();
        } catch (e) {
            alert('저장 실패');
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('삭제하시겠습니까?')) return;
        try {
            await trpcService.corporate.delete.mutate(id);
            loadHistory();
        } catch (e) {
            alert('삭제 실패');
        }
    }

    const swotLabels = {
        strength: { label: '강점 (Strength)', icon: '💪', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        weakness: { label: '약점 (Weakness)', icon: '📉', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        opportunity: { label: '기회 (Opportunity)', icon: '🚀', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        threat: { label: '위협 (Threat)', icon: '⚠️', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' }
    };
</script>

<div class="min-h-screen bg-[#fcfcfd]">
    <div class="container-px py-24 md:py-32">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <!-- Left Panel: Input & History (4 cols) -->
            <div class="lg:col-span-4 space-y-8">
                <header>
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider mb-4 border border-indigo-100">
                        <Building2 class="w-3 h-3" />
                        Market Intelligence
                    </div>
                    <h1 class="text-3xl font-black text-gray-900 tracking-tight mb-4">
                        기업 <span class="text-indigo-600">심층 분석</span>
                    </h1>
                    <p class="text-gray-500 font-medium leading-relaxed">
                        지원하려는 기업의 DNA를 분석합니다.<br />
                        AI 크롤러가 최신 이슈와 전략을 도출해 드립니다.
                    </p>
                </header>

                <div class="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
                    <div>
                        <label for="company" class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Company Name</label>
                        <div class="relative">
                            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input 
                                id="company"
                                bind:value={companyName}
                                placeholder="예: 삼성전자, 네이버"
                                class="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium" 
                            />
                        </div>
                    </div>

                    <div>
                        <label for="url" class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Website URL (Optional)</label>
                        <div class="relative">
                            <Globe class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input 
                                id="url"
                                bind:value={websiteUrl}
                                placeholder="https://www.example.com"
                                class="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium" 
                            />
                        </div>
                        <p class="mt-2 text-[10px] text-gray-300 font-medium leading-tight">URL 입력 시 실제 웹사이트 데이터를 크롤링하여 더 정교한 분석이 가능합니다.</p>
                    </div>

                    <button 
                        onclick={handleAnalyze}
                        disabled={isAnalyzing}
                        class="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-200"
                    >
                        {#if isAnalyzing}
                            <Loader2 class="w-6 h-6 animate-spin text-white/50" />
                            ANALYZING...
                        {:else}
                            <TrendingUp class="w-6 h-6" />
                            분석 시작하기
                        {/if}
                    </button>
                </div>

                <!-- History Section -->
                {#if history.length > 0}
                    <div class="pt-8">
                        <div class="flex items-center gap-2 mb-6 text-gray-400">
                            <Building2 class="w-4 h-4" />
                            <h3 class="text-xs font-black uppercase tracking-widest">Recent Corporate Reports</h3>
                        </div>
                        <div class="space-y-3">
                            {#each history as log}
                                <div class="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 hover:shadow-lg transition-all flex items-center justify-between">
                                    <button 
                                        class="flex-1 text-left"
                                        onclick={() => { result = JSON.parse(log.analysisResult); companyName = log.companyName; websiteUrl = log.websiteUrl || ''; }}
                                    >
                                        <div class="text-sm font-bold text-gray-900 truncate mb-1">{log.companyName}</div>
                                        <div class="text-[10px] text-gray-400 font-medium truncate flex items-center gap-1">
                                            <Globe class="w-2.5 h-2.5" />
                                            {log.websiteUrl || 'No external URL'}
                                        </div>
                                    </button>
                                    <button 
                                        onclick={() => handleDelete(log.id)}
                                        class="p-2 text-gray-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Right Panel: Report Data (8 cols) -->
            <div class="lg:col-span-8">
                {#if result}
                    <div class="space-y-8" in:fly={{ y: 20 }}>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-900 shadow-sm border border-gray-100">
                                    <h2 class="text-xl font-black">{companyName.substring(0, 1)}</h2>
                                </div>
                                <h2 class="text-2xl font-black text-gray-900 tracking-tight">{companyName} Strategy Report</h2>
                            </div>
                            <button 
                                onclick={handleSave}
                                class="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                            >
                                <Save class="w-4 h-4" />
                                Save Report
                            </button>
                        </div>

                        <!-- Dashboard Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <!-- Mission/Vision -->
                            <div class="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm col-span-1 md:col-span-2">
                                <div class="flex items-center gap-3 mb-8">
                                    <Target class="w-6 h-6 text-rose-500" />
                                    <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight">Mission & Core Value</h3>
                                </div>
                                <p class="text-gray-600 font-medium leading-relaxed italic text-lg">
                                    " {result.mission} "
                                </p>
                            </div>

                            <!-- Ideal Candidate -->
                            <div class="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
                                <div class="flex items-center gap-3 mb-8">
                                    <Building2 class="w-6 h-6 text-blue-500" />
                                    <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight">Ideal Talent</h3>
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    {#each result.ideal_candidate as k}
                                        <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-100">{k}</span>
                                    {/each}
                                </div>
                            </div>

                            <!-- Business Areas -->
                            <div class="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
                                <div class="flex items-center gap-3 mb-8">
                                    <Briefcase class="w-6 h-6 text-emerald-500" />
                                    <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight">Business Domain</h3>
                                </div>
                                <ul class="space-y-3">
                                    {#each result.business as item}
                                        <li class="flex items-start gap-2 text-sm font-medium text-gray-600">
                                            <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                                            {item}
                                        </li>
                                    {/each}
                                </ul>
                            </div>

                            <!-- SWOT Analysis -->
                            <div class="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm col-span-1 md:col-span-2">
                                <div class="flex items-center gap-3 mb-10">
                                    <TrendingUp class="w-6 h-6 text-indigo-600" />
                                    <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight">SWOT Analysis</h3>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {#each Object.entries(swotLabels) as [key, meta]}
                                        <div class="p-6 {meta.bg} rounded-3xl border {meta.border} transition-all duration-300 hover:scale-[1.02] cursor-default">
                                            <div class="flex items-center gap-2 mb-3">
                                                <span class="text-lg">{meta.icon}</span>
                                                <span class="text-xs font-black uppercase tracking-widest {meta.color}">{meta.label}</span>
                                            </div>
                                            <p class="text-sm font-medium text-gray-700 leading-relaxed">{result.swot[key]}</p>
                                        </div>
                                    {/each}
                                </div>
                            </div>

                            <!-- Recent Issues -->
                            <div class="bg-gray-900 rounded-[2.5rem] p-10 text-white col-span-1 md:col-span-2 relative overflow-hidden">
                                <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16"></div>
                                <div class="flex items-center gap-3 mb-8">
                                    <AlertTriangle class="w-6 h-6 text-amber-500" />
                                    <h3 class="text-lg font-black uppercase tracking-tight">Key Issues & Financials</h3>
                                </div>
                                <div class="space-y-8">
                                    <div>
                                        <h4 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Latest Trends</h4>
                                        <ul class="space-y-4">
                                            {#each result.recent_issues as issue}
                                                <li class="flex items-start gap-4 text-sm font-medium text-gray-300">
                                                    <div class="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                                        <ExternalLink class="w-4 h-4 text-gray-500" />
                                                    </div>
                                                    <span class="pt-1.5 leading-relaxed">{issue}</span>
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>
                                    <div class="pt-8 border-t border-white/5">
                                        <h4 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Market Outlook</h4>
                                        <p class="text-sm font-medium text-gray-400 leading-relaxed">{result.financials}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="h-[700px] bg-white rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-12" in:fade>
                        <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-300">
                            <Building2 class="w-12 h-12" />
                        </div>
                        <h4 class="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Market Intelligence Ready</h4>
                        <p class="text-gray-400 font-medium max-w-xs leading-relaxed">
                            분석하고 싶은 기업명 또는 홈페이지 URL을 입력해 주세요. <br />
                            AI가 성공적인 지원을 위한 전략 보고서를 작성해 드립니다.
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
