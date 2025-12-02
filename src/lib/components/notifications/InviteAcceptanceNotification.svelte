<script lang="ts">
	import type { InviteAcceptanceNotification } from '$lib/utils/useNotifications.svelte';
	import { ndk } from '$lib/ndk.svelte';
	import User from '../User.svelte';
	import FollowButton from '$lib/ndk/components/follow-button/follow-button.svelte';
	import NotificationBase from './NotificationBase.svelte';
	import TimeAgo from '../TimeAgo.svelte';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

	interface Props {
		notification: InviteAcceptanceNotification;
	}

	const { notification }: Props = $props();

	// Get the first invitee event to display
	const inviteeEvent = $derived(notification.inviteeEvents[0]);
	const inviteePubkey = $derived(inviteeEvent?.pubkey ?? '');

	let profile = $state<NDKUserProfile | null>(null);

	$effect(() => {
		if (inviteePubkey) {
			ndk.fetchUser(inviteePubkey).then(u => {
				u?.fetchProfile().then(p => { profile = p; });
			});
		}
	});

	const follows = $derived(ndk.$sessions?.follows ?? new Set());
	const isFollowing = $derived.by(() => follows.has(inviteePubkey));
</script>

<NotificationBase testId="invite-acceptance-notification" timestamp={notification.timestamp}>
	{#snippet avatar()}
		<div class="flex-1 min-w-0">
			<User
				pubkey={inviteePubkey}
				variant="avatar-name-meta"
				avatarSize="w-10 h-10"
				nameSize="text-base font-semibold"
			>
				{#snippet meta()}
					<p class="text-sm text-muted-foreground">
						accepted your invite 🎉
					</p>
				{/snippet}
			</User>
		</div>
	{/snippet}

	{#snippet icon()}
		<svg
			class="w-4 h-4 text-green-500 flex-shrink-0"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	{/snippet}

	{#snippet message()}
		<!-- User component handles the name and message -->
	{/snippet}

	{#snippet content()}
		{#if profile?.about}
			<p class="text-sm text-muted-foreground mt-1 line-clamp-2 break-words ml-[54px]">
				{profile.about}
			</p>
		{/if}

		<div class="flex items-center gap-2 mt-2 ml-[54px]">
			{#if !isFollowing}
				<FollowButton {ndk} target={inviteePubkey} />
			{/if}
		</div>
	{/snippet}
</NotificationBase>
