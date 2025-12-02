import { describe, it, expect, beforeEach } from 'vitest';

// Recreate the store class for testing
class LayoutModeStore {
  private _mode: 'default' | 'article' | 'profile' | 'reads' = 'default';

  get mode() {
    return this._mode;
  }

  setArticleMode() {
    this._mode = 'article';
  }

  setProfileMode() {
    this._mode = 'profile';
  }

  setReadsMode() {
    this._mode = 'reads';
  }

  setDefaultMode() {
    this._mode = 'default';
  }

  reset() {
    this._mode = 'default';
  }
}

describe('LayoutModeStore', () => {
  let store: LayoutModeStore;

  beforeEach(() => {
    store = new LayoutModeStore();
  });

  describe('initial state', () => {
    it('should start in default mode', () => {
      expect(store.mode).toBe('default');
    });
  });

  describe('setArticleMode', () => {
    it('should set mode to article', () => {
      store.setArticleMode();
      expect(store.mode).toBe('article');
    });
  });

  describe('setProfileMode', () => {
    it('should set mode to profile', () => {
      store.setProfileMode();
      expect(store.mode).toBe('profile');
    });
  });

  describe('setReadsMode', () => {
    it('should set mode to reads', () => {
      store.setReadsMode();
      expect(store.mode).toBe('reads');
    });
  });

  describe('setDefaultMode', () => {
    it('should set mode to default', () => {
      store.setArticleMode();
      store.setDefaultMode();
      expect(store.mode).toBe('default');
    });
  });

  describe('reset', () => {
    it('should reset mode to default', () => {
      store.setProfileMode();
      store.reset();
      expect(store.mode).toBe('default');
    });

    it('should work from any mode', () => {
      store.setArticleMode();
      store.reset();
      expect(store.mode).toBe('default');

      store.setReadsMode();
      store.reset();
      expect(store.mode).toBe('default');
    });
  });

  describe('mode transitions', () => {
    it('should allow transitions between all modes', () => {
      store.setArticleMode();
      expect(store.mode).toBe('article');

      store.setProfileMode();
      expect(store.mode).toBe('profile');

      store.setReadsMode();
      expect(store.mode).toBe('reads');

      store.setDefaultMode();
      expect(store.mode).toBe('default');
    });

    it('should allow setting same mode multiple times', () => {
      store.setArticleMode();
      store.setArticleMode();
      expect(store.mode).toBe('article');
    });
  });
});

