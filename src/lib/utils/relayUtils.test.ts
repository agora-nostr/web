import { describe, it, expect } from 'vitest';
import {
  AGORA_RELAYS,
  WALLET_DEFAULT_RELAYS,
  AGORA_LANGUAGE_MAP,
  isAgoraRelay,
  getRelaysToUse,
  getAgoraLanguage,
  type SupportedLanguage,
} from './relayUtils';

describe('relayUtils constants', () => {
  describe('AGORA_RELAYS', () => {
    it('should contain expected agora relay URLs', () => {
      expect(AGORA_RELAYS).toContain('wss://ve.agorawlc.com/');
      expect(AGORA_RELAYS).toContain('wss://ni.agorawlc.com/');
      expect(AGORA_RELAYS).toContain('wss://zw.agorawlc.com/');
    });

    it('should have exactly 3 agora relays', () => {
      expect(AGORA_RELAYS).toHaveLength(3);
    });

    it('should all be wss:// URLs', () => {
      for (const relay of AGORA_RELAYS) {
        expect(relay).toMatch(/^wss:\/\//);
      }
    });

    it('should all end with trailing slash', () => {
      for (const relay of AGORA_RELAYS) {
        expect(relay).toMatch(/\/$/);
      }
    });
  });

  describe('WALLET_DEFAULT_RELAYS', () => {
    it('should contain expected wallet relay URLs', () => {
      expect(WALLET_DEFAULT_RELAYS).toContain('wss://relay.primal.net/');
      expect(WALLET_DEFAULT_RELAYS).toContain('wss://relay.nostr.band/');
    });

    it('should have exactly 2 wallet relays', () => {
      expect(WALLET_DEFAULT_RELAYS).toHaveLength(2);
    });
  });

  describe('AGORA_LANGUAGE_MAP', () => {
    it('should map Venezuela relay to Spanish', () => {
      expect(AGORA_LANGUAGE_MAP['wss://ve.agorawlc.com/']).toBe('es');
    });

    it('should map Nicaragua relay to Spanish', () => {
      expect(AGORA_LANGUAGE_MAP['wss://ni.agorawlc.com/']).toBe('es');
    });

    it('should map Zimbabwe relay to English', () => {
      expect(AGORA_LANGUAGE_MAP['wss://zw.agorawlc.com/']).toBe('en');
    });

    it('should have mappings for all AGORA_RELAYS', () => {
      for (const relay of AGORA_RELAYS) {
        expect(AGORA_LANGUAGE_MAP[relay]).toBeDefined();
      }
    });
  });
});

describe('isAgoraRelay', () => {
  describe('valid agora relays', () => {
    it('should return true for Venezuela relay', () => {
      expect(isAgoraRelay('wss://ve.agorawlc.com/')).toBe(true);
    });

    it('should return true for Nicaragua relay', () => {
      expect(isAgoraRelay('wss://ni.agorawlc.com/')).toBe(true);
    });

    it('should return true for Zimbabwe relay', () => {
      expect(isAgoraRelay('wss://zw.agorawlc.com/')).toBe(true);
    });

    it('should return true for agora relay without trailing slash', () => {
      expect(isAgoraRelay('wss://ve.agorawlc.com')).toBe(true);
    });

    it('should return true for agora relay with path', () => {
      expect(isAgoraRelay('wss://ve.agorawlc.com/nostr')).toBe(true);
    });
  });

  describe('non-agora relays', () => {
    it('should return false for primal relay', () => {
      expect(isAgoraRelay('wss://relay.primal.net/')).toBe(false);
    });

    it('should return false for nostr.band relay', () => {
      expect(isAgoraRelay('wss://relay.nostr.band/')).toBe(false);
    });

    it('should return false for damus relay', () => {
      expect(isAgoraRelay('wss://relay.damus.io/')).toBe(false);
    });

    it('should return false for random URL', () => {
      expect(isAgoraRelay('wss://example.com/')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for null', () => {
      expect(isAgoraRelay(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isAgoraRelay(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isAgoraRelay('')).toBe(false);
    });

    it('should handle partial domain match attempts', () => {
      // Should match because it contains 'agorawlc.com'
      expect(isAgoraRelay('wss://fake.agorawlc.com.evil.com/')).toBe(true);
    });
  });
});

describe('getRelaysToUse', () => {
  const enabledRelays = [
    'wss://relay.primal.net/',
    'wss://relay.nostr.band/',
    'wss://relay.damus.io/',
  ];

  describe('with selected relay', () => {
    it('should return only the selected relay', () => {
      const result = getRelaysToUse('wss://ve.agorawlc.com/', enabledRelays);
      expect(result).toEqual(['wss://ve.agorawlc.com/']);
    });

    it('should return selected relay even if not in enabled list', () => {
      const result = getRelaysToUse('wss://custom.relay.com/', enabledRelays);
      expect(result).toEqual(['wss://custom.relay.com/']);
    });

    it('should ignore enabled relays when relay is selected', () => {
      const result = getRelaysToUse('wss://ve.agorawlc.com/', enabledRelays);
      expect(result).not.toContain('wss://relay.primal.net/');
      expect(result).toHaveLength(1);
    });
  });

  describe('without selected relay (Following mode)', () => {
    it('should return empty array for null selectedRelay', () => {
      const result = getRelaysToUse(null, enabledRelays);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined selectedRelay', () => {
      const result = getRelaysToUse(undefined, enabledRelays);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string selectedRelay', () => {
      const result = getRelaysToUse('', enabledRelays);
      expect(result).toEqual([]);
    });
  });

  describe('with empty enabled relays', () => {
    it('should still work with empty enabled relays array', () => {
      const result = getRelaysToUse('wss://ve.agorawlc.com/', []);
      expect(result).toEqual(['wss://ve.agorawlc.com/']);
    });

    it('should return empty array in Following mode with no enabled relays', () => {
      const result = getRelaysToUse(null, []);
      expect(result).toEqual([]);
    });
  });
});

describe('getAgoraLanguage', () => {
  describe('mapped relays', () => {
    it('should return "es" for Venezuela relay', () => {
      expect(getAgoraLanguage('wss://ve.agorawlc.com/')).toBe('es');
    });

    it('should return "es" for Nicaragua relay', () => {
      expect(getAgoraLanguage('wss://ni.agorawlc.com/')).toBe('es');
    });

    it('should return "en" for Zimbabwe relay', () => {
      expect(getAgoraLanguage('wss://zw.agorawlc.com/')).toBe('en');
    });
  });

  describe('unmapped relays', () => {
    it('should return null for non-agora relay', () => {
      expect(getAgoraLanguage('wss://relay.primal.net/')).toBeNull();
    });

    it('should return null for relay without trailing slash', () => {
      // Only exact matches work due to object key lookup
      expect(getAgoraLanguage('wss://ve.agorawlc.com')).toBeNull();
    });

    it('should return null for unknown agora-like URL', () => {
      expect(getAgoraLanguage('wss://unknown.agorawlc.com/')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return null for null', () => {
      expect(getAgoraLanguage(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(getAgoraLanguage(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getAgoraLanguage('')).toBeNull();
    });
  });

  describe('type safety', () => {
    it('should return a valid SupportedLanguage type', () => {
      const result = getAgoraLanguage('wss://ve.agorawlc.com/');
      const validLanguages: SupportedLanguage[] = ['en', 'es', 'fa', 'km', 'sn'];
      expect(result).not.toBeNull();
      expect(validLanguages).toContain(result);
    });
  });
});

