<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { 
        Plus, FileText, Trash2, ChevronRight, Upload, 
        Briefcase, Heart, Cpu, FileBox, Loader2, CheckCircle2 
    } from 'lucide-svelte';
    import { fade, fly, slide } from 'svelte/transition';

    let experiences = $state<any[]>([]);
    let isLoading = $state(true);
    let selectedExperience = $state<any>(null);
    let showAddForm = $state(false);
    let isAnalyzing = $state(false);

    // Form Stats
    let newTitle = $state('');
    let newContent = $state('');
    let analysisType = $state<'competency' | 'value' | 'pdf' | 'cover_letter'>('competency');

    const trpcService = trpc($page);

    $effect(() => {
        loadExperiences();
    });

    async function loadExperiences() {
        try {
            experiences = await trpcService.experiences.list.query();
        } catch (e) {
            console.error(e);
        } finally {
            isLoading = false;
        }
    }

    async function handleCreate() {
        if (!newTitle.trim() || !newContent.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        isAnalyzing = true;
        try {
            await trpcService.experiences.create.mutate({
                title: newTitle,
                content: newContent,
                analysisType
            });
            newTitle = '';
            newContent = '';
            showAddForm = false;
            loadExperiences();
        } catch (e) {
            alert('저장 및 분석 중 오류가 발생했습니다.');
        } finally {
            isAnalyzing = false;
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('경험을 삭제하시겠습니까?')) return;
        try {
            await trpcService.experiences.delete.mutate(id);
            if (selectedExperience?.id === id) selectedExperience = null;
            loadExperiences();
        } catch (e) {
            alert('삭제 실패');
        }
    }

    async function handleFileUpload(e: any) {
        const file = e.target.files?.[0];
        if (!file) return;

        isAnalyzing = true;
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Using the same endpoint as React version
            const response = await fetch('http://localhost:8000/api/writing/style/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('추출 실패');
            const data = await response.json();
            newContent = data.text;
            if (!newTitle) newTitle = file.name.split('.')[0];
        } catch (error) {
            alert('파일 처리 중 오류가 발생했습니다.');
        } finally {
            isAnalyzing = false;
        }
    }

    const typeMeta = {
        competency: { name: '역량 분석', icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        value: { name: '가치관 분석', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
        pdf: { name: 'PDF 추출', icon: FileBox, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        cover_letter: { name: '기존 자소서', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' }
    };

    const analysisSections = [
        { key: 'situation', label: '문제 상황', color: 'border-l-rose-400 bg-rose-50/30' },
        { key: 'action', label: '해결 방법', color: 'border-l-amber-400 bg-amber-50/30' },
        { key: 'result', label: '구체적 결과', color: 'border-l-emerald-400 bg-emerald-50/30' },
        { key: 'achievement', label: '주요 성과', color: 'border-l-blue-400 bg-blue-50/30' },
        { key: 'lesson', label: '배운 점', color: 'border-l-indigo-400 bg-indigo-50/30' },
        { key: 'core_value', label: '핵심 가치', color: 'border-l-purple-400 bg-purple-50/30' }
    ];
</script>

<div class="min-h-screen bg-[#f8f9fb]">
    <div class="container-px py-24 md:py-32">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Sidebar: Experience List (lg:col-span-3) -->
            <aside class="lg:col-span-3 space-y-6 sticky top-32">
                <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-[calc(100vh-200px)] flex flex-col">
                    <div class="flex items-center justify-between mb-8 px-2">
                        <h2 class="text-sm font-black text-gray-900 uppercase tracking-widest">Experience Hub</h2>
                        <span class="text-[10px] font-bold text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full">{experiences.length} total</span>
                    </div>

                    <button 
                        onclick={() => { showAddForm = true; selectedExperience = null; }}
                        class="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 mb-6 shadow-xl shadow-gray-200"
                    >
                        <Plus class="w-4 h-4" />
                        ADD EXPERIENCE
                    </button>

                    <div class="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {#if isLoading}
                            {#each Array(4) as _}
                                <div class="h-20 bg-gray-50 rounded-2xl animate-pulse"></div>
                            {/each}
                        {:else}
                            {#each experiences as exp}
                                <button 
                                    class="w-full p-4 rounded-2xl text-left transition-all border
                                           {selectedExperience?.id === exp.id 
                                             ? 'bg-indigo-50 border-indigo-200 shadow-md translate-x-1' 
                                             : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'}"
                                    onclick={() => { selectedExperience = exp; showAddForm = false; }}
                                >
                                    <div class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">{exp.category || 'General'}</div>
                                    <h3 class="text-sm font-black text-gray-900 truncate">{exp.title}</h3>
                                    <p class="text-[11px] text-gray-400 line-clamp-1 mt-1 font-medium">{exp.content.substring(0, 50)}</p>
                                </button>
                            {/each}
                        {/if}
                    </div>
                </div>
            </aside>

            <!-- Main Content Area (lg:col-span-9) -->
            <main class="lg:col-span-9">
                {#if showAddForm}
                    <div class="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100" in:fly={{ y: 10 }}>
                        <h2 class="text-2xl font-black text-gray-900 mb-8 tracking-tight">New Experience Entry</h2>
                        
                        <!-- Analysis Method Selection -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                            {#each Object.entries(typeMeta) as [type, meta]}
                                <button 
                                    class="p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3
                                           {analysisType === type 
                                             ? 'border-indigo-600 ' + meta.bg 
                                             : 'border-gray-50 hover:border-indigo-100 bg-gray-50/50'}"
                                    onclick={() => analysisType = type as any}
                                >
                                    <meta.icon class="w-6 h-6 {analysisType === type ? meta.color : 'text-gray-300'}" />
                                    <span class="text-[10px] font-black uppercase tracking-widest {analysisType === type ? 'text-gray-900' : 'text-gray-400'}">{meta.name}</span>
                                </button>
                            {/each}
                        </div>

                        <div class="space-y-6">
                            {#if analysisType === 'pdf'}
                                <div class="p-8 bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[2rem] text-center group cursor-pointer relative overflow-hidden">
                                    <input type="file" onchange={handleFileUpload} class="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    <div class="relative z-0 space-y-3">
                                        <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-sm transition-transform group-hover:scale-110">
                                            <Upload class="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p class="text-sm font-black text-indigo-600 uppercase tracking-widest">Click to Upload File</p>
                                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">PDF, DOCX, HWP Supported</p>
                                        </div>
                                    </div>
                                </div>
                            {/if}

                            <div>
                                <label for="title" class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject Title</label>
                                <input 
                                    id="title" 
                                    bind:value={newTitle}
                                    placeholder="예: 2025 서비스 기획 인턴 프로젝트"
                                    class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium" 
                                />
                            </div>

                            <div>
                                <label for="content" class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Content Narrative ({newContent.length} chars)</label>
                                <textarea 
                                    id="content" 
                                    bind:value={newContent}
                                    placeholder="상황, 역할, 행동, 성과 위주로 자유롭게 적어주세요. (최소 50자)"
                                    class="w-full h-64 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium resize-none"
                                ></textarea>
                            </div>

                            <div class="flex gap-4 pt-4">
                                <button 
                                    onclick={() => showAddForm = false}
                                    class="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onclick={handleCreate}
                                    disabled={isAnalyzing}
                                    class="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    {#if isAnalyzing}
                                        <Loader2 class="w-4 h-4 animate-spin text-white/50" />
                                        Processing AI Analysis...
                                    {:else}
                                        Save & Run Intelligence
                                    {/if}
                                </button>
                            </div>
                        </div>
                    </div>
                {:else if selectedExperience}
                    <div in:fade class="space-y-8 pb-20">
                        <!-- Top Header -->
                        <div class="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div class="flex items-center gap-6">
                                <div class="w-16 h-16 rounded-[1.5rem] bg-gray-900 text-white flex items-center justify-center shadow-lg">
                                    <Briefcase class="w-8 h-8" />
                                </div>
                                <div>
                                    <div class="flex items-center gap-3 mb-1">
                                        <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded">{selectedExperience.category || 'General'}</span>
                                        <span class="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{new Date(selectedExperience.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h1 class="text-2xl font-black text-gray-900 tracking-tight">{selectedExperience.title}</h1>
                                </div>
                            </div>
                            <button 
                                onclick={() => handleDelete(selectedExperience.id)}
                                class="p-4 text-gray-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                            >
                                <Trash2 class="w-5 h-5" />
                            </button>
                        </div>

                        <!-- Original Content Section -->
                        <div class="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
                            <h3 class="text-xs font-black text-gray-300 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Raw Narrative</h3>
                            <p class="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedExperience.content}</p>
                        </div>

                        <!-- AI Analysis Report -->
                        <div class="space-y-4">
                            <h3 class="text-xs font-black text-gray-300 uppercase tracking-widest px-4 mb-6">AI Structured Report (STAR)</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {#each analysisSections as section}
                                    <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm border-l-4 {section.color} group hover:shadow-md transition-shadow">
                                        <div class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 group-hover:text-indigo-400 transition-colors">{section.label}</div>
                                        <p class="text-sm font-medium text-gray-700 leading-relaxed">
                                            {selectedExperience.analysis ? selectedExperience.analysis[section.key] : '분석 데이터가 존재하지 않습니다.'}
                                        </p>
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <!-- Quick Action -->
                        <div class="p-1 text-center">
                            <a 
                                href="/writing?exp={selectedExperience.id}"
                                class="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:gap-4 transition-all"
                            >
                                Use this experience for cover letter writing <ChevronRight class="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                {:else}
                    <!-- Empty State -->
                    <div class="h-[700px] bg-white rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-12" in:fade>
                        <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-300">
                            <Plus class="w-12 h-12" />
                        </div>
                        <h4 class="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Select or Create</h4>
                        <p class="text-gray-400 font-medium max-w-xs leading-relaxed">
                            관리할 경험 로그를 선택하거나 <br />
                            상단의 추가 버튼을 눌러 새로운 이력을 분석하세요.
                        </p>
                    </div>
                {/if}
            </main>
        </div>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 10px;
    }
</style>
