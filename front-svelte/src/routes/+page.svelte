<script lang="ts">
    let { data } = $props();
</script>

<div class="flex flex-col items-center justify-center py-20 text-center space-y-8">
    <div class="space-y-4 max-w-3xl">
        <h1 class="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            AI-Powered Career Assistant
            <span class="block text-indigo-600 mt-2">Built with Svelte 5</span>
        </h1>
        <p class="text-xl text-gray-500 max-w-2xl mx-auto">
            자기소개서 작성부터 면접 준비까지. <br/>
            최신 AI 기술과 개인화된 분석으로 당신의 취업 성공을 돕습니다.
        </p>
    </div>

    {#if !data.user}
        <div class="flex space-x-4">
            <a href="/register" class="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl transition-all">
                Get Started
            </a>
            <a href="/login" class="px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10">
                Log In
            </a>
        </div>
    {:else}
        <div class="p-6 bg-white rounded-xl shadow-md border border-gray-100 max-w-sm w-full">
            <h3 class="text-lg font-medium text-gray-900">Welcome Back!</h3>
            <p class="text-gray-500 mt-2 mb-4">You are logged in as <span class="font-semibold text-indigo-600">{data.user.username}</span></p>
            <a href="/dashboard" class="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Go to Dashboard
            </a>
        </div>
    {/if}
</div>
