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
		onCancel,
		onForfeit,
		class: className = ''
	}: {
		opponent: string;
		createdAt: Date;
		status: ChallengeStatus;
		onAccept?: () => void;
		onDecline?: () => void;
		onStart?: () => void;
		onCancel?: () => void;
		onForfeit?: () => void;
		class?: string;
	} = $props();

	const bgClass = status === 'sent' ? 'bg-gray/30' : 'bg-white';
</script>

<div class="brutal-border p-4 text-black {bgClass} {className}">
	<div class="flex items-center justify-between gap-4 mb-3 flex-wrap">
		<div>
			<div class="font-black {status === 'pending' ? 'text-lg' : ''}">{opponent}</div>
			<div class="text-xs opacity-60">{formatTimeAgo(createdAt)}</div>
		</div>
		{#if status === 'sent'}
			<div class="flex items-center gap-2">
				<StatusBadge status="WAITING" variant="white" class="opacity-60" />
				{#if onCancel}
					<button
						onclick={onCancel}
						class="text-xs opacity-60 hover:opacity-100 hover:text-red-600 transition-opacity"
					>
						✕ Cancel
					</button>
				{/if}
			</div>
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
			<div class="flex items-center gap-2">
				{#if onForfeit}
					<button
						onclick={onForfeit}
						class="text-xs opacity-60 hover:opacity-100 hover:text-red-600 transition-opacity"
					>
						Forfeit
					</button>
				{/if}
				<Button variant="black" onclick={onStart}>Start Game</Button>
			</div>
		</div>
	{/if}
</div>
