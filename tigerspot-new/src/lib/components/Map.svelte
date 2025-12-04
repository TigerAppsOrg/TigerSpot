<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { PRINCETON_BOUNDS } from '$lib/data/dummy';

	interface Props {
		accessToken: string;
		readonly?: boolean;
		showActualLocation?: { lat: number; lng: number };
		guessLocation?: { lat: number; lng: number };
		onSelect?: (coords: { lat: number; lng: number }) => void;
		class?: string;
	}

	let {
		accessToken,
		readonly = false,
		showActualLocation,
		guessLocation,
		onSelect,
		class: className = ''
	}: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map;
	let marker: mapboxgl.Marker | null = null;
	let actualMarker: mapboxgl.Marker | null = null;
	let lineLayer = false;

	onMount(() => {
		mapboxgl.accessToken = accessToken;

		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/satellite-streets-v12',
			center: [PRINCETON_BOUNDS.center.lng, PRINCETON_BOUNDS.center.lat],
			zoom: PRINCETON_BOUNDS.zoom,
			minZoom: PRINCETON_BOUNDS.minZoom,
			maxZoom: PRINCETON_BOUNDS.maxZoom,
			maxBounds: PRINCETON_BOUNDS.bounds
		});

		map.addControl(new mapboxgl.NavigationControl(), 'top-right');

		// Handle click to place marker
		if (!readonly) {
			map.on('click', (e) => {
				const { lng, lat } = e.lngLat;
				setGuessMarker(lng, lat);
				onSelect?.({ lat, lng });
			});
		}

		// Show existing markers if provided
		map.on('load', () => {
			if (guessLocation) {
				setGuessMarker(guessLocation.lng, guessLocation.lat);
			}
			if (showActualLocation) {
				setActualMarker(showActualLocation.lng, showActualLocation.lat);
				if (guessLocation) {
					drawLine(guessLocation, showActualLocation);
				}
			}
		});
	});

	function setGuessMarker(lng: number, lat: number) {
		if (marker) marker.remove();

		// Create custom marker element
		const el = document.createElement('div');
		el.className = 'guess-marker';
		el.innerHTML = `
			<div class="w-8 h-8 bg-magenta brutal-border brutal-shadow-sm flex items-center justify-center">
				<span class="text-white font-bold">?</span>
			</div>
		`;

		marker = new mapboxgl.Marker({
			element: el,
			anchor: 'center'
		})
			.setLngLat([lng, lat])
			.addTo(map);
	}

	function setActualMarker(lng: number, lat: number) {
		if (actualMarker) actualMarker.remove();

		// Create custom marker element
		const el = document.createElement('div');
		el.className = 'actual-marker';
		el.innerHTML = `
			<div class="w-8 h-8 bg-lime brutal-border brutal-shadow-sm flex items-center justify-center">
				<span class="text-black font-bold">&#x2713;</span>
			</div>
		`;

		actualMarker = new mapboxgl.Marker({
			element: el,
			anchor: 'center'
		})
			.setLngLat([lng, lat])
			.addTo(map);
	}

	function drawLine(
		from: { lat: number; lng: number },
		to: { lat: number; lng: number }
	) {
		if (!map || lineLayer) return;

		map.addSource('route', {
			type: 'geojson',
			data: {
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'LineString',
					coordinates: [
						[from.lng, from.lat],
						[to.lng, to.lat]
					]
				}
			}
		});

		map.addLayer({
			id: 'route',
			type: 'line',
			source: 'route',
			layout: {
				'line-join': 'round',
				'line-cap': 'round'
			},
			paint: {
				'line-color': '#FF6600',
				'line-width': 4,
				'line-dasharray': [2, 2]
			}
		});

		lineLayer = true;

		// Fit bounds to show both markers
		const bounds = new mapboxgl.LngLatBounds()
			.extend([from.lng, from.lat])
			.extend([to.lng, to.lat]);

		map.fitBounds(bounds, {
			padding: 80,
			maxZoom: 17
		});
	}

	export function clearMarker() {
		if (marker) {
			marker.remove();
			marker = null;
		}
	}

	export function flyTo(lng: number, lat: number, zoom?: number) {
		map?.flyTo({
			center: [lng, lat],
			zoom: zoom || PRINCETON_BOUNDS.zoom,
			duration: 1500
		});
	}

	onDestroy(() => {
		map?.remove();
	});
</script>

<div
	bind:this={mapContainer}
	class="w-full h-full min-h-[300px] {className}"
></div>

<style>
	:global(.guess-marker), :global(.actual-marker) {
		cursor: pointer;
	}

	:global(.guess-marker > div), :global(.actual-marker > div) {
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
</style>
