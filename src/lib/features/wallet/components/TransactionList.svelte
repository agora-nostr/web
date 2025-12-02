<script lang="ts">
  import { formatDistanceToNow } from 'date-fns';
  import { walletStore } from '../store.svelte';

  let {
    limit = 10,
  }: {
    limit?: number;
  } = $props();

  const displayTransactions = $derived(
    walletStore.transactions.slice(0, limit)
  );

  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
  };

  const formatAmount = (amount: number, direction: 'in' | 'out') => {
    const sign = direction === 'in' ? '+' : '-';
    return `${sign}${amount.toLocaleString()}`;
  };
</script>

{#if walletStore.transactionsLoading}
  <div class="flex items-center justify-center py-8">
    <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else if walletStore.transactionsError}
  <div class="text-center py-8 text-muted-foreground text-sm">
    {walletStore.transactionsError}
  </div>
{:else if displayTransactions.length === 0}
  <div class="text-center py-8 text-muted-foreground text-sm">
    No transactions yet
  </div>
{:else}
  <div class="space-y-2">
    {#each displayTransactions as tx (tx.id)}
      <div class="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
        <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center {tx.direction === 'in' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}">
          {#if tx.direction === 'in'}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          {/if}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-medium {tx.direction === 'in' ? 'text-green-600' : 'text-red-600'}">
              {formatAmount(tx.amount, tx.direction)} sats
            </span>
            <span class="text-xs text-muted-foreground">
              {formatDate(tx.timestamp)}
            </span>
          </div>

          {#if tx.description}
            <p class="text-sm text-muted-foreground mt-1 truncate">
              {tx.description}
            </p>
          {/if}

          {#if tx.fee && tx.fee > 0}
            <p class="text-xs text-muted-foreground mt-1">
              Fee: {tx.fee} sats
            </p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}
