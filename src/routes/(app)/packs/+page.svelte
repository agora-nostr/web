<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { goto } from '$app/navigation';
  import { headerStore } from '$lib/stores/header.svelte';
  import { layoutStore } from '$lib/stores/layout.svelte';
  import { type NDKFollowPack } from '@nostr-dev-kit/ndk';

  let showCreatePackModal = $state(false);
  import { User } from '$lib/ndk/ui/user';
  import CreateFollowPackDialog from '$lib/components/CreateFollowPackDialog.svelte';
  import LoadMoreTrigger from '$lib/components/LoadMoreTrigger.svelte';
  import { createLazyFeed } from '$lib/utils/lazyFeed.svelte';
  import { getPackUrl } from '$lib/utils/packUrl';
  import { getProfileUrl } from '$lib/utils/navigation';
  import PageHeader from '$lib/components/headers/PageHeader.svelte';

  let searchQuery = $state('');

  type FilterType = 'all' | 'mine' | 'follows' | 'include-me';
  let activeFilter = $state<FilterType>('all');
  let isFilterDropdownOpen = $state(false);

  const filterLabels: Record<FilterType, string> = {
    all: 'All Packs',
    mine: 'My Packs',
    follows: 'From Follows',
    'include-me': 'Include Me'
  };

  function selectFilter(filter: FilterType) {
    activeFilter = filter;
    isFilterDropdownOpen = false;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown')) {
      isFilterDropdownOpen = false;
    }
  }

  $effect(() => {
    if (isFilterDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });

  // Subscribe to follow packs from relays using lazy feed
  const packsFeed = createLazyFeed(ndk, () => ({
    filters: [{ kinds: [39089, 39092] }],
    bufferMs: 100,
  }), {
    initialLimit: 12,
    pageSize: 12
  });

  const packEvents = $derived(packsFeed.allEvents as NDKFollowPack[]);
  const eosed = $derived(packsFeed.eosed);

  let allPacks = $derived(packEvents);

  let filteredPacks = $derived.by(() => {
    let filtered = allPacks;

    // Apply filter type
    if (activeFilter !== 'all') {
      const userPubkey = ndk.$currentUser?.pubkey;
      const userFollows = ndk.$sessions?.follows;

      if (activeFilter === 'mine' && userPubkey) {
        filtered = filtered.filter(pack => pack.pubkey === userPubkey);
      } else if (activeFilter === 'follows' && userFollows) {
        const followPubkeys = Array.from(userFollows).map((user: any) => typeof user === 'string' ? user : user.pubkey);
        filtered = filtered.filter(pack => followPubkeys.includes(pack.pubkey));
      } else if (activeFilter === 'include-me' && userPubkey) {
        filtered = filtered.filter(pack => {
          const packPubkeys = pack.tags.filter(t => t[0] === 'p').map(t => t[1]);
          return packPubkeys.includes(userPubkey);
        });
      }
    }

    // Apply search query
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(pack => {
        const title = pack.tagValue('title') || '';
        const description = pack.tagValue('description') || '';
        return title.toLowerCase().includes(search) || description.toLowerCase().includes(search);
      });
    }

    return filtered;
  });

  // Derive visible packs based on lazy loading
  let displayLimit = $state(12);

  const visiblePacks = $derived(filteredPacks.slice(0, displayLimit));
  const hasMore = $derived(displayLimit < filteredPacks.length);
  const isLoading = $derived(packsFeed.isLoading);

  function handleLoadMore() {
    if (hasMore) {
      displayLimit = Math.min(displayLimit + 12, filteredPacks.length);
    }
  }

  // Reset display limit when filters change
  $effect(() => {
    // Track filter dependencies
    activeFilter;
    searchQuery;

    // Reset to initial limit
    displayLimit = 12;
  });

  function handlePackClick(pack: NDKFollowPack) {
    const url = getPackUrl(pack);
    goto(url);
  }

  // Set up header and layout
  $effect(() => {
    headerStore.header = packsHeader;
    layoutStore.setRightSidebarVisibility(false);

    return () => {
      headerStore.clear();
      layoutStore.setRightSidebarVisibility(true);
    };
  });
</script>

{#snippet packsHeader()}
  <PageHeader
    title="Follow Packs"
    subtitle="Discover curated lists of accounts to follow"
    icon={packIcon}
    actions={ndk.$currentUser ? createPackAction : undefined}
  />
{/snippet}

{#snippet packIcon()}
  <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
{/snippet}

{#snippet createPackAction()}
  <button
    onclick={() => showCreatePackModal = true}
    class="px-4 py-2.5 bg-primary hover:bg-accent-dark text-foreground rounded-lg transition-colors font-medium text-sm flex items-center gap-2 flex-shrink-0"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    New Follow Pack
  </button>
{/snippet}

<div class="w-full lg:max-w-6xl mx-auto px-4 py-8">
  <!-- Search and Filters -->
  <div class="mb-6">
    <div class="flex gap-3 flex-col sm:flex-row">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search follow packs..."
          bind:value={searchQuery}
          class="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      <!-- Filter Dropdown -->
      {#if ndk.$currentUser}
        <div class="relative flex-shrink-0 filter-dropdown">
          <button
            onclick={() => isFilterDropdownOpen = !isFilterDropdownOpen}
            class="px-4 py-3 bg-card border border-border rounded-lg text-foreground hover:border-border transition-colors flex items-center gap-2 min-w-[160px] justify-between"
          >
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span class="text-sm font-medium">{filterLabels[activeFilter]}</span>
            </div>
            <svg class="w-4 h-4 text-muted-foreground transition-transform {isFilterDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if isFilterDropdownOpen}
            <div class="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-xl z-10">
              <div class="py-1">
                <button
                  onclick={() => selectFilter('all')}
                  class="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors {activeFilter === 'all' ? 'text-primary font-medium' : 'text-muted-foreground'}"
                >
                  All Packs
                </button>
                <button
                  onclick={() => selectFilter('mine')}
                  class="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors {activeFilter === 'mine' ? 'text-primary font-medium' : 'text-muted-foreground'}"
                >
                  My Packs
                </button>
                <button
                  onclick={() => selectFilter('follows')}
                  class="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors {activeFilter === 'follows' ? 'text-primary font-medium' : 'text-muted-foreground'}"
                >
                  From Follows
                </button>
                <button
                  onclick={() => selectFilter('include-me')}
                  class="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors {activeFilter === 'include-me' ? 'text-primary font-medium' : 'text-muted-foreground'}"
                >
                  Include Me
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- All Packs Grid -->
  <div>
    <h2 class="text-xl font-semibold text-foreground mb-4">
      Popular Packs
    </h2>
    {#if visiblePacks.length > 0}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each visiblePacks as pack (pack.id)}
          {@const packImage = pack.tagValue('image')}
          {@const packTitle = pack.tagValue('title') || 'Untitled Pack'}
          {@const packDescription = pack.tagValue('description')}
          {@const packPubkeys = pack.tags.filter(t => t[0] === 'p').map(t => t[1])}
          <div
            role="button"
            tabindex="0"
            onclick={() => handlePackClick(pack)}
            onkeydown={(e) => e.key === 'Enter' && handlePackClick(pack)}
            class="block bg-card border border-border rounded-xl overflow-hidden hover:border-border transition-colors group cursor-pointer"
          >
            {#if packImage}
              <div class="h-32 w-full">
                <img
                  src={packImage}
                  alt={packTitle}
                  class="w-full h-full object-cover"
                />
              </div>
            {/if}

            <div class="p-5">
              <div class="mb-4">
                <h3 class="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {packTitle}
                </h3>
                <p class="text-sm text-muted-foreground mt-1">
                  {packPubkeys.length} members
                </p>
              </div>

              {#if packDescription}
                <p class="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {packDescription}
                </p>
              {/if}

              <div class="flex -space-x-2">
                {#each packPubkeys.slice(0, 4) as pubkey, index (pubkey)}
                  <button
                    type="button"
                    onclick={(e) => { e.stopPropagation(); goto(getProfileUrl(pubkey)); }}
                    class="relative cursor-pointer"
                    style="z-index: {4 - index}"
                  >
                    <User.Root {ndk} {pubkey}>
                      <User.Avatar class="w-8 h-8 rounded-full ring-2 ring-neutral-900 hover:opacity-80 transition-opacity" />
                    </User.Root>
                  </button>
                {/each}
                {#if packPubkeys.length > 4}
                  <div class="w-8 h-8 rounded-full bg-muted ring-2 ring-neutral-900 flex items-center justify-center">
                    <span class="text-xs text-muted-foreground">
                      +{packPubkeys.length - 4}
                    </span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <LoadMoreTrigger
        onIntersect={handleLoadMore}
        hasMore={hasMore}
        isLoading={isLoading}
      />
    {:else}
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p class="text-muted-foreground">
          No follow packs found
        </p>
      </div>
    {/if}
  </div>

  <CreateFollowPackDialog
    bind:open={showCreatePackModal}
  />
</div>
