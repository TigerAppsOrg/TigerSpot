<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import L from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import { PRINCETON_BOUNDS } from '$lib/data/dummy';

	interface Props {
		readonly?: boolean;
		showActualLocation?: { lat: number; lng: number };
		guessLocation?: { lat: number; lng: number };
		onSelect?: (coords: { lat: number; lng: number }) => void;
		class?: string;
	}

	let {
		readonly = false,
		showActualLocation,
		guessLocation,
		onSelect,
		class: className = ''
	}: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: L.Map;
	let guessMarker: L.Marker | null = null;
	let actualMarker: L.Marker | null = null;
	let connectingLine: L.Polyline | null = null;

	// Custom marker icons
	const guessIcon = L.divIcon({
		className: 'guess-marker',
		html: `<div class="w-8 h-8 bg-magenta brutal-border brutal-shadow-sm flex items-center justify-center">
			<span class="text-white font-bold">?</span>
		</div>`,
		iconSize: [32, 32],
		iconAnchor: [16, 16]
	});

	const actualIcon = L.divIcon({
		className: 'actual-marker',
		html: `<div class="w-8 h-8 bg-lime brutal-border brutal-shadow-sm flex items-center justify-center">
			<span class="text-black font-bold">✓</span>
		</div>`,
		iconSize: [32, 32],
		iconAnchor: [16, 16]
	});

	onMount(() => {
		// Initialize map
		map = L.map(mapContainer, {
			center: [PRINCETON_BOUNDS.center.lat, PRINCETON_BOUNDS.center.lng],
			zoom: PRINCETON_BOUNDS.zoom,
			minZoom: PRINCETON_BOUNDS.minZoom,
			maxZoom: PRINCETON_BOUNDS.maxZoom,
			maxBounds: L.latLngBounds(
				L.latLng(PRINCETON_BOUNDS.bounds[0][1], PRINCETON_BOUNDS.bounds[0][0]),
				L.latLng(PRINCETON_BOUNDS.bounds[1][1], PRINCETON_BOUNDS.bounds[1][0])
			)
		});

		// Use OpenStreetMap tiles (free, no API key needed)
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(map);

		// Handle click to place marker
		if (!readonly) {
			map.on('click', (e: L.LeafletMouseEvent) => {
				const { lat, lng } = e.latlng;
				setGuessMarker(lat, lng);
				onSelect?.({ lat, lng });
			});
		}

		// Show existing markers if provided
		if (guessLocation) {
			setGuessMarker(guessLocation.lat, guessLocation.lng);
		}
		if (showActualLocation) {
			setActualMarker(showActualLocation.lat, showActualLocation.lng);
			if (guessLocation) {
				drawLine(guessLocation, showActualLocation);
			}
		}
	});

	function setGuessMarker(lat: number, lng: number) {
		if (guessMarker) {
			map.removeLayer(guessMarker);
		}

		guessMarker = L.marker([lat, lng], { icon: guessIcon }).addTo(map);
	}

	function setActualMarker(lat: number, lng: number) {
		if (actualMarker) {
			map.removeLayer(actualMarker);
		}

		actualMarker = L.marker([lat, lng], { icon: actualIcon }).addTo(map);
	}

	function drawLine(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
		if (connectingLine) {
			map.removeLayer(connectingLine);
		}

		connectingLine = L.polyline(
			[
				[from.lat, from.lng],
				[to.lat, to.lng]
			],
			{
				color: '#FF6600',
				weight: 4,
				dashArray: '8, 8'
			}
		).addTo(map);

		// Fit bounds to show both markers
		const bounds = L.latLngBounds([
			[from.lat, from.lng],
			[to.lat, to.lng]
		]);
		map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17 });
	}

	export function clearMarker() {
		if (guessMarker) {
			map.removeLayer(guessMarker);
			guessMarker = null;
		}
	}

	export function flyTo(lat: number, lng: number, zoom?: number) {
		map?.flyTo([lat, lng], zoom || PRINCETON_BOUNDS.zoom, { duration: 1.5 });
	}

	onDestroy(() => {
		map?.remove();
	});
</script>

<div bind:this={mapContainer} class="w-full h-full min-h-[300px] {className}"></div>

<style>
	:global(.guess-marker),
	:global(.actual-marker) {
		cursor: pointer;
	}

	:global(.guess-marker > div),
	:global(.actual-marker > div) {
		animation: marker-drop 0.3s ease-out;
	}

	@keyframes marker-drop {
		0% {
			transform: translateY(-20px);
			opacity: 0;
		}
		100% {
			transform: translateY(0);
			opacity: 1;
		}
	}

	/* Hide Leaflet attribution on small screens */
	:global(.leaflet-control-attribution) {
		font-size: 10px;
	}
</style>
