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
	let pendingChallenges = $state<number | null>(null);
	let activeTournaments = $state<number | null>(null);
	let dailyCompleted = $state<boolean | null>(null);
	let loading = $state(true);
	let loadError = $state(false);

	const dailyStat = $derived(
		stats
			? `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'} streak`
			: loading
				? 'Loading'
				: 'Unavailable'
	);
	const pendingStat = $derived(
		pendingChallenges !== null
			? `${pendingChallenges} pending`
			: loading
				? 'Loading'
				: 'Unavailable'
	);
	const tournamentStat = $derived(
		activeTournaments !== null ? `${activeTournaments} active` : loading ? 'Loading' : 'Unavailable'
	);
	const loadStatus = $derived(
		loading
			? 'Loading your game status'
			: loadError
				? 'Some stats could not be loaded'
				: 'Game status loaded'
	);

	onMount(async () => {
		await userStore.load();
		if (!userStore.isAuthenticated) {
			await goto('/');
			return;
		}

		await loadMenuData();
	});

	async function loadMenuData() {
		loading = true;
		loadError = false;

		const [statsResult, challengesResult, tournamentsResult, dailyResult] =
			await Promise.allSettled([
				getMyStats(),
				getChallenges(),
				listTournaments(),
				getDailyStatus()
			]);

		const statsData = statsResult.status === 'fulfilled' ? statsResult.value : null;
		const challengesData = challengesResult.status === 'fulfilled' ? challengesResult.value : null;
		const tournamentsData =
			tournamentsResult.status === 'fulfilled' ? tournamentsResult.value : null;
		const dailyData = dailyResult.status === 'fulfilled' ? dailyResult.value : null;

		if (statsData) stats = statsData;
		if (challengesData) {
			pendingChallenges = challengesData.received.length + challengesData.active.length;
		}
		if (tournamentsData) {
			activeTournaments = tournamentsData.filter(
				(t) => t.status === 'open' || t.status === 'in_progress'
			).length;
		}
		if (dailyData) dailyCompleted = dailyData.hasPlayed;

		loadError = [statsData, challengesData, tournamentsData, dailyData].some(
			(value) => value === null
		);
		loading = false;
	}
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
		<div class="container-brutal" aria-busy={loading}>
			<p class="sr-only" aria-live="polite">{loadStatus}</p>

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

			{#if loadError}
				<div
					class="brutal-border bg-white mb-8 flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<p class="font-bold">Some stats couldn't load.</p>
					<Button variant="black" size="sm" onclick={loadMenuData} disabled={loading}>Retry</Button>
				</div>
			{/if}

			<!-- Game Modes -->
			<h1 class="text-3xl font-black mb-8">Choose Your Mode</h1>

			<div class="grid md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
				<GameModeCard
					href="/game"
					variant="cyan"
					icon="calendar"
					title="Daily Challenge"
					description="One new location every day. How close can you get?"
					stat={dailyStat}
					completed={dailyCompleted === true}
				/>

				<GameModeCard
					href="/versus"
					variant="magenta"
					icon="swords"
					title="Versus Mode"
					description="Challenge your friends to 5-round battles!"
					stat={pendingStat}
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
					stat={tournamentStat}
					cta="Compete"
				/>
			</div>

			<!-- Stats Bar -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatCard
					value={stats?.totalPoints ?? '—'}
					label="Total Points"
					valueClass="text-orange-ink"
				/>
				<StatCard
					value={stats?.currentStreak ?? '—'}
					label="Day Streak"
					valueClass="text-magenta"
				/>
				<StatCard
					value={stats ? `#${stats.rank ?? '-'}` : '—'}
					label="Rank"
					valueClass="text-cyan"
				/>
				<StatCard value={stats?.maxStreak ?? '—'} label="Best Streak" valueClass="text-lime" />
			</div>
		</div>
	</main>
</div>
