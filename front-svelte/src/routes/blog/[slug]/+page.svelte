<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { Calendar, User, ChevronLeft, Tag } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    let post = $state<any>(null);
    let isLoading = $state(true);

    $effect(() => {
        const slug = $page.params.slug;
        trpc($page).content.getBySlug.query(slug)
            .then(res => post = res)
            .finally(() => isLoading = false);
    });
</script>

<div class="min-h-screen bg-white">
    <!-- Top Navigation -->
    <div class="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <div class="max-w-4xl mx-auto px-4 h-16 flex items-center">
            <a href="/blog" class="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                <ChevronLeft class="w-4 h-4" />
                목록으로 돌아가기
            </a>
        </div>
    </div>

    {#if isLoading}
        <div class="max-w-3xl mx-auto px-4 py-20 space-y-8 animate-pulse">
            <div class="space-y-4">
                <div class="h-4 bg-gray-100 rounded w-24"></div>
                <div class="h-12 bg-gray-100 rounded w-full"></div>
                <div class="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
            <div class="space-y-4 pt-12">
                <div class="h-4 bg-gray-100 rounded w-full"></div>
                <div class="h-4 bg-gray-100 rounded w-5/6"></div>
                <div class="h-4 bg-gray-100 rounded w-4/6"></div>
            </div>
        </div>
    {:else if !post}
        <div class="max-w-3xl mx-auto px-4 py-32 text-center" in:fade>
            <h1 class="text-2xl font-bold text-gray-900 mb-4">포스트를 찾을 수 없습니다.</h1>
            <p class="text-gray-500 mb-8">URL이 정확한지 확인해 주세요.</p>
            <a href="/blog" class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                블로그 목록으로 이동
            </a>
        </div>
    {:else}
        <article class="max-w-3xl mx-auto px-4 py-12 md:py-20" in:fade>
            <!-- Article Header -->
            <header class="mb-12 border-b border-gray-100 pb-12">
                <div class="flex flex-wrap gap-2 mb-6">
                    {#each post.frontmatter.tags || [] as tag}
                        <span class="flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-100">
                            <Tag class="w-3 h-3" />
                            {tag}
                        </span>
                    {/each}
                </div>

                <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-8 leading-[1.15]">
                    {post.frontmatter.title}
                </h1>

                <div class="flex items-center gap-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {#if post.frontmatter.author}
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <User class="w-4 h-4" />
                            </div>
                            <span>{post.frontmatter.author}</span>
                        </div>
                    {/if}
                    {#if post.frontmatter.date}
                        <div class="flex items-center gap-2">
                            <Calendar class="w-4 h-4" />
                            <span>{new Date(post.frontmatter.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    {/if}
                </div>
            </header>

            <!-- Article Content -->
            <div class="prose prose-indigo prose-lg max-w-none 
                        prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-gray-900
                        prose-p:text-gray-700 prose-p:leading-relaxed 
                        prose-li:text-gray-700
                        prose-blockquote:border-indigo-600 prose-blockquote:bg-indigo-50/50 prose-blockquote:p-6 prose-blockquote:rounded-xl prose-blockquote:not-italic prose-blockquote:font-medium
                        prose-img:rounded-3xl prose-img:shadow-2xl">
                {#each post.content.split('\n') as line}
                    {#if line.startsWith('# ')}
                        <h1 class="text-3xl font-bold mt-12 mb-6">{line.substring(2)}</h1>
                    {:else if line.startsWith('## ')}
                        <h2 class="text-2xl font-bold mt-10 mb-5 border-b border-gray-100 pb-2">{line.substring(3)}</h2>
                    {:else if line.startsWith('### ')}
                        <h3 class="text-xl font-bold mt-8 mb-4">{line.substring(4)}</h3>
                    {:else if line.startsWith('> ')}
                        <blockquote class="my-8">{line.substring(2)}</blockquote>
                    {:else if line.startsWith('- ')}
                        <li class="ml-4">{line.substring(2)}</li>
                    {:else if line.trim() === ''}
                        <br />
                    {:else}
                        <p class="mb-4">{line}</p>
                    {/if}
                {/each}
            </div>
        </article>
    {/if}
</div>
