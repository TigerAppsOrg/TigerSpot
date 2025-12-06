<script lang="ts">
	import Card from './Card.svelte';

	type CardVariant = 'cyan' | 'magenta' | 'lime' | 'orange' | 'white';

	let {
		value,
		label,
		variant,
		valueColor,
		class: className = ''
	}: {
		value: string | number;
		label: string;
		variant?: CardVariant;
		valueColor?: string;
		class?: string;
	} = $props();

	let displayValue = $derived(typeof value === 'number' ? value.toLocaleString() : value);
</script>

<Card {variant} class="text-center py-6 {className}">
	<div class="text-3xl md:text-4xl font-black {valueColor || ''}" style={valueColor}>
		{displayValue}
	</div>
	<div class="text-xs font-bold uppercase opacity-60 mt-2">{label}</div>
</Card>
