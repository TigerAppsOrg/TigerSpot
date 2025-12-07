<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import Map from '$lib/components/Map.svelte';
	import { getMatchResults, type MatchResults } from '$lib/api/tournament';

	const matchId = parseInt($page.params.matchId);

	// Get tournamentId from URL (using $page.url which works with SSR)
	const tournamentId = parseInt($page.url.searchParams.get('tournamentId') || '0');

	let loading = $state(true);
	let results = $state<MatchResults | null>(null);

	// Round review state
	let reviewRoundIndex = $state(0);
	const currentReviewRound = $derived(results?.rounds[reviewRoundIndex] ?? null);
	const totalRounds = $derived(results?.rounds.length ?? 0);

	function nextRound() {
		if (reviewRoundIndex < totalRounds - 1) {
			reviewRoundIndex++;
		}
	}

	function prevRound() {
		if (reviewRoundIndex > 0) {
			reviewRoundIndex--;
		}
	}

	onMount(async () => {
		if (!tournamentId || !matchId) {
			goto('/tournament');
			return;
		}

		// Fetch results from API
		const data = await getMatchResults(tournamentId, matchId);
		if (data) {
			results = data;
		} else {
			// Failed to load (unauthorized or not found) - redirect to bracket
			goto(`/tournament/${tournamentId}`);
		}
		loading = false;
	});

	// Winner is determined by winnerId from server (accounts for tiebreakers)
	const isWinner = $derived(results ? results.winnerId === results.you.username : false);
	const usedTiebreaker = $derived(results?.tiebreaker === 'time');

	// Check if eliminated (lost in losers bracket or grand final)
	const isEliminated = $derived.by(() => {
		if (!results || isWinner) return false;
		return results.bracketType === 'LOSERS' || results.bracketType === 'GRAND_FINAL';
	});

	const resultEmoji = $derived.by(() => {
		if (isWinner) return '🎉';
		return isEliminated ? '💀' : '😔';
	});

	const resultText = $derived.by(() => {
		if (isWinner) return usedTiebreaker ? 'YOU WIN (TIEBREAKER)!' : 'YOU WIN!';
		return isEliminated ? 'ELIMINATED' : 'YOU LOSE';
	});

	const resultColor = $derived(isWinner ? 'lime' : 'magenta');

	// Format time as mm:ss
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	// Message based on result
	const resultMessage = $derived.by(() => {
		if (isWinner) {
			if (usedTiebreaker) {
				return `Scores tied! You won with faster time (${formatTime(results!.you.totalTime)} vs ${formatTime(results!.opponent.totalTime)}).`;
			}
			return 'Congratulations! You advance to the next round.';
		}
		if (usedTiebreaker) {
			return `Scores tied! Lost on time (${formatTime(results!.you.totalTime)} vs ${formatTime(results!.opponent.totalTime)}).`;
		}
		if (isEliminated) return "You've been knocked out of the tournament. Better luck next time!";
		return "You've been moved to the losers bracket. Win your way back!";
	});
</script>

<svelte:head>
	<title>Match Results - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<!-- Diamond pattern overlay (tournament theme) -->
	<div class="absolute inset-0 bg-diamonds opacity-[0.03]"></div>

	<Header />

	<main class="relative pt-24 pb-12 px-4">
		<div class="container-brutal max-w-4xl mx-auto">
			{#if results && !loading}
				<!-- Result Header -->
				<div class="text-center mb-10">
					<div class="text-6xl mb-4">{resultEmoji}</div>
					<h1
						class="text-4xl md:text-5xl font-black mb-2"
						style="color: var(--color-{resultColor})"
					>
						{resultText}
					</h1>
					<p class="text-lg opacity-80">{resultMessage}</p>
				</div>

				<!-- Score Comparison -->
				<div class="grid md:grid-cols-3 gap-6 mb-10">
					<!-- Your Score -->
					<Card variant={isWinner ? 'lime' : 'default'} class="text-center py-6">
						<div class="text-sm font-bold uppercase opacity-60 mb-2">You</div>
						<div class="text-lg font-black mb-1">{results.you.displayName}</div>
						<div class="text-4xl font-black">{results.you.total.toLocaleString()}</div>
					</Card>

					<!-- VS -->
					<div class="flex items-center justify-center">
						<div class="brutal-border bg-white px-6 py-4 font-black text-2xl">VS</div>
					</div>

					<!-- Opponent Score -->
					<Card variant={!isWinner ? 'lime' : 'default'} class="text-center py-6">
						<div class="text-sm font-bold uppercase opacity-60 mb-2">Opponent</div>
						<div class="text-lg font-black mb-1">{results.opponent.displayName}</div>
						<div class="text-4xl font-black">{results.opponent.total.toLocaleString()}</div>
					</Card>
				</div>

				<!-- Round-by-Round Breakdown -->
				<Card class="mb-10">
					<h2 class="text-xl font-black uppercase mb-6">Round-by-Round</h2>
					<div class="space-y-3">
						{#each results.you.scores as yourScore, i}
							{@const opponentScore = results.opponent.scores[i] ?? 0}
							{@const roundWinner =
								yourScore > opponentScore ? 'you' : yourScore < opponentScore ? 'opponent' : 'draw'}
							<div
								class="flex items-center justify-between py-3 border-b-2 border-black/10 last:border-0"
							>
								<div class="flex items-center gap-4">
									<span class="brutal-border bg-gray px-3 py-1 text-sm font-bold">
										Round {i + 1}
									</span>
								</div>

								<div class="flex items-center gap-8">
									<div
										class="text-right {roundWinner === 'you' ? 'text-lime font-black' : ''} w-20"
									>
										<div class="text-xs opacity-60 uppercase">You</div>
										<div class="text-lg font-bold tabular-nums">{yourScore.toLocaleString()}</div>
									</div>

									<div class="text-black/30 font-bold">vs</div>

									<div
										class="text-left {roundWinner === 'opponent'
											? 'text-magenta font-black'
											: ''} w-20"
									>
										<div class="text-xs opacity-60 uppercase">{results.opponent.displayName}</div>
										<div class="text-lg font-bold tabular-nums">
											{opponentScore.toLocaleString()}
										</div>
									</div>

									<!-- Round winner indicator -->
									<div class="w-8">
										{#if roundWinner === 'you'}
											<span class="text-lime">✓</span>
										{:else if roundWinner === 'opponent'}
											<span class="text-magenta">✗</span>
										{:else}
											<span class="text-orange">=</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Totals -->
					<div class="mt-6 pt-4 border-t-4 border-black flex items-center justify-between">
						<span class="font-black uppercase">Total</span>
						<div class="flex items-center gap-8">
							<div class="text-right w-20">
								<div class="text-2xl font-black {isWinner ? 'text-lime' : ''}">
									{results.you.total.toLocaleString()}
								</div>
							</div>
							<div class="text-black/30 font-bold">vs</div>
							<div class="text-left w-20">
								<div class="text-2xl font-black {!isWinner ? 'text-magenta' : ''}">
									{results.opponent.total.toLocaleString()}
								</div>
							</div>
							<div class="w-8"></div>
						</div>
					</div>
				</Card>

				<!-- Round Review -->
				{#if currentReviewRound}
					<Card class="mb-10">
						<div class="flex items-center justify-between mb-6">
							<h2 class="text-xl font-black uppercase">Review Rounds</h2>
							<div class="flex items-center gap-4">
								<button
									onclick={prevRound}
									disabled={reviewRoundIndex === 0}
									class="brutal-border bg-white px-4 py-2 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray transition-colors"
								>
									← Prev
								</button>
								<span class="font-black">
									Round {reviewRoundIndex + 1} / {totalRounds}
								</span>
								<button
									onclick={nextRound}
									disabled={reviewRoundIndex >= totalRounds - 1}
									class="brutal-border bg-white px-4 py-2 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray transition-colors"
								>
									Next →
								</button>
							</div>
						</div>

						<div class="grid lg:grid-cols-2 gap-6">
							<!-- Image -->
							<div class="brutal-border overflow-hidden">
								<img
									src={currentReviewRound.imageUrl}
									alt="Round {currentReviewRound.roundNumber} location"
									class="w-full h-64 object-cover"
								/>
							</div>

							<!-- Map with guesses -->
							<div class="brutal-border h-64 overflow-hidden">
								{#key reviewRoundIndex}
									<Map
										readonly
										showActualLocation={currentReviewRound.actual}
										guessLocation={currentReviewRound.you?.guess}
										opponentGuessLocation={currentReviewRound.opponent?.guess}
									/>
								{/key}
							</div>
						</div>

						<!-- Round Stats -->
						<div class="grid md:grid-cols-2 gap-4 mt-6">
							<!-- Your stats -->
							<div
								class="brutal-border p-4 {currentReviewRound.you &&
								currentReviewRound.opponent &&
								currentReviewRound.you.points > currentReviewRound.opponent.points
									? 'bg-lime/20'
									: 'bg-white'}"
							>
								<div class="flex items-center gap-2 mb-2">
									<div class="w-4 h-4 bg-magenta brutal-border"></div>
									<span class="font-bold">You</span>
								</div>
								{#if currentReviewRound.you}
									<div class="grid grid-cols-3 gap-2 text-sm">
										<div>
											<div class="text-black/60 uppercase text-xs">Points</div>
											<div class="font-black text-lg">
												{currentReviewRound.you.points.toLocaleString()}
											</div>
										</div>
										<div>
											<div class="text-black/60 uppercase text-xs">Distance</div>
											<div class="font-bold">{currentReviewRound.you.distance}m</div>
										</div>
										<div>
											<div class="text-black/60 uppercase text-xs">Time</div>
											<div class="font-bold">{formatTime(currentReviewRound.you.time)}</div>
										</div>
									</div>
								{:else}
									<div class="text-black/40">No submission</div>
								{/if}
							</div>

							<!-- Opponent stats -->
							<div
								class="brutal-border p-4 {currentReviewRound.you &&
								currentReviewRound.opponent &&
								currentReviewRound.opponent.points > currentReviewRound.you.points
									? 'bg-lime/20'
									: 'bg-white'}"
							>
								<div class="flex items-center gap-2 mb-2">
									<div class="w-4 h-4 bg-cyan brutal-border"></div>
									<span class="font-bold">{results.opponent.displayName}</span>
								</div>
								{#if currentReviewRound.opponent}
									<div class="grid grid-cols-3 gap-2 text-sm">
										<div>
											<div class="text-black/60 uppercase text-xs">Points</div>
											<div class="font-black text-lg">
												{currentReviewRound.opponent.points.toLocaleString()}
											</div>
										</div>
										<div>
											<div class="text-black/60 uppercase text-xs">Distance</div>
											<div class="font-bold">{currentReviewRound.opponent.distance}m</div>
										</div>
										<div>
											<div class="text-black/60 uppercase text-xs">Time</div>
											<div class="font-bold">{formatTime(currentReviewRound.opponent.time)}</div>
										</div>
									</div>
								{:else}
									<div class="text-black/40">No submission</div>
								{/if}
							</div>
						</div>

						<!-- Legend -->
						<div class="flex flex-wrap gap-4 mt-4 text-sm">
							<div class="flex items-center gap-2">
								<div class="w-4 h-4 bg-magenta brutal-border"></div>
								<span>Your guess</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-4 h-4 bg-cyan brutal-border"></div>
								<span>Opponent's guess</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-4 h-4 bg-lime brutal-border"></div>
								<span>Actual location</span>
							</div>
						</div>
					</Card>
				{/if}

				<!-- What's Next -->
				<Card variant={isWinner ? 'lime' : 'magenta'} class="text-center py-8 mb-10">
					<h3 class="text-xl font-black mb-2">
						{#if isWinner}
							🚀 What's Next
						{:else if isEliminated}
							🏁 Tournament Over
						{:else}
							💪 Keep Fighting
						{/if}
					</h3>
					<p class="opacity-80 mb-4">
						{#if isWinner}
							Check the bracket to see your next opponent!
						{:else if isEliminated}
							Thanks for playing! Check the bracket to follow the rest of the tournament.
						{:else}
							You've been moved to the losers bracket. Win your way back!
						{/if}
					</p>
				</Card>

				<!-- Actions -->
				<div class="flex flex-wrap justify-center gap-4">
					<Button variant="lime" href={`/tournament/${tournamentId}`}>View Bracket</Button>
				</div>
			{:else}
				<!-- Loading state -->
				<Card class="text-center py-16">
					<div class="text-4xl mb-4 animate-bounce">⏳</div>
					<p class="font-bold">Loading results...</p>
				</Card>
			{/if}
		</div>
	</main>
</div>
