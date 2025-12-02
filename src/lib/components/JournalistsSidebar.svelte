<script lang="ts">
  import { ndk } from "$lib/ndk.svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { NDKKind, NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk";
  import User from "./User.svelte";
  import { getRelaysToUse } from "$lib/utils/relayUtils";

  // Get relays to use based on selected relay
  const relaysToUse = $derived(
    getRelaysToUse(
      settings.selectedRelay,
      settings.relays.filter((r) => r.enabled && r.read).map((r) => r.url),
    ),
  );

  // Subscribe to recent articles to find active journalists
  const articlesSubscription = ndk.$subscribe(() => ({
    filters: [{ kinds: [NDKKind.Article], limit: 50 }],
    bufferMs: 500,
    relayUrls: relaysToUse.length > 0 ? relaysToUse : undefined,
    cacheUsage:
      relaysToUse.length > 0
        ? NDKSubscriptionCacheUsage.ONLY_RELAY
        : NDKSubscriptionCacheUsage.CACHE_FIRST,
    closeOnEose: true,
  }));

  // Get unique journalists (article authors) with their article count
  const journalists = $derived.by(() => {
    const authorMap = new Map<string, number>();

    // Count articles per author
    for (const event of articlesSubscription.events) {
      const count = authorMap.get(event.pubkey) || 0;
      authorMap.set(event.pubkey, count + 1);
    }

    // Convert to array and sort by article count
    return Array.from(authorMap.entries())
      .map(([pubkey, articleCount]) => ({ pubkey, articleCount }))
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, 5); // Show top 5 journalists
  });

  function isFollowing(pubkey: string): boolean {
    return ndk.$follows.includes(pubkey);
  }
</script>

<div class="p-4">
  <div class="flex items-center gap-2 mb-4">
    <svg
      class="w-5 h-5 text-primary"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
    <h2 class="text-lg font-semibold text-card-foreground">Writers</h2>
  </div>
  <div class="space-y-3">
    {#if journalists.length === 0}
      <div class="text-center py-4 text-sm text-muted-foreground">
        No journalists found yet
      </div>
    {:else}
      {#each journalists as journalist (journalist.pubkey)}
        {@const isFollowed = isFollowing(journalist.pubkey)}
        <div class="flex items-center gap-3">
          <User
            pubkey={journalist.pubkey}
            variant="avatar-name-meta"
            avatarSize="w-10 h-10"
            nameSize="text-sm font-medium"
            class="flex-1 min-w-0"
          ></User>
        </div>
      {/each}
    {/if}
  </div>
</div>
