<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import Map from '$lib/components/Map.svelte';
	import { dummyPictures, dummyChallenges } from '$lib/data/dummy';
	import { calculateDistance, calculateDailyPoints } from '$lib/utils/distance';

	const challengeId = $derived(parseInt($page.params.challengeId));
	const challenge = $derived(dummyChallenges.find((c) => c.id === challengeId));

	let currentRound = $state(1);
	let guessCoords = $state<{ lat: number; lng: number } | null>(null);
	let yourScore = $state(0);
	let opponentScore = $state(0);
	let roundScores = $state<
		Array<{ round: number; yourScore: number; opponentScore: number; distance: number }>
	>([]);

	const currentPicture = $derived(dummyPictures[currentRound - 1]);

	function handleMapSelect(coords: { lat: number; lng: number }) {
		guessCoords = coords;
	}

	function submitGuess() {
		if (!guessCoords || !currentPicture) return;

		// Calculate your score
		const distance = calculateDistance(
			guessCoords.lat,
			guessCoords.lng,
			currentPicture.latitude,
			currentPicture.longitude
		);
		const points = calculateDailyPoints(distance);

		// Mock opponent score (random between 300-900)
		const opponentPoints = Math.floor(Math.random() * 600) + 300;

		yourScore += points;
		opponentScore += opponentPoints;

		roundScores = [
			...roundScores,
			{
				round: currentRound,
				yourScore: points,
				opponentScore: opponentPoints,
				distance
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
		}
	}

	function handleTimeUp() {
		if (guessCoords) {
			submitGuess();
		} else {
			// Auto-submit with no guess (0 points)
			yourScore += 0;
			opponentScore += Math.floor(Math.random() * 600) + 300;

			roundScores = [
				...roundScores,
				{
					round: currentRound,
					yourScore: 0,
					opponentScore: Math.floor(Math.random() * 600) + 300,
					distance: 99999
				}
			];

			if (currentRound >= 5) {
				goto(`/versus/results/${challengeId}`);
			} else {
				currentRound++;
				guessCoords = null;
			}
		}
	}
</script>

<svelte:head>
	<title>Versus Match - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary flex flex-col">
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
</div>

<style>
	:global(.timer-urgent) {
		animation: pulse-urgent 0.5s ease-in-out infinite;
	}
</style>
