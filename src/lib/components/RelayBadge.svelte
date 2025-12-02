<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import type { NDKRelay } from '@nostr-dev-kit/ndk';
  import RelayIcon from './RelayIcon.svelte';

  interface Props {
    relay: NDKRelay;
    variant?: 'default' | 'compact';
  }

  const { relay, variant = 'default' }: Props = $props();

  const relayInfo = $derived((relay as any).nip11 || (relay as any).info);
  const relayName = $derived(relayInfo?.name || new URL(relay.url).hostname);
  const relayDescription = $derived(relayInfo?.description);
</script>

{#if variant === 'compact'}
  <div class="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground group relative">
    <RelayIcon relayUrl={relay.url} size="xs" />
    <span class="truncate max-w-[120px]">{relayName}</span>

    {#if relayDescription}
      <div class="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card border border-border rounded-lg shadow-xl z-50 w-64 text-xs">
        <div class="font-semibold text-foreground mb-1">{relayName}</div>
        <div class="text-muted-foreground">{relayDescription}</div>
        <div class="text-muted-foreground mt-1 break-all">{relay.url}</div>
      </div>
    {/if}
  </div>
{:else}
  <div class="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
    <RelayIcon relayUrl={relay.url} size="md" />
    <div class="flex-1 min-w-0">
      <div class="font-medium text-foreground truncate">{relayName}</div>
      {#if relayDescription}
        <div class="text-xs text-muted-foreground truncate">{relayDescription}</div>
      {/if}
    </div>
  </div>
{/if}
