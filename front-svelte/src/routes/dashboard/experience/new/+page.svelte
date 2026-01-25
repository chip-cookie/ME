<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    let title = $state('');
    let content = $state('');
    let category = $state<string | undefined>(undefined);
    let isAnalyzing = $state(false);
    let error = $state('');
    let analysisResult = $state<any>(null);

    async function handleAnalyzeAndSave() {
        if (!content || content.length < 50) {
            error = '내용을 50자 이상 입력해주세요.';
            return;
        }

        isAnalyzing = true;
        error = '';

        try {
            // 1. Analyze and Create in one go (as per router implementation)
            const result = await trpc($page).experiences.create.mutate({
                title: title || 'Untitled Experience',
                content,
                category,
                analysisType: 'competency' // Default to competency analysis
            });

            if (result.success) {
                analysisResult = result.analysis;
                // Optional: Redirect after short delay or let user review the analysis
                // goto('/dashboard');
            }
        } catch (e: any) {
            console.error(e);
            error = e.message || 'Analysis failed';
        } finally {
            isAnalyzing = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto py-10 px-4 space-y-8">
    <div>
        <h1 class="text-3xl font-bold text-gray-900">새 경험 정리</h1>
        <p class="text-gray-500 mt-2">
            본인의 경험을 자유롭게 작성해보세요. AI가 STAR 기법으로 분석하여 핵심 역량을 추출해드립니다.
        </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input Form -->
        <div class="space-y-6">
            <div class="space-y-2">
                <label for="title" class="block text-sm font-medium text-gray-700">제목 (선택)</label>
                <input 
                    type="text" 
                    id="title" 
                    bind:value={title}
                    placeholder="예: 인턴십 프로젝트 리더 경험"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
            </div>

            <div class="space-y-2">
                <label for="content" class="block text-sm font-medium text-gray-700">구체적인 경험 내용</label>
                <textarea 
                    id="content" 
                    bind:value={content} 
                    rows="12"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                    placeholder="어떤 상황이었는지, 어떤 문제가 있었는지, 본인이 어떤 행동을 취했는지, 그리고 결과는 어떠했는지 구체적으로 작성해주세요."
                ></textarea>
                <p class="text-xs text-gray-500 text-right">{content.length} 자</p>
            </div>

            <div class="space-y-2">
                <label for="category" class="block text-sm font-medium text-gray-700">카테고리 (선택)</label>
                <select 
                    id="category" 
                    bind:value={category}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                    <option value={undefined}>자동 분류</option>
                    <option value="직무역량">직무역량</option>
                    <option value="커뮤니케이션">커뮤니케이션</option>
                    <option value="리더십">리더십</option>
                    <option value="팀워크">팀워크</option>
                    <option value="문제해결">문제해결</option>
                    <option value="도전/열정">도전/열정</option>
                </select>
            </div>

            <button 
                onclick={handleAnalyzeAndSave}
                disabled={isAnalyzing || content.length < 50}
                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
            >
                {#if isAnalyzing}
                    AI 분석 중...
                {:else}
                    경험 저장 및 분석하기
                {/if}
            </button>
            
            {#if error}
                <p class="text-red-500 text-sm">{error}</p>
            {/if}
        </div>

        <!-- Analysis Result -->
        <div class="bg-gray-50 rounded-lg p-6 border border-gray-200 min-h-[500px]">
            {#if analysisResult}
                <div class="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div class="flex items-center justify-between border-b pb-4">
                        <h3 class="text-lg font-bold text-gray-900">AI 분석 결과 (STAR)</h3>
                        <span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            {analysisResult.category}
                        </span>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">Summary</span>
                            <p class="text-gray-900 font-medium">{analysisResult.summary}</p>
                        </div>
                        
                        <div class="grid gap-4 bg-white p-4 rounded-md border border-gray-100">
                            <div>
                                <span class="text-xs font-bold text-indigo-500 uppercase tracking-wide">Situation (상황)</span>
                                <p class="text-sm text-gray-700 mt-1">{analysisResult.situation}</p>
                            </div>
                            <div>
                                <span class="text-xs font-bold text-indigo-500 uppercase tracking-wide">Action (행동)</span>
                                <p class="text-sm text-gray-700 mt-1">{analysisResult.action}</p>
                            </div>
                           <div>
                                <span class="text-xs font-bold text-indigo-500 uppercase tracking-wide">Result (결과)</span>
                                <p class="text-sm text-gray-700 mt-1">{analysisResult.result}</p>
                            </div>
                        </div>

                        <div>
                             <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">Insight</span>
                             <div class="mt-2 flex flex-wrap gap-2">
                                 <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                     핵심가치: {analysisResult.core_value}
                                 </span>
                                 <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                     성과: {analysisResult.achievement}
                                 </span>
                             </div>
                             <p class="text-sm text-gray-600 mt-2">
                                 💡 <strong>배운 점:</strong> {analysisResult.lesson}
                             </p>
                        </div>

                        <div class="pt-6">
                            <button 
                                onclick={() => goto('/dashboard')} 
                                class="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 text-sm"
                            >
                                대시보드로 돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            {:else if isAnalyzing}
                <div class="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p>당신의 경험을 분석하고 있습니다...</p>
                    <p class="text-xs text-gray-300">STAR 구조 추출 / 핵심 역량 파악 / 요약문 생성</p>
                </div>
            {:else}
                <div class="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                    <svg class="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <p>내용을 입력하면 AI가 실시간으로 분석합니다.</p>
                </div>
            {/if}
        </div>
    </div>
</div>
