<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import Map from '$lib/components/Map.svelte';
	import {
		getChallenge,
		getChallengeRounds,
		getChallengeStatus,
		getChallengeResults,
		submitChallengeRound,
		startChallengeRound,
		type Challenge,
		type RoundPicture
	} from '$lib/api/versus';
	import { userStore } from '$lib/stores/user.svelte';

	const challengeId = $derived(parseInt($page.params.challengeId));

	let challenge = $state<Challenge | null>(null);
	let roundPictures = $state<RoundPicture[]>([]);
	let loading = $state(true);
	let opponentName = $state('Opponent');

	// Game state
	let currentRound = $state(1);
	let guessCoords = $state<{ lat: number; lng: number } | null>(null);
	let roundScores = $state<number[]>([]);
	let remainingSeconds = $state(30); // Server-controlled timer
	let roundReady = $state(false); // Wait for server before showing round
	let timerComponent: Timer;
	let mapComponent: Map;

	// Waiting state
	let waitingForOpponent = $state(false);
	let opponentProgress = $state(0);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Image modal state
	let showImageModal = $state(false);

	const totalRounds = $derived(roundPictures.length || 5);
	const currentPicture = $derived(roundPictures[currentRound - 1]);

	async function initializeRound(roundNum: number) {
		// Call server to start round and get remaining time
		const startResult = await startChallengeRound(challengeId, roundNum);
		if (startResult) {
			remainingSeconds = startResult.remainingSeconds;
		} else {
			remainingSeconds = 30; // Fallback
		}
		roundReady = true;

		// Start or reset timer with server-provided time
		if (timerComponent) {
			timerComponent.reset(remainingSeconds);
			timerComponent.start();
		}
	}

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
		opponentName = challengeData.opponentDisplayName || challengeData.opponent;

		// Check status to resume from correct round
		const status = await getChallengeStatus(challengeId);
		if (status) {
			// If challenge is completed, go to results
			if (status.status === 'COMPLETED') {
				goto(`/versus/results/${challengeId}`);
				return;
			}

			// If user has finished all rounds, go to waiting screen
			if (status.yourFinished) {
				// Fetch actual scores from results
				const results = await getChallengeResults(challengeId);
				if (results) {
					roundScores = results.you.scores;
				}

				waitingForOpponent = true;
				loading = false;
				startPolling();
				return;
			}

			// Resume from next round after what's been submitted
			if (status.yourProgress > 0) {
				currentRound = status.yourProgress + 1;
			}
		}

		loading = false;
		// Initialize the round with server-side timer
		await initializeRound(currentRound);
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	function startPolling() {
		pollInterval = setInterval(async () => {
			const status = await getChallengeStatus(challengeId);
			if (!status) return;

			opponentProgress = status.opponentProgress;

			// If challenge is completed, go to results
			if (status.status === 'COMPLETED' || status.opponentFinished) {
				if (pollInterval) {
					clearInterval(pollInterval);
				}
				goto(`/versus/results/${challengeId}`);
			}
		}, 2000);
	}

	function handleMapSelect(coords: { lat: number; lng: number }) {
		guessCoords = coords;
	}

	async function submitRound() {
		if (!guessCoords || !currentPicture) return;

		// Time is calculated server-side from startedAt, but pass client estimate as fallback
		const clientTimeTaken = 30 - remainingSeconds;

		const result = await submitChallengeRound(
			challengeId,
			currentRound,
			guessCoords.lat,
			guessCoords.lng,
			clientTimeTaken
		);

		if (!result) {
			alert('Failed to submit guess. Please try again.');
			return;
		}

		roundScores = [...roundScores, result.points];

		if (currentRound < totalRounds) {
			currentRound++;
			guessCoords = null;
			roundReady = false;
			if (mapComponent) {
				mapComponent.clearMarker();
			}
			// Initialize next round with server-side timer
			await initializeRound(currentRound);
		} else {
			await checkCompletion();
		}
	}

	async function checkCompletion() {
		const status = await getChallengeStatus(challengeId);

		if (status?.status === 'COMPLETED') {
			goto(`/versus/results/${challengeId}`);
		} else {
			waitingForOpponent = true;
			startPolling();
		}
	}

	function handleTimeUp() {
		if (guessCoords) {
			submitRound();
		} else {
			submitRoundWithNoGuess();
		}
	}

	async function submitRoundWithNoGuess() {
		// Time will be 30 seconds (timeout) - server calculates from startedAt
		const result = await submitChallengeRound(challengeId, currentRound, 0, 0, 30);

		roundScores = [...roundScores, result?.points || 0];

		if (currentRound < totalRounds) {
			currentRound++;
			guessCoords = null;
			roundReady = false;
			if (mapComponent) {
				mapComponent.clearMarker();
			}
			// Initialize next round with server-side timer
			await initializeRound(currentRound);
		} else {
			await checkCompletion();
		}
	}

	function openImageModal() {
		showImageModal = true;
	}

	function closeImageModal() {
		showImageModal = false;
	}
</script>

<svelte:head>
	<title>Versus Match - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary flex flex-col">
	{#if loading}
		<div class="flex items-center justify-center min-h-screen">
			<Card class="text-center py-16">
				<div class="text-4xl mb-4">⏳</div>
				<p class="font-bold">Loading challenge...</p>
			</Card>
		</div>
	{:else if waitingForOpponent}
		<div class="flex items-center justify-center min-h-screen">
			<Card class="text-center py-16 px-12 max-w-md">
				<div class="text-6xl mb-6 animate-bounce">⏳</div>
				<h2 class="text-2xl font-black mb-4">Waiting for Opponent</h2>
				<p class="opacity-80 mb-6">
					You've finished all rounds! Waiting for {opponentName} to complete their rounds.
				</p>

				<div class="brutal-border bg-lime p-4 mb-6">
					<div class="text-sm font-bold uppercase opacity-60 mb-1">Your Total Score</div>
					<div class="text-3xl font-black">
						{roundScores.reduce((a, b) => a + b, 0).toLocaleString()}<span
							class="text-xl opacity-60">/{(totalRounds * 1000).toLocaleString()}</span
						>
					</div>
				</div>

				<div class="brutal-border bg-gray/30 p-4 mb-6">
					<div class="text-sm font-bold uppercase opacity-60 mb-2">Opponent Progress</div>
					<div class="flex justify-center gap-2">
						{#each Array(totalRounds) as _, i}
							<div
								class="w-4 h-4 brutal-border {i < opponentProgress ? 'bg-orange' : 'bg-white'}"
							></div>
						{/each}
					</div>
					<div class="text-sm mt-2 opacity-60">
						{opponentProgress} / {totalRounds} rounds complete
					</div>
				</div>

				<p class="text-sm opacity-60">
					Results will appear automatically when your opponent finishes.
				</p>
			</Card>
		</div>
	{:else if !currentPicture || !roundReady}
		<div class="flex items-center justify-center min-h-screen">
			<Card class="text-center py-16">
				<div class="text-4xl mb-4">⏳</div>
				<p class="font-bold">Preparing round {currentRound}...</p>
			</Card>
		</div>
	{:else}
		<header class="header-fixed bg-white brutal-border">
			<div class="w-full h-full px-4 md:px-6 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a href="/menu">
						<img src="/logo.png" alt="TigerSpot Logo" class="inline-block w-32 md:w-40" />
					</a>
					<div class="brutal-border bg-magenta text-white px-3 py-1 font-bold text-sm">
						vs {opponentName}
					</div>
				</div>

				<div class="flex items-center gap-4">
					<div class="hidden md:flex items-center gap-2">
						{#each Array(totalRounds) as _, i}
							<div
								class="w-3 h-3 brutal-border {i < currentRound - 1
									? 'bg-lime'
									: i === currentRound - 1
										? 'bg-orange'
										: 'bg-gray'}"
							></div>
						{/each}
					</div>
					<div class="brutal-border bg-white px-3 py-1 font-black text-sm">
						Round {currentRound}/{totalRounds}
					</div>
					<Timer
						bind:this={timerComponent}
						duration={30}
						initialRemaining={remainingSeconds}
						onComplete={handleTimeUp}
					/>
				</div>
			</div>
		</header>

		<main class="grow pt-24 pb-6 px-4 flex items-center justify-center">
			<div class="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
				<div class="lg:w-1/2 flex flex-col">
					<Card class="grow flex flex-col p-0 overflow-hidden">
						<div class="p-5 flex items-center justify-between">
							<h2 class="text-xl font-black uppercase">Where is this?</h2>
							<div class="text-sm font-bold text-black/60">
								Round {currentRound} of {totalRounds}
							</div>
						</div>
						<div
							class="relative bg-white w-full overflow-hidden flex items-center justify-center h-[40vh] lg:h-[50vh]"
						>
							<img
								src={currentPicture.imageUrl}
								alt="Where is this location?"
								class="max-w-full max-h-full object-contain"
							/>
							<button
								onclick={openImageModal}
								class="absolute top-3 right-3 brutal-border brutal-shadow bg-white hover:bg-gray px-3 py-2 transition-colors"
								title="Expand image"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
									/>
								</svg>
							</button>
						</div>
					</Card>
				</div>

				<div class="lg:w-1/2 flex flex-col">
					<Card class="grow flex flex-col p-0 overflow-hidden">
						<div class="p-5 flex items-center justify-between">
							<h2 class="text-xl font-black uppercase">Click to guess</h2>
							<span
								class="brutal-border brutal-shadow-sm bg-lime px-4 py-2 text-sm font-bold {guessCoords
									? 'visible'
									: 'invisible'}"
							>
								Location selected
							</span>
						</div>
						<div class="grow min-h-[300px] lg:min-h-0">
							<Map
								bind:this={mapComponent}
								onSelect={handleMapSelect}
								guessLocation={guessCoords ?? undefined}
							/>
						</div>
					</Card>
				</div>
			</div>
		</main>

		<footer class="bg-white brutal-border border-b-0 border-x-0 flex-shrink-0 py-5">
			<div class="container-brutal flex items-center justify-between">
				<div class="flex items-center gap-4">
					{#if guessCoords}
						<span class="font-mono font-bold text-sm opacity-60">
							{guessCoords.lat.toFixed(4)}, {guessCoords.lng.toFixed(4)}
						</span>
					{:else}
						<span class="text-sm opacity-60">Click on the map to place your guess</span>
					{/if}
				</div>
				<Button variant="black" size="lg" disabled={!guessCoords} onclick={submitRound}>
					{currentRound < totalRounds ? 'Next Round' : 'Finish Match'}
				</Button>
			</div>
		</footer>
	{/if}

	{#if showImageModal && currentPicture}
		<div
			class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[2000]"
			onclick={closeImageModal}
		>
			<div
				class="relative max-w-7xl max-h-[90vh] brutal-border brutal-shadow-lg bg-white p-4"
				onclick={(e) => e.stopPropagation()}
			>
				<button
					onclick={closeImageModal}
					class="absolute -top-4 -right-4 brutal-border brutal-shadow bg-white hover:bg-gray px-4 py-3 font-black text-xl transition-colors"
					title="Close"
				>
					✕
				</button>
				<img
					src={currentPicture.imageUrl}
					alt="Where is this location?"
					class="max-w-full max-h-[85vh] object-contain"
				/>
			</div>
		</div>
	{/if}
</div>
