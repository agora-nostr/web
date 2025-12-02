<script lang="ts">
  import { walletStore, formatSats } from '$lib/features/wallet';
  import { NDKWalletStatus } from '@nostr-dev-kit/wallet';

  const balance = $derived(walletStore.getBalanceAmount() ?? 0);
  const status = $derived(walletStore.wallet?.status === NDKWalletStatus.READY ? 'idle' : walletStore.wallet?.status === NDKWalletStatus.FAILED ? 'error' : 'loading');
</script>

<div class="balance-card">
  <div class="balance-amount">
    <span class="amount gradient-text">{formatSats(balance)}</span>
    <span class="unit">sats</span>
  </div>

  <!-- {#if status === 'loading'}
    <div class="status-badge loading">
      <div class="spinner"></div>
      <span>Loading wallet...</span>
    </div>
  {:else if status === 'error'}
    <div class="status-badge error">
      ⚠️ Error loading wallet
    </div>
  {/if} -->
</div>

<style>
  .balance-card {
    position: relative;
    padding: 2rem 1rem;
    text-align: center;
  }

  .balance-amount {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .amount {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .gradient-text {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-700) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .unit {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 600;
  }

  @media (max-width: 640px) {
    .amount {
      font-size: 3rem;
    }

    .unit {
      font-size: 1.25rem;
    }
  }
</style>
