<script lang="ts">
    import { page } from '$app/stores';
    import { trpc } from '$lib/trpc';
    import { onMount } from 'svelte';
    import { 
        MessageSquare, 
        Wand2, 
        ChevronDown, 
        ChevronUp, 
        BookOpen, 
        Building2,
        FileText,
        History,
        Upload,
        AlertCircle,
        Loader2
    } from 'lucide-svelte';
    import { fade, slide } from 'svelte/transition';
    
    // State (Using Svelte 5 $state)
    let inputMode = $state<'text' | 'select' | 'file'>('text');
    let writings = $state<any[]>([]);
    let styles = $state<any[]>([]);
    let corporates = $state<any[]>([]);
    
    let selectedWritingId = $state<number | undefined>(undefined);
    let selectedStyleId = $state<number | undefined>(undefined);
    let selectedCorporateId = $state<number | undefined>(undefined);
    let manualText = $state('');
    let questionCount = $state(5);
    
    let generatedQuestions = $state<any[]>([]);
    let isGenerating = $state(false);
    let isExtracting = $state(false);
    let expandedIndex = $state<number | null>(null);
    let error = $state('');

    // Fetch Initial Data
    $effect(() => {
        const client = trpc($page);
        client.writing.getHistory.query().then(res => writings = res);
        client.interviewLearning.listStyles.query().then(res => styles = res);
        client.corporate.list.query().then(res => corporates = res);
    });

    async function handleFileUpload(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        isExtracting = true;
        error = '';
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/analysis/upload/extract', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('파일 분석에 실패했습니다.');

            const data = await response.json();
            manualText = data.text;
            inputMode = 'text'; // Switch to text to show extracted content
        } catch (e: any) {
            error = e.message;
        } finally {
            isExtracting = false;
        }
    }

    async function handleGenerate() {
        if (inputMode === 'text' && !manualText.trim()) {
            error = '자소서 내용을 입력해주세요.';
            return;
        }
        if (inputMode === 'select' && !selectedWritingId) {
            error = '자소서를 선택해주세요.';
            return;
        }

        isGenerating = true;
        error = '';
        generatedQuestions = [];
        expandedIndex = null;

        try {
            const result = await trpc($page).interview.generateQuestions.mutate({
                writingId: inputMode === 'select' ? selectedWritingId : undefined,
                coverLetterText: inputMode === 'text' ? manualText : undefined,
                interviewStyleId: selectedStyleId,
                corporateId: selectedCorporateId,
                questionCount
            });
            generatedQuestions = result.questions;
        } catch (e: any) {
            console.error(e);
            error = e.message || '질문 생성에 실패했습니다.';
        } finally {
            isGenerating = false;
        }
    }

    function getDifficultyColor(difficulty: string) {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'bg-green-100 text-green-700 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'hard': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    }

    function getDifficultyLabel(difficulty: string) {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return '기본';
            case 'medium': return '중급';
            case 'hard': return '심화';
            default: return difficulty || '보통';
        }
    }
</script>

<div class="container-px py-24 md:py-32 space-y-16">
    <!-- Header -->
    <div class="space-y-4">
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <MessageSquare class="w-10 h-10 text-indigo-600" />
            면접 질문 생성
        </h1>
        <p class="text-lg text-gray-500 max-w-2xl">
            작성한 자기소개서와 지원 기업을 분석하여, 면접관이 던질만한 예상 질문과 완벽한 답변 전략을 AI가 준비해 드립니다.
        </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Input Section (Left) -->
        <div class="lg:col-span-5 space-y-6">
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div class="p-6 space-y-6">
                    <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText class="w-5 h-5 text-indigo-500" />
                        자소서 입력
                    </h2>

                    <!-- Mode Tabs -->
                    <div class="flex p-1 bg-gray-100 rounded-xl space-x-1">
                        {#each [
                            { id: 'text', label: '직접 입력', icon: FileText },
                            { id: 'select', label: '이력 선택', icon: History },
                            { id: 'file', label: '파일 업로드', icon: Upload }
                        ] as mode}
                            <button
                                onclick={() => inputMode = mode.id as any}
                                class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all
                                {inputMode === mode.id 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'}"
                            >
                                <mode.icon class="w-4 h-4" />
                                {mode.label}
                            </button>
                        {/each}
                    </div>

                    <!-- Input Fields -->
                    <div class="space-y-4">
                        {#if inputMode === 'text'}
                            <div class="space-y-2" in:fade>
                                <textarea 
                                    bind:value={manualText} 
                                    rows="8"
                                    class="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-4 border bg-gray-50/50"
                                    placeholder="면접 질문을 생성할 자소서 내용을 붙여넣으세요..."
                                ></textarea>
                            </div>
                        {:else if inputMode === 'select'}
                            <div class="space-y-2" in:fade>
                                <select 
                                    bind:value={selectedWritingId}
                                    class="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border bg-gray-50/50 appearance-none"
                                >
                                    <option value={undefined}>작성한 이력 선택...</option>
                                    {#each writings as writing}
                                        <option value={writing.id}>
                                            [{writing.itemType || '자유'}] {writing.prompt.slice(0, 30)}...
                                        </option>
                                    {/each}
                                </select>
                            </div>
                        {:else if inputMode === 'file'}
                            <div class="space-y-4" in:fade>
                                <label 
                                    class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-indigo-50 transition-all group"
                                >
                                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                        {#if isExtracting}
                                            <Loader2 class="w-10 h-10 text-indigo-500 animate-spin" />
                                            <p class="mt-2 text-sm text-indigo-600 font-medium">분석 중...</p>
                                        {:else}
                                            <BookOpen class="w-10 h-10 text-gray-400 group-hover:text-indigo-500 mb-3 transition-colors" />
                                            <p class="mb-2 text-sm text-gray-700 font-semibold">클릭하여 파일 업로드</p>
                                            <p class="text-xs text-gray-500">PDF, DOCX, 이미지 파일 지원</p>
                                        {/if}
                                    </div>
                                    <input type="file" class="hidden" onchange={handleFileUpload} accept=".pdf,.doc,.docx,image/*" />
                                </label>
                            </div>
                        {/if}
                    </div>

                    <hr class="border-gray-100" />

                    <!-- Options -->
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Wand2 class="w-4 h-4 text-indigo-500" />
                                면접 답변 스타일
                            </label>
                            <select 
                                bind:value={selectedStyleId}
                                class="block w-full rounded-xl border-gray-200 shadow-sm sm:text-sm p-3 border bg-white"
                            >
                                <option value={undefined}>기본 면접관 스타일</option>
                                {#each styles as style}
                                    <option value={style.id}>{style.name}</option>
                                {/each}
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Building2 class="w-4 h-4 text-indigo-500" />
                                기업 분석 (선택)
                            </label>
                            <select 
                                bind:value={selectedCorporateId}
                                class="block w-full rounded-xl border-gray-200 shadow-sm sm:text-sm p-3 border bg-white"
                            >
                                <option value={undefined}>기업 정보 없음</option>
                                {#each corporates as corp}
                                    <option value={corp.id}>{corp.companyName}</option>
                                {/each}
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-bold text-gray-700">질문 개수</label>
                            <div class="grid grid-cols-4 gap-2">
                                {#each [3, 5, 7, 10] as count}
                                    <button 
                                        onclick={() => questionCount = count}
                                        class="py-2 text-sm font-medium rounded-lg border transition-all
                                        {questionCount === count 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}"
                                    >
                                        {count}개
                                    </button>
                                {/each}
                            </div>
                        </div>
                    </div>

                    <button 
                        onclick={handleGenerate}
                        disabled={isGenerating || (inputMode === 'text' && !manualText) || (inputMode === 'select' && !selectedWritingId)}
                        class="relative w-full overflow-hidden group py-4 px-6 rounded-2xl shadow-lg transition-all
                        {isGenerating 
                            ? 'bg-gray-100 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}"
                    >
                        {#if isGenerating}
                             <div class="flex items-center justify-center gap-2 text-indigo-600 font-bold">
                                <Loader2 class="w-5 h-5 animate-spin" />
                                면접관이 검토 중...
                             </div>
                        {:else}
                            <div class="flex items-center justify-center gap-2 text-white font-bold text-lg">
                                <Wand2 class="w-5 h-5" />
                                면접 질문 생성하기
                            </div>
                        {/if}
                    </button>

                    {#if error}
                        <div class="flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 rounded-xl" in:fade>
                            <AlertCircle class="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Result Section (Right) -->
        <div class="lg:col-span-7 space-y-6">
            {#if generatedQuestions.length > 0}
                <div class="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h2 class="text-2xl font-bold text-gray-900">AI 면접 가이드</h2>
                    <span class="text-sm text-gray-500 font-medium">총 {generatedQuestions.length}개의 질문 준비됨</span>
                </div>
                
                <div class="space-y-4">
                    {#each generatedQuestions as q, i}
                        <div 
                            class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            in:fade={{ delay: i * 100 }}
                        >
                            <button 
                                onclick={() => expandedIndex = expandedIndex === i ? null : i}
                                class="w-full text-left p-6 flex items-start justify-between gap-4 group"
                            >
                                <div class="flex-1 space-y-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">Q{i+1}</span>
                                        <span class="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border {getDifficultyColor(q.difficulty)}">
                                            {getDifficultyLabel(q.difficulty)}
                                        </span>
                                        <span class="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                            {q.category}
                                        </span>
                                    </div>
                                    <h3 class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                                        {q.question}
                                    </h3>
                                </div>
                                <div class="mt-1">
                                    {#if expandedIndex === i}
                                        <ChevronUp class="w-6 h-6 text-gray-400" />
                                    {:else}
                                        <ChevronDown class="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                    {/if}
                                </div>
                            </button>

                            {#if expandedIndex === i}
                                <div class="px-6 pb-6 pt-0 space-y-5" transition:slide>
                                    <div class="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-2">
                                        <h4 class="text-sm font-bold text-indigo-700 flex items-center gap-2">
                                            <Wand2 class="w-4 h-4" />
                                            답변 의도 및 전략
                                        </h4>
                                        <p class="text-sm text-gray-700 leading-relaxed">{q.answerStrategy}</p>
                                    </div>

                                    <div class="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 space-y-2">
                                        <h4 class="text-sm font-bold text-emerald-700 flex items-center gap-2">
                                            <AlertCircle class="w-4 h-4" />
                                            모범 답변 가이드
                                        </h4>
                                        <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{q.suggestedAnswer}</p>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {:else if !isGenerating}
                <!-- Empty State -->
                <div class="bg-white h-[600px] flex flex-col items-center justify-center text-center p-12 rounded-3xl border border-gray-100 shadow-sm" in:fade>
                    <div class="relative mb-6">
                        <div class="absolute inset-0 bg-indigo-100 rounded-full blur-3xl opacity-50 scale-150"></div>
                        <div class="relative bg-white p-6 rounded-full shadow-lg border border-gray-50">
                            <MessageSquare class="h-16 w-16 text-indigo-500" />
                        </div>
                    </div>
                    <h3 class="text-2xl font-extrabold text-gray-900 mb-2">당신만을 위한 면접 파트너</h3>
                    <p class="text-gray-500 max-w-sm leading-relaxed mb-8">
                        왼쪽에서 자소서 내용을 입력하거나 작성한 기록을 선택하시면, 
                        AI가 수만 개의 합격 답변 데이터를 바탕으로 최적의 질문을 뽑아드립니다.
                    </p>
                    <div class="grid grid-cols-3 gap-4 w-full max-w-md">
                        <div class="flex flex-col items-center gap-2">
                            <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <FileText class="w-5 h-5 text-blue-600" />
                            </div>
                            <span class="text-xs font-bold text-gray-600 uppercase">자소서 분석</span>
                        </div>
                        <div class="flex flex-col items-center gap-2">
                            <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Building2 class="w-5 h-5 text-indigo-600" />
                            </div>
                            <span class="text-xs font-bold text-gray-600 uppercase">기업 맞춤</span>
                        </div>
                        <div class="flex flex-col items-center gap-2">
                            <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                <Wand2 class="w-5 h-5 text-emerald-600" />
                            </div>
                            <span class="text-xs font-bold text-gray-600 uppercase">전략 답변</span>
                        </div>
                    </div>
                </div>
            {:else}
                <!-- Generating State -->
                <div class="bg-white h-[600px] flex flex-col items-center justify-center text-center p-12 rounded-3xl border border-gray-100 shadow-sm" in:fade>
                    <div class="relative mb-8">
                        <div class="absolute inset-0 bg-indigo-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                        <Loader2 class="h-20 w-20 text-indigo-600 animate-spin relative" />
                    </div>
                    <h3 class="text-2xl font-extrabold text-gray-900 mb-2">면접관이 내용을 분석 중입니다</h3>
                    <p class="text-gray-500 max-w-sm leading-relaxed">
                        자소서의 핵심 키워드를 추출하고 기업 인재상을 대조하고 있습니다. 잠시만 기다려 주세요...
                    </p>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    /* Custom scrollbar for better look */
    :global(::-webkit-scrollbar) {
        width: 8px;
    }
    :global(::-webkit-scrollbar-track) {
        background: transparent;
    }
    :global(::-webkit-scrollbar-thumb) {
        background: #e2e8f0;
        border-radius: 10px;
    }
    :global(::-webkit-scrollbar-thumb:hover) {
        background: #cbd5e1;
    }
</style>
