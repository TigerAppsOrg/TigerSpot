<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import Map from '$lib/components/Map.svelte';
	import { getTodayChallenge, submitDailyGuess, type DailyChallenge } from '$lib/api/game';
	import { gameResults } from '$lib/stores/gameResults';
	import { userStore } from '$lib/stores/user.svelte';

	let challenge = $state<DailyChallenge | null>(null);
	let loading = $state(true);
	let submitting = $state(false);
	let guessCoords = $state<{ lat: number; lng: number } | null>(null);

	onMount(async () => {
		// Redirect to login if not authenticated
		if (!userStore.isAuthenticated && !userStore.loading) {
			goto('/');
			return;
		}

		// Load today's challenge
		challenge = await getTodayChallenge();
		loading = false;

		// If already played today, redirect to results
		if (challenge?.hasPlayed) {
			goto('/menu');
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
		}
	}
</script>

<svelte:head>
	<title>Daily Challenge - TigerSpot</title>
</svelte:head>

{#if loading}
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
			<div class="w-full h-full px-6 flex items-center justify-between">
				<a href="/menu">
					<img src="/logo.png" alt="TigerSpot Logo" class="inline-block w-40" />
				</a>
				<Timer duration={120} onComplete={handleTimeUp} />
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
						<div class="relative grow bg-gray w-full block min-h-[300px]">
							<img
								src={challenge.imageUrl}
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
				<div class="text-sm opacity-60">
					{#if guessCoords}
						<span class="font-mono font-bold">
							{guessCoords.lat.toFixed(4)}, {guessCoords.lng.toFixed(4)}
						</span>
					{:else}
						Click on the map to place your guess
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
{/if}
