<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { createMintDiscoveryStore, type MintMetadata } from '@nostr-dev-kit/wallet';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';

  interface Props {
    open: boolean;
    onSelectMints: (mints: string[]) => void;
    onClose: () => void;
  }

  let { open = $bindable(false), onSelectMints, onClose }: Props = $props();

  // Create mint discovery store
  const mintStore = createMintDiscoveryStore(ndk, {
    network: 'mainnet',
    timeout: 0, // No auto-timeout
  });

  let discoveredMints = $state<MintMetadata[]>([]);
  let selectedMints = $state<Set<string>>(new Set());
  let showManualInput = $state(false);
  let manualMintUrl = $state('');
  let manualMintError = $state('');

  // Subscribe to the Zustand store
  $effect(() => {
    const unsubscribe = mintStore.subscribe((state) => {
      discoveredMints = state.mints;
    });

    return () => {
      unsubscribe();
      mintStore.getState().stop();
    };
  });

  function getHostnameFromUrl(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  function toggleMint(url: string) {
    const newSelection = new Set(selectedMints);
    if (newSelection.has(url)) {
      newSelection.delete(url);
    } else {
      newSelection.add(url);
    }
    selectedMints = newSelection;
  }

  function addManualMint() {
    const trimmedUrl = manualMintUrl.trim();

    // Validate URL
    try {
      const url = new URL(trimmedUrl);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        manualMintError = 'Please use https:// or http:// URL';
        return;
      }
    } catch {
      manualMintError = 'Please enter a valid mint URL';
      return;
    }

    // Check if already added
    if (selectedMints.has(trimmedUrl)) {
      manualMintError = 'This mint has already been selected';
      return;
    }

    if (discoveredMints.some((m) => m.url === trimmedUrl)) {
      manualMintError = 'This mint is already in the list below';
      return;
    }

    // Add to selected mints
    const newSelection = new Set(selectedMints);
    newSelection.add(trimmedUrl);
    selectedMints = newSelection;

    // Reset form
    manualMintUrl = '';
    showManualInput = false;
    manualMintError = '';
  }

  function toggleManualInput() {
    showManualInput = !showManualInput;
    manualMintUrl = '';
    manualMintError = '';
  }

  function handleAddSelected() {
    if (selectedMints.size === 0) return;
    onSelectMints(Array.from(selectedMints));
    open = false;
  }

  function handleClose() {
    open = false;
    onClose();
  }

  // Custom mints that were manually added (not in discovered list)
  const customMints = $derived(
    Array.from(selectedMints).filter(
      (mintUrl) => !discoveredMints.some((m) => m.url === mintUrl)
    )
  );
</script>

<Dialog.Root {open} onOpenChange={(newOpen: boolean) => { if (!newOpen) handleClose(); }}>
    <Dialog.Content class="max-w-2xl max-h-[90vh] flex flex-col p-0">
      <Dialog.Header class="px-6 py-4 border-b border-border">
        <Dialog.Title>Browse Mints</Dialog.Title>
      </Dialog.Header>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <!-- Info Card -->
        <div class="flex gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div class="text-lg flex-shrink-0">ℹ️</div>
          <div class="text-sm text-muted-foreground">
            Mints are custodial services that issue ecash tokens. Select multiple mints to spread risk.
          </div>
        </div>

        <!-- Manual mint input -->
        <div class="flex flex-col gap-3 p-4 bg-muted/30 border border-border rounded-lg">
          <button
            class="flex items-center gap-2 text-left font-semibold text-foreground"
            onclick={toggleManualInput}
          >
            <span class="flex items-center justify-center w-6 h-6 bg-primary/20 text-primary rounded text-lg font-bold">
              {showManualInput ? '−' : '+'}
            </span>
            Add Custom Mint
          </button>

          {#if showManualInput}
            <div class="flex gap-2">
              <Input
                type="url"
                bind:value={manualMintUrl}
                placeholder="https://mint.example.com"
                class="flex-1 font-mono text-sm"
              />
              <Button onclick={addManualMint} disabled={!manualMintUrl.trim()}>
                Add
              </Button>
            </div>

            {#if manualMintError}
              <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {manualMintError}
              </div>
            {/if}
          {/if}
        </div>

        <!-- Discovered mints -->
        {#if discoveredMints.length > 0}
          <div class="space-y-3">
            {#each discoveredMints as mint}
              <button
                class="w-full flex items-start gap-4 p-4 bg-muted/30 border rounded-lg text-left transition-all hover:bg-muted/50 hover:border-primary/30 {selectedMints.has(mint.url) ? 'bg-primary/15 border-primary/50' : 'border-border'}"
                onclick={() => toggleMint(mint.url)}
              >
                <div class="flex items-center pt-0.5">
                  <div class="w-6 h-6 border-2 rounded flex items-center justify-center transition-all {selectedMints.has(mint.url) ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-muted/50'}">
                    {#if selectedMints.has(mint.url)}
                      <span class="text-primary-foreground text-sm font-bold">✓</span>
                    {/if}
                  </div>
                </div>

                <div class="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-primary/20 flex items-center justify-center">
                  {#if mint.icon}
                    <img src={mint.icon} alt={mint.name || mint.url} class="w-full h-full object-cover" />
                  {:else}
                    <span class="text-2xl">🏦</span>
                  {/if}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-foreground mb-1">
                    {mint.name || getHostnameFromUrl(mint.url)}
                  </div>
                  {#if mint.description}
                    <div class="text-sm text-muted-foreground mb-1 line-clamp-2">
                      {mint.description}
                    </div>
                  {/if}
                  <div class="text-xs font-mono text-muted-foreground truncate">
                    {mint.url}
                  </div>
                  {#if mint.recommendations.length > 0}
                    <div class="text-xs text-yellow-500 mt-1">
                      ⭐ Recommended by {mint.recommendations.length} user{mint.recommendations.length === 1 ? '' : 's'}
                    </div>
                  {/if}
                  {#if mint.isOnline !== undefined}
                    <div class="text-xs mt-1 {mint.isOnline ? 'text-green-400' : 'text-red-400'}">
                      {mint.isOnline ? '🟢 Online' : '🔴 Offline'}
                    </div>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        {:else}
          <div class="flex flex-col items-center justify-center py-12 px-4 text-center bg-muted/20 border border-dashed border-border rounded-lg">
            <div class="text-5xl mb-4">🔍</div>
            <p class="text-muted-foreground">Discovering mints from the network...</p>
            <p class="text-sm text-muted-foreground/60 mt-1">Add custom mints above or wait for discovery</p>
          </div>
        {/if}

        <!-- Custom mints section -->
        {#if customMints.length > 0}
          <div class="pt-2">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Custom Mints</h4>
            <div class="space-y-3">
              {#each customMints as mintUrl}
                <div class="flex items-start gap-4 p-4 bg-primary/15 border border-primary/50 rounded-lg">
                  <div class="w-12 h-12 flex-shrink-0 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span class="text-2xl">🏦</span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-foreground mb-1">
                      {getHostnameFromUrl(mintUrl)}
                    </div>
                    <div class="text-xs font-mono text-muted-foreground truncate">
                      {mintUrl}
                    </div>
                  </div>

                  <button
                    class="w-8 h-8 flex-shrink-0 self-center flex items-center justify-center bg-red-500/20 border border-red-500/30 rounded text-red-400 font-bold hover:bg-red-500/30 transition-colors"
                    onclick={() => toggleMint(mintUrl)}
                  >
                    ✕
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-border space-y-3">
        {#if selectedMints.size > 0}
          <div class="flex items-center justify-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm font-semibold">
            <span class="text-primary">✓</span>
            {selectedMints.size} mint{selectedMints.size === 1 ? '' : 's'} selected
          </div>
        {/if}

        <div class="flex gap-3">
          <Button variant="outline" onclick={handleClose} class="flex-1">
            Cancel
          </Button>
          <Button onclick={handleAddSelected} disabled={selectedMints.size === 0} class="flex-1">
            Add Selected Mints
          </Button>
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Root>
