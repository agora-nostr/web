import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EncryptedShard } from '../utils/shamir';
import {
  storeShardLocally,
  getPendingShards,
  type ShardPublishConfig,
  type PublishedShard,
} from './shardPublisher';

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Apply localStorage mock
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('shardPublisher', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('storeShardLocally', () => {
    const createMockShard = (index: number): EncryptedShard => ({
      index,
      encryptedData: `encrypted-data-${index}`,
      totalShards: 3,
      threshold: 2,
    });

    it('should store a shard in localStorage', () => {
      const shard = createMockShard(1);
      const recipientPubkey = 'abc123';
      const relays = ['wss://relay1.example.com'];

      storeShardLocally(shard, recipientPubkey, relays);

      const stored = localStorageMock.getItem('pending_shards');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].shard.index).toBe(1);
      expect(parsed[0].recipientPubkey).toBe('abc123');
      expect(parsed[0].relays).toEqual(['wss://relay1.example.com']);
      expect(parsed[0].storedAt).toBeDefined();
    });

    it('should append multiple shards', () => {
      const shard1 = createMockShard(1);
      const shard2 = createMockShard(2);

      storeShardLocally(shard1, 'pubkey1', ['wss://relay1.example.com']);
      storeShardLocally(shard2, 'pubkey2', ['wss://relay2.example.com']);

      const stored = localStorageMock.getItem('pending_shards');
      const parsed = JSON.parse(stored!);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].shard.index).toBe(1);
      expect(parsed[1].shard.index).toBe(2);
    });

    it('should preserve shard metadata', () => {
      const shard = createMockShard(1);
      storeShardLocally(shard, 'pubkey', ['wss://relay.example.com']);

      const stored = localStorageMock.getItem('pending_shards');
      const parsed = JSON.parse(stored!);

      expect(parsed[0].shard.threshold).toBe(2);
      expect(parsed[0].shard.totalShards).toBe(3);
      expect(parsed[0].shard.encryptedData).toBe('encrypted-data-1');
    });

    it('should store timestamp', () => {
      const before = Date.now();
      const shard = createMockShard(1);
      storeShardLocally(shard, 'pubkey', ['wss://relay.example.com']);
      const after = Date.now();

      const stored = localStorageMock.getItem('pending_shards');
      const parsed = JSON.parse(stored!);

      expect(parsed[0].storedAt).toBeGreaterThanOrEqual(before);
      expect(parsed[0].storedAt).toBeLessThanOrEqual(after);
    });

    it('should handle multiple relays', () => {
      const shard = createMockShard(1);
      const relays = [
        'wss://relay1.example.com',
        'wss://relay2.example.com',
        'wss://relay3.example.com',
      ];

      storeShardLocally(shard, 'pubkey', relays);

      const stored = localStorageMock.getItem('pending_shards');
      const parsed = JSON.parse(stored!);

      expect(parsed[0].relays).toEqual(relays);
    });
  });

  describe('getPendingShards', () => {
    const createMockShard = (index: number): EncryptedShard => ({
      index,
      encryptedData: `encrypted-data-${index}`,
      totalShards: 3,
      threshold: 2,
    });

    it('should return empty array when no shards stored', () => {
      const result = getPendingShards();
      expect(result).toEqual([]);
    });

    it('should return stored shards', () => {
      const shard = createMockShard(1);
      storeShardLocally(shard, 'pubkey', ['wss://relay.example.com']);

      const result = getPendingShards();

      expect(result).toHaveLength(1);
      expect(result[0].shard.index).toBe(1);
    });

    it('should clear storage after retrieval', () => {
      const shard = createMockShard(1);
      storeShardLocally(shard, 'pubkey', ['wss://relay.example.com']);

      getPendingShards();

      // Storage should be cleared
      const stored = localStorageMock.getItem('pending_shards');
      expect(stored).toBeNull();
    });

    it('should return all stored shards', () => {
      storeShardLocally(createMockShard(1), 'pubkey1', ['wss://relay1.example.com']);
      storeShardLocally(createMockShard(2), 'pubkey2', ['wss://relay2.example.com']);
      storeShardLocally(createMockShard(3), 'pubkey3', ['wss://relay3.example.com']);

      const result = getPendingShards();

      expect(result).toHaveLength(3);
    });

    it('should return shards with all properties intact', () => {
      const shard = createMockShard(1);
      const recipientPubkey = 'test-pubkey';
      const relays = ['wss://relay.example.com'];

      storeShardLocally(shard, recipientPubkey, relays);

      const result = getPendingShards();

      expect(result[0]).toMatchObject({
        shard: {
          index: 1,
          encryptedData: 'encrypted-data-1',
          totalShards: 3,
          threshold: 2,
        },
        recipientPubkey: 'test-pubkey',
        relays: ['wss://relay.example.com'],
      });
      expect(typeof result[0].storedAt).toBe('number');
    });
  });

  describe('ShardPublishConfig type', () => {
    it('should have correct structure', () => {
      const config: ShardPublishConfig = {
        shard: {
          index: 1,
          encryptedData: 'test',
          totalShards: 3,
          threshold: 2,
        },
        recipientPubkey: 'abc123',
        createdAtOffset: 7,
        relays: ['wss://relay.example.com'],
      };

      expect(config.shard.index).toBe(1);
      expect(config.recipientPubkey).toBe('abc123');
      expect(config.createdAtOffset).toBe(7);
      expect(config.relays).toHaveLength(1);
    });
  });

  describe('PublishedShard type', () => {
    it('should have correct structure', () => {
      const published: PublishedShard = {
        eventId: 'event123',
        recipientPubkey: 'pubkey123',
        relays: ['wss://relay.example.com'],
        shardIndex: 1,
        publishedAt: 1234567890,
        disposableKey: 'disposable123',
      };

      expect(published.eventId).toBe('event123');
      expect(published.recipientPubkey).toBe('pubkey123');
      expect(published.shardIndex).toBe(1);
      expect(published.publishedAt).toBe(1234567890);
      expect(published.disposableKey).toBe('disposable123');
    });
  });

  describe('edge cases', () => {
    it('should handle corrupted localStorage gracefully in getPendingShards', () => {
      localStorageMock.setItem('pending_shards', 'invalid json');

      // This will throw when parsing, which is expected behavior
      // The calling code should handle this
      expect(() => getPendingShards()).toThrow();
    });

    it('should handle empty relays array', () => {
      const shard: EncryptedShard = {
        index: 1,
        encryptedData: 'test',
        totalShards: 3,
        threshold: 2,
      };

      storeShardLocally(shard, 'pubkey', []);

      const result = getPendingShards();
      expect(result[0].relays).toEqual([]);
    });

    it('should handle very long encrypted data', () => {
      const shard: EncryptedShard = {
        index: 1,
        encryptedData: 'a'.repeat(10000),
        totalShards: 3,
        threshold: 2,
      };

      storeShardLocally(shard, 'pubkey', ['wss://relay.example.com']);

      const result = getPendingShards();
      expect(result[0].shard.encryptedData.length).toBe(10000);
    });
  });
});
