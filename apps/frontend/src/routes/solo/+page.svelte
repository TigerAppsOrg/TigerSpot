<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import Map from '$lib/components/Map.svelte';
	import { getSoloRounds, submitSoloGuess, type SoloRound } from '$lib/api/solo';
	import { soloResults, type SoloRoundResult } from '$lib/stores/soloResults';
	import { userStore } from '$lib/stores/user.svelte';
	import { formatDistance } from '$lib/utils/distance';

	const ROUND_SECONDS = 120;
	const ROUND_COUNT = 5;
	const MAX_POINTS_PER_ROUND = 1500;

	let rounds = $state<SoloRound[]>([]);
	let loading = $state(true);
	let currentRound = $state(1);
	let guessCoords = $state<{ lat: number; lng: number } | null>(null);
	let roundResults = $state<SoloRoundResult[]>([]);
	let remainingSeconds = $state(ROUND_SECONDS);
	let roundReady = $state(false);
	let showRoundReview = $state(false);
	let reviewResult = $state<SoloRoundResult | null>(null);
	let submitting = $state(false);
	let timerComponent: Timer;
	let mapComponent: Map;

	// Image modal state
	let showImageModal = $state(false);

	const totalRounds = $derived(rounds.length || ROUND_COUNT);
	const currentPicture = $derived(rounds[currentRound - 1]);
	const totalPossiblePoints = $derived(totalRounds * MAX_POINTS_PER_ROUND);
	const totalEarnedPoints = $derived(roundResults.reduce((sum, round) => sum + round.points, 0));
	const roundProgress = $derived.by(() =>
		reviewResult ? Math.min(100, Math.round((reviewResult.points / MAX_POINTS_PER_ROUND) * 100)) : 0
	);
	const totalProgress = $derived.by(() =>
		totalPossiblePoints > 0
			? Math.min(100, Math.round((totalEarnedPoints / totalPossiblePoints) * 100))
			: 0
	);

	onMount(async () => {
		// Redirect to login if not authenticated
		if (!userStore.isAuthenticated && !userStore.loading) {
			goto('/');
			return;
		}

		soloResults.set(null);

		rounds = await getSoloRounds(ROUND_COUNT);
		loading = false;

		if (rounds.length === 0) {
			return;
		}

		startRound();
	});

	function startRound() {
		roundReady = true;
		remainingSeconds = ROUND_SECONDS;
		showRoundReview = false;
		reviewResult = null;
		if (timerComponent) {
			timerComponent.reset(ROUND_SECONDS);
			timerComponent.start();
		}
	}

	function handleMapSelect(coords: { lat: number; lng: number }) {
		guessCoords = coords;
	}

	async function submitRound(forceNoGuess = false) {
		if (submitting) return;
		if (!currentPicture) return;
		submitting = true;
		if (timerComponent) {
			timerComponent.stop();
		}

		const hasGuess = !forceNoGuess && !!guessCoords;
		const guessLat = hasGuess ? guessCoords!.lat : 0;
		const guessLng = hasGuess ? guessCoords!.lng : 0;

		const result = await submitSoloGuess(currentPicture.id, guessLat, guessLng);
		if (!result) {
			alert('Failed to submit guess. Please try again.');
			submitting = false;
			return;
		}

		const roundResult: SoloRoundResult = {
			pictureId: currentPicture.id,
			imageUrl: currentPicture.imageUrl,
			guessLat: hasGuess ? guessLat : null,
			guessLng: hasGuess ? guessLng : null,
			actualLat: result.actualLat,
			actualLng: result.actualLng,
			distance: result.distance,
			points: result.points,
			timedOut: !hasGuess
		};

		const updatedResults = [...roundResults, roundResult];
		roundResults = updatedResults;

		reviewResult = roundResult;
		showRoundReview = true;
		submitting = false;
	}

	function handleTimeUp() {
		if (submitting || showRoundReview) return;
		if (guessCoords) {
			submitRound();
		} else {
			submitRound(true);
		}
	}

	function continueAfterReview() {
		if (submitting) return;
		if (!reviewResult) return;
		showRoundReview = false;

		if (currentRound < totalRounds) {
			currentRound++;
			guessCoords = null;
			roundReady = false;
			if (mapComponent) {
				mapComponent.clearMarker();
			}
			startRound();
		} else {
			soloResults.set({
				rounds: roundResults,
				totalPoints: roundResults.reduce((sum, round) => sum + round.points, 0)
			});
			goto('/solo/results');
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
	<title>Solo Mode - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary flex flex-col">
	{#if loading}
		<div class="flex items-center justify-center min-h-screen">
			<Card class="text-center py-16">
				<Icon name="clock" class="text-4xl mb-4" />
				<p class="font-bold">Loading solo mode...</p>
			</Card>
		</div>
	{:else if rounds.length === 0}
		<div class="flex items-center justify-center min-h-screen">
			<Card class="text-center py-16 max-w-md">
				<Icon name="faceSad" class="text-4xl mb-4" />
				<p class="font-bold mb-4">No images available</p>
				<Button variant="white" href="/menu">Back to Menu</Button>
			</Card>
		</div>
	{:else if !currentPicture || !roundReady}
		<div class="flex items-center justify-center min-h-screen">
			<Card class="text-center py-16">
				<Icon name="clock" class="text-4xl mb-4" />
				<p class="font-bold">Preparing round {currentRound}...</p>
			</Card>
		</div>
	{:else if showRoundReview && reviewResult}
		<header class="header-fixed bg-white brutal-border">
			<div class="w-full h-full px-4 md:px-6 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a href="/menu">
						<img src="/logo.png" alt="TigerSpot Logo" class="inline-block w-32 md:w-40" />
					</a>
					<div class="brutal-border bg-orange text-white px-3 py-1 font-bold text-sm">
						Solo Mode
					</div>
				</div>

				<div class="brutal-border bg-white px-3 py-1 font-black text-sm">
					Round {currentRound} Results
				</div>
			</div>
		</header>

		<main class="grow pt-24 pb-10 px-4 flex items-center justify-center">
			<div class="w-full max-w-6xl grid lg:grid-cols-2 gap-6">
				<Card class="p-0 overflow-hidden">
					<div class="p-5 border-b-4 border-black flex items-center justify-between">
						<h2 class="text-xl font-black uppercase">Round Review</h2>
						<span class="text-sm font-bold text-black/60">Round {currentRound}</span>
					</div>
					<div class="h-[360px]">
						<Map
							readonly
							guessLocation={reviewResult.guessLat !== null && reviewResult.guessLng !== null
								? { lat: reviewResult.guessLat, lng: reviewResult.guessLng }
								: undefined}
							showActualLocation={{ lat: reviewResult.actualLat, lng: reviewResult.actualLng }}
						/>
					</div>
					<div class="flex justify-between items-center px-5 py-4 border-t-4 border-black">
						<div>
							<div class="text-xs font-bold uppercase opacity-60">Distance</div>
							<div class="text-lg font-black">
								{reviewResult.timedOut ? '—' : formatDistance(reviewResult.distance)}
							</div>
						</div>
						<div class="text-right">
							<div class="text-xs font-bold uppercase opacity-60">Points</div>
							<div class="text-lg font-black">{reviewResult.points}</div>
						</div>
					</div>
				</Card>

				<Card>
					<h2 class="text-xl font-black uppercase mb-4">Round {currentRound}</h2>
					<div class="space-y-3">
						<div class="brutal-border bg-white px-4 py-3">
							<div class="flex items-center justify-between mb-2">
								<div class="text-xs font-bold uppercase opacity-60">Round Score</div>
								<div class="text-xs font-bold">
									{reviewResult.points.toLocaleString()} / {MAX_POINTS_PER_ROUND.toLocaleString()}
								</div>
							</div>
							<div class="brutal-border bg-gray/30 h-4 overflow-hidden">
								<div class="h-full bg-orange" style={`width: ${roundProgress}%;`}></div>
							</div>
							<div class="text-xs opacity-60 mt-2">
								{reviewResult.timedOut ? 'Timed out' : 'Completed'}
							</div>
						</div>
						<div class="brutal-border bg-white px-4 py-3">
							<div class="text-xs font-bold uppercase opacity-60">Score</div>
							<div class="text-2xl font-black">{reviewResult.points}</div>
						</div>
						<div class="brutal-border bg-white px-4 py-3">
							<div class="text-xs font-bold uppercase opacity-60">Distance</div>
							<div class="text-lg font-black">
								{reviewResult.timedOut ? '—' : formatDistance(reviewResult.distance)}
							</div>
						</div>
						<div class="brutal-border bg-white px-4 py-3">
							<div class="flex items-center justify-between mb-2">
								<div class="text-xs font-bold uppercase opacity-60">Total Progress</div>
								<div class="text-xs font-bold">
									{totalEarnedPoints.toLocaleString()} / {totalPossiblePoints.toLocaleString()}
								</div>
							</div>
							<div class="brutal-border bg-gray/30 h-4 overflow-hidden">
								<div class="h-full bg-lime" style={`width: ${totalProgress}%;`}></div>
							</div>
						</div>
					</div>
				</Card>
			</div>
		</main>

		<footer class="bg-white brutal-border border-b-0 border-x-0 flex-shrink-0 py-5">
			<div class="container-brutal flex items-center justify-center">
				<Button variant="black" size="lg" onclick={continueAfterReview}>
					{currentRound < totalRounds ? 'Next Round' : 'View Summary'}
				</Button>
			</div>
		</footer>
	{:else}
		<header class="header-fixed bg-white brutal-border">
			<div class="w-full h-full px-4 md:px-6 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a href="/menu">
						<img src="/logo.png" alt="TigerSpot Logo" class="inline-block w-32 md:w-40" />
					</a>
					<div class="brutal-border bg-orange text-white px-3 py-1 font-bold text-sm">
						Solo Mode
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
						duration={ROUND_SECONDS}
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
				<Button
					variant="black"
					size="lg"
					disabled={!guessCoords || submitting}
					onclick={() => submitRound()}
				>
					{currentRound < totalRounds ? 'Next Round' : 'Finish'}
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
