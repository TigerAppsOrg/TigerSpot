<script lang="ts">
	import { formatDistance } from '$lib/utils/distance';

	type Size = 'sm' | 'md' | 'lg';

	let {
		player1Name,
		player1Score,
		player1Distance,
		player2Name,
		player2Score,
		player2Distance,
		highlightWinner = false,
		size = 'md',
		class: className = ''
	}: {
		player1Name: string;
		player1Score: number;
		player1Distance?: number;
		player2Name: string;
		player2Score: number;
		player2Distance?: number;
		highlightWinner?: boolean;
		size?: Size;
		class?: string;
	} = $props();

	const player1Won = player1Score > player2Score;
	const player2Won = player2Score > player1Score;

	const sizeClasses = {
		sm: { score: 'text-xl', label: 'text-xs' },
		md: { score: 'text-2xl', label: 'text-xs' },
		lg: { score: 'text-4xl', label: 'text-xs' }
	};

	const classes = sizeClasses[size];
</script>

<div class="grid grid-cols-2 gap-4 {className}">
	<!-- Player 1 -->
	<div class="brutal-border p-3 {highlightWinner && player1Won ? 'bg-lime/20' : 'bg-white'}">
		<div class="font-bold uppercase opacity-60 mb-1 {classes.label}">{player1Name}</div>
		<div class="font-black mb-1 {classes.score}">{player1Score.toLocaleString()}</div>
		{#if player1Distance !== undefined}
			<div class="text-xs opacity-60">{formatDistance(player1Distance)}</div>
		{/if}
	</div>

	<!-- Player 2 -->
	<div class="brutal-border p-3 {highlightWinner && player2Won ? 'bg-magenta/20' : 'bg-white'}">
		<div class="font-bold uppercase opacity-60 mb-1 {classes.label}">{player2Name}</div>
		<div class="font-black mb-1 {classes.score}">{player2Score.toLocaleString()}</div>
		{#if player2Distance !== undefined}
			<div class="text-xs opacity-60">{formatDistance(player2Distance)}</div>
		{/if}
	</div>
</div>
