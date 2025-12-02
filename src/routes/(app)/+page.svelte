<script lang="ts">
  import { ndk, hashtagInterests } from '$lib/ndk.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { hashtagFilter } from '$lib/stores/hashtagFilter.svelte';
  import { headerStore } from '$lib/stores/header.svelte';
  import ConversationsFeed from '$lib/components/ConversationsFeed.svelte';
  import ArticlesFeed from '$lib/components/ArticlesFeed.svelte';
  import MediaGrid from '$lib/components/MediaGrid.svelte';
  import FeedHeader from '$lib/components/headers/FeedHeader.svelte';
  import { getRelaysToUse } from '$lib/utils/relayUtils';
  import { useRelayInfoCached } from '$lib/utils/relayInfo.svelte';
  import { homePageFilter } from '$lib/stores/homePageFilter.svelte';
  import { page } from '$app/stores';

  type MediaFilter = 'conversations' | 'images' | 'articles' | 'videos';
  let selectedFilter = $state<MediaFilter>('conversations');

  // Get relay from URL parameter (e.g., /?relay=wss://relay.example.com)
  const relayParam = $derived($page.url.searchParams.get('relay'));

  // Sync relay URL parameter with settings
  $effect(() => {
    if (relayParam && relayParam !== settings.selectedRelay) {
      settings.setSelectedRelay(relayParam);
    }
  });

  // Sync with store
  $effect(() => {
    homePageFilter.set(selectedFilter);
  });

  // Get relays to use based on filter
  // If a relay URL parameter is present, use only that relay
  // If a specific relay is selected, use only that relay
  // If "agoras" is selected, use both agora relays
  // Otherwise, use all enabled relays
  const relaysToUse = $derived(
    getRelaysToUse(
      relayParam || settings.selectedRelay,
      settings.relays.filter(r => r.enabled && r.read).map(r => r.url)
    )
  );

  // Get follows for filtering when in "Following" mode
  const follows = $derived(ndk.$sessions?.follows||[]);
  const followsArray = $derived.by(() => Array.from(follows));

  // Get authors array based on selection
  // - If in "Following" mode (no selection), use follows
  // - Otherwise, use no author filter (all authors)
  const authorsArray = $derived.by(() => {
    if (!settings.selectedRelay) {
      return followsArray;
    }
    return [];
  });

  // Create subscription props for feed components
  const subscriptionProps = $derived({
    relayUrls: relaysToUse.length > 0 ? relaysToUse : undefined,
    hashtags: hashtagFilter.hasFilters ? hashtagFilter.selectedHashtags : undefined,
    authors: authorsArray.length > 0 ? authorsArray : undefined,
  });

  // Get the title to display in the header
  const headerTitle = $derived.by(() => {
    // If showing hashtag filters, return null to show hashtags instead
    if ((hashtagInterests?.interests?.length ?? 0) > 0) return null;

    // If a relay URL parameter is present, show relay name
    if (relayParam) {
      const relayInfo = useRelayInfoCached(relayParam);
      return {
        type: 'text' as const,
        text: relayInfo.info?.name || relayParam.replace('wss://', '').replace('ws://', '')
      };
    }

    // If Following is selected, show Agora logo
    if (!settings.selectedRelay) {
      return { type: 'logo' as const };
    }

    // If a relay is selected, show relay name
    const relayInfo = useRelayInfoCached(settings.selectedRelay);
    return {
      type: 'text' as const,
      text: relayInfo.info?.name || settings.selectedRelay.replace('wss://', '').replace('ws://', '')
    };
  });

  // Set up header
  $effect(() => {
    headerStore.header = feedHeader;

    return () => {
      headerStore.clear();
    };
  });

</script>

{#snippet feedHeader()}
  <FeedHeader {headerTitle} {selectedFilter} onFilterChange={(filter) => selectedFilter = filter} />
{/snippet}

<div class="max-w-full mx-auto">
  <div class="flex flex-col">
    {#if selectedFilter === 'articles'}
      <ArticlesFeed {ndk} {subscriptionProps} />
    {:else if selectedFilter === 'images'}
      <div class="sm:p-4">
        <MediaGrid {ndk} {subscriptionProps} />
      </div>
    {:else}
      <ConversationsFeed {ndk} {subscriptionProps} />
    {/if}
  </div>
</div>
