<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-dots">
	<Card variant="magenta" class="text-center max-w-md w-full">
		<div class="text-8xl font-black mb-4">{$page.status}</div>
		<p class="text-xl mb-8">{$page.error?.message || 'Something went wrong'}</p>
		<Button href="/menu" variant="cyan" size="lg">Back to Menu</Button>
	</Card>
</div>
