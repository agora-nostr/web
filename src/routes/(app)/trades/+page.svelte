<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { ndk } from '$lib/ndk.svelte';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { headerStore } from '$lib/stores/header.svelte';
  import { createTradeModal } from '$lib/stores/createTradeModal.svelte';
  import OrderBook from '$lib/components/trades/OrderBook.svelte';
  import CreateOrderModal from '$lib/components/trades/CreateOrderModal.svelte';
  import TradeFilters from '$lib/components/trades/TradeFilters.svelte';

  const filters = $derived({
    currency: $page.url.searchParams.get('currency') || 'all',
    paymentMethod: $page.url.searchParams.get('paymentMethod') || 'all',
    orderType: ($page.url.searchParams.get('orderType') || 'all') as 'all' | 'buy' | 'sell',
    minAmount: parseInt($page.url.searchParams.get('minAmount') || '0'),
    maxAmount: parseInt($page.url.searchParams.get('maxAmount') || '1000000')
  });

  function handleFilterChange(newFilters: typeof filters) {
    const params = new URLSearchParams();
    if (newFilters.currency !== 'all') params.set('currency', newFilters.currency);
    if (newFilters.paymentMethod !== 'all') params.set('paymentMethod', newFilters.paymentMethod);
    if (newFilters.orderType !== 'all') params.set('orderType', newFilters.orderType);
    if (newFilters.minAmount > 0) params.set('minAmount', newFilters.minAmount.toString());
    if (newFilters.maxAmount < 1000000) params.set('maxAmount', newFilters.maxAmount.toString());

    const queryString = params.toString();
    goto(`/trades${queryString ? `?${queryString}` : ''}`, { replaceState: true });
  }

  // Set up custom header and sidebar
  $effect(() => {
    headerStore.header = pageHeader;
    sidebarStore.rightSidebar = filtersSidebar;
    sidebarStore.showOnMobile = true;

    return () => {
      headerStore.clear();
      sidebarStore.clear();
    };
  });
</script>

{#snippet pageHeader()}
  <div class="border-b border-border sticky top-0 z-20 bg-background">
    <div class="px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">P2P Trading</h1>
          <p class="text-sm text-neutral-400 mt-1">
            Buy and sell Bitcoin directly
          </p>
        </div>

        {#if ndk.$currentUser}
          <button
            onclick={() => createTradeModal.open()}
            class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Order</span>
          </button>
        {/if}
      </div>
    </div>
  </div>
{/snippet}

{#snippet filtersSidebar()}
  <div class="p-3 lg:p-4 bg-card rounded-lg border border-border">
    <div class="flex items-center gap-2 mb-3 lg:mb-4">
      <svg class="w-4 h-4 lg:w-5 lg:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      <h2 class="text-base lg:text-lg font-semibold text-foreground">Filters</h2>
    </div>
    <TradeFilters {filters} onChange={handleFilterChange} />
  </div>
{/snippet}

<!-- Main Content -->
<div class="px-4 sm:px-6 lg:px-8 py-6">
  <OrderBook {filters} />
</div>

<!-- Create Order Modal -->
<CreateOrderModal bind:open={createTradeModal.show} onClose={createTradeModal.close} />
