<script lang="ts">
  import { useAvailableCurrencies } from '$lib/composables/useAvailableCurrencies.svelte';
  import { useAvailablePaymentMethods } from '$lib/composables/useAvailablePaymentMethods.svelte';

  interface TradeFiltersProps {
    filters: {
      currency: string;
      paymentMethod: string;
      orderType: 'all' | 'buy' | 'sell';
      minAmount: number;
      maxAmount: number;
    };
    onChange: (filters: TradeFiltersProps['filters']) => void;
  }

  let { filters, onChange }: TradeFiltersProps = $props();

  const { currencies } = useAvailableCurrencies();
  const { paymentMethods } = useAvailablePaymentMethods();
</script>

<div class="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4">
  <!-- Currency Filter -->
  <div>
    <label class="flex items-center gap-1.5 text-xs lg:text-sm font-medium text-neutral-400 mb-1 lg:mb-2">
      <svg class="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Currency
    </label>
    <select
      value={filters.currency}
      onchange={(e) => onChange({ ...filters, currency: e.currentTarget.value })}
      class="w-full px-2 py-1.5 lg:px-3 lg:py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {#each currencies as curr}
        <option value={curr.code}>
          {curr.code === 'all' ? curr.name : `${curr.flag} ${curr.code} - ${curr.name}`}
        </option>
      {/each}
    </select>
  </div>

  <!-- Payment Method Filter -->
  <div>
    <label class="flex items-center gap-1.5 text-xs lg:text-sm font-medium text-neutral-400 mb-1 lg:mb-2">
      <svg class="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      Payment Method
    </label>
    <select
      value={filters.paymentMethod}
      onchange={(e) => onChange({ ...filters, paymentMethod: e.currentTarget.value })}
      class="w-full px-2 py-1.5 lg:px-3 lg:py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {#each paymentMethods as method}
        <option value={method.id}>
          {method.icon} {method.name}
        </option>
      {/each}
    </select>
  </div>

  <!-- Order Type Filter -->
  <div>
    <label class="flex items-center gap-1.5 text-xs lg:text-sm font-medium text-neutral-400 mb-1 lg:mb-2">
      <svg class="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      Order Type
    </label>
    <select
      value={filters.orderType}
      onchange={(e) => onChange({ ...filters, orderType: e.currentTarget.value as 'all' | 'buy' | 'sell' })}
      class="w-full px-2 py-1.5 lg:px-3 lg:py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="all">All Orders</option>
      <option value="buy">Buy Orders</option>
      <option value="sell">Sell Orders</option>
    </select>
  </div>

  <!-- Amount Range -->
  <div>
    <label class="text-xs lg:text-sm font-medium text-neutral-400 mb-1 lg:mb-2 block">
      Amount Range (sats)
    </label>
    <div class="flex items-center gap-2">
      <input
        type="number"
        value={filters.minAmount}
        oninput={(e) => onChange({ ...filters, minAmount: parseInt(e.currentTarget.value) || 0 })}
        class="w-full px-2 py-1.5 lg:py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Min"
      />
      <span class="text-neutral-500 text-sm">-</span>
      <input
        type="number"
        value={filters.maxAmount}
        oninput={(e) => onChange({ ...filters, maxAmount: parseInt(e.currentTarget.value) || 1000000 })}
        class="w-full px-2 py-1.5 lg:py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Max"
      />
    </div>
  </div>
</div>
