<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import Map from './Map.svelte';

	interface Props {
		imageUrl: string;
		coords: { lat: number; lng: number };
		onClose: () => void;
	}

	let { imageUrl, coords, onClose }: Props = $props();
	let guessCoords = $state<{ lat: number; lng: number } | null>(null);

	function handleMapSelect(selectedCoords: { lat: number; lng: number }) {
		guessCoords = selectedCoords;
	}
</script>

<!-- Fullscreen View -->
<div
	class="fixed inset-0 bg-primary z-50 flex flex-col"
	role="dialog"
	tabindex="-1"
	onkeydown={(e) => e.key === 'Escape' && onClose()}
>
	<!-- Header -->
	<div class="p-5 flex items-center justify-between bg-white flex-shrink-0 brutal-border-b">
		<h2 class="text-xl font-black uppercase">Game Preview</h2>
		<button
			type="button"
			onclick={onClose}
			class="w-10 h-10 bg-magenta text-white brutal-border font-black text-lg hover:bg-magenta/80 transition-colors flex items-center justify-center"
			title="Close preview"
		>
			×
		</button>
	</div>

	<!-- Game-style Split View -->
	<div class="flex-1 overflow-auto p-6">
		<div class="w-full h-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
			<!-- Image Panel (Left) -->
			<div class="lg:w-1/2 flex flex-col min-h-[400px] lg:min-h-0">
				<Card class="flex flex-col p-0 overflow-hidden h-full">
					<div class="p-5 flex items-center justify-between">
						<h2 class="text-xl font-black uppercase">Where is this?</h2>
					</div>
					<div class="relative grow bg-gray w-full block">
						<img src={imageUrl} alt="Preview" class="w-full h-full object-cover" />
					</div>
				</Card>
			</div>

			<!-- Map Panel (Right) -->
			<div class="lg:w-1/2 flex flex-col min-h-[400px] lg:min-h-0">
				<Card class="flex flex-col p-0 overflow-hidden h-full">
					<div class="p-5 flex items-center justify-between">
						<h2 class="text-xl font-black uppercase">Click to guess</h2>
						<span
							class="brutal-border brutal-shadow-sm bg-lime px-4 py-2 text-sm font-bold {guessCoords
								? 'visible'
								: 'invisible'}"
						>
							Location selected
						</span>
					</div>
					<div class="grow">
						<Map onSelect={handleMapSelect} guessLocation={guessCoords ?? undefined} />
					</div>
				</Card>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div class="p-5 bg-white text-center flex-shrink-0 brutal-border-t">
		<p class="text-sm text-black/60 mb-2">This is how the image will appear in the game</p>
		{#if guessCoords}
			<p class="text-xs font-mono text-black/40 mb-4">
				Your guess: {guessCoords.lat.toFixed(4)}, {guessCoords.lng.toFixed(4)} | Actual: {coords.lat.toFixed(
					4
				)}, {coords.lng.toFixed(4)}
			</p>
		{:else}
			<p class="text-xs text-black/40 mb-4">Try clicking on the map to see how guessing works</p>
		{/if}
		<Button variant="cyan" onclick={onClose}>Close Preview</Button>
	</div>
</div>
