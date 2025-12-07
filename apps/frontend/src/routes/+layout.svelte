<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import { currentTheme } from '$lib/stores/theme';
	import { userStore } from '$lib/stores/user.svelte';

	let { children } = $props();

	onMount(async () => {
		currentTheme.initialize();
		// Load user on app init
		await userStore.load();
	});
</script>

{@render children()}
