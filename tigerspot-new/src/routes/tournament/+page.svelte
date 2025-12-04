<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import { dummyActiveTournament, dummyUser, dummyCurrentMatch } from '$lib/data/dummy';

	// For demo: toggle this to show different states
	const tournament = dummyActiveTournament;
	const currentUser = dummyUser;

	// Check if user is a participant
	const isParticipant = $derived(tournament?.participants.includes(currentUser.username));

	// Check if user has an active match
	const hasActiveMatch = $derived(dummyCurrentMatch && isParticipant);

	const difficultyColors = {
		easy: 'bg-lime',
		medium: 'bg-cyan',
		hard: 'bg-magenta',
		mixed: 'bg-orange'
	};

	const statusEmoji = {
		open: '📋',
		in_progress: '🔥',
		completed: '🏆'
	};

	function handleJoinTournament() {
		alert('Join functionality will be connected to backend');
	}
</script>

<svelte:head>
	<title>Tournament - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary">
	<Header />

	<main class="pt-24 pb-12 px-4">
		<div class="container-brutal max-w-4xl mx-auto">
			{#if !tournament}
				<!-- No Active Tournament -->
				<Card class="text-center py-16">
					<div class="text-6xl mb-6">🏆</div>
					<h1 class="text-3xl font-black mb-4">No Active Tournament</h1>
					<p class="text-black/60 mb-8 max-w-md mx-auto">
						There's no tournament running right now. Check back soon or ask an admin to start one!
					</p>
					<Button variant="cyan" href="/menu">Back to Menu</Button>
				</Card>
			{:else}
				<!-- Tournament Header -->
				<div class="text-center mb-10">
					<div class="text-5xl mb-4">{statusEmoji[tournament.status]}</div>
					<h1 class="text-4xl font-black mb-2">{tournament.name}</h1>
					<div class="flex items-center justify-center gap-4 flex-wrap">
						<span
							class="brutal-border brutal-shadow-sm px-4 py-2 text-sm font-bold uppercase {difficultyColors[
								tournament.difficulty
							]}"
						>
							{tournament.difficulty}
						</span>
						<span class="brutal-border brutal-shadow-sm bg-white px-4 py-2 text-sm font-bold">
							{tournament.timeLimit}s per round
						</span>
						<span class="brutal-border brutal-shadow-sm bg-white px-4 py-2 text-sm font-bold">
							{tournament.roundsPerMatch} rounds per match
						</span>
					</div>
				</div>

				{#if tournament.status === 'open'}
					<!-- Tournament is open for registration -->
					<div class="grid md:grid-cols-2 gap-8 mb-10">
						<Card>
							<h2 class="text-xl font-black uppercase mb-4">Tournament Info</h2>
							<div class="space-y-3">
								<div class="flex justify-between items-center py-2 border-b-2 border-black/20">
									<span class="opacity-60">Format</span>
									<span class="font-bold">Double Elimination</span>
								</div>
								<div class="flex justify-between items-center py-2 border-b-2 border-black/20">
									<span class="opacity-60">Participants</span>
									<span class="font-bold">{tournament.participants.length} / 8</span>
								</div>
								<div class="flex justify-between items-center py-2">
									<span class="opacity-60">Your Status</span>
									<span class="font-bold {isParticipant ? 'text-lime' : 'text-black/40'}">
										{isParticipant ? 'Registered' : 'Not Registered'}
									</span>
								</div>
							</div>
						</Card>

						<Card variant="lime" class="flex flex-col">
							<h2 class="text-xl font-black uppercase mb-4">Participants</h2>
							<div class="grid grid-cols-2 gap-2 grow">
								{#each tournament.participants as participant}
									<div
										class="brutal-border bg-white text-black px-3 py-2 text-sm font-bold truncate"
									>
										{participant}
										{#if participant === currentUser.username}
											<span class="text-cyan">(you)</span>
										{/if}
									</div>
								{/each}
								{#each Array(8 - tournament.participants.length) as _}
									<div
										class="brutal-border bg-white/20 text-white/60 px-3 py-2 text-sm font-bold text-center"
									>
										Open Slot
									</div>
								{/each}
							</div>
						</Card>
					</div>

					{#if !isParticipant}
						<div class="text-center">
							<Button variant="lime" size="lg" onclick={handleJoinTournament}>
								Join Tournament
							</Button>
						</div>
					{:else}
						<Card class="text-center py-8">
							<div class="text-4xl mb-4">✅</div>
							<h3 class="text-xl font-black mb-2">You're In!</h3>
							<p class="opacity-60">Waiting for tournament to start...</p>
						</Card>
					{/if}
				{:else if tournament.status === 'in_progress'}
					<!-- Tournament in progress -->
					{#if hasActiveMatch}
						<!-- User has an active match -->
						<Card variant="orange" class="text-center mb-10 py-10">
							<div class="text-5xl mb-4">⚔️</div>
							<h2 class="text-2xl font-black mb-2">Your Match is Ready!</h2>
							<p class="mb-6 opacity-80">
								You're facing <span class="font-black">{dummyCurrentMatch.opponent}</span> in the
								{dummyCurrentMatch.bracketType === 'winners' ? 'Winners' : 'Losers'} Bracket
							</p>
							<Button
								variant="black"
								size="lg"
								onclick={() => goto(`/tournament/play/${dummyCurrentMatch.matchId}`)}
							>
								Play Now
							</Button>
						</Card>
					{/if}

					<div class="text-center mb-8">
						<Button variant="lime" size="lg" href={`/tournament/${tournament.id}`}>
							View Bracket
						</Button>
					</div>

					<Card>
						<h2 class="text-xl font-black uppercase mb-4">Participants</h2>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
							{#each tournament.participants as participant}
								<div
									class="brutal-border px-3 py-2 text-sm font-bold truncate {participant ===
									currentUser.username
										? 'bg-cyan text-white'
										: 'bg-white'}"
								>
									{participant}
									{#if participant === currentUser.username}
										(you)
									{/if}
								</div>
							{/each}
						</div>
					</Card>
				{:else}
					<!-- Tournament completed -->
					<Card variant="lime" class="text-center mb-10 py-10">
						<div class="text-6xl mb-4">🏆</div>
						<h2 class="text-2xl font-black mb-2">Tournament Complete!</h2>
						<p class="opacity-80 mb-4">Winner: <span class="font-black">TBD</span></p>
						<Button variant="black" href={`/tournament/${tournament.id}`}>View Final Bracket</Button
						>
					</Card>
				{/if}

				<!-- Back to Menu -->
				<div class="text-center mt-10">
					<Button variant="white" href="/menu">Back to Menu</Button>
				</div>
			{/if}
		</div>
	</main>
</div>
