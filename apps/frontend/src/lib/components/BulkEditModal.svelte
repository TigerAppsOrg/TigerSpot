<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import { updateImage, type Picture } from '$lib/api/admin';

	interface Props {
		images: Picture[];
		onClose: () => void;
		onSave: (updated: Picture[]) => void;
	}

	let { images, onClose, onSave }: Props = $props();

	// Bulk edit state - null means "no change"
	let bulkDifficulty = $state<'EASY' | 'MEDIUM' | 'HARD' | null>(null);
	let bulkShowInDaily = $state<boolean | null>(null);
	let bulkShowInVersus = $state<boolean | null>(null);
	let bulkShowInTournament = $state<boolean | null>(null);
	let saving = $state(false);

	const difficultyOptions = [
		{ value: null, label: 'Unchanged', color: 'bg-gray/50' },
		{ value: 'EASY', label: 'Easy', color: 'bg-lime' },
		{ value: 'MEDIUM', label: 'Medium', color: 'bg-cyan' },
		{ value: 'HARD', label: 'Hard', color: 'bg-magenta' }
	];

	// Three-state toggle: null (unchanged) -> true (on) -> false (off) -> null
	function cycleToggle(current: boolean | null): boolean | null {
		if (current === null) return true;
		if (current === true) return false;
		return null;
	}

	function getToggleLabel(value: boolean | null): string {
		if (value === null) return '—';
		return value ? 'ON' : 'OFF';
	}

	function getToggleClass(value: boolean | null, onColor: string): string {
		if (value === null) return 'bg-gray/30 text-black/50';
		if (value === true) return `${onColor} text-white`;
		return 'bg-white text-black/50 line-through';
	}

	async function handleSave() {
		saving = true;

		const updates: Partial<{
			difficulty: 'EASY' | 'MEDIUM' | 'HARD';
			showInDaily: boolean;
			showInVersus: boolean;
			showInTournament: boolean;
		}> = {};

		if (bulkDifficulty !== null) updates.difficulty = bulkDifficulty;
		if (bulkShowInDaily !== null) updates.showInDaily = bulkShowInDaily;
		if (bulkShowInVersus !== null) updates.showInVersus = bulkShowInVersus;
		if (bulkShowInTournament !== null) updates.showInTournament = bulkShowInTournament;

		// Only proceed if there are changes
		if (Object.keys(updates).length === 0) {
			alert('No changes selected');
			saving = false;
			return;
		}

		try {
			const results: Picture[] = [];
			let failed = 0;
			const imagesToUpdate = [...images];
			for (const image of imagesToUpdate) {
				const updated = await updateImage(image.id, updates);
				if (updated) {
					results.push(updated);
				} else {
					console.error(`Failed to update image ${image.id}`);
					failed++;
				}
			}
			if (failed > 0) {
				alert(`Failed to update ${failed} image(s). Check console for details.`);
			}
			if (results.length > 0) {
				onSave(results);
			}
		} catch (error) {
			console.error('Bulk update error:', error);
			alert(
				'Failed to update images: ' + (error instanceof Error ? error.message : 'Unknown error')
			);
		}

		saving = false;
	}

	// Check if any changes have been made
	let hasChanges = $derived(
		bulkDifficulty !== null ||
			bulkShowInDaily !== null ||
			bulkShowInVersus !== null ||
			bulkShowInTournament !== null
	);
</script>

<!-- Fullscreen Bulk Edit Modal -->
<div
	class="fixed inset-0 bg-primary z-50 flex flex-col"
	role="dialog"
	tabindex="-1"
	onkeydown={(e) => e.key === 'Escape' && onClose()}
>
	<!-- Header -->
	<div class="p-5 flex items-center justify-between bg-white flex-shrink-0 brutal-border-b">
		<div>
			<h2 class="text-xl font-black uppercase">Bulk Edit</h2>
			<p class="text-sm text-black/60">
				{images.length} image{images.length !== 1 ? 's' : ''} selected
			</p>
		</div>
		<button
			type="button"
			onclick={onClose}
			class="w-10 h-10 bg-magenta text-white brutal-border font-black text-lg hover:bg-magenta/80 transition-colors flex items-center justify-center"
			title="Close"
		>
			×
		</button>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-6">
		<div class="max-w-2xl mx-auto">
			<!-- Selected Images Preview -->
			<Card class="mb-6">
				<h3 class="text-sm font-bold uppercase mb-3">Selected Images</h3>
				<div class="flex gap-2 overflow-x-auto pb-2">
					{#each images as image}
						<img
							src={image.imageUrl}
							alt="Selected"
							class="w-16 h-16 object-cover brutal-border flex-shrink-0"
						/>
					{/each}
				</div>
			</Card>

			<!-- Difficulty -->
			<Card class="mb-6">
				<h3 class="text-sm font-bold uppercase mb-3">Difficulty</h3>
				<p class="text-xs text-black/50 mb-3">
					Select a difficulty to apply to all selected images, or leave unchanged
				</p>
				<div class="grid grid-cols-4 gap-2">
					{#each difficultyOptions as option}
						<button
							type="button"
							onclick={() => (bulkDifficulty = option.value as typeof bulkDifficulty)}
							class="brutal-border px-3 py-2 font-bold text-sm uppercase transition-all {bulkDifficulty ===
							option.value
								? `${option.color} ${option.value ? 'text-white' : 'text-black'}`
								: 'bg-white hover:bg-gray/50'}"
						>
							{option.label}
						</button>
					{/each}
				</div>
			</Card>

			<!-- Mode Visibility -->
			<Card>
				<h3 class="text-sm font-bold uppercase mb-3">Game Mode Visibility</h3>
				<p class="text-xs text-black/50 mb-3">Click to cycle: Unchanged → ON → OFF</p>
				<div class="grid grid-cols-3 gap-4">
					<button
						type="button"
						onclick={() => (bulkShowInDaily = cycleToggle(bulkShowInDaily))}
						class="brutal-border p-4 font-bold text-center transition-all {getToggleClass(
							bulkShowInDaily,
							'bg-orange'
						)}"
					>
						<div class="text-lg mb-1">Daily</div>
						<div class="text-xs uppercase">{getToggleLabel(bulkShowInDaily)}</div>
					</button>
					<button
						type="button"
						onclick={() => (bulkShowInVersus = cycleToggle(bulkShowInVersus))}
						class="brutal-border p-4 font-bold text-center transition-all {getToggleClass(
							bulkShowInVersus,
							'bg-cyan'
						)}"
					>
						<div class="text-lg mb-1">Versus</div>
						<div class="text-xs uppercase">{getToggleLabel(bulkShowInVersus)}</div>
					</button>
					<button
						type="button"
						onclick={() => (bulkShowInTournament = cycleToggle(bulkShowInTournament))}
						class="brutal-border p-4 font-bold text-center transition-all {getToggleClass(
							bulkShowInTournament,
							'bg-magenta'
						)}"
					>
						<div class="text-lg mb-1">Tournament</div>
						<div class="text-xs uppercase">{getToggleLabel(bulkShowInTournament)}</div>
					</button>
				</div>
			</Card>
		</div>
	</div>

	<!-- Footer -->
	<div class="p-5 bg-white flex-shrink-0 brutal-border-t flex justify-between items-center">
		<p class="text-sm text-black/50">
			{#if hasChanges}
				Changes will be applied to {images.length} image{images.length !== 1 ? 's' : ''}
			{:else}
				No changes selected
			{/if}
		</p>
		<div class="flex gap-3">
			<Button variant="magenta" onclick={onClose} disabled={saving}>Cancel</Button>
			<Button variant="cyan" onclick={handleSave} disabled={saving || !hasChanges}>
				{saving ? 'Saving...' : 'Apply Changes'}
			</Button>
		</div>
	</div>
</div>
