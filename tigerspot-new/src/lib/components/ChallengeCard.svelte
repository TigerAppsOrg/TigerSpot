<script lang="ts">
	import Button from './Button.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import { formatTimeAgo } from '$lib/utils/time';

	type ChallengeStatus = 'pending' | 'sent' | 'active';

	let {
		opponent,
		createdAt,
		status,
		onAccept,
		onDecline,
		onStart,
		class: className = ''
	}: {
		opponent: string;
		createdAt: Date;
		status: ChallengeStatus;
		onAccept?: () => void;
		onDecline?: () => void;
		onStart?: () => void;
		class?: string;
	} = $props();

	const bgClass = status === 'sent' ? 'bg-gray/30' : 'bg-white';
</script>

<div class="brutal-border p-4 {bgClass} {className}">
	<div class="flex items-center justify-between gap-4 mb-3 flex-wrap">
		<div>
			<div class="font-black {status === 'pending' ? 'text-lg' : ''}">{opponent}</div>
			<div class="text-xs opacity-60">{formatTimeAgo(createdAt)}</div>
		</div>
		{#if status === 'sent'}
			<StatusBadge status="WAITING" variant="white" class="opacity-60" />
		{/if}
	</div>

	{#if status === 'pending' && onAccept && onDecline}
		<div class="flex gap-2">
			<Button variant="lime" onclick={onAccept}>Accept</Button>
			<Button variant="white" onclick={onDecline}>Decline</Button>
		</div>
	{:else if status === 'active' && onStart}
		<div class="flex items-center justify-between gap-4 mt-0 flex-wrap">
			<div class="flex items-center gap-3">
				<span class="text-2xl">⚔️</span>
				<div class="text-xs opacity-60">5 rounds • 120s each</div>
			</div>
			<Button variant="black" onclick={onStart}>Start Game</Button>
		</div>
	{/if}
</div>
