import { NDKEvent } from '@nostr-dev-kit/ndk';
import { ndk } from "$lib/ndk.svelte";
import { settings } from './settings.svelte';

const NIP98_KIND = 27235;
const NPUB_CASH_DOMAIN = 'npub.cash';
const NPUB_CASH_BASE_URL = `https://${NPUB_CASH_DOMAIN}`;

type NPCInfo = {
	mintUrl: string;
	npub: string;
	username: string;
	error?: string;
};

type NPCBalance = {
	error?: string;
	data: number;
};

type NPCClaim = {
	error?: string;
	data: {
		token: string;
	};
};

class NpubCashStore {
	enabled = $state(false);
	loading = $state(false);
	lastCheck = $state<number | null>(null);

	constructor() {
		// Load from settings
		this.enabled = settings.wallet.npubCashEnabled;
	}

	/**
	 * Get the npub.cash Lightning address for the current user
	 */
	getLightningAddress(): string {
		if (!ndk.$currentUser) {
			return "";
		}

		return `${ndk.$currentUser.npub}@${NPUB_CASH_DOMAIN}`;
	}

	/**
	 * Generate NIP-98 authentication event for HTTP requests
	 */
	private async generateNip98Event(url: string, method: string): Promise<string> {
		const event = new NDKEvent(ndk);
		event.kind = NIP98_KIND;
		event.tags = [
			['u', url],
			['method', method],
		];

		await event.sign();

		const eventString = JSON.stringify(event.rawEvent());
		return btoa(eventString);
	}

	/**
	 * Get account info from npub.cash
	 */
	private async getInfo(): Promise<NPCInfo> {
		const url = `${NPUB_CASH_BASE_URL}/api/v1/info`;
		const authHeader = await this.generateNip98Event(url, 'GET');

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: `Nostr ${authHeader}`,
			},
		});

		const info: NPCInfo = await response.json();
		return info;
	}

	/**
	 * Check balance on npub.cash
	 */
	async getBalance(): Promise<number> {
		if (!this.enabled) {
			return 0;
		}

		const url = `${NPUB_CASH_BASE_URL}/api/v1/balance`;

		try {
			const authHeader = await this.generateNip98Event(url, 'GET');
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Nostr ${authHeader}`,
				},
			});

			const balance: NPCBalance = await response.json();
			if (balance.error) {
				console.error('npub.cash balance error:', balance.error);
				return 0;
			}

			return balance.data;
		} catch (e) {
			console.error('Failed to get npub.cash balance:', e);
			return 0;
		}
	}

	/**
	 * Claim ecash token from npub.cash
	 */
	private async getClaim(): Promise<string> {
		const url = `${NPUB_CASH_BASE_URL}/api/v1/claim`;

		try {
			const authHeader = await this.generateNip98Event(url, 'GET');
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Nostr ${authHeader}`,
				},
			});

			const claim: NPCClaim = await response.json();
			if (claim.error) {
				console.error('npub.cash claim error:', claim.error);
				return '';
			}

			return claim.data.token;
		} catch (e) {
			console.error('Failed to claim from npub.cash:', e);
			return '';
		}
	}

	/**
	 * Check balance and claim any available tokens
	 */
	async claimTokens(): Promise<string | null> {
		if (!this.enabled) {
			return null;
		}

		try {
			const balance = await this.getBalance();

			if (balance > 0) {
				const token = await this.getClaim();
				if (token) {
					this.lastCheck = Date.now();
					return token;
				}
			}

			this.lastCheck = Date.now();
			return null;
		} catch (e) {
			console.error('Failed to claim tokens:', e);
			return null;
		}
	}

	/**
	 * Enable npub.cash integration
	 */
	setEnabled(enabled: boolean) {
		this.enabled = enabled;
		settings.wallet.npubCashEnabled = enabled;
		settings.save();
	}
}

export const npubCash = new NpubCashStore();
