import type { Snippet } from 'svelte';

class HeaderStore {
  private _header = $state<Snippet | null>(null);

  get header() {
    return this._header;
  }

  set header(header: Snippet | null) {
    this._header = header;
  }

  clear() {
    this._header = null;
  }
}

export const headerStore = new HeaderStore();
