<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
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
				<Button variant="white" href="/leaderboard">&#x1F4CA; Leaderboard</Button>
				<Button variant="white" href="/settings">&#x1F464; Profile & Settings</Button>
				{#if dummyUser.isAdmin}
					<Button variant="orange" href="/admin">&#x2699;&#xFE0F; Admin Dashboard</Button>
				{/if}
			</div>

			<!-- Game Modes -->
			<h2 class="text-3xl font-black mb-8">Choose Your Mode</h2>

			<div class="grid md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
				<!-- Daily Challenge -->
				<a href="/game" class="block group">
					<Card variant="cyan" hoverable class="h-full">
						<div class="flex flex-col h-full">
							<div class="text-5xl mb-6">&#x1F4C5;</div>
							<h3 class="text-2xl font-black mb-4">Daily Challenge</h3>
							<p class="opacity-80 mb-6 grow leading-relaxed">
								One new location every day. How close can you get?
							</p>
							<div class="flex items-center justify-between">
								<span
									class="brutal-border brutal-shadow-sm bg-white text-black px-4 py-2 text-sm font-bold"
								>
									{dummyUser.currentStreak} day streak
								</span>
								<span
									class="font-bold uppercase text-sm group-hover:translate-x-2 transition-transform"
								>
									Play →
								</span>
							</div>
						</div>
					</Card>
				</a>

				<!-- Versus Mode -->
				<a href="/versus" class="block group">
					<Card variant="magenta" hoverable class="h-full">
						<div class="flex flex-col h-full">
							<div class="text-5xl mb-6">&#x2694;&#xFE0F;</div>
							<h3 class="text-2xl font-black mb-4">Versus Mode</h3>
							<p class="text-white/80 mb-6 grow leading-relaxed">
								Challenge your friends to 5-round battles!
							</p>
							<div class="flex items-center justify-between">
								<span
									class="brutal-border brutal-shadow-sm bg-white text-black px-4 py-2 text-sm font-bold"
								>
									2 pending
								</span>
								<span
									class="font-bold uppercase text-sm group-hover:translate-x-2 transition-transform"
								>
									Battle →
								</span>
							</div>
						</div>
					</Card>
				</a>

				<!-- Tournament -->
				<a href="/tournament" class="block group md:col-span-2 xl:col-span-1">
					<Card variant="lime" hoverable class="h-full">
						<div class="flex flex-col h-full">
							<div class="text-5xl mb-6">&#x1F3C6;</div>
							<h3 class="text-2xl font-black mb-4">Tournament</h3>
							<p class="opacity-80 mb-6 grow leading-relaxed">
								Bracket-style competition. Double elimination!
							</p>
							<div class="flex items-center justify-between">
								<span
									class="brutal-border brutal-shadow-sm bg-white text-black px-4 py-2 text-sm font-bold"
								>
									1 active
								</span>
								<span
									class="font-bold uppercase text-sm group-hover:translate-x-2 transition-transform"
								>
									Compete →
								</span>
							</div>
						</div>
					</Card>
				</a>
			</div>

			<!-- Stats Bar -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<Card class="text-center py-6">
					<div class="text-3xl md:text-4xl font-black text-orange">
						{dummyUser.totalPoints.toLocaleString()}
					</div>
					<div class="text-xs font-bold uppercase opacity-60 mt-2">Total Points</div>
				</Card>
				<Card class="text-center py-6">
					<div class="text-3xl md:text-4xl font-black text-magenta">{dummyUser.currentStreak}</div>
					<div class="text-xs font-bold uppercase opacity-60 mt-2">Day Streak</div>
				</Card>
				<Card class="text-center py-6">
					<div class="text-3xl md:text-4xl font-black text-cyan">#7</div>
					<div class="text-xs font-bold uppercase opacity-60 mt-2">Rank</div>
				</Card>
				<Card class="text-center py-6">
					<div class="text-3xl md:text-4xl font-black text-lime">42</div>
					<div class="text-xs font-bold uppercase opacity-60 mt-2">Games Played</div>
				</Card>
			</div>
		</div>
	</main>
</div>
