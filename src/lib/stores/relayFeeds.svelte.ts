import { NDKRelayFeedList } from '@nostr-dev-kit/ndk';
import type { NDKSvelte } from '@nostr-dev-kit/svelte';

class RelayFeedsStore {
  constructor(private ndk: NDKSvelte) {}

  get list(): NDKRelayFeedList | null {
    const relayFeedEvent = this.ndk.$sessions?.getSessionEvent(10012);
    if (!relayFeedEvent) return null;

    return relayFeedEvent as NDKRelayFeedList;
  }

  get relays(): string[] {
    if (!this.list) return [];

    const relays: string[] = [];

    for (const tag of this.list.tags) {
      if (tag[0] === 'relay' && tag[1]) {
        relays.push(tag[1]);
      }
    }

    return relays;
  }

  get relaySets(): string[] {
    if (!this.list) return [];

    const sets: string[] = [];

    for (const tag of this.list.tags) {
      if (tag[0] === 'a' && tag[1]) {
        sets.push(tag[1]);
      }
    }

    return sets;
  }

  isFavorite(relayUrl: string): boolean {
    return this.relays.includes(relayUrl);
  }

  async addRelay(relayUrl: string): Promise<void> {
    let list = this.list;

    if (!list) {
      list = new NDKRelayFeedList(this.ndk);
    }

    if (this.isFavorite(relayUrl)) return;

    list.tags.push(['relay', relayUrl]);

    await list.publish();
  }

  async removeRelay(relayUrl: string): Promise<void> {
    const list = this.list;
    if (!list) return;

    list.tags = list.tags.filter(tag => {
      if (tag[0] === 'relay' && tag[1] === relayUrl) return false;
      return true;
    });

    await list.publish();
  }

  async addRelaySet(relaySetNaddr: string): Promise<void> {
    let list = this.list;

    if (!list) {
      list = new NDKRelayFeedList(this.ndk);
    }

    const existing = this.relaySets.includes(relaySetNaddr);
    if (existing) return;

    list.tags.push(['a', relaySetNaddr]);

    await list.publish();
  }

  async removeRelaySet(relaySetNaddr: string): Promise<void> {
    const list = this.list;
    if (!list) return;

    list.tags = list.tags.filter(tag => {
      if (tag[0] === 'a' && tag[1] === relaySetNaddr) return false;
      return true;
    });

    await list.publish();
  }
}

export function createRelayFeedsStore(ndk: NDKSvelte) {
  return new RelayFeedsStore(ndk);
}
