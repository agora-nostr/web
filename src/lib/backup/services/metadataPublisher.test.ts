import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PublishedShard } from './shardPublisher';
import type { BackupMetadata } from './metadataBuilder';
import { BackupError, BackupErrorCode } from '../errors';

// Create mock implementations
const mockSign = vi.fn();
const mockPublish = vi.fn();
const mockEncrypt = vi.fn();
const mockDecrypt = vi.fn();

// Mock NDK module with proper class constructors
vi.mock('@nostr-dev-kit/ndk', () => {
  return {
    default: vi.fn(),
    NDKUser: class MockNDKUser {
      pubkey: string;
      constructor({ pubkey }: { pubkey: string }) {
        this.pubkey = pubkey;
      }
    },
    NDKEvent: class MockNDKEvent {
      kind = 0;
      created_at = 0;
      content = '';
      tags: string[][] = [];
      id = 'mock-event-id';
      ndk: unknown;

      constructor(ndk: unknown) {
        this.ndk = ndk;
      }

      async sign() {
        return mockSign();
      }

      async publish() {
        return mockPublish();
      }
    },
    NDKPrivateKeySigner: class MockNDKPrivateKeySigner {
      privateKey: string;

      constructor(privateKey: string) {
        this.privateKey = privateKey;
      }

      async encrypt(_user: unknown, payload: string) {
        return mockEncrypt(_user, payload);
      }

      async decrypt(_user: unknown, content: string) {
        return mockDecrypt(_user, content);
      }

      async user() {
        return { pubkey: 'signer-pubkey' };
      }
    },
    NDKKind: { ClientAuth: 22242 },
  };
});

// Import after mocking
import {
  publishBackupMetadata,
  fetchBackupMetadata,
  checkShardHealth,
} from './metadataPublisher';
import type NDK from '@nostr-dev-kit/ndk';

describe('metadataPublisher', () => {
  const mockUserPubkey = 'user-pubkey-123';
  const mockPrivateKey = 'private-key-hex';

  const createMockPublishedShard = (index: number): PublishedShard => ({
    eventId: `event-${index}`,
    recipientPubkey: `pubkey-${index}`,
    relays: [`wss://relay${index}.example.com`],
    shardIndex: index,
    publishedAt: 1700000000 + index * 86400,
    disposableKey: `disposable-${index}`,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSign.mockResolvedValue(undefined);
    mockPublish.mockResolvedValue(undefined);
    mockEncrypt.mockResolvedValue('encrypted-content');
    mockDecrypt.mockResolvedValue('{}');
  });

  describe('publishBackupMetadata', () => {
    it('should throw NO_USER error when no active user', async () => {
      const mockNdk = {
        activeUser: null,
      } as unknown as NDK;

      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      await expect(publishBackupMetadata(mockNdk, shards, 2, mockPrivateKey)).rejects.toThrow(
        BackupError
      );

      try {
        await publishBackupMetadata(mockNdk, shards, 2, mockPrivateKey);
      } catch (error) {
        expect(error).toBeInstanceOf(BackupError);
        expect((error as BackupError).code).toBe(BackupErrorCode.NO_USER);
      }
    });

    it('should throw NO_USER error when activeUser has no pubkey', async () => {
      const mockNdk = {
        activeUser: { pubkey: undefined },
      } as unknown as NDK;

      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      await expect(publishBackupMetadata(mockNdk, shards, 2, mockPrivateKey)).rejects.toThrow(
        BackupError
      );
    });

    it('should call sign and publish on the event', async () => {
      const mockNdk = {
        activeUser: { pubkey: mockUserPubkey },
      } as unknown as NDK;

      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      const result = await publishBackupMetadata(mockNdk, shards, 2, mockPrivateKey);

      expect(result).toBe('mock-event-id');
      expect(mockSign).toHaveBeenCalled();
      expect(mockPublish).toHaveBeenCalled();
    });

    it('should call encrypt with metadata payload', async () => {
      const mockNdk = {
        activeUser: { pubkey: mockUserPubkey },
      } as unknown as NDK;

      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      await publishBackupMetadata(mockNdk, shards, 2, mockPrivateKey);

      expect(mockEncrypt).toHaveBeenCalled();
      // Verify the payload contains expected metadata
      const [_user, payload] = mockEncrypt.mock.calls[0];
      const metadata = JSON.parse(payload) as BackupMetadata;
      expect(metadata.threshold).toBe(2);
      expect(metadata.totalShards).toBe(2);
    });

    it('should build correct metadata from shards', async () => {
      const mockNdk = {
        activeUser: { pubkey: mockUserPubkey },
      } as unknown as NDK;

      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      await publishBackupMetadata(mockNdk, shards, 2, mockPrivateKey);

      const [_user, payload] = mockEncrypt.mock.calls[0];
      const metadata = JSON.parse(payload) as BackupMetadata;

      expect(metadata.threshold).toBe(2);
      expect(metadata.totalShards).toBe(2);
      expect(metadata.trustees).toHaveLength(2);
      expect(metadata.shardEvents).toHaveLength(2);
    });
  });

  describe('fetchBackupMetadata', () => {
    it('should return null when no active user', async () => {
      const mockNdk = {
        activeUser: null,
      } as unknown as NDK;

      const result = await fetchBackupMetadata(mockNdk, mockPrivateKey);

      expect(result).toBeNull();
    });

    it('should return null when activeUser has no pubkey', async () => {
      const mockNdk = {
        activeUser: { pubkey: undefined },
      } as unknown as NDK;

      const result = await fetchBackupMetadata(mockNdk, mockPrivateKey);

      expect(result).toBeNull();
    });

    it('should return null when no events found', async () => {
      const mockNdk = {
        activeUser: { pubkey: mockUserPubkey },
        fetchEvents: vi.fn().mockResolvedValue(new Set()),
      } as unknown as NDK;

      const result = await fetchBackupMetadata(mockNdk, mockPrivateKey);

      expect(result).toBeNull();
    });

    it('should fetch events with correct filter', async () => {
      const mockFetchEvents = vi.fn().mockResolvedValue(new Set());

      const mockNdk = {
        activeUser: { pubkey: mockUserPubkey },
        fetchEvents: mockFetchEvents,
      } as unknown as NDK;

      await fetchBackupMetadata(mockNdk, mockPrivateKey);

      expect(mockFetchEvents).toHaveBeenCalledWith({
        kinds: [1115],
        authors: [mockUserPubkey],
        '#d': ['key-backup'],
      });
    });

    it('should select most recent event when multiple exist', async () => {
      const olderEvent = {
        created_at: 1000,
        content: 'older-content',
      };
      const newerEvent = {
        created_at: 2000,
        content: 'newer-content',
      };

      mockDecrypt.mockResolvedValue(
        JSON.stringify({
          version: 1,
          createdAt: 2000,
          threshold: 2,
          totalShards: 3,
          trustees: [],
          shardEvents: [],
        })
      );

      const mockNdk = {
        activeUser: { pubkey: mockUserPubkey },
        fetchEvents: vi.fn().mockResolvedValue(new Set([olderEvent, newerEvent])),
      } as unknown as NDK;

      await fetchBackupMetadata(mockNdk, mockPrivateKey);

      // Should decrypt the newer event's content
      expect(mockDecrypt).toHaveBeenCalledWith(expect.anything(), 'newer-content');
    });

    it('should decrypt and parse metadata', async () => {
      const mockMetadata: BackupMetadata = {
        version: 1,
        createdAt: 1700000000,
        threshold: 2,
        totalShards: 3,
        trustees: [{ pubkey: 'pk1', shardIndex: 1 }],
        shardEvents: [
          {
            eventId: 'e1',
            recipientPubkey: 'pk1',
            relays: ['wss://relay.example.com'],
            shardIndex: 1,
            publishedAt: 1700000000,
          },
        ],
      };

      mockDecrypt.mockResolvedValue(JSON.stringify(mockMetadata));

      const mockEvent = {
        created_at: 1700000000,
        content: 'encrypted-content',
      };

      const mockNdk = {
        activeUser: { pubkey: mockUserPubkey },
        fetchEvents: vi.fn().mockResolvedValue(new Set([mockEvent])),
      } as unknown as NDK;

      const result = await fetchBackupMetadata(mockNdk, mockPrivateKey);

      expect(result).toEqual(mockMetadata);
    });
  });

  describe('checkShardHealth', () => {
    it('should return health status for each shard', async () => {
      const mockFetchEvents = vi.fn().mockResolvedValue(new Set(['event']));

      const mockNdk = {
        fetchEvents: mockFetchEvents,
      } as unknown as NDK;

      const metadata: BackupMetadata = {
        version: 1,
        createdAt: 1700000000,
        threshold: 2,
        totalShards: 2,
        trustees: [
          { pubkey: 'pk1', shardIndex: 1 },
          { pubkey: 'pk2', shardIndex: 2 },
        ],
        shardEvents: [
          {
            eventId: 'event-1',
            recipientPubkey: 'pk1',
            relays: ['wss://relay1.example.com'],
            shardIndex: 1,
            publishedAt: 1700000000,
          },
          {
            eventId: 'event-2',
            recipientPubkey: 'pk2',
            relays: ['wss://relay2.example.com'],
            shardIndex: 2,
            publishedAt: 1700000000,
          },
        ],
      };

      const results = await checkShardHealth(mockNdk, metadata);

      expect(results).toHaveLength(2);
      expect(results[0].shardIndex).toBe(1);
      expect(results[1].shardIndex).toBe(2);
    });

    it('should mark shard as healthy when event found', async () => {
      const mockFetchEvents = vi.fn().mockResolvedValue(new Set(['found-event']));

      const mockNdk = {
        fetchEvents: mockFetchEvents,
      } as unknown as NDK;

      const metadata: BackupMetadata = {
        version: 1,
        createdAt: 1700000000,
        threshold: 1,
        totalShards: 1,
        trustees: [{ pubkey: 'pk1', shardIndex: 1 }],
        shardEvents: [
          {
            eventId: 'event-1',
            recipientPubkey: 'pk1',
            relays: ['wss://relay1.example.com'],
            shardIndex: 1,
            publishedAt: 1700000000,
          },
        ],
      };

      const results = await checkShardHealth(mockNdk, metadata);

      expect(results[0].healthy).toBe(true);
      expect(results[0].relays).toContain('wss://relay1.example.com');
    });

    it('should mark shard as unhealthy when event not found', async () => {
      const mockFetchEvents = vi.fn().mockResolvedValue(new Set());

      const mockNdk = {
        fetchEvents: mockFetchEvents,
      } as unknown as NDK;

      const metadata: BackupMetadata = {
        version: 1,
        createdAt: 1700000000,
        threshold: 1,
        totalShards: 1,
        trustees: [{ pubkey: 'pk1', shardIndex: 1 }],
        shardEvents: [
          {
            eventId: 'event-1',
            recipientPubkey: 'pk1',
            relays: ['wss://relay1.example.com'],
            shardIndex: 1,
            publishedAt: 1700000000,
          },
        ],
      };

      const results = await checkShardHealth(mockNdk, metadata);

      expect(results[0].healthy).toBe(false);
      expect(results[0].relays).toHaveLength(0);
    });

    it('should handle fetch errors gracefully', async () => {
      const mockFetchEvents = vi.fn().mockRejectedValue(new Error('Network error'));

      const mockNdk = {
        fetchEvents: mockFetchEvents,
      } as unknown as NDK;

      const metadata: BackupMetadata = {
        version: 1,
        createdAt: 1700000000,
        threshold: 1,
        totalShards: 1,
        trustees: [{ pubkey: 'pk1', shardIndex: 1 }],
        shardEvents: [
          {
            eventId: 'event-1',
            recipientPubkey: 'pk1',
            relays: ['wss://relay1.example.com'],
            shardIndex: 1,
            publishedAt: 1700000000,
          },
        ],
      };

      const results = await checkShardHealth(mockNdk, metadata);

      // Should not throw, just mark as unhealthy
      expect(results[0].healthy).toBe(false);
    });

    it('should check all relays for each shard', async () => {
      const mockFetchEvents = vi.fn().mockResolvedValue(new Set(['event']));

      const mockNdk = {
        fetchEvents: mockFetchEvents,
      } as unknown as NDK;

      const metadata: BackupMetadata = {
        version: 1,
        createdAt: 1700000000,
        threshold: 1,
        totalShards: 1,
        trustees: [{ pubkey: 'pk1', shardIndex: 1 }],
        shardEvents: [
          {
            eventId: 'event-1',
            recipientPubkey: 'pk1',
            relays: ['wss://relay1.example.com', 'wss://relay2.example.com', 'wss://relay3.example.com'],
            shardIndex: 1,
            publishedAt: 1700000000,
          },
        ],
      };

      const results = await checkShardHealth(mockNdk, metadata);

      // Should have checked all relays
      expect(mockFetchEvents).toHaveBeenCalledTimes(3);
      expect(results[0].relays).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('should wrap encryption errors with BackupErrorCode.ENCRYPTION_FAILED', async () => {
      mockEncrypt.mockRejectedValue(new Error('Encryption failed'));

      const mockNdk = {
        activeUser: { pubkey: mockUserPubkey },
      } as unknown as NDK;

      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      try {
        await publishBackupMetadata(mockNdk, shards, 2, mockPrivateKey);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BackupError);
        expect((error as BackupError).code).toBe(BackupErrorCode.ENCRYPTION_FAILED);
      }
    });

    it('should wrap signing errors with BackupErrorCode.METADATA_PUBLISHING_FAILED', async () => {
      mockSign.mockRejectedValue(new Error('Signing failed'));

      const mockNdk = {
        activeUser: { pubkey: mockUserPubkey },
      } as unknown as NDK;

      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      try {
        await publishBackupMetadata(mockNdk, shards, 2, mockPrivateKey);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BackupError);
        expect((error as BackupError).code).toBe(BackupErrorCode.METADATA_PUBLISHING_FAILED);
      }
    });

    it('should wrap publishing errors with BackupErrorCode.METADATA_PUBLISHING_FAILED', async () => {
      mockPublish.mockRejectedValue(new Error('Publishing failed'));

      const mockNdk = {
        activeUser: { pubkey: mockUserPubkey },
      } as unknown as NDK;

      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      try {
        await publishBackupMetadata(mockNdk, shards, 2, mockPrivateKey);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BackupError);
        expect((error as BackupError).code).toBe(BackupErrorCode.METADATA_PUBLISHING_FAILED);
      }
    });
  });
});
