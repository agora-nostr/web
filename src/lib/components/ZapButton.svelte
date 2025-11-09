<script lang="ts">
  import { type NDKEvent, NDKZapper } from '@nostr-dev-kit/ndk';
  import { ndk } from '$lib/ndk.svelte';
  import { getZapSender, hasZappedBy } from '@nostr-dev-kit/svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import ZapAmountModal from './ZapAmountModal.svelte';

  interface Props {
    event: NDKEvent;
    variant?: 'default' | 'tiktok';
  }

  const { event, variant = 'default' }: Props = $props();

  // Subscribe to zaps for this event
  const zaps = ndk.$zaps(() => ({ target: event, validated: true }));

  // Check if current user has zapped
  const userHasZapped = $derived.by(() => {
    const currentPubkey = ndk.$currentPubkey;
    if (!currentPubkey) return false;
    return hasZappedBy(zaps.events, currentPubkey);
  });

  // Format large numbers
  const formattedAmount = $derived.by(() => {
    const amount = zaps.totalAmount;
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  });

  let showZapModal = $state(false);
  let isZapping = $state(false);
  let zapSuccess = $state(false);
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  async function performZap(amount: number) {
    if (!ndk.signer) {
      toast.error('Please login to zap');
      return;
    }

    isZapping = true;

    try {
      // Create a zapper instance and send the zap
      const zapper = new NDKZapper(event, amount * 1000, "msat");
      await zapper.zap();
      zapSuccess = true;
      setTimeout(() => zapSuccess = false, 2000);
      toast.success(`Zapped ${amount} sats!`);
    } catch (err) {
      console.error('Failed to zap:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send zap';

      if (errorMessage.includes('wallet') || errorMessage.includes('NWC')) {
        toast.error('Lightning wallet error. Please check your wallet connection in settings.');
      } else if (errorMessage.includes('invoice')) {
        toast.error('Failed to create invoice. The recipient may not have a Lightning address configured.');
      } else {
        toast.error('Failed to send zap. Please try again.');
      }
    } finally {
      isZapping = false;
    }
  }

  async function handleQuickZap(e: MouseEvent) {
    e.stopPropagation();
    if (isZapping || !ndk.signer) return;
    await performZap(settings.zap.defaultAmount);
  }

  function handleZapModalZap(amount: number) {
    showZapModal = false;
    performZap(amount);
  }

  function handleZapLongPressStart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    e.stopPropagation();

    longPressTimer = setTimeout(() => {
      showZapModal = true;
      longPressTimer = null;
    }, 500);
  }

  function handleZapLongPressEnd(e: MouseEvent | TouchEvent) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;

      if (e.type === 'mouseup' || e.type === 'touchend') {
        handleQuickZap(e as MouseEvent);
      }
    }
  }

  function handleZapLongPressCancel() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
</script>

{#if variant === 'tiktok'}
  <!-- TikTok vertical variant -->
  <button
    type="button"
    onmousedown={handleZapLongPressStart}
    onmouseup={handleZapLongPressEnd}
    onmouseleave={handleZapLongPressCancel}
    ontouchstart={handleZapLongPressStart}
    ontouchend={handleZapLongPressEnd}
    ontouchcancel={handleZapLongPressCancel}
    disabled={isZapping}
    class="flex flex-col items-center gap-1 hover:scale-110 transition-transform group {isZapping ? 'opacity-50 cursor-wait' : ''}"
  >
    <div class="w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors {
      zapSuccess ? 'bg-yellow-400/30' :
      userHasZapped ? 'bg-yellow-400/20' :
      'bg-white/20'
    }">
      {#if isZapping}
        <svg class="w-6 h-6 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      {:else}
        <svg
          class="w-6 h-6 transition-colors {userHasZapped ? 'text-yellow-400' : 'text-white'}"
          fill={userHasZapped ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {#if userHasZapped}
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          {:else}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          {/if}
        </svg>
      {/if}
    </div>
    <span class="text-xs font-semibold text-white">
      {#if zaps.totalAmount > 0}
        {formattedAmount}
      {:else}
        Zap
      {/if}
    </span>
  </button>
{:else}
  <!-- Default horizontal variant -->
  <button
    type="button"
    onmousedown={handleZapLongPressStart}
    onmouseup={handleZapLongPressEnd}
    onmouseleave={handleZapLongPressCancel}
    ontouchstart={handleZapLongPressStart}
    ontouchend={handleZapLongPressEnd}
    ontouchcancel={handleZapLongPressCancel}
    disabled={isZapping}
    class="relative flex items-center gap-2 transition-colors group {
      zapSuccess ? 'text-yellow-400' :
      userHasZapped ? 'text-yellow-400' :
      'text-muted-foreground hover:text-yellow-400'
    } {isZapping ? 'opacity-50 cursor-wait' : ''}"
  >
    {#if isZapping}
      <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    {:else if zapSuccess}
      <svg class="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    {:else}
      <svg
        class="w-5 h-5"
        fill={userHasZapped ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {#if userHasZapped}
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        {/if}
      </svg>
    {/if}
    <span class="text-sm group-hover:underline">
      {#if zapSuccess}
        Zapped!
      {:else if isZapping}
        Zapping...
      {:else if zaps.totalAmount > 0}
        {formattedAmount}
        {#if zaps.count > 0}
          <span class="text-xs opacity-70">({zaps.count})</span>
        {/if}
      {:else}
        Zap
      {/if}
    </span>
  </button>
{/if}

<ZapAmountModal
  bind:open={showZapModal}
  {event}
  onZap={handleZapModalZap}
  onCancel={() => showZapModal = false}
/>
