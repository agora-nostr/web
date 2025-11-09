<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { User } from '$lib/ndk/ui/user';
  import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

  interface Props {
    pubkey: string;
    isSelected: boolean;
    showCheckbox: boolean;
    onToggle: (pubkey: string) => void;
  }

  let { pubkey, isSelected, showCheckbox, onToggle }: Props = $props();

  let profile = $state<NDKUserProfile | null>(null);
  $effect(() => {
    ndk.fetchUser(pubkey).then(u => {
      u?.fetchProfile().then(p => { profile = p; });
    });
  });

  const displayName = $derived(profile?.displayName || profile?.name || `${pubkey.slice(0, 8)}...`);
</script>

<button
  type="button"
  onclick={() => onToggle(pubkey)}
  class={`w-full flex items-center gap-2 p-2 rounded-md transition-colors ${
    isSelected
      ? 'bg-primary/20'
      : 'hover:bg-muted'
  }`}
>
  <User.Root {ndk} {pubkey}>
    <User.Avatar class="flex-shrink-0" />
  </User.Root>
  <div class="flex-1 min-w-0 text-left">
    <div class="text-sm font-medium text-foreground truncate">
      {displayName}
    </div>
    {#if profile?.nip05}
      <div class="text-xs text-muted-foreground truncate">
        {profile.nip05}
      </div>
    {/if}
  </div>
  {#if showCheckbox}
    <div class={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
      isSelected
        ? 'bg-primary border-primary'
        : 'border-border'
    }`}>
      {#if isSelected}
        <svg class="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
      {/if}
    </div>
  {/if}
</button>
