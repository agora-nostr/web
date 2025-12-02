import { describe, it, expect, beforeEach } from 'vitest';

// Recreate the interfaces and class for testing
interface BackNavigation {
  label?: string;
  href?: string;
  onclick?: () => void;
}

interface HeaderConfig {
  title: string;
  subtitle?: string;
  actions?: unknown;
  backNav?: BackNavigation;
}

class HeaderStore {
  private _header: unknown = null;
  private _headerConfig: HeaderConfig | null = null;
  private _backNav: BackNavigation | null = null;

  get header() {
    return this._header;
  }

  set header(header: unknown) {
    this._header = header;
    this._headerConfig = null; // Clear config when using snippet
  }

  get headerConfig() {
    return this._headerConfig;
  }

  set headerConfig(config: HeaderConfig | null) {
    this._headerConfig = config;
    this._header = null; // Clear snippet when using config
  }

  get backNav() {
    return this._backNav;
  }

  set backNav(backNav: BackNavigation | null) {
    this._backNav = backNav;
  }

  clear() {
    this._header = null;
    this._headerConfig = null;
    this._backNav = null;
  }
}

describe('HeaderStore', () => {
  let store: HeaderStore;

  beforeEach(() => {
    store = new HeaderStore();
  });

  describe('initial state', () => {
    it('should have null header initially', () => {
      expect(store.header).toBeNull();
    });

    it('should have null headerConfig initially', () => {
      expect(store.headerConfig).toBeNull();
    });

    it('should have null backNav initially', () => {
      expect(store.backNav).toBeNull();
    });
  });

  describe('header (snippet mode)', () => {
    it('should allow setting header snippet', () => {
      const mockSnippet = () => 'header content';
      store.header = mockSnippet;
      expect(store.header).toBe(mockSnippet);
    });

    it('should clear headerConfig when setting header', () => {
      store.headerConfig = { title: 'Test' };
      store.header = () => 'snippet';

      expect(store.header).not.toBeNull();
      expect(store.headerConfig).toBeNull();
    });
  });

  describe('headerConfig (config mode)', () => {
    it('should allow setting headerConfig', () => {
      const config: HeaderConfig = { title: 'Page Title' };
      store.headerConfig = config;
      expect(store.headerConfig).toEqual(config);
    });

    it('should clear header snippet when setting config', () => {
      store.header = () => 'snippet';
      store.headerConfig = { title: 'Test' };

      expect(store.headerConfig).not.toBeNull();
      expect(store.header).toBeNull();
    });

    it('should handle config with all properties', () => {
      const config: HeaderConfig = {
        title: 'Main Title',
        subtitle: 'Subtitle text',
        actions: () => 'actions',
        backNav: { label: 'Back', href: '/' },
      };

      store.headerConfig = config;
      expect(store.headerConfig?.title).toBe('Main Title');
      expect(store.headerConfig?.subtitle).toBe('Subtitle text');
      expect(store.headerConfig?.backNav?.label).toBe('Back');
    });

    it('should allow setting to null', () => {
      store.headerConfig = { title: 'Test' };
      store.headerConfig = null;
      expect(store.headerConfig).toBeNull();
    });
  });

  describe('backNav', () => {
    it('should allow setting backNav', () => {
      const backNav: BackNavigation = { label: 'Back', href: '/home' };
      store.backNav = backNav;
      expect(store.backNav).toEqual(backNav);
    });

    it('should handle backNav with onclick', () => {
      const mockOnclick = vi.fn();
      store.backNav = { onclick: mockOnclick };
      expect(store.backNav?.onclick).toBe(mockOnclick);
    });

    it('should allow setting to null', () => {
      store.backNav = { label: 'Back' };
      store.backNav = null;
      expect(store.backNav).toBeNull();
    });

    it('should be independent of header/headerConfig', () => {
      store.backNav = { label: 'Back' };
      store.header = () => 'snippet';

      expect(store.backNav).not.toBeNull();
      expect(store.backNav?.label).toBe('Back');
    });
  });

  describe('clear', () => {
    it('should clear all properties', () => {
      store.header = () => 'snippet';
      store.backNav = { label: 'Back' };

      store.clear();

      expect(store.header).toBeNull();
      expect(store.headerConfig).toBeNull();
      expect(store.backNav).toBeNull();
    });

    it('should work when properties are already null', () => {
      store.clear();

      expect(store.header).toBeNull();
      expect(store.headerConfig).toBeNull();
      expect(store.backNav).toBeNull();
    });
  });

  describe('mutual exclusivity of header and headerConfig', () => {
    it('should only have one active at a time', () => {
      store.header = () => 'snippet';
      expect(store.header).not.toBeNull();
      expect(store.headerConfig).toBeNull();

      store.headerConfig = { title: 'Config' };
      expect(store.header).toBeNull();
      expect(store.headerConfig).not.toBeNull();

      store.header = () => 'another snippet';
      expect(store.header).not.toBeNull();
      expect(store.headerConfig).toBeNull();
    });
  });
});

// Need to import vi for the mock
import { vi } from 'vitest';

