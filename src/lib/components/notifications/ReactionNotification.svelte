<script lang="ts">
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
	import { truncateContent } from '$lib/utils/contentPreview';
	import ActorList from './ActorList.svelte';
	import NotificationBase from './NotificationBase.svelte';
	import { onMount } from 'svelte';

	interface Props {
		emoji: string;
		reactors: Array<{ pubkey: string; event: NDKEvent }>;
		targetEvent?: NDKEvent;
		timestamp: number;
	}

	const { emoji, reactors, targetEvent, timestamp }: Props = $props();


	onMount(() => {
	});

	const actorPubkeys = $derived(reactors.map((r) => r.pubkey));
	const originalPreview = $derived(truncateContent(targetEvent?.content ?? ''));
</script>

<NotificationBase {timestamp} preview={originalPreview} previewColor="red-500">
	{#snippet avatar()}
		<div class="flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl">
			{emoji}
		</div>
	{/snippet}

	{#snippet icon()}
		<svg
			class="w-4 h-4 text-red-500 flex-shrink-0"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
			/>
		</svg>
	{/snippet}

	{#snippet message()}
		<ActorList pubkeys={actorPubkeys} maxVisible={2} />
		{reactors.length === 1 ? 'reacted' : 'reacted'}
		<span class="text-lg mx-1">{emoji}</span>
		to your note
	{/snippet}
</NotificationBase>
