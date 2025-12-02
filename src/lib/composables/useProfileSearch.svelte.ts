import { ndk } from '$lib/ndk.svelte';

interface UseProfileSearchOptions {
	searchQuery: () => string;
	availablePubkeys: () => string[];
	limit?: number;
}

export function useProfileSearch(options: UseProfileSearchOptions) {
	const { searchQuery, availablePubkeys, limit = 50 } = options;

	let cachedResults = $state<Set<string>>(new Set());

	const filteredPubkeys = $derived.by(() => {
		const query = searchQuery().trim();
		const pubkeys = availablePubkeys();

		if (!query) return pubkeys.slice(0, limit);

		// Filter based on cached search results
		const filtered = pubkeys.filter(pubkey => cachedResults.has(pubkey));
		return filtered.slice(0, limit);
	});

	// Update cached search results when query changes
	$effect(() => {
		const query = searchQuery().trim();

		if (!query) {
			cachedResults = new Set();
			return;
		}

		if (!ndk.cacheAdapter?.getProfiles) {
			console.error('[useProfileSearch] No getProfiles method available on cache adapter');
			cachedResults = new Set();
			return;
		}


		// Use cache adapter to search profiles
		ndk.cacheAdapter.getProfiles({
			fields: ['name', 'displayName', 'nip05'],
			contains: query
		}).then((profiles) => {
			cachedResults = new Set(profiles?.keys() || []);
		}).catch(err => {
			console.error('[useProfileSearch] Failed to search profiles:', err);
			cachedResults = new Set();
		});
	});

	return {
		get filteredPubkeys() {
			return filteredPubkeys;
		}
	};
}