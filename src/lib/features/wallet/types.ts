import type { NDKCashuWallet, NDKNWCWallet, NDKWalletTransaction } from '@nostr-dev-kit/wallet';
import type { ReactiveWalletStore } from '@nostr-dev-kit/svelte';

export type WalletType = 'nip60' | 'nwc';
export type AnyWallet = NDKCashuWallet | NDKNWCWallet | ReactiveWalletStore;

export interface WalletConfig {
  type: WalletType | null;
  nwcConnectionString?: string;
}

export type { NDKWalletTransaction };
