<script lang="ts">
  import { page } from '$app/stores';
  import { ndk } from '$lib/ndk.svelte';
  import { createThreadView } from '@nostr-dev-kit/svelte';
  import type { ThreadView } from '@nostr-dev-kit/svelte';
  import { NDKEvent } from '@nostr-dev-kit/ndk';
  import NoteCard from '$lib/components/NoteCard.svelte';
  import HighlightCard from '$lib/components/HighlightCard.svelte';
  import MissingEventCard from '$lib/components/MissingEventCard.svelte';

  // Decode the nevent parameter
  const neventId = $derived($page.params.nevent);

  let thread = $state<ThreadView | null>(null);

  // Initialize thread view when neventId changes
  $effect(() => {
    if (!neventId) return;

    // Clean up previous thread if exists
    thread = null;

    // Create the thread view
    thread = createThreadView(() => ({
      focusedEvent: neventId
    }), ndk);
  });

  function handleEventNavigation(event: NDKEvent) {
    // Use focusOn instead of full page reload for better UX
    if (thread) {
      thread.focusOn(event);
      // Update URL without reload
      const nevent = event.encode();
      window.history.pushState({}, '', `/e/${nevent}`);
    }
  }

  // Get the main event from thread.events
  const mainEvent = $derived.by(() => {
    if (!thread) return null;
    const focusedId = thread.focusedEventId;
    if (!focusedId) return null;
    const node = thread.events.find(n => n.id === focusedId);
    return node?.event || null;
  });

  // Get parent chain (events before the focused event)
  const parentChain = $derived.by(() => {
    if (!thread) return [];
    const focusedId = thread.focusedEventId;
    if (!focusedId) return [];

    const focusedIndex = thread.events.findIndex(n => n.id === focusedId);
    if (focusedIndex === -1) return [];

    return thread.events.slice(0, focusedIndex);
  });
</script>

<div class="min-h-screen bg-background">
  <!-- Header -->
  <header class="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
    <div class="flex items-center gap-4 px-4 py-3">
      <button
        onclick={() => history.back()}
        class="p-2 hover:bg-neutral-900 rounded-lg transition-colors"
        aria-label="Go back"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <h1 class="text-xl font-semibold">Thread</h1>
    </div>
  </header>

  {#if !mainEvent}
    <div class="flex flex-col items-center justify-center mt-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p class="mt-4 text-neutral-400">Loading thread...</p>
    </div>
  {:else}
    <main class="w-full lg:max-w-2xl mx-auto">
      <!-- Parent Notes (Thread Context) -->
      {#each parentChain as node, index}
        {#if !node.event}
          <MissingEventCard
            eventId={node.id}
            relayHint={node.relayHint}
            showThreadLine={index < parentChain.length - 1}
            onEventFound={() => {
              // Thread view automatically updates when missing events are found
            }}
          />
        {:else if node.event.kind === 9802}
          <HighlightCard event={node.event} variant="default" />
        {:else}
          <NoteCard
            event={node.event}
            variant="thread-parent"
            showThreadLine={index < parentChain.length - 1}
            onNavigate={() => node.event && handleEventNavigation(node.event)}
          />
        {/if}
      {/each}

      <!-- Main Note - Highlighted with larger text -->
      {#if mainEvent.kind === 9802}
        <HighlightCard event={mainEvent} variant="default" />
      {:else}
        <NoteCard
          event={mainEvent}
          variant="thread-main"
          showThreadLine={false}
        />
      {/if}

      <!-- Replies -->
      <div>
        {#if thread && thread.replies.length > 0}
          <div class="px-4 py-3 border-b border-border">
            <h2 class="font-semibold text-foreground">
              {thread.replies.length} {thread.replies.length === 1 ? 'Reply' : 'Replies'}
            </h2>
          </div>
          {#each thread.replies as reply}
            {#if reply.kind === 9802}
              <HighlightCard event={reply} variant="default" />
            {:else}
              <NoteCard
                event={reply}
                variant="thread-reply"
                onNavigate={() => handleEventNavigation(reply)}
              />
            {/if}
          {/each}
        {/if}
      </div>
    </main>
  {/if}
</div>
