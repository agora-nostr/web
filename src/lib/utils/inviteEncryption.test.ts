import { describe, it, expect } from 'vitest';
import {
  generateEncryptionKey,
  generateDTag,
  generateInviteCode,
  encryptInvitePayload,
  decryptInvitePayload,
} from './inviteEncryption';

/**
 * These key generation functions use crypto.getRandomValues() for
 * cryptographically secure random number generation.
 */

describe('generateEncryptionKey', () => {
  it('should generate a 24-character key', () => {
    const key = generateEncryptionKey();
    expect(key.length).toBe(24);
  });

  it('should only contain lowercase letters and numbers', () => {
    const key = generateEncryptionKey();
    expect(key).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate unique keys', () => {
    const keys = new Set();
    for (let i = 0; i < 100; i++) {
      keys.add(generateEncryptionKey());
    }
    // All keys should be unique
    expect(keys.size).toBe(100);
  });
});

describe('generateDTag', () => {
  it('should generate a 12-character d-tag', () => {
    const dTag = generateDTag();
    expect(dTag.length).toBe(12);
  });

  it('should only contain lowercase letters and numbers', () => {
    const dTag = generateDTag();
    expect(dTag).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate unique d-tags', () => {
    const tags = new Set();
    for (let i = 0; i < 100; i++) {
      tags.add(generateDTag());
    }
    expect(tags.size).toBe(100);
  });
});

describe('generateInviteCode', () => {
  it('should generate a 24-character invite code', () => {
    const code = generateInviteCode();
    expect(code.length).toBe(24);
  });

  it('should only contain lowercase letters and numbers', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateInviteCode());
    }
    expect(codes.size).toBe(100);
  });
});

describe('encryptInvitePayload and decryptInvitePayload', () => {
  describe('basic encryption/decryption', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const original = 'Hello, World!';
      const key = generateEncryptionKey();

      const encrypted = await encryptInvitePayload(original, key);
      const decrypted = await decryptInvitePayload(encrypted, key);

      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt JSON data', async () => {
      const original = JSON.stringify({ pubkey: 'abc123', relay: 'wss://example.com' });
      const key = generateEncryptionKey();

      const encrypted = await encryptInvitePayload(original, key);
      const decrypted = await decryptInvitePayload(encrypted, key);

      expect(decrypted).toBe(original);
      expect(JSON.parse(decrypted)).toEqual({ pubkey: 'abc123', relay: 'wss://example.com' });
    });

    it('should encrypt and decrypt unicode content', async () => {
      const original = '🎉 Hello 世界! مرحبا';
      const key = generateEncryptionKey();

      const encrypted = await encryptInvitePayload(original, key);
      const decrypted = await decryptInvitePayload(encrypted, key);

      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt long content', async () => {
      const original = 'a'.repeat(10000);
      const key = generateEncryptionKey();

      const encrypted = await encryptInvitePayload(original, key);
      const decrypted = await decryptInvitePayload(encrypted, key);

      expect(decrypted).toBe(original);
    });
  });

  describe('encrypted output format', () => {
    it('should produce base64-encoded output', async () => {
      const original = 'Test data';
      const key = generateEncryptionKey();

      const encrypted = await encryptInvitePayload(original, key);

      // Base64 should only contain these characters
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', async () => {
      const original = 'Same plaintext';
      const key = generateEncryptionKey();

      const encrypted1 = await encryptInvitePayload(original, key);
      const encrypted2 = await encryptInvitePayload(original, key);

      // Same plaintext, same key, but different ciphertext due to random IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      expect(await decryptInvitePayload(encrypted1, key)).toBe(original);
      expect(await decryptInvitePayload(encrypted2, key)).toBe(original);
    });
  });

  describe('key handling', () => {
    it('should fail decryption with wrong key', async () => {
      const original = 'Secret message';
      const correctKey = generateEncryptionKey();
      const wrongKey = generateEncryptionKey();

      const encrypted = await encryptInvitePayload(original, correctKey);

      await expect(decryptInvitePayload(encrypted, wrongKey)).rejects.toThrow();
    });

    it('should handle short keys by padding', async () => {
      const original = 'Test';
      const shortKey = 'abc'; // Very short key

      const encrypted = await encryptInvitePayload(original, shortKey);
      const decrypted = await decryptInvitePayload(encrypted, shortKey);

      expect(decrypted).toBe(original);
    });

    it('should handle long keys by truncating', async () => {
      const original = 'Test';
      const longKey = 'a'.repeat(100); // Very long key

      const encrypted = await encryptInvitePayload(original, longKey);
      const decrypted = await decryptInvitePayload(encrypted, longKey);

      expect(decrypted).toBe(original);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', async () => {
      const original = '';
      const key = generateEncryptionKey();

      const encrypted = await encryptInvitePayload(original, key);
      const decrypted = await decryptInvitePayload(encrypted, key);

      expect(decrypted).toBe(original);
    });

    it('should handle newlines and special whitespace', async () => {
      const original = 'Line 1\nLine 2\r\nLine 3\tTabbed';
      const key = generateEncryptionKey();

      const encrypted = await encryptInvitePayload(original, key);
      const decrypted = await decryptInvitePayload(encrypted, key);

      expect(decrypted).toBe(original);
    });
  });
});

