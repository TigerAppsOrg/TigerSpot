<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import ScoreComparison from '$lib/components/ScoreComparison.svelte';
	import { getChallenge, getChallengeResults, type Challenge } from '$lib/api/versus';

	const challengeId = $derived(parseInt($page.params.challengeId));

	let challenge = $state<Challenge | null>(null);
	let results = $state<any>(null);
	let loading = $state(true);

	onMount(async () => {
		const [challengeData, resultsData] = await Promise.all([
			getChallenge(challengeId),
			getChallengeResults(challengeId)
		]);

		if (!challengeData || !resultsData) {
			goto('/versus');
			return;
		}

		challenge = challengeData;
		results = resultsData;
		loading = false;
	});

	const yourTotalScore = $derived(results?.yourTotalScore ?? 0);
	const opponentTotalScore = $derived(results?.opponentTotalScore ?? 0);
	const won = $derived(yourTotalScore > opponentTotalScore);
	const roundResults = $derived(results?.rounds ?? []);
</script>

<svelte:head>
	<title>Versus Results - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<!-- Stripes pattern overlay -->
	<div class="absolute inset-0 bg-stripes opacity-20"></div>

	<Header />

	<main class="relative pt-24 pb-12 px-4">
		<div class="container-brutal max-w-4xl mx-auto">
			{#if loading}
				<!-- Loading state -->
				<Card class="text-center py-16">
					<div class="text-4xl mb-4">⏳</div>
					<p class="font-bold">Loading results...</p>
				</Card>
			{:else}
				<!-- Winner Banner -->
				<Card variant={won ? 'lime' : 'magenta'} class="text-center mb-10">
					<div class="text-6xl mb-4">{won ? '🏆' : '💔'}</div>
					<h1 class="text-4xl font-black mb-4">{won ? 'VICTORY!' : 'DEFEAT'}</h1>
					<ScoreComparison
						player1Name="You"
						player1Score={yourTotalScore}
						player2Name={challenge?.opponent || 'Opponent'}
						player2Score={opponentTotalScore}
						size="lg"
					/>
				</Card>

				<!-- Round-by-Round Breakdown -->
				<Card class="mb-8">
					<h2 class="text-2xl font-black mb-6">Round-by-Round Breakdown</h2>

					<div class="space-y-4">
						{#each roundResults as result}
							<div class="brutal-border p-4 bg-gray/10">
								<div class="flex items-center gap-4 mb-3 flex-wrap">
									<img
										src={result.picture.imageUrl}
										alt="Round {result.round}"
										class="w-20 h-20 object-cover brutal-border"
									/>
									<div class="flex-1">
										<div class="font-black text-lg mb-1">Round {result.round}</div>
									</div>
								</div>

								<ScoreComparison
									player1Name="You"
									player1Score={result.yourScore}
									player1Distance={result.yourDistance}
									player2Name={challenge?.opponent || 'Opponent'}
									player2Score={result.opponentScore}
									player2Distance={result.opponentDistance}
									highlightWinner
								/>
							</div>
						{/each}
					</div>
				</Card>

				<!-- Actions -->
				<div class="flex justify-center gap-4 flex-wrap">
					<Button variant="cyan" href="/versus">Back to Versus Hub</Button>
					<Button variant="white" href="/menu">Main Menu</Button>
				</div>
			{/if}
		</div>
	</main>
</div>
