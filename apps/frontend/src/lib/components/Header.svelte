<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';

	const navItems = [
		{ href: '/menu', label: 'Menu', icon: 'home' },
		{ href: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
		{ href: '/about', label: 'About', icon: 'users' }
	] as const;
</script>

<header class="header-fixed bg-white brutal-border">
	<div class="w-full h-full px-2 sm:px-4 md:px-6 flex items-center justify-between">
		<a href="/menu" class="min-h-11 flex shrink-0 items-center">
			<img src="/logo.png" alt="TigerSpot home" class="inline-block w-24 sm:w-36 md:w-40" />
		</a>
		<nav aria-label="Primary" class="flex shrink-0 items-center gap-1 md:gap-3 lg:gap-6">
			{#each navItems as item}
				<a
					href={item.href}
					title={item.label}
					aria-current={page.url.pathname === item.href ? 'page' : undefined}
					class="min-h-11 min-w-11 px-2 font-bold text-sm uppercase transition-colors inline-flex items-center justify-center gap-2 {page
						.url.pathname === item.href
						? 'text-orange-ink'
						: 'hover:text-orange-ink'}"
				>
					<Icon name={item.icon} class="text-lg md:text-base" />
					<span class="sr-only md:not-sr-only">{item.label}</span>
				</a>
			{/each}
		</nav>
	</div>
</header>
