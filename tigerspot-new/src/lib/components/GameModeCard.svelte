<script lang="ts">
	import Card from './Card.svelte';

	type CardVariant = 'cyan' | 'magenta' | 'lime' | 'orange';

	let {
		href,
		variant,
		emoji,
		title,
		description,
		stat,
		cta = 'Play',
		class: className = ''
	}: {
		href: string;
		variant: CardVariant;
		emoji: string;
		title: string;
		description: string;
		stat: string;
		cta?: string;
		class?: string;
	} = $props();
</script>

<a {href} class="block group {className}">
	<Card {variant} hoverable class="h-full">
		<div class="flex flex-col h-full">
			<div class="text-5xl mb-6">{emoji}</div>
			<h3 class="text-2xl font-black mb-4">{title}</h3>
			<p class="opacity-80 mb-6 grow leading-relaxed">
				{description}
			</p>
			<div class="flex items-center justify-between">
				<span
					class="brutal-border brutal-shadow-sm bg-white text-black px-4 py-2 text-sm font-bold"
				>
					{stat}
				</span>
				<span class="font-bold uppercase text-sm group-hover:translate-x-2 transition-transform">
					{cta} →
				</span>
			</div>
		</div>
	</Card>
</a>
