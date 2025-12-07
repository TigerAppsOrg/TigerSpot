<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import PlayerChip from '$lib/components/PlayerChip.svelte';
	import ChallengeCard from '$lib/components/ChallengeCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import {
		getAvailablePlayers,
		getChallenges,
		createChallenge,
		sendHeartbeat,
		acceptChallenge as apiAcceptChallenge,
		declineChallenge as apiDeclineChallenge,
		cancelChallenge as apiCancelChallenge,
		forfeitMatch as apiForfeitMatch,
		type Player,
		type Challenge
	} from '$lib/api/versus';
	import { userStore } from '$lib/stores/user.svelte';

	let players = $state<Player[]>([]);
	let receivedChallenges = $state<Challenge[]>([]);
	let sentChallenges = $state<Challenge[]>([]);
	let activeMatches = $state<Challenge[]>([]);
	let completedMatches = $state<Challenge[]>([]);
	let loading = $state(true);

	let pollInterval: ReturnType<typeof setInterval> | null = null;
	const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds

	onMount(async () => {
		// Redirect to login if not authenticated
		if (!userStore.isAuthenticated && !userStore.loading) {
			goto('/');
			return;
		}
		await loadData();
		startPolling();
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	function startPolling() {
		// Poll for updates every 5 seconds
		pollInterval = setInterval(async () => {
			await refreshData();
		}, POLL_INTERVAL_MS);
	}

	async function loadData() {
		loading = true;
		// Send heartbeat when loading data
		await sendHeartbeat();
		const [playersData, challengesData] = await Promise.all([
			getAvailablePlayers(),
			getChallenges()
		]);
		players = playersData;
		receivedChallenges = challengesData.received;
		sentChallenges = challengesData.sent;
		activeMatches = challengesData.active;
		completedMatches = challengesData.completed;
		loading = false;
	}

	// Refresh without showing loading state
	async function refreshData() {
		// Send heartbeat on every refresh to maintain presence
		await sendHeartbeat();
		const [playersData, challengesData] = await Promise.all([
			getAvailablePlayers(),
			getChallenges()
		]);
		players = playersData;
		receivedChallenges = challengesData.received;
		sentChallenges = challengesData.sent;
		activeMatches = challengesData.active;
		completedMatches = challengesData.completed;
	}

	async function challengePlayer(username: string) {
		const newChallenge = await createChallenge(username);
		if (newChallenge) {
			sentChallenges = [...sentChallenges, newChallenge];
		}
	}

	async function handleAcceptChallenge(id: number) {
		const success = await apiAcceptChallenge(id);
		if (success) {
			const challenge = receivedChallenges.find((c) => c.id === id);
			if (challenge) {
				receivedChallenges = receivedChallenges.filter((c) => c.id !== id);
				activeMatches = [...activeMatches, { ...challenge, status: 'accepted' }];
			}
		}
	}

	async function handleDeclineChallenge(id: number) {
		const success = await apiDeclineChallenge(id);
		if (success) {
			receivedChallenges = receivedChallenges.filter((c) => c.id !== id);
		}
	}

	async function handleCancelChallenge(id: number) {
		const success = await apiCancelChallenge(id);
		if (success) {
			sentChallenges = sentChallenges.filter((c) => c.id !== id);
		}
	}

	async function handleForfeitMatch(id: number) {
		if (!confirm('Are you sure you want to forfeit this match? Your opponent will win.')) {
			return;
		}
		const success = await apiForfeitMatch(id);
		if (success) {
			activeMatches = activeMatches.filter((m) => m.id !== id);
			// Refresh to get updated completed matches
			await refreshData();
		}
	}

	function startGame(id: number) {
		goto(`/versus/play/${id}`);
	}
</script>

<svelte:head>
	<title>Versus Mode - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<!-- Dots pattern overlay -->
	<div class="absolute inset-0 bg-dots opacity-20"></div>

	<Header />

	<main class="relative pt-24 pb-12 px-4">
		<div class="container-brutal max-w-6xl mx-auto">
			<!-- Header -->
			<div class="text-center mb-10 mt-8">
				<div class="text-5xl mb-4">⚔️</div>
				<h1 class="text-4xl font-black mb-2">Versus Mode</h1>
				<p class="text-black/60">Challenge friends to 5-round battles!</p>
			</div>

			<div class="grid lg:grid-cols-2 gap-8">
				<!-- Left Column -->
				<div class="space-y-8">
					<!-- Players Pool -->
					<Card variant="cyan">
						<h2 class="text-2xl font-black mb-6">Available Players</h2>
						{#if loading}
							<div class="text-center py-4">Loading players...</div>
						{:else if players.length > 0}
							<div class="flex flex-wrap gap-3">
								{#each players as player}
									<PlayerChip
										username={player.displayName || player.username}
										clickable
										onclick={() => challengePlayer(player.username)}
										class="brutal-shadow-sm"
									/>
								{/each}
							</div>
							<p class="text-sm opacity-70 mt-4">Click a player to challenge them</p>
						{:else}
							<EmptyState message="No players available" size="sm" />
						{/if}
					</Card>

					<!-- Active Matches -->
					{#if activeMatches.length > 0}
						<Card variant="orange">
							<h2 class="text-2xl font-black mb-6">Active Matches</h2>
							<div class="space-y-4">
								{#each activeMatches as match}
									<ChallengeCard
										opponent={match.opponentDisplayName || match.opponent}
										createdAt={new Date(match.createdAt)}
										status="active"
										onStart={() => startGame(match.id)}
										onForfeit={() => handleForfeitMatch(match.id)}
									/>
								{/each}
							</div>
						</Card>
					{/if}
				</div>

				<!-- Right Column -->
				<div class="space-y-8">
					<!-- Received Challenges -->
					<Card variant="magenta">
						<h2 class="text-2xl font-black mb-6">Challenges Received</h2>
						{#if receivedChallenges.length > 0}
							<div class="space-y-4">
								{#each receivedChallenges as challenge}
									<ChallengeCard
										opponent={challenge.opponentDisplayName || challenge.opponent}
										createdAt={new Date(challenge.createdAt)}
										status="pending"
										onAccept={() => handleAcceptChallenge(challenge.id)}
										onDecline={() => handleDeclineChallenge(challenge.id)}
									/>
								{/each}
							</div>
						{:else}
							<EmptyState message="No pending challenges" size="sm" />
						{/if}
					</Card>

					<!-- Sent Challenges -->
					<Card>
						<h2 class="text-2xl font-black mb-6">Challenges Sent</h2>
						{#if sentChallenges.length > 0}
							<div class="space-y-3">
								{#each sentChallenges as challenge}
									<ChallengeCard
										opponent={challenge.opponentDisplayName || challenge.opponent}
										createdAt={new Date(challenge.createdAt)}
										status="sent"
										onCancel={() => handleCancelChallenge(challenge.id)}
									/>
								{/each}
							</div>
						{:else}
							<EmptyState message="No outgoing challenges" size="sm" />
						{/if}
					</Card>
				</div>
			</div>

			<!-- Completed Matches -->
			{#if completedMatches.length > 0}
				<Card class="mt-8">
					<h2 class="text-2xl font-black mb-6">Recent Results</h2>
					<div class="space-y-3">
						{#each completedMatches as match}
							{@const won =
								match.yourScore !== undefined &&
								match.theirScore !== undefined &&
								match.yourScore > match.theirScore}
							<div
								class="brutal-border p-4 flex items-center justify-between gap-4 {won
									? 'bg-lime/20'
									: 'bg-gray/30'} flex-wrap"
							>
								<div class="flex items-center gap-3">
									<span class="text-2xl">{won ? '🏆' : '💔'}</span>
									<div>
										<div class="font-black">
											{won ? 'Victory' : 'Defeat'} vs {match.opponentDisplayName || match.opponent}
										</div>
										<div class="text-sm">
											<span class="font-bold">{match.yourScore ?? 0}</span> -
											<span class="font-bold">{match.theirScore ?? 0}</span>
										</div>
									</div>
								</div>
								<Button variant="white" href={`/versus/results/${match.id}`}>View Details</Button>
							</div>
						{/each}
					</div>
				</Card>
			{/if}

			<!-- Back to Menu -->
			<div class="text-center mt-10">
				<Button variant="white" href="/menu">Back to Menu</Button>
			</div>
		</div>
	</main>
</div>
