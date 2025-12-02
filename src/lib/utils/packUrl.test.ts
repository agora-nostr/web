import { describe, it, expect } from 'vitest';
import { getPackUrl } from './packUrl';

// Create a mock pack that satisfies the NDKFollowPack interface requirements
function createMockPack(overrides: Record<string, any> = {}) {
  return {
    encode: () => 'naddr1mockpack',
    pubkey: 'mockpubkey123',
    tagValue: (tag: string) => undefined,
    ...overrides,
  };
}

describe('getPackUrl', () => {
  describe('basic functionality', () => {
    it('should return URL with packs prefix', () => {
      const pack = createMockPack();
      const result = getPackUrl(pack as any);

      expect(result).toBe('/packs/naddr1mockpack');
    });

    it('should use the encoded value from pack', () => {
      const pack = createMockPack({ encode: () => 'naddr1custompack123' });
      const result = getPackUrl(pack as any);

      expect(result).toBe('/packs/naddr1custompack123');
    });
  });

  describe('with different pack encodings', () => {
    it('should handle naddr encoded packs', () => {
      const pack = createMockPack({ encode: () => 'naddr1qvzqqqr4gupvp3k8' });
      const result = getPackUrl(pack as any);

      expect(result).toBe('/packs/naddr1qvzqqqr4gupvp3k8');
    });

    it('should handle packs with long encoding', () => {
      const longEncoded = 'naddr1' + 'x'.repeat(100);
      const pack = createMockPack({ encode: () => longEncoded });
      const result = getPackUrl(pack as any);

      expect(result).toBe(`/packs/${longEncoded}`);
    });

    it('should handle packs with alphanumeric encoding', () => {
      const pack = createMockPack({ encode: () => 'naddr1abc123XYZ789' });
      const result = getPackUrl(pack as any);

      expect(result).toBe('/packs/naddr1abc123XYZ789');
    });
  });

  describe('edge cases', () => {
    it('should handle empty encoded string', () => {
      const pack = createMockPack({ encode: () => '' });
      const result = getPackUrl(pack as any);

      expect(result).toBe('/packs/');
    });

    it('should not modify the encoded value', () => {
      const encodedValue = 'naddr1qqxnzdesxqmnxvpexqunsvfkxserxdpsxvenvwfhxymnrda5kuetvyphkumn99e3k7mgpz4mhxue69uhk2er9dchxummnw3ezumrpdejqz8thwden5te0dehhxarj9e3xjarrda5kuetjvyhxxmmd9updnr';
      const pack = createMockPack({ encode: () => encodedValue });
      const result = getPackUrl(pack as any);

      expect(result).toBe(`/packs/${encodedValue}`);
    });
  });

  describe('URL format', () => {
    it('should start with forward slash', () => {
      const pack = createMockPack();
      const result = getPackUrl(pack as any);

      expect(result).toMatch(/^\//);
    });

    it('should use "packs" as the route prefix', () => {
      const pack = createMockPack();
      const result = getPackUrl(pack as any);

      expect(result).toMatch(/^\/packs\//);
    });

    it('should not have double slashes', () => {
      const pack = createMockPack({ encode: () => 'naddr1test' });
      const result = getPackUrl(pack as any);

      expect(result).not.toMatch(/\/\//);
    });
  });
});

