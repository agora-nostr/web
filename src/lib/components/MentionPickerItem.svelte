<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { User } from '$lib/ndk/ui/user';
  import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

  interface Props {
    pubkey: string;
    isSelected: boolean;
    onSelect: (pubkey: string) => void;
    onMouseEnter: () => void;
  }

  let { pubkey, isSelected, onSelect, onMouseEnter }: Props = $props();

  let profile = $state<NDKUserProfile | null>(null);
  $effect(() => {
    ndk.fetchUser(pubkey).then(u => {
      u?.fetchProfile().then(p => { profile = p; });
    });
  });
</script>

<button
  type="button"
  onclick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(pubkey);
  }}
  onmouseenter={onMouseEnter}
  class={`w-full flex items-center gap-2 p-2 transition-colors ${
    isSelected ? 'bg-primary/20' : 'hover:bg-muted'
  }`}
>
  <User.Root {ndk} {pubkey}>
    <User.Avatar class="flex-shrink-0" />
  </User.Root>
  <div class="flex-1 min-w-0 text-left">
    <div class="text-sm font-medium text-foreground truncate">
      {profile?.displayName || profile?.name || 'Anonymous'}
    </div>
    {#if profile?.nip05}
      <div class="text-xs text-muted-foreground truncate">
        {profile.nip05}
      </div>
    {/if}
  </div>
</button>
