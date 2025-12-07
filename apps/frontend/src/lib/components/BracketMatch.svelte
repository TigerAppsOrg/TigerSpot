<script lang="ts">
	import type { BracketMatch } from '$lib/api/tournament';

	interface Props {
		match: BracketMatch;
		currentUserId?: string;
		compact?: boolean;
		adminMode?: boolean;
		onPlay?: () => void;
		onAdvance?: (winnerId: string) => void;
	}

	let {
		match,
		currentUserId = '',
		compact = false,
		adminMode = false,
		onPlay,
		onAdvance
	}: Props = $props();

	const isCurrentUserMatch = $derived(
		currentUserId && (match.player1 === currentUserId || match.player2 === currentUserId)
	);

	const canPlay = $derived(
		isCurrentUserMatch &&
			(match.status === 'ready' || match.status === 'in_progress') &&
			match.player1 &&
			match.player2
	);

	// Can advance player if admin and match has at least one player and is not completed
	const canAdvance = $derived(
		adminMode &&
			(match.player1 || match.player2) &&
			match.status !== 'completed' &&
			match.status !== 'pending'
	);

	const getPlayerClass = (player: string | null, isWinner: boolean) => {
		if (!player) return 'text-black/40';
		if (isWinner) return 'text-lime font-black';
		if (match.status === 'completed') return 'text-black/60';
		if (player === currentUserId) return 'text-cyan font-bold';
		return 'text-black';
	};

	const statusColors: Record<string, string> = {
		pending: 'bg-gray',
		ready: 'bg-cyan',
		in_progress: 'bg-orange',
		completed: 'bg-lime'
	};

	const getStatusLabel = (status: string) => {
		if (status === 'in_progress') return 'LIVE';
		if (status === 'ready') return 'READY';
		return status.toUpperCase();
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
			class="text-[10px] font-bold uppercase px-2 py-0.5 brutal-border {statusColors[
				match.status
			] || 'bg-gray'}"
		>
			{getStatusLabel(match.status)}
		</span>
	</div>

	<!-- Players -->
	<div class="space-y-1">
		<!-- Player 1 -->
		<div
			class="flex items-center justify-between gap-1 {compact ? 'text-sm' : ''} {getPlayerClass(
				match.player1,
				match.winnerId === match.player1
			)}"
		>
			<div class="flex items-center gap-1 min-w-0 flex-1">
				<span class="truncate">
					{match.player1DisplayName || match.player1 || 'TBD'}
				</span>
				{#if match.player1 === currentUserId}
					<span class="text-cyan whitespace-nowrap">(you)</span>
				{/if}
			</div>
			<div class="flex items-center gap-2 shrink-0">
				{#if match.player1Score !== null}
					<span class="font-mono tabular-nums font-bold">{match.player1Score.toLocaleString()}</span
					>
				{/if}
				{#if canAdvance && onAdvance && match.player1}
					<button
						onclick={() => onAdvance(match.player1!)}
						class="text-[10px] px-1.5 py-0.5 bg-orange text-white brutal-border hover:bg-orange/80"
						title="Advance {match.player1DisplayName || match.player1}"
					>
						WIN
					</button>
				{/if}
			</div>
		</div>

		<!-- VS divider -->
		<div class="text-center text-[10px] font-bold text-black/30">VS</div>

		<!-- Player 2 -->
		<div
			class="flex items-center justify-between gap-1 {compact ? 'text-sm' : ''} {getPlayerClass(
				match.player2,
				match.winnerId === match.player2
			)}"
		>
			<div class="flex items-center gap-1 min-w-0 flex-1">
				<span class="truncate">
					{match.player2DisplayName || match.player2 || 'TBD'}
				</span>
				{#if match.player2 === currentUserId}
					<span class="text-cyan whitespace-nowrap">(you)</span>
				{/if}
			</div>
			<div class="flex items-center gap-2 shrink-0">
				{#if match.player2Score !== null}
					<span class="font-mono tabular-nums font-bold">{match.player2Score.toLocaleString()}</span
					>
				{/if}
				{#if canAdvance && onAdvance && match.player2}
					<button
						onclick={() => onAdvance(match.player2!)}
						class="text-[10px] px-1.5 py-0.5 bg-orange text-white brutal-border hover:bg-orange/80"
						title="Advance {match.player2DisplayName || match.player2}"
					>
						WIN
					</button>
				{/if}
			</div>
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
