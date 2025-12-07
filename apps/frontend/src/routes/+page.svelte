<script lang="ts">
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { getDevUsers, type DevUser } from '$lib/api/auth';

	let mounted = $state(false);
	let showDevPanel = $state(false);
	let devUsers = $state<{ existing: DevUser[]; available: DevUser[] }>({
		existing: [],
		available: []
	});
	let customUsername = $state('');
	let devLoading = $state(false);

	onMount(async () => {
		mounted = true;
		// Check if already logged in
		await userStore.load();
		if (userStore.isAuthenticated) {
			goto('/menu');
		}

		// Load dev users if in dev mode
		if (dev) {
			const users = await getDevUsers();
			if (users) {
				devUsers = { existing: users.existingUsers, available: users.availableTestUsers };
			}
		}
	});

	function handleLogin() {
		userStore.login();
	}

	async function handleDevLogin(username: string) {
		devLoading = true;
		const success = await userStore.devLoginAs(username);
		devLoading = false;
		if (success) {
			goto('/menu');
		}
	}
</script>

<svelte:head>
	<title>TigerSpot - Princeton Campus Guessing Game</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<!-- Subtle pattern overlay -->
	<div class="absolute inset-0 bg-stripes opacity-20"></div>

	<!-- Main content -->
	<div
		class="relative container-brutal min-h-screen flex flex-col items-center justify-center py-16 px-4"
	>
		<!-- Logo/Title with bounce animation -->
		<div class="text-center mb-16 mt-16 {mounted ? 'animate-bounce-in' : 'opacity-0'}">
			<h1 class="font-black tracking-tight drop-shadow-lg">
				<img
					src="logo.png"
					alt="TigerSpot Logo"
					class="inline-block hover:animate-wiggle cursor-default w-2xl"
				/>
			</h1>
			<p class="text-xl font-bold uppercase tracking-wide">The Princeton Campus Guessing Game</p>
		</div>

		<!-- Hero Card with slide animation -->
		<div class="{mounted ? 'animate-slide-up delay-200' : 'opacity-0'} w-full max-w-4xl mb-12">
			<Card class="text-center">
				<h2 class="text-2xl md:text-3xl mb-6 font-bold">How well do you know Princeton?</h2>
				<p class="text-lg mb-8 opacity-80 leading-relaxed">
					Test your campus knowledge! Identify locations from photos and compete with fellow Tigers
					to top the leaderboard.
				</p>

				<!-- Game preview mockup with gradient background -->
				<div
					class="relative w-3/4 mx-auto aspect-video bg-gradient-animated brutal-border mb-8 overflow-hidden"
				>
					<div class="absolute inset-0 flex items-center justify-center bg-black/20">
						<div class="text-center text-white">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-20 w-20 mx-auto mb-4 drop-shadow-lg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
								<path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							<span class="font-bold uppercase text-lg tracking-wide drop-shadow-lg"
								>Where on campus?</span
							>
						</div>
					</div>
				</div>

				<Button variant="black" size="lg" onclick={handleLogin} class="text-xl">
					Login with Princeton CAS
				</Button>

				{#if dev}
					<div class="mt-6 pt-6 border-t-4 border-black">
						<button
							onclick={() => (showDevPanel = !showDevPanel)}
							class="text-sm font-bold uppercase opacity-60 hover:opacity-100 transition-opacity"
						>
							{showDevPanel ? 'Hide' : 'Show'} Dev Login
						</button>

						{#if showDevPanel}
							<div class="mt-4 text-left">
								<p class="text-xs font-bold uppercase mb-2 opacity-60">Quick Login (Test Users)</p>
								<div class="flex flex-wrap gap-2 mb-4">
									{#each devUsers.available as user}
										<button
											onclick={() => handleDevLogin(user.username)}
											disabled={devLoading}
											class="brutal-border px-3 py-1.5 text-sm font-bold hover:bg-cyan transition-colors disabled:opacity-50
												{user.isAdmin ? 'bg-magenta text-white' : 'bg-white'}"
										>
											{user.displayName}
											{#if user.isAdmin}
												<span class="text-xs">(Admin)</span>
											{/if}
										</button>
									{/each}
								</div>

								{#if devUsers.existing.length > 0}
									<p class="text-xs font-bold uppercase mb-2 opacity-60">Existing Users</p>
									<div class="flex flex-wrap gap-2 mb-4">
										{#each devUsers.existing as user}
											<button
												onclick={() => handleDevLogin(user.username)}
												disabled={devLoading}
												class="brutal-border px-3 py-1.5 text-sm font-bold bg-white hover:bg-lime transition-colors disabled:opacity-50"
											>
												{user.displayName}
												{#if user.isAdmin}
													<span class="text-xs text-magenta">(Admin)</span>
												{/if}
											</button>
										{/each}
									</div>
								{/if}

								<p class="text-xs font-bold uppercase mb-2 opacity-60">Custom Username</p>
								<div class="flex gap-2">
									<input
										type="text"
										bind:value={customUsername}
										placeholder="Enter username..."
										class="brutal-border px-3 py-1.5 text-sm font-bold flex-1"
									/>
									<button
										onclick={() => customUsername && handleDevLogin(customUsername)}
										disabled={devLoading || !customUsername}
										class="brutal-border px-4 py-1.5 text-sm font-bold bg-cyan hover:bg-cyan/80 transition-colors disabled:opacity-50"
									>
										Login
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</Card>
		</div>

		<!-- Feature cards with staggered animations -->
		<div
			class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl w-full {mounted
				? 'animate-slide-up delay-400'
				: 'opacity-0'}"
		>
			<Card variant="cyan" class="text-center">
				<div class="text-5xl mb-4">&#x1F4C5;</div>
				<h3 class="text-xl font-bold mb-3">Daily Challenge</h3>
				<p class="text-sm opacity-80">New location every day. Build your streak!</p>
			</Card>

			<Card variant="magenta" class="text-center">
				<div class="text-5xl mb-4">&#x2694;&#xFE0F;</div>
				<h3 class="text-xl font-bold mb-3">Versus Mode</h3>
				<p class="text-sm opacity-80">Challenge friends head-to-head!</p>
			</Card>

			<Card variant="lime" class="text-center sm:col-span-2 lg:col-span-1">
				<div class="text-5xl mb-4">&#x1F3C6;</div>
				<h3 class="text-xl font-bold mb-3">Tournaments</h3>
				<p class="text-sm opacity-80">Compete in bracket-style competitions!</p>
			</Card>
		</div>

		<!-- Footer -->
		<footer
			class="mt-20 text-center text-sm opacity-60 mb-6 {mounted
				? 'animate-slide-up delay-500'
				: 'opacity-0'}"
		>
			<p class="font-medium">
				Made with &#x1F9E1; by Ethan Do, Claudia Lee, Frank Liu, Winsice Ng, and Jessica Yan
			</p>
			<p>
				Maintained by <a
					class="underline hover:text-black transition-colors"
					href="https://tigerapps.org"
					target="_blank"
					rel="noopener noreferrer">TigerApps</a
				>
			</p>
		</footer>
	</div>
</div>
