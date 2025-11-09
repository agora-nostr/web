<script lang="ts">
  import type { NDKSvelte, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
  import { User } from '$lib/ndk/ui/user';

  interface Props {
    ndk: NDKSvelte;
    bech32: string;
    onClick?: (bech32: string) => void;
    class?: string;
  }

  let {
    ndk,
    bech32,
    onClick,
    class: className = '',
  }: Props = $props();

  let user = $state<NDKUser | undefined>(undefined);
  let profile = $state<NDKUserProfile | null>(null);

  $effect(() => {
    if (!ndk || !bech32) {
      user = undefined;
      profile = null;
      return;
    }
    ndk.fetchUser(bech32).then(u => {
      user = u;
      if (u?.pubkey) {
        u.fetchProfile().then(p => { profile = p; });
      }
    });
  });

  const displayName = $derived.by(() => {
    if (profile?.displayName) return profile.displayName.slice(0, 48);
    if (profile?.name) return profile.name.slice(0, 48);
    return `${bech32.slice(0, 12)}...`;
  });

  function handleClick(e: MouseEvent) {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick(bech32);
    }
  }
</script>

{#if !user || !user.pubkey}
  <span class="inline-flex items-center gap-1 text-primary font-medium {className}">
    {bech32.slice(0, 12)}
  </span>
{:else}
  <a
    href={`/p/${bech32}`}
    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 hover:bg-primary/15 text-primary font-medium transition-colors no-underline {className}"
    onclick={handleClick}
  >
    <User.Root {ndk} pubkey={user.pubkey}>
      <User.Avatar class="flex-shrink-0" />
    </User.Root>
    <span class="text-sm">{displayName}</span>
  </a>
{/if}
