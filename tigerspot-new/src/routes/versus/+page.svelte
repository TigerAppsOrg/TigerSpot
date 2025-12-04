<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import PlayerChip from '$lib/components/PlayerChip.svelte';
	import ChallengeCard from '$lib/components/ChallengeCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { dummyVersusPlayers, dummyChallenges } from '$lib/data/dummy';

	let challenges = $state([...dummyChallenges]);

	const sentChallenges = $derived(
		challenges.filter((c) => c.isChallenger && c.status === 'pending')
	);
	const receivedChallenges = $derived(
		challenges.filter((c) => !c.isChallenger && c.status === 'pending')
	);
	const activeMatches = $derived(challenges.filter((c) => c.status === 'accepted'));
	const completedMatches = $derived(challenges.filter((c) => c.status === 'completed'));

	function challengePlayer(username: string) {
		const newChallenge = {
			id: challenges.length + 1,
			opponent: username,
			status: 'pending' as 'pending' | 'accepted' | 'completed',
			isChallenger: true,
			createdAt: new Date()
		};
		challenges = [...challenges, newChallenge];
	}

	function acceptChallenge(id: number) {
		challenges = challenges.map((c) => (c.id === id ? { ...c, status: 'accepted' } : c));
	}

	function declineChallenge(id: number) {
		challenges = challenges.filter((c) => c.id !== id);
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
						<div class="flex flex-wrap gap-3">
							{#each dummyVersusPlayers as player}
								<PlayerChip
									username={player}
									clickable
									onclick={() => challengePlayer(player)}
									class="brutal-shadow-sm"
								/>
							{/each}
						</div>
						<p class="text-sm opacity-70 mt-4">Click a player to challenge them</p>
					</Card>

					<!-- Active Matches -->
					{#if activeMatches.length > 0}
						<Card variant="orange">
							<h2 class="text-2xl font-black mb-6">Active Matches</h2>
							<div class="space-y-4">
								{#each activeMatches as match}
									<ChallengeCard
										opponent={match.opponent}
										createdAt={match.createdAt}
										status="active"
										onStart={() => startGame(match.id)}
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
										opponent={challenge.opponent}
										createdAt={challenge.createdAt}
										status="pending"
										onAccept={() => acceptChallenge(challenge.id)}
										onDecline={() => declineChallenge(challenge.id)}
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
										opponent={challenge.opponent}
										createdAt={challenge.createdAt}
										status="sent"
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
								match.yourScore && match.theirScore && match.yourScore > match.theirScore}
							<div
								class="brutal-border p-4 flex items-center justify-between gap-4 {won
									? 'bg-lime/20'
									: 'bg-gray/30'} flex-wrap"
							>
								<div class="flex items-center gap-3">
									<span class="text-2xl">{won ? '🏆' : '💔'}</span>
									<div>
										<div class="font-black">
											{won ? 'Victory' : 'Defeat'} vs {match.opponent}
										</div>
										<div class="text-sm">
											<span class="font-bold">{match.yourScore}</span> -
											<span class="font-bold">{match.theirScore}</span>
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
