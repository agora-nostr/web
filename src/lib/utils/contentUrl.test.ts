import { describe, it, expect } from 'vitest';
import { getContentUrl } from './contentUrl';

// Mock the EncodableContent interface
interface MockEncodableContent {
  encode: () => string;
  pubkey: string;
  tagValue: (tag: string) => string | undefined;
}

function createMockContent(overrides: Partial<MockEncodableContent> = {}): MockEncodableContent {
  return {
    encode: () => 'naddr1abc123xyz',
    pubkey: 'abc123pubkey',
    tagValue: () => undefined,
    ...overrides,
  };
}

describe('getContentUrl', () => {
  describe('basic URL generation', () => {
    it('should generate URL with default prefix "item"', () => {
      const content = createMockContent({ encode: () => 'naddr1test123' });
      const result = getContentUrl(content);
      expect(result).toBe('/item/naddr1test123');
    });

    it('should generate URL with custom prefix', () => {
      const content = createMockContent({ encode: () => 'naddr1test123' });
      const result = getContentUrl(content, undefined, 'article');
      expect(result).toBe('/article/naddr1test123');
    });

    it('should use the encoded value from content', () => {
      const content = createMockContent({ encode: () => 'nevent1xyz789' });
      const result = getContentUrl(content);
      expect(result).toBe('/item/nevent1xyz789');
    });
  });

  describe('different prefix types', () => {
    it('should work with "article" prefix', () => {
      const content = createMockContent({ encode: () => 'naddr1article' });
      const result = getContentUrl(content, undefined, 'article');
      expect(result).toBe('/article/naddr1article');
    });

    it('should work with "pack" prefix', () => {
      const content = createMockContent({ encode: () => 'naddr1pack' });
      const result = getContentUrl(content, undefined, 'pack');
      expect(result).toBe('/pack/naddr1pack');
    });

    it('should work with "event" prefix', () => {
      const content = createMockContent({ encode: () => 'nevent1event' });
      const result = getContentUrl(content, undefined, 'event');
      expect(result).toBe('/event/nevent1event');
    });

    it('should work with custom prefix', () => {
      const content = createMockContent({ encode: () => 'naddr1custom' });
      const result = getContentUrl(content, undefined, 'my-custom-type');
      expect(result).toBe('/my-custom-type/naddr1custom');
    });
  });

  describe('author parameter', () => {
    it('should accept author but not use it in current implementation', () => {
      const content = createMockContent({ encode: () => 'naddr1test' });
      const mockAuthor = { npub: 'npub1author' } as any;

      // Current implementation doesn't use author, but should accept it
      const result = getContentUrl(content, mockAuthor, 'article');
      expect(result).toBe('/article/naddr1test');
    });

    it('should work with undefined author', () => {
      const content = createMockContent({ encode: () => 'naddr1test' });
      const result = getContentUrl(content, undefined, 'article');
      expect(result).toBe('/article/naddr1test');
    });
  });

  describe('edge cases', () => {
    it('should handle empty encoded string', () => {
      const content = createMockContent({ encode: () => '' });
      const result = getContentUrl(content);
      expect(result).toBe('/item/');
    });

    it('should handle encoded string with special characters', () => {
      const content = createMockContent({ encode: () => 'naddr1abc-def_123' });
      const result = getContentUrl(content);
      expect(result).toBe('/item/naddr1abc-def_123');
    });

    it('should handle very long encoded strings', () => {
      const longEncoded = 'naddr1' + 'a'.repeat(500);
      const content = createMockContent({ encode: () => longEncoded });
      const result = getContentUrl(content);
      expect(result).toBe(`/item/${longEncoded}`);
    });

    it('should handle empty prefix', () => {
      const content = createMockContent({ encode: () => 'naddr1test' });
      const result = getContentUrl(content, undefined, '');
      expect(result).toBe('//naddr1test');
    });
  });
});

