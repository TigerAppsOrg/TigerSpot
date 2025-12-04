<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';
	import { dummyUser } from '$lib/data/dummy';
	import { currentTheme, themes, type ThemeName } from '$lib/stores/theme';

	// Theme options for display
	const themeOptions: { name: ThemeName; color: string; label: string }[] = [
		{ name: 'orange', color: '#F5A623', label: 'Orange' },
		{ name: 'green', color: '#C8D5B9', label: 'Green' },
		{ name: 'beige', color: '#D4C5B0', label: 'Beige' },
		{ name: 'purple', color: '#C5B9D8', label: 'Purple' },
		{ name: 'gray', color: '#D1D1D1', label: 'Gray' },
		{ name: 'blue', color: '#B9D0E0', label: 'Blue' },
		{ name: 'cream', color: '#E8E0B9', label: 'Cream' },
		{ name: 'pink', color: '#E0C5D8', label: 'Pink' }
	];

	function selectTheme(themeName: ThemeName) {
		currentTheme.set(themeName);
	}
</script>

<svelte:head>
	<title>Profile & Settings - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<!-- Crosses pattern overlay -->
	<div class="absolute inset-0 bg-crosses opacity-40"></div>

	<Header />

	<main class="relative pt-24 pb-12 px-4">
		<div class="container-brutal max-w-4xl">
			<h1 class="text-4xl font-black mb-10 mt-8">Profile & Settings</h1>

			<div class="grid md:grid-cols-2 gap-8">
				<!-- Profile Section -->
				<Card>
					<h2 class="text-2xl font-black mb-8">&#x1F464; Profile</h2>

					<div class="text-center mb-8">
						<div
							class="w-28 h-28 bg-primary brutal-border brutal-shadow mx-auto flex items-center justify-center mb-6"
						>
							<span class="text-5xl">&#x1F42F;</span>
						</div>
						<h3 class="text-2xl font-bold">{dummyUser.username}</h3>
						<p class="text-sm opacity-60 mt-2">Princeton University</p>
					</div>

					<div class="space-y-5">
						<div class="flex justify-between items-center py-4 border-b-2 border-black/20">
							<span class="font-bold">Total Points</span>
							<span class="text-2xl font-black" style="color: #FF6600;"
								>{dummyUser.totalPoints.toLocaleString()}</span
							>
						</div>
						<div class="flex justify-between items-center py-4 border-b-2 border-black/20">
							<span class="font-bold">Current Streak</span>
							<span class="text-2xl font-black" style="color: #A0527D;"
								>{dummyUser.currentStreak} days</span
							>
						</div>
						<div class="flex justify-between items-center py-4 border-b-2 border-black/20">
							<span class="font-bold">Global Rank</span>
							<span class="text-2xl font-black" style="color: #4A8A9A;">#7</span>
						</div>
						<div class="flex justify-between items-center py-4 border-b-2 border-black/20">
							<span class="font-bold">Games Played</span>
							<span class="text-2xl font-black">42</span>
						</div>
						<div class="flex justify-between items-center py-4">
							<span class="font-bold">Best Streak</span>
							<span class="text-2xl font-black" style="color: #6B9E50;">14 days</span>
						</div>
					</div>
				</Card>

				<!-- Settings Section -->
				<div class="space-y-8">
					<Card>
						<h2 class="text-2xl font-black mb-8">&#x1F3A8; Theme</h2>

						<div class="grid grid-cols-4 gap-4">
							{#each themeOptions as theme}
								<button
									onclick={() => selectTheme(theme.name)}
									class="aspect-square brutal-border brutal-shadow transition-transform hover:scale-105 flex items-center justify-center text-2xl {$currentTheme ===
									theme.name
										? 'ring-4 ring-black ring-offset-2'
										: ''}"
									style="background-color: {theme.color};"
									title={theme.label}
								>
									{#if $currentTheme === theme.name}
										&#x2713;
									{/if}
								</button>
							{/each}
						</div>

						<p class="text-sm opacity-60 mt-6 text-center">
							Selected: <strong>{themeOptions.find((t) => t.name === $currentTheme)?.label}</strong>
						</p>
					</Card>
					<Card variant="magenta">
						<div class="text-center">
							<h3 class="text-xl font-bold mb-4">Sign Out</h3>
							<Button variant="white" onclick={() => alert('Logout functionality coming soon!')}>
								&#x1F6AA; Logout
							</Button>
						</div>
					</Card>
				</div>
			</div>
		</div>
	</main>
</div>
