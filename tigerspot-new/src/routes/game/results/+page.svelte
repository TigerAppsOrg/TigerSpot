<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import ScoreDisplay from '$lib/components/ScoreDisplay.svelte';
	import Map from '$lib/components/Map.svelte';
	import { dummyUser } from '$lib/data/dummy';
	import { formatDistance } from '$lib/utils/distance';

	const MAPBOX_TOKEN = import.meta.env.PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

	// Get results from URL params
	const params = $page.url.searchParams;
	const guessLat = parseFloat(params.get('lat') || '0');
	const guessLng = parseFloat(params.get('lng') || '0');
	const actualLat = parseFloat(params.get('actualLat') || '0');
	const actualLng = parseFloat(params.get('actualLng') || '0');
	const distance = parseFloat(params.get('distance') || '0');
	const points = parseInt(params.get('points') || '0');
	const placeName = params.get('place') || 'Unknown Location';

	const guessLocation = { lat: guessLat, lng: guessLng };
	const actualLocation = { lat: actualLat, lng: actualLng };

	// Determine score quality
	const scoreQuality = $derived.by(() => {
		if (points >= 1000) return { text: 'PERFECT!', color: 'lime', emoji: '&#x1F3AF;' };
		if (points >= 800) return { text: 'AMAZING!', color: 'cyan', emoji: '&#x1F929;' };
		if (points >= 500) return { text: 'GREAT!', color: 'orange', emoji: '&#x1F60E;' };
		if (points >= 200) return { text: 'GOOD', color: 'magenta', emoji: '&#x1F44D;' };
		return { text: 'TRY AGAIN', color: 'white', emoji: '&#x1F914;' };
	});

	// Dummy streak increment
	const newStreak = dummyUser.currentStreak + 1;
</script>

<svelte:head>
	<title>Results - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary">
	<!-- Fixed Header -->
	<header class="header-fixed bg-white brutal-border">
		<div class="w-full h-full px-6 flex items-center justify-between">
			<a href="/menu" class="text-2xl font-black tracking-tight">
				TIGERSPOT
			</a>
			<span class="font-bold uppercase text-sm opacity-60">Daily Challenge Complete</span>
		</div>
	</header>

	<main class="pt-24 pb-12 px-4">
		<div class="container-brutal">
			<!-- Result Header -->
			<div class="text-center mb-12">
				<div class="text-7xl mb-6">{@html scoreQuality.emoji}</div>
				<h1 class="text-4xl md:text-6xl font-black mb-4" style="color: var(--color-{scoreQuality.color})">
					{scoreQuality.text}
				</h1>
				<p class="text-xl opacity-80">
					The location was <strong>{placeName}</strong>
				</p>
			</div>

			<!-- Score Cards -->
			<div class="grid md:grid-cols-3 gap-8 mb-12 max-w-3xl mx-auto">
				<Card variant="cyan" class="text-center py-8">
					<ScoreDisplay score={points} label="Points Earned" size="lg" />
				</Card>

				<Card variant="orange" class="text-center py-8">
					<div class="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">
						Distance
					</div>
					<div class="text-4xl font-black">
						{formatDistance(distance)}
					</div>
				</Card>

				<Card variant="lime" class="text-center py-8">
					<div class="text-sm font-bold uppercase tracking-widest opacity-60 mb-2">
						Streak
					</div>
					<div class="text-4xl font-black">
						{newStreak} days
					</div>
				</Card>
			</div>

			<!-- Map showing both locations -->
			<Card class="mb-10 p-0 overflow-hidden max-w-4xl mx-auto">
				<div class="p-5 border-b-4 border-black">
					<h2 class="text-xl font-black uppercase">Your Guess vs Actual Location</h2>
				</div>
				<div class="h-[400px]">
					{#if MAPBOX_TOKEN && MAPBOX_TOKEN !== 'YOUR_MAPBOX_TOKEN'}
						<Map
							accessToken={MAPBOX_TOKEN}
							readonly
							guessLocation={guessLocation}
							showActualLocation={actualLocation}
						/>
					{:else}
						<div class="w-full h-full bg-gray flex items-center justify-center">
							<div class="text-center p-8">
								<div class="text-6xl mb-6">&#x1F5FA;&#xFE0F;</div>
								<p class="font-bold uppercase opacity-60 mb-4">Map Placeholder</p>
								<div class="flex gap-6 justify-center text-sm">
									<div class="brutal-border brutal-shadow-sm bg-magenta text-white px-4 py-2 font-bold">
										Your Guess
									</div>
									<div class="brutal-border brutal-shadow-sm bg-lime px-4 py-2 font-bold">
										Actual Location
									</div>
								</div>
								<p class="text-xs opacity-40 mt-6">
									Distance: {formatDistance(distance)}
								</p>
							</div>
						</div>
					{/if}
				</div>
			</Card>

			<!-- Legend -->
			<div class="flex justify-center gap-8 mb-12 text-sm">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 bg-magenta brutal-border flex items-center justify-center">
						<span class="text-white text-xs font-bold">?</span>
					</div>
					<span class="font-bold">Your Guess</span>
				</div>
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 bg-lime brutal-border flex items-center justify-center">
						<span class="text-black text-xs font-bold">&#x2713;</span>
					</div>
					<span class="font-bold">Actual Location</span>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex flex-wrap justify-center gap-6 mb-16">
				<Button variant="cyan" size="lg" href="/menu">
					Back to Menu
				</Button>
				<Button variant="white" size="lg" onclick={() => {
					alert('Share feature coming soon!');
				}}>
					&#x1F4E4; Share Score
				</Button>
				<Button variant="black" size="lg" href="/leaderboard">
					&#x1F4CA; View Leaderboard
				</Button>
			</div>

			<!-- Daily stats -->
			<Card class="max-w-md mx-auto">
				<h3 class="text-xl font-black uppercase mb-6 text-center">Today's Stats</h3>
				<div class="space-y-4">
					<div class="flex justify-between items-center py-3 border-b-2 border-black/20">
						<span class="opacity-60 font-medium">Games Played Today</span>
						<span class="font-black text-lg">1</span>
					</div>
					<div class="flex justify-between items-center py-3 border-b-2 border-black/20">
						<span class="opacity-60 font-medium">Total Points Today</span>
						<span class="font-black text-lg">{points.toLocaleString()}</span>
					</div>
					<div class="flex justify-between items-center py-3 border-b-2 border-black/20">
						<span class="opacity-60 font-medium">Current Streak</span>
						<span class="font-black text-lg text-orange">{newStreak} days</span>
					</div>
					<div class="flex justify-between items-center py-3">
						<span class="opacity-60 font-medium">All-Time Points</span>
						<span class="font-black text-lg">{(dummyUser.totalPoints + points).toLocaleString()}</span>
					</div>
				</div>
			</Card>
		</div>
	</main>
</div>
