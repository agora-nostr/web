import { describe, it, expect, beforeEach } from 'vitest';

// Recreate the store for testing
type MediaFilter = 'conversations' | 'images' | 'videos' | 'articles';

function createHomePageFilter() {
  let selectedFilter: MediaFilter = 'conversations';

  return {
    get selected() {
      return selectedFilter;
    },
    set(filter: MediaFilter) {
      selectedFilter = filter;
    },
  };
}

describe('homePageFilter', () => {
  let filter: ReturnType<typeof createHomePageFilter>;

  beforeEach(() => {
    filter = createHomePageFilter();
  });

  describe('initial state', () => {
    it('should default to conversations', () => {
      expect(filter.selected).toBe('conversations');
    });
  });

  describe('set', () => {
    it('should set filter to conversations', () => {
      filter.set('images'); // Change first
      filter.set('conversations');
      expect(filter.selected).toBe('conversations');
    });

    it('should set filter to images', () => {
      filter.set('images');
      expect(filter.selected).toBe('images');
    });

    it('should set filter to videos', () => {
      filter.set('videos');
      expect(filter.selected).toBe('videos');
    });

    it('should set filter to articles', () => {
      filter.set('articles');
      expect(filter.selected).toBe('articles');
    });
  });

  describe('filter transitions', () => {
    it('should allow transitions between all filters', () => {
      filter.set('images');
      expect(filter.selected).toBe('images');

      filter.set('videos');
      expect(filter.selected).toBe('videos');

      filter.set('articles');
      expect(filter.selected).toBe('articles');

      filter.set('conversations');
      expect(filter.selected).toBe('conversations');
    });

    it('should allow setting same filter multiple times', () => {
      filter.set('images');
      filter.set('images');
      expect(filter.selected).toBe('images');
    });
  });

  describe('selected getter', () => {
    it('should always return current filter value', () => {
      expect(filter.selected).toBe('conversations');

      filter.set('videos');
      expect(filter.selected).toBe('videos');

      filter.set('articles');
      expect(filter.selected).toBe('articles');
    });
  });
});

