<script lang="ts">
	import { onMount } from 'svelte';
	import { loadAnalyticsWithConsent, loadUIComponents } from 'ui';
	import 'tailwind/style.css';

	onMount(() => {
		loadUIComponents();
		return loadAnalyticsWithConsent(import.meta.env.VITE_BUILD_ENV);
	});
</script>

<div class="min-h-screen flex flex-col">
	<ui-navbar></ui-navbar>
	<main class="flex-1">
		<slot />
	</main>

	<footer class="bg-black text-white flex justify-center">
		<p class="font-body text-[12px] leading-[1.25] w-full max-w-screen-xl m-6 md:m-8 text-center text-white/80">
			© 2026 กรุงเทพมหานคร | พัฒนาต่อยอดจากโครงการ
			<a
				href="https://bkkelection2022.wevis.info/"
				target="_blank"
				rel="noreferrer"
				class="underline">Bangkok Election 2022</a>
			โดย WeVis ภายใต้สัญญาอนุญาต CC BY-NC-SA 4.0
		</p>
	</footer>
</div>
