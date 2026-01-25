<script lang="ts">
    import { page } from '$app/stores';
    import { trpc } from '$lib/trpc';
    import { onMount } from 'svelte';
    
    let writings = $state<any[]>([]);
    let styles = $state<any[]>([]);
    let selectedWritingId = $state<number | undefined>(undefined);
    let selectedStyleId = $state<number | undefined>(undefined);
    let manualText = $state('');
    let generatedQuestions = $state<any[]>([]);
    let isGenerating = $state(false);
    let error = $state('');

    $effect(() => {
        const client = trpc($page);
        client.writing.getHistory.query().then(res => writings = res);
        client.interviewLearning.listStyles.query().then(res => styles = res);
    });

    async function handleGenerate() {
        isGenerating = true;
        error = '';
        generatedQuestions = [];

        try {
            const result = await trpc($page).interview.generateQuestions.mutate({
                writingId: selectedWritingId,
                coverLetterText: !selectedWritingId ? manualText : undefined,
                interviewStyleId: selectedStyleId,
                questionCount: 5
            });
            generatedQuestions = result.questions;
        } catch (e: any) {
            console.error(e);
            error = e.message || 'Generation failed';
        } finally {
            isGenerating = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto py-10 px-4 space-y-8">
    <div class="space-y-2">
        <h1 class="text-3xl font-bold text-gray-900">면접 예상 질문 생성</h1>
        <p class="text-gray-500">작성한 자기소개서를 분석하여 맞춤형 면접 질문과 답변 가이드를 받아보세요.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Input Section -->
        <div class="md:col-span-1 space-y-6">
            <div class="space-y-2">
                <label for="writing" class="block text-sm font-medium text-gray-700">분석할 자기소개서</label>
                <select 
                    id="writing" 
                    bind:value={selectedWritingId}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                    <option value={undefined}>직접 입력 / 선택 안함</option>
                    {#each writings as writing}
                        <option value={writing.id}>
                            [{writing.itemType}] {writing.prompt.slice(0, 20)}...
                        </option>
                    {/each}
                </select>
            </div>

            {#if !selectedWritingId}
                <div class="space-y-2">
                    <label for="manualText" class="block text-sm font-medium text-gray-700">자기소개서 내용 직접 입력</label>
                    <textarea 
                        id="manualText" 
                        bind:value={manualText} 
                        rows="6"
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                        placeholder="분석할 자소서 내용을 붙여넣으세요..."
                    ></textarea>
                </div>
            {/if}

            <div class="space-y-2">
                <label for="style" class="block text-sm font-medium text-gray-700">면접관 스타일</label>
                <select 
                    id="style" 
                    bind:value={selectedStyleId}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                    <option value={undefined}>기본 면접관</option>
                    {#each styles as style}
                        <option value={style.id}>{style.name}</option>
                    {/each}
                </select>
            </div>

            <button 
                onclick={handleGenerate}
                disabled={isGenerating || (!selectedWritingId && !manualText)}
                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {#if isGenerating}
                    질문 생성 중...
                {:else}
                    면접 질문 뽑기
                {/if}
            </button>
            
            {#if error}
                <p class="text-red-600 text-sm">{error}</p>
            {/if}
        </div>

        <!-- Result Section -->
        <div class="md:col-span-2 space-y-6">
            {#if generatedQuestions.length > 0}
                <h2 class="text-xl font-semibold text-gray-900 border-b pb-2">생성된 예상 질문</h2>
                <div class="space-y-6">
                    {#each generatedQuestions as q, i}
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div class="flex items-start justify-between">
                                <h3 class="text-lg font-medium text-indigo-900">Q{i+1}. {q.question}</h3>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {q.difficulty || '보통'}
                                </span>
                            </div>
                            
                            <div class="mt-4 space-y-3">
                                <div>
                                    <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wide">의도 & 전략</span>
                                    <p class="mt-1 text-sm text-gray-600 bg-indigo-50 p-3 rounded">{q.answerStrategy}</p>
                                </div>
                                
                                <div>
                                    <span class="text-xs font-semibold text-green-600 uppercase tracking-wide">모범 답변 가이드</span>
                                    <p class="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{q.suggestedAnswer}</p>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else if !isGenerating}
                <div class="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    <svg class="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p>자소서를 선택하고 예상 질문을 받아보세요.</p>
                </div>
            {:else}
                 <div class="h-64 flex flex-col items-center justify-center text-gray-500">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                    <p>면접관이 자소서를 검토하고 질문을 준비 중입니다...</p>
                </div>
            {/if}
        </div>
    </div>
</div>
