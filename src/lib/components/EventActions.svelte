<script lang="ts">
  import type { NDKEvent } from '@nostr-dev-kit/ndk';
  import { createReactionAction } from '@nostr-dev-kit/svelte';
  import { ndk } from '$lib/ndk.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { clickOutside } from '$lib/utils/clickOutside';
  import ComposeDialog from './ComposeDialog.svelte';
  import ZapButton from './ZapButton.svelte';
  import Icon from './Icon.svelte';
  import ReactionButton from '$lib/ndk/components/reaction/buttons/basic/reaction-button.svelte';

  interface Props {
    event: NDKEvent;
    variant?: 'default' | 'thread-main' | 'tiktok';
  }

  const { event, variant = 'default' }: Props = $props();

  let showReplyDialog = $state(false);
  let showQuoteDialog = $state(false);
  let showRepostMenu = $state(false);

  const interactions = ndk.$subscribe(() => ({
    filters: [{
      kinds: [1, 1111, 6, 16],
      ...event.filter()
    }],
    subId: 'interactions'
  }));

  const replyCount = $derived.by(() =>
    Array.from(interactions.events ?? []).filter(e => e.kind === 1 || e.kind === 1111).length
  );

  const repostCount = $derived.by(() =>
    Array.from(interactions.events ?? []).filter(e => e.kind === 6 || e.kind === 16).length
  );

  // TikTok variant uses createReactionAction for state management
  const tiktokReactionState = $derived.by(() => {
    if (variant !== 'tiktok') return null;
    return createReactionAction(() => ({ event }), ndk);
  });

  const tiktokReactionStats = $derived.by(() => {
    if (!tiktokReactionState) return { count: 0, hasReacted: false };
    return tiktokReactionState.get('❤️') ?? { count: 0, hasReacted: false, pubkeys: [], emoji: '❤️' };
  });

  async function handleRepost() {
    if (!ndk.signer) {
      toast.error('Please login to repost');
      return;
    }

    try {
      await event.repost();
      toast.success('Note reposted');
    } catch (err) {
      console.error('Failed to repost:', err);
      toast.error('Failed to repost');
    }
  }

</script>

{#if variant === 'tiktok'}
  <div class="flex flex-col items-center gap-6 text-white">
    <button
      type="button"
      onclick={(e) => { e.stopPropagation(); showReplyDialog = true; }}
      class="flex flex-col items-center gap-1 hover:scale-110 transition-transform group"
    >
      <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <Icon name="message" size="lg" />
      </div>
      <span class="text-xs font-semibold">{replyCount}</span>
    </button>

    <div class="relative">
      <button
        type="button"
        onclick={(e) => { e.stopPropagation(); showRepostMenu = !showRepostMenu; }}
        class="flex flex-col items-center gap-1 hover:scale-110 transition-transform group"
      >
        <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon name="repost" size="lg" />
        </div>
        <span class="text-xs font-semibold">{repostCount}</span>
      </button>

      {#if showRepostMenu}
        <div
          use:clickOutside={() => showRepostMenu = false}
          class="absolute bottom-full mb-2 right-0 bg-popover border border-border rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden"
          onclick={(e) => e.stopPropagation()}
        >
          <button
            onclick={(e) => { e.stopPropagation(); showRepostMenu = false; handleRepost(); }}
            class="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div>
              <div class="font-medium">Repost</div>
              <div class="text-xs text-muted-foreground">Share instantly</div>
            </div>
          </button>
          <button
            onclick={(e) => { e.stopPropagation(); showRepostMenu = false; showQuoteDialog = true; }}
            class="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-t border-border"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div>
              <div class="font-medium">Quote</div>
              <div class="text-xs text-muted-foreground">Add your thoughts</div>
            </div>
          </button>
        </div>
      {/if}
    </div>

    <button
      type="button"
      onclick={(e) => {
        e.stopPropagation();
        if (tiktokReactionState) {
          tiktokReactionState.react('❤️').catch(err => {
            console.error('Failed to react:', err);
            toast.error('Failed to add reaction');
          });
        }
      }}
      class="flex flex-col items-center gap-1 hover:scale-110 transition-transform group"
    >
      <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-red-400 transition-colors {tiktokReactionStats.hasReacted ? 'bg-red-400/30' : ''}">
        <Icon name="heart-filled" size="lg" class={tiktokReactionStats.hasReacted ? 'animate-[heartbeat_0.3s_ease-in-out]' : ''} />
      </div>
      <span class="text-xs font-semibold">{tiktokReactionStats.count}</span>
    </button>

    <ZapButton {event} variant="tiktok" />
  </div>
{:else}
  <div class="flex items-center gap-3 sm:gap-6 {variant === 'thread-main' ? 'border-t border-border pt-3' : ''} text-muted-foreground">
    <button
      type="button"
      onclick={(e) => { e.stopPropagation(); showReplyDialog = true; }}
      class="flex items-center gap-2 hover:text-primary transition-colors group"
    >
      <Icon name="message" size="md" />
      <span class="text-sm group-hover:underline">{replyCount}</span>
    </button>

  <div class="relative">
    <button
      type="button"
      onclick={(e) => { e.stopPropagation(); showRepostMenu = !showRepostMenu; }}
      class="flex items-center gap-2 hover:text-green-400 transition-colors group"
    >
      <Icon name="repost" size="md" />
      <span class="text-sm group-hover:underline">{repostCount}</span>
    </button>

    {#if showRepostMenu}
      <div
        use:clickOutside={() => showRepostMenu = false}
        class="absolute bottom-full mb-2 left-0 bg-popover border border-border rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden"
        onclick={(e) => e.stopPropagation()}
      >
        <button
          onclick={(e) => { e.stopPropagation(); showRepostMenu = false; handleRepost(); }}
          class="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
        >
          <Icon name="repost" size="md" />
          <div>
            <div class="font-medium">Repost</div>
            <div class="text-xs text-muted-foreground">Share instantly</div>
          </div>
        </button>
        <button
          onclick={(e) => { e.stopPropagation(); showRepostMenu = false; showQuoteDialog = true; }}
          class="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-t border-border"
        >
          <Icon name="message" size="md" />
          <div>
            <div class="font-medium">Quote</div>
            <div class="text-xs text-muted-foreground">Add your thoughts</div>
          </div>
        </button>
      </div>
    {/if}
  </div>

  <ReactionButton
    {event}
    emoji="❤️"
    class="hover:text-red-400 transition-colors group [&>span]:text-sm [&>span]:group-hover:underline"
  />

  <ZapButton {event} />
  </div>
{/if}

<ComposeDialog bind:open={showReplyDialog} replyTo={event} />
<ComposeDialog bind:open={showQuoteDialog} quotedEvent={event} />
