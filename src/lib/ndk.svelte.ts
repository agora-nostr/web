import NDKCacheBrowser from "@nostr-dev-kit/cache-browser";
import { createNDK } from '@nostr-dev-kit/svelte';
import { LocalStorage } from '@nostr-dev-kit/sessions';
import { NDKEvent, NDKKind, NDKBlossomList, NDKInterestList, NDKRelayFeedList } from '@nostr-dev-kit/ndk';
// import { browser } from '$app/environment';
import { createAuthPolicyWithConfirmation } from './relayAuthPolicy.svelte';
import { createHashtagInterestsStore } from './stores/hashtagInterests.svelte';
import { createRelayFeedsStore } from './stores/relayFeeds.svelte';
import { CACHE_WORKER_VERSION } from './worker-version';

const browser = true;

const DEFAULT_RELAYS = [
  'wss://relay.primal.net',
  'wss://relay.nostr.band',
];

// Initialize browser-optimized cache with automatic WASM/IndexedDB fallback
const cacheAdapter = browser ? new NDKCacheBrowser({
  dbName: "agora",
  workerUrl: `/worker-${CACHE_WORKER_VERSION}.js`,
  wasmUrl: "/sql-wasm.wasm",
  debug: import.meta.env.DEV
}) : undefined;

// Initialize signature verification worker (only in browser)
let sigVerifyWorker: Worker | undefined;

export const ndk = createNDK({
  explicitRelayUrls: DEFAULT_RELAYS,
  autoConnectUserRelays: true,
  cacheAdapter,
  signatureVerificationWorker: sigVerifyWorker,
  initialValidationRatio: 1.0,
  lowestValidationRatio: 0.1,
  aiGuardrails: false,
  futureTimestampGrace: 30,
  clientName: 'Agora',
  session: browser ? {
    storage: new LocalStorage(),
    autoSave: true,
    fetches: {
      follows: true,
      mutes: true,
      wallet: true,
      relayList: true,
      monitor: [NDKBlossomList, NDKInterestList, NDKRelayFeedList],
    }
  } : undefined
})

// Initialize cache with NDK instance
export const cacheInitialized = cacheAdapter?.initializeAsync(ndk);

// Set the relay authentication policy (browser only)
if (browser) {
  ndk.relayAuthDefaultPolicy = createAuthPolicyWithConfirmation({ ndk });
}

// Initialize the cache and connect
export const ndkReady = (async () => {
  if (!browser) return;

  try {
    // Wait for cache to be initialized
    await cacheInitialized;

    // Initialize worker
    const SigVerifyWorker = (await import('./sig-verify.worker.ts?worker')).default;
    sigVerifyWorker = new SigVerifyWorker();
    ndk.signatureVerificationWorker = sigVerifyWorker;

    ndk.connect();
  } catch (error) {
    console.error("❌ Failed to initialize cache:", error);
  }
})();

// Create hashtag interests store (only in browser)
export const hashtagInterests = browser ? createHashtagInterestsStore(ndk) : null;

// Create relay feeds store (only in browser)
export const relayFeeds = browser ? createRelayFeedsStore(ndk) : null;

// Re-export auth management utilities
export {
  clearAuthDecisions,
  removeAuthDecision,
  getAuthDecisions
} from './relayAuthPolicy.svelte';

// Export cache adapter for debugging/monitoring
export { cacheAdapter };

export default ndk;
