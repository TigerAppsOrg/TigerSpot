<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/Card.svelte';
	import { listTournaments, type Tournament } from '$lib/api/tournament';
	import { listImages, type Picture } from '$lib/api/admin';
	import { userStore } from '$lib/stores/user.svelte';

	let tournaments = $state<Tournament[]>([]);
	let images = $state<Picture[]>([]);
	let loading = $state(true);

	const activeTournaments = $derived(tournaments.filter((t) => t.status === 'in_progress').length);
	const openTournaments = $derived(tournaments.filter((t) => t.status === 'open').length);

	onMount(async () => {
		// Redirect if not admin
		if (!userStore.isAdmin && !userStore.loading) {
			goto('/menu');
			return;
		}
		const [tournamentsData, imagesData] = await Promise.all([listTournaments(), listImages()]);
		tournaments = tournamentsData;
		images = imagesData;
		loading = false;
	});
</script>

<div class="max-w-4xl mx-auto">
	<!-- Welcome -->
	<div class="text-center mb-10">
		<div class="text-5xl mb-4">⚙️</div>
		<h2 class="text-3xl font-black mb-2">Welcome, Admin</h2>
		<p class="text-black/60">Manage tournaments and location images</p>
	</div>

	<!-- Quick Actions -->
	<div class="grid md:grid-cols-2 gap-8">
		<!-- Tournaments Card -->
		<a href="/admin/tournaments" class="block group">
			<Card variant="lime" hoverable class="h-full">
				<div class="flex flex-col h-full">
					<div class="text-5xl mb-6">🏆</div>
					<h3 class="text-2xl font-black mb-4">Manage Tournaments</h3>
					<p class="opacity-80 mb-6 grow leading-relaxed">
						Create new tournaments, start matches, and manage participants.
					</p>
					<div class="flex items-center justify-between">
						<div class="flex gap-2">
							{#if activeTournaments > 0}
								<span
									class="brutal-border brutal-shadow-sm bg-orange text-white px-3 py-1 text-sm font-bold"
								>
									{activeTournaments} active
								</span>
							{/if}
							{#if openTournaments > 0}
								<span
									class="brutal-border brutal-shadow-sm bg-white text-black px-3 py-1 text-sm font-bold"
								>
									{openTournaments} open
								</span>
							{/if}
						</div>
						<span
							class="font-bold uppercase text-sm group-hover:translate-x-2 transition-transform"
						>
							Manage →
						</span>
					</div>
				</div>
			</Card>
		</a>

		<!-- Images Card -->
		<a href="/admin/images" class="block group">
			<Card variant="cyan" hoverable class="h-full">
				<div class="flex flex-col h-full">
					<div class="text-5xl mb-6">🖼️</div>
					<h3 class="text-2xl font-black mb-4">Manage Images</h3>
					<p class="opacity-80 mb-6 grow leading-relaxed">
						Upload new location images, set coordinates, and manage difficulty.
					</p>
					<div class="flex items-center justify-between">
						<span
							class="brutal-border brutal-shadow-sm bg-white text-black px-3 py-1 text-sm font-bold"
						>
							{images.length} images
						</span>
						<span
							class="font-bold uppercase text-sm group-hover:translate-x-2 transition-transform"
						>
							Manage →
						</span>
					</div>
				</div>
			</Card>
		</a>
	</div>
</div>
