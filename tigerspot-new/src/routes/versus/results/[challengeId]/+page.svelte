<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import ScoreComparison from '$lib/components/ScoreComparison.svelte';
	import { dummyChallenges, dummyPictures } from '$lib/data/dummy';

	const challengeId = $derived(parseInt($page.params.challengeId));
	const challenge = $derived(dummyChallenges.find((c) => c.id === challengeId));

	// Mock round-by-round results
	const roundResults = $state([
		{
			round: 1,
			picture: dummyPictures[0],
			yourScore: 850,
			opponentScore: 720,
			yourDistance: 50,
			opponentDistance: 120
		},
		{
			round: 2,
			picture: dummyPictures[1],
			yourScore: 780,
			opponentScore: 650,
			yourDistance: 85,
			opponentDistance: 150
		},
		{
			round: 3,
			picture: dummyPictures[2],
			yourScore: 920,
			opponentScore: 880,
			yourDistance: 30,
			opponentDistance: 45
		},
		{
			round: 4,
			picture: dummyPictures[3],
			yourScore: 650,
			opponentScore: 790,
			yourDistance: 180,
			opponentDistance: 75
		},
		{
			round: 5,
			picture: dummyPictures[4],
			yourScore: 1000,
			opponentScore: 760,
			yourDistance: 0,
			opponentDistance: 95
		}
	]);

	const yourTotalScore = $derived(roundResults.reduce((sum, r) => sum + r.yourScore, 0));
	const opponentTotalScore = $derived(roundResults.reduce((sum, r) => sum + r.opponentScore, 0));
	const won = $derived(yourTotalScore > opponentTotalScore);
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
		</div>
	</main>
</div>
