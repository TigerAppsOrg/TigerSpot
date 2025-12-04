<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import {
		dummyTournaments,
		dummyActiveTournament,
		dummyUser,
		dummyCurrentMatch
	} from '$lib/data/dummy';

	const currentUser = dummyUser;

	// Combine dummy tournaments with the active one for a fuller list
	const allTournaments = [
		{
			...dummyActiveTournament,
			participants: dummyActiveTournament.participants.length,
			maxParticipants: 8,
			participantsList: dummyActiveTournament.participants
		},
		...dummyTournaments
			.filter((t) => t.id !== dummyActiveTournament.id)
			.map((t) => ({
				...t,
				participantsList: [] as string[],
				roundsPerMatch: 5,
				createdAt: new Date()
			}))
	];

	// Check if user is in a tournament
	const isInTournament = (participantsList: string[]) =>
		participantsList.includes(currentUser.username);

	// Check if user has an active match in the active tournament
	const hasActiveMatch =
		dummyCurrentMatch &&
		dummyActiveTournament.participants.includes(currentUser.username) &&
		dummyActiveTournament.status === 'in_progress';

	const difficultyColors: Record<string, string> = {
		easy: 'bg-lime',
		medium: 'bg-cyan',
		hard: 'bg-magenta',
		mixed: 'bg-orange'
	};

	const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
		open: { color: 'bg-white text-black', label: 'OPEN', icon: '📋' },
		in_progress: { color: 'bg-orange text-white', label: 'LIVE', icon: '🔥' },
		completed: { color: 'bg-lime text-white', label: 'COMPLETED', icon: '🏆' }
	};

	function handleJoin(tournamentId: number) {
		alert(`Join tournament ${tournamentId} - will be connected to backend`);
	}
</script>

<svelte:head>
	<title>Tournaments - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary">
	<Header />

	<main class="pt-24 pb-12 px-4">
		<div class="container-brutal max-w-4xl mx-auto">
			<!-- Header -->
			<div class="text-center mb-10">
				<div class="text-5xl mb-4">🏆</div>
				<h1 class="text-4xl font-black mb-2">Tournaments</h1>
				<p class="text-black/60">Compete in bracket-style double elimination tournaments</p>
			</div>

			<!-- Active Match Banner -->
			{#if hasActiveMatch}
				<Card variant="orange" class="mb-8 py-6">
					<div class="flex flex-col md:flex-row items-center justify-between gap-4">
						<div class="flex items-center gap-4">
							<span class="text-4xl">⚔️</span>
							<div>
								<div class="font-black text-lg">Your Match is Ready!</div>
								<div class="text-sm opacity-80">
									vs <span class="font-bold">{dummyCurrentMatch.opponent}</span> in {dummyActiveTournament.name}
								</div>
							</div>
						</div>
						<Button
							variant="black"
							onclick={() => goto(`/tournament/play/${dummyCurrentMatch.matchId}`)}
						>
							Play Now
						</Button>
					</div>
				</Card>
			{/if}

			<!-- Tournament List -->
			<div class="space-y-6">
				{#each allTournaments as tournament}
					{@const status = statusConfig[tournament.status]}
					{@const isParticipant = isInTournament(tournament.participantsList)}

					<Card class="overflow-hidden p-0">
						<!-- Tournament Header -->
						<div class="p-6 pb-4">
							<div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-2 flex-wrap">
										<span class="text-2xl">{status.icon}</span>
										<h2 class="text-xl font-black">{tournament.name}</h2>
										<span
											class="brutal-border px-2 py-0.5 text-xs font-bold uppercase {status.color}"
										>
											{status.label}
										</span>
									</div>

									<div class="flex flex-wrap gap-3 text-sm">
										<span
											class="brutal-border px-2 py-1 text-xs font-bold uppercase {difficultyColors[
												tournament.difficulty
											]} text-white"
										>
											{tournament.difficulty}
										</span>
										<span class="opacity-60">
											{tournament.participants}/{tournament.maxParticipants} players
										</span>
										<span class="opacity-60">{tournament.timeLimit}s per round</span>
										{#if tournament.roundsPerMatch}
											<span class="opacity-60">{tournament.roundsPerMatch} rounds/match</span>
										{/if}
									</div>
								</div>

								<!-- Actions based on status -->
								<div class="flex gap-2 flex-shrink-0">
									{#if tournament.status === 'open'}
										{#if isParticipant}
											<span
												class="brutal-border bg-lime text-white px-4 py-2 font-bold text-sm flex items-center gap-2"
											>
												✓ Joined
											</span>
										{:else if tournament.participants < tournament.maxParticipants}
											<Button variant="lime" onclick={() => handleJoin(tournament.id)}>Join</Button>
										{:else}
											<span class="brutal-border bg-gray text-black/60 px-4 py-2 font-bold text-sm">
												Full
											</span>
										{/if}
									{:else if tournament.status === 'in_progress'}
										<Button variant="cyan" href={`/tournament/${tournament.id}`}>
											View Bracket
										</Button>
									{:else if tournament.status === 'completed'}
										<Button variant="white" href={`/tournament/${tournament.id}`}>
											View Results
										</Button>
									{/if}
								</div>
							</div>
						</div>

						<!-- Participant preview for open/in_progress tournaments -->
						{#if tournament.status !== 'completed' && tournament.participantsList.length > 0}
							<div class="border-t-4 border-black px-6 py-4 bg-gray/30">
								<div class="text-xs font-bold uppercase text-black/50 mb-2">Participants</div>
								<div class="flex flex-wrap gap-2">
									{#each tournament.participantsList.slice(0, 8) as participant}
										<span
											class="brutal-border px-2 py-1 text-xs font-bold {participant ===
											currentUser.username
												? 'bg-cyan text-white'
												: 'bg-white'}"
										>
											{participant}
											{#if participant === currentUser.username}(you){/if}
										</span>
									{/each}
									{#if tournament.participantsList.length > 8}
										<span class="text-xs font-bold opacity-50">
											+{tournament.participantsList.length - 8} more
										</span>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Winner banner for completed tournaments -->
						{#if tournament.status === 'completed' && 'winner' in tournament && tournament.winner}
							<div class="border-t-4 border-black px-6 py-4 bg-lime/20">
								<div class="flex items-center gap-3">
									<span class="text-2xl">👑</span>
									<div>
										<div class="text-xs font-bold uppercase text-black/50">Winner</div>
										<div class="font-black">{tournament.winner}</div>
									</div>
								</div>
							</div>
						{/if}
					</Card>
				{/each}
			</div>

			<!-- Empty state -->
			{#if allTournaments.length === 0}
				<Card class="text-center py-16">
					<div class="text-6xl mb-6">🏆</div>
					<h2 class="text-2xl font-black mb-4">No Tournaments Yet</h2>
					<p class="text-black/60 mb-8">Check back soon for upcoming tournaments!</p>
				</Card>
			{/if}

			<!-- Back to Menu -->
			<div class="text-center mt-10">
				<Button variant="white" href="/menu">Back to Menu</Button>
			</div>
		</div>
	</main>
</div>
