<script lang="ts">
  interface Props {
    onSelectNWC: () => void;
    onSelectNip60: () => void;
  }

  let { onSelectNWC, onSelectNip60 }: Props = $props();
</script>

<div class="space-y-3">
  <button
    onclick={onSelectNWC}
    class="w-full border rounded-lg p-4 hover:bg-muted transition-colors text-left group"
  >
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-foreground group-hover:text-primary transition-colors">
          Link External Wallet (NWC)
        </div>
        <div class="text-sm text-muted-foreground mt-1">
          Use Alby, Primal, or any NWC-compatible wallet. Your keys stay with your wallet provider.
        </div>
      </div>
      <svg class="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>

  <button
    onclick={onSelectNip60}
    class="w-full border rounded-lg p-4 hover:bg-muted transition-colors text-left group"
  >
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-foreground group-hover:text-primary transition-colors">
          Create Built-in Wallet
        </div>
        <div class="text-sm text-muted-foreground mt-1">
          Cashu ecash wallet stored on Nostr. Simple, portable, and works offline.
        </div>
      </div>
      <svg class="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
</div>
