<script lang="ts">
	import type { BracketMatch } from '$lib/data/dummy';
	import BracketMatchCard from './BracketMatch.svelte';

	interface Props {
		winners: BracketMatch[][];
		losers: BracketMatch[][];
		grandFinal: BracketMatch;
		currentUserId?: string;
		onPlayMatch?: (matchId: number) => void;
	}

	let { winners, losers, grandFinal, currentUserId = '', onPlayMatch }: Props = $props();

	const winnersRoundNames = ['Quarterfinals', 'Semifinals', 'Finals'];
	const losersRoundNames = ['Losers R1', 'Losers R2', 'Losers SF', 'Losers Final'];
</script>

<div class="bracket-container">
	<!-- Winners Bracket -->
	<div class="mb-12">
		<h3 class="text-xl font-black uppercase mb-6 flex items-center gap-3">
			<span class="w-4 h-4 bg-lime brutal-border"></span>
			Winners Bracket
		</h3>

		<div class="bracket-grid winners-bracket">
			{#each winners as round, roundIndex}
				<div class="bracket-round">
					<div class="text-xs font-bold uppercase text-black/50 mb-4 text-center">
						{winnersRoundNames[roundIndex] || `Round ${roundIndex + 1}`}
					</div>
					<div class="bracket-matches" style="--matches: {round.length}">
						{#each round as match}
							<div class="bracket-match-wrapper">
								<BracketMatchCard
									{match}
									{currentUserId}
									onPlay={onPlayMatch ? () => onPlayMatch(match.id) : undefined}
								/>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Losers Bracket -->
	<div class="mb-12">
		<h3 class="text-xl font-black uppercase mb-6 flex items-center gap-3">
			<span class="w-4 h-4 bg-magenta brutal-border"></span>
			Losers Bracket
		</h3>

		<div class="bracket-grid losers-bracket">
			{#each losers as round, roundIndex}
				<div class="bracket-round">
					<div class="text-xs font-bold uppercase text-black/50 mb-4 text-center">
						{losersRoundNames[roundIndex] || `Round ${roundIndex + 1}`}
					</div>
					<div class="bracket-matches" style="--matches: {round.length}">
						{#each round as match}
							<div class="bracket-match-wrapper">
								<BracketMatchCard
									{match}
									{currentUserId}
									compact
									onPlay={onPlayMatch ? () => onPlayMatch(match.id) : undefined}
								/>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
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
				onPlay={onPlayMatch ? () => onPlayMatch(grandFinal.id) : undefined}
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
