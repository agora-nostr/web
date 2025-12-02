<script lang="ts">
  import { walletStore } from '../store.svelte.js';
  import { formatSats } from '../utils/format.js';
  import { Button } from '$lib/components/ui/button';
  import TransactionList from './TransactionList.svelte';
  import type { NDKNWCGetInfoResult } from '@nostr-dev-kit/wallet';

  interface Props {
    onDisconnect: () => void;
  }

  let { onDisconnect }: Props = $props();

  let walletInfo = $state<NDKNWCGetInfoResult | null>(null);
  let isLoading = $state(true);
  let showTransactions = $state(false);

  $effect(() => {
    if (walletStore.nwcWallet) {
      walletStore.nwcWallet
        .getInfo()
        .then((info) => {
          walletInfo = info;
        })
        .catch(() => {
          walletInfo = null;
        })
        .finally(() => {
          isLoading = false;
        });
    }
  });

  async function handleFetchTransactions() {
    showTransactions = true;
    if (walletStore.transactions.length === 0) {
      await walletStore.fetchTransactions();
    }
  }

  const balance = $derived(walletStore.getBalanceAmount());
</script>

<div class="border rounded-lg p-4 bg-card">
  <div class="flex items-start justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <div>
        <div class="font-medium text-foreground">
          External Wallet (NWC)
        </div>
        <div class="text-sm text-muted-foreground">
          {#if isLoading}
            Loading...
          {:else if walletInfo?.alias}
            {walletInfo.alias}
          {:else}
            Connected
          {/if}
        </div>
        {#if balance !== undefined}
          <div class="text-sm font-semibold text-primary mt-1">
            {formatSats(balance)} sats
          </div>
        {/if}
      </div>
    </div>

    <Button variant="outline" size="sm" onclick={onDisconnect}>
      Disconnect
    </Button>
  </div>

  {#if walletInfo?.methods}
    <div class="mt-4 pt-4 border-t">
      <div class="text-xs text-muted-foreground">
        Supported: {walletInfo.methods.join(', ')}
      </div>
    </div>
  {/if}

  <div class="mt-4 pt-4 border-t">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-foreground">Transaction History</h4>
      <Button
        variant="ghost"
        size="sm"
        onclick={handleFetchTransactions}
        disabled={walletStore.transactionsLoading}
      >
        {#if showTransactions}
          Refresh
        {:else}
          Show
        {/if}
      </Button>
    </div>

    {#if showTransactions}
      <TransactionList limit={5} />
    {/if}
  </div>
</div>
