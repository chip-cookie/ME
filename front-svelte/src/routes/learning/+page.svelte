<script lang="ts">
    import { page } from '$app/stores';
    import { trpc } from '$lib/trpc';
    import { 
        Upload, 
        FileText, 
        CheckCircle2, 
        Trash2, 
        BookOpen, 
        MessageSquare, 
        Loader2, 
        X,
        Sparkles,
        Plus,
        Info
    } from 'lucide-svelte';
    import { fade, slide } from 'svelte/transition';

    // State
    let activeTab = $state<'writing' | 'interview'>('writing');
    let styleName = $state('');
    let description = $state('');
    let trainingText = $state('');
    let isAnalyzing = $state(false);
    let isSaving = $state(false);
    let analyzedCharacteristics = $state<any>(null);
    let error = $state('');

    let writingStyles = $state<any[]>([]);
    let interviewStyles = $state<any[]>([]);
    let currentStyles = $derived(activeTab === 'writing' ? writingStyles : interviewStyles);

    let fileInput = $state<HTMLInputElement>();

    // Fetch Styles
    $effect(() => {
        const client = trpc($page);
        client.writingLearning.listStyles.query().then(res => writingStyles = res);
        client.interviewLearning.listStyles.query().then(res => interviewStyles = res);
    });

    function resetForm() {
        styleName = '';
        description = '';
        trainingText = '';
        analyzedCharacteristics = null;
        error = '';
    }

    async function handleFileUpload(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        isAnalyzing = true;
        error = '';
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadEndpoint = activeTab === 'writing'
                ? '/api/analysis/upload/extract' // Reusing the generic extract endpoint
                : '/api/analysis/upload/extract';

            const response = await fetch(uploadEndpoint, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('파일 업로드 실패');

            const data = await response.json();
            trainingText = data.text;

            await analyzeStyles();
        } catch (e: any) {
            console.error(e);
            error = "분석 중 오류가 발생했습니다.";
        } finally {
            isAnalyzing = false;
        }
    }

    async function analyzeStyles() {
        if (trainingText.length < 50) {
            error = "내용이 너무 짧습니다. 최소 50자 이상 입력해주세요.";
            return;
        }

        isAnalyzing = true;
        error = '';
        
        try {
            const client = trpc($page);
            let result;
            if (activeTab === 'writing') {
                result = await client.writingLearning.analyzePreview.mutate({ text: trainingText });
            } else {
                result = await client.interviewLearning.analyzePreview.mutate({ text: trainingText });
            }
            analyzedCharacteristics = result;
            if (result.suggested_name) styleName = result.suggested_name;
        } catch (e: any) {
            error = "스타일 분석에 실패했습니다.";
        } finally {
            isAnalyzing = false;
        }
    }

    async function handleSave() {
        if (!styleName.trim() || !trainingText.trim()) return;
        isSaving = true;

        try {
            const client = trpc($page);
            if (activeTab === 'writing') {
                await client.writingLearning.createStyle.mutate({
                    name: styleName,
                    description: description || undefined,
                    trainingText,
                });
                writingStyles = await client.writingLearning.listStyles.query();
            } else {
                await client.interviewLearning.createStyle.mutate({
                    name: styleName,
                    description: description || undefined,
                    trainingText,
                });
                interviewStyles = await client.interviewLearning.listStyles.query();
            }
            alert("스타일이 저장되었습니다!");
            resetForm();
        } catch (e) {
            error = "저장에 실패했습니다.";
        } finally {
            isSaving = false;
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            const client = trpc($page);
            if (activeTab === 'writing') {
                await client.writingLearning.deleteStyle.mutate(id);
                writingStyles = writingStyles.filter(s => s.id !== id);
            } else {
                await client.interviewLearning.deleteStyle.mutate(id);
                interviewStyles = interviewStyles.filter(s => s.id !== id);
            }
        } catch (e) {
            error = "삭제에 실패했습니다.";
        }
    }
</script>

<div class="container-px py-24 md:py-32 space-y-16">
    <!-- Header -->
    <div class="space-y-4">
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Sparkles class="w-10 h-10 text-purple-600" />
            스타일 학습 (Style Learning)
        </h1>
        <p class="text-lg text-gray-500 max-w-2xl">
            본인의 문체와 답변 방식을 AI에게 가르치세요. 나만의 고유한 스타일이 반영된 자소서와 면접 답변을 생성할 수 있습니다.
        </p>
    </div>

    <!-- Tab Selector -->
    <div class="flex p-1.5 bg-gray-100 rounded-2xl w-fit">
        <button 
            onclick={() => { activeTab = 'writing'; resetForm(); }}
            class="px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2
            {activeTab === 'writing' ? 'bg-white text-purple-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}"
        >
            <BookOpen class="w-4 h-4" />
            자소서 스타일
        </button>
        <button 
            onclick={() => { activeTab = 'interview'; resetForm(); }}
            class="px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2
            {activeTab === 'interview' ? 'bg-white text-purple-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}"
        >
            <MessageSquare class="w-4 h-4" />
            면접 답변 스타일
        </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <!-- Input & Analysis (Left) -->
        <div class="lg:col-span-7 space-y-8">
            <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div class="p-8 space-y-8">
                    <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                             <Upload class="w-6 h-6 text-purple-500" />
                             새 스타일 학습
                        </h2>
                        <button onclick={resetForm} class="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">
                            <X class="w-3 h-3" /> 초기화
                        </button>
                    </div>

                    {#if !analyzedCharacteristics}
                        <div class="space-y-6">
                            <button 
                                onclick={() => fileInput.click()}
                                class="w-full py-12 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-purple-50 hover:border-purple-200 transition-all group"
                            >
                                <input type="file" bind:this={fileInput} class="hidden" onchange={handleFileUpload} accept=".pdf,.docx,.doc,.txt" />
                                <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all shadow-sm">
                                    <FileText class="w-8 h-8 text-gray-400 group-hover:text-purple-500" />
                                </div>
                                <div class="text-center">
                                    <p class="font-bold text-gray-700">기존 작성 문서 업로드</p>
                                    <p class="text-xs text-gray-400 mt-1">본인이 쓴 자소서나 면접 대본을 선택하세요</p>
                                </div>
                            </button>

                            <div class="relative">
                                <div class="absolute inset-0 flex items-center"><span class="w-full border-t border-gray-100"></span></div>
                                <div class="relative flex justify-center text-xs uppercase"><span class="bg-white px-4 text-gray-400 font-black">OR</span></div>
                            </div>

                            <div class="space-y-3">
                                <label class="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Plus class="w-4 h-4 text-purple-500" />
                                    텍스트로 직접 입력
                                </label>
                                <textarea 
                                    bind:value={trainingText}
                                    rows="10"
                                    placeholder="학습시키고 싶은 글 내용을 이곳에 복사해 넣어보세요..."
                                    class="w-full p-6 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all font-medium text-sm leading-relaxed"
                                ></textarea>
                                <div class="flex justify-between items-center text-[11px] font-bold">
                                    <span class={trainingText.length < 100 ? 'text-amber-500' : 'text-purple-500'}>
                                        {trainingText.length}자 입력됨 (권장: 100자 이상)
                                    </span>
                                    <button 
                                        onclick={analyzeStyles}
                                        disabled={trainingText.length < 50 || isAnalyzing}
                                        class="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-black disabled:opacity-30 transition-all"
                                    >
                                        분석하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    {:else}
                        <div class="space-y-8" in:fade>
                            <div class="p-6 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-4">
                                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <CheckCircle2 class="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h4 class="font-bold text-purple-900">스타일 분석이 완료되었습니다! </h4>
                                    <p class="text-xs text-purple-700 mt-1">추출된 특징을 확인하고 저장해 주세요.</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div class="space-y-2">
                                    <label for="style-name-input" class="text-xs font-black text-gray-400 uppercase tracking-widest">스타일 이름</label>
                                    <input 
                                        id="style-name-input"
                                        type="text" 
                                        bind:value={styleName}
                                        class="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 font-bold"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label for="style-desc-input" class="text-xs font-black text-gray-400 uppercase tracking-widest">간단한 설명</label>
                                    <input 
                                        id="style-desc-input"
                                        type="text" 
                                        bind:value={description}
                                        placeholder="예: 현대자동차 지원용, 성격 강조형"
                                        class="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
                                    />
                                </div>
                            </div>

                            <div class="space-y-4">
                                <span class="text-xs font-black text-gray-400 uppercase tracking-widest">추출된 스타일 특징</span>
                                <div class="flex flex-wrap gap-2">
                                    {#if analyzedCharacteristics.tone}
                                        <span class="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 italic">
                                            #{analyzedCharacteristics.tone}
                                        </span>
                                    {/if}
                                    {#if analyzedCharacteristics.sentence_structure || analyzedCharacteristics.communication_style}
                                        <span class="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-100 italic">
                                            #{analyzedCharacteristics.sentence_structure || analyzedCharacteristics.communication_style}
                                        </span>
                                    {/if}
                                </div>
                            </div>

                            <div class="pt-4 flex gap-3">
                                <button 
                                    onclick={handleSave}
                                    disabled={isSaving}
                                    class="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-100 transition-all flex items-center justify-center gap-2"
                                >
                                    {#if isSaving}
                                        <Loader2 class="w-5 h-5 animate-spin" />
                                    {:else}
                                        <Sparkles class="w-5 h-5" />
                                    {/if}
                                    이 스타일 학습 및 저장
                                </button>
                                <button onclick={resetForm} class="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">
                                    취소
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Styles List (Right) -->
        <div class="lg:col-span-5 space-y-6">
             <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div class="p-8 space-y-6">
                    <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {#if activeTab === 'writing'}
                            <BookOpen class="w-6 h-6 text-purple-500" />
                        {:else}
                            <MessageSquare class="w-6 h-6 text-purple-500" />
                        {/if}
                        학습된 스타일 목록
                    </h2>

                    <div class="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {#if currentStyles.length === 0}
                            <div class="py-20 text-center space-y-3 opacity-40">
                                <Sparkles class="w-12 h-12 text-gray-300 mx-auto" />
                                <p class="text-sm font-bold">아직 학습된 스타일이 없습니다.</p>
                            </div>
                        {:else}
                            {#each currentStyles as style}
                                <div class="group bg-gray-50 p-5 rounded-2xl border border-transparent hover:border-purple-200 hover:bg-white transition-all">
                                    <div class="flex justify-between items-start">
                                        <div class="space-y-1">
                                            <h4 class="font-bold text-gray-900">{style.name}</h4>
                                            <p class="text-xs text-gray-500 leading-relaxed">{style.description || '설명 없음'}</p>
                                            <p class="text-[10px] text-gray-300 font-black pt-2 uppercase tracking-tighter">
                                                Learned on {new Date(style.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button 
                                            onclick={() => handleDelete(style.id)}
                                            class="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 class="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>

                    <div class="p-4 bg-gray-900 rounded-2xl flex items-start gap-3">
                        <Info class="w-4 h-4 text-purple-400 mt-0.5" />
                        <p class="text-[11px] text-gray-400 leading-relaxed">
                            <span class="text-white font-bold block mb-1">💡 학습 팁</span>
                            충분한 양의 텍스트(최소 한 페이지 분량)를 학습시킬수록 AI가 사용자의 페르소나를 더 정확하게 포착합니다.
                        </p>
                    </div>
                </div>
             </div>
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
