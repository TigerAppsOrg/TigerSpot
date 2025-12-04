<script lang="ts">
	import type { Snippet } from 'svelte';

	type CardVariant = 'default' | 'cyan' | 'magenta' | 'lime' | 'orange';

	interface Props {
		variant?: CardVariant;
		hoverable?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'default',
		hoverable = false,
		class: className = '',
		children
	}: Props = $props();

	const variantStyles: Record<CardVariant, { bg: string; text: string }> = {
		default: { bg: '#FFFFFF', text: '#000000' },
		cyan: { bg: '#00FFFF', text: '#000000' },
		magenta: { bg: '#FF00FF', text: '#FFFFFF' },
		lime: { bg: '#BFFF00', text: '#000000' },
		orange: { bg: '#FF6600', text: '#FFFFFF' }
	};

	const style = $derived(variantStyles[variant]);
</script>

<div
	class="card-brutal {hoverable ? 'card-brutal-hover cursor-pointer' : ''} {className}"
	style="background-color: {style.bg}; color: {style.text};"
>
	{@render children()}
</div>
