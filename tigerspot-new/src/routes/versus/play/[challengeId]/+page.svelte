<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import Map from '$lib/components/Map.svelte';
	import {
		getChallenge,
		getChallengeRounds,
		submitChallengeRound,
		type Challenge,
		type RoundPicture
	} from '$lib/api/versus';
	import { calculateDistance, calculateVersusPoints } from '$lib/utils/distance';

	const challengeId = $derived(parseInt($page.params.challengeId));

	let challenge = $state<Challenge | null>(null);
	let roundPictures = $state<RoundPicture[]>([]);
	let loading = $state(true);

	let currentRound = $state(1);
	let guessCoords = $state<{ lat: number; lng: number } | null>(null);
	let yourScore = $state(0);
	let opponentScore = $state(0);
	let roundScores = $state<
		Array<{ round: number; yourScore: number; opponentScore: number; distance: number }>
	>([]);
	let roundStartTime = $state(Date.now());

	const currentPicture = $derived(roundPictures[currentRound - 1]);

	// Load challenge and round data
	onMount(async () => {
		const [challengeData, rounds] = await Promise.all([
			getChallenge(challengeId),
			getChallengeRounds(challengeId)
		]);

		if (!challengeData || rounds.length === 0) {
			goto('/versus');
			return;
		}

		challenge = challengeData;
		roundPictures = rounds;
		loading = false;
		roundStartTime = Date.now();
	});

	function handleMapSelect(coords: { lat: number; lng: number }) {
		guessCoords = coords;
	}

	async function submitGuess() {
		if (!guessCoords || !currentPicture) return;

		// Calculate time taken
		const timeTaken = Math.floor((Date.now() - roundStartTime) / 1000);

		// Submit round to API
		const result = await submitChallengeRound(
			challengeId,
			currentRound,
			guessCoords.lat,
			guessCoords.lng,
			timeTaken
		);

		if (!result) {
			alert('Failed to submit guess. Please try again.');
			return;
		}

		// Update scores
		yourScore += result.points;
		// Note: opponent score would come from the API when opponent plays
		const opponentPoints = 0; // Will be updated when opponent plays

		roundScores = [
			...roundScores,
			{
				round: currentRound,
				yourScore: result.points,
				opponentScore: opponentPoints,
				distance: result.distance
			}
		];

		// Check if game is complete
		if (currentRound >= 5) {
			// Navigate to results
			goto(`/versus/results/${challengeId}`);
		} else {
			// Next round
			currentRound++;
			guessCoords = null;
			roundStartTime = Date.now();
		}
	}

	function handleTimeUp() {
		if (guessCoords) {
			submitGuess();
		} else {
			// Auto-submit with no guess (0 points)
			roundScores = [
				...roundScores,
				{
					round: currentRound,
					yourScore: 0,
					opponentScore: 0,
					distance: 99999
				}
			];

			if (currentRound >= 5) {
				goto(`/versus/results/${challengeId}`);
			} else {
				currentRound++;
				guessCoords = null;
				roundStartTime = Date.now();
			}
		}
	}
</script>

<svelte:head>
	<title>Versus Match - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary flex flex-col">
	{#if loading || !currentPicture}
		<!-- Loading state -->
		<div class="flex items-center justify-center min-h-screen">
			<Card class="text-center py-16">
				<div class="text-4xl mb-4">⏳</div>
				<p class="font-bold">Loading challenge...</p>
			</Card>
		</div>
	{:else}
		<!-- Fixed Header -->
		<header class="header-fixed bg-white brutal-border">
			<div class="w-full h-full px-6 flex items-center justify-between flex-wrap gap-4">
				<div class="flex items-center gap-4">
					<a href="/versus">
						<img src="/logo.png" alt="TigerSpot Logo" class="inline-block w-32" />
					</a>
					<div class="brutal-border brutal-shadow-sm bg-magenta text-white px-4 py-2 font-bold">
						Round {currentRound}/5
					</div>
				</div>
				<div class="flex items-center gap-4">
					<div class="brutal-border brutal-shadow-sm bg-white px-4 py-2">
						<span class="font-bold">You:</span>
						<span class="text-xl font-black ml-2">{yourScore}</span>
					</div>
					<div class="brutal-border brutal-shadow-sm bg-white px-4 py-2">
						<span class="font-bold">{challenge?.opponent}:</span>
						<span class="text-xl font-black ml-2">{opponentScore}</span>
					</div>
				</div>
				<Timer duration={120} onComplete={handleTimeUp} />
			</div>
		</header>

		<!-- Game Area with padding for fixed header -->
		<main class="grow pt-28 pb-6 px-4 flex items-center justify-center">
			<div class="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
				<!-- Image Panel -->
				<div class="lg:w-1/2 flex flex-col">
					<Card class="grow flex flex-col p-0 overflow-hidden">
						<div class="p-5 flex items-center justify-between">
							<h2 class="text-xl font-black uppercase">Where is this?</h2>
							<span
								class="brutal-border brutal-shadow-sm bg-cyan text-white px-3 py-1 font-bold text-sm"
							>
								Round {currentRound}
							</span>
						</div>
						<div class="relative grow bg-gray w-full block min-h-[300px]">
							<img
								src={currentPicture.imageUrl}
								alt="Where is this location?"
								class="w-full h-full object-cover"
							/>
						</div>
					</Card>
				</div>

				<!-- Map Panel -->
				<div class="lg:w-1/2 flex flex-col">
					<Card class="grow flex flex-col p-0 overflow-hidden">
						<div class="p-5">
							<h2 class="text-xl font-black uppercase mb-3">Click to Guess</h2>
							<div class="text-sm opacity-70 mb-1">
								{guessCoords
									? `📍 ${guessCoords.lat.toFixed(4)}, ${guessCoords.lng.toFixed(4)}`
									: 'Click anywhere on the map to place your guess'}
							</div>
						</div>
						<div class="grow relative min-h-[300px]">
							<Map onSelect={handleMapSelect} guess={guessCoords} showActual={false} />
						</div>
					</Card>
				</div>
			</div>
		</main>

		<!-- Submit Bar -->
		<div class="bg-white brutal-border px-4 py-4">
			<div class="container-brutal flex justify-between items-center flex-wrap gap-4">
				<div class="flex items-center gap-4">
					<span class="text-sm font-bold opacity-60">
						{guessCoords ? 'Guess placed! Ready to submit.' : 'Place a marker on the map'}
					</span>
				</div>
				<Button variant="black" size="lg" onclick={submitGuess} disabled={!guessCoords}>
					Submit Guess →
				</Button>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.timer-urgent) {
		animation: pulse-urgent 0.5s ease-in-out infinite;
	}
</style>
