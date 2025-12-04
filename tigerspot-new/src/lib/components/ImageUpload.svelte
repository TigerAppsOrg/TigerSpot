<script lang="ts">
	interface Props {
		onSelect?: (file: File, previewUrl: string) => void;
		preview?: string | null;
		onClear?: () => void;
		class?: string;
	}

	let { onSelect, preview = null, onClear, class: className = '' }: Props = $props();

	let isDragging = $state(false);
	let converting = $state(false);
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

		let previewUrl: string;

		// Convert HEIC to JPEG for browser preview
		if (isHeic(file)) {
			converting = true;
			try {
				// Dynamic import to avoid SSR issues (heic2any uses window)
				const heic2any = (await import('heic2any')).default;
				const blob = await heic2any({
					blob: file,
					toType: 'image/jpeg',
					quality: 0.8
				});
				// heic2any can return an array of blobs for multi-image HEIC
				const resultBlob = Array.isArray(blob) ? blob[0] : blob;
				previewUrl = URL.createObjectURL(resultBlob);
			} catch (error) {
				console.error('HEIC conversion error:', error);
				// Fallback: try with lower quality or skip preview
				try {
					const heic2any = (await import('heic2any')).default;
					const blob = await heic2any({
						blob: file,
						toType: 'image/jpeg',
						quality: 0.5
					});
					const resultBlob = Array.isArray(blob) ? blob[0] : blob;
					previewUrl = URL.createObjectURL(resultBlob);
				} catch (retryError) {
					console.error('HEIC retry failed:', retryError);
					// Last resort: proceed without preview, server can still process it
					converting = false;
					const proceed = confirm(
						'Could not generate preview for this HEIC image, but you can still upload it. Continue?'
					);
					if (proceed) {
						// Use a placeholder and let server handle the actual image
						onSelect?.(file, '/placeholder-heic.svg');
					}
					return;
				}
			}
			converting = false;
		} else {
			previewUrl = URL.createObjectURL(file);
		}

		// Pass the original file (for upload) and preview URL (for display)
		onSelect?.(file, previewUrl);
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
	{:else if converting}
		<!-- Converting HEIC -->
		<div class="brutal-border border-dashed border-4 p-8 text-center bg-cyan/10 border-cyan">
			<div class="text-5xl mb-4 animate-pulse">🔄</div>
			<p class="font-bold text-lg mb-2">Converting HEIC...</p>
			<p class="text-black/60 text-sm">This may take a moment</p>
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
