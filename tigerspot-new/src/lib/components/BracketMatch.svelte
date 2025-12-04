<script lang="ts">
	import type { BracketMatch } from '$lib/data/dummy';

	interface Props {
		match: BracketMatch;
		currentUserId?: string;
		compact?: boolean;
		onPlay?: () => void;
	}

	let { match, currentUserId = '', compact = false, onPlay }: Props = $props();

	const isCurrentUserMatch = $derived(
		currentUserId && (match.player1 === currentUserId || match.player2 === currentUserId)
	);

	const canPlay = $derived(
		isCurrentUserMatch && match.status === 'in_progress' && match.player1 && match.player2
	);

	const getPlayerClass = (player: string | null, isWinner: boolean) => {
		if (!player) return 'text-black/40';
		if (isWinner) return 'text-lime font-black';
		if (match.status === 'completed') return 'text-black/60';
		if (player === currentUserId) return 'text-cyan font-bold';
		return 'text-black';
	};

	const statusColors = {
		pending: 'bg-gray',
		in_progress: 'bg-orange',
		completed: 'bg-lime'
	};
</script>

<div
	class="brutal-border bg-white {compact ? 'p-2' : 'p-3'} {isCurrentUserMatch
		? 'ring-4 ring-cyan ring-offset-2'
		: ''} transition-all"
>
	<!-- Match header with status -->
	<div class="flex items-center justify-between mb-2">
		<span class="text-[10px] font-bold uppercase tracking-wide text-black/40">
			Match #{match.id}
		</span>
		<span
			class="text-[10px] font-bold uppercase px-2 py-0.5 brutal-border {statusColors[match.status]}"
		>
			{match.status === 'in_progress' ? 'LIVE' : match.status}
		</span>
	</div>

	<!-- Players -->
	<div class="space-y-1">
		<!-- Player 1 -->
		<div
			class="flex items-center justify-between {compact ? 'text-sm' : ''} {getPlayerClass(
				match.player1,
				match.winnerId === match.player1
			)}"
		>
			<span class="truncate max-w-[120px]">
				{match.player1 || 'TBD'}
				{#if match.player1 === currentUserId}
					<span class="text-cyan">(you)</span>
				{/if}
			</span>
			{#if match.player1Score !== null}
				<span class="font-mono tabular-nums font-bold">{match.player1Score.toLocaleString()}</span>
			{/if}
		</div>

		<!-- VS divider -->
		<div class="text-center text-[10px] font-bold text-black/30">VS</div>

		<!-- Player 2 -->
		<div
			class="flex items-center justify-between {compact ? 'text-sm' : ''} {getPlayerClass(
				match.player2,
				match.winnerId === match.player2
			)}"
		>
			<span class="truncate max-w-[120px]">
				{match.player2 || 'TBD'}
				{#if match.player2 === currentUserId}
					<span class="text-cyan">(you)</span>
				{/if}
			</span>
			{#if match.player2Score !== null}
				<span class="font-mono tabular-nums font-bold">{match.player2Score.toLocaleString()}</span>
			{/if}
		</div>
	</div>

	<!-- Play button if applicable -->
	{#if canPlay && onPlay}
		<button
			onclick={onPlay}
			class="mt-3 w-full btn-brutal btn-lime text-sm py-2 font-black uppercase"
		>
			Play Now
		</button>
	{/if}
</div>
