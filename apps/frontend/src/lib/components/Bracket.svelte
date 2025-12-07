<script lang="ts">
	import type { BracketMatch } from '$lib/api/tournament';
	import BracketMatchCard from './BracketMatch.svelte';

	interface Props {
		winners: BracketMatch[][];
		losers: BracketMatch[][];
		grandFinal: BracketMatch;
		currentUserId?: string;
		onPlayMatch?: (matchId: number) => void;
		onAdvancePlayer?: (matchId: number, winnerId: string) => void;
		adminMode?: boolean;
	}

	let {
		winners,
		losers,
		grandFinal,
		currentUserId = '',
		onPlayMatch,
		onAdvancePlayer,
		adminMode = false
	}: Props = $props();

	// Generate round names based on bracket size
	const getWinnersRoundName = (roundIndex: number, totalRounds: number) => {
		const fromEnd = totalRounds - roundIndex;
		if (fromEnd === 1) return 'Finals';
		if (fromEnd === 2) return 'Semifinals';
		if (fromEnd === 3) return 'Quarterfinals';
		return `Round ${roundIndex + 1}`;
	};

	const getLosersRoundName = (roundIndex: number, totalRounds: number) => {
		if (roundIndex === totalRounds - 1) return 'Losers Final';
		if (roundIndex === totalRounds - 2) return 'Losers SF';
		return `Losers R${roundIndex + 1}`;
	};
</script>

<div class="bracket-container">
	<!-- Winners Bracket -->
	<div class="mb-12">
		<h3 class="text-xl font-black uppercase mb-6 flex items-center gap-3">
			<span class="w-4 h-4 bg-lime brutal-border"></span>
			Winners Bracket
		</h3>

		{#if winners.length === 0}
			<div class="text-black/50 text-center py-8">No matches yet</div>
		{:else}
			<div class="bracket-grid winners-bracket">
				{#each winners as round, roundIndex}
					<div class="bracket-round">
						<div class="text-xs font-bold uppercase text-black/50 mb-4 text-center">
							{getWinnersRoundName(roundIndex, winners.length)}
						</div>
						<div class="bracket-matches" style="--matches: {round.length}">
							{#each round as match}
								<div class="bracket-match-wrapper">
									<BracketMatchCard
										{match}
										{currentUserId}
										{adminMode}
										onPlay={onPlayMatch ? () => onPlayMatch(match.id) : undefined}
										onAdvance={onAdvancePlayer
											? (winnerId: string) => onAdvancePlayer(match.id, winnerId)
											: undefined}
									/>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Losers Bracket -->
	<div class="mb-12">
		<h3 class="text-xl font-black uppercase mb-6 flex items-center gap-3">
			<span class="w-4 h-4 bg-magenta brutal-border"></span>
			Losers Bracket
		</h3>

		{#if losers.length === 0}
			<div class="text-black/50 text-center py-8">No matches yet</div>
		{:else}
			<div class="bracket-grid losers-bracket">
				{#each losers as round, roundIndex}
					<div class="bracket-round">
						<div class="text-xs font-bold uppercase text-black/50 mb-4 text-center">
							{getLosersRoundName(roundIndex, losers.length)}
						</div>
						<div class="bracket-matches" style="--matches: {round.length}">
							{#each round as match}
								<div class="bracket-match-wrapper">
									<BracketMatchCard
										{match}
										{currentUserId}
										{adminMode}
										compact
										onPlay={onPlayMatch ? () => onPlayMatch(match.id) : undefined}
										onAdvance={onAdvancePlayer
											? (winnerId: string) => onAdvancePlayer(match.id, winnerId)
											: undefined}
									/>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Grand Final -->
	<div>
		<h3 class="text-xl font-black uppercase mb-6 flex items-center gap-3">
			<span class="w-4 h-4 bg-orange brutal-border"></span>
			Grand Final
		</h3>

		<div class="max-w-xs">
			<BracketMatchCard
				match={grandFinal}
				{currentUserId}
				{adminMode}
				onPlay={onPlayMatch ? () => onPlayMatch(grandFinal.id) : undefined}
				onAdvance={onAdvancePlayer
					? (winnerId: string) => onAdvancePlayer(grandFinal.id, winnerId)
					: undefined}
			/>
		</div>
	</div>
</div>

<style>
	.bracket-container {
		width: 100%;
		overflow-x: auto;
		padding-bottom: 1rem;
	}

	.bracket-grid {
		display: flex;
		gap: 2rem;
		min-width: fit-content;
	}

	.bracket-round {
		display: flex;
		flex-direction: column;
		min-width: 200px;
	}

	.bracket-matches {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		justify-content: space-around;
		flex: 1;
	}

	.bracket-match-wrapper {
		position: relative;
	}

	/* Connector lines for winners bracket */
	.winners-bracket .bracket-round:not(:last-child) .bracket-match-wrapper::after {
		content: '';
		position: absolute;
		right: -1rem;
		top: 50%;
		width: 1rem;
		height: 2px;
		background: black;
	}

	/* Losers bracket slightly smaller */
	.losers-bracket .bracket-round {
		min-width: 180px;
	}

	/* Mobile: Stack vertically */
	@media (max-width: 768px) {
		.bracket-grid {
			flex-direction: column;
			gap: 1.5rem;
		}

		.bracket-round {
			min-width: 100%;
		}

		.bracket-matches {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.75rem;
		}

		.bracket-match-wrapper {
			flex: 1 1 calc(50% - 0.375rem);
			min-width: 150px;
		}

		.bracket-match-wrapper::after {
			display: none;
		}
	}
</style>
