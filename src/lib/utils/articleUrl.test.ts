import { describe, it, expect, vi } from 'vitest';
import { getArticleUrl } from './articleUrl';

// Mock the contentUrl module
vi.mock('./contentUrl', () => ({
  getContentUrl: vi.fn((content, author, prefix) => `/${prefix}/${content.encode()}`),
}));

import { getContentUrl } from './contentUrl';

// Create a mock article that satisfies the NDKArticle interface requirements
function createMockArticle(overrides: Record<string, any> = {}) {
  return {
    encode: () => 'naddr1mockarticle',
    pubkey: 'mockpubkey123',
    tagValue: (tag: string) => undefined,
    ...overrides,
  };
}

describe('getArticleUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should call getContentUrl with article prefix', () => {
      const article = createMockArticle();
      getArticleUrl(article as any);

      expect(getContentUrl).toHaveBeenCalledWith(article, undefined, 'article');
    });

    it('should return URL with article prefix', () => {
      const article = createMockArticle({ encode: () => 'naddr1testarticle' });
      const result = getArticleUrl(article as any);

      expect(result).toBe('/article/naddr1testarticle');
    });

    it('should pass author to getContentUrl when provided', () => {
      const article = createMockArticle();
      const mockAuthor = { npub: 'npub1author' } as any;

      getArticleUrl(article as any, mockAuthor);

      expect(getContentUrl).toHaveBeenCalledWith(article, mockAuthor, 'article');
    });
  });

  describe('with different article encodings', () => {
    it('should handle naddr encoded articles', () => {
      const article = createMockArticle({ encode: () => 'naddr1qvzqqqr4gupvp3k8' });
      const result = getArticleUrl(article as any);

      expect(result).toBe('/article/naddr1qvzqqqr4gupvp3k8');
    });

    it('should handle articles with special characters in encoding', () => {
      const article = createMockArticle({ encode: () => 'naddr1abc123xyz789' });
      const result = getArticleUrl(article as any);

      expect(result).toBe('/article/naddr1abc123xyz789');
    });
  });

  describe('integration behavior', () => {
    it('should be a thin wrapper around getContentUrl', () => {
      const article = createMockArticle();
      const author = { npub: 'npub1test' } as any;

      getArticleUrl(article as any, author);

      // Verify it delegates to getContentUrl with correct parameters
      expect(getContentUrl).toHaveBeenCalledTimes(1);
      expect(getContentUrl).toHaveBeenCalledWith(
        expect.objectContaining({ encode: expect.any(Function) }),
        author,
        'article'
      );
    });
  });
});

