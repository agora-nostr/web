/**
 * Validates an NWC (Nostr Wallet Connect) connection string.
 * Format: nostr+walletconnect://<pubkey>?relay=<url>&secret=<hex>
 */
export function isValidNWCString(str: string): boolean {
  if (!str) return false;

  try {
    const url = new URL(str);
    return (
      url.protocol === 'nostr+walletconnect:' &&
      url.searchParams.has('secret') &&
      url.searchParams.has('relay') &&
      (url.host !== '' || url.pathname.replace('//', '').length > 0)
    );
  } catch {
    return false;
  }
}

/**
 * Parses an NWC connection string into its components.
 */
export function parseNWCString(str: string) {
  const url = new URL(str);
  return {
    pubkey: url.host || url.pathname.replace('//', ''),
    relays: url.searchParams.getAll('relay'),
    secret: url.searchParams.get('secret'),
  };
}
