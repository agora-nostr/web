<script lang="ts">
  import { browser } from '$app/environment';
  import { Html5Qrcode } from 'html5-qrcode';

  let { onScan = $bindable<(data: string) => void>(() => {}), onCancel = $bindable<() => void>(() => {}) } = $props();

  let isScanning = $state(false);
  let error = $state<string | null>(null);
  let pasteValue = $state('');
  let showPasteInput = $state(false);
  let html5QrCode: Html5Qrcode | null = null;
  let readerElement: HTMLDivElement | null = null;

  async function startScan() {
    if (!browser || !readerElement) return;

    try {
      isScanning = true;
      error = null;

      // Create scanner instance
      html5QrCode = new Html5Qrcode('qr-reader');

      // Configuration for scanning
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      // Success callback
      const qrCodeSuccessCallback = (decodedText: string) => {
        handleScannedData(decodedText);
      };

      // Start scanning with back camera (environment facing)
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        undefined // error callback
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);

      // Show user-friendly error and fallback to paste
      if (errorMessage.toLowerCase().includes('permission') ||
          errorMessage.toLowerCase().includes('notallowed')) {
        error = 'Camera permission denied. Please paste your invoice below.';
      } else if (errorMessage.toLowerCase().includes('notfound') ||
                 errorMessage.toLowerCase().includes('no camera')) {
        error = 'No camera found. Please paste your invoice below.';
      } else {
        error = 'Unable to access camera. Please paste your invoice below.';
      }

      console.error('Scan error:', e);
      showPasteInput = true;
      isScanning = false;
    }
  }

  async function stopScan() {
    if (html5QrCode) {
      try {
        await html5QrCode.stop();
        html5QrCode.clear();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
      html5QrCode = null;
    }
    isScanning = false;
  }

  function handleScannedData(data: string) {
    // Clean up the data (remove lightning: prefix if present)
    const cleanData = data.trim().toLowerCase().startsWith('lightning:')
      ? data.trim().substring(10)
      : data.trim();

    stopScan();
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

  async function cancel() {
    await stopScan();
    onCancel();
  }

  // Use effect with cleanup instead of onMount/onDestroy
  $effect(() => {
    if (browser) {
      startScan();
    }

    // Cleanup when component unmounts
    return () => {
      stopScan();
    };
  });
</script>

<div class="scanner-container">
  <!-- QR Reader Container -->
  <div id="qr-reader" bind:this={readerElement} class="qr-reader"></div>

  {#if error}
    <div class="error-message-bar">
      <p>{error}</p>
    </div>
  {/if}

  {#if isScanning}
    <div class="scanner-overlay">
      <div class="scanner-instructions">
        <p>Position QR code within the frame</p>
      </div>

      <button class="cancel-button" onclick={cancel}>
        Cancel
      </button>
    </div>
  {/if}

  <!-- Paste button always available at bottom -->
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
    z-index: 9999;
    background: black;
    display: flex;
    flex-direction: column;
  }

  .qr-reader {
    width: 100%;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qr-reader :global(video) {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .error-message-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 1rem;
    text-align: center;
    z-index: 10000;
  }

  .error-message-bar p {
    margin: 0;
    font-size: 0.9rem;
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
    justify-content: flex-start;
    padding: 2rem;
    pointer-events: none;
  }

  .scanner-instructions {
    color: white;
    text-align: center;
    margin-top: 6rem;
    margin-bottom: 2rem;
    font-size: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
    background: rgba(0, 0, 0, 0.5);
    padding: 1rem 1.5rem;
    border-radius: 8px;
  }

  .scanner-instructions p {
    margin: 0;
  }

  .cancel-button {
    padding: 0.75rem 2rem;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    pointer-events: auto;
    margin-top: auto;
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
    z-index: 10001;
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
    pointer-events: auto; /* Enable interaction for button */
  }

  .paste-button:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px);
  }

  .paste-button:active {
    transform: translateY(0);
  }

  .paste-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .paste-input-container {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    pointer-events: auto; /* Enable interaction for container */
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

  @media (max-width: 640px) {
    .scanner-instructions {
      font-size: 0.875rem;
      margin-top: 4rem;
      padding: 0.75rem 1rem;
    }

    .paste-section {
      padding: 1rem;
    }
  }
</style>
