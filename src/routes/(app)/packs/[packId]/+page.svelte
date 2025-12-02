<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast.svelte';
  import { followPacksStore } from '$lib/stores/followPacks.svelte';
  import { NDKKind, NDKFollowPack } from '@nostr-dev-kit/ndk';
  import { createFetchEvent } from '@nostr-dev-kit/svelte';

  let showEditPackModal = $state(false);
  let editingPack = $state<NDKFollowPack | null>(null);
  import { User } from '$lib/ndk/ui/user';
  import NoteCard from '$lib/components/NoteCard.svelte';
  import CreateFollowPackDialog from '$lib/components/CreateFollowPackDialog.svelte';
  import UserCard from '$lib/ndk/components/user-card-classic/user-card-classic.svelte';
  import { getProfileUrl } from '$lib/utils/navigation';
  import FollowPackHero from '$lib/ndk/components/follow-pack-hero/follow-pack-hero.svelte';

  const packId = $derived($page.params.packId);

  type ActiveTab = 'feed' | 'members';
  let activeTab = $state<ActiveTab>('feed');
  let isFollowingAll = $state(false);

  // Fetch the specific pack event by its bech32 ID
  const packFetcher = createFetchEvent(ndk, () => ({
    type: 'bech32',
    bech32: packId || ''
  }));

  let pack = $derived(packFetcher.event ? NDKFollowPack.from(packFetcher.event) : null);
  let isLoading = $derived(packFetcher.loading);

  let pubkeys = $derived(pack?.tags.filter(t => t[0] === 'p').map(t => t[1]) || []);

  let packCreatorProfile = $state<import('@nostr-dev-kit/ndk').NDKUserProfile | null>(null);

  $effect(() => {
    if (!pack?.author) {
      packCreatorProfile = null;
      return;
    }
    pack.author.fetchProfile().then(p => { packCreatorProfile = p; });
  });


  let isFavorite = $derived(pack ? followPacksStore.isFavorite(pack.id) : false);
  let isMyPack = $derived(pack && ndk.$currentUser ? pack.pubkey === ndk.$currentUser.pubkey : false);

  // Subscribe to notes from pack members
  const feedSubscription = $derived.by(() => {
    if (activeTab === 'feed' && pubkeys.length > 0) {
      return ndk.$subscribe(
        () => ({
          filters: [{ kinds: [NDKKind.Text], authors: pubkeys, limit: 50 }],
          bufferMs: 100,
        })
      );
    }
    return null;
  });

  const feedEvents = $derived(feedSubscription?.events || []);
  const feedEosed = $derived(feedSubscription?.eosed || false);

  function handleFavorite() {
    if (!pack) return;
    followPacksStore.toggleFavorite(pack.id);
  }

  async function handleFollowAll() {
    if (!pack || !ndk.activeUser || pubkeys.length === 0) {
      toast.error('Please login to follow users');
      return;
    }

    isFollowingAll = true;
    try {
      toast.success(`Following ${pubkeys.length} users`);
      ndk.$follows.add(pubkeys);
    } catch (error) {
      console.error('Error following all users:', error);
      toast.error('Failed to follow users');
    } finally {
      isFollowingAll = false;
    }
  }

  function handleBack() {
    goto('/packs');
  }

  function handleEdit() {
    if (pack) {
      editingPack = pack;
      showEditPackModal = true;
    }
  }
</script>

<div class="pack-detail-container">
  <!-- Back Button -->
  <div class="pack-header">
    <button class="back-btn" onclick={handleBack}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span>Back to Packs</span>
    </button>
  </div>

  <!-- Content -->
  <div class="pack-content">
  {#if pack}
    <!-- Follow Pack Hero -->
    <FollowPackHero {ndk} followPack={pack} class="mb-6" />

    <!-- Action Bar -->
    <div class="action-bar bg-card border border-border rounded-xl p-4 mb-6">
      <div class="flex items-center justify-between">
        <!-- Stats -->

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          {#if isMyPack}
            <button
              onclick={handleEdit}
              class="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Pack
            </button>
          {:else}
            <button
              onclick={handleFollowAll}
              disabled={isFollowingAll}
              class="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {isFollowingAll ? 'Following...' : 'Follow All'}
            </button>
          {/if}
          <button
            onclick={handleFavorite}
            class="p-2.5 rounded-lg transition-colors {isFavorite ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground hover:text-foreground'}"
            title="{isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
          >
            <svg class="w-5 h-5 {isFavorite ? 'fill-current' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-border mb-6">
      <div class="flex gap-6">
        <button
          onclick={() => activeTab = 'feed'}
          class="pb-3 px-1 font-medium transition-colors relative {activeTab === 'feed' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}"
        >
          Feed
          {#if activeTab === 'feed'}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
          {/if}
        </button>
        <button
          onclick={() => activeTab = 'members'}
          class="pb-3 px-1 font-medium transition-colors relative {activeTab === 'members' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}"
        >
          Members ({pubkeys.length})
          {#if activeTab === 'members'}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
          {/if}
        </button>
      </div>
    </div>

    <!-- Content -->
    {#if activeTab === 'feed'}
      <div class="divide-y divide-neutral-800/50 border-y border-border">
        {#if feedEvents.length === 0 && !feedEosed}
          <div class="p-8 text-center text-muted-foreground">
            Loading notes from pack members...
          </div>
        {:else if feedEvents.length === 0}
          <div class="p-8 text-center text-muted-foreground">
            No notes found from pack members
          </div>
        {:else}
          {#each feedEvents as event (event.id)}
            <NoteCard {event} />
          {/each}
        {/if}
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2">
        {#each pubkeys as pubkey (pubkey)}
          <UserCard {ndk} {pubkey} />
        {/each}
      </div>
    {/if}
  {:else if isLoading}
    <div class="text-center py-12">
      <div class="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground">Loading follow pack...</p>
    </div>
  {:else}
    <div class="text-center py-12">
      <p class="text-muted-foreground">Follow pack not found</p>
      <button
        onclick={handleBack}
        class="text-primary hover:text-primary/90 mt-4 inline-block transition-colors"
      >
        Browse all packs
      </button>
    </div>
  {/if}

  <CreateFollowPackDialog
    bind:open={showEditPackModal}
    {editingPack}
  />
  </div>
</div>

<style>
  .pack-detail-container {
    width: 100%;
  }

  .pack-header {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    color: var(--color-muted-foreground);
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 8px;
    font-size: 0.875rem;
  }

  .back-btn:hover {
    background: var(--color-muted);
    color: var(--color-foreground);
  }

  .pack-content {
    padding: 1rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .action-bar {
    @media (max-width: 768px) {
      .flex {
        flex-direction: column;
        gap: 1rem;
      }
    }
  }
</style>
