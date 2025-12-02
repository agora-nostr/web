<script lang="ts">
  import type { NDKSvelte } from '@nostr-dev-kit/svelte';
  import type { NDKFilter } from '@nostr-dev-kit/ndk';
  import { NDKKind, NDKArticle } from '@nostr-dev-kit/ndk';
  import { createLazyFeed } from '$lib/utils/lazyFeed.svelte';
  import ArticlePreviewCard from './ArticlePreviewCard.svelte';
  import FeaturedArticleCard from './FeaturedArticleCard.svelte';
  import HighlightCard from '$lib/ndk/components/highlight-card-feed/highlight-card-feed.svelte';
  import LoadMoreTrigger from './LoadMoreTrigger.svelte';
  import type { SubscriptionProps } from '$lib/types/subscription';
  import { layoutMode } from '$lib/stores/layoutMode.svelte';

  interface Props {
    ndk: NDKSvelte;
    subscriptionProps: SubscriptionProps;
  }

  const { ndk, subscriptionProps }: Props = $props();

  // Set layout mode for articles view
  $effect(() => {
    layoutMode.setReadsMode();
    return () => {
      layoutMode.reset();
    };
  });

  const articlesFeed = createLazyFeed(ndk, () => {
    const filter: NDKFilter = {
      kinds: [NDKKind.Article],
      limit: 100
    };

    if (subscriptionProps.hashtags) {
      filter['#t'] = subscriptionProps.hashtags;
    }

    if (subscriptionProps.authors) {
      filter.authors = subscriptionProps.authors;
    }

    return {
      filters: [filter],
      subId: 'articles',
      exclusiveRelay: !!subscriptionProps.relayUrls,
      relayUrls: subscriptionProps.relayUrls
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

    if (subscriptionProps.hashtags) {
      filter['#t'] = subscriptionProps.hashtags;
    }

    if (subscriptionProps.authors) {
      filter.authors = subscriptionProps.authors;
    }

    return {
      filters: [filter],
      subId: 'highlights',
      exclusiveRelay: !!subscriptionProps.relayUrls,
      relayUrls: subscriptionProps.relayUrls
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

  function handleLoadMore() {
    articlesFeed.loadMore();
  }
</script>

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
              <HighlightCard {ndk} event={highlight} />
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
