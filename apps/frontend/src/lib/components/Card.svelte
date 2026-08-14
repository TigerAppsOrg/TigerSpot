<script lang="ts">
	import type { Snippet } from 'svelte';

	type CardVariant = 'default' | 'cyan' | 'magenta' | 'lime' | 'orange';

	interface Props {
		variant?: CardVariant;
		hoverable?: boolean;
		class?: string;
		children: Snippet;
	}

	let { variant = 'default', hoverable = false, class: className = '', children }: Props = $props();

	const variantStyles: Record<CardVariant, { bg: string; text: string }> = {
		default: { bg: 'var(--color-white)', text: 'var(--color-black)' },
		cyan: { bg: 'var(--color-cyan)', text: 'var(--color-black)' },
		magenta: { bg: 'var(--color-magenta)', text: 'var(--color-white)' },
		lime: { bg: 'var(--color-lime)', text: 'var(--color-black)' },
		orange: { bg: 'var(--color-orange)', text: 'var(--color-black)' }
	};

	const style = $derived(variantStyles[variant]);
</script>

<div
	class="card-brutal {hoverable ? 'card-brutal-hover cursor-pointer' : ''} {className}"
	style="background-color: {style.bg}; color: {style.text};"
>
	{@render children()}
</div>
