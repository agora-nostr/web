<script lang="ts">
  import { ndk, relayFeeds } from '$lib/ndk.svelte';
  import { NDKKind, type NDKFilter, NDKArticle, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
  import { createLazyFeed } from '$lib/utils/lazyFeed.svelte';
  import { useRelayInfoCached } from '$lib/utils/relayInfo.svelte';
  import NoteCard from './NoteCard.svelte';
  import ArticlePreviewCard from './ArticlePreviewCard.svelte';
  import MediaGrid from './MediaGrid.svelte';
  import LoadMoreTrigger from './LoadMoreTrigger.svelte';

  let selectedFilter = $state<'all' | 'conversations' | 'articles' | 'images'>('all');

  const favoriteRelays = $derived(relayFeeds?.relays || []);
  const hasRelays = $derived(favoriteRelays.length > 0);

  const feed = createLazyFeed(ndk, () => {
    if (!hasRelays) return undefined;

    const kinds: number[] = [];

    if (selectedFilter === 'all' || selectedFilter === 'conversations') {
      kinds.push(NDKKind.Text, 9802);
    }

    if (selectedFilter === 'all' || selectedFilter === 'articles') {
      kinds.push(NDKKind.Article);
    }

    if (selectedFilter === 'all' || selectedFilter === 'images') {
      kinds.push(NDKKind.HorizontalVideo);
    }

    if (kinds.length === 0) {
      kinds.push(NDKKind.Text, 9802, NDKKind.Article, NDKKind.HorizontalVideo);
    }

    const filter: NDKFilter = {
      kinds,
      limit: 100,
    };

    return {
      filters: [filter],
      relayUrls: favoriteRelays,
      cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
      closeOnEose: true,
    };
  });

  const events = $derived(feed.events || []);

  const sortedEvents = $derived.by(() => {
    return events
      .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
  });

  const notes = $derived.by(() => {
    return sortedEvents.filter(e => e.kind === NDKKind.Text || e.kind === 9802);
  });

  const articles = $derived.by(() => {
    return sortedEvents
      .filter(e => e.kind === NDKKind.Article)
      .map(e => NDKArticle.from(e))
      .filter(a => a.title && a.content);
  });

  const images = $derived.by(() => {
    return sortedEvents.filter(e => e.kind === NDKKind.HorizontalVideo);
  });

  function getRelayForEvent(eventId: string): string | null {
    const event = events.find(e => e.id === eventId);
    if (!event || !event.relay) return null;
    return event.relay.url;
  }
</script>

<div class="min-h-screen">
  {#if !hasRelays}
    <!-- Empty state -->
    <div class="text-center py-16 px-4">
      <svg class="w-20 h-20 mx-auto mb-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
      </svg>
      <h2 class="text-2xl font-bold text-foreground mb-3">No Favorite Relays</h2>
      <p class="text-muted-foreground max-w-md mx-auto mb-6">
        Add relays to your favorites from the "Manage Favorites" tab to see curated content from specific communities.
      </p>
    </div>
  {:else}
    <!-- Filter tabs -->
    <div class="border-b border-border bg-background sticky top-0 z-10">
      <div class="flex overflow-x-auto scrollbar-hide">
        <button
          onclick={() => selectedFilter = 'all'}
          class="flex-shrink-0 px-6 py-3 text-sm font-medium transition-colors border-b-2 {selectedFilter === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
        >
          All
        </button>
        <button
          onclick={() => selectedFilter = 'conversations'}
          class="flex-shrink-0 px-6 py-3 text-sm font-medium transition-colors border-b-2 {selectedFilter === 'conversations' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
        >
          Conversations
          {#if notes.length > 0}
            <span class="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
              {notes.length}
            </span>
          {/if}
        </button>
        <button
          onclick={() => selectedFilter = 'articles'}
          class="flex-shrink-0 px-6 py-3 text-sm font-medium transition-colors border-b-2 {selectedFilter === 'articles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
        >
          Articles
          {#if articles.length > 0}
            <span class="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
              {articles.length}
            </span>
          {/if}
        </button>
        <button
          onclick={() => selectedFilter = 'images'}
          class="flex-shrink-0 px-6 py-3 text-sm font-medium transition-colors border-b-2 {selectedFilter === 'images' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
        >
          Media
          {#if images.length > 0}
            <span class="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
              {images.length}
            </span>
          {/if}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Relay attribution -->
      <div class="mb-4 p-3 bg-muted/50 rounded-lg">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>Browsing content from {favoriteRelays.length} favorite {favoriteRelays.length === 1 ? 'relay' : 'relays'}</span>
        </div>
      </div>

      {#if selectedFilter === 'all' || selectedFilter === 'conversations'}
        {#if notes.length > 0}
          <div class="space-y-4 mb-6">
            {#if selectedFilter === 'all'}
              <h3 class="text-lg font-semibold text-foreground flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Conversations
              </h3>
            {/if}
            {#each notes as note (note.id)}
              {@const relayUrl = getRelayForEvent(note.id)}
              {@const relayInfo = relayUrl ? useRelayInfoCached(relayUrl) : null}
              <div class="relative">
                <NoteCard event={note} />
                {#if relayUrl && relayInfo}
                  <div class="absolute top-2 right-2 px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs text-muted-foreground border border-border">
                    {relayInfo.info?.name || relayUrl.replace('wss://', '').replace('ws://', '')}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      {#if selectedFilter === 'all' || selectedFilter === 'articles'}
        {#if articles.length > 0}
          <div class="space-y-4 mb-6">
            {#if selectedFilter === 'all'}
              <h3 class="text-lg font-semibold text-foreground flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Articles
              </h3>
            {/if}
            {#each articles as article (article.id)}
              {@const relayUrl = getRelayForEvent(article.id)}
              {@const relayInfo = relayUrl ? useRelayInfoCached(relayUrl) : null}
              <div class="relative">
                <ArticlePreviewCard {article} />
                {#if relayUrl && relayInfo}
                  <div class="absolute top-2 right-2 px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs text-muted-foreground border border-border">
                    {relayInfo.info?.name || relayUrl.replace('wss://', '').replace('ws://', '')}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      {#if selectedFilter === 'all' || selectedFilter === 'images'}
        {#if images.length > 0}
          <div class="space-y-4 mb-6">
            {#if selectedFilter === 'all'}
              <h3 class="text-lg font-semibold text-foreground flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Media
              </h3>
            {/if}
            <!-- MediaGrid component expects ndk and subscriptionProps, not events -->
            <div class="text-muted-foreground text-sm">Media grid would be displayed here</div>
          </div>
        {/if}
      {/if}

      {#if sortedEvents.length === 0}
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 class="text-lg font-semibold text-foreground mb-2">No Content Yet</h3>
          <p class="text-muted-foreground">
            No content found from your favorite relays. Check back later!
          </p>
        </div>
      {/if}

      <LoadMoreTrigger onIntersect={() => feed.loadMore()} hasMore={true} />
    </div>
  {/if}
</div>
