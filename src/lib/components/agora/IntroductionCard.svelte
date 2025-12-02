<script lang="ts">
	import { ndk } from '$lib/ndk.svelte';
	import { formatTimeAgo } from '$lib/utils/formatTime';
	import { User } from '$lib/ndk/ui/user';
	import type { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk';

	interface Props {
		event: NDKEvent;
		invitedBy: string | undefined;
	}

	const { event, invitedBy }: Props = $props();

	let profile = $state<NDKUserProfile | null>(null);
	let inviterProfile = $state<NDKUserProfile | null>(null);

	$effect(() => {
		event.author.fetchProfile().then(p => { profile = p; });
	});

	$effect(() => {
		if (!invitedBy) {
			inviterProfile = null;
			return;
		}
		ndk.fetchUser(invitedBy).then(u => {
			u?.fetchProfile().then(p => { inviterProfile = p; });
		});
	});
</script>

<div class="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
	<!-- Author Header -->
	<div class="flex items-center gap-3 mb-3">
		<User.Root {ndk} pubkey={event.pubkey}>
		  <User.Avatar class="w-12 h-12 rounded-full" />
		</User.Root>
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2">
				<span class="text-lg">👋</span>
				<span class="font-semibold text-foreground">
					{profile?.displayName || profile?.name || 'Anonymous'}
				</span>
			</div>
			<div class="text-sm text-muted-foreground">
				{formatTimeAgo(event.created_at || 0)}
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="mb-3 text-foreground whitespace-pre-wrap line-clamp-4">
		{event.content}
	</div>

	<!-- Footer -->
	<div class="flex items-center justify-between text-sm">
		{#if inviterProfile}
			<div class="text-muted-foreground">
				Invited by <span class="font-medium text-primary">@{inviterProfile.name || 'anonymous'}</span>
			</div>
		{:else}
			<div></div>
		{/if}
	</div>
</div>
