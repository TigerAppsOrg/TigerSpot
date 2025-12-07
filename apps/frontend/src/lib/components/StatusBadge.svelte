<script lang="ts">
	type Variant = 'white' | 'cyan' | 'magenta' | 'lime' | 'orange' | 'gray' | 'black';

	let {
		status,
		variant = 'white',
		class: className = ''
	}: {
		status: string;
		variant?: Variant;
		class?: string;
	} = $props();

	const variantClasses = {
		white: 'bg-white text-black',
		cyan: 'bg-cyan text-white',
		magenta: 'bg-magenta text-white',
		lime: 'bg-lime text-white',
		orange: 'bg-orange text-white',
		gray: 'bg-gray text-black',
		black: 'bg-black text-white'
	};
</script>

<span
	class="brutal-border px-3 py-1 text-xs font-bold uppercase {variantClasses[variant]} {className}"
>
	{status}
</span>
