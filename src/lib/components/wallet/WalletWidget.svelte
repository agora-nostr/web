<script lang="ts">
  import { walletStore } from '$lib/features/wallet';
  import { headerStore } from '$lib/stores/header.svelte';
  import BalanceCard from './BalanceCard.svelte';
  import SendView from './SendView.svelte';
  import ReceiveView from './ReceiveView.svelte';
  import QRScanner from './QRScanner.svelte';
  import InvoiceDetails from './InvoiceDetails.svelte';
  import TransactionList from './TransactionList.svelte';

  type TabView = 'wallet' | 'send' | 'receive' | 'scan' | 'invoice';
  let currentTab = $state<TabView>('wallet');
  let scannedInvoice = $state<string>('');

  function handleScan(data: string) {
    scannedInvoice = data;
    currentTab = 'invoice';
  }

  function handleCancelScan() {
    currentTab = 'wallet';
    scannedInvoice = '';
  }

  async function handlePayInvoice(invoice: string) {
    if (!walletStore.wallet) throw new Error('Wallet not available');

    try {
      await walletStore.wallet.lnPay({
        pr: invoice,
      });

      currentTab = 'wallet';
      scannedInvoice = '';
    } catch (e) {
      console.error('Payment failed:', e);
      throw e;
    }
  }

  function handleCancelInvoice() {
    currentTab = 'wallet';
    scannedInvoice = '';
  }

  // Set up header config with consistent styling
  $effect(() => {
    const title =
      currentTab === 'wallet' ? 'Wallet' :
      currentTab === 'send' || currentTab === 'scan' ? 'Send' :
      currentTab === 'invoice' ? 'Payment Details' :
      currentTab === 'receive' ? 'Receive' : 'Wallet';

    headerStore.headerConfig = {
      title,
      backNav: currentTab !== 'wallet' ? { onclick: () => currentTab = 'wallet' } : undefined,
      actions: currentTab === 'wallet' ? settingsAction : undefined
    };

    return () => {
      headerStore.clear();
    };
  });
</script>

{#snippet settingsAction()}
  <a
    href="/settings?tab=wallet"
    class="inline-flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </a>
{/snippet}

<div class="wallet-container">

  <!-- Content -->
  <div class="wallet-content">
    {#if currentTab === 'wallet'}
      <div class="balance-section">
        <BalanceCard />
      </div>

      <div class="action-buttons">
        <button class="action-btn send" onclick={() => currentTab = 'send'}>
          <span class="action-icon">↑</span>
          <span class="action-label">Send</span>
        </button>
        <button class="action-btn scan" onclick={() => currentTab = 'scan'}>
          <svg class="action-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="4" width="6" height="6" stroke="currentColor" stroke-width="2" fill="none" rx="1"/>
            <rect x="14" y="4" width="6" height="6" stroke="currentColor" stroke-width="2" fill="none" rx="1"/>
            <rect x="4" y="14" width="6" height="6" stroke="currentColor" stroke-width="2" fill="none" rx="1"/>
            <rect x="14" y="14" width="6" height="6" stroke="currentColor" stroke-width="2" fill="none" rx="1"/>
          </svg>
          <span class="action-label">Scan QR</span>
        </button>
        <button class="action-btn receive" onclick={() => currentTab = 'receive'}>
          <span class="action-icon">↓</span>
          <span class="action-label">Receive</span>
        </button>
      </div>

      <div class="transactions-section">
        <TransactionList />
      </div>
    {:else if currentTab === 'send'}
      <SendView />
    {:else if currentTab === 'scan'}
      <QRScanner onScan={handleScan} onCancel={handleCancelScan} />
    {:else if currentTab === 'invoice'}
      <InvoiceDetails invoice={scannedInvoice} onPay={handlePayInvoice} onCancel={handleCancelInvoice} />
    {:else if currentTab === 'receive'}
      <ReceiveView />
    {/if}
  </div>
</div>

<style>
  .wallet-container {
    width: 100%;
  }

  .wallet-content {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
  }

  .balance-section {
    margin-bottom: 2rem;
  }

  .transactions-section {
    margin-top: 2rem;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.75rem;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1.5rem 1rem;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--color-foreground);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .action-btn:hover {
    background: var(--color-muted);
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }

  .action-btn:active {
    transform: translateY(0);
  }

  .action-icon {
    font-size: 1.75rem;
    line-height: 1;
    transition: transform 0.2s;
    color: var(--color-primary);
  }

  .action-icon-svg {
    width: 1.75rem;
    height: 1.75rem;
    transition: transform 0.2s;
    color: var(--color-primary);
  }

  .action-btn:hover .action-icon,
  .action-btn:hover .action-icon-svg {
    transform: scale(1.1);
  }

  .action-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted-foreground);
  }

  @media (max-width: 640px) {
    .wallet-container {
      padding: 0.5rem;
    }

    .action-btn {
      padding: 1.25rem 0.75rem;
      gap: 0.5rem;
    }

    .action-icon {
      font-size: 1.5rem;
    }

    .action-icon-svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .action-label {
      font-size: 0.75rem;
    }
  }
</style>
