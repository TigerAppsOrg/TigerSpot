<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
</script>

<header class="header-fixed bg-white brutal-border">
	<div class="w-full h-full px-6 flex items-center justify-between">
		<a href="/menu">
			<img src="/logo.png" alt="TigerSpot Logo" class="inline-block w-40" />
		</a>
		<nav class="flex items-center gap-6">
			<a
				href="/menu"
				class="font-bold text-sm uppercase hover:text-orange transition-colors inline-flex items-center gap-2"
			>
				<Icon name="home" class="text-base" />
				Menu
			</a>
			<a
				href="/leaderboard"
				class="font-bold text-sm uppercase hover:text-orange transition-colors inline-flex items-center gap-2"
			>
				<Icon name="trophy" class="text-base" />
				Leaderboard
			</a>
			<a
				href="/settings"
				class="font-bold text-sm uppercase hover:text-orange transition-colors inline-flex items-center gap-2"
			>
				<Icon name="settings" class="text-base" />
				Settings
			</a>
			<a
				href="/about"
				class="font-bold text-sm uppercase hover:text-orange transition-colors inline-flex items-center gap-2"
			>
				<Icon name="users" class="text-base" />
				About
			</a>
		</nav>
	</div>
</header>
