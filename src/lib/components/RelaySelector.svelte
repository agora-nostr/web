<script lang="ts">
  import { goto } from '$app/navigation';
  import { settings } from '$lib/stores/settings.svelte';
  import { useRelayInfoCached } from '$lib/utils/relayInfo.svelte';
  import { clickOutside } from '$lib/utils/clickOutside';
  import { isAgoraRelay, AGORA_RELAYS } from '$lib/utils/relayUtils';
  import { portal } from '$lib/utils/portal.svelte';
  import { ndk, relayFeeds } from '$lib/ndk.svelte';
  import RelayIcon from './RelayIcon.svelte';

  interface Props {
    active?: boolean;
    collapsed?: boolean;
    iconOnly?: boolean;
  }

  const { active = false, collapsed = false, iconOnly = false }: Props = $props();

  let isOpen = $state(false);
  let buttonElement: HTMLElement | null = $state(null);
  let dropdownPosition = $state({ top: 0, left: 0, width: 0 });

  // Clean up any old follow pack selections
  $effect(() => {
    if (settings.selectedRelay?.startsWith('followpack:')) {
      settings.setSelectedRelay(null);
    }
  });

  // Get follows and check if user has any
  const hasFollows = $derived((ndk.$sessions?.follows?.size ?? 0) > 0);
  const shouldShowFollowing = $derived(!!ndk.$currentUser && hasFollows);

  const selectedRelayInfo = $derived.by(() => {
    if (!settings.selectedRelay) return null;
    return useRelayInfoCached(settings.selectedRelay);
  });

  function cleanRelayUrl(url: string): string {
    return url.replace('wss://', '').replace('ws://', '');
  }

  const displayName = $derived.by(() => {
    if (settings.selectedRelay && selectedRelayInfo?.info?.name) {
      return selectedRelayInfo.info.name;
    }
    if (settings.selectedRelay) {
      return cleanRelayUrl(settings.selectedRelay);
    }
    return 'Following';
  });

  function handleClick() {
    if (active || iconOnly) {
      // On home page or icon-only mode: toggle dropdown
      if (!isOpen && buttonElement && !iconOnly) {
        const rect = buttonElement.getBoundingClientRect();
        dropdownPosition = {
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        };
      }
      isOpen = !isOpen;
    } else {
      // Not on home page: navigate to home
      goto('/');
    }
  }

  function selectRelay(url: string) {
    settings.setSelectedRelay(url);
    isOpen = false;
  }

  function selectFollowing() {
    settings.setSelectedRelay(null);
    isOpen = false;
  }

  function handleClickOutside() {
    isOpen = false;
  }
</script>

<div class="relative">
  <!-- Navigation Button -->
  <button
    bind:this={buttonElement}
    onclick={handleClick}
    class="{iconOnly
      ? 'flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/50 transition-colors'
      : collapsed
        ? 'flex items-center justify-center p-3 rounded-lg transition-colors w-full ' + (active ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted/50')
        : 'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ' + (active ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted/50')
    }"
    aria-label={settings.selectedRelay ? 'Change filter' : 'Change following filter'}
    title={collapsed ? displayName : undefined}
  >
    <!-- Icon - changes based on selection -->
    {#if settings.selectedRelay}
      <RelayIcon relayUrl={settings.selectedRelay} size={iconOnly ? 'md' : 'lg'} />
    {:else}
      <!-- Users icon for "Following" -->
      <svg class="{iconOnly ? 'w-5 h-5 text-muted-foreground' : 'w-6 h-6'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    {/if}

    {#if !collapsed && !iconOnly}
      <span class="font-medium flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</span>

      <!-- Chevron -->
      <svg
        class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    {/if}
  </button>

  {#snippet dropdownContent()}
      <!-- Currently viewing relay (if not already in the list) -->
      {#if settings.selectedRelay && !relayFeeds?.isFavorite(settings.selectedRelay) && !isAgoraRelay(settings.selectedRelay)}
        {@const relayInfo = useRelayInfoCached(settings.selectedRelay)}
        <div class="px-2 py-1">
          <button
            onclick={() => isOpen = false}
            class="w-full px-3 py-2.5 rounded-lg bg-muted/50 transition-colors text-left flex items-center gap-3"
          >
            <RelayIcon relayUrl={settings.selectedRelay} size="md" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-foreground truncate">
                {relayInfo.info?.name || cleanRelayUrl(settings.selectedRelay)}
              </div>
              {#if relayInfo.info?.description}
                <div class="text-xs text-muted-foreground truncate">
                  {relayInfo.info.description}
                </div>
              {/if}
            </div>
            <svg class="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
        <div class="border-t border-border my-1"></div>
      {/if}

      <!-- Following option (only show if user has follows) -->
      {#if shouldShowFollowing}
        <button
          onclick={selectFollowing}
          class="w-full px-4 py-3 hover:bg-muted transition-colors text-left flex items-center gap-3 {!settings.selectedRelay ? 'bg-muted/50' : ''}"
        >
          <svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div class="flex-1">
            <div class="font-medium text-foreground">Following</div>
            <div class="text-xs text-muted-foreground">All posts from people you follow</div>
          </div>
          {#if !settings.selectedRelay}
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {/if}
        </button>
      {/if}

      <!-- Favorite Relays (kind 10012) -->
      {#if relayFeeds && relayFeeds.relays.length > 0}
        <div class="border-t border-border my-1"></div>
        <div class="px-2 py-1">
          <div class="text-xs text-muted-foreground px-2 py-1 font-medium flex items-center justify-between">
            <span>Favorite Relays</span>
            <svg class="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          {#each relayFeeds.relays as relayUrl (relayUrl)}
            {@const relayInfo = useRelayInfoCached(relayUrl)}
            <button
              onclick={() => selectRelay(relayUrl)}
              class="w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left flex items-center gap-3 {settings.selectedRelay === relayUrl ? 'bg-muted/50' : ''}"
            >
              <RelayIcon {relayUrl} size="md" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <div class="text-sm font-medium text-foreground truncate">
                    {relayInfo.info?.name || cleanRelayUrl(relayUrl)}
                  </div>
                  <svg class="w-3.5 h-3.5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                {#if relayInfo.info?.description}
                  <div class="text-xs text-muted-foreground truncate">
                    {relayInfo.info.description}
                  </div>
                {/if}
              </div>
              {#if settings.selectedRelay === relayUrl}
                <svg class="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      {/if}

      <!-- Divider -->
      <div class="border-t border-border my-1"></div>

      <!-- Agoras section -->
      <div class="px-2 py-1">
        <div class="text-xs text-muted-foreground px-2 py-1 font-medium">Agoras</div>
        {#each AGORA_RELAYS as relayUrl (relayUrl)}
          {@const relayInfo = useRelayInfoCached(relayUrl)}
          <button
            onclick={() => selectRelay(relayUrl)}
            class="w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left flex items-center gap-3 {settings.selectedRelay === relayUrl ? 'bg-muted/50' : ''}"
          >
            <RelayIcon {relayUrl} size="md" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <div class="text-sm font-medium text-foreground truncate">
                  {relayInfo.info?.name || cleanRelayUrl(relayUrl)}
                </div>
                <span class="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded uppercase tracking-wide">
                  Agora
                </span>
              </div>
              {#if relayInfo.info?.description}
                <div class="text-xs text-muted-foreground truncate">
                  {relayInfo.info.description}
                </div>
              {/if}
            </div>
            {#if settings.selectedRelay === relayUrl}
              <svg class="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Manage relays link -->
      <div class="border-t border-border mt-1">
        <a
          href="/relay-feeds"
          class="block w-full px-4 py-2.5 text-sm text-center text-primary hover:bg-muted transition-colors"
          onclick={() => isOpen = false}
        >
          Browse Interesting Relays
        </a>
      </div>
  {/snippet}

  <!-- Dropdown Menu -->
  {#if isOpen && (active || iconOnly)}
    {#if iconOnly}
      <div
        use:clickOutside={handleClickOutside}
        class="absolute left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden"
      >
        {@render dropdownContent()}
      </div>
    {:else}
      <div
        use:portal
        use:clickOutside={handleClickOutside}
        style="position: fixed; top: {dropdownPosition.top}px; left: {dropdownPosition.left}px; min-width: {dropdownPosition.width}px;"
        class="w-80 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden"
      >
        {@render dropdownContent()}
      </div>
    {/if}
  {/if}
</div>
