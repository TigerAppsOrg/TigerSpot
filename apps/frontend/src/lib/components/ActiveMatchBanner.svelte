<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	let {
		opponent,
		context,
		onPlay,
		class: className = ''
	}: {
		opponent: string;
		context?: string;
		onPlay: () => void;
		class?: string;
	} = $props();
</script>

<Card variant="orange" class="py-6 {className}">
	<div class="flex flex-col md:flex-row items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			<Icon name="swords" class="text-4xl" />
			<div>
				<div class="font-black text-lg">Your Match is Ready!</div>
				<div class="text-sm opacity-80">
					vs <span class="font-bold">{opponent}</span>
					{#if context}
						in {context}
					{/if}
				</div>
			</div>
		</div>
		<Button variant="black" onclick={onPlay}>Play Now</Button>
	</div>
</Card>
