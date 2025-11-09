<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { User } from '$lib/ndk/ui/user';
  import { KIND_INVITE_ACCEPTANCE } from '$lib/constants/nostr';
  import type { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';

  interface Props {
    pubkey: string;
  }

  let { pubkey }: Props = $props();

  // Subscribe to kind 514 events published by this user
  const inviteAcceptanceSubscription = ndk.$subscribe(
    () => pubkey ? ({
      filters: [{ kinds: [KIND_INVITE_ACCEPTANCE], authors: [pubkey], limit: 1 }],
      bufferMs: 100,
    }) : undefined
  );

  const inviteEvent = $derived(inviteAcceptanceSubscription.events[0]);

  // Extract the inviter's pubkey from the 'p' tag
  const inviterPubkey = $derived.by(() => {
    if (!inviteEvent) return undefined;
    return inviteEvent.tags.find((t) => t[0] === 'p')?.[1];
  });

  let inviterUser = $state<NDKUser | undefined>(undefined);
  let inviterProfile = $state<NDKUserProfile | null>(null);

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

{#if inviterPubkey && inviterUser?.pubkey}
  <a
    href={`/p/${inviterUser.npub}`}
    class="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors text-sm group"
  >
    <div class="flex items-center gap-2">
      <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      <User.Root {ndk} pubkey={inviterPubkey}>
        <User.Avatar class="w-6 h-6 rounded-full" />
      </User.Root>
    </div>
    <span class="text-gray-400 group-hover:text-gray-300 transition-colors">
      Invited by <span class="font-medium text-gray-200">{inviterProfile?.name || inviterProfile?.displayName || 'Anonymous'}</span>
    </span>
  </a>
{/if}
