<script lang="ts">
	let {
		emoji,
		title,
		message,
		size = 'md',
		class: className = ''
	}: {
		emoji?: string;
		title?: string;
		message: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	} = $props();

	const sizeClasses = {
		sm: { emoji: 'text-3xl mb-2', title: 'text-lg mb-2', message: 'text-sm', padding: 'py-6' },
		md: { emoji: 'text-5xl mb-4', title: 'text-2xl mb-4', message: 'text-base', padding: 'py-12' },
		lg: { emoji: 'text-6xl mb-6', title: 'text-3xl mb-4', message: 'text-lg', padding: 'py-16' }
	};

	const classes = sizeClasses[size];
</script>

<div class="text-center {classes.padding} {className}">
	{#if emoji}
		<div class={classes.emoji}>{emoji}</div>
	{/if}
	{#if title}
		<h2 class="font-black {classes.title}">{title}</h2>
	{/if}
	<p class="opacity-60 {classes.message}">{message}</p>
</div>
