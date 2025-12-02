<script lang="ts">
  import LoadingSpinner from './LoadingSpinner.svelte';

  interface Props {
    onIntersect: () => void;
    hasMore: boolean;
    isLoading?: boolean;
  }

  const { onIntersect, hasMore, isLoading = false }: Props = $props();

  let element = $state<HTMLDivElement>();

  $effect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoading) {
          onIntersect();
        }
      },
      {
        rootMargin: '200px', // Trigger 200px before reaching the element
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  });
</script>

{#if hasMore}
  <div bind:this={element} class="p-4 text-center">
    {#if isLoading}
      <LoadingSpinner size="md" />
    {:else}
      <button
        onclick={onIntersect}
        class="px-4 py-2 text-muted-foreground hover:text-muted-foreground transition-colors"
      >
        Load more
      </button>
    {/if}
  </div>
{/if}
