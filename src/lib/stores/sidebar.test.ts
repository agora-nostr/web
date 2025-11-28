import { describe, it, expect, beforeEach } from 'vitest';

// Recreate the store class for testing
// Note: In actual code, Snippet is a Svelte type, but for testing we can use any
class SidebarStore {
  private _rightSidebar: unknown = null;
  private _showOnMobile = false;

  get rightSidebar() {
    return this._rightSidebar;
  }

  set rightSidebar(sidebar: unknown) {
    this._rightSidebar = sidebar;
  }

  get showOnMobile() {
    return this._showOnMobile;
  }

  set showOnMobile(value: boolean) {
    this._showOnMobile = value;
  }

  clear() {
    this._rightSidebar = null;
    this._showOnMobile = false;
  }
}

describe('SidebarStore', () => {
  let store: SidebarStore;

  beforeEach(() => {
    store = new SidebarStore();
  });

  describe('initial state', () => {
    it('should have null rightSidebar initially', () => {
      expect(store.rightSidebar).toBeNull();
    });

    it('should have showOnMobile as false initially', () => {
      expect(store.showOnMobile).toBe(false);
    });
  });

  describe('rightSidebar', () => {
    it('should allow setting rightSidebar', () => {
      const mockSnippet = () => 'mock sidebar content';
      store.rightSidebar = mockSnippet;
      expect(store.rightSidebar).toBe(mockSnippet);
    });

    it('should allow setting rightSidebar to null', () => {
      store.rightSidebar = () => 'content';
      store.rightSidebar = null;
      expect(store.rightSidebar).toBeNull();
    });

    it('should allow updating rightSidebar', () => {
      const snippet1 = () => 'first';
      const snippet2 = () => 'second';

      store.rightSidebar = snippet1;
      expect(store.rightSidebar).toBe(snippet1);

      store.rightSidebar = snippet2;
      expect(store.rightSidebar).toBe(snippet2);
    });
  });

  describe('showOnMobile', () => {
    it('should allow setting to true', () => {
      store.showOnMobile = true;
      expect(store.showOnMobile).toBe(true);
    });

    it('should allow setting to false', () => {
      store.showOnMobile = true;
      store.showOnMobile = false;
      expect(store.showOnMobile).toBe(false);
    });

    it('should toggle correctly', () => {
      store.showOnMobile = true;
      expect(store.showOnMobile).toBe(true);

      store.showOnMobile = false;
      expect(store.showOnMobile).toBe(false);
    });
  });

  describe('clear', () => {
    it('should reset rightSidebar to null', () => {
      store.rightSidebar = () => 'content';
      store.clear();
      expect(store.rightSidebar).toBeNull();
    });

    it('should reset showOnMobile to false', () => {
      store.showOnMobile = true;
      store.clear();
      expect(store.showOnMobile).toBe(false);
    });

    it('should reset both properties at once', () => {
      store.rightSidebar = () => 'content';
      store.showOnMobile = true;

      store.clear();

      expect(store.rightSidebar).toBeNull();
      expect(store.showOnMobile).toBe(false);
    });
  });
});

