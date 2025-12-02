import { describe, it, expect } from 'vitest';
import { BackupError, BackupErrorCode, withBackupErrorHandling } from './errors';

describe('BackupError', () => {
  describe('constructor', () => {
    it('should create error with code and message', () => {
      const error = new BackupError(BackupErrorCode.NO_USER, 'User not found');

      expect(error.code).toBe(BackupErrorCode.NO_USER);
      expect(error.message).toBe('User not found');
      expect(error.name).toBe('BackupError');
    });

    it('should store cause when provided', () => {
      const cause = new Error('Original error');
      const error = new BackupError(BackupErrorCode.ENCRYPTION_FAILED, 'Encryption failed', cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe('BackupError.from', () => {
    it('should return existing BackupError unchanged', () => {
      const original = new BackupError(BackupErrorCode.NO_USER, 'Original message');
      const result = BackupError.from(original, BackupErrorCode.UNKNOWN_ERROR, 'Default');

      expect(result).toBe(original);
      expect(result.code).toBe(BackupErrorCode.NO_USER);
      expect(result.message).toBe('Original message');
    });

    it('should wrap standard Error with message preserved', () => {
      const original = new Error('Standard error message');
      const result = BackupError.from(original, BackupErrorCode.ENCRYPTION_FAILED, 'Default');

      expect(result).toBeInstanceOf(BackupError);
      expect(result.code).toBe(BackupErrorCode.ENCRYPTION_FAILED);
      expect(result.message).toBe('Standard error message');
      expect(result.cause).toBe(original);
    });

    it('should use default message for non-Error values', () => {
      const result = BackupError.from('string error', BackupErrorCode.UNKNOWN_ERROR, 'Default message');

      expect(result).toBeInstanceOf(BackupError);
      expect(result.message).toBe('Default message');
      expect(result.cause).toBe('string error');
    });

    it('should handle null/undefined errors', () => {
      const resultNull = BackupError.from(null, BackupErrorCode.UNKNOWN_ERROR, 'Default');
      const resultUndefined = BackupError.from(undefined, BackupErrorCode.UNKNOWN_ERROR, 'Default');

      expect(resultNull.message).toBe('Default');
      expect(resultUndefined.message).toBe('Default');
    });
  });

  describe('BackupError.is', () => {
    it('should return true for matching BackupError and code', () => {
      const error = new BackupError(BackupErrorCode.NO_USER, 'Test');

      expect(BackupError.is(error, BackupErrorCode.NO_USER)).toBe(true);
    });

    it('should return false for non-matching code', () => {
      const error = new BackupError(BackupErrorCode.NO_USER, 'Test');

      expect(BackupError.is(error, BackupErrorCode.ENCRYPTION_FAILED)).toBe(false);
    });

    it('should return false for non-BackupError', () => {
      const error = new Error('Regular error');

      expect(BackupError.is(error, BackupErrorCode.NO_USER)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(BackupError.is(null, BackupErrorCode.NO_USER)).toBe(false);
      expect(BackupError.is(undefined, BackupErrorCode.NO_USER)).toBe(false);
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly message for each error code', () => {
      const errorCodes = Object.values(BackupErrorCode);

      for (const code of errorCodes) {
        const error = new BackupError(code, 'Technical message');
        const userMessage = error.getUserMessage();

        expect(userMessage).toBeTruthy();
        expect(typeof userMessage).toBe('string');
        expect(userMessage.length).toBeGreaterThan(0);
      }
    });

    it('should return specific messages for known codes', () => {
      expect(new BackupError(BackupErrorCode.NO_USER, '').getUserMessage()).toContain('log in');

      expect(new BackupError(BackupErrorCode.INVALID_PASSPHRASE, '').getUserMessage()).toContain(
        'security requirements'
      );

      expect(new BackupError(BackupErrorCode.INSUFFICIENT_SHARDS, '').getUserMessage()).toContain(
        'shards'
      );
    });
  });
});

describe('withBackupErrorHandling', () => {
  it('should return result on success', async () => {
    const result = await withBackupErrorHandling(
      async () => 'success',
      BackupErrorCode.UNKNOWN_ERROR,
      'Default'
    );

    expect(result).toBe('success');
  });

  it('should wrap thrown errors with BackupError', async () => {
    await expect(
      withBackupErrorHandling(
        async () => {
          throw new Error('Original error');
        },
        BackupErrorCode.ENCRYPTION_FAILED,
        'Encryption failed'
      )
    ).rejects.toThrow(BackupError);
  });

  it('should preserve BackupError thrown inside', async () => {
    const original = new BackupError(BackupErrorCode.NO_USER, 'No user');

    try {
      await withBackupErrorHandling(
        async () => {
          throw original;
        },
        BackupErrorCode.UNKNOWN_ERROR,
        'Default'
      );
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBe(original);
      expect((error as BackupError).code).toBe(BackupErrorCode.NO_USER);
    }
  });

  it('should use provided code for non-BackupError', async () => {
    try {
      await withBackupErrorHandling(
        async () => {
          throw new TypeError('Type error');
        },
        BackupErrorCode.KEY_DERIVATION_FAILED,
        'Key derivation failed'
      );
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BackupError);
      expect((error as BackupError).code).toBe(BackupErrorCode.KEY_DERIVATION_FAILED);
    }
  });
});

describe('BackupErrorCode', () => {
  it('should have all expected error codes', () => {
    const expectedCodes = [
      'NO_USER',
      'NO_PRIVATE_KEY',
      'INVALID_PASSPHRASE',
      'INVALID_PUBKEY',
      'DUPLICATE_TRUSTEE',
      'MAX_TRUSTEES_EXCEEDED',
      'ENCRYPTION_FAILED',
      'DECRYPTION_FAILED',
      'KEY_DERIVATION_FAILED',
      'SHAMIR_SPLIT_FAILED',
      'SHAMIR_JOIN_FAILED',
      'EVENT_CREATION_FAILED',
      'EVENT_SIGNING_FAILED',
      'EVENT_PUBLISHING_FAILED',
      'METADATA_PUBLISHING_FAILED',
      'METADATA_FETCH_FAILED',
      'SHARD_FETCH_FAILED',
      'INVALID_THRESHOLD',
      'INVALID_SHARD_COUNT',
      'INSUFFICIENT_SHARDS',
      'UNKNOWN_ERROR',
    ];

    for (const code of expectedCodes) {
      expect(BackupErrorCode).toHaveProperty(code);
    }
  });
});

