<script lang="ts">
	let count = $state(0);
	const double = $derived(count * 2);

	function increment() {
		count += 1;
	}
</script>

<div class="p-10 space-y-4">
	<h1 class="text-3xl font-bold text-blue-600">Welcome to Svelte 5 + Tailwind v4</h1>
	
	<p>Count: {count}</p>
	<p>Double: {double}</p>
	
	<button 
		onclick={increment}
		class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
	>
		Increment
	</button>
</div>
