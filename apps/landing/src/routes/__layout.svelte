<script lang="ts">
	import { onMount } from 'svelte';
	import { loadUIComponents } from 'ui';
	import 'tailwind/style.css';

	onMount(() => {
		loadUIComponents();
	});
</script>

<svelte:head>
	{#if import.meta.env.VITE_BUILD_ENV === 'PRODUCTION'}
		<script
			async
			defer
			data-domain="bkkelection2022.wevis.info"
			src="https://analytics.punchup.world/js/plausible.js"></script>
	{/if}
</svelte:head>

<div>
	<ui-navbar />
	<slot />
	
	<footer class="bg-black text-white flex justify-center">
		<p class="font-body text-[12px] leading-[1.25] w-full max-w-screen-xl m-6 md:m-8 text-center text-white/80">
			© 2026 กรุงเทพมหานคร | พัฒนาต่อยอดจากโครงการ
			<a
				href="https://bkkelection2022.wevis.info/"
				target="_blank"
				rel="noreferrer"
				class="underline">Bangkok Election 2022</a>
			โดย WeVis x THE STANDARD x Wisesight ภายใต้สัญญาอนุญาต CC BY-NC-SA 4.0
		</p>
	</footer>
</div>
