<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import Header from '$lib/components/Header.svelte';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	const teamMembers = [
		{
			name: 'Ethan Do',
			image: '/team/ethan.jpeg',
			favoriteSpot: 'Dillon Gym',
			color: 'cyan'
		},
		{
			name: 'Claudia Lee',
			image: '/team/claudia.jpeg',
			favoriteSpot: 'Zodiac Heads',
			color: 'magenta'
		},
		{
			name: 'Frank Liu',
			image: '/team/frank.jpeg',
			favoriteSpot: 'Cannon Green',
			color: 'lime'
		},
		{
			name: 'Winsice Ng',
			image: '/team/winsice.jpeg',
			favoriteSpot: 'Tower Club',
			color: 'orange'
		},
		{
			name: 'Jessica Yan',
			image: '/team/jessica.jpeg',
			favoriteSpot: 'Charter Club',
			color: 'pink'
		}
	];
</script>

<svelte:head>
	<title>About - TigerSpot</title>
</svelte:head>

<Header />

<div class="min-h-screen bg-primary relative overflow-hidden pt-24">
	<!-- Subtle pattern overlay -->
	<div class="absolute inset-0 bg-stripes opacity-20"></div>

	<!-- Main content -->
	<div class="relative container-brutal min-h-screen py-16 px-4">
		<!-- Page Title -->
		<div class="text-center mb-16 mt-8 {mounted ? 'animate-bounce-in' : 'opacity-0'}">
			<h1 class="text-5xl md:text-6xl font-black mb-4">Meet the Team</h1>
			<p class="text-xl font-bold opacity-80">The original creators of TigerSpot</p>
		</div>

		<!-- About Section -->
		<div class="{mounted ? 'animate-slide-up delay-200' : 'opacity-0'} max-w-4xl mx-auto mb-16">
			<Card class="text-center">
				<h2 class="text-2xl md:text-3xl font-bold mb-6">What is TigerSpot?</h2>
				<p class="text-lg leading-relaxed opacity-80 mb-4">
					TigerSpot is a location-guessing game that tests how well you know Princeton's campus.
					From iconic landmarks to hidden corners, challenge yourself to identify locations from
					photos and compete with fellow Tigers!
				</p>
				<p class="text-lg leading-relaxed opacity-80">
					Originally created as a COS 333 project in Spring 2024, TigerSpot brings the Princeton
					community together through friendly competition and campus exploration.
				</p>
			</Card>
		</div>

		<!-- Team Grid -->
		<div
			class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto {mounted
				? 'animate-slide-up delay-300'
				: 'opacity-0'}"
		>
			{#each teamMembers as member, i}
				<div
					class="transform transition-all duration-300 hover:scale-105"
					style="animation-delay: {300 + i * 100}ms"
				>
					<Card class="text-center h-full">
						<div class="relative mx-auto w-40 h-40 mb-6">
							<div class="absolute inset-0 bg-black translate-x-2 translate-y-2"></div>
							<img
								src={member.image}
								alt={member.name}
								class="relative w-full h-full object-cover brutal-border"
							/>
						</div>
						<h3 class="text-xl font-bold mb-2">{member.name}</h3>
						<p class="text-sm opacity-80">
							<span class="font-semibold">Favorite Spot:</span>
							{member.favoriteSpot}
						</p>
					</Card>
				</div>
			{/each}
		</div>

		<!-- Current Maintainers Section -->
		<div class="{mounted ? 'animate-slide-up delay-500' : 'opacity-0'} max-w-4xl mx-auto my-16">
			<Card class="text-center">
				<h2 class="text-2xl font-bold mb-4">Currently Maintained By</h2>
				<a
					href="https://tigerapps.org"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-block"
				>
					<span class="text-3xl font-black text-orange hover:underline">TigerApps</span>
				</a>
				<p class="mt-4 text-sm opacity-70">
					TigerApps is a student organization that builds and maintains useful applications for the
					Princeton community.
				</p>
			</Card>
		</div>
	</div>
</div>

<style>
	.text-orange {
		color: var(--color-orange);
	}
</style>
