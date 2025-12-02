<script lang="ts">
  import { walletStore } from '../store.svelte.js';
  import { isValidNWCString } from '../utils/nwc.js';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';

  interface Props {
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { onSuccess, onCancel }: Props = $props();

  let connectionString = $state('');
  let isConnecting = $state(false);
  let error = $state<string | null>(null);
  let walletInfo = $state<{ alias?: string } | null>(null);

  async function connect() {
    error = null;

    if (!connectionString.trim()) {
      error = 'Please enter a connection string';
      return;
    }

    if (!isValidNWCString(connectionString.trim())) {
      error = 'Invalid NWC connection string. It should start with nostr+walletconnect://';
      return;
    }

    isConnecting = true;

    try {
      await walletStore.connectNWC(connectionString.trim());

      // Try to get wallet info
      try {
        const info = await walletStore.nwcWallet?.getInfo();
        walletInfo = info ?? null;
      } catch {
        // getInfo is optional, ignore errors
      }

      onSuccess?.();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Connection failed';
    } finally {
      isConnecting = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && connectionString.trim()) {
      connect();
    }
  }
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <label for="nwc-connection" class="text-sm font-medium text-foreground">
      NWC Connection String
    </label>
    <Input
      id="nwc-connection"
      type="password"
      bind:value={connectionString}
      onkeydown={handleKeydown}
      placeholder="nostr+walletconnect://..."
      disabled={isConnecting}
    />
    <p class="text-xs text-muted-foreground">
      Get this from your wallet app (Alby, Primal, etc.)
    </p>
  </div>

  {#if error}
    <div class="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-sm text-red-800 dark:text-red-300">{error}</p>
    </div>
  {/if}

  {#if walletInfo}
    <div class="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
      <p class="text-sm text-green-800 dark:text-green-300">
        Connected to: {walletInfo.alias || 'NWC Wallet'}
      </p>
    </div>
  {/if}

  <div class="flex gap-2">
    {#if onCancel}
      <Button variant="outline" onclick={onCancel} disabled={isConnecting} class="flex-1">
        Cancel
      </Button>
    {/if}
    <Button onclick={connect} disabled={isConnecting || !connectionString.trim()} class="flex-1">
      {#if isConnecting}
        <svg class="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Connecting...
      {:else}
        Connect Wallet
      {/if}
    </Button>
  </div>
</div>
