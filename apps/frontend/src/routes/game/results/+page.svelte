<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Map from '$lib/components/Map.svelte';
	import { formatDistance } from '$lib/utils/distance';
	import { gameResults, type GameResults } from '$lib/stores/gameResults';
	import { getTodayResult } from '$lib/api/game';
	import { userStore } from '$lib/stores/user.svelte';
	import { get } from 'svelte/store';

	// Get results from store or fetch from API
	let results = $state<GameResults | null>(get(gameResults));
	let loading = $state(!results);

	onMount(async () => {
		// If no results in store, try to fetch from API
		if (!results) {
			const apiResult = await getTodayResult();
			if (apiResult) {
				results = {
					guessLat: apiResult.guessLat,
					guessLng: apiResult.guessLng,
					actualLat: apiResult.actualLat,
					actualLng: apiResult.actualLng,
					distance: apiResult.distance,
					points: apiResult.points,
					timedOut: apiResult.timedOut
				};
				gameResults.set(results);
			} else {
				// No results available, redirect to menu
				goto('/menu');
				return;
			}
		}
		loading = false;
	});

	const timedOut = $derived(results?.timedOut ?? false);
	const guessLocation = $derived(
		results && results.guessLat !== null && results.guessLng !== null
			? { lat: results.guessLat, lng: results.guessLng }
			: null
	);
	const actualLocation = $derived(
		results ? { lat: results.actualLat, lng: results.actualLng } : { lat: 0, lng: 0 }
	);
	const distance = $derived(results?.distance ?? 0);
	const points = $derived(results?.points ?? 0);

	// Determine score quality
	const scoreQuality = $derived.by(() => {
		if (timedOut) return { text: 'TIMED OUT', color: 'magenta', emoji: '⏰' };
		if (points >= 1000) return { text: 'PERFECT!', color: 'lime', emoji: '🎯' };
		if (points >= 800) return { text: 'AMAZING!', color: 'cyan', emoji: '🤩' };
		if (points >= 500) return { text: 'GREAT!', color: 'orange', emoji: '😎' };
		if (points >= 200) return { text: 'GOOD', color: 'magenta', emoji: '👍' };
		return { text: 'TRY AGAIN', color: 'magenta', emoji: '🤔' };
	});

	// Get current streak from user data
	const currentStreak = $derived(userStore.user?.currentStreak ?? 0);
	const newStreak = $derived(currentStreak);
</script>

<svelte:head>
	<title>Results - TigerSpot</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen bg-primary flex items-center justify-center">
		<div class="text-center">
			<div class="text-4xl mb-4">🐯</div>
			<p class="font-bold">Loading results...</p>
		</div>
	</div>
{:else}
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
						<div class="text-2xl font-black">{timedOut ? '-' : points.toLocaleString()}</div>
					</Card>

					<Card variant="orange" class="text-center py-2">
						<div class="text-xs font-bold uppercase tracking-wide text-white/60 mb-1">Distance</div>
						<div class="text-2xl font-black">{timedOut ? '-' : formatDistance(distance)}</div>
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
							<h2 class="text-lg font-black uppercase">
								{timedOut ? 'Actual Location' : 'Your Guess vs Actual Location'}
							</h2>
						</div>
						<div class="h-[350px]">
							<Map
								readonly
								guessLocation={guessLocation ?? undefined}
								showActualLocation={actualLocation}
							/>
						</div>
						<!-- Legend -->
						<div class="flex justify-center gap-6 py-3 border-t-4 border-black text-sm">
							{#if !timedOut}
								<div class="flex items-center gap-2">
									<div class="w-6 h-6 bg-magenta brutal-border flex items-center justify-center">
										<span class="text-white text-xs font-bold">?</span>
									</div>
									<span class="font-bold">Your Guess</span>
								</div>
							{/if}
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
								<span class="opacity-60 text-sm">Status</span>
								<span class="font-black">{timedOut ? 'Timed Out' : 'Completed'}</span>
							</div>
							<div class="flex justify-between items-center py-2 border-b-2 border-black/20">
								<span class="opacity-60 text-sm">Points Today</span>
								<span class="font-black">{timedOut ? '-' : points.toLocaleString()}</span>
							</div>
							<div class="flex justify-between items-center py-2 border-b-2 border-black/20">
								<span class="opacity-60 text-sm">Current Streak</span>
								<span class="font-black text-orange">{newStreak} days</span>
							</div>
							<div class="flex justify-between items-center py-2">
								<span class="opacity-60 text-sm">All-Time Points</span>
								<span class="font-black"
									>{(
										(userStore.user?.totalPoints ?? 0) + (timedOut ? 0 : points)
									).toLocaleString()}</span
								>
							</div>
						</div>
					</Card>
				</div>

				<!-- Actions -->
				<div class="flex flex-wrap justify-center gap-4">
					<Button variant="cyan" href="/menu">Back to Menu</Button>
					<Button variant="black" href="/leaderboard">📊 Leaderboard</Button>
				</div>
			</div>
		</main>
	</div>
{/if}
