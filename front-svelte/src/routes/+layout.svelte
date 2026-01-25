<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc';
	import { goto } from '$app/navigation';
	
	let { children, data } = $props();

	async function logout() {
		try {
            await trpc($page).auth.logout.mutate();
            // Force reload to clear server-side state/cookies cleanly
            window.location.href = '/';
        } catch (e) {
            console.error(e);
        }
	}
</script>

<div class="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
	<nav class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<a href="/" class="text-xl font-bold text-indigo-600 tracking-tight">JasoS</a>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a href="/" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Home</a>
						{#if data.user}
							<a href="/dashboard" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Dashboard</a>
                            <a href="/writing" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">자기소개서</a>
                            <a href="/interview" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">면접 준비</a>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-4">
					{#if data.user}
						<span class="text-sm text-gray-700 font-medium">{data.user.name || data.user.username}</span>
						<button onclick={logout} class="text-sm font-medium text-red-600 hover:text-red-800 transition-colors">Logout</button>
					{:else}
						<a href="/login" class="text-sm font-medium text-gray-500 hover:text-gray-900">Login</a>
						<a href="/register" class="text-sm font-medium text-indigo-600 hover:text-indigo-800">Register</a>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<main class="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>
    
    <footer class="bg-white border-t border-gray-200 py-8 mt-auto">
        <div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
            &copy; 2026 JasoS. Built with Svelte 5 & SvelteKit.
        </div>
    </footer>
</div>
