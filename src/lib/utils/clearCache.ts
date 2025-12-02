/**
 * Utility to clear the SQLite WASM cache from IndexedDB
 * Useful when cache becomes corrupted
 */

export async function clearCacheDatabase(dbName: string = 'voces-cache'): Promise<void> {
  if (!('indexedDB' in window)) {
    console.warn('IndexedDB not available');
    return;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error(`Failed to delete cache database: ${dbName}`, request.error);
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn(`Delete database blocked for: ${dbName}. Close all tabs and try again.`);
    };
  });
}

/**
 * Check if we should auto-clear cache based on version mismatch
 */
export function shouldClearCache(): boolean {
  const CACHE_VERSION = '1';
  const stored = localStorage.getItem('cache-version');

  if (stored !== CACHE_VERSION) {
    localStorage.setItem('cache-version', CACHE_VERSION);
    return stored !== null; // Clear if there was a previous version
  }

  return false;
}

/**
 * Initialize cache with auto-clear on version mismatch
 */
export async function initializeCache(dbName: string = 'voces-cache'): Promise<void> {
  if (shouldClearCache()) {
    try {
      await clearCacheDatabase(dbName);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}
