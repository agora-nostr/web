import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MetadataBuilder, type BackupMetadata } from './metadataBuilder';
import type { PublishedShard } from './shardPublisher';

describe('MetadataBuilder', () => {
  // Mock Date.now for consistent timestamps
  const mockTimestamp = 1700000000000; // Nov 14, 2023

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockTimestamp);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockPublishedShard = (index: number): PublishedShard => ({
    eventId: `event-${index}`,
    recipientPubkey: `pubkey-${index}`,
    relays: [`wss://relay${index}.example.com`],
    shardIndex: index,
    publishedAt: mockTimestamp / 1000 + index * 86400, // offset by days
    disposableKey: `disposable-${index}`,
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const builder = new MetadataBuilder();

      // We can't directly access private properties, so we test through build validation
      expect(() => builder.build()).toThrow('Threshold must be greater than 0');
    });

    it('should set createdAt to current timestamp in seconds', () => {
      const builder = new MetadataBuilder()
        .withThreshold(2)
        .withPublishedShards([createMockPublishedShard(1), createMockPublishedShard(2)]);

      const metadata = builder.build();

      expect(metadata.createdAt).toBe(Math.floor(mockTimestamp / 1000));
    });
  });

  describe('withVersion', () => {
    it('should set custom version', () => {
      const builder = new MetadataBuilder()
        .withVersion(2)
        .withThreshold(2)
        .withPublishedShards([createMockPublishedShard(1), createMockPublishedShard(2)]);

      const metadata = builder.build();

      expect(metadata.version).toBe(2);
    });

    it('should default to version 1', () => {
      const builder = new MetadataBuilder()
        .withThreshold(2)
        .withPublishedShards([createMockPublishedShard(1), createMockPublishedShard(2)]);

      const metadata = builder.build();

      expect(metadata.version).toBe(1);
    });
  });

  describe('withCreatedAt', () => {
    it('should set custom timestamp', () => {
      const customTimestamp = 1600000000;
      const builder = new MetadataBuilder()
        .withCreatedAt(customTimestamp)
        .withThreshold(2)
        .withPublishedShards([createMockPublishedShard(1), createMockPublishedShard(2)]);

      const metadata = builder.build();

      expect(metadata.createdAt).toBe(customTimestamp);
    });
  });

  describe('withThreshold', () => {
    it('should set threshold', () => {
      const builder = new MetadataBuilder()
        .withThreshold(3)
        .withPublishedShards([
          createMockPublishedShard(1),
          createMockPublishedShard(2),
          createMockPublishedShard(3),
        ]);

      const metadata = builder.build();

      expect(metadata.threshold).toBe(3);
    });
  });

  describe('withPublishedShards', () => {
    it('should set published shards', () => {
      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      const builder = new MetadataBuilder().withThreshold(2).withPublishedShards(shards);

      const metadata = builder.build();

      expect(metadata.totalShards).toBe(2);
    });

    it('should overwrite previous shards', () => {
      const shards1 = [createMockPublishedShard(1)];
      const shards2 = [createMockPublishedShard(2), createMockPublishedShard(3)];

      const builder = new MetadataBuilder()
        .withThreshold(2)
        .withPublishedShards(shards1)
        .withPublishedShards(shards2);

      const metadata = builder.build();

      expect(metadata.totalShards).toBe(2);
      expect(metadata.trustees[0].pubkey).toBe('pubkey-2');
    });
  });

  describe('build', () => {
    it('should create complete metadata object', () => {
      const shards = [
        createMockPublishedShard(1),
        createMockPublishedShard(2),
        createMockPublishedShard(3),
      ];

      const metadata = new MetadataBuilder()
        .withVersion(1)
        .withThreshold(2)
        .withPublishedShards(shards)
        .build();

      expect(metadata).toMatchObject({
        version: 1,
        threshold: 2,
        totalShards: 3,
      });
    });

    it('should map trustees correctly', () => {
      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      const metadata = new MetadataBuilder().withThreshold(2).withPublishedShards(shards).build();

      expect(metadata.trustees).toHaveLength(2);
      expect(metadata.trustees[0]).toEqual({
        pubkey: 'pubkey-1',
        shardIndex: 1,
      });
      expect(metadata.trustees[1]).toEqual({
        pubkey: 'pubkey-2',
        shardIndex: 2,
      });
    });

    it('should map shardEvents correctly', () => {
      const shards = [createMockPublishedShard(1), createMockPublishedShard(2)];

      const metadata = new MetadataBuilder().withThreshold(2).withPublishedShards(shards).build();

      expect(metadata.shardEvents).toHaveLength(2);
      expect(metadata.shardEvents[0]).toEqual({
        eventId: 'event-1',
        recipientPubkey: 'pubkey-1',
        relays: ['wss://relay1.example.com'],
        shardIndex: 1,
        publishedAt: mockTimestamp / 1000 + 86400,
      });
    });

    it('should support method chaining', () => {
      const result = new MetadataBuilder()
        .withVersion(2)
        .withCreatedAt(1234567890)
        .withThreshold(2)
        .withPublishedShards([createMockPublishedShard(1), createMockPublishedShard(2)]);

      expect(result).toBeInstanceOf(MetadataBuilder);
    });
  });

  describe('validation', () => {
    it('should throw if threshold is 0', () => {
      const builder = new MetadataBuilder()
        .withThreshold(0)
        .withPublishedShards([createMockPublishedShard(1)]);

      expect(() => builder.build()).toThrow('Threshold must be greater than 0');
    });

    it('should throw if threshold is negative', () => {
      const builder = new MetadataBuilder()
        .withThreshold(-1)
        .withPublishedShards([createMockPublishedShard(1)]);

      expect(() => builder.build()).toThrow('Threshold must be greater than 0');
    });

    it('should throw if no shards provided', () => {
      const builder = new MetadataBuilder().withThreshold(2).withPublishedShards([]);

      expect(() => builder.build()).toThrow('At least one shard must be published');
    });

    it('should throw if threshold exceeds shard count', () => {
      const builder = new MetadataBuilder()
        .withThreshold(3)
        .withPublishedShards([createMockPublishedShard(1), createMockPublishedShard(2)]);

      expect(() => builder.build()).toThrow('Threshold cannot exceed number of published shards');
    });

    it('should pass validation when threshold equals shard count', () => {
      const builder = new MetadataBuilder()
        .withThreshold(2)
        .withPublishedShards([createMockPublishedShard(1), createMockPublishedShard(2)]);

      expect(() => builder.build()).not.toThrow();
    });
  });

  describe('toJSON', () => {
    it('should return valid JSON string', () => {
      const builder = new MetadataBuilder()
        .withThreshold(2)
        .withPublishedShards([createMockPublishedShard(1), createMockPublishedShard(2)]);

      const json = builder.toJSON();

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should return equivalent data as build()', () => {
      const builder = new MetadataBuilder()
        .withThreshold(2)
        .withPublishedShards([createMockPublishedShard(1), createMockPublishedShard(2)]);

      const json = builder.toJSON();
      const built = builder.build();

      expect(JSON.parse(json)).toEqual(built);
    });

    it('should throw validation errors', () => {
      const builder = new MetadataBuilder();

      expect(() => builder.toJSON()).toThrow();
    });
  });

  describe('BackupMetadata type', () => {
    it('should have correct structure', () => {
      const metadata: BackupMetadata = {
        version: 1,
        createdAt: 1234567890,
        threshold: 2,
        totalShards: 3,
        trustees: [
          { pubkey: 'pk1', shardIndex: 1 },
          { pubkey: 'pk2', shardIndex: 2 },
          { pubkey: 'pk3', shardIndex: 3 },
        ],
        shardEvents: [
          {
            eventId: 'e1',
            recipientPubkey: 'pk1',
            relays: ['wss://relay.example.com'],
            shardIndex: 1,
            publishedAt: 1234567890,
          },
        ],
      };

      expect(metadata.version).toBe(1);
      expect(metadata.trustees).toHaveLength(3);
      expect(metadata.shardEvents).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should handle shards with multiple relays', () => {
      const shard: PublishedShard = {
        ...createMockPublishedShard(1),
        relays: ['wss://relay1.example.com', 'wss://relay2.example.com', 'wss://relay3.example.com'],
      };

      const metadata = new MetadataBuilder()
        .withThreshold(1)
        .withPublishedShards([shard])
        .build();

      expect(metadata.shardEvents[0].relays).toHaveLength(3);
    });

    it('should handle maximum threshold (5)', () => {
      const shards = [1, 2, 3, 4, 5].map(createMockPublishedShard);

      const metadata = new MetadataBuilder().withThreshold(5).withPublishedShards(shards).build();

      expect(metadata.threshold).toBe(5);
      expect(metadata.totalShards).toBe(5);
    });

    it('should preserve shard order', () => {
      const shards = [createMockPublishedShard(3), createMockPublishedShard(1), createMockPublishedShard(2)];

      const metadata = new MetadataBuilder().withThreshold(2).withPublishedShards(shards).build();

      expect(metadata.trustees[0].shardIndex).toBe(3);
      expect(metadata.trustees[1].shardIndex).toBe(1);
      expect(metadata.trustees[2].shardIndex).toBe(2);
    });
  });
});
