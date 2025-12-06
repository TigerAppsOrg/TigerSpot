<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import { userStore } from '$lib/stores/user.svelte';

	const matchId = $page.params.matchId;

	// Get tournamentId from URL
	const urlParams = new URLSearchParams(window.location.search);
	const tournamentId = parseInt(urlParams.get('tournamentId') || '0');

	// Results loaded from sessionStorage (set by match play page)
	let results = $state<{
		matchId: string;
		opponent: string;
		yourScores: number[];
		yourTotal: number;
		opponentScores: number[];
		opponentTotal: number;
	} | null>(null);

	onMount(() => {
		const stored = sessionStorage.getItem('tournamentMatchResults');
		if (stored) {
			results = JSON.parse(stored);
		} else {
			// No results - redirect back
			goto('/tournament');
		}
	});

	const isWinner = $derived(results ? results.yourTotal > results.opponentTotal : false);
	const isDraw = $derived(results ? results.yourTotal === results.opponentTotal : false);

	const resultEmoji = $derived.by(() => {
		if (isDraw) return '🤝';
		return isWinner ? '🎉' : '😔';
	});

	const resultText = $derived.by(() => {
		if (isDraw) return "IT'S A DRAW!";
		return isWinner ? 'YOU WIN!' : 'YOU LOSE';
	});

	const resultColor = $derived.by(() => {
		if (isDraw) return 'orange';
		return isWinner ? 'lime' : 'magenta';
	});

	// Message based on result
	const resultMessage = $derived.by(() => {
		if (isDraw) return "It's a tie! A tiebreaker round will be played.";
		if (isWinner) return 'Congratulations! You advance to the next round.';
		return "Don't give up! You've been moved to the losers bracket.";
	});
</script>

<svelte:head>
	<title>Match Results - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary">
	<Header />

	<main class="pt-24 pb-12 px-4">
		<div class="container-brutal max-w-4xl mx-auto">
			{#if results}
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
						<div class="text-lg font-black mb-1">{userStore.user?.username ?? 'You'}</div>
						<div class="text-4xl font-black">{results.yourTotal.toLocaleString()}</div>
					</Card>

					<!-- VS -->
					<div class="flex items-center justify-center">
						<div class="brutal-border bg-white px-6 py-4 font-black text-2xl">VS</div>
					</div>

					<!-- Opponent Score -->
					<Card variant={!isWinner && !isDraw ? 'lime' : 'default'} class="text-center py-6">
						<div class="text-sm font-bold uppercase opacity-60 mb-2">Opponent</div>
						<div class="text-lg font-black mb-1">{results.opponent}</div>
						<div class="text-4xl font-black">{results.opponentTotal.toLocaleString()}</div>
					</Card>
				</div>

				<!-- Round-by-Round Breakdown -->
				<Card class="mb-10">
					<h2 class="text-xl font-black uppercase mb-6">Round-by-Round</h2>
					<div class="space-y-3">
						{#each results.yourScores as yourScore, i}
							{@const opponentScore = results.opponentScores[i]}
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
										<div class="text-xs opacity-60 uppercase">{results.opponent}</div>
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
									{results.yourTotal.toLocaleString()}
								</div>
							</div>
							<div class="text-black/30 font-bold">vs</div>
							<div class="text-left w-20">
								<div class="text-2xl font-black {!isWinner && !isDraw ? 'text-magenta' : ''}">
									{results.opponentTotal.toLocaleString()}
								</div>
							</div>
							<div class="w-8"></div>
						</div>
					</div>
				</Card>

				<!-- What's Next -->
				<Card variant={isWinner ? 'lime' : 'magenta'} class="text-center py-8 mb-10">
					<h3 class="text-xl font-black mb-2">
						{isWinner ? "🚀 What's Next" : '💪 Keep Fighting'}
					</h3>
					<p class="opacity-80 mb-4">
						{#if isWinner}
							Check the bracket to see your next opponent!
						{:else}
							You've been moved to the losers bracket. Win your way back!
						{/if}
					</p>
				</Card>

				<!-- Actions -->
				<div class="flex flex-wrap justify-center gap-4">
					<Button variant="lime" href={`/tournament/${tournamentId}`}>View Bracket</Button>
					<Button variant="white" href="/tournament">Tournament Home</Button>
					<Button variant="cyan" href="/menu">Main Menu</Button>
				</div>
			{:else}
				<!-- Loading state -->
				<Card class="text-center py-16">
					<div class="text-4xl mb-4">⏳</div>
					<p class="font-bold">Loading results...</p>
				</Card>
			{/if}
		</div>
	</main>
</div>
