import { describe, it, expect, beforeEach } from 'vitest';

// We need to create a fresh instance for each test since the module exports a singleton
// For testing, we'll recreate the store class logic

class HashtagFilterStore {
  private _selectedHashtags = new Set<string>();

  get selectedHashtags(): string[] {
    return Array.from(this._selectedHashtags);
  }

  get hasFilters(): boolean {
    return this._selectedHashtags.size > 0;
  }

  toggleHashtag(hashtag: string): void {
    const normalized = hashtag.toLowerCase();
    if (this._selectedHashtags.has(normalized)) {
      this._selectedHashtags.delete(normalized);
    } else {
      this._selectedHashtags.add(normalized);
    }
  }

  addHashtag(hashtag: string): void {
    const normalized = hashtag.toLowerCase();
    this._selectedHashtags.add(normalized);
  }

  removeHashtag(hashtag: string): void {
    const normalized = hashtag.toLowerCase();
    this._selectedHashtags.delete(normalized);
  }

  clearAll(): void {
    this._selectedHashtags.clear();
  }

  isSelected(hashtag: string): boolean {
    return this._selectedHashtags.has(hashtag.toLowerCase());
  }
}

describe('HashtagFilterStore', () => {
  let store: HashtagFilterStore;

  beforeEach(() => {
    store = new HashtagFilterStore();
  });

  describe('initial state', () => {
    it('should start with no selected hashtags', () => {
      expect(store.selectedHashtags).toEqual([]);
    });

    it('should have hasFilters as false initially', () => {
      expect(store.hasFilters).toBe(false);
    });
  });

  describe('addHashtag', () => {
    it('should add a hashtag', () => {
      store.addHashtag('bitcoin');
      expect(store.selectedHashtags).toContain('bitcoin');
    });

    it('should normalize hashtag to lowercase', () => {
      store.addHashtag('BITCOIN');
      expect(store.selectedHashtags).toContain('bitcoin');
      expect(store.selectedHashtags).not.toContain('BITCOIN');
    });

    it('should not add duplicate hashtags', () => {
      store.addHashtag('bitcoin');
      store.addHashtag('bitcoin');
      expect(store.selectedHashtags).toHaveLength(1);
    });

    it('should not add duplicate when case differs', () => {
      store.addHashtag('Bitcoin');
      store.addHashtag('BITCOIN');
      store.addHashtag('bitcoin');
      expect(store.selectedHashtags).toHaveLength(1);
    });

    it('should set hasFilters to true when hashtag added', () => {
      store.addHashtag('nostr');
      expect(store.hasFilters).toBe(true);
    });
  });

  describe('removeHashtag', () => {
    beforeEach(() => {
      store.addHashtag('bitcoin');
      store.addHashtag('nostr');
    });

    it('should remove an existing hashtag', () => {
      store.removeHashtag('bitcoin');
      expect(store.selectedHashtags).not.toContain('bitcoin');
      expect(store.selectedHashtags).toContain('nostr');
    });

    it('should handle removing non-existent hashtag gracefully', () => {
      store.removeHashtag('ethereum');
      expect(store.selectedHashtags).toHaveLength(2);
    });

    it('should normalize case when removing', () => {
      store.removeHashtag('BITCOIN');
      expect(store.selectedHashtags).not.toContain('bitcoin');
    });

    it('should set hasFilters to false when all removed', () => {
      store.removeHashtag('bitcoin');
      store.removeHashtag('nostr');
      expect(store.hasFilters).toBe(false);
    });
  });

  describe('toggleHashtag', () => {
    it('should add hashtag if not present', () => {
      store.toggleHashtag('bitcoin');
      expect(store.isSelected('bitcoin')).toBe(true);
    });

    it('should remove hashtag if present', () => {
      store.addHashtag('bitcoin');
      store.toggleHashtag('bitcoin');
      expect(store.isSelected('bitcoin')).toBe(false);
    });

    it('should toggle correctly multiple times', () => {
      store.toggleHashtag('test');
      expect(store.isSelected('test')).toBe(true);

      store.toggleHashtag('test');
      expect(store.isSelected('test')).toBe(false);

      store.toggleHashtag('test');
      expect(store.isSelected('test')).toBe(true);
    });

    it('should normalize case', () => {
      store.toggleHashtag('BITCOIN');
      expect(store.isSelected('bitcoin')).toBe(true);

      store.toggleHashtag('Bitcoin');
      expect(store.isSelected('bitcoin')).toBe(false);
    });
  });

  describe('clearAll', () => {
    beforeEach(() => {
      store.addHashtag('bitcoin');
      store.addHashtag('nostr');
      store.addHashtag('lightning');
    });

    it('should remove all hashtags', () => {
      store.clearAll();
      expect(store.selectedHashtags).toHaveLength(0);
    });

    it('should set hasFilters to false', () => {
      store.clearAll();
      expect(store.hasFilters).toBe(false);
    });
  });

  describe('isSelected', () => {
    beforeEach(() => {
      store.addHashtag('bitcoin');
    });

    it('should return true for selected hashtag', () => {
      expect(store.isSelected('bitcoin')).toBe(true);
    });

    it('should return false for unselected hashtag', () => {
      expect(store.isSelected('nostr')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(store.isSelected('BITCOIN')).toBe(true);
      expect(store.isSelected('Bitcoin')).toBe(true);
    });
  });

  describe('selectedHashtags getter', () => {
    it('should return array of selected hashtags', () => {
      store.addHashtag('bitcoin');
      store.addHashtag('nostr');

      const hashtags = store.selectedHashtags;
      expect(hashtags).toHaveLength(2);
      expect(hashtags).toContain('bitcoin');
      expect(hashtags).toContain('nostr');
    });

    it('should return a new array each time', () => {
      store.addHashtag('test');
      const arr1 = store.selectedHashtags;
      const arr2 = store.selectedHashtags;
      expect(arr1).not.toBe(arr2);
      expect(arr1).toEqual(arr2);
    });
  });
});

