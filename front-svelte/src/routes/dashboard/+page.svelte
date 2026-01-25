<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { fade } from 'svelte/transition';

    let { data } = $props();
    let experiences = $state<any[]>([]);
    let corporates = $state<any[]>([]);
    let recentHistory = $state<any[]>([]);
    let loading = $state(true);

    $effect(() => {
        const client = trpc($page);
        
        // Parallel data fetching
        Promise.all([
            client.experiences.list.query().catch(e => { console.error(e); return []; }),
            client.corporate.list.query().catch(e => { console.error(e); return []; }),
            client.writing.getHistory.query().catch(e => { console.error(e); return []; })
        ]).then(([expRes, corpRes, historyRes]) => {
            experiences = expRes;
            corporates = corpRes;
            recentHistory = historyRes.slice(0, 5); // Latest 5 items
            loading = false;
        });
    });
</script>

<div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p class="mt-1 text-sm text-gray-500">
                안녕하세요, <span class="font-semibold text-indigo-600">{data.user?.name || data.user?.username}</span>님. 취업 준비 현황입니다.
            </p>
        </div>
        <div class="flex space-x-3">
            <a href="/dashboard/experience/new" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                새 경험 추가
            </a>
            <a href="/dashboard/corporate/new" class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                기업 분석
            </a>
        </div>
    </header>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
            <div class="px-4 py-5 sm:p-6">
                <dt class="text-sm font-medium text-gray-500 truncate">총 정리된 경험</dt>
                <dd class="mt-1 text-3xl font-semibold text-gray-900">{experiences.length}</dd>
            </div>
        </div>
        <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
            <div class="px-4 py-5 sm:p-6">
                <dt class="text-sm font-medium text-gray-500 truncate">분석한 기업</dt>
                <dd class="mt-1 text-3xl font-semibold text-gray-900">{corporates.length}</dd>
            </div>
        </div>
        <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
            <div class="px-4 py-5 sm:p-6">
                <dt class="text-sm font-medium text-gray-500 truncate">생성한 자소서</dt>
                <dd class="mt-1 text-3xl font-semibold text-gray-900">{recentHistory.length}</dd>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Recent Experiences -->
        <section class="space-y-4">
            <div class="flex justify-between items-center">
                <h2 class="text-lg font-medium text-gray-900">최근 정리한 경험 (STAR)</h2>
                <a href="/dashboard/experience" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">전체보기</a>
            </div>
            
            <div class="bg-white shadow overflow-hidden sm:rounded-md border border-gray-100">
                <ul role="list" class="divide-y divide-gray-200">
                    {#if loading}
                        <li class="px-4 py-4 sm:px-6 text-center text-gray-500">Loading...</li>
                    {:else if experiences.length === 0}
                        <li class="px-4 py-12 text-center">
                            <p class="text-gray-500 mb-2">아직 정리된 경험이 없습니다.</p>
                            <a href="/dashboard/experience/new" class="text-indigo-600 hover:text-indigo-500 font-medium text-sm">첫 경험을 기록해보세요 &rarr;</a>
                        </li>
                    {:else}
                        {#each experiences.slice(0, 3) as exp}
                            <li>
                                <div class="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors cursor-pointer">
                                    <div class="flex items-center justify-between">
                                        <p class="text-sm font-medium text-indigo-600 truncate">{exp.title}</p>
                                        <div class="ml-2 flex-shrink-0 flex">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {exp.category || '기타'}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="mt-2 sm:flex sm:justify-between">
                                        <div class="sm:flex">
                                            <p class="flex items-center text-sm text-gray-500">
                                                {exp.analysisType}
                                            </p>
                                        </div>
                                        <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            <p>
                                                {new Date(exp.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        {/each}
                    {/if}
                </ul>
            </div>
        </section>

        <!-- Recent Writing History -->
        <section class="space-y-4">
            <div class="flex justify-between items-center">
                <h2 class="text-lg font-medium text-gray-900">최근 생성 내역</h2>
                <a href="/writing" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">새로 만들기</a>
            </div>
            
            <div class="bg-white shadow overflow-hidden sm:rounded-md border border-gray-100">
                <ul role="list" class="divide-y divide-gray-200">
                    {#if loading}
                         <li class="px-4 py-4 sm:px-6 text-center text-gray-500">Loading...</li>
                    {:else if recentHistory.length === 0}
                        <li class="px-4 py-12 text-center">
                            <p class="text-gray-500 mb-2">생성된 자소서가 없습니다.</p>
                            <a href="/writing" class="text-indigo-600 hover:text-indigo-500 font-medium text-sm">지금 작성하러 가기 &rarr;</a>
                        </li>
                    {:else}
                        {#each recentHistory as history}
                            <li>
                                <div class="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                                    <div class="flex items-center justify-between">
                                        <p class="text-sm font-medium text-gray-900 truncate max-w-xs">{history.prompt}</p>
                                        <p class="text-sm text-gray-500">{new Date(history.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <p class="mt-2 text-sm text-gray-500 line-clamp-2">
                                        {history.generatedText}
                                    </p>
                                </div>
                            </li>
                        {/each}
                    {/if}
                </ul>
            </div>
        </section>
    </div>
</div>
