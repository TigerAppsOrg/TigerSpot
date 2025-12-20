<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Header from '$lib/components/Header.svelte';
	import {
		getTotalLeaderboard,
		getDailyLeaderboard,
		getMyStats,
		type LeaderboardEntry,
		type UserStats
	} from '$lib/api/leaderboard';
	import { userStore } from '$lib/stores/user.svelte';
	import Button from '$lib/components/Button.svelte';

	let activeTab = $state<'daily' | 'alltime'>('alltime');
	let leaderboard = $state<LeaderboardEntry[]>([]);
	let myStats = $state<UserStats | null>(null);
	let loading = $state(true);
	let latestRequestId = 0;

	// Find current user's rank from leaderboard or myStats
	const userRank = $derived(myStats?.rank ?? 0);
	const currentUsername = $derived(userStore.username);
	const isDaily = $derived(activeTab === 'daily');
	const listEntries = $derived(leaderboard.slice(3, 25));
	const dailyUserEntry = $derived(
		leaderboard.find((entry) => entry.username === currentUsername) ?? null
	);
	const medalColors = {
		gold: '#f4c430',
		silver: '#c0c0c0',
		bronze: '#cd7f32'
	};

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		const requestId = ++latestRequestId;
		loading = true;
		const [allTimeData, statsData] = await Promise.all([getTotalLeaderboard(), getMyStats()]);
		if (requestId !== latestRequestId) return;
		leaderboard = allTimeData;
		myStats = statsData;
		loading = false;
	}

	async function switchTab(tab: 'daily' | 'alltime') {
		activeTab = tab;
		const requestId = ++latestRequestId;
		loading = true;
		const data = tab === 'daily' ? await getDailyLeaderboard() : await getTotalLeaderboard();
		if (requestId !== latestRequestId) return;
		leaderboard = data;
		loading = false;
	}
</script>

<svelte:head>
	<title>Leaderboard - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<!-- Grid pattern overlay -->
	<div class="absolute inset-0 bg-grid opacity-10"></div>

	<Header />

	<main class="relative pt-24 pb-12 px-4">
		<div class="container-brutal">
			<h1
				class="text-4xl md:text-5xl font-black text-center mt-8 mb-10 flex items-center justify-center gap-3"
			>
				<Icon name="trophy" class="text-4xl md:text-5xl" />
				Leaderboard
			</h1>

			<!-- Tab Switcher -->
			<div class="flex justify-center gap-6 mb-10">
				<button
					class="btn-brutal {activeTab === 'alltime' ? 'btn-black' : 'btn-white'}"
					onclick={() => switchTab('alltime')}
				>
					All Time
				</button>
				<button
					class="btn-brutal {activeTab === 'daily' ? 'btn-black' : 'btn-white'}"
					onclick={() => switchTab('daily')}
				>
					Today
				</button>
			</div>

			{#if loading}
				<div class="text-center py-12">
					<Icon name="paw" class="text-4xl mb-4" />
					<p class="font-bold">Loading leaderboard...</p>
				</div>
			{:else if leaderboard.length === 0}
				<Card class="max-w-2xl mx-auto">
					<div class="text-center py-12">
						<Icon name="faceSad" class="text-4xl mb-4" />
						<p class="font-bold">No one has played today :(</p>

						<Button variant="cyan" size="md" href="/game" class="mt-6">
							Be the first to play!
						</Button>
					</div>
				</Card>
			{:else}
				<!-- Top 3 Podium -->
				<div class="flex justify-center items-end gap-6 mb-12 max-w-2xl mx-auto">
					<!-- 2nd Place -->
					{#if leaderboard[1]}
						<div class="flex-1 text-center">
							<Card class="pb-10">
								<Icon name="medal" class="text-4xl mb-4" style="color: {medalColors.silver};" />
								<div class="font-black text-lg">
									{leaderboard[1].displayName || leaderboard[1].username}
								</div>
								<div class="text-2xl font-black text-magenta mt-2">
									{leaderboard[1].points.toLocaleString()}
								</div>
								{#if leaderboard[1].streak}
									<div class="text-xs opacity-60 mt-2">
										{leaderboard[1].streak} day streak
									</div>
								{/if}
							</Card>
						</div>
					{/if}

					<!-- 1st Place -->
					{#if leaderboard[0]}
						<div class="flex-1 text-center">
							<Card variant="lime" class="pb-14 mb-12">
								<Icon name="medal" class="text-5xl mb-4" style="color: {medalColors.gold};" />
								<div class="font-black text-xl">
									{leaderboard[0].displayName || leaderboard[0].username}
								</div>
								<div class="text-3xl font-black mt-2">
									{leaderboard[0].points.toLocaleString()}
								</div>
								{#if leaderboard[0].streak}
									<div class="text-xs opacity-60 mt-2">
										{leaderboard[0].streak} day streak
									</div>
								{/if}
							</Card>
						</div>
					{/if}

					<!-- 3rd Place -->
					{#if leaderboard[2]}
						<div class="flex-1 text-center">
							<Card class="pb-6">
								<Icon name="medal" class="text-4xl mb-4" style="color: {medalColors.bronze};" />
								<div class="font-black text-lg">
									{leaderboard[2].displayName || leaderboard[2].username}
								</div>
								<div class="text-2xl font-black text-orange mt-2">
									{leaderboard[2].points.toLocaleString()}
								</div>
								{#if leaderboard[2].streak}
									<div class="text-xs opacity-60 mt-2">
										{leaderboard[2].streak} day streak
									</div>
								{/if}
							</Card>
						</div>
					{/if}
				</div>

				<!-- Full Leaderboard -->
				<Card class="max-w-2xl mx-auto">
					<div class="divide-y-4 divide-black">
						{#each listEntries as entry}
							<div class="relative flex items-center gap-6 py-5 first:pt-0 last:pb-0">
								{#if entry.username === currentUsername}
									<div class="absolute inset-y-0 -inset-x-8 bg-cyan/20"></div>
								{/if}
								<!-- Rank -->
								<div class="relative w-14 text-center">
									<span class="text-2xl font-black opacity-40">
										{entry.rank}
									</span>
								</div>

								<!-- User Info -->
								<div class="relative grow">
									<div
										class="font-bold text-lg {entry.username === currentUsername
											? 'text-cyan'
											: ''}"
									>
										{entry.displayName || entry.username}
										{#if entry.username === currentUsername}
											<span
												class="text-xs uppercase ml-3 bg-cyan text-black px-3 py-1 brutal-border"
												>You</span
											>
										{/if}
									</div>
									{#if entry.streak}
										<div class="text-xs opacity-60 mt-1">
											{entry.streak} day streak
										</div>
									{/if}
								</div>

								<!-- Points -->
								<div class="relative text-right">
									<div class="text-2xl font-black">
										{entry.points.toLocaleString()}
									</div>
									<div class="text-xs opacity-60">points</div>
								</div>
							</div>
						{/each}
					</div>
				</Card>

				<!-- Your Position -->
				{#if isDaily}
					{#if myStats?.playedToday}
						{#if !dailyUserEntry}
							<Card class="max-w-2xl mx-auto mt-6 bg-cyan/20">
								<div class="flex items-center gap-6">
									<div class="w-14 text-center text-2xl font-black">-</div>
									<div class="grow">
										<div class="font-bold text-cyan text-lg">
											{myStats.displayName || myStats.username}
										</div>
										<div class="text-xs opacity-60">Outside top list</div>
									</div>
									<div class="text-right">
										<div class="text-2xl font-black">
											{(myStats.todayPoints ?? 0).toLocaleString()}
										</div>
										<div class="text-xs opacity-60">points today</div>
									</div>
								</div>
							</Card>
						{/if}
					{:else if myStats}
						<Card class="max-w-2xl mx-auto mt-6 bg-cyan/20">
							<div class="flex items-center justify-between gap-6">
								<div>
									<div class="font-bold text-cyan text-lg">
										{myStats.displayName || myStats.username}
									</div>
									<div class="text-xs opacity-60">You haven't played today</div>
								</div>
								<Button variant="cyan" size="sm" href="/game">Play Daily</Button>
							</div>
						</Card>
					{/if}
				{:else if myStats && userRank > 25}
					<Card class="max-w-2xl mx-auto mt-6 bg-cyan/20">
						<div class="flex items-center gap-6">
							<div class="w-14 text-center text-2xl font-black">
								{userRank}
							</div>
							<div class="grow">
								<div class="font-bold text-cyan text-lg">
									{myStats.displayName || myStats.username}
								</div>
								<div class="text-xs opacity-60">Your position</div>
							</div>
							<div class="text-right">
								<div class="text-2xl font-black">
									{myStats.totalPoints.toLocaleString()}
								</div>
								<div class="text-xs opacity-60">points</div>
							</div>
						</div>
					</Card>
				{/if}
			{/if}
		</div>
	</main>
</div>
