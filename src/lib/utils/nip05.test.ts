import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractDomainFromRelay, checkNip05Availability, formatNip05 } from './nip05';

describe('extractDomainFromRelay', () => {
  describe('valid relay URLs', () => {
    it('should extract domain from wss:// URL', () => {
      expect(extractDomainFromRelay('wss://relay.example.com')).toBe('relay.example.com');
    });

    it('should extract domain from ws:// URL', () => {
      expect(extractDomainFromRelay('ws://relay.example.com')).toBe('relay.example.com');
    });

    it('should extract domain with subdomain', () => {
      expect(extractDomainFromRelay('wss://ve.agorawlc.com')).toBe('ve.agorawlc.com');
    });

    it('should extract domain from URL with port', () => {
      expect(extractDomainFromRelay('ws://test.agorawlc.com:3335')).toBe('test.agorawlc.com');
    });

    it('should extract domain from localhost', () => {
      expect(extractDomainFromRelay('ws://localhost:3334')).toBe('localhost');
    });

    it('should extract domain from URL with path', () => {
      expect(extractDomainFromRelay('wss://relay.example.com/nostr')).toBe('relay.example.com');
    });
  });

  describe('invalid URLs', () => {
    it('should return empty string for invalid URL', () => {
      expect(extractDomainFromRelay('not-a-url')).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(extractDomainFromRelay('')).toBe('');
    });

    it('should return empty string for malformed URL', () => {
      expect(extractDomainFromRelay('://missing-protocol')).toBe('');
    });
  });
});

describe('formatNip05', () => {
  it('should format username and domain into NIP-05 identifier', () => {
    expect(formatNip05('alice', 'example.com')).toBe('alice@example.com');
  });

  it('should handle subdomains', () => {
    expect(formatNip05('bob', 've.agorawlc.com')).toBe('bob@ve.agorawlc.com');
  });

  it('should handle special characters in username', () => {
    expect(formatNip05('user_name-123', 'example.com')).toBe('user_name-123@example.com');
  });

  it('should handle empty username', () => {
    expect(formatNip05('', 'example.com')).toBe('@example.com');
  });

  it('should handle empty domain', () => {
    expect(formatNip05('alice', '')).toBe('alice@');
  });
});

describe('checkNip05Availability', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('input validation', () => {
    it('should return error for empty username', async () => {
      const result = await checkNip05Availability('', 'example.com');
      expect(result.available).toBe(false);
      expect(result.error).toBe('Username and domain are required');
    });

    it('should return error for empty domain', async () => {
      const result = await checkNip05Availability('alice', '');
      expect(result.available).toBe(false);
      expect(result.error).toBe('Username and domain are required');
    });

    it('should return error for invalid username characters', async () => {
      const result = await checkNip05Availability('alice@bob', 'example.com');
      expect(result.available).toBe(false);
      expect(result.error).toBe('Username can only contain letters, numbers, underscore, and hyphen');
    });

    it('should return error for username with spaces', async () => {
      const result = await checkNip05Availability('alice bob', 'example.com');
      expect(result.available).toBe(false);
      expect(result.error).toContain('can only contain');
    });

    it('should accept valid username characters', async () => {
      // Mock fetch for this test
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await checkNip05Availability('alice_bob-123', 'example.com');
      expect(result.error).not.toBe('Username can only contain letters, numbers, underscore, and hyphen');
    });
  });

  describe('NIP-05 lookup', () => {
    it('should return available=true when 404 response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await checkNip05Availability('newuser', 'example.com');
      expect(result.available).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return available=false when username exists', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ names: { existinguser: 'somepubkey' } }),
      } as Response);

      const result = await checkNip05Availability('existinguser', 'example.com');
      expect(result.available).toBe(false);
      expect(result.error).toBe('Username is already taken');
    });

    it('should return available=true when username not in response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ names: { otheruser: 'somepubkey' } }),
      } as Response);

      const result = await checkNip05Availability('newuser', 'example.com');
      expect(result.available).toBe(true);
    });

    it('should use http for localhost domains', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await checkNip05Availability('alice', 'localhost');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost')
      );
    });

    it('should use http for test domains', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await checkNip05Availability('alice', 'test.example.com');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://test.example.com')
      );
    });

    it('should use https for production domains', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await checkNip05Availability('alice', 'example.com');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com')
      );
    });

    it('should return available=false for other error responses', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await checkNip05Availability('alice', 'example.com');
      expect(result.available).toBe(false);
      expect(result.error).toBe('Unable to check availability. Please try again.');
    });

    it('should return available=false on fetch error (fail closed)', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await checkNip05Availability('alice', 'example.com');
      // Fail closed: don't allow claiming usernames we couldn't verify
      expect(result.available).toBe(false);
      expect(result.error).toBe('Could not verify availability. Please try again.');
    });
  });
});

