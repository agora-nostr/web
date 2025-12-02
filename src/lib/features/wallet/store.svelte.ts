import { NDKNWCWallet, type NDKWalletTransaction } from '@nostr-dev-kit/wallet';
import { ndk } from '$lib/ndk.svelte';
import type { AnyWallet, WalletType } from './types.js';

const STORAGE_KEY = 'agora-wallet-config';

class WalletStore {
  private _nwcWallet = $state<NDKNWCWallet | null>(null);
  private _type = $state<WalletType | null>(null);
  private _connectionString = $state<string | null>(null);
  private _transactions = $state<NDKWalletTransaction[]>([]);
  private _transactionsLoading = $state(false);
  private _transactionsError = $state<string | null>(null);

  /**
   * Returns the active wallet - either NWC or NIP-60 from NDK sessions
   */
  get wallet(): AnyWallet | null {
    if (this._type === 'nwc') return this._nwcWallet;
    return ndk.$wallet ?? null;
  }

  get type() {
    return this._type;
  }

  get isNWC() {
    return this._type === 'nwc';
  }

  get isNip60() {
    return this._type === 'nip60';
  }

  get hasWallet() {
    return this.wallet != null;
  }

  /**
   * Returns true if user is logged in but has no wallet configured
   * (neither NWC nor NIP-60)
   */
  get needsSetup(): boolean {
    // No user logged in - don't need setup
    if (!ndk.$currentUser) return false;
    // Already have a configured type and wallet
    if (this._type && this.wallet) return false;
    // Have NIP-60 wallet from NDK (auto-detection happens in restore())
    if (ndk.$wallet) return false;
    // User logged in but no wallet
    return true;
  }

  /**
   * Get balance amount, handling both number and NDKWalletBalance types
   */
  getBalanceAmount(): number | undefined {
    const bal = this.wallet?.balance;
    if (typeof bal === 'number') return bal;
    return bal?.amount;
  }

  get nwcWallet() {
    return this._nwcWallet;
  }

  get transactions() {
    return this._transactions;
  }

  get transactionsLoading() {
    return this._transactionsLoading;
  }

  get transactionsError() {
    return this._transactionsError;
  }

  /**
   * Connect to an NWC wallet with verification
   */
  async connectNWC(connectionString: string): Promise<void> {
    const wallet = new NDKNWCWallet(ndk, {
      pairingCode: connectionString,
      timeout: 30000,
    });

    // Verify connection works before saving
    await wallet.getInfo();

    this._nwcWallet = wallet;
    this._type = 'nwc';
    this._connectionString = connectionString;
    this.persist();
  }

  /**
   * Switch to using the NIP-60 wallet
   */
  useNip60(): void {
    this._nwcWallet = null;
    this._type = 'nip60';
    this._connectionString = null;
    this.persist();
  }

  /**
   * Disconnect from any wallet
   */
  disconnect(): void {
    this._nwcWallet = null;
    this._type = null;
    this._connectionString = null;
    this.persist();
  }

  /**
   * Fetch transaction history for the current wallet
   */
  async fetchTransactions(): Promise<void> {
    const wallet = this.wallet;
    if (!wallet) {
      this._transactionsError = 'No wallet connected';
      return;
    }

    if (!('fetchTransactions' in wallet)) {
      this._transactionsError = 'Wallet does not support transaction history';
      return;
    }

    this._transactionsLoading = true;
    this._transactionsError = null;

    try {
      const txs = await wallet.fetchTransactions();
      this._transactions = txs;
    } catch (e) {
      this._transactionsError = e instanceof Error ? e.message : 'Failed to fetch transactions';
      console.error('Failed to fetch transactions:', e);
    } finally {
      this._transactionsLoading = false;
    }
  }

  /**
   * Restore wallet configuration from localStorage
   */
  restore(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        if (config.type === 'nwc' && config.nwcConnectionString) {
          this.connectNWC(config.nwcConnectionString);
          return;
        } else if (config.type === 'nip60') {
          this._type = 'nip60';
          return;
        }
      }

      // Auto-detect NIP-60 wallet if none configured
      if (!this._type && ndk.$wallet) {
        this._type = 'nip60';
      }
    } catch (e) {
      console.error('Failed to restore wallet config:', e);
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          type: this._type,
          nwcConnectionString: this._connectionString,
        })
      );
    } catch (e) {
      console.error('Failed to persist wallet config:', e);
    }
  }
}

export const walletStore = new WalletStore();
