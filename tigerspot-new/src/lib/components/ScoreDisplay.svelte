<script lang="ts">
	import { onMount } from 'svelte';
	import { animate } from 'animejs';

	interface Props {
		score: number;
		label?: string;
		animateScore?: boolean;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let {
		score,
		label = 'Points',
		animateScore = true,
		size = 'md',
		class: className = ''
	}: Props = $props();

	let displayScore = $state(0);
	let scoreElement: HTMLSpanElement;

	const sizeClasses = {
		sm: 'text-2xl',
		md: 'text-4xl',
		lg: 'text-6xl'
	};

	onMount(() => {
		if (animateScore && score > 0) {
			const obj = { val: 0 };
			animate(obj, {
				val: score,
				duration: 1500,
				easing: 'outExpo',
				onUpdate: () => {
					displayScore = Math.round(obj.val);
				}
			});

			// Add glow effect
			if (scoreElement) {
				scoreElement.classList.add('score-glow');
				setTimeout(() => {
					scoreElement?.classList.remove('score-glow');
				}, 1000);
			}
		} else {
			displayScore = score;
		}
	});
</script>

<div class="text-center {className}">
	<div class="font-display text-sm font-bold uppercase tracking-widest text-black/60">
		{label}
	</div>
	<span
		bind:this={scoreElement}
		class="font-display font-bold tabular-nums {sizeClasses[size]}"
	>
		{displayScore.toLocaleString()}
	</span>
</div>
