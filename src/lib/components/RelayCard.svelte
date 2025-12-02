<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { useRelayInfoCached } from '$lib/utils/relayInfo.svelte';
  import { isAgoraRelay } from '$lib/utils/relayUtils';
  import RelayIcon from './RelayIcon.svelte';
  import { User } from '$lib/ndk/ui/user';

  interface Props {
    relayUrl: string;
    pubkeys?: string[];
    isFavorite?: boolean;
    showFavoriteIcon?: boolean;
    onclick?: () => void;
    onFavoriteClick?: (e: MouseEvent) => void;
  }

  const {
    relayUrl,
    pubkeys = [],
    isFavorite = false,
    showFavoriteIcon = false,
    onclick,
    onFavoriteClick
  }: Props = $props();

  const relayInfo = useRelayInfoCached(relayUrl);
</script>

<div
  {onclick}
  role={onclick ? 'button' : undefined}
  tabindex={onclick ? 0 : undefined}
  onkeydown={(e) => { if (onclick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onclick(); } }}
  class="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors {onclick ? 'cursor-pointer' : ''}"
>
  <div class="flex items-start gap-3">
    <RelayIcon {relayUrl} size="lg" />
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1 flex-wrap">
        <h3 class="text-sm font-semibold text-foreground truncate">
          {relayInfo.info?.name || relayUrl.replace('wss://', '').replace('ws://', '')}
        </h3>
        {#if isAgoraRelay(relayUrl)}
          <span class="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded uppercase tracking-wide">
            Agora
          </span>
        {/if}
        {#if showFavoriteIcon && isFavorite}
          <svg class="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        {/if}
      </div>
      <p class="text-xs text-muted-foreground mb-1">
        {relayUrl}
      </p>
      {#if pubkeys.length > 0}
        <div class="flex -space-x-1.5 mb-2 items-center">
          {#each pubkeys.slice(0, 5) as pubkey (pubkey)}
            <User.Root {ndk} {pubkey}>
              <User.Avatar class="rounded-full border-2 border-background" />
            </User.Root>
          {/each}
          {#if pubkeys.length > 5}
            <div class="w-5 h-5 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
              +{pubkeys.length - 5}
            </div>
          {/if}
        </div>
      {/if}
      {#if relayInfo.info?.description}
        <p class="text-sm text-muted-foreground line-clamp-2">
          {relayInfo.info.description}
        </p>
      {/if}
    </div>
    {#if onFavoriteClick}
      <button
        onclick={(e) => { e.stopPropagation(); onFavoriteClick(e); }}
        class="flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors {isFavorite ? 'text-primary' : 'text-muted-foreground hover:text-primary'}"
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {#if isFavorite}
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        {/if}
      </button>
    {/if}
  </div>
</div>
