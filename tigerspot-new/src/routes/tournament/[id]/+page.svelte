<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { dev } from '$app/environment';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import Bracket from '$lib/components/Bracket.svelte';
	import { getTournament, type TournamentDetails, type BracketMatch } from '$lib/api/tournament';
	import { simulateMatchWinner } from '$lib/api/admin';
	import { userStore } from '$lib/stores/user.svelte';

	const tournamentId = parseInt($page.params.id ?? '');

	let tournament = $state<TournamentDetails | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let simulating = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	const difficultyColors: Record<string, string> = {
		easy: 'bg-lime',
		medium: 'bg-cyan',
		hard: 'bg-magenta',
		mixed: 'bg-orange'
	};

	const statusColors: Record<string, string> = {
		open: 'bg-white',
		in_progress: 'bg-orange',
		completed: 'bg-lime'
	};

	// Find if current user has an active match
	const userActiveMatch = $derived.by(() => {
		if (!tournament?.bracket || !userStore.user) return null;
		const username = userStore.user.username;

		// Search through all bracket matches
		const findActiveMatch = (matches: BracketMatch[][]) => {
			for (const round of matches) {
				for (const match of round) {
					if (
						(match.player1 === username || match.player2 === username) &&
						(match.status === 'ready' || match.status === 'in_progress')
					) {
						return match;
					}
				}
			}
			return null;
		};

		let match = findActiveMatch(tournament.bracket.winners);
		if (match) return match;

		match = findActiveMatch(tournament.bracket.losers);
		if (match) return match;

		// Check grand final
		const gf = tournament.bracket.grandFinal;
		if (
			gf &&
			(gf.player1 === username || gf.player2 === username) &&
			(gf.status === 'ready' || gf.status === 'in_progress')
		) {
			return gf;
		}

		return null;
	});

	// Get opponent name for active match
	const activeMatchOpponent = $derived.by(() => {
		if (!userActiveMatch || !userStore.user) return null;
		const username = userStore.user.username;
		if (userActiveMatch.player1 === username) {
			return userActiveMatch.player2DisplayName || userActiveMatch.player2;
		}
		return userActiveMatch.player1DisplayName || userActiveMatch.player1;
	});

	// Check if current user is eliminated
	const isCurrentUserEliminated = $derived(
		tournament?.participants.some((p) => p.username === userStore.user?.username && p.eliminated) ??
			false
	);

	// Get podium placements for completed tournaments
	const podium = $derived.by(() => {
		if (!tournament || tournament.status !== 'completed' || !tournament.bracket) return null;

		const grandFinal = tournament.bracket.grandFinal;
		const losers = tournament.bracket.losers;

		// 1st place: Grand final winner
		const first = grandFinal.winnerId
			? {
					username: grandFinal.winnerId,
					displayName:
						grandFinal.winnerId === grandFinal.player1
							? grandFinal.player1DisplayName
							: grandFinal.player2DisplayName
				}
			: null;

		// 2nd place: Grand final loser
		const secondUsername =
			grandFinal.player1 === grandFinal.winnerId ? grandFinal.player2 : grandFinal.player1;
		const second = secondUsername
			? {
					username: secondUsername,
					displayName:
						secondUsername === grandFinal.player1
							? grandFinal.player1DisplayName
							: grandFinal.player2DisplayName
				}
			: null;

		// 3rd place: Losers final loser (last match in losers bracket)
		const losersFinal = losers.length > 0 ? losers[losers.length - 1]?.[0] : null;
		const thirdUsername = losersFinal
			? losersFinal.player1 === losersFinal.winnerId
				? losersFinal.player2
				: losersFinal.player1
			: null;
		const third = thirdUsername
			? {
					username: thirdUsername,
					displayName:
						thirdUsername === losersFinal?.player1
							? losersFinal?.player1DisplayName
							: losersFinal?.player2DisplayName
				}
			: null;

		return { first, second, third };
	});

	onMount(async () => {
		if (isNaN(tournamentId)) {
			error = 'Invalid tournament ID';
			loading = false;
			return;
		}

		await loadTournament();
		startPolling();
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	function startPolling() {
		// Poll every 5 seconds to check for bracket updates
		pollInterval = setInterval(async () => {
			// Only poll if tournament is in progress
			if (tournament?.status === 'in_progress') {
				await refreshTournament();
			} else if (tournament?.status === 'completed') {
				// Stop polling once tournament is completed
				if (pollInterval) {
					clearInterval(pollInterval);
					pollInterval = null;
				}
			}
		}, 5000);
	}

	async function loadTournament() {
		loading = true;
		error = null;

		const result = await getTournament(tournamentId);
		if (result) {
			tournament = result;
		} else {
			error = 'Failed to load tournament';
		}

		loading = false;
	}

	// Refresh without showing loading state (for polling)
	async function refreshTournament() {
		const result = await getTournament(tournamentId);
		if (result) {
			tournament = result;
		}
	}

	function handlePlayMatch(matchId: number) {
		goto(`/tournament/play/${matchId}?tournamentId=${tournamentId}`);
	}

	async function handleSimulateWinner(matchId: number, winnerId: string) {
		if (simulating) return;

		simulating = true;
		const result = await simulateMatchWinner(tournamentId, matchId, winnerId);

		if (result?.success) {
			// Reload tournament to get updated bracket
			await loadTournament();
		} else {
			alert('Failed to simulate match result');
		}

		simulating = false;
	}
</script>

<svelte:head>
	<title>{tournament?.name || 'Tournament'} - Bracket - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<!-- Diamond pattern overlay (tournament theme) -->
	<div class="absolute inset-0 bg-diamonds opacity-[0.03]"></div>

	<Header />

	<main class="relative pt-24 pb-12 px-4">
		<div class="">
			<!-- Back link -->
			<div class="flex items-center gap-4 mb-4">
				<a href="/tournament" class="text-black/60 hover:text-black font-bold"> ← Back </a>
			</div>

			{#if loading}
				<div class="text-center py-16">
					<div class="text-4xl mb-4">🏆</div>
					<p class="font-bold">Loading tournament...</p>
				</div>
			{:else if error}
				<Card class="text-center py-16">
					<div class="text-4xl mb-4">❌</div>
					<p class="font-bold text-magenta mb-4">{error}</p>
					<Button variant="white" href="/tournament">Back to Tournaments</Button>
				</Card>
			{:else if tournament}
				<!-- Tournament Header -->
				<div class="mb-8">
					<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h1 class="text-3xl font-black mb-2">{tournament.name}</h1>
							<div class="flex items-center gap-3 flex-wrap">
								<span
									class="brutal-border brutal-shadow-sm px-3 py-1 text-sm font-bold uppercase {statusColors[
										tournament.status
									]}"
								>
									{tournament.status === 'in_progress' ? 'LIVE' : tournament.status}
								</span>
								<span
									class="brutal-border brutal-shadow-sm px-3 py-1 text-sm font-bold uppercase {difficultyColors[
										tournament.difficulty
									]}"
								>
									{tournament.difficulty}
								</span>
								<span class="text-sm text-black/60">
									{tournament.timeLimit}s per round • {tournament.roundsPerMatch} rounds per match
								</span>
							</div>
						</div>

						{#if userActiveMatch}
							<Button variant="orange" onclick={() => handlePlayMatch(userActiveMatch.id)}>
								⚔️ Play Your Match
							</Button>
						{/if}
					</div>
				</div>

				<!-- Active Match Banner -->
				{#if userActiveMatch}
					<Card variant="orange" class="mb-8 py-4">
						<div class="flex flex-col md:flex-row items-center justify-between gap-4">
							<div class="flex items-center gap-4">
								<span class="text-3xl">⚔️</span>
								<div>
									<div class="font-black">Your Match is Ready!</div>
									<div class="text-sm opacity-80">
										vs <span class="font-bold">{activeMatchOpponent || 'Unknown'}</span>
									</div>
								</div>
							</div>
							<Button variant="black" onclick={() => handlePlayMatch(userActiveMatch.id)}>
								Play Now
							</Button>
						</div>
					</Card>
				{/if}

				<!-- Eliminated Banner -->
				{#if isCurrentUserEliminated && tournament.status === 'in_progress'}
					<Card variant="magenta" class="mb-8">
						<div class="flex items-center gap-4">
							<span class="text-3xl">💀</span>
							<div>
								<div class="font-black">You've Been Eliminated</div>
							</div>
						</div>
					</Card>
				{/if}

				<!-- Dev mode indicator -->
				{#if dev && userStore.isAdmin}
					<div class="mb-4 p-3 bg-orange/10 brutal-border flex items-center gap-3">
						<span class="text-xs font-bold uppercase text-orange">DEV MODE</span>
						<span class="text-sm text-black/60">
							Click "WIN" buttons on matches to simulate results
							{#if simulating}
								<span class="ml-2 font-bold">(simulating...)</span>
							{/if}
						</span>
					</div>
				{/if}

				<!-- Podium for completed tournaments -->
				{#if tournament.status === 'completed' && podium}
					<Card class="mb-8 py-8">
						<h3 class="text-center text-xs font-bold uppercase text-black/60 mb-6">
							Final Results
						</h3>
						<div class="flex items-end justify-center gap-4 md:gap-8">
							<!-- 2nd Place -->
							<div class="flex flex-col items-center">
								<span class="text-3xl mb-2">🥈</span>
								<div
									class="brutal-border bg-gray w-24 md:w-32 h-20 flex items-center justify-center"
								>
									<div class="text-center px-2">
										<div class="text-[10px] font-bold uppercase text-black/60">2nd</div>
										<div class="font-black text-sm md:text-base truncate max-w-full">
											{podium.second?.displayName || podium.second?.username || '—'}
										</div>
									</div>
								</div>
							</div>

							<!-- 1st Place -->
							<div class="flex flex-col items-center">
								<span class="text-4xl mb-2">👑</span>
								<div
									class="brutal-border bg-lime w-28 md:w-36 h-28 flex items-center justify-center"
								>
									<div class="text-center px-2">
										<div class="text-[10px] font-bold uppercase text-black/60">1st</div>
										<div class="font-black text-base md:text-lg truncate max-w-full">
											{podium.first?.displayName || podium.first?.username || '—'}
										</div>
										<span class="text-2xl">🏆</span>
									</div>
								</div>
							</div>

							<!-- 3rd Place -->
							<div class="flex flex-col items-center">
								<span class="text-2xl mb-2">🥉</span>
								<div
									class="brutal-border bg-orange w-24 md:w-32 h-16 flex items-center justify-center"
								>
									<div class="text-center px-2">
										<div class="text-[10px] font-bold uppercase text-black/60">3rd</div>
										<div class="font-black text-sm md:text-base truncate max-w-full">
											{podium.third?.displayName || podium.third?.username || '—'}
										</div>
									</div>
								</div>
							</div>
						</div>
					</Card>
				{/if}

				<!-- Bracket -->
				<Card class="overflow-hidden">
					<div class="p-6">
						<h2 class="text-xl font-black uppercase mb-6">Tournament Bracket</h2>

						{#if tournament.status === 'open'}
							<div class="text-center py-12 text-black/60">
								<div class="text-4xl mb-4">⏳</div>
								<p class="font-bold">Tournament hasn't started yet</p>
								<p class="text-sm mt-2">
									{tournament.participants.length} player{tournament.participants.length !== 1
										? 's'
										: ''} joined
								</p>
							</div>
						{:else}
							<Bracket
								winners={tournament.bracket.winners}
								losers={tournament.bracket.losers}
								grandFinal={tournament.bracket.grandFinal}
								currentUserId={userStore.user?.username}
								onPlayMatch={handlePlayMatch}
								devMode={dev && userStore.isAdmin}
								onSimulateWinner={dev && userStore.isAdmin ? handleSimulateWinner : undefined}
							/>
						{/if}
					</div>
				</Card>

				<!-- Legend -->
				<div class="mt-8 flex flex-wrap gap-6 justify-center">
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 bg-lime brutal-border"></div>
						<span class="text-sm font-bold">Completed/Winner</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 bg-cyan brutal-border"></div>
						<span class="text-sm font-bold">Ready</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 bg-orange brutal-border"></div>
						<span class="text-sm font-bold">In Progress</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 bg-gray brutal-border"></div>
						<span class="text-sm font-bold">Pending</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="mt-10 flex justify-center gap-4">
					<Button variant="white" href="/tournament">Tournament Home</Button>
					<Button variant="cyan" href="/menu">Main Menu</Button>
				</div>
			{/if}
		</div>
	</main>
</div>
