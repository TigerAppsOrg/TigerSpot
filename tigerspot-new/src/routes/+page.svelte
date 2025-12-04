<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>TigerSpot - Princeton Campus Guessing Game</title>
</svelte:head>

<div class="min-h-screen bg-primary relative overflow-hidden">
	<!-- Subtle pattern overlay -->
	<div class="absolute inset-0 bg-stripes opacity-20"></div>

	<!-- Animated floating shapes -->
	<div
		class="absolute top-24 left-[10%] w-20 h-20 md:w-32 md:h-32 bg-cyan brutal-border brutal-shadow animate-float"
		style="--rotate: 12deg;"
	></div>
	<div
		class="absolute top-48 right-[15%] w-16 h-16 md:w-24 md:h-24 bg-magenta brutal-border brutal-shadow animate-float-delayed"
		style="--rotate: -8deg;"
	></div>
	<div
		class="absolute bottom-40 left-[20%] w-14 h-14 md:w-20 md:h-20 bg-lime brutal-border brutal-shadow animate-float"
		style="--rotate: 45deg;"
	></div>
	<div
		class="absolute bottom-28 right-[25%] w-18 h-18 md:w-28 md:h-28 bg-white brutal-border brutal-shadow animate-float-delayed"
		style="--rotate: -15deg;"
	></div>
	<div
		class="absolute top-1/3 left-[5%] w-12 h-12 md:w-16 md:h-16 bg-orange brutal-border brutal-shadow animate-float-delayed hidden lg:block"
		style="--rotate: 30deg;"
	></div>

	<!-- Main content -->
	<div class="relative container-brutal min-h-screen flex flex-col items-center justify-center py-16 px-4">
		<!-- Logo/Title with bounce animation -->
		<div class="text-center mb-16 {mounted ? 'animate-bounce-in' : 'opacity-0'}">
			<h1 class="text-5xl sm:text-6xl md:text-8xl font-black mb-6 tracking-tight drop-shadow-lg">
				<span class="inline-block hover:animate-wiggle cursor-default">TIGER</span><span class="inline-block hover:animate-wiggle cursor-default">SPOT</span>
			</h1>
			<p class="text-xl md:text-2xl font-bold uppercase tracking-wide">
				The Princeton Campus Guessing Game
			</p>
		</div>

		<!-- Hero Card with slide animation -->
		<div class="{mounted ? 'animate-slide-up delay-200' : 'opacity-0'} w-full max-w-2xl mb-12">
			<Card class="text-center">
				<h2 class="text-2xl md:text-3xl mb-6 font-bold">How well do you know Princeton?</h2>
				<p class="text-lg mb-8 opacity-80 leading-relaxed">
					Test your campus knowledge! Identify locations from photos and compete
					with fellow Tigers to top the leaderboard.
				</p>

				<!-- Game preview mockup with gradient background -->
				<div class="relative w-full aspect-video bg-gradient-animated brutal-border mb-8 overflow-hidden">
					<div class="absolute inset-0 flex items-center justify-center bg-black/20">
						<div class="text-center text-white">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 mx-auto mb-4 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							<span class="font-bold uppercase text-lg tracking-wide drop-shadow-lg">Where on campus?</span>
						</div>
					</div>
				</div>

				<Button variant="black" size="lg" href="/menu" class="text-xl">
					Login with Princeton CAS
				</Button>
			</Card>
		</div>

		<!-- Feature cards with staggered animations -->
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl w-full {mounted ? 'animate-slide-up delay-400' : 'opacity-0'}">
			<Card variant="cyan" hoverable class="text-center">
				<div class="text-5xl mb-4">&#x1F4C5;</div>
				<h3 class="text-xl font-bold mb-3">Daily Challenge</h3>
				<p class="text-sm opacity-80">New location every day. Build your streak!</p>
			</Card>

			<Card variant="magenta" hoverable class="text-center">
				<div class="text-5xl mb-4">&#x2694;&#xFE0F;</div>
				<h3 class="text-xl font-bold mb-3">Versus Mode</h3>
				<p class="text-sm opacity-80">Challenge friends head-to-head!</p>
			</Card>

			<Card variant="lime" hoverable class="text-center sm:col-span-2 lg:col-span-1">
				<div class="text-5xl mb-4">&#x1F3C6;</div>
				<h3 class="text-xl font-bold mb-3">Tournaments</h3>
				<p class="text-sm opacity-80">Compete in bracket-style competitions!</p>
			</Card>
		</div>

		<!-- Footer -->
		<footer class="mt-20 text-center text-sm opacity-60 {mounted ? 'animate-slide-up delay-500' : 'opacity-0'}">
			<p class="font-medium">Made with &#x1F9E1; by Princeton Students</p>
		</footer>
	</div>
</div>
