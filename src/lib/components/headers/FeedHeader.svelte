<script lang="ts">
  import RelaySelector from '$lib/components/RelaySelector.svelte';
  import MediaTypeFilters from '$lib/components/MediaTypeFilters.svelte';
  import { hashtagInterests } from '$lib/ndk.svelte';
  import { hashtagFilter } from '$lib/stores/hashtagFilter.svelte';

  interface HeaderTitle {
    type: 'logo' | 'text';
    text?: string;
  }

  interface Props {
    headerTitle: HeaderTitle | null;
    selectedFilter: 'conversations' | 'images' | 'videos' | 'articles';
    onFilterChange: (filter: 'conversations' | 'images' | 'videos' | 'articles') => void;
  }

  let { headerTitle, selectedFilter, onFilterChange }: Props = $props();

  const isVideoMode = $derived(selectedFilter === 'videos');

  let headerElement = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (!headerElement) return;

    const updateHeaderHeight = () => {
      const height = isVideoMode ? 0 : (headerElement?.offsetHeight ?? 0);
      document.documentElement.style.setProperty('--header-height', `${height}px`);
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  });
</script>

<div bind:this={headerElement} class="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border {isVideoMode ? 'hidden' : ''}">
  <div class="py-2 pl-2 sm:p-4 w-full">
    <div class="flex items-center gap-2 min-w-0">
      <!-- Relay/Following selector icon (always visible) -->
      <div class="flex-shrink-0 relative z-20">
        <RelaySelector iconOnly={true} />
      </div>

      <!-- Hashtags scroll container OR Title -->
      <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0 max-w-full">
      {#if hashtagInterests && hashtagInterests.interests.length > 0}
        {#each hashtagInterests.interests as hashtag}
          <button
            onclick={() => hashtagFilter.toggleHashtag(hashtag)}
            class="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all {
              hashtagFilter.isSelected(hashtag)
                ? 'bg-primary text-foreground border-2 border-primary-400'
                : 'bg-muted text-muted-foreground border-2 border-border hover:border'
            }"
          >
            <span class="text-xs">#</span>
            <span>{hashtag}</span>
          </button>
        {/each}
        {#if hashtagFilter.hasFilters}
          <button
            onclick={() => hashtagFilter.clearAll()}
            class="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            title="Clear all filters"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      {:else if headerTitle}
        <h1 class="text-xl font-bold text-foreground">{headerTitle.text}</h1>
      {/if}
      </div>
    </div>
  </div>

  <!-- Media Type Filters -->
  <MediaTypeFilters {selectedFilter} onFilterChange={onFilterChange} />
</div>
