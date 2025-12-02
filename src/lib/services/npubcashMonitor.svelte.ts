import { ndk } from '$lib/ndk.svelte';
import { walletStore } from '$lib/features/wallet';
import { npubCash } from '$lib/stores/npubcash.svelte';
import type { NDKSubscription } from '@nostr-dev-kit/ndk';
import { npubCashLogger as logger } from '$lib/utils/logger';

const ZAP_KIND = 9735;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

class NpubCashMonitor {
	private zapSubscription: NDKSubscription | null = null;
	private checkInterval: ReturnType<typeof setInterval> | null = null;
	private isProcessing = false;

	/**
	 * Start monitoring for zaps and checking npub.cash balance
	 */
	start() {
		if (!npubCash.enabled) {
			return;
		}

		if (!ndk.$currentUser) {
			logger.warn('No active user, cannot start monitoring');
			return;
		}


		// Subscribe to zap events for the current user
		this.zapSubscription = ndk.subscribe(
			{
				kinds: [ZAP_KIND],
				'#p': [ndk.$currentUser.pubkey],
			},
			{ closeOnEose: false }
		);

		// When a zap is received, check for tokens
		this.zapSubscription.on('event', () => {
			this.checkAndClaim();
		});

		// Also check periodically
		this.checkInterval = setInterval(() => {
			this.checkAndClaim();
		}, CHECK_INTERVAL);

		// Initial check
		this.checkAndClaim();
	}

	/**
	 * Stop monitoring
	 */
	stop() {
		if (this.zapSubscription) {
			this.zapSubscription.stop();
			this.zapSubscription = null;
		}

		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}

	}

	/**
	 * Check npub.cash balance and claim tokens if available
	 */
	private async checkAndClaim() {
		if (!npubCash.enabled) {
			return;
		}

		if (this.isProcessing) {
			return;
		}

		// Don't claim tokens if there's no NIP-60 wallet to redeem them to
		// (NWC wallets don't support receiveToken)
		if (!walletStore.isNip60 || !walletStore.wallet) {
			logger.warn('No NIP-60 wallet available, skipping token claim');
			return;
		}

		this.isProcessing = true;

		try {
			const token = await npubCash.claimTokens();

			if (token) {
				await this.redeemToWallet(token);
			}
		} catch (e) {
			logger.error('Error checking/claiming tokens:', e);
		} finally {
			this.isProcessing = false;
		}
	}

	/**
	 * Redeem a Cashu token to the user's NIP-60 wallet
	 */
	private async redeemToWallet(token: string) {
		if (!walletStore.isNip60 || !walletStore.wallet || !('receiveToken' in walletStore.wallet)) {
			logger.warn('No NIP-60 wallet available, cannot redeem token');
			return;
		}

		try {
			await walletStore.wallet.receiveToken(token);
		} catch (e) {
			logger.error('Failed to redeem token to wallet:', e);
		}
	}
}

export const npubCashMonitor = new NpubCashMonitor();
