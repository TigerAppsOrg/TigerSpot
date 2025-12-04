<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Header from '$lib/components/Header.svelte';
	import GameModeCard from '$lib/components/GameModeCard.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import { dummyUser } from '$lib/data/dummy';
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
				<Button variant="white" href="/leaderboard">📊 Leaderboard</Button>
				<Button variant="white" href="/settings">👤 Profile & Settings</Button>
				{#if dummyUser.isAdmin}
					<Button variant="orange" href="/admin">⚙️ Admin Dashboard</Button>
				{/if}
			</div>

			<!-- Game Modes -->
			<h2 class="text-3xl font-black mb-8">Choose Your Mode</h2>

			<div class="grid md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
				<GameModeCard
					href="/game"
					variant="cyan"
					emoji="📅"
					title="Daily Challenge"
					description="One new location every day. How close can you get?"
					stat="{dummyUser.currentStreak} day streak"
				/>

				<GameModeCard
					href="/versus"
					variant="magenta"
					emoji="⚔️"
					title="Versus Mode"
					description="Challenge your friends to 5-round battles!"
					stat="2 pending"
					cta="Battle"
				/>

				<GameModeCard
					href="/tournament"
					variant="lime"
					emoji="🏆"
					title="Tournament"
					description="Bracket-style competition. Double elimination!"
					stat="1 active"
					cta="Compete"
					class="md:col-span-2 xl:col-span-1"
				/>
			</div>

			<!-- Stats Bar -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatCard value={dummyUser.totalPoints} label="Total Points" valueColor="text-orange" />
				<StatCard value={dummyUser.currentStreak} label="Day Streak" valueColor="text-magenta" />
				<StatCard value="#7" label="Rank" valueColor="text-cyan" />
				<StatCard value="42" label="Games Played" valueColor="text-lime" />
			</div>
		</div>
	</main>
</div>
