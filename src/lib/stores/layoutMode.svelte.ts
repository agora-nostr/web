import { layoutStore } from './layout.svelte';

/**
 * Store to control layout behavior for different content types
 */
class LayoutModeStore {
  private _mode = $state<'default' | 'article' | 'profile' | 'reads'>('default');

  get mode() {
    return this._mode;
  }

  setArticleMode() {
    this._mode = 'article';
    layoutStore.collapseSidebar();
    layoutStore.setRightSidebarVisibility(false);
  }

  setProfileMode() {
    this._mode = 'profile';
    layoutStore.setRightSidebarVisibility(false);
  }

  setReadsMode() {
    this._mode = 'reads';
    layoutStore.setRightSidebarVisibility(false);
  }

  setDefaultMode() {
    this._mode = 'default';
    layoutStore.expandSidebar();
    layoutStore.setRightSidebarVisibility(true);
  }

  reset() {
    this._mode = 'default';
    layoutStore.expandSidebar();
    layoutStore.setRightSidebarVisibility(true);
  }
}

export const layoutMode = new LayoutModeStore();
