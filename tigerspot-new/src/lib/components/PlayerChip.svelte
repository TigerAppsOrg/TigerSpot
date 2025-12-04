<script lang="ts">
	type Variant = 'white' | 'cyan';

	let {
		username,
		isCurrentUser = false,
		variant = 'white',
		clickable = false,
		onclick,
		class: className = ''
	}: {
		username: string;
		isCurrentUser?: boolean;
		variant?: Variant;
		clickable?: boolean;
		onclick?: () => void;
		class?: string;
	} = $props();

	const baseClasses = 'brutal-border px-4 py-2 font-bold';
	const variantClasses = {
		white: 'bg-white text-black',
		cyan: 'bg-cyan text-white'
	};
	const interactiveClasses = clickable
		? 'hover:bg-cyan hover:text-white transition-all hover:scale-105 cursor-pointer'
		: '';
	const currentUserVariant = isCurrentUser ? 'bg-cyan text-white' : variantClasses[variant];
</script>

{#if clickable && onclick}
	<button
		{onclick}
		class="{baseClasses} {currentUserVariant} {interactiveClasses} {className}"
		type="button"
	>
		{username}
		{#if isCurrentUser}
			<span class="text-xs">(you)</span>
		{/if}
	</button>
{:else}
	<span class="{baseClasses} {currentUserVariant} {className}">
		{username}
		{#if isCurrentUser}
			<span class="text-xs">(you)</span>
		{/if}
	</span>
{/if}
