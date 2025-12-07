<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import Map from '$lib/components/Map.svelte';
	import {
		getTodayChallenge,
		submitDailyGuess,
		getTodayResult,
		startDailyChallenge,
		type DailyChallenge
	} from '$lib/api/game';
	import { gameResults } from '$lib/stores/gameResults';
	import { userStore } from '$lib/stores/user.svelte';

	let challenge = $state<DailyChallenge | null>(null);
	let loading = $state(true);
	let submitting = $state(false);
	let guessCoords = $state<{ lat: number; lng: number } | null>(null);
	let mapComponent: Map;
	let timerComponent: Timer;

	// Anti-cheat timer state
	let remainingSeconds = $state(120);
	let challengeReady = $state(false);

	// Image modal state
	let showImageModal = $state(false);

	onMount(async () => {
		// Redirect to login if not authenticated
		if (!userStore.isAuthenticated && !userStore.loading) {
			goto('/');
			return;
		}

		// Load today's challenge
		challenge = await getTodayChallenge();
		loading = false;

		// If already played today, redirect to results page
		if (challenge?.hasPlayed) {
			const result = await getTodayResult();
			if (result) {
				gameResults.set({
					guessLat: result.guessLat,
					guessLng: result.guessLng,
					actualLat: result.actualLat,
					actualLng: result.actualLng,
					distance: result.distance,
					points: result.points,
					timedOut: result.timedOut
				});
				goto('/game/results');
			} else {
				goto('/menu');
			}
			return;
		}

		// Start challenge with server-side timer (anti-cheat)
		if (challenge) {
			const startResult = await startDailyChallenge();
			if (startResult) {
				remainingSeconds = startResult.remainingSeconds;
				// If time already expired, still allow them to play but with 0 time bonus
				if (remainingSeconds <= 0) {
					remainingSeconds = 1; // Give them at least 1 second to submit
				}
			}
			challengeReady = true;
		}
	});

	function handleMapSelect(coords: { lat: number; lng: number }) {
		guessCoords = coords;
	}

	async function submitGuess() {
		if (!guessCoords || submitting) return;

		submitting = true;

		// Submit to backend - it calculates score and returns actual location
		const result = await submitDailyGuess(guessCoords.lat, guessCoords.lng);

		if (result) {
			// Store results for the results page
			gameResults.set({
				guessLat: result.guessLat,
				guessLng: result.guessLng,
				actualLat: result.actualLat,
				actualLng: result.actualLng,
				distance: result.distance,
				points: result.points
			});
			goto('/game/results');
		} else {
			submitting = false;
			alert('Failed to submit guess. Please try again.');
		}
	}

	function handleTimeUp() {
		if (guessCoords) {
			submitGuess();
		} else {
			// Time ran out without a guess - submit with default location (0 points)
			submitWithNoGuess();
		}
	}

	async function submitWithNoGuess() {
		if (submitting) return;
		submitting = true;

		// Submit as timeout - won't affect streak
		const result = await submitDailyGuess(0, 0, true);

		if (result) {
			gameResults.set({
				guessLat: result.guessLat,
				guessLng: result.guessLng,
				actualLat: result.actualLat,
				actualLng: result.actualLng,
				distance: result.distance,
				points: result.points,
				timedOut: true
			});
			goto('/game/results');
		} else {
			submitting = false;
			alert('Failed to submit. Please try again.');
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
	<title>Daily Challenge - TigerSpot</title>
</svelte:head>

{#if loading || !challengeReady}
	<div class="min-h-screen bg-primary flex items-center justify-center">
		<div class="text-center">
			<div class="text-4xl mb-4">🐯</div>
			<p class="font-bold">Loading today's challenge...</p>
		</div>
	</div>
{:else if !challenge}
	<div class="min-h-screen bg-primary flex items-center justify-center">
		<Card class="text-center max-w-md">
			<div class="text-4xl mb-4">😿</div>
			<h2 class="text-xl font-bold mb-4">No Challenge Available</h2>
			<p class="mb-6">There's no daily challenge available right now. Check back later!</p>
			<Button href="/menu">Back to Menu</Button>
		</Card>
	</div>
{:else}
	<div class="min-h-screen bg-primary flex flex-col">
		<!-- Fixed Header -->
		<header class="header-fixed bg-white brutal-border">
			<div class="w-full h-full px-4 md:px-6 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a href="/menu">
						<img src="/logo.png" alt="TigerSpot Logo" class="inline-block w-32 md:w-40" />
					</a>
					<div class="brutal-border bg-orange text-white px-3 py-1 font-bold text-sm">
						Daily Challenge
					</div>
				</div>
				<Timer
					bind:this={timerComponent}
					duration={120}
					initialRemaining={remainingSeconds}
					onComplete={handleTimeUp}
				/>
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
						</div>
						<div
							class="relative bg-white w-full overflow-hidden flex items-center justify-center h-[40vh] lg:h-[50vh]"
						>
							<img
								src={challenge.imageUrl}
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

		<!-- Submit Bar -->
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
					onclick={submitGuess}
				>
					{submitting ? 'Submitting...' : 'Submit Guess'}
				</Button>
			</div>
		</footer>
	</div>

	<!-- Image Modal -->
	{#if showImageModal}
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
					src={challenge.imageUrl}
					alt="Where is this location?"
					class="max-w-full max-h-[85vh] object-contain"
				/>
			</div>
		</div>
	{/if}
{/if}
