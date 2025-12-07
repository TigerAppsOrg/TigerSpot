<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import { getTournament, leaveTournament, type TournamentDetails } from '$lib/api/tournament';
	import { userStore } from '$lib/stores/user.svelte';

	const tournamentId = parseInt($page.params.id ?? '');

	let tournament = $state<TournamentDetails | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let leaving = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Check if current user is a participant
	const isParticipant = $derived.by(() => {
		if (!tournament || !userStore.user) return false;
		return tournament.participants.some((p) => p.username === userStore.user?.username);
	});

	onMount(async () => {
		if (isNaN(tournamentId)) {
			error = 'Invalid tournament ID';
			loading = false;
			return;
		}

		await loadTournament();

		// Start polling for updates every 5 seconds
		pollInterval = setInterval(async () => {
			await loadTournament();
		}, 5000);
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	async function loadTournament() {
		const result = await getTournament(tournamentId);
		if (result) {
			tournament = result;

			// If tournament has started, redirect to bracket page
			if (result.status === 'in_progress' || result.status === 'completed') {
				if (pollInterval) clearInterval(pollInterval);
				goto(`/tournament/${tournamentId}`);
				return;
			}

			// If tournament is no longer open (cancelled), go back to list
			if (result.status !== 'open') {
				if (pollInterval) clearInterval(pollInterval);
				goto('/tournament');
				return;
			}
		} else if (!tournament) {
			error = 'Failed to load tournament';
		}

		loading = false;
	}

	async function handleLeave() {
		if (leaving) return;
		leaving = true;

		const success = await leaveTournament(tournamentId);
		if (success) {
			if (pollInterval) clearInterval(pollInterval);
			goto('/tournament');
		} else {
			alert('Failed to leave tournament');
		}

		leaving = false;
	}
</script>

<svelte:head>
	<title>{tournament?.name || 'Waiting Room'} - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<!-- Diamond pattern overlay (tournament theme) -->
	<div class="absolute inset-0 bg-diamonds opacity-[0.03]"></div>

	<Header />

	<main class="relative pt-24 pb-12 px-4">
		<div class="container-brutal max-w-2xl mx-auto">
			{#if loading}
				<div class="text-center py-16">
					<div class="text-4xl mb-4">🏆</div>
					<p class="font-bold">Loading...</p>
				</div>
			{:else if error}
				<Card class="text-center py-16">
					<div class="text-4xl mb-4">❌</div>
					<p class="font-bold text-magenta mb-4">{error}</p>
					<Button variant="white" href="/tournament">Back to Tournaments</Button>
				</Card>
			{:else if tournament}
				<!-- Waiting Room Header -->
				<div class="text-center mb-8">
					<div class="text-6xl mb-4">⏳</div>
					<h1 class="text-3xl font-black mb-2">{tournament.name}</h1>
					<p class="text-black/60">Waiting for the tournament to start...</p>
				</div>

				<!-- Pulse animation indicator -->
				<div class="flex justify-center mb-8">
					<div class="flex items-center gap-3 brutal-border bg-white px-6 py-3">
						<div class="relative">
							<div class="w-3 h-3 bg-orange rounded-full animate-pulse"></div>
							<div
								class="absolute inset-0 w-3 h-3 bg-orange rounded-full animate-ping opacity-75"
							></div>
						</div>
						<span class="font-bold">Waiting for admin to start</span>
					</div>
				</div>

				<!-- Player List -->
				<Card class="mb-8">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-xl font-black uppercase">Players Joined</h2>
						<span class="brutal-border bg-cyan text-white px-3 py-1 font-bold">
							{tournament.participants.length}
							{#if tournament.maxParticipants}
								/ {tournament.maxParticipants}
							{/if}
						</span>
					</div>

					{#if tournament.participants.length === 0}
						<p class="text-center text-black/60 py-8">No players yet...</p>
					{:else}
						<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
							{#each tournament.participants as participant, i}
								<div
									class="brutal-border px-4 py-3 {participant.username === userStore.user?.username
										? 'bg-lime'
										: 'bg-white'}"
								>
									<div class="flex items-center gap-2">
										<span class="text-sm font-bold text-black/40">#{i + 1}</span>
										<span class="font-bold truncate">
											{participant.displayName}
											{#if participant.username === userStore.user?.username}
												<span class="text-xs">(you)</span>
											{/if}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card>

				<!-- Tournament Info -->
				<Card class="mb-8">
					<h3 class="text-sm font-bold uppercase text-black/60 mb-4">Tournament Details</h3>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="text-black/60">Time per round:</span>
							<span class="font-bold ml-2">{tournament.timeLimit}s</span>
						</div>
						<div>
							<span class="text-black/60">Rounds per match:</span>
							<span class="font-bold ml-2">{tournament.roundsPerMatch}</span>
						</div>
						<div>
							<span class="text-black/60">Format:</span>
							<span class="font-bold ml-2">Double Elimination</span>
						</div>
						<div>
							<span class="text-black/60">Difficulty:</span>
							<span class="font-bold ml-2 capitalize">{tournament.difficulty}</span>
						</div>
					</div>
				</Card>

				<!-- Actions -->
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					{#if isParticipant}
						<Button variant="magenta" onclick={handleLeave} disabled={leaving}>
							{leaving ? 'Leaving...' : 'Leave Tournament'}
						</Button>
					{/if}
					<Button variant="white" href="/tournament">Back to Tournaments</Button>
				</div>
			{/if}
		</div>
	</main>
</div>
