<script lang="ts">
    import { page } from '$app/stores';
    import { trpc } from '$lib/trpc';
    import { 
        UploadCloud, 
        FileText, 
        BarChart3, 
        MessageSquare, 
        Building2, 
        CheckCircle2,
        Loader2,
        ChevronRight,
        ArrowRight,
        Send
    } from 'lucide-svelte';
    import { fade, slide } from 'svelte/transition';

    // State
    let isUploading = $state(false);
    let analysisId = $state<number | null>(null);
    let analysisData = $state<any>(null);
    let activeTab = $state<'dashboard' | 'chat'>('dashboard');

    // Chat State
    let chatMessage = $state("");
    let chatHistory = $state<{ role: string; text: string }[]>([]);
    let isChatting = $state(false);

    let fileInput: HTMLInputElement;

    async function handleFileUpload(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        isUploading = true;
        analysisData = null;
        analysisId = null;
        
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/analysis/upload", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("업로드 실패");
            const data = await res.json();
            analysisId = data.id;
            pollAnalysis(data.id);
        } catch (error) {
            console.error(error);
            alert("파일 업로드 중 오류가 발생했습니다.");
            isUploading = false;
        }
    }

    async function pollAnalysis(id: number) {
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            try {
                const res = await fetch(`/api/analysis/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.analysis_result) {
                        analysisData = data;
                        isUploading = false;
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                console.error(err);
            }

            if (attempts > 30) {
                clearInterval(interval);
                isUploading = false;
                alert("분석 시간이 오래 걸립니다. 나중에 다시 확인해주세요.");
            }
        }, 2000);
    }

    async function handleChat() {
        if (!chatMessage.trim() || !analysisId) return;

        const userMsg = chatMessage;
        chatHistory = [...chatHistory, { role: "user", text: userMsg }];
        chatMessage = "";
        isChatting = true;

        try {
            const res = await fetch("/api/analysis/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: analysisId, message: userMsg }),
            });
            const data = await res.json();
            chatHistory = [...chatHistory, { role: "bot", text: data.response }];
        } catch (err) {
            chatHistory = [...chatHistory, { role: "bot", text: "오류가 발생했습니다." }];
        } finally {
            isChatting = false;
        }
    }
</script>

<div class="container-px py-24 md:py-32 space-y-16">
    <!-- Header -->
    <div class="space-y-4 text-center lg:text-left">
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center lg:justify-start gap-3">
            <BarChart3 class="w-10 h-10 text-emerald-600" />
            JD 분석 (Job Description Analysis)
        </h1>
        <p class="text-lg text-gray-500 max-w-2xl">
            채용 공고 파일을 올리시면 기업 현황(NPS/DART)과 직무 핵심 역량을 정밀 분석해 드립니다.
        </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Sidebar: Upload & Summary (Left) -->
        <div class="lg:col-span-4 space-y-6">
            <!-- Upload Card -->
            <div class="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6">
                <div class="flex items-center gap-2 text-gray-900 font-bold text-lg">
                    <UploadCloud class="w-5 h-5 text-emerald-500" />
                    공고 업로드
                </div>
                
                <button 
                    onclick={() => fileInput.click()}
                    class="w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                >
                    <input type="file" bind:this={fileInput} class="hidden" onchange={handleFileUpload} accept=".pdf,.doc,.docx,image/*,.txt" />
                    
                    {#if isUploading}
                        <Loader2 class="w-10 h-10 text-emerald-500 animate-spin" />
                        <p class="text-sm font-bold text-emerald-600">AI 분석 리포트 생성 중...</p>
                    {:else}
                        <div class="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all">
                            <FileText class="w-7 h-7 text-gray-400 group-hover:text-emerald-500" />
                        </div>
                        <div class="text-center">
                            <p class="text-sm font-bold text-gray-700">파일을 끌어오거나 클릭하세요</p>
                            <p class="text-xs text-gray-400 mt-1">PDF, 이미지, DOCX 지원</p>
                        </div>
                    {/if}
                </button>
            </div>

            <!-- Summary Card -->
            {#if analysisData}
                <div class="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6" in:fade>
                     <div class="flex items-center gap-2 text-gray-900 font-bold text-lg border-b border-gray-50 pb-4">
                        <Building2 class="w-5 h-5 text-blue-500" />
                        분석 개요
                    </div>
                    <div class="space-y-4">
                        <div class="space-y-1">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">기업명</span>
                            <p class="text-xl font-extrabold text-gray-900">{analysisData.analysis_result?.corporate_name || "미식별"}</p>
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">채용 직무</span>
                            <p class="text-lg font-bold text-blue-600">{analysisData.analysis_result?.job_title || "전체"}</p>
                        </div>
                        <div class="pt-4 space-y-3">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">핵심 키워드</span>
                            <div class="flex flex-wrap gap-2">
                                {#each analysisData.analysis_result?.talent_keywords || [] as kw}
                                    <span class="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-bold leading-none">
                                        {kw}
                                    </span>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Main Content: Dashboard & Chat (Right) -->
        <div class="lg:col-span-8 space-y-6">
            <div class="flex p-1 bg-gray-100 rounded-2xl w-fit mb-2">
                <button 
                    onclick={() => activeTab = 'dashboard'}
                    class="px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                    {activeTab === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
                >
                    <BarChart3 class="w-4 h-4" />
                    분석 대시보드
                </button>
                <button 
                    onclick={() => activeTab = 'chat'}
                    class="px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                    {activeTab === 'chat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
                >
                    <MessageSquare class="w-4 h-4" />
                    채용 공고 Q&A
                </button>
            </div>

            {#if activeTab === 'dashboard'}
                <div class="space-y-6" in:fade>
                    {#if analysisData}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Job Summary -->
                            <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-4 md:col-span-2">
                                <h4 class="font-bold text-gray-900 text-lg">공고 핵심 요약</h4>
                                <div class="p-5 bg-gray-50 rounded-2xl text-gray-700 text-sm leading-relaxed whitespace-pre-wrap border border-gray-100">
                                    {analysisData.analysis_result?.job_summary || "사업 내용 요약 데이터가 없습니다."}
                                </div>
                            </div>

                            <!-- NPS Stats -->
                            {#if analysisData.financial_data?.nps?.status === "Success"}
                                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg space-y-2 text-center">
                                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">총 임직원 수</p>
                                    <div class="text-3xl font-black text-gray-900">
                                        {analysisData.financial_data.nps.employees.toLocaleString()}<span class="text-lg font-bold ml-1 text-gray-400">명</span>
                                    </div>
                                    <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-[9px] font-bold text-gray-500 mt-2">
                                        국민연금 가입 기준
                                    </div>
                                </div>

                                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg space-y-2 text-center">
                                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">평균 연봉 (추정)</p>
                                    <div class="text-3xl font-black text-emerald-600">
                                        {(analysisData.financial_data.nps.avg_monthly_income * 12 / 10000).toLocaleString()}<span class="text-lg font-bold ml-1 text-emerald-300">만원</span>
                                    </div>
                                    <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded text-[9px] font-bold text-emerald-600 mt-2">
                                        월 평균 소득액 환산
                                    </div>
                                </div>

                                <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl md:col-span-2 space-y-6">
                                    <div class="flex justify-between items-end">
                                        <h4 class="font-bold text-gray-900">최근 1년 인력 변동</h4>
                                        <div class="flex gap-4">
                                            <div class="flex items-center gap-2">
                                                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span class="text-xs font-bold text-gray-500">입사 {((analysisData.financial_data.nps.new_hires / analysisData.financial_data.nps.employees) * 100).toFixed(1)}%</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <div class="w-3 h-3 bg-red-400 rounded-full"></div>
                                                <span class="text-xs font-bold text-gray-500">퇴사 {((analysisData.financial_data.nps.departures / analysisData.financial_data.nps.employees) * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="w-full bg-gray-100 h-4 rounded-full overflow-hidden flex shadow-inner">
                                        <div
                                            class="bg-blue-500 h-full transition-all duration-1000"
                                            style="width: {(analysisData.financial_data.nps.new_hires / (analysisData.financial_data.nps.new_hires + analysisData.financial_data.nps.departures)) * 100}%"
                                        ></div>
                                        <div
                                            class="bg-red-400 h-full transition-all duration-1000"
                                            style="width: {(analysisData.financial_data.nps.departures / (analysisData.financial_data.nps.new_hires + analysisData.financial_data.nps.departures)) * 100}%"
                                        ></div>
                                    </div>
                                </div>
                            {/if}

                            <!-- Tip Card -->
                             <div class="bg-emerald-900 p-8 rounded-3xl shadow-2xl md:col-span-2 flex items-center gap-6 group overflow-hidden relative">
                                <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
                                <div class="w-16 h-16 bg-emerald-800 rounded-2xl flex items-center justify-center flex-shrink-0 animate-bounce">
                                    <CheckCircle2 class="w-8 h-8 text-emerald-400" />
                                </div>
                                <div class="flex-1 space-y-2">
                                    <h5 class="text-white font-black text-xl">합격 자소서 작성 팁</h5>
                                    <p class="text-emerald-100/80 text-sm leading-relaxed">
                                        현재 이 기업은 <strong class="text-white underline decoration-emerald-500 underline-offset-4">{analysisData.analysis_result?.talent_keywords?.[0] || '특정'}</strong> 중심의 우수 인재를 찾고 있습니다. 
                                        귀하의 경험 중 관련 사례를 최우선으로 배치해 보세요.
                                    </p>
                                    <a href="/writing" class="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm mt-2 hover:text-white transition-colors">
                                        자소서 작성하러 가기
                                        <ArrowRight class="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    {:else}
                         <div class="bg-white h-[500px] flex flex-col items-center justify-center text-center p-12 rounded-3xl border border-gray-100 shadow-sm border-dashed">
                            <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <BarChart3 class="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-2">데이터 분석 준비 완료</h3>
                            <p class="text-sm text-gray-400 max-w-xs leading-relaxed">
                                왼쪽 버튼을 눌러 공고 파일을 업로드해 주세요. 
                                AI가 기업의 재무 상태와 공고 핵심 내용을 한눈에 정리해 드립니다.
                            </p>
                        </div>
                    {/if}
                </div>
            {:else if activeTab === 'chat'}
                <div class="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col h-[650px] overflow-hidden" in:fade>
                    <div class="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                                <MessageSquare class="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-900 text-sm">채용 JD 전문 상담봇</h4>
                                <p class="text-[10px] text-gray-400 font-medium">분석된 공고 내용을 바탕으로 궁금증을 해결해 드립니다.</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/20">
                        {#if chatHistory.length === 0}
                            <div class="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                <MessageSquare class="w-12 h-12 text-gray-300" />
                                <p class="text-sm font-medium">야근 수당은 있는지, 우대 사항은 뭔지 궁금한 모든 것을 물어보세요.</p>
                            </div>
                        {/if}
                        
                        {#each chatHistory as msg}
                            <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
                                <div class="max-w-[85%] lg:max-w-[70%] rounded-2xl p-4 text-sm font-medium shadow-sm transition-all
                                    {msg.role === 'user' 
                                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}">
                                    {msg.text}
                                </div>
                            </div>
                        {/each}

                        {#if isChatting}
                            <div class="flex justify-start">
                                <div class="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 flex gap-2">
                                    <div class="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                    <div class="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div class="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                </div>
                            </div>
                        {/if}
                    </div>

                    <div class="p-6 bg-white border-t border-gray-50">
                        <form 
                            onsubmit={(e) => { e.preventDefault(); handleChat(); }}
                            class="flex gap-3 bg-gray-100 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500 transition-all"
                        >
                            <input 
                                bind:value={chatMessage}
                                placeholder={analysisId ? "이 공고에 대해 질문하세요..." : "먼저 공고를 업로드해 주세요"}
                                disabled={!analysisId || isChatting}
                                class="flex-1 bg-transparent border-none focus:ring-0 px-4 text-sm font-medium"
                            />
                            <button 
                                type="submit" 
                                disabled={!analysisId || isChatting || !chatMessage.trim()}
                                class="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg flex items-center justify-center transition-all disabled:opacity-30 active:scale-90"
                            >
                                <Send class="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    /* Custom scrollbar */
    :global(::-webkit-scrollbar) {
        width: 6px;
    }
    :global(::-webkit-scrollbar-thumb) {
        background: #e2e8f0;
        border-radius: 10px;
    }
</style>
