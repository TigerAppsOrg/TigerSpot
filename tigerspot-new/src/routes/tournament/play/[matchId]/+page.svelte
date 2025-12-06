<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import Map from '$lib/components/Map.svelte';
	import {
		getMatchRounds,
		submitMatchRound,
		getMatchStatus,
		type RoundPicture
	} from '$lib/api/tournament';
	import { userStore } from '$lib/stores/user.svelte';

	const matchId = parseInt($page.params.matchId);

	// Extract tournamentId from URL search params or state
	const urlParams = new URLSearchParams(window.location.search);
	const tournamentId = parseInt(urlParams.get('tournamentId') || '0');

	let roundPictures = $state<RoundPicture[]>([]);
	let loading = $state(true);
	let timeLimit = $state(120); // Default 2 minutes
	let opponentName = $state('Opponent');

	// Game state
	let currentRound = $state(1);
	let guessCoords = $state<{ lat: number; lng: number } | null>(null);
	let roundStartTime = $state(Date.now());
	let roundScores = $state<number[]>([]);
	let timerComponent: Timer;

	// Waiting state
	let waitingForOpponent = $state(false);
	let opponentProgress = $state(0);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	const totalRounds = $derived(roundPictures.length || 5);
	const currentPicture = $derived(roundPictures[currentRound - 1]);

	// Load match rounds
	onMount(async () => {
		if (!tournamentId || !matchId) {
			goto('/tournament');
			return;
		}

		const rounds = await getMatchRounds(tournamentId, matchId);
		if (rounds.length === 0) {
			goto('/tournament');
			return;
		}

		roundPictures = rounds;
		loading = false;
		roundStartTime = Date.now();
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	// Start polling for opponent status
	function startPolling() {
		pollInterval = setInterval(async () => {
			const status = await getMatchStatus(tournamentId, matchId);
			if (!status) return;

			// Determine which player is the opponent
			const isPlayer1 = status.player1Id === userStore.username;
			opponentProgress = isPlayer1 ? status.player2Progress : status.player1Progress;
			const opponentFinished = isPlayer1 ? status.player2Finished : status.player1Finished;

			// If match is completed, go to results
			if (status.status === 'COMPLETED' || opponentFinished) {
				if (pollInterval) {
					clearInterval(pollInterval);
				}
				goto(`/tournament/results/${matchId}?tournamentId=${tournamentId}`);
			}
		}, 2000); // Poll every 2 seconds
	}

	function handleMapSelect(coords: { lat: number; lng: number }) {
		guessCoords = coords;
	}

	async function submitRound() {
		if (!guessCoords || !currentPicture) return;

		// Calculate time taken
		const timeTaken = Math.floor((Date.now() - roundStartTime) / 1000);

		// Submit round to API
		const result = await submitMatchRound(
			tournamentId,
			matchId,
			currentRound,
			guessCoords.lat,
			guessCoords.lng,
			timeTaken
		);

		if (!result) {
			alert('Failed to submit guess. Please try again.');
			return;
		}

		// Store round score
		roundScores = [...roundScores, result.points];

		if (currentRound < totalRounds) {
			// Move to next round
			currentRound++;
			guessCoords = null;
			roundStartTime = Date.now();
			// Reset timer
			if (timerComponent) {
				timerComponent.reset();
				timerComponent.start();
			}
		} else {
			// All rounds complete - check if opponent is done
			await checkMatchCompletion();
		}
	}

	async function checkMatchCompletion() {
		const status = await getMatchStatus(tournamentId, matchId);

		if (status?.status === 'COMPLETED') {
			// Both players done - go to results
			goto(`/tournament/results/${matchId}?tournamentId=${tournamentId}`);
		} else {
			// Wait for opponent
			waitingForOpponent = true;
			startPolling();
		}
	}

	function handleTimeUp() {
		// Auto-submit with current position or skip
		if (guessCoords) {
			submitRound();
		} else {
			// No guess - submit with default location (0,0) to record 0 points
			submitRoundWithNoGuess();
		}
	}

	async function submitRoundWithNoGuess() {
		// Submit with 0,0 coords which will give 0 points due to distance
		const result = await submitMatchRound(tournamentId, matchId, currentRound, 0, 0, timeLimit);

		roundScores = [...roundScores, result?.points || 0];

		if (currentRound < totalRounds) {
			currentRound++;
			guessCoords = null;
			roundStartTime = Date.now();
			if (timerComponent) {
				timerComponent.reset();
				timerComponent.start();
			}
		} else {
			await checkMatchCompletion();
		}
	}
</script>

<svelte:head>
	<title>Tournament Match - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary flex flex-col">
	{#if loading || !currentPicture}
		<!-- Loading state -->
		<div class="flex items-center justify-center min-h-screen">
			<Card class="text-center py-16">
				<div class="text-4xl mb-4">⏳</div>
				<p class="font-bold">Loading match...</p>
			</Card>
		</div>
	{:else if waitingForOpponent}
		<!-- Waiting for opponent -->
		<div class="flex items-center justify-center min-h-screen">
			<Card class="text-center py-16 px-12 max-w-md">
				<div class="text-6xl mb-6 animate-bounce">⏳</div>
				<h2 class="text-2xl font-black mb-4">Waiting for Opponent</h2>
				<p class="opacity-80 mb-6">
					You've finished all rounds! Waiting for your opponent to complete their rounds.
				</p>

				<!-- Your score summary -->
				<div class="brutal-border bg-lime p-4 mb-6">
					<div class="text-sm font-bold uppercase opacity-60 mb-1">Your Total Score</div>
					<div class="text-3xl font-black">
						{roundScores.reduce((a, b) => a + b, 0).toLocaleString()}
					</div>
				</div>

				<!-- Opponent progress -->
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
	{:else}
		<!-- Fixed Header -->
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
					<!-- Round indicator -->
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
					<Timer bind:this={timerComponent} duration={timeLimit} onComplete={handleTimeUp} />
				</div>
			</div>
		</header>

		<!-- Game Area with padding for fixed header -->
		<main class="grow pt-24 pb-6 px-4 flex items-center justify-center">
			<div class="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
				<!-- Image Panel -->
				<div class="lg:w-1/2 flex flex-col">
					<Card class="grow flex flex-col p-0 overflow-hidden">
						<div class="p-5 flex items-center justify-between">
							<h2 class="text-xl font-black uppercase">Where is this?</h2>
							<div class="text-sm font-bold text-black/60">
								Round {currentRound} of {totalRounds}
							</div>
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
							<Map onSelect={handleMapSelect} guessLocation={guessCoords ?? undefined} />
						</div>
					</Card>
				</div>
			</div>
		</main>

		<!-- Submit Bar -->
		<footer class="bg-white brutal-border border-b-0 border-x-0 flex-shrink-0 py-5">
			<div class="container-brutal flex items-center justify-between">
				<div class="flex items-center gap-4">
					<!-- Round scores -->
					<div class="hidden md:flex items-center gap-2 text-sm">
						<span class="font-bold opacity-60">Scores:</span>
						{#each roundScores as score, i}
							<span class="brutal-border bg-lime px-2 py-0.5 font-bold text-xs">
								R{i + 1}: {score}
							</span>
						{/each}
					</div>
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
</div>
