<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type L from 'leaflet';

	interface Props {
		readonly?: boolean;
		showActualLocation?: { lat: number; lng: number };
		guessLocation?: { lat: number; lng: number };
		opponentGuessLocation?: { lat: number; lng: number };
		onSelect?: (coords: { lat: number; lng: number }) => void;
		class?: string;
		centerOnGuess?: boolean;
	}

	let {
		readonly = false,
		showActualLocation,
		guessLocation,
		opponentGuessLocation,
		onSelect,
		class: className = '',
		centerOnGuess = false
	}: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: L.Map;
	let guessMarker: L.Marker | null = null;
	let opponentMarker: L.Marker | null = null;
	let actualMarker: L.Marker | null = null;
	let connectingLine: L.Polyline | null = null;
	let opponentConnectingLine: L.Polyline | null = null;
	let leaflet: typeof L;
	let isInitialized = $state(false);
	let lastClickedCoords: { lat: number; lng: number } | null = null;

	const PRINCETON_BOUNDS = {
		center: { lng: -74.6551, lat: 40.3431 },
		zoom: 16,
		minZoom: 14,
		maxZoom: 19,
		bounds: [
			[-74.68, 40.32], // Southwest
			[-74.63, 40.36] // Northeast
		] as [[number, number], [number, number]]
	};

	onMount(async () => {
		// Dynamic import to avoid SSR issues (Leaflet uses window)
		leaflet = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		// Custom marker icons
		const guessIcon = leaflet.divIcon({
			className: 'guess-marker',
			html: `<div class="w-8 h-8 bg-magenta brutal-border brutal-shadow-sm flex items-center justify-center">
				<span class="text-white font-bold">?</span>
			</div>`,
			iconSize: [32, 32],
			iconAnchor: [16, 16]
		});

		const opponentIcon = leaflet.divIcon({
			className: 'opponent-marker',
			html: `<div class="w-8 h-8 bg-cyan brutal-border brutal-shadow-sm flex items-center justify-center">
				<span class="text-white font-bold">?</span>
			</div>`,
			iconSize: [32, 32],
			iconAnchor: [16, 16]
		});

		const actualIcon = leaflet.divIcon({
			className: 'actual-marker',
			html: `<div class="w-8 h-8 bg-lime brutal-border brutal-shadow-sm flex items-center justify-center">
				<span class="text-black font-bold">✓</span>
			</div>`,
			iconSize: [32, 32],
			iconAnchor: [16, 16]
		});

		// Initialize map
		map = leaflet.map(mapContainer, {
			center: [PRINCETON_BOUNDS.center.lat, PRINCETON_BOUNDS.center.lng],
			zoom: PRINCETON_BOUNDS.zoom,
			minZoom: PRINCETON_BOUNDS.minZoom,
			maxZoom: PRINCETON_BOUNDS.maxZoom,
			maxBounds: leaflet.latLngBounds(
				leaflet.latLng(PRINCETON_BOUNDS.bounds[0][1], PRINCETON_BOUNDS.bounds[0][0]),
				leaflet.latLng(PRINCETON_BOUNDS.bounds[1][1], PRINCETON_BOUNDS.bounds[1][0])
			)
		});

		// Use OpenStreetMap tiles (free, no API key needed)
		leaflet
			.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
				maxZoom: 19
			})
			.addTo(map);

		// Handle click to place marker
		if (!readonly) {
			map.on('click', (e: L.LeafletMouseEvent) => {
				const { lat, lng } = e.latlng;
				lastClickedCoords = { lat, lng };
				setGuessMarker(lat, lng, guessIcon);
				onSelect?.({ lat, lng });
			});
		}

		// Show existing markers if provided
		if (guessLocation) {
			setGuessMarker(guessLocation.lat, guessLocation.lng, guessIcon);
			// Center map on GPS coordinates (only if centerOnGuess is enabled)
			if (centerOnGuess) {
				map.setView([guessLocation.lat, guessLocation.lng], 16);
			}
		}
		if (opponentGuessLocation) {
			setOpponentMarker(opponentGuessLocation.lat, opponentGuessLocation.lng, opponentIcon);
		}
		if (showActualLocation) {
			setActualMarker(showActualLocation.lat, showActualLocation.lng, actualIcon);
			if (guessLocation) {
				drawLine(guessLocation, showActualLocation, '#FF6600'); // Orange for your guess
			}
			if (opponentGuessLocation) {
				drawOpponentLine(opponentGuessLocation, showActualLocation, '#4a8a9a'); // Cyan for opponent
			}
			// Fit bounds to show all markers
			if (guessLocation || opponentGuessLocation) {
				const points: [number, number][] = [[showActualLocation.lat, showActualLocation.lng]];
				if (guessLocation) points.push([guessLocation.lat, guessLocation.lng]);
				if (opponentGuessLocation)
					points.push([opponentGuessLocation.lat, opponentGuessLocation.lng]);
				const bounds = leaflet.latLngBounds(points);
				map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
			}
		}

		isInitialized = true;
	});

	// Watch for changes to guessLocation and center the map (only if centerOnGuess is enabled)
	$effect(() => {
		if (isInitialized && guessLocation && map && centerOnGuess) {
			// Don't auto-center if this change came from the user clicking on the map
			const isFromUserClick =
				lastClickedCoords &&
				Math.abs(lastClickedCoords.lat - guessLocation.lat) < 0.000001 &&
				Math.abs(lastClickedCoords.lng - guessLocation.lng) < 0.000001;

			if (!isFromUserClick) {
				map.flyTo([guessLocation.lat, guessLocation.lng], 16, { duration: 0.5 });
			}
			lastClickedCoords = null;
		}
	});

	function setGuessMarker(lat: number, lng: number, icon: L.DivIcon) {
		if (guessMarker) {
			map.removeLayer(guessMarker);
		}
		guessMarker = leaflet.marker([lat, lng], { icon }).addTo(map);
	}

	function setOpponentMarker(lat: number, lng: number, icon: L.DivIcon) {
		if (opponentMarker) {
			map.removeLayer(opponentMarker);
		}
		opponentMarker = leaflet.marker([lat, lng], { icon }).addTo(map);
	}

	function setActualMarker(lat: number, lng: number, icon: L.DivIcon) {
		if (actualMarker) {
			map.removeLayer(actualMarker);
		}
		actualMarker = leaflet.marker([lat, lng], { icon }).addTo(map);
	}

	function drawLine(
		from: { lat: number; lng: number },
		to: { lat: number; lng: number },
		color: string = '#FF6600'
	) {
		if (connectingLine) {
			map.removeLayer(connectingLine);
		}

		connectingLine = leaflet
			.polyline(
				[
					[from.lat, from.lng],
					[to.lat, to.lng]
				],
				{
					color,
					weight: 4,
					dashArray: '8, 8'
				}
			)
			.addTo(map);
	}

	function drawOpponentLine(
		from: { lat: number; lng: number },
		to: { lat: number; lng: number },
		color: string = '#4a8a9a'
	) {
		if (opponentConnectingLine) {
			map.removeLayer(opponentConnectingLine);
		}

		opponentConnectingLine = leaflet
			.polyline(
				[
					[from.lat, from.lng],
					[to.lat, to.lng]
				],
				{
					color,
					weight: 4,
					dashArray: '8, 8'
				}
			)
			.addTo(map);
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
