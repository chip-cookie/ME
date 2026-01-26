<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { Calendar, User, ArrowRight, Rss } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    let posts = $state<any[]>([]);
    let isLoading = $state(true);

    $effect(() => {
        trpc($page).content.list.query()
            .then(res => posts = res)
            .finally(() => isLoading = false);
    });
</script>

<div class="min-h-screen bg-gray-50/50">
    <div class="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <!-- Header Section -->
        <header class="mb-12 text-center md:text-left" in:fade>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
                <Rss class="w-3.5 h-3.5" />
                Blog & News
            </div>
            <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                JasoS <span class="text-indigo-600">Insights</span>
            </h1>
            <p class="text-lg text-gray-500 max-w-2xl">
                JasoS 사용법, 취업 시장 트렌드, 그리고 여러분의 성공적인 취업을 위한 팁을 공유합니다.
            </p>
        </header>

        {#if isLoading}
            <div class="space-y-6">
                {#each Array(3) as _}
                    <div class="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm animate-pulse">
                        <div class="h-6 bg-gray-100 rounded-full w-3/4 mb-4"></div>
                        <div class="h-4 bg-gray-100 rounded-full w-1/2"></div>
                    </div>
                {/each}
            </div>
        {:else if posts.length === 0}
            <div class="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm" in:fade>
                <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Rss class="w-8 h-8" />
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-1">아직 작성된 글이 없습니다.</h3>
                <p class="text-gray-500">조금만 기다려 주세요! 곧 유익한 콘텐츠로 찾아올게요.</p>
            </div>
        {:else}
            <div class="grid gap-6">
                {#each posts as post, i}
                    <a 
                        href="/blog/{post.slug}"
                        class="group block bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                        in:fly={{ y: 20, delay: i * 50 }}
                    >
                        <!-- Background Accent -->
                        <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

                        <div class="relative z-10">
                            <div class="flex flex-wrap gap-2 mb-4">
                                {#each post.frontmatter.tags || [] as tag}
                                    <span class="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-100">
                                        {tag}
                                    </span>
                                {/each}
                                {#if post.frontmatter.featured}
                                    <span class="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold uppercase tracking-widest">
                                        추천
                                    </span>
                                {/if}
                            </div>

                            <div class="flex justify-between items-start gap-4">
                                <h2 class="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-3 leading-tight">
                                    {post.frontmatter.title}
                                </h2>
                                <ArrowRight class="w-6 h-6 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </div>

                            {#if post.frontmatter.description}
                                <p class="text-gray-500 mb-6 line-clamp-2 leading-relaxed">
                                    {post.frontmatter.description}
                                </p>
                            {/if}

                            <div class="flex items-center gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {#if post.frontmatter.author}
                                    <span class="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                        <User class="w-3.5 h-3.5" />
                                        {post.frontmatter.author}
                                    </span>
                                {/if}
                                {#if post.frontmatter.date}
                                    <span class="flex items-center gap-1.5">
                                        <Calendar class="w-3.5 h-3.5" />
                                        {new Date(post.frontmatter.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
