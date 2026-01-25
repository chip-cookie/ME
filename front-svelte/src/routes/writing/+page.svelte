<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    
    let prompt = $state('');
    let targetCharCount = $state(500);
    let companyName = $state('');
    let jobCategory = $state('');
    let selectedExperienceId = $state<number | undefined>(undefined);
    let selectedStyleId = $state<number | undefined>(undefined);
    let generatedText = $state('');
    let isGenerating = $state(false);
    let error = $state('');

    // Pre-load data
    let styles = $state<any[]>([]);
    let experiences = $state<any[]>([]);

    $effect(() => {
        const client = trpc($page);
        client.writingLearning.listStyles.query().then(res => styles = res);
        client.experiences.list.query().then(res => experiences = res);
    });

    async function handleGenerate() {
        if (!prompt) return;
        isGenerating = true;
        error = '';
        generatedText = '';

        try {
            const result = await trpc($page).writing.generate.mutate({
                prompt,
                targetCharCount,
                styleId: selectedStyleId,
                experienceId: selectedExperienceId, // Pass selected experience
                itemType: '자기소개서',
                companyName: companyName || undefined,
                jobCategory: jobCategory || undefined
            });
            generatedText = result.generatedText;
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
        <h1 class="text-3xl font-bold text-gray-900">자기소개서 생성</h1>
        <p class="text-gray-500">AI가 당신의 경험을 바탕으로 맞춤형 자기소개서를 작성해드립니다.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Input Section -->
        <div class="md:col-span-1 space-y-6">
            <div class="space-y-2">
                <label for="prompt" class="block text-sm font-medium text-gray-700">작성할 항목 / 질문</label>
                <textarea 
                    id="prompt" 
                    bind:value={prompt} 
                    rows="6"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                    placeholder="예: 지원동기, 입사 후 포부, 성격의 장단점..."
                ></textarea>
            </div>

            <div class="space-y-2">
                <label for="experience" class="block text-sm font-medium text-gray-700">활용할 경험 (STAR)</label>
                <select 
                    id="experience" 
                    bind:value={selectedExperienceId}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                    <option value={undefined}>경험 선택 안함 (일반 작성)</option>
                    {#each experiences as exp}
                        <option value={exp.id}>{exp.title}</option>
                    {/each}
                </select>
                {#if experiences.length === 0}
                    <p class="text-xs text-gray-500">
                        <a href="/dashboard/experience/new" class="text-indigo-600 hover:underline">새 경험 추가하기</a>에서 경험을 먼저 정리해보세요.
                    </p>
                {/if}
            </div>

            <div class="space-y-4 pt-4 border-t border-gray-200">
                <h3 class="text-sm font-medium text-gray-900">부가 정보 (데이터 분석용)</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="companyName" class="block text-xs font-medium text-gray-500">기업명</label>
                        <input 
                            type="text" 
                            id="companyName" 
                            bind:value={companyName} 
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            placeholder="예: 삼성전자"
                        />
                    </div>
                    <div>
                        <label for="jobCategory" class="block text-xs font-medium text-gray-500">직무</label>
                        <input 
                            type="text" 
                            id="jobCategory" 
                            bind:value={jobCategory} 
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            placeholder="예: 마케팅 / 개발"
                        />
                    </div>
                </div>
            </div>

            <div class="space-y-2">
                <label for="style" class="block text-sm font-medium text-gray-700">글쓰기 스타일</label>
                <select 
                    id="style" 
                    bind:value={selectedStyleId}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                    <option value={undefined}>기본 스타일</option>
                    {#each styles as style}
                        <option value={style.id}>{style.name}</option>
                    {/each}
                </select>
            </div>

            <div class="space-y-2">
                <label for="count" class="block text-sm font-medium text-gray-700">목표 글자수 (공백포함)</label>
                <input 
                    type="number" 
                    id="count" 
                    bind:value={targetCharCount} 
                    step="100" 
                    min="100" 
                    max="2000"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
            </div>

            <button 
                onclick={handleGenerate}
                disabled={isGenerating || !prompt}
                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {#if isGenerating}
                    생성 중...
                {:else}
                    자기소개서 생성
                {/if}
            </button>
            
            {#if error}
                <p class="text-red-500 text-sm">{error}</p>
            {/if}
        </div>

        <!-- Output Section -->
        <div class="md:col-span-2 bg-gray-50 rounded-lg p-6 border border-gray-200 min-h-[500px]">
            {#if generatedText}
                <div class="prose max-w-none whitespace-pre-wrap leading-relaxed text-gray-800">
                    {generatedText}
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-500">
                    <span>글자수: {generatedText.length}자 (공백포함)</span>
                    <button class="text-indigo-600 hover:text-indigo-800" onclick={() => navigator.clipboard.writeText(generatedText)}>복사하기</button>
                </div>
            {:else if isGenerating}
                <div class="h-full flex items-center justify-center text-gray-400 animate-pulse">
                    AI가 열심히 작성중입니다...
                </div>
            {:else}
                <div class="h-full flex items-center justify-center text-gray-400">
                    왼쪽의 정보를 입력하고 생성 버튼을 눌러주세요.
                </div>
            {/if}
        </div>
    </div>
</div>
