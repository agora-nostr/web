<script lang="ts">
  import { ndk, hashtagInterests } from '$lib/ndk.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { hashtagFilter } from '$lib/stores/hashtagFilter.svelte';
  import { layoutMode } from '$lib/stores/layoutMode.svelte';
  import { headerStore } from '$lib/stores/header.svelte';
  import { NDKKind, type NDKEvent, NDKArticle, type NDKFilter } from '@nostr-dev-kit/ndk';
  import NoteCard from '$lib/components/NoteCard.svelte';
  import ArticlePreviewCard from '$lib/components/ArticlePreviewCard.svelte';
  import FeaturedArticleCard from '$lib/components/FeaturedArticleCard.svelte';
  import HighlightCard from '$lib/components/HighlightCard.svelte';
  import MediaGrid from '$lib/components/MediaGrid.svelte';
  import TikTokVideoFeed from '$lib/components/TikTokVideoFeed.svelte';
  import LoadMoreTrigger from '$lib/components/LoadMoreTrigger.svelte';
  import { createLazyFeed } from '$lib/utils/lazyFeed.svelte';
  import { User } from '$lib/ndk/ui/user';
  import FeedHeader from '$lib/components/headers/FeedHeader.svelte';
  import { getRelaysToUse } from '$lib/utils/relayUtils';
  import { useRelayInfoCached } from '$lib/utils/relayInfo.svelte';
  import CreateMediaPostModal from '$lib/components/CreateMediaPostModal.svelte';
  import { createMediaPostModal } from '$lib/stores/createMediaPostModal.svelte';
  import { homePageFilter } from '$lib/stores/homePageFilter.svelte';
  import { page } from '$app/stores';
    import EventCardClassic from '$lib/ndk/components/event/cards/classic/event-card-classic.svelte';

  type MediaFilter = 'conversations' | 'images' | 'videos' | 'articles';
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

  // Helper to check if selection is a follow pack
  function isFollowPackSelection(value: string | null): boolean {
    return value?.startsWith('followpack:') ?? false;
  }

  // Fetch selected follow pack if applicable
  let selectedPackEvent = $state<NDKEvent | null>(null);

  $effect(() => {
    if (!settings.selectedRelay || !isFollowPackSelection(settings.selectedRelay)) {
      selectedPackEvent = null;
      return;
    }

    const packId = settings.selectedRelay.replace('followpack:', '');
    ndk.fetchEvent(packId).then(event => {
      selectedPackEvent = event;
    }).catch(err => {
      console.error('Failed to fetch selected pack:', err);
      selectedPackEvent = null;
    });
  });

  // Get authors array based on selection
  // - If a follow pack is selected, use pack members
  // - If in "Following" mode (no selection), use follows
  // - Otherwise, use no author filter (all authors)
  const authorsArray = $derived.by(() => {
    if (selectedPackEvent) {
      return selectedPackEvent.tags.filter(t => t[0] === 'p').map(t => t[1]);
    } else if (!settings.selectedRelay) {
      return followsArray;
    }
    return [];
  });

  console.log('[HomePage] Creating subscriptions');

  const notesFeed = createLazyFeed(ndk, () => {
    const filters: NDKFilter[] = [{
					kinds: [NDKKind.Text, 9802],
					limit: 200,
      }];

    // Add hashtag filters if any are selected
    if (hashtagFilter.hasFilters) {
      filters[0]['#t'] = hashtagFilter.selectedHashtags;
    }

    // When in Following mode or Follow Pack mode, filter by authors
    const isFollowingOrPackMode = !settings.selectedRelay || isFollowPackSelection(settings.selectedRelay);
    if (isFollowingOrPackMode && authorsArray.length > 0) {
      filters[0].authors = authorsArray;
    }

    if (!isFollowPackSelection && ndk.$currentPubkey) {
      console.log('adding a filter for self')
      filters.push({ ...filters[0], authors: [ndk.$currentPubkey] });
    } else {
      console.log('not adding filter for self', isFollowPackSelection, !!ndk.$currentPubkey)
    }

    return {
					filters,
					relayUrls: relaysToUse.length > 0 ? relaysToUse : undefined,
					subId: "notes",
					cacheUnconstrainFilter: [],
					exclusiveRelay: true,
				};
  }, {
    initialLimit: 20,
    pageSize: 20
  });
  console.log('[HomePage] Notes subscription created');

  const mediaFeed = createLazyFeed(ndk, () => {
    const filter: NDKFilter = {
      kinds: [NDKKind.Text, NDKKind.Image, NDKKind.Video, NDKKind.ShortVideo],
      limit: 300
    };

    // Add hashtag filters if any are selected
    if (hashtagFilter.hasFilters) {
      filter['#t'] = hashtagFilter.selectedHashtags;
    }

    // When in Following mode or Follow Pack mode, filter by authors
    const isFollowingOrPackMode = !settings.selectedRelay || isFollowPackSelection(settings.selectedRelay);
    if (isFollowingOrPackMode && authorsArray.length > 0) {
      filter.authors = authorsArray;
    }
    return {
			filters: [filter],
			relayUrls: relaysToUse.length > 0 ? relaysToUse : undefined,
      cacheUnconstrainFilter: [],
			subId: "home-media",
			exclusiveRelay: relaysToUse.length > 0,
		};
  }, {
    initialLimit: 30,
    pageSize: 30
  });

  const articlesFeed = createLazyFeed(ndk, () => {
    const filter: NDKFilter = {
      kinds: [NDKKind.Article],
      limit: 100
    };

    // Add hashtag filters if any are selected
    if (hashtagFilter.hasFilters) {
      filter['#t'] = hashtagFilter.selectedHashtags;
    }

    // When in Following mode or Follow Pack mode, filter by authors
    const isFollowingOrPackMode = !settings.selectedRelay || isFollowPackSelection(settings.selectedRelay);
    if (isFollowingOrPackMode && authorsArray.length > 0) {
      filter.authors = authorsArray;
    }
    return {
      filters: [filter],
      subId: 'articles',
      exclusiveRelay: relaysToUse.length > 0,
      relayUrls: relaysToUse.length > 0 ? relaysToUse : undefined
    };
  }, {
    initialLimit: 10,
    pageSize: 10
  });

  const highlightsFeed = createLazyFeed(ndk, () => {
    const filter: NDKFilter = {
					kinds: [9802],
					limit: 100,
				};

    // Add hashtag filters if any are selected
    if (hashtagFilter.hasFilters) {
      filter['#t'] = hashtagFilter.selectedHashtags;
    }

    // When in Following mode or Follow Pack mode, filter by authors
    const isFollowingOrPackMode = !settings.selectedRelay || isFollowPackSelection(settings.selectedRelay);
    if (isFollowingOrPackMode && authorsArray.length > 0) {
      filter.authors = authorsArray;
    }
    return {
      filters: [filter],
      subId: 'highlights',
      exclusiveRelay: relaysToUse.length > 0,
      relayUrls: relaysToUse.length > 0 ? relaysToUse : undefined
    };
  }, {
    initialLimit: 10,
    pageSize: 10
  });

  const articles = $derived.by(() => articlesFeed.events.map(e => NDKArticle.from(e)));

  const filteredArticles = $derived.by(() =>
    articles
      .filter(article => article.title && article.content)
      .sort((a, b) => (b.published_at ?? b.created_at ?? 0) - (a.published_at ?? a.created_at ?? 0))
  );

  // Featured articles (first 10 with images preferred)
  const featuredArticles = $derived.by(() => {
    const articlesWithImages = filteredArticles.filter(a => a.image);
    const articlesWithoutImages = filteredArticles.filter(a => !a.image);
    return [...articlesWithImages, ...articlesWithoutImages].slice(0, 10);
  });

  // Highlights (first 10)
  const recentHighlights = $derived.by(() => highlightsFeed.events.slice(0, 10));

  // Regular article feed (skip first 10 featured articles)
  const regularArticles = $derived.by(() => filteredArticles.slice(10));

  function hasMediaUrl(content: string, type: 'image' | 'video'): boolean {
    const regex = type === 'image'
      ? /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|avif))/gi
      : /(https?:\/\/[^\s]+\.(mp4|webm|mov|avi|mkv))/gi;
    return regex.test(content);
  }

  const mediaEvents = $derived.by(() => {
    if (selectedFilter === 'images') {
      return mediaFeed.events.filter(event =>
        event.kind === NDKKind.Image ||
        (event.kind === NDKKind.Text && hasMediaUrl(event.content, 'image'))
      );
    } else if (selectedFilter === 'videos') {
      return mediaFeed.events.filter(event =>
        event.kind === NDKKind.Video ||
        event.kind === NDKKind.ShortVideo ||
        event.kind === 22 ||
        (event.kind === NDKKind.Text && hasMediaUrl(event.content, 'video'))
      );
    }
    return [];
  });

  const events = $derived(selectedFilter === 'articles' ? [] : notesFeed.events);
  const hasMore = $derived(selectedFilter === 'articles' ? articlesFeed.hasMore : notesFeed.hasMore);
  const isLoading = $derived(selectedFilter === 'articles' ? articlesFeed.isLoading : notesFeed.isLoading);

  function handleLoadMore() {
    if (selectedFilter === 'articles') {
      articlesFeed.loadMore();
    } else {
      notesFeed.loadMore();
    }
  }

  // Get unique authors from pending events (up to 3 for display)
  const pendingAuthors = $derived.by(() => {
    const authors = new Set<string>();
    const pending = notesFeed.pendingEvents;
    for (const event of pending) {
      if (authors.size >= 3) break;
      authors.add(event.pubkey);
    }
    return Array.from(authors);
  });

  // Get the title to display in the header
  const headerTitle = $derived.by(() => {
    // If showing hashtag filters, return null to show hashtags instead
    if (hashtagInterests.interests.length > 0) return null;

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

    // If a follow pack is selected, show pack name
    if (isFollowPackSelection(settings.selectedRelay) && selectedPackEvent) {
      return {
        type: 'text' as const,
        text: selectedPackEvent.tagValue('title') || 'Untitled Pack'
      };
    }

    // If a relay is selected, show relay name
    const relayInfo = useRelayInfoCached(settings.selectedRelay);
    return {
      type: 'text' as const,
      text: relayInfo.info?.name || settings.selectedRelay.replace('wss://', '').replace('ws://', '')
    };
  });

  // Set layout mode based on selected filter
  $effect(() => {
    if (selectedFilter === 'articles') {
      layoutMode.setReadsMode();
    } else {
      layoutMode.reset();
    }
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
  <!-- Feed -->
  <div class="divide-y divide-neutral-800/50">
    {#if selectedFilter === 'articles'}
      <div class="pb-6">
        {#if filteredArticles.length === 0 && articlesFeed.eosed}
          <div class="p-8 text-center text-muted-foreground">
            No articles found
          </div>
        {:else if filteredArticles.length === 0}
          <div class="p-8 text-center text-muted-foreground">
            Loading articles...
          </div>
        {:else}
          <!-- Featured Articles Section -->
          {#if featuredArticles.length > 0}
            <div class="py-6 border-b border-border max-w-screen">
              <h2 class="text-lg font-bold text-foreground mb-4 flex items-center gap-2 px-4">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Featured
              </h2>
              <div class="overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory touch-pan-x">
                <div class="flex gap-4 px-4 pb-2">
                  {#each featuredArticles as article (article.id)}
                    <div class="snap-start snap-always">
                      <FeaturedArticleCard {article} />
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Recent Highlights Section -->
          {#if recentHighlights.length > 0}
            <div class="px-4 py-6 border-b border-border">
              <h2 class="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Recent Highlights
              </h2>
              <div class="grid grid-cols-2 gap-4 w-full">
                {#each recentHighlights as highlight (highlight.id)}
                  <div class="min-w-0">
                    <HighlightCard event={highlight} variant="grid" />
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Regular Articles Feed -->
          {#if regularArticles.length > 0}
            <div class="px-4 py-6">
              <h2 class="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Latest Articles
              </h2>
              <div class="divide-y divide-neutral-800/50 -mx-4">
                {#each regularArticles as article (article.id)}
                  <ArticlePreviewCard {article} />
                {/each}
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <LoadMoreTrigger
        onIntersect={handleLoadMore}
        hasMore={articlesFeed.hasMore}
        isLoading={articlesFeed.isLoading}
      />
    {:else if selectedFilter === 'videos'}
      {#if mediaEvents.length === 0 && mediaFeed.eosed}
        <div class="p-8 text-center text-muted-foreground">
          No videos found
        </div>
      {:else if mediaEvents.length === 0}
        <div class="p-8 text-center text-muted-foreground">
          Loading videos...
        </div>
      {:else}
        <TikTokVideoFeed events={mediaEvents} />
      {/if}
    {:else if selectedFilter === 'images'}
      <div class="sm:p-4">
        {#if mediaEvents.length === 0 && mediaFeed.eosed}
          <div class="p-8 text-center text-muted-foreground">
            No images found
          </div>
        {:else if mediaEvents.length === 0}
          <div class="p-8 text-center text-muted-foreground">
            Loading images...
          </div>
        {:else}
          <MediaGrid events={mediaEvents} />
        {/if}
      </div>
    {:else}
      <!-- New Notes Indicator (Twitter-style) -->
      {#if notesFeed.pendingCount > 0}
        <div class="flex justify-center py-2 lg:relative lg:static fixed bottom-20 left-0 right-0 z-[500] lg:z-auto pointer-events-none">
          <button
            onclick={() => notesFeed.loadPendingEvents()}
            class="flex items-center gap-2 px-4 py-2 bg-neutral-900/95 hover:bg-muted border border-primary/50 lg:border-border rounded-full transition-all shadow-lg backdrop-blur-sm pointer-events-auto"
          >
            <!-- Avatars -->
            <div class="flex -space-x-2">
              {#each pendingAuthors.slice(0, 3) as pubkey (pubkey)}
                <User.Root {ndk} {pubkey}>
                  <User.Avatar class="w-6 h-6 rounded-full border-2 border-foreground" />
                </User.Root>
              {/each}
            </div>
            <!-- Text -->
            <span class="text-sm text-primary lg:text-foreground font-medium">
              {notesFeed.pendingCount} new {notesFeed.pendingCount === 1 ? 'note' : 'notes'}
            </span>
          </button>
        </div>
      {/if}

      {#if events.length === 0}
        <div class="p-8 text-center text-muted-foreground">
          No notes found
        </div>
      {:else}
        {#each events as event (event.id)}
          {#if event.kind === 9802}
            <HighlightCard {event} variant="feed" />
          {:else}
            <EventCardClassic {ndk} {event} />
          {/if}
        {/each}
      {/if}

      <LoadMoreTrigger
        onIntersect={handleLoadMore}
        {hasMore}
        {isLoading}
      />
    {/if}
  </div>
</div>

<!-- Media Post Modal -->
<CreateMediaPostModal bind:open={createMediaPostModal.show} onClose={() => createMediaPostModal.close()} />
