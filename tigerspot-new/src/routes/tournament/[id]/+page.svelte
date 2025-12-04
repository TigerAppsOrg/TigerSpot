<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import Bracket from '$lib/components/Bracket.svelte';
	import {
		dummyActiveTournament,
		dummyBracket,
		dummyUser,
		dummyCurrentMatch
	} from '$lib/data/dummy';

	const tournamentId = $page.params.id;
	const tournament = dummyActiveTournament;
	const bracket = dummyBracket;
	const currentUser = dummyUser;

	const difficultyColors = {
		easy: 'bg-lime',
		medium: 'bg-cyan',
		hard: 'bg-magenta',
		mixed: 'bg-orange'
	};

	const statusColors = {
		open: 'bg-white',
		in_progress: 'bg-orange',
		completed: 'bg-lime'
	};

	// Check if user has an active match they can play
	const userActiveMatch = $derived.by(() => {
		if (!dummyCurrentMatch) return null;
		// Find the match in the bracket
		for (const round of bracket.winners) {
			const match = round.find((m) => m.id === dummyCurrentMatch.matchId);
			if (match && match.status === 'in_progress') return match;
		}
		for (const round of bracket.losers) {
			const match = round.find((m) => m.id === dummyCurrentMatch.matchId);
			if (match && match.status === 'in_progress') return match;
		}
		if (bracket.grandFinal.id === dummyCurrentMatch.matchId) return bracket.grandFinal;
		return null;
	});

	function handlePlayMatch(matchId: number) {
		goto(`/tournament/play/${matchId}`);
	}
</script>

<svelte:head>
	<title>{tournament.name} - Bracket - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary">
	<Header />

	<main class="pt-24 pb-12 px-4">
		<div class="container-brutal">
			<!-- Tournament Header -->
			<div class="mb-8">
				<div class="flex items-center gap-4 mb-4">
					<a href="/tournament" class="text-black/60 hover:text-black font-bold"> ← Back </a>
				</div>

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
									vs <span class="font-bold">{dummyCurrentMatch?.opponent}</span>
								</div>
							</div>
						</div>
						<Button variant="black" onclick={() => handlePlayMatch(userActiveMatch.id)}>
							Play Now
						</Button>
					</div>
				</Card>
			{/if}

			<!-- Bracket -->
			<Card class="overflow-hidden">
				<div class="p-6">
					<h2 class="text-xl font-black uppercase mb-6">Tournament Bracket</h2>
					<Bracket
						winners={bracket.winners}
						losers={bracket.losers}
						grandFinal={bracket.grandFinal}
						currentUserId={currentUser.username}
						onPlayMatch={handlePlayMatch}
					/>
				</div>
			</Card>

			<!-- Legend -->
			<div class="mt-8 flex flex-wrap gap-6 justify-center">
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 bg-lime brutal-border"></div>
					<span class="text-sm font-bold">Winner</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 bg-orange brutal-border"></div>
					<span class="text-sm font-bold">In Progress</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 bg-gray brutal-border"></div>
					<span class="text-sm font-bold">Pending</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 bg-cyan brutal-border"></div>
					<span class="text-sm font-bold">Your Match</span>
				</div>
			</div>

			<!-- Actions -->
			<div class="mt-10 flex justify-center gap-4">
				<Button variant="white" href="/tournament">Tournament Home</Button>
				<Button variant="cyan" href="/menu">Main Menu</Button>
			</div>
		</div>
	</main>
</div>
