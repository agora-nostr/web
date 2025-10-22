<script lang="ts">
  import * as bolt11 from 'bolt11';
  import type { PaymentRequestObject } from 'bolt11';

  let {
    invoice = $bindable<string>(''),
    onPay = $bindable<(invoice: string) => void>(() => {}),
    onCancel = $bindable<() => void>(() => {})
  } = $props();

  let decoded = $state<PaymentRequestObject | null>(null);
  let error = $state<string | null>(null);

  $effect(() => {
    if (invoice) {
      try {
        // Remove lightning: prefix if present
        const cleanInvoice = invoice.trim().toLowerCase().startsWith('lightning:')
          ? invoice.trim().substring(10)
          : invoice.trim();

        decoded = bolt11.decode(cleanInvoice);
        error = null;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Invalid lightning invoice';
        decoded = null;
      }
    }
  });

  function formatAmount(millisatoshis?: number): string {
    if (!millisatoshis) return 'No amount specified';
    const sats = Math.floor(millisatoshis / 1000);
    return `${new Intl.NumberFormat('en-US').format(sats)} sats`;
  }

  function formatDate(timestamp?: number): string {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  }

  function formatExpiry(expirySeconds?: number, timestamp?: number): string {
    if (!expirySeconds || !timestamp) return 'N/A';
    const expiryDate = new Date((timestamp + expirySeconds) * 1000);
    const now = new Date();

    if (expiryDate < now) {
      return 'Expired';
    }

    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)} days`;
    } else if (diffHours > 0) {
      return `${diffHours} hours`;
    } else {
      return `${diffMins} minutes`;
    }
  }

  function getDescription(): string {
    if (!decoded) return '';

    const descTag = decoded.tags?.find(tag => tag.tagName === 'description');
    return descTag?.data as string || 'No description';
  }

  function getPaymentHash(): string {
    if (!decoded) return '';

    const hashTag = decoded.tags?.find(tag => tag.tagName === 'payment_hash');
    return hashTag?.data as string || '';
  }

  function handlePay() {
    if (decoded && invoice) {
      onPay(invoice);
    }
  }

  const isExpired = $derived(() => {
    if (!decoded?.timeExpireDate) return false;
    return decoded.timeExpireDate * 1000 < Date.now();
  });
</script>

{#if error}
  <div class="invoice-error">
    <div class="error-icon">⚠️</div>
    <h3>Invalid Invoice</h3>
    <p class="error-message">{error}</p>
    <button class="button-secondary" onclick={onCancel}>
      Go Back
    </button>
  </div>
{:else if decoded}
  <div class="invoice-details">
    <div class="invoice-header">
      <div class="amount-section">
        <div class="amount-label">Amount</div>
        <div class="amount-value">{formatAmount(decoded.millisatoshis)}</div>
      </div>
    </div>

    <div class="details-section">
      <div class="detail-row">
        <span class="detail-label">Description</span>
        <span class="detail-value">{getDescription()}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Created</span>
        <span class="detail-value">{formatDate(decoded.timestamp)}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Expires in</span>
        <span class="detail-value" class:expired={isExpired()}>
          {formatExpiry(decoded.timeExpireDate ? decoded.timeExpireDate - (decoded.timestamp || 0) : undefined, decoded.timestamp)}
        </span>
      </div>

      {#if decoded.payeeNodeKey}
        <div class="detail-row">
          <span class="detail-label">Payee</span>
          <span class="detail-value monospace">{decoded.payeeNodeKey.substring(0, 16)}...</span>
        </div>
      {/if}

      {#if getPaymentHash()}
        <div class="detail-row">
          <span class="detail-label">Payment Hash</span>
          <span class="detail-value monospace">{getPaymentHash().substring(0, 16)}...</span>
        </div>
      {/if}
    </div>

    <div class="invoice-string">
      <div class="invoice-label">Invoice</div>
      <div class="invoice-text">{invoice}</div>
    </div>

    <div class="actions">
      {#if isExpired()}
        <button class="button-secondary full-width" onclick={onCancel}>
          Close
        </button>
      {:else}
        <button class="button-secondary" onclick={onCancel}>
          Cancel
        </button>
        <button class="button-primary" onclick={handlePay}>
          Pay {formatAmount(decoded.millisatoshis)}
        </button>
      {/if}
    </div>
  </div>
{:else}
  <div class="loading">
    <div class="spinner"></div>
    <p>Decoding invoice...</p>
  </div>
{/if}

<style>
  .invoice-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    min-height: 400px;
  }

  .error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .invoice-error h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-foreground);
    margin-bottom: 0.5rem;
  }

  .error-message {
    color: var(--color-muted-foreground);
    margin-bottom: 2rem;
    max-width: 400px;
  }

  .invoice-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .invoice-header {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #2563eb) 100%);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    color: white;
  }

  .amount-label {
    font-size: 0.875rem;
    opacity: 0.9;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .amount-value {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .details-section {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-size: 0.875rem;
    color: var(--color-muted-foreground);
    font-weight: 600;
    flex-shrink: 0;
  }

  .detail-value {
    font-size: 0.875rem;
    color: var(--color-foreground);
    text-align: right;
    word-break: break-word;
  }

  .detail-value.expired {
    color: var(--color-destructive);
    font-weight: 600;
  }

  .detail-value.monospace {
    font-family: monospace;
    font-size: 0.8rem;
  }

  .invoice-string {
    background: var(--color-muted);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1rem;
  }

  .invoice-label {
    font-size: 0.875rem;
    color: var(--color-muted-foreground);
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .invoice-text {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--color-foreground);
    word-break: break-all;
    line-height: 1.5;
    max-height: 100px;
    overflow-y: auto;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .button-primary,
  .button-secondary {
    flex: 1;
    padding: 1rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-primary {
    background: var(--color-primary);
    border: none;
    color: white;
  }

  .button-primary:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  .button-secondary {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    color: var(--color-foreground);
  }

  .button-secondary:hover {
    background: var(--color-muted);
  }

  .button-secondary.full-width {
    width: 100%;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
    min-height: 400px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading p {
    color: var(--color-muted-foreground);
    font-size: 0.9rem;
  }

  @media (max-width: 640px) {
    .invoice-details {
      padding: 0.5rem;
    }

    .invoice-header {
      padding: 1.5rem 1rem;
    }

    .amount-value {
      font-size: 2rem;
    }

    .detail-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .detail-value {
      text-align: left;
    }
  }
</style>
