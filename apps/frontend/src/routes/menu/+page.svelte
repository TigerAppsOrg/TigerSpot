<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Header from '$lib/components/Header.svelte';
	import GameModeCard from '$lib/components/GameModeCard.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { getMyStats, type UserStats } from '$lib/api/leaderboard';
	import { getChallenges } from '$lib/api/versus';
	import { listTournaments } from '$lib/api/tournament';
	import { getDailyStatus } from '$lib/api/game';

	let stats = $state<UserStats | null>(null);
	let pendingChallenges = $state(0);
	let activeTournaments = $state(0);
	let dailyCompleted = $state(false);

	onMount(async () => {
		// Redirect to login if not authenticated
		if (!userStore.isAuthenticated && !userStore.loading) {
			goto('/');
			return;
		}

		// Load user stats
		stats = await getMyStats();

		// Load pending challenges count
		const challenges = await getChallenges();
		pendingChallenges = challenges.received.length + challenges.active.length;

		// Load active tournaments count
		const tournaments = await listTournaments();
		activeTournaments = tournaments.filter(
			(t) => t.status === 'open' || t.status === 'in_progress'
		).length;

		// Check if daily challenge is completed
		const dailyStatus = await getDailyStatus();
		dailyCompleted = dailyStatus?.hasPlayed ?? false;
	});
</script>

<svelte:head>
	<title>Menu - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<!-- Dots pattern overlay -->
	<div class="absolute inset-0 bg-dots opacity-20"></div>

	<Header />

	<!-- Main content with padding for fixed header -->
	<main class="relative pt-24 pb-12 px-4">
		<div class="container-brutal">
			<!-- Quick Links -->
			<div class="flex flex-wrap gap-6 mb-8">
				<Button variant="white" href="/leaderboard">
					<span class="inline-flex items-center gap-2">
						<Icon name="chart" class="text-lg" />
						Leaderboard
					</span>
				</Button>
				<Button variant="white" href="/settings">
					<span class="inline-flex items-center gap-2">
						<Icon name="user" class="text-lg" />
						Profile & Settings
					</span>
				</Button>
				{#if userStore.isAdmin}
					<Button variant="orange" href="/admin">
						<span class="inline-flex items-center gap-2">
							<Icon name="settings" class="text-lg" />
							Admin Dashboard
						</span>
					</Button>
				{/if}
			</div>

			<!-- Game Modes -->
			<h2 class="text-3xl font-black mb-8">Choose Your Mode</h2>

			<div class="grid md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
				<GameModeCard
					href="/game"
					variant="cyan"
					icon="calendar"
					title="Daily Challenge"
					description="One new location every day. How close can you get?"
					stat="{stats?.currentStreak ?? 0} day streak"
					completed={dailyCompleted}
				/>

				<GameModeCard
					href="/versus"
					variant="magenta"
					icon="swords"
					title="Versus Mode"
					description="Challenge your friends to 5-round battles!"
					stat="{pendingChallenges} pending"
					cta="Battle"
				/>

				<GameModeCard
					href="/solo"
					variant="orange"
					icon="target"
					title="Solo Mode"
					description="Practice anytime with unlimited runs."
					stat="Unlimited plays"
					cta="Play"
				/>

				<GameModeCard
					href="/tournament"
					variant="lime"
					icon="trophy"
					title="Tournament"
					description="Bracket-style competition!"
					stat="{activeTournaments} active"
					cta="Compete"
				/>
			</div>

			<!-- Stats Bar -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatCard value={stats?.totalPoints ?? 0} label="Total Points" valueColor="text-orange" />
				<StatCard value={stats?.currentStreak ?? 0} label="Day Streak" valueColor="text-magenta" />
				<StatCard value="#{stats?.rank ?? '-'}" label="Rank" valueColor="text-cyan" />
				<StatCard value={stats?.maxStreak ?? 0} label="Best Streak" valueColor="text-lime" />
			</div>
		</div>
	</main>
</div>
