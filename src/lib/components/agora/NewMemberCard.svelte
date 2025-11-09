<script lang="ts">
	import { ndk } from '$lib/ndk.svelte';
	import User from '../User.svelte';
	import FollowButton from '$lib/ndk/components/follow/buttons/basic/follow-button.svelte';
	import { formatTimeAgo } from '$lib/utils/formatTime';
	import type { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';

	interface Props {
		memberPubkey: string;
		inviterPubkey: string | null;
		joinedAt: number;
	}

	let { memberPubkey, inviterPubkey, joinedAt }: Props = $props();

	let inviterUser = $state<NDKUser | undefined>(undefined);
	let inviterProfile = $state<NDKUserProfile | null>(null);

	$effect(() => {
		console.log('[NewMemberCard] $effect running for inviterPubkey:', inviterPubkey);
		if (!inviterPubkey) {
			inviterUser = undefined;
			inviterProfile = null;
			return;
		}
		ndk.fetchUser(inviterPubkey).then(u => {
			inviterUser = u;
			u?.fetchProfile().then(p => { inviterProfile = p; });
		});
	});
</script>

<div class="p-3 rounded-lg hover:bg-muted/50 transition-colors">
	<div class="flex items-start justify-between gap-3">
		<div class="flex-1 min-w-0">
			<User
				pubkey={memberPubkey}
				variant="avatar-name-handle"
				avatarSize="w-12 h-12"
				nameSize="text-base font-semibold"
				handleSize="text-sm text-muted-foreground"
			/>

			<div class="ml-[60px]">
				<div class="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-xs text-muted-foreground">
					<span>Joined {formatTimeAgo(joinedAt)}</span>
					{#if inviterPubkey && inviterProfile && (inviterProfile.name || inviterProfile.displayName)}
						<span>•</span>
						<span>
							Invited by
							<a href="/p/{inviterUser?.npub}" class="text-primary hover:underline">
								{inviterProfile.displayName || inviterProfile.name || 'someone'}
							</a>
						</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex-shrink-0">
			<FollowButton {ndk} target={memberPubkey} />
		</div>
	</div>
</div>