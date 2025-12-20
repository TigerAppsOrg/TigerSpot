<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Map from '$lib/components/Map.svelte';
	import { formatDistance } from '$lib/utils/distance';
	import { soloResults, type SoloResults } from '$lib/stores/soloResults';

	let results = $state<SoloResults | null>(get(soloResults));
	let selectedRoundIndex = $state(0);
	const MAX_POINTS_PER_ROUND = 1500;

	onMount(() => {
		if (!results) {
			goto('/solo');
		}
	});

	const currentRound = $derived(results?.rounds[selectedRoundIndex] ?? null);
	const totalPoints = $derived(results?.totalPoints ?? 0);
	const totalPossiblePoints = $derived(results ? results.rounds.length * MAX_POINTS_PER_ROUND : 0);
	const totalProgress = $derived.by(() =>
		totalPossiblePoints > 0
			? Math.min(100, Math.round((totalPoints / totalPossiblePoints) * 100))
			: 0
	);
</script>

<svelte:head>
	<title>Solo Results - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<div class="absolute inset-0 bg-stripes opacity-20"></div>

	<Header />

	<main class="relative pt-24 pb-12 px-4">
		<div class="container-brutal max-w-5xl mx-auto">
			{#if results}
				<div class="text-center mb-8">
					<Icon name="target" class="text-6xl mb-4" />
					<h1 class="text-4xl md:text-5xl font-black mb-2">Solo Results</h1>
					<p class="text-black/60">Nice run! Here's how you did.</p>
				</div>

				<div class="grid md:grid-cols-3 gap-6 mb-8">
					<Card variant="cyan" class="text-center py-4">
						<div class="text-xs font-bold uppercase opacity-60 mb-1">Total Points</div>
						<div class="text-3xl font-black">{totalPoints.toLocaleString()}</div>
					</Card>
					<Card variant="orange" class="text-center py-4">
						<div class="text-xs font-bold uppercase opacity-60 mb-1">Rounds</div>
						<div class="text-3xl font-black">{results.rounds.length}</div>
					</Card>
					<Card variant="lime" class="text-center py-4">
						<div class="text-xs font-bold uppercase opacity-60 mb-1">Avg Points</div>
						<div class="text-3xl font-black">
							{Math.round(totalPoints / Math.max(1, results.rounds.length)).toLocaleString()}
						</div>
					</Card>
				</div>

				<Card class="mb-8">
					<div class="flex items-center justify-between mb-3">
						<div class="text-xs font-bold uppercase opacity-60">Total Progress</div>
						<div class="text-xs font-bold">
							{totalPoints.toLocaleString()} / {totalPossiblePoints.toLocaleString()}
						</div>
					</div>
					<div class="brutal-border bg-gray/30 h-5 overflow-hidden">
						<div class="h-full bg-orange" style={`width: ${totalProgress}%;`}></div>
					</div>
				</Card>

				<div class="grid lg:grid-cols-2 gap-6 mb-10">
					<Card class="p-0 overflow-hidden">
						<div class="p-5 border-b-4 border-black flex items-center justify-between">
							<h2 class="text-xl font-black uppercase">Round Review</h2>
							<span class="text-sm font-bold opacity-60">
								Round {selectedRoundIndex + 1}
							</span>
						</div>
						{#if currentRound}
							<div class="h-[320px]">
								{#key selectedRoundIndex}
									<Map
										readonly
										guessLocation={currentRound.guessLat !== null && currentRound.guessLng !== null
											? { lat: currentRound.guessLat, lng: currentRound.guessLng }
											: undefined}
										showActualLocation={{
											lat: currentRound.actualLat,
											lng: currentRound.actualLng
										}}
									/>
								{/key}
							</div>
							<div class="flex justify-between items-center px-5 py-4 border-t-4 border-black">
								<div>
									<div class="text-xs font-bold uppercase opacity-60">Distance</div>
									<div class="text-lg font-black">
										{currentRound.timedOut ? '—' : formatDistance(currentRound.distance)}
									</div>
								</div>
								<div class="text-right">
									<div class="text-xs font-bold uppercase opacity-60">Points</div>
									<div class="text-lg font-black">{currentRound.points}</div>
								</div>
							</div>
						{/if}
					</Card>

					<Card>
						<h2 class="text-xl font-black uppercase mb-4">Rounds</h2>
						<div class="space-y-3">
							{#each results.rounds as round, i}
								<button
									onclick={() => (selectedRoundIndex = i)}
									class="w-full brutal-border px-4 py-3 text-left flex items-center justify-between {selectedRoundIndex ===
									i
										? 'bg-cyan/20'
										: 'bg-white hover:bg-gray/30'}"
								>
									<div>
										<div class="font-bold">Round {i + 1}</div>
										<div class="text-xs opacity-60">
											{round.timedOut ? 'Timed out' : formatDistance(round.distance)}
										</div>
									</div>
									<div class="font-black">{round.points}</div>
								</button>
							{/each}
						</div>
					</Card>
				</div>

				<div class="flex flex-wrap justify-center gap-4">
					<Button variant="cyan" href="/solo">Play Again</Button>
					<Button variant="white" href="/menu">Back to Menu</Button>
				</div>
			{/if}
		</div>
	</main>
</div>
