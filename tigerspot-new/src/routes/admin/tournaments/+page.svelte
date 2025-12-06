<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { listTournaments, type Tournament } from '$lib/api/tournament';
	import {
		createTournament,
		startTournament,
		deleteTournament,
		addTestPlayers
	} from '$lib/api/admin';
	import { userStore } from '$lib/stores/user.svelte';

	// Form state
	let name = $state('');
	let timeLimit = $state(30);
	let roundsPerMatch = $state(5);
	let testPlayerCount = $state(7);
	let showSuccess = $state(false);
	let creating = $state(false);
	let loading = $state(true);
	let addingTestPlayers = $state<number | null>(null);

	// Tournaments from API
	let tournaments = $state<Tournament[]>([]);

	const statusColors: Record<string, string> = {
		open: 'bg-white text-black',
		in_progress: 'bg-orange text-white',
		completed: 'bg-lime text-white'
	};

	onMount(async () => {
		// Redirect if not admin
		if (!userStore.isAdmin && !userStore.loading) {
			goto('/menu');
			return;
		}
		tournaments = await listTournaments();
		loading = false;
	});

	async function handleCreate() {
		if (!name.trim()) {
			alert('Please enter a tournament name');
			return;
		}

		creating = true;

		const result = await createTournament({
			name: name.trim(),
			timeLimit,
			roundsPerMatch
		});

		if (result) {
			// Reload tournaments
			tournaments = await listTournaments();

			// Reset form
			name = '';
			timeLimit = 30;
			roundsPerMatch = 5;

			// Show success message
			showSuccess = true;
			setTimeout(() => (showSuccess = false), 3000);
		} else {
			alert('Failed to create tournament');
		}

		creating = false;
	}

	async function handleStart(id: number) {
		const success = await startTournament(id);
		if (success) {
			tournaments = tournaments.map((t) =>
				t.id === id ? { ...t, status: 'in_progress' as const } : t
			);
		}
	}

	async function handleDelete(id: number) {
		if (confirm('Are you sure you want to delete this tournament? This cannot be undone.')) {
			const success = await deleteTournament(id);
			if (success) {
				tournaments = tournaments.filter((t) => t.id !== id);
			}
		}
	}

	async function handleAddTestPlayers(tournamentId: number) {
		addingTestPlayers = tournamentId;
		const result = await addTestPlayers(tournamentId, testPlayerCount);
		if (result?.success) {
			// Reload tournaments to update participant count
			tournaments = await listTournaments();
			alert(`Added ${result.addedPlayers.length} test players!`);
		} else {
			alert('Failed to add test players');
		}
		addingTestPlayers = null;
	}
</script>

<div class="max-w-4xl mx-auto">
	<h2 class="text-3xl font-black mb-8">Manage Tournaments</h2>

	<!-- Success Message -->
	{#if showSuccess}
		<div class="brutal-border bg-lime text-white p-4 mb-6 font-bold flex items-center gap-3">
			<span class="text-2xl">✅</span>
			Tournament created successfully!
		</div>
	{/if}

	<!-- Create Tournament Form -->
	<Card class="mb-10">
		<h3 class="text-xl font-black uppercase mb-6">Create New Tournament</h3>

		<div class="grid md:grid-cols-2 gap-6">
			<!-- Name -->
			<div class="md:col-span-2">
				<label for="name" class="block text-sm font-bold uppercase mb-2">Tournament Name</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					placeholder="e.g., Spring Showdown 2024"
					class="w-full brutal-border px-4 py-3 font-bold focus:outline-none focus:ring-4 focus:ring-orange/50"
				/>
			</div>

			<!-- Time Limit -->
			<div>
				<label for="timeLimit" class="block text-sm font-bold uppercase mb-2"
					>Time Limit (seconds)</label
				>
				<input
					id="timeLimit"
					type="number"
					bind:value={timeLimit}
					min="10"
					max="120"
					class="w-full brutal-border px-4 py-3 font-bold focus:outline-none focus:ring-4 focus:ring-orange/50"
				/>
			</div>

			<!-- Rounds Per Match -->
			<div>
				<label for="rounds" class="block text-sm font-bold uppercase mb-2">Rounds Per Match</label>
				<input
					id="rounds"
					type="number"
					bind:value={roundsPerMatch}
					min="1"
					max="10"
					class="w-full brutal-border px-4 py-3 font-bold focus:outline-none focus:ring-4 focus:ring-orange/50"
				/>
			</div>

			<!-- Format Info -->
			<div class="flex items-center gap-3 text-black/60">
				<span class="text-2xl">ℹ️</span>
				<span class="text-sm"
					>All tournaments use double elimination format. Any number of participants can join.</span
				>
			</div>
		</div>

		<div class="mt-8">
			<Button variant="lime" size="lg" onclick={handleCreate} disabled={creating}>
				{creating ? 'Creating...' : 'Create Tournament'}
			</Button>
		</div>
	</Card>

	<!-- Existing Tournaments -->
	<h3 class="text-xl font-black uppercase mb-6">Existing Tournaments</h3>

	{#if loading}
		<div class="text-center py-12">
			<div class="text-4xl mb-4">🐯</div>
			<p class="font-bold">Loading tournaments...</p>
		</div>
	{:else if tournaments.length === 0}
		<Card class="text-center py-10">
			<div class="text-4xl mb-4">🏆</div>
			<p class="text-black/60">No tournaments yet. Create one above!</p>
		</Card>
	{:else}
		<div class="space-y-4">
			{#each tournaments as tournament}
				<Card class="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h4 class="text-lg font-black">{tournament.name}</h4>
							<span
								class="brutal-border px-2 py-0.5 text-xs font-bold uppercase {statusColors[
									tournament.status
								]}"
							>
								{tournament.status === 'in_progress' ? 'LIVE' : tournament.status}
							</span>
						</div>
						<div class="flex flex-wrap gap-3 text-sm">
							<span class="opacity-60">
								<span class="font-bold capitalize">{tournament.difficulty}</span> difficulty
							</span>
							<span class="opacity-60">
								<span class="font-bold">{tournament.participants}</span>
								{#if tournament.maxParticipants}
									/{tournament.maxParticipants}
								{/if}
								participants
							</span>
							<span class="opacity-60">
								<span class="font-bold">{tournament.timeLimit}s</span> per round
							</span>
						</div>

						<!-- Dev-only test controls -->
						{#if dev && tournament.status === 'open'}
							<div class="flex items-center gap-2 mt-3 p-2 bg-orange/10 brutal-border">
								<span class="text-xs font-bold uppercase text-orange">DEV:</span>
								<input
									type="number"
									bind:value={testPlayerCount}
									min="1"
									max="31"
									class="w-16 brutal-border px-2 py-1 text-sm font-bold"
								/>
								<Button
									variant="orange"
									size="sm"
									onclick={() => handleAddTestPlayers(tournament.id)}
									disabled={addingTestPlayers === tournament.id}
								>
									{addingTestPlayers === tournament.id ? 'Adding...' : 'Add Test Players'}
								</Button>
							</div>
						{/if}
					</div>

					<div class="flex gap-2">
						{#if tournament.status === 'open'}
							<Button variant="lime" onclick={() => handleStart(tournament.id)}>Start</Button>
						{/if}
						<Button variant="magenta" onclick={() => handleDelete(tournament.id)}>Delete</Button>
						{#if tournament.status === 'in_progress'}
							<Button variant="cyan" href={`/tournament/${tournament.id}`}>View Bracket</Button>
						{/if}
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
