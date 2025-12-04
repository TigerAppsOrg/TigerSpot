<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import Map from '$lib/components/Map.svelte';
	import { dummyPictures } from '$lib/data/dummy';
	import { calculateDistance, calculateDailyPoints } from '$lib/utils/distance';
	import { gameResults } from '$lib/stores/gameResults';

	// Use first dummy picture for the daily challenge
	const picture = dummyPictures[0];

	// You'll need to set your Mapbox token here or via env
	const MAPBOX_TOKEN = import.meta.env.PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

	let guessCoords = $state<{ lat: number; lng: number } | null>(null);

	function handleMapSelect(coords: { lat: number; lng: number }) {
		guessCoords = coords;
	}

	function submitGuess() {
		if (!guessCoords) return;

		// Calculate score
		const distance = calculateDistance(
			guessCoords.lat,
			guessCoords.lng,
			picture.latitude,
			picture.longitude
		);
		const points = calculateDailyPoints(distance);

		// Store results in store
		gameResults.set({
			guessLat: guessCoords.lat,
			guessLng: guessCoords.lng,
			actualLat: picture.latitude,
			actualLng: picture.longitude,
			distance,
			points
		});

		goto('/game/results');
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
							src={picture.imageUrl}
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
						{#if MAPBOX_TOKEN && MAPBOX_TOKEN !== 'YOUR_MAPBOX_TOKEN'}
							<Map
								accessToken={MAPBOX_TOKEN}
								onSelect={handleMapSelect}
								guessLocation={guessCoords ?? undefined}
							/>
						{:else}
							<!-- Placeholder when no token -->
							<div class="w-full h-full bg-gray flex items-center justify-center">
								<div class="text-center p-8">
									<div class="text-6xl mb-6">&#x1F5FA;&#xFE0F;</div>
									<p class="font-bold uppercase opacity-60 mb-6">Map Placeholder</p>
									<p class="text-sm opacity-40 mb-6">Set PUBLIC_MAPBOX_TOKEN to enable</p>
									<button
										onclick={() => {
											guessCoords = { lat: 40.3445, lng: -74.6567 };
										}}
										class="btn-brutal btn-cyan text-sm"
									>
										Simulate Click
									</button>
								</div>
							</div>
						{/if}
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
			<Button variant="black" size="lg" disabled={!guessCoords} onclick={submitGuess}>
				Submit Guess
			</Button>
		</div>
	</footer>
</div>
