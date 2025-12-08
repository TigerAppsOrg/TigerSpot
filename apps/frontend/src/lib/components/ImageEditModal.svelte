<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import Map from './Map.svelte';
	import { updateImage, type Picture } from '$lib/api/admin';

	interface Props {
		image: Picture;
		onClose: () => void;
		onSave: (updated: Picture) => void;
	}

	let { image, onClose, onSave }: Props = $props();

	// Local state for editable fields
	let editCoordinates = $state({ lat: image.latitude, lng: image.longitude });
	let editDifficulty = $state<'EASY' | 'MEDIUM' | 'HARD'>(image.difficulty);
	let editShowInDaily = $state(image.showInDaily);
	let editShowInVersus = $state(image.showInVersus);
	let editShowInTournament = $state(image.showInTournament);
	let saving = $state(false);

	const difficultyOptions = [
		{ value: 'EASY', label: 'Easy', color: 'bg-lime' },
		{ value: 'MEDIUM', label: 'Medium', color: 'bg-cyan' },
		{ value: 'HARD', label: 'Hard', color: 'bg-magenta' }
	];

	function handleMapSelect(coords: { lat: number; lng: number }) {
		editCoordinates = coords;
	}

	async function handleSave() {
		saving = true;
		try {
			const updated = await updateImage(image.id, {
				latitude: editCoordinates.lat,
				longitude: editCoordinates.lng,
				difficulty: editDifficulty,
				showInDaily: editShowInDaily,
				showInVersus: editShowInVersus,
				showInTournament: editShowInTournament
			});
			if (updated) {
				onSave(updated);
			} else {
				alert('Failed to update image');
			}
		} catch (error) {
			alert('Failed to update image');
		}
		saving = false;
	}
</script>

<!-- Fullscreen Edit Modal -->
<div
	class="fixed inset-0 bg-primary z-50 flex flex-col"
	role="dialog"
	tabindex="-1"
	onkeydown={(e) => e.key === 'Escape' && onClose()}
>
	<!-- Header -->
	<div class="p-5 flex items-center justify-between bg-white flex-shrink-0 brutal-border-b">
		<h2 class="text-xl font-black uppercase">Edit Image</h2>
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
		<div class="w-full h-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
			<!-- Image Panel (Left) -->
			<div class="lg:w-1/2 flex flex-col min-h-[300px] lg:min-h-0">
				<Card class="flex flex-col p-0 overflow-hidden h-full">
					<div class="p-5">
						<h3 class="text-lg font-black uppercase">Image Preview</h3>
					</div>
					<div class="relative grow bg-gray w-full block">
						<img src={image.imageUrl} alt="Location" class="w-full h-full object-cover" />
					</div>
				</Card>
			</div>

			<!-- Map Panel (Right) -->
			<div class="lg:w-1/2 flex flex-col min-h-[300px] lg:min-h-0">
				<Card class="flex flex-col p-0 overflow-hidden h-full">
					<div class="p-5">
						<h3 class="text-lg font-black uppercase">Location (click to change)</h3>
						<p class="text-xs font-mono opacity-60 mt-1">
							{editCoordinates.lat.toFixed(6)}, {editCoordinates.lng.toFixed(6)}
						</p>
					</div>
					<div class="grow">
						<Map onSelect={handleMapSelect} guessLocation={editCoordinates} centerOnGuess={true} />
					</div>
				</Card>
			</div>
		</div>

		<!-- Settings Section -->
		<div class="max-w-7xl mx-auto mt-6">
			<Card>
				<div class="grid md:grid-cols-2 gap-6">
					<!-- Difficulty -->
					<div>
						<label class="block text-sm font-bold uppercase mb-2">Difficulty</label>
						<div class="grid grid-cols-3 gap-2">
							{#each difficultyOptions as option}
								<button
									type="button"
									onclick={() => (editDifficulty = option.value as 'EASY' | 'MEDIUM' | 'HARD')}
									class="brutal-border px-4 py-3 font-bold text-sm uppercase transition-all {editDifficulty ===
									option.value
										? `${option.color} text-white`
										: 'bg-white hover:bg-gray/50'}"
								>
									{option.label}
								</button>
							{/each}
						</div>
					</div>

					<!-- Mode Visibility -->
					<div>
						<label class="block text-sm font-bold uppercase mb-2">Show In Game Modes</label>
						<div class="flex flex-wrap gap-4">
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={editShowInDaily}
									class="w-5 h-5 brutal-border accent-orange"
								/>
								<span class="font-bold">Daily</span>
							</label>
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={editShowInVersus}
									class="w-5 h-5 brutal-border accent-cyan"
								/>
								<span class="font-bold">Versus</span>
							</label>
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={editShowInTournament}
									class="w-5 h-5 brutal-border accent-magenta"
								/>
								<span class="font-bold">Tournament</span>
							</label>
						</div>
					</div>
				</div>
			</Card>
		</div>
	</div>

	<!-- Footer -->
	<div class="p-5 bg-white flex-shrink-0 brutal-border-t flex justify-end gap-3">
		<Button variant="magenta" onclick={onClose} disabled={saving}>Cancel</Button>
		<Button variant="cyan" onclick={handleSave} disabled={saving}>
			{saving ? 'Saving...' : 'Save Changes'}
		</Button>
	</div>
</div>
