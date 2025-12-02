<script lang="ts">
  import { walletStore, NWCWalletCard, Nip60WalletCard, WalletTypeSelector, NWCConnectForm } from '$lib/features/wallet';

  type View = 'main' | 'switch-nwc';
  let view = $state<View>('main');

  function handleDisconnect() {
    walletStore.disconnect();
  }

  function handleSwitchToNWC() {
    view = 'switch-nwc';
  }

  function handleSwitchToNip60() {
    walletStore.useNip60();
  }

  function handleNWCSuccess() {
    view = 'main';
  }

  function handleNWCCancel() {
    view = 'main';
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h2 class="text-xl font-semibold text-foreground mb-2">
      Wallet Configuration
    </h2>
    <p class="text-sm text-muted-foreground">
      Manage your Bitcoin wallet for payments and zaps.
    </p>
  </div>

  {#if view === 'switch-nwc'}
    <!-- NWC Connection Form -->
    <div class="space-y-4">
      <div class="border rounded-lg p-4 bg-card">
        <h3 class="text-lg font-semibold text-foreground mb-4">Connect External Wallet</h3>
        <NWCConnectForm
          onSuccess={handleNWCSuccess}
          onCancel={handleNWCCancel}
        />
      </div>
    </div>
  {:else if walletStore.isNWC}
    <!-- NWC Wallet is active -->
    <NWCWalletCard onDisconnect={handleDisconnect} />

    <!-- Switch to NIP-60 option -->
    <div class="border rounded-lg p-4 bg-card">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="font-medium text-foreground">Switch Wallet</h3>
          <p class="text-sm text-muted-foreground">
            Use the built-in Cashu wallet instead
          </p>
        </div>
        <button
          onclick={handleSwitchToNip60}
          class="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          Use Built-in Wallet
        </button>
      </div>
    </div>
  {:else if walletStore.isNip60}
    <!-- NIP-60 Wallet is active -->
    <Nip60WalletCard />

    <!-- Switch to NWC option -->
    <div class="border rounded-lg p-4 bg-card">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="font-medium text-foreground">Switch Wallet</h3>
          <p class="text-sm text-muted-foreground">
            Connect an external wallet via NWC
          </p>
        </div>
        <button
          onclick={handleSwitchToNWC}
          class="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          Connect External Wallet
        </button>
      </div>
    </div>
  {:else}
    <!-- No wallet configured -->
    <div class="border rounded-lg p-6 bg-card">
      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-foreground mb-2">No Wallet Connected</h3>
        <p class="text-sm text-muted-foreground">
          Set up a wallet to send and receive Bitcoin payments
        </p>
      </div>

      <WalletTypeSelector
        onSelectNWC={handleSwitchToNWC}
        onSelectNip60={handleSwitchToNip60}
      />
    </div>
  {/if}
</div>
