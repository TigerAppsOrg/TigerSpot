<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Map from '$lib/components/Map.svelte';
	import { dummyUser } from '$lib/data/dummy';
	import { formatDistance } from '$lib/utils/distance';
	import { gameResults } from '$lib/stores/gameResults';
	import { get } from 'svelte/store';

	// Get results from store
	const results = get(gameResults);

	// Redirect if no results
	if (!results) {
		goto('/menu');
	}

	const guessLocation = results
		? { lat: results.guessLat, lng: results.guessLng }
		: { lat: 0, lng: 0 };
	const actualLocation = results
		? { lat: results.actualLat, lng: results.actualLng }
		: { lat: 0, lng: 0 };
	const distance = results?.distance ?? 0;
	const points = results?.points ?? 0;

	// Determine score quality
	const scoreQuality = $derived.by(() => {
		if (points >= 1000) return { text: 'PERFECT!', color: 'lime', emoji: '🎯' };
		if (points >= 800) return { text: 'AMAZING!', color: 'cyan', emoji: '🤩' };
		if (points >= 500) return { text: 'GREAT!', color: 'orange', emoji: '😎' };
		if (points >= 200) return { text: 'GOOD', color: 'magenta', emoji: '👍' };
		return { text: 'TRY AGAIN', color: 'magenta', emoji: '🤔' };
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
			<a href="/menu">
				<img src="/logo.png" alt="TigerSpot Logo" class="inline-block w-40" />
			</a>
			<span class="font-bold uppercase text-sm opacity-60">Daily Challenge Complete</span>
		</div>
	</header>

	<main class="pt-24 pb-12 px-4">
		<div class="container-brutal max-w-6xl mx-auto">
			<!-- Result Header -->
			<div class="text-center mb-8">
				<div class="text-6xl mb-4">{scoreQuality.emoji}</div>
				<h1
					class="text-4xl md:text-5xl font-black"
					style="color: var(--color-{scoreQuality.color})"
				>
					{scoreQuality.text}
				</h1>
			</div>

			<!-- Score Cards - Smaller -->
			<div class="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
				<Card variant="cyan" class="text-center py-2">
					<div class="text-xs font-bold uppercase tracking-wide text-white/60 mb-1">Points</div>
					<div class="text-2xl font-black">{points.toLocaleString()}</div>
				</Card>

				<Card variant="orange" class="text-center py-2">
					<div class="text-xs font-bold uppercase tracking-wide text-white/60 mb-1">Distance</div>
					<div class="text-2xl font-black">{formatDistance(distance)}</div>
				</Card>

				<Card variant="lime" class="text-center py-2">
					<div class="text-xs font-bold uppercase tracking-wide opacity-60 mb-1">Streak</div>
					<div class="text-2xl font-black">{newStreak} days</div>
				</Card>
			</div>

			<!-- Map and Stats side by side -->
			<div class="grid lg:grid-cols-3 gap-6 mb-10">
				<!-- Map showing both locations -->
				<Card class="lg:col-span-2 p-0 overflow-hidden">
					<div class="p-4">
						<h2 class="text-lg font-black uppercase">Your Guess vs Actual Location</h2>
					</div>
					<div class="h-[350px]">
						<Map readonly {guessLocation} showActualLocation={actualLocation} />
					</div>
					<!-- Legend -->
					<div class="flex justify-center gap-6 py-3 border-t-4 border-black text-sm">
						<div class="flex items-center gap-2">
							<div class="w-6 h-6 bg-magenta brutal-border flex items-center justify-center">
								<span class="text-white text-xs font-bold">?</span>
							</div>
							<span class="font-bold">Your Guess</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-6 h-6 bg-lime brutal-border flex items-center justify-center">
								<span class="text-black text-xs font-bold">✓</span>
							</div>
							<span class="font-bold">Actual Location</span>
						</div>
					</div>
				</Card>

				<!-- Today's Stats -->
				<Card>
					<h3 class="text-lg font-black uppercase mb-4">Today's Stats</h3>
					<div class="space-y-3">
						<div class="flex justify-between items-center py-2 border-b-2 border-black/20">
							<span class="opacity-60 text-sm">Games Played</span>
							<span class="font-black">1</span>
						</div>
						<div class="flex justify-between items-center py-2 border-b-2 border-black/20">
							<span class="opacity-60 text-sm">Points Today</span>
							<span class="font-black">{points.toLocaleString()}</span>
						</div>
						<div class="flex justify-between items-center py-2 border-b-2 border-black/20">
							<span class="opacity-60 text-sm">Current Streak</span>
							<span class="font-black text-orange">{newStreak} days</span>
						</div>
						<div class="flex justify-between items-center py-2">
							<span class="opacity-60 text-sm">All-Time Points</span>
							<span class="font-black">{(dummyUser.totalPoints + points).toLocaleString()}</span>
						</div>
					</div>
				</Card>
			</div>

			<!-- Actions -->
			<div class="flex flex-wrap justify-center gap-4">
				<Button variant="cyan" href="/menu">Back to Menu</Button>
				<Button variant="white" onclick={() => alert('Share feature coming soon!')}>
					📤 Share Score
				</Button>
				<Button variant="black" href="/leaderboard">📊 Leaderboard</Button>
			</div>
		</div>
	</main>
</div>
