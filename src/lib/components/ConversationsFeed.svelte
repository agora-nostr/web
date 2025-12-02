<script lang="ts">
  import type { NDKFilter } from '@nostr-dev-kit/ndk';
  import { NDKKind } from '@nostr-dev-kit/ndk';
  import type { NDKSvelte } from '@nostr-dev-kit/svelte';
  import { createLazyFeed } from '$lib/utils/lazyFeed.svelte';
  import NoteCard from './NoteCard.svelte';
  import HighlightCard from '$lib/ndk/components/highlight-card-feed/highlight-card-feed.svelte';
  import LoadMoreTrigger from './LoadMoreTrigger.svelte';
  import { User } from '$lib/ndk/ui/user';
  import type { SubscriptionProps } from '$lib/types/subscription';

  interface Props {
    ndk: NDKSvelte;
    subscriptionProps: SubscriptionProps;
  }

  const { ndk, subscriptionProps }: Props = $props();

  const notesFeed = createLazyFeed(ndk, () => {
    const filters: NDKFilter[] = [{
      kinds: [NDKKind.Text, 9802],
      limit: 200,
    }];

    if (subscriptionProps.hashtags) {
      filters[0]['#t'] = subscriptionProps.hashtags;
    }

    if (subscriptionProps.authors) {
      filters[0].authors = subscriptionProps.authors;
    }

    // Add current user's posts when viewing a specific relay
    if (subscriptionProps.relayUrls && ndk.$currentPubkey) {
      filters.push({ ...filters[0], authors: [ndk.$currentPubkey] });
    }

    return {
      filters,
      relayUrls: subscriptionProps.relayUrls,
      subId: "conversations",
      cacheUnconstrainFilter: [],
      exclusiveRelay: true,
    };
  }, {
    initialLimit: 20,
    pageSize: 20
  });

  const events = $derived(notesFeed.events);
  const hasMore = $derived(notesFeed.hasMore);
  const isLoading = $derived(notesFeed.isLoading);

  function handleLoadMore() {
    notesFeed.loadMore();
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
</script>

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
      <HighlightCard {ndk} {event} />
    {:else}
      <NoteCard {event} />
    {/if}
  {/each}
{/if}

<LoadMoreTrigger
  onIntersect={handleLoadMore}
  {hasMore}
  {isLoading}
/>
