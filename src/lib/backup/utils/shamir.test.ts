import { describe, it, expect } from 'vitest';
import {
  createEncryptedShards,
  reconstructSecret,
  SHARD_CONSTANTS,
  type ShardConfig,
} from './shamir';
import { BackupError, BackupErrorCode } from '../errors';

// These tests run in Node environment (configured in vite.config.ts) to support
// shamirs-secret-sharing-ts which requires Node's Buffer.

describe('SHARD_CONSTANTS', () => {
  it('should have minimum threshold of 2', () => {
    expect(SHARD_CONSTANTS.MIN_THRESHOLD).toBe(2);
  });

  it('should have maximum threshold of 5', () => {
    expect(SHARD_CONSTANTS.MAX_THRESHOLD).toBe(5);
  });

  it('should have minimum total shards of 3', () => {
    expect(SHARD_CONSTANTS.MIN_TOTAL_SHARDS).toBe(3);
  });

  it('should have maximum total shards of 10', () => {
    expect(SHARD_CONSTANTS.MAX_TOTAL_SHARDS).toBe(10);
  });
});

describe('createEncryptedShards', () => {
  const validSecret = 'deadbeef'.repeat(8); // 64 hex chars
  const validPassphrase = 'SecurePass123!';

  describe('valid configurations', () => {
    it('should create 3 shards with threshold 2', async () => {
      const config: ShardConfig = { threshold: 2, totalShards: 3 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      expect(shards).toHaveLength(3);
      expect(shards[0].threshold).toBe(2);
      expect(shards[0].totalShards).toBe(3);
    });

    it('should create 5 shards with threshold 3', async () => {
      const config: ShardConfig = { threshold: 3, totalShards: 5 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      expect(shards).toHaveLength(5);
    });

    it('should create shards with sequential indices starting at 1', async () => {
      const config: ShardConfig = { threshold: 2, totalShards: 3 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      expect(shards[0].index).toBe(1);
      expect(shards[1].index).toBe(2);
      expect(shards[2].index).toBe(3);
    });

    it('should create encrypted data for each shard', async () => {
      const config: ShardConfig = { threshold: 2, totalShards: 3 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      for (const shard of shards) {
        expect(shard.encryptedData).toBeTruthy();
        expect(typeof shard.encryptedData).toBe('string');
        // Should be base64
        expect(shard.encryptedData).toMatch(/^[A-Za-z0-9+/]+=*$/);
      }
    });

    it('should create unique encrypted data for each shard', async () => {
      const config: ShardConfig = { threshold: 2, totalShards: 3 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      const uniqueData = new Set(shards.map((s) => s.encryptedData));
      expect(uniqueData.size).toBe(3);
    });
  });

  describe('invalid configurations', () => {
    it('should reject threshold below minimum', async () => {
      const config: ShardConfig = { threshold: 1, totalShards: 3 };

      await expect(createEncryptedShards(validSecret, validPassphrase, config)).rejects.toThrow(
        BackupError
      );
    });

    it('should reject threshold above maximum', async () => {
      const config: ShardConfig = { threshold: 6, totalShards: 8 };

      await expect(createEncryptedShards(validSecret, validPassphrase, config)).rejects.toThrow(
        BackupError
      );
    });

    it('should reject totalShards below minimum', async () => {
      const config: ShardConfig = { threshold: 2, totalShards: 2 };

      await expect(createEncryptedShards(validSecret, validPassphrase, config)).rejects.toThrow(
        BackupError
      );
    });

    it('should reject totalShards above maximum', async () => {
      const config: ShardConfig = { threshold: 2, totalShards: 11 };

      await expect(createEncryptedShards(validSecret, validPassphrase, config)).rejects.toThrow(
        BackupError
      );
    });

    it('should reject threshold greater than totalShards', async () => {
      const config: ShardConfig = { threshold: 4, totalShards: 3 };

      await expect(createEncryptedShards(validSecret, validPassphrase, config)).rejects.toThrow(
        BackupError
      );
    });
  });
});

describe('reconstructSecret', () => {
  const validSecret = 'deadbeef'.repeat(8); // 64 hex chars
  const validPassphrase = 'SecurePass123!';

  describe('successful reconstruction', () => {
    it('should reconstruct secret with exactly threshold shards', async () => {
      const config: ShardConfig = { threshold: 2, totalShards: 3 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      // Use only first 2 shards (threshold)
      const reconstructed = await reconstructSecret(shards.slice(0, 2), validPassphrase);

      expect(reconstructed).toBe(validSecret);
    });

    it('should reconstruct secret with more than threshold shards', async () => {
      const config: ShardConfig = { threshold: 2, totalShards: 3 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      // Use all 3 shards
      const reconstructed = await reconstructSecret(shards, validPassphrase);

      expect(reconstructed).toBe(validSecret);
    });

    it('should reconstruct with any combination of threshold shards', async () => {
      const config: ShardConfig = { threshold: 2, totalShards: 4 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      // Try different combinations
      const combinations = [
        [shards[0], shards[1]],
        [shards[0], shards[2]],
        [shards[0], shards[3]],
        [shards[1], shards[2]],
        [shards[1], shards[3]],
        [shards[2], shards[3]],
      ];

      for (const combo of combinations) {
        const reconstructed = await reconstructSecret(combo, validPassphrase);
        expect(reconstructed).toBe(validSecret);
      }
    });

    it('should reconstruct with threshold 3 of 5', async () => {
      const config: ShardConfig = { threshold: 3, totalShards: 5 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      const reconstructed = await reconstructSecret(shards.slice(0, 3), validPassphrase);

      expect(reconstructed).toBe(validSecret);
    });
  });

  describe('failed reconstruction', () => {
    it('should throw with insufficient shards', async () => {
      const config: ShardConfig = { threshold: 3, totalShards: 5 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      // Only provide 2 shards when threshold is 3
      await expect(reconstructSecret(shards.slice(0, 2), validPassphrase)).rejects.toThrow(
        BackupError
      );
    });

    it('should throw with empty shards array', async () => {
      await expect(reconstructSecret([], validPassphrase)).rejects.toThrow(BackupError);
    });

    it('should throw with wrong passphrase', async () => {
      const config: ShardConfig = { threshold: 2, totalShards: 3 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      await expect(reconstructSecret(shards.slice(0, 2), 'WrongPassword123!')).rejects.toThrow();
    });
  });

  describe('error codes', () => {
    it('should throw INSUFFICIENT_SHARDS for empty array', async () => {
      try {
        await reconstructSecret([], validPassphrase);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BackupError);
        expect((error as BackupError).code).toBe(BackupErrorCode.INSUFFICIENT_SHARDS);
      }
    });

    it('should throw INSUFFICIENT_SHARDS when below threshold', async () => {
      const config: ShardConfig = { threshold: 3, totalShards: 5 };
      const shards = await createEncryptedShards(validSecret, validPassphrase, config);

      try {
        await reconstructSecret(shards.slice(0, 2), validPassphrase);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BackupError);
        expect((error as BackupError).code).toBe(BackupErrorCode.INSUFFICIENT_SHARDS);
      }
    });
  });
});

describe('round-trip encryption', () => {
  it('should handle a full backup and recovery flow', async () => {
    // Simulate a private key (32 bytes = 64 hex chars)
    const privateKey = 'a'.repeat(64);
    const passphrase = 'MySecureBackupPass123!';
    const config: ShardConfig = { threshold: 2, totalShards: 3 };

    // Create backup shards
    const shards = await createEncryptedShards(privateKey, passphrase, config);

    // Simulate losing one shard
    const availableShards = [shards[0], shards[2]];

    // Recover the private key
    const recoveredKey = await reconstructSecret(availableShards, passphrase);

    expect(recoveredKey).toBe(privateKey);
  });

  it('should handle maximum shard configuration', async () => {
    const secret = 'b'.repeat(64);
    const passphrase = 'MaxConfig123!';
    const config: ShardConfig = {
      threshold: SHARD_CONSTANTS.MAX_THRESHOLD,
      totalShards: SHARD_CONSTANTS.MAX_TOTAL_SHARDS,
    };

    const shards = await createEncryptedShards(secret, passphrase, config);
    expect(shards).toHaveLength(10);

    // Use exactly threshold shards
    const recovered = await reconstructSecret(
      shards.slice(0, SHARD_CONSTANTS.MAX_THRESHOLD),
      passphrase
    );
    expect(recovered).toBe(secret);
  });

  it('should handle minimum shard configuration', async () => {
    const secret = 'c'.repeat(64);
    const passphrase = 'MinConfig123!';
    const config: ShardConfig = {
      threshold: SHARD_CONSTANTS.MIN_THRESHOLD,
      totalShards: SHARD_CONSTANTS.MIN_TOTAL_SHARDS,
    };

    const shards = await createEncryptedShards(secret, passphrase, config);
    expect(shards).toHaveLength(3);

    const recovered = await reconstructSecret(
      shards.slice(0, SHARD_CONSTANTS.MIN_THRESHOLD),
      passphrase
    );
    expect(recovered).toBe(secret);
  });

  it('should handle different secret lengths', async () => {
    const passphrase = 'TestPass123!';
    const config: ShardConfig = { threshold: 2, totalShards: 3 };

    // Test various secret lengths
    const secrets = [
      'ab'.repeat(16), // 32 hex chars (16 bytes)
      'cd'.repeat(32), // 64 hex chars (32 bytes) - typical private key
      'ef'.repeat(64), // 128 hex chars (64 bytes)
    ];

    for (const secret of secrets) {
      const shards = await createEncryptedShards(secret, passphrase, config);
      const recovered = await reconstructSecret(shards.slice(0, 2), passphrase);
      expect(recovered).toBe(secret);
    }
  });
});
