<script lang="ts">
  import type { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
  import { ndk } from '$lib/ndk.svelte';
  import { createReactionAction } from '$lib/ndk/builders/reaction-action/index.svelte';
  import { createFollowAction } from '$lib/ndk/builders/follow-action/index.svelte';
  import { createZapAction } from '$lib/ndk/builders/zap-action/zap-action.svelte';

  interface Props {
    event?: NDKEvent;
    user?: NDKUser;
  }

  const { event, user }: Props = $props();

  // Example 1: Reaction Action Builder
  // Replaces custom reaction composables with reactive state management
  const reactionAction = $derived.by(() => {
    if (!event) return null;

    return createReactionAction(
      () => ({ event, target: event }),
      ndk
    );
  });

  // Example 2: Follow Action Builder
  // Replaces custom follow state management
  const followAction = $derived.by(() => {
    if (!user) return null;

    return createFollowAction(
      () => ({ target: user }),
      ndk
    );
  });

  // Example 3: Zap Action Builder
  // Provides complete zap state management
  const zapAction = $derived.by(() => {
    if (!event) return null;

    return createZapAction(
      () => ({ target: event }),
      ndk
    );
  });

  // Handle reaction
  async function handleReaction() {
    if (!reactionAction) return;

    try {
      // Toggle reaction (uses ❤️ by default)
      await reactionAction.react("+");
    } catch (error) {
      console.error('Failed to react:', error);
    }
  }

  // Handle custom emoji reaction
  async function handleEmojiReaction(emoji: string) {
    if (!reactionAction) return;

    try {
      await reactionAction.react(emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  }

  // Handle follow/unfollow
  async function handleFollow() {
    if (!followAction) return;

    try {
      await followAction.follow();
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  }

  // Handle zap
  async function handleZap(amount: number) {
    if (!zapAction) return;

    try {
      await zapAction.zap(amount, 'Great post!');
    } catch (error) {
      console.error('Failed to zap:', error);
    }
  }
</script>

<div class="space-y-6 p-6">
  <h2 class="text-2xl font-bold">Action Builders Example</h2>

  {#if event && reactionAction}
    <div class="space-y-2">
      <h3 class="text-lg font-medium">Reaction Action</h3>
      <div class="flex gap-4 items-center">
        <button
          onclick={handleReaction}
          class="btn btn-sm"
          class:btn-primary={reactionAction.get("+")?.hasReacted}
        >
          {reactionAction.get("+")?.hasReacted ? '❤️' : '🤍'}
          {reactionAction.totalCount}
        </button>

        <button onclick={() => handleEmojiReaction('👍')} class="btn btn-sm">
          👍
        </button>

        <button onclick={() => handleEmojiReaction('🎉')} class="btn btn-sm">
          🎉
        </button>

        <div class="text-sm text-muted-foreground">
          Reactions: {JSON.stringify(reactionAction.all)}
        </div>
      </div>
    </div>
  {/if}

  {#if user && followAction}
    <div class="space-y-2">
      <h3 class="text-lg font-medium">Follow Action</h3>
      <div class="flex gap-4 items-center">
        <button
          onclick={handleFollow}
          class="btn btn-sm"
          class:btn-primary={followAction.isFollowing}
        >
          {followAction.isFollowing ? 'Unfollow' : 'Follow'}
        </button>

        <div class="text-sm text-muted-foreground">
          Following: {followAction.isFollowing}
        </div>
      </div>
    </div>
  {/if}

  {#if event && zapAction}
    <div class="space-y-2">
      <h3 class="text-lg font-medium">Zap Action</h3>
      <div class="flex gap-4 items-center">
        <button
          onclick={() => handleZap(100)}
          class="btn btn-sm"
          class:btn-primary={zapAction.hasZapped}
        >
          ⚡ Zap 100 sats
        </button>

        <button onclick={() => handleZap(1000)} class="btn btn-sm">
          ⚡ Zap 1k sats
        </button>

        <div class="text-sm text-muted-foreground">
          Total: {zapAction.totalAmount} sats from {zapAction.count} zaps
          {#if zapAction.hasZapped}
            <span class="ml-2 text-primary">You zapped</span>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: background-color 0.2s, color 0.2s;
    background-color: var(--muted);
    color: var(--foreground);
  }

  .btn:hover {
    background-color: var(--accent);
  }

  .btn-primary {
    background-color: var(--primary);
    color: var(--primary-foreground);
  }

  .btn-primary:hover {
    opacity: 0.8;
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }
</style>