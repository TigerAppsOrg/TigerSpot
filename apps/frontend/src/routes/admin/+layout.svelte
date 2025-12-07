<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: '🏠' },
		{ href: '/admin/tournaments', label: 'Tournaments', icon: '🏆' },
		{ href: '/admin/images', label: 'Images', icon: '🖼️' }
	];

	const isActive = (href: string) => {
		if (href === '/admin') {
			return $page.url.pathname === '/admin';
		}
		return $page.url.pathname.startsWith(href);
	};
</script>

<svelte:head>
	<title>Admin Dashboard - TigerSpot</title>
</svelte:head>

<div class="min-h-screen bg-primary">
	<!-- Admin Header -->
	<header class="header-fixed bg-orange brutal-border">
		<div class="w-full h-full px-4 md:px-6 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<a href="/menu" class="text-white/80 hover:text-white font-bold text-sm">
					← Back to Menu
				</a>
				<div class="h-8 w-0.5 bg-white/30"></div>
				<h1 class="text-xl font-black text-white uppercase tracking-wide">Admin Dashboard</h1>
			</div>

			<!-- Nav tabs -->
			<nav class="hidden md:flex items-center gap-2">
				{#each navItems as item}
					<a
						href={item.href}
						class="px-4 py-2 font-bold text-sm uppercase transition-all {isActive(item.href)
							? 'bg-white text-orange brutal-border'
							: 'text-white hover:bg-white/20'}"
					>
						{item.icon}
						{item.label}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<!-- Mobile Nav -->
	<div class="md:hidden fixed top-[78px] left-0 right-0 bg-white brutal-border border-t-0 z-40">
		<nav class="flex">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex-1 px-3 py-3 font-bold text-xs uppercase text-center transition-all {isActive(
						item.href
					)
						? 'bg-orange text-white'
						: 'text-black hover:bg-orange/10'}"
				>
					<span class="block text-lg mb-1">{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</nav>
	</div>

	<!-- Main Content -->
	<main class="pt-24 md:pt-24 pb-12 px-4">
		<!-- Extra padding on mobile for second nav bar -->
		<div class="md:hidden h-16"></div>
		<div class="container-brutal">
			{@render children()}
		</div>
	</main>
</div>
