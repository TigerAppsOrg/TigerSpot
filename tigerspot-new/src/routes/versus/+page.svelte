<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import { dummyVersusPlayers, dummyChallenges, dummyUser } from '$lib/data/dummy';

	let challenges = $state([...dummyChallenges]);

	const sentChallenges = $derived(
		challenges.filter((c) => c.isChallenger && c.status === 'pending')
	);
	const receivedChallenges = $derived(
		challenges.filter((c) => !c.isChallenger && c.status === 'pending')
	);
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

	function formatTimeAgo(date: Date) {
		const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
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
								<button
									onclick={() => challengePlayer(player)}
									class="brutal-border brutal-shadow-sm bg-white text-black hover:bg-cyan px-4 py-2 font-bold transition-all hover:scale-105"
								>
									{player}
								</button>
							{/each}
						</div>
						<p class="text-sm opacity-70 mt-4">Click a player to challenge them</p>
					</Card>
				</div>

				<!-- Right Column -->
				<div class="space-y-8">
					<!-- Received Challenges -->
					<Card variant="magenta">
						<h2 class="text-2xl font-black mb-6">Challenges Received</h2>
						{#if receivedChallenges.length > 0}
							<div class="space-y-4">
								{#each receivedChallenges as challenge}
									<div class="brutal-border bg-white p-4">
										<div class="flex items-center justify-between gap-4 mb-3 flex-wrap">
											<div>
												<div class="font-black text-lg">{challenge.opponent}</div>
												<div class="text-xs opacity-60">{formatTimeAgo(challenge.createdAt)}</div>
											</div>
										</div>
										<div class="flex gap-2">
											<Button variant="lime" onclick={() => acceptChallenge(challenge.id)}
												>Accept</Button
											>
											<Button variant="white" onclick={() => declineChallenge(challenge.id)}
												>Decline</Button
											>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-center opacity-60 py-8">No pending challenges</p>
						{/if}
					</Card>

					<!-- Sent Challenges -->
					<Card>
						<h2 class="text-2xl font-black mb-6">Challenges Sent</h2>
						{#if sentChallenges.length > 0}
							<div class="space-y-3">
								{#each sentChallenges as challenge}
									<div
										class="brutal-border bg-gray/30 p-4 flex items-center justify-between gap-4 flex-wrap"
									>
										<div>
											<div class="font-bold">{challenge.opponent}</div>
											<div class="text-xs opacity-60">{formatTimeAgo(challenge.createdAt)}</div>
										</div>
										<span class="brutal-border px-3 py-1 text-xs font-bold bg-white opacity-60">
											WAITING
										</span>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-center opacity-60 py-8">No outgoing challenges</p>
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
		</div>
	</main>
</div>
