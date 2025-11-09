<script lang="ts">
	import { ndk } from '$lib/ndk.svelte';
	import { User } from '$lib/ndk/ui/user';
	import FollowButton from '$lib/ndk/components/follow/buttons/basic/follow-button.svelte';
	import { formatTimeAgo } from '$lib/utils/formatTime';
	import type { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';

	interface Props {
		pubkey: string;
		showFollow?: boolean;
		showAbout?: boolean;
		joinedAt?: number;
		inviterPubkey?: string | null;
		clickable?: boolean;
		class?: string;
	}

	let {
		pubkey,
		showFollow = true,
		showAbout = true,
		joinedAt,
		inviterPubkey,
		clickable = true,
		class: className = ''
	}: Props = $props();

	let user = $state<NDKUser | undefined>(undefined);
	let profile = $state<NDKUserProfile | null>(null);
	let inviterUser = $state<NDKUser | undefined>(undefined);
	let inviterProfile = $state<NDKUserProfile | null>(null);

	$effect(() => {
		ndk.fetchUser(pubkey).then(u => {
			user = u;
			u?.fetchProfile().then(p => { profile = p; });
		});
	});

	$effect(() => {
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

<div class="flex items-start gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors {className}">
	<User.Root {ndk} {pubkey}>
		<User.Avatar class="w-12 h-12 rounded-full" />
	</User.Root>

	<div class="flex-1 min-w-0">
		<div class="flex items-start justify-between gap-2">
			<div class="flex-1 min-w-0">
				{#if clickable}
					<a href="/p/{user.npub}" class="block group">
						<h4 class="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
							{profile?.displayName || profile?.name || 'Anon'}
						</h4>
						{#if profile?.nip05}
							<p class="text-sm text-muted-foreground truncate">
								{profile.nip05}
							</p>
						{/if}
					</a>
				{:else}
					<h4 class="font-semibold text-foreground truncate">
						{profile?.displayName || profile?.name || 'Anon'}
					</h4>
					{#if profile?.nip05}
						<p class="text-sm text-muted-foreground truncate">
							{profile.nip05}
						</p>
					{/if}
				{/if}

				{#if joinedAt || inviterPubkey}
					<div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
						{#if joinedAt}
							<span>Joined {formatTimeAgo(joinedAt)}</span>
						{/if}
						{#if inviterPubkey && inviterProfile}
							{#if joinedAt}
								<span>•</span>
							{/if}
							<span>
								Invited by
								<a href="/p/{inviterUser?.npub}" class="text-primary hover:underline">
									{inviterProfile.displayName || inviterProfile.name || 'someone'}
								</a>
							</span>
						{/if}
					</div>
				{/if}

				{#if showAbout && profile?.about}
					<p class="mt-2 text-sm text-foreground/80 line-clamp-2">
						{profile.about}
					</p>
				{/if}
			</div>

			{#if showFollow}
				<div class="flex-shrink-0">
					<FollowButton {ndk} target={pubkey} />
				</div>
			{/if}
		</div>
	</div>
</div>
