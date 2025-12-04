<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		duration: number; // Total seconds
		onComplete?: () => void;
		autoStart?: boolean;
		class?: string;
	}

	let {
		duration,
		onComplete,
		autoStart = true,
		class: className = ''
	}: Props = $props();

	let timeRemaining = $state(duration);
	let isRunning = $state(false);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	const isUrgent = $derived(timeRemaining <= 10 && timeRemaining > 0);
	const isExpired = $derived(timeRemaining <= 0);

	const minutes = $derived(Math.floor(timeRemaining / 60));
	const seconds = $derived(timeRemaining % 60);
	const displayTime = $derived(
		`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
	);

	function start() {
		if (isRunning || timeRemaining <= 0) return;
		isRunning = true;
		intervalId = setInterval(() => {
			timeRemaining--;
			if (timeRemaining <= 0) {
				stop();
				onComplete?.();
			}
		}, 1000);
	}

	function stop() {
		isRunning = false;
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	function reset() {
		stop();
		timeRemaining = duration;
	}

	onMount(() => {
		if (autoStart) {
			start();
		}
	});

	onDestroy(() => {
		stop();
	});

	// Expose methods for parent component control
	export { start, stop, reset, timeRemaining };
</script>

<div
	class="card-brutal inline-flex items-center gap-3 px-6 py-3 {isUrgent ? 'timer-urgent bg-orange' : 'bg-white'} {isExpired ? 'opacity-50' : ''} {className}"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="h-6 w-6"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="3"
	>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 6v6l4 2" />
	</svg>
	<span class="font-display text-2xl font-bold tabular-nums tracking-wider">
		{displayTime}
	</span>
</div>
