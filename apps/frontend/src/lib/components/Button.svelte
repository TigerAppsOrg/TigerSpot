<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'cyan' | 'magenta' | 'lime' | 'orange' | 'white' | 'black';
	type ButtonSize = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		href?: string;
		disabled?: boolean;
		onclick?: () => void;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'cyan',
		size = 'md',
		href,
		disabled = false,
		onclick,
		class: className = '',
		children
	}: Props = $props();

	const sizeClasses: Record<ButtonSize, string> = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-6 py-3 text-base',
		lg: 'px-8 py-4 text-lg'
	};

	const baseClasses = $derived(
		`btn-brutal btn-${variant} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
	);
</script>

{#if href && !disabled}
	<a {href} class={baseClasses}>
		{@render children()}
	</a>
{:else}
	<button class={baseClasses} {disabled} {onclick}>
		{@render children()}
	</button>
{/if}
