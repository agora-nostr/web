/**
 * Centralized layout state management
 * Handles sidebar collapse, visibility, and responsive behavior
 */
class LayoutStore {
  // Sidebar collapse state
  sidebarCollapsed = $state(false);

  // Right sidebar visibility
  rightSidebarVisible = $state(true);

  // Mobile sidebar visibility (for responsive behavior)
  mobileSidebarOpen = $state(false);

  constructor() {
    // Load saved collapse preference from localStorage
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        this.sidebarCollapsed = savedState === 'true';
      }
    }
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.persistCollapseState();
  }

  /**
   * Collapse the sidebar
   */
  collapseSidebar() {
    if (!this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
      this.persistCollapseState();
    }
  }

  /**
   * Expand the sidebar
   */
  expandSidebar() {
    if (this.sidebarCollapsed) {
      this.sidebarCollapsed = false;
      this.persistCollapseState();
    }
  }

  /**
   * Set right sidebar visibility
   */
  setRightSidebarVisibility(visible: boolean) {
    this.rightSidebarVisible = visible;
  }

  /**
   * Toggle mobile sidebar
   */
  toggleMobileSidebar() {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  /**
   * Close mobile sidebar
   */
  closeMobileSidebar() {
    this.mobileSidebarOpen = false;
  }

  /**
   * Reset to default layout
   */
  reset() {
    this.expandSidebar();
    this.setRightSidebarVisibility(true);
    this.closeMobileSidebar();
  }

  /**
   * Persist collapse state to localStorage
   */
  private persistCollapseState() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed));
    }
  }
}

export const layoutStore = new LayoutStore();