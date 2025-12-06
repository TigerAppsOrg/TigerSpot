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
	let rotation = $state(0); // 0, 90, 180, 270
	let currentFile: File | null = null;
	let currentGpsCoords: { lat: number; lng: number } | null = null;
	let originalPreview: string | null = null;
	let rotatedPreview = $state<string | null>(null);

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
				currentFile = file;
				currentGpsCoords = result.gpsCoords;
				rotation = 0;
				originalPreview = result.previewBase64;
				rotatedPreview = result.previewBase64;
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
		rotation = 0;
		currentFile = null;
		currentGpsCoords = null;
		originalPreview = null;
		rotatedPreview = null;
		onClear?.();
	}

	async function rotateImage(degrees: number) {
		rotation = (rotation + degrees + 360) % 360;

		if (!currentFile || !originalPreview) return;

		// Rotate both the preview and the actual file
		try {
			// Update the preview
			rotatedPreview = await rotatePreviewImage(originalPreview, rotation);

			// Rotate the actual file
			const rotatedFile = await rotateImageFile(originalPreview, rotation, currentFile.name);
			currentFile = rotatedFile;
			onSelect?.(rotatedFile, rotatedPreview, currentGpsCoords);
		} catch (error) {
			console.error('Failed to rotate image:', error);
		}
	}

	async function rotatePreviewImage(base64Image: string, degrees: number): Promise<string> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
					return;
				}

				// Set canvas dimensions based on rotation
				if (degrees === 90 || degrees === 270) {
					canvas.width = img.height;
					canvas.height = img.width;
				} else {
					canvas.width = img.width;
					canvas.height = img.height;
				}

				// Rotate and draw
				ctx.translate(canvas.width / 2, canvas.height / 2);
				ctx.rotate((degrees * Math.PI) / 180);
				ctx.drawImage(img, -img.width / 2, -img.height / 2);

				resolve(canvas.toDataURL('image/jpeg', 0.95));
			};
			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = base64Image;
		});
	}

	async function rotateImageFile(
		base64Preview: string,
		rotation: number,
		fileName: string
	): Promise<File> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
					return;
				}

				// Set canvas dimensions based on rotation
				if (rotation === 90 || rotation === 270) {
					canvas.width = img.height;
					canvas.height = img.width;
				} else {
					canvas.width = img.width;
					canvas.height = img.height;
				}

				// Rotate and draw
				ctx.translate(canvas.width / 2, canvas.height / 2);
				ctx.rotate((rotation * Math.PI) / 180);
				ctx.drawImage(img, -img.width / 2, -img.height / 2);

				// Convert to blob then to file
				canvas.toBlob(
					(blob) => {
						if (blob) {
							const file = new File([blob], fileName, { type: 'image/jpeg' });
							resolve(file);
						} else {
							reject(new Error('Failed to create blob'));
						}
					},
					'image/jpeg',
					0.95
				);
			};
			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = base64Preview;
		});
	}

	function openFilePicker() {
		fileInput?.click();
	}
</script>

<div class={className}>
	{#if preview}
		<!-- Preview Mode -->
		<div class="relative brutal-border overflow-hidden">
			<div class="overflow-hidden bg-gray/20 flex items-center justify-center min-h-[200px]">
				<img src={rotatedPreview || preview} alt="Preview" class="w-full h-auto" />
			</div>
			<div class="absolute top-3 right-3 flex gap-2">
				<button
					type="button"
					onclick={() => rotateImage(-90)}
					class="w-10 h-10 bg-cyan text-white brutal-border font-black text-lg hover:bg-cyan/80 transition-colors flex items-center justify-center"
					title="Rotate left 90°"
				>
					↺
				</button>
				<button
					type="button"
					onclick={() => rotateImage(90)}
					class="w-10 h-10 bg-cyan text-white brutal-border font-black text-lg hover:bg-cyan/80 transition-colors flex items-center justify-center"
					title="Rotate right 90°"
				>
					↻
				</button>
				<button
					type="button"
					onclick={handleClear}
					class="w-10 h-10 bg-magenta text-white brutal-border font-black text-lg hover:bg-magenta/80 transition-colors flex items-center justify-center"
					title="Remove image"
				>
					×
				</button>
			</div>
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
