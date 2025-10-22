<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
  import type { ScanResult } from '@capacitor/barcode-scanner';

  let { onScan = $bindable<(data: string) => void>(() => {}), onCancel = $bindable<() => void>(() => {}) } = $props();

  let isScanning = $state(false);
  let error = $state<string | null>(null);
  let pasteValue = $state('');
  let showPasteInput = $state(false);

  async function startScan() {
    try {
      // Hide background to show camera
      document.body.classList.add('scanner-active');
      isScanning = true;
      error = null;

      // Start scanning - the plugin handles permissions internally
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: 17, // QR_CODE format
        scanInstructions: 'Position QR code within the frame',
        scanButton: false,
        scanText: ''
      });

      if (result && result.ScanResult) {
        handleScannedData(result.ScanResult);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      console.error('Scan error:', e);
    } finally {
      stopScan();
    }
  }

  function stopScan() {
    document.body.classList.remove('scanner-active');
    isScanning = false;
  }

  function handleScannedData(data: string) {
    // Clean up the data (remove lightning: prefix if present)
    const cleanData = data.trim().toLowerCase().startsWith('lightning:')
      ? data.trim().substring(10)
      : data.trim();

    onScan(cleanData);
  }

  function handlePaste() {
    if (pasteValue.trim()) {
      handleScannedData(pasteValue);
      pasteValue = '';
      showPasteInput = false;
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        pasteValue = text;
        showPasteInput = true;
      }
    } catch (e) {
      // Fallback to manual input if clipboard access fails
      showPasteInput = true;
    }
  }

  function cancel() {
    stopScan();
    onCancel();
  }

  onMount(() => {
    startScan();
  });

  onDestroy(() => {
    stopScan();
  });
</script>

<div class="scanner-container">
  {#if error}
    <div class="error-overlay">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{error}</p>
        <button class="button-primary" onclick={cancel}>Close</button>
      </div>
    </div>
  {/if}

  {#if isScanning}
    <div class="scanner-overlay">
      <div class="scanner-frame">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
      </div>

      <div class="scanner-instructions">
        <p>Position QR code within the frame</p>
      </div>

      <button class="cancel-button" onclick={cancel}>
        Cancel
      </button>
    </div>
  {/if}

  <div class="paste-section">
    {#if showPasteInput}
      <div class="paste-input-container">
        <textarea
          bind:value={pasteValue}
          placeholder="Paste lightning invoice here..."
          rows="3"
          class="paste-input"
        ></textarea>
        <div class="paste-actions">
          <button class="button-secondary" onclick={() => showPasteInput = false}>
            Cancel
          </button>
          <button
            class="button-primary"
            onclick={handlePaste}
            disabled={!pasteValue.trim()}
          >
            Continue
          </button>
        </div>
      </div>
    {:else}
      <button class="paste-button" onclick={pasteFromClipboard}>
        <svg class="paste-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Paste Invoice
      </button>
    {/if}
  </div>
</div>

<style>
  .scanner-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: black;
    z-index: 9999;
  }

  .scanner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .scanner-frame {
    position: relative;
    width: 250px;
    height: 250px;
    margin-bottom: 2rem;
  }

  .corner {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 3px solid white;
  }

  .corner.top-left {
    top: 0;
    left: 0;
    border-right: none;
    border-bottom: none;
  }

  .corner.top-right {
    top: 0;
    right: 0;
    border-left: none;
    border-bottom: none;
  }

  .corner.bottom-left {
    bottom: 0;
    left: 0;
    border-right: none;
    border-top: none;
  }

  .corner.bottom-right {
    bottom: 0;
    right: 0;
    border-left: none;
    border-top: none;
  }

  .scanner-instructions {
    color: white;
    text-align: center;
    margin-bottom: 2rem;
    font-size: 1rem;
  }

  .cancel-button {
    padding: 0.75rem 2rem;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .paste-section {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1.5rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  }

  .paste-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    background: white;
    border: none;
    border-radius: 12px;
    color: black;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .paste-button:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px);
  }

  .paste-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .paste-input-container {
    background: white;
    border-radius: 12px;
    padding: 1rem;
  }

  .paste-input {
    width: 100%;
    padding: 0.75rem;
    background: var(--color-muted, #f5f5f5);
    border: 1px solid var(--color-border, #e5e5e5);
    border-radius: 8px;
    color: black;
    font-size: 0.9rem;
    font-family: monospace;
    resize: vertical;
    margin-bottom: 0.75rem;
  }

  .paste-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
  }

  .paste-actions {
    display: flex;
    gap: 0.75rem;
  }

  .button-primary,
  .button-secondary {
    flex: 1;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-primary {
    background: var(--color-primary, #3b82f6);
    border: none;
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    opacity: 0.9;
  }

  .button-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-secondary {
    background: transparent;
    border: 1px solid var(--color-border, #e5e5e5);
    color: black;
  }

  .button-secondary:hover {
    background: var(--color-muted, #f5f5f5);
  }

  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    z-index: 10;
  }

  .error-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 400px;
    text-align: center;
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-message {
    color: black;
    margin-bottom: 1.5rem;
    font-size: 1rem;
  }

  :global(body.scanner-active) {
    background: transparent !important;
  }

  @media (max-width: 640px) {
    .scanner-frame {
      width: 200px;
      height: 200px;
    }

    .corner {
      width: 30px;
      height: 30px;
    }
  }
</style>
