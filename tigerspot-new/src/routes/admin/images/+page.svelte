<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import Map from '$lib/components/Map.svelte';
	import { listImages, uploadImage, deleteImage, type Picture } from '$lib/api/admin';
	import { userStore } from '$lib/stores/user.svelte';

	// Form state
	let imagePreview = $state<string | null>(null);
	let selectedFile = $state<File | null>(null);
	let placeName = $state('');
	let difficulty = $state<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
	let coordinates = $state<{ lat: number; lng: number } | null>(null);
	let showSuccess = $state(false);
	let uploading = $state(false);
	let loading = $state(true);

	// Images from API
	let images = $state<Picture[]>([]);

	const difficultyOptions = [
		{ value: 'EASY', label: 'Easy', color: 'bg-lime' },
		{ value: 'MEDIUM', label: 'Medium', color: 'bg-cyan' },
		{ value: 'HARD', label: 'Hard', color: 'bg-magenta' }
	];

	const difficultyColors: Record<string, string> = {
		EASY: 'bg-lime',
		MEDIUM: 'bg-cyan',
		HARD: 'bg-magenta'
	};

	onMount(async () => {
		// Redirect if not admin
		if (!userStore.isAdmin && !userStore.loading) {
			goto('/menu');
			return;
		}
		images = await listImages();
		loading = false;
	});

	function handleFileSelect(file: File, previewUrl: string) {
		selectedFile = file;
		imagePreview = previewUrl;
	}

	function handleClearImage() {
		if (imagePreview) {
			URL.revokeObjectURL(imagePreview);
		}
		imagePreview = null;
		selectedFile = null;
	}

	function handleMapSelect(coords: { lat: number; lng: number }) {
		coordinates = coords;
	}

	async function handleAdd() {
		if (!selectedFile) {
			alert('Please select an image');
			return;
		}
		if (!placeName.trim()) {
			alert('Please enter a place name');
			return;
		}

		uploading = true;

		// Upload to server - it handles EXIF extraction and Cloudinary upload
		// Pass coordinates if manually set on map (used as fallback if no EXIF GPS)
		const result = await uploadImage(
			selectedFile,
			placeName.trim(),
			difficulty,
			coordinates ?? undefined
		);

		if (result?.success && result.picture) {
			// Add to local list
			images = [result.picture, ...images];

			// Reset form
			if (imagePreview) {
				URL.revokeObjectURL(imagePreview);
			}
			imagePreview = null;
			selectedFile = null;
			placeName = '';
			difficulty = 'MEDIUM';
			coordinates = null;

			// Show success
			showSuccess = true;
			setTimeout(() => (showSuccess = false), 3000);
		} else if (result?.requiresCoordinates) {
			// No GPS in EXIF and no manual coordinates provided
			alert(
				'No GPS data found in image. Please click on the map to set coordinates, then try again.'
			);
		} else {
			alert(result?.message || 'Failed to upload image');
		}

		uploading = false;
	}

	async function handleDelete(id: number) {
		if (confirm('Are you sure you want to delete this image?')) {
			const success = await deleteImage(id);
			if (success) {
				images = images.filter((img) => img.id !== id);
			}
		}
	}
</script>

<div class="max-w-6xl mx-auto">
	<h2 class="text-3xl font-black mb-8">Manage Images</h2>

	<!-- Success Message -->
	{#if showSuccess}
		<div class="brutal-border bg-lime text-white p-4 mb-6 font-bold flex items-center gap-3">
			<span class="text-2xl">✅</span>
			Image added successfully!
		</div>
	{/if}

	<!-- Add Image Form -->
	<Card class="mb-10">
		<h3 class="text-xl font-black uppercase mb-6">Add New Image</h3>

		<div class="grid lg:grid-cols-2 gap-8">
			<!-- Left Column: Image Upload -->
			<div>
				<label class="block text-sm font-bold uppercase mb-2">Image</label>
				<ImageUpload
					onSelect={handleFileSelect}
					preview={imagePreview}
					onClear={handleClearImage}
				/>
			</div>

			<!-- Right Column: Location -->
			<div>
				<label class="block text-sm font-bold uppercase mb-2">Location (click on map)</label>
				<div class="brutal-border overflow-hidden h-64">
					<Map onSelect={handleMapSelect} guessLocation={coordinates ?? undefined} />
				</div>
				{#if coordinates}
					<p class="mt-2 text-sm font-mono opacity-60">
						{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
					</p>
				{/if}
			</div>
		</div>

		<!-- Details Row -->
		<div class="grid md:grid-cols-2 gap-6 mt-6">
			<!-- Place Name -->
			<div>
				<label for="placeName" class="block text-sm font-bold uppercase mb-2">Place Name</label>
				<input
					id="placeName"
					type="text"
					bind:value={placeName}
					placeholder="e.g., Nassau Hall"
					class="w-full brutal-border px-4 py-3 font-bold focus:outline-none focus:ring-4 focus:ring-orange/50"
				/>
			</div>

			<!-- Difficulty -->
			<div>
				<label class="block text-sm font-bold uppercase mb-2">Difficulty</label>
				<div class="grid grid-cols-3 gap-2">
					{#each difficultyOptions as option}
						<button
							type="button"
							onclick={() => (difficulty = option.value as 'EASY' | 'MEDIUM' | 'HARD')}
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
		</div>

		<div class="mt-8">
			<Button variant="cyan" size="lg" onclick={handleAdd} disabled={uploading}>
				{uploading ? 'Uploading...' : 'Add Image'}
			</Button>
		</div>
	</Card>

	<!-- Existing Images -->
	<h3 class="text-xl font-black uppercase mb-6">Existing Images ({images.length})</h3>

	{#if loading}
		<div class="text-center py-12">
			<div class="text-4xl mb-4">🐯</div>
			<p class="font-bold">Loading images...</p>
		</div>
	{:else if images.length === 0}
		<Card class="text-center py-10">
			<div class="text-4xl mb-4">🖼️</div>
			<p class="text-black/60">No images yet. Add one above!</p>
		</Card>
	{:else}
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each images as image}
				<Card class="p-0 overflow-hidden">
					<!-- Image -->
					<div class="relative h-40 bg-gray">
						<img src={image.imageUrl} alt={image.placeName} class="w-full h-full object-cover" />
						<span
							class="absolute top-2 right-2 brutal-border px-2 py-0.5 text-xs font-bold uppercase text-white {difficultyColors[
								image.difficulty
							]}"
						>
							{image.difficulty}
						</span>
					</div>

					<!-- Info -->
					<div class="p-4">
						<h4 class="font-black mb-1">{image.placeName}</h4>
						<p class="text-xs font-mono opacity-60 mb-3">
							{image.latitude.toFixed(4)}, {image.longitude.toFixed(4)}
						</p>
						<Button variant="magenta" onclick={() => handleDelete(image.id)} class="w-full">
							Delete
						</Button>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
