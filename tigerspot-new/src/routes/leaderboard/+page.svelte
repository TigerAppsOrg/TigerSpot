<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import { dummyLeaderboard, dummyUser } from '$lib/data/dummy';

	let activeTab = $state<'daily' | 'alltime'>('daily');

	// Find current user's rank
	const userRank = dummyLeaderboard.findIndex((u) => u.username === dummyUser.username) + 1;
</script>

<svelte:head>
	<title>Leaderboard - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary">
	<Header />

	<main class="pt-24 pb-12 px-4">
		<div class="container-brutal">
			<h1 class="text-4xl md:text-5xl font-black text-center mb-10">&#x1F3C6; Leaderboard</h1>

			<!-- Tab Switcher -->
			<div class="flex justify-center gap-6 mb-10">
				<button
					class="btn-brutal {activeTab === 'daily' ? 'btn-black' : 'btn-white'}"
					onclick={() => (activeTab = 'daily')}
				>
					Today
				</button>
				<button
					class="btn-brutal {activeTab === 'alltime' ? 'btn-black' : 'btn-white'}"
					onclick={() => (activeTab = 'alltime')}
				>
					All Time
				</button>
			</div>

			<!-- Top 3 Podium -->
			<div class="flex justify-center items-end gap-6 mb-12 max-w-2xl mx-auto">
				<!-- 2nd Place -->
				{#if dummyLeaderboard[1]}
					<div class="flex-1 text-center">
						<Card class="pb-10">
							<div class="text-4xl mb-4">&#x1F948;</div>
							<div class="font-black text-lg">{dummyLeaderboard[1].username}</div>
							<div class="text-2xl font-black text-magenta mt-2">
								{dummyLeaderboard[1].points.toLocaleString()}
							</div>
							<div class="text-xs opacity-60 mt-2">
								{dummyLeaderboard[1].streak} day streak
							</div>
						</Card>
					</div>
				{/if}

				<!-- 1st Place -->
				{#if dummyLeaderboard[0]}
					<div class="flex-1 text-center">
						<Card variant="lime" class="pb-14 -mb-4">
							<div class="text-5xl mb-4">&#x1F947;</div>
							<div class="font-black text-xl">{dummyLeaderboard[0].username}</div>
							<div class="text-3xl font-black mt-2">
								{dummyLeaderboard[0].points.toLocaleString()}
							</div>
							<div class="text-xs opacity-60 mt-2">
								{dummyLeaderboard[0].streak} day streak
							</div>
						</Card>
					</div>
				{/if}

				<!-- 3rd Place -->
				{#if dummyLeaderboard[2]}
					<div class="flex-1 text-center">
						<Card class="pb-6">
							<div class="text-4xl mb-4">&#x1F949;</div>
							<div class="font-black text-lg">{dummyLeaderboard[2].username}</div>
							<div class="text-2xl font-black text-orange mt-2">
								{dummyLeaderboard[2].points.toLocaleString()}
							</div>
							<div class="text-xs opacity-60 mt-2">
								{dummyLeaderboard[2].streak} day streak
							</div>
						</Card>
					</div>
				{/if}
			</div>

			<!-- Full Leaderboard -->
			<Card class="max-w-2xl mx-auto">
				<div class="divide-y-4 divide-black">
					{#each dummyLeaderboard as entry, i}
						<div
							class="flex items-center gap-6 py-5 first:pt-0 last:pb-0 {entry.username ===
							dummyUser.username
								? 'bg-cyan/20 -mx-8 px-8'
								: ''}"
						>
							<!-- Rank -->
							<div class="w-14 text-center">
								{#if i === 0}
									<span class="text-3xl">&#x1F947;</span>
								{:else if i === 1}
									<span class="text-3xl">&#x1F948;</span>
								{:else if i === 2}
									<span class="text-3xl">&#x1F949;</span>
								{:else}
									<span class="text-2xl font-black opacity-40">
										{entry.rank}
									</span>
								{/if}
							</div>

							<!-- User Info -->
							<div class="grow">
								<div
									class="font-bold text-lg {entry.username === dummyUser.username
										? 'text-cyan'
										: ''}"
								>
									{entry.username}
									{#if entry.username === dummyUser.username}
										<span class="text-xs uppercase ml-3 bg-cyan text-black px-3 py-1 brutal-border"
											>You</span
										>
									{/if}
								</div>
								<div class="text-xs opacity-60 mt-1">
									{entry.streak} day streak
								</div>
							</div>

							<!-- Points -->
							<div class="text-right">
								<div class="text-2xl font-black">
									{entry.points.toLocaleString()}
								</div>
								<div class="text-xs opacity-60">points</div>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Your Position (if not in top 10) -->
			{#if userRank > 10}
				<Card class="max-w-2xl mx-auto mt-6 bg-cyan/20">
					<div class="flex items-center gap-6">
						<div class="w-14 text-center text-2xl font-black">
							{userRank}
						</div>
						<div class="grow">
							<div class="font-bold text-cyan text-lg">{dummyUser.username}</div>
							<div class="text-xs opacity-60">Your position</div>
						</div>
						<div class="text-right">
							<div class="text-2xl font-black">
								{dummyUser.totalPoints.toLocaleString()}
							</div>
							<div class="text-xs opacity-60">points</div>
						</div>
					</div>
				</Card>
			{/if}
		</div>
	</main>
</div>
