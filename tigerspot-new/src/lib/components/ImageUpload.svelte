<script lang="ts">
	import { processImagePreview } from '$lib/api/admin';

	interface Props {
		onSelect?: (
			file: File,
			previewUrl: string,
			gpsCoords: { lat: number; lng: number } | null
		) => void;
		preview?: string | null;
		onClear?: () => void;
		class?: string;
	}

	let { onSelect, preview = null, onClear, class: className = '' }: Props = $props();

	let isDragging = $state(false);
	let processing = $state(false);
	let fileInput: HTMLInputElement;

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	}

	function isHeic(file: File): boolean {
		const name = file.name.toLowerCase();
		return (
			file.type === 'image/heic' ||
			file.type === 'image/heif' ||
			name.endsWith('.heic') ||
			name.endsWith('.heif')
		);
	}

	async function handleFile(file: File) {
		// Check if it's an image (including HEIC)
		const isImage = file.type.startsWith('image/') || isHeic(file);
		if (!isImage) {
			alert('Please select an image file');
			return;
		}

		processing = true;

		try {
			// Send to server for processing (handles all formats including HEIC)
			const result = await processImagePreview(file);

			if (result) {
				// Server returns base64 preview and GPS coordinates
				onSelect?.(file, result.previewBase64, result.gpsCoords);
			} else {
				alert('Failed to process image. Please try again.');
			}
		} catch (error) {
			console.error('Image processing error:', error);
			alert('Failed to process image. Please try again.');
		} finally {
			processing = false;
		}
	}

	function handleClear() {
		if (fileInput) {
			fileInput.value = '';
		}
		onClear?.();
	}

	function openFilePicker() {
		fileInput?.click();
	}
</script>

<div class={className}>
	{#if preview}
		<!-- Preview Mode -->
		<div class="relative brutal-border overflow-hidden">
			<img src={preview} alt="Preview" class="w-full h-64 object-cover" />
			<button
				type="button"
				onclick={handleClear}
				class="absolute top-3 right-3 w-10 h-10 bg-magenta text-white brutal-border font-black text-lg hover:bg-magenta/80 transition-colors flex items-center justify-center"
			>
				×
			</button>
		</div>
	{:else if processing}
		<!-- Processing image -->
		<div class="brutal-border border-dashed border-4 p-8 text-center bg-cyan/10 border-cyan">
			<div class="text-5xl mb-4 animate-pulse">🔄</div>
			<p class="font-bold text-lg mb-2">Processing image...</p>
			<p class="text-black/60 text-sm">Extracting GPS data and generating preview</p>
		</div>
	{:else}
		<!-- Upload Zone -->
		<div
			role="button"
			tabindex="0"
			class="brutal-border border-dashed border-4 p-8 text-center cursor-pointer transition-all {isDragging
				? 'bg-cyan/20 border-cyan'
				: 'bg-white hover:bg-gray/50 border-black/30'}"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			onclick={openFilePicker}
			onkeydown={(e) => e.key === 'Enter' && openFilePicker()}
		>
			<div class="text-5xl mb-4">📸</div>
			<p class="font-bold text-lg mb-2">Drop an image here</p>
			<p class="text-black/60 text-sm mb-4">or click to browse (HEIC supported)</p>
			<span class="brutal-border brutal-shadow-sm bg-cyan text-white px-4 py-2 font-bold text-sm">
				Choose File
			</span>
		</div>
	{/if}

	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={handleFileSelect}
	/>
</div>
