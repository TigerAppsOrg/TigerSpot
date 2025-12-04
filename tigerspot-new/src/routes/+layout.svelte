<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import { currentTheme } from '$lib/stores/theme';

	let { children } = $props();

	onMount(() => {
		currentTheme.initialize();
	});
</script>

{@render children()}
