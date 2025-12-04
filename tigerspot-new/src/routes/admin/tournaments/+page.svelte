<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { dummyTournaments } from '$lib/data/dummy';

	// Form state
	let name = $state('');
	let difficulty = $state<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
	let timeLimit = $state(30);
	let roundsPerMatch = $state(5);
	let showSuccess = $state(false);

	// Local tournaments list (for demo purposes)
	let tournaments = $state([...dummyTournaments]);

	const difficultyOptions = [
		{ value: 'easy', label: 'Easy', color: 'bg-lime' },
		{ value: 'medium', label: 'Medium', color: 'bg-cyan' },
		{ value: 'hard', label: 'Hard', color: 'bg-magenta' },
		{ value: 'mixed', label: 'Mixed', color: 'bg-orange' }
	];

	const statusColors: Record<string, string> = {
		open: 'bg-white text-black',
		in_progress: 'bg-orange text-white',
		completed: 'bg-lime text-white'
	};

	function handleCreate() {
		if (!name.trim()) {
			alert('Please enter a tournament name');
			return;
		}

		// Add to local list (demo only)
		const newTournament = {
			id: tournaments.length + 1,
			name: name.trim(),
			status: 'open' as const,
			difficulty,
			participants: 0,
			maxParticipants: 8,
			timeLimit
		};

		tournaments = [newTournament, ...tournaments];

		// Reset form
		name = '';
		difficulty = 'mixed';
		timeLimit = 30;
		roundsPerMatch = 5;

		// Show success message
		showSuccess = true;
		setTimeout(() => (showSuccess = false), 3000);
	}

	function handleStart(id: number) {
		tournaments = tournaments.map((t) => (t.id === id ? { ...t, status: 'in_progress' } : t));
	}

	function handleDelete(id: number) {
		if (confirm('Are you sure you want to delete this tournament?')) {
			tournaments = tournaments.filter((t) => t.id !== id);
		}
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

			<!-- Difficulty -->
			<div>
				<label class="block text-sm font-bold uppercase mb-2">Difficulty</label>
				<div class="grid grid-cols-2 gap-2">
					{#each difficultyOptions as option}
						<button
							type="button"
							onclick={() => (difficulty = option.value as typeof difficulty)}
							class="brutal-border px-4 py-3 font-bold text-sm uppercase transition-all {difficulty ===
							option.value
								? `${option.color} text-white`
								: 'bg-white hover:bg-gray/50'}"
						>
							{option.label}
						</button>
					{/each}
				</div>
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
					>All tournaments use double elimination format with 8 participants</span
				>
			</div>
		</div>

		<div class="mt-8">
			<Button variant="lime" size="lg" onclick={handleCreate}>Create Tournament</Button>
		</div>
	</Card>

	<!-- Existing Tournaments -->
	<h3 class="text-xl font-black uppercase mb-6">Existing Tournaments</h3>

	{#if tournaments.length === 0}
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
								<span class="font-bold">{tournament.difficulty}</span> difficulty
							</span>
							<span class="opacity-60">
								<span class="font-bold">{tournament.participants}</span
								>/{tournament.maxParticipants}
								participants
							</span>
							<span class="opacity-60">
								<span class="font-bold">{tournament.timeLimit}s</span> per round
							</span>
						</div>
					</div>

					<div class="flex gap-2">
						{#if tournament.status === 'open'}
							<Button variant="lime" onclick={() => handleStart(tournament.id)}>Start</Button>
						{/if}
						{#if tournament.status !== 'in_progress'}
							<Button variant="magenta" onclick={() => handleDelete(tournament.id)}>Delete</Button>
						{/if}
						{#if tournament.status === 'in_progress'}
							<Button variant="cyan" href={`/tournament/${tournament.id}`}>View Bracket</Button>
						{/if}
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
