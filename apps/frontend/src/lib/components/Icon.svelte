<script lang="ts">
	import { icons, type IconName } from './icons';

	let {
		name,
		title,
		strokeWidth = 2.5,
		class: className = '',
		style: styleProp = ''
	}: {
		name: IconName;
		title?: string;
		strokeWidth?: number;
		class?: string;
		style?: string;
	} = $props();

	const icon = $derived(icons[name]);
	const svgClass = $derived(`inline-block align-middle ${className}`);
	const resolvedStrokeWidth = $derived(icon?.strokeWidth ?? strokeWidth);
</script>

{#if icon}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class={svgClass}
		viewBox={icon.viewBox ?? '0 0 24 24'}
		fill={icon.fill ?? 'none'}
		stroke={icon.stroke ?? 'currentColor'}
		stroke-width={resolvedStrokeWidth}
		stroke-linecap="round"
		stroke-linejoin="round"
		width="1em"
		height="1em"
		style={styleProp}
		role="img"
		aria-hidden={!title}
		focusable="false"
	>
		{#if title}
			<title>{title}</title>
		{/if}
		{#each icon.paths ?? [] as path}
			<path d={path} />
		{/each}
		{#each icon.circles ?? [] as circle}
			<circle cx={circle.cx} cy={circle.cy} r={circle.r} />
		{/each}
		{#each icon.rects ?? [] as rect}
			<rect
				x={rect.x}
				y={rect.y}
				width={rect.width}
				height={rect.height}
				rx={rect.rx}
				ry={rect.ry}
			/>
		{/each}
		{#each icon.lines ?? [] as line}
			<line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
		{/each}
		{#each icon.polylines ?? [] as polyline}
			<polyline points={polyline} />
		{/each}
		{#each icon.polygons ?? [] as polygon}
			<polygon points={polygon} />
		{/each}
	</svg>
{/if}
