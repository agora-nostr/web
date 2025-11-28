import { describe, it, expect } from 'vitest';
import {
  validatePassphraseStrength,
  symmetricEncrypt,
  symmetricDecrypt,
  PASSPHRASE_CONSTANTS,
} from './passphrase';

describe('PASSPHRASE_CONSTANTS', () => {
  it('should have expected minimum length', () => {
    expect(PASSPHRASE_CONSTANTS.MIN_LENGTH).toBe(12);
  });

  it('should have secure PBKDF2 iterations', () => {
    expect(PASSPHRASE_CONSTANTS.PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(100000);
  });

  it('should use AES-256', () => {
    expect(PASSPHRASE_CONSTANTS.AES_KEY_LENGTH).toBe(256);
  });
});

describe('validatePassphraseStrength', () => {
  describe('length validation', () => {
    it('should reject passphrase shorter than minimum length', () => {
      const result = validatePassphraseStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        `Passphrase must be at least ${PASSPHRASE_CONSTANTS.MIN_LENGTH} characters long`
      );
    });

    it('should accept passphrase at minimum length with all requirements', () => {
      const result = validatePassphraseStrength('Abcdefgh1!@#');
      expect(result.errors).not.toContainEqual(expect.stringContaining('characters long'));
    });
  });

  describe('uppercase letter requirement', () => {
    it('should reject passphrase without uppercase letter', () => {
      const result = validatePassphraseStrength('abcdefgh12!@');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one uppercase letter');
    });

    it('should accept passphrase with uppercase letter', () => {
      const result = validatePassphraseStrength('Abcdefgh12!@');
      expect(result.errors).not.toContain('Passphrase must contain at least one uppercase letter');
    });
  });

  describe('lowercase letter requirement', () => {
    it('should reject passphrase without lowercase letter', () => {
      const result = validatePassphraseStrength('ABCDEFGH12!@');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one lowercase letter');
    });

    it('should accept passphrase with lowercase letter', () => {
      const result = validatePassphraseStrength('ABCDEFGHa2!@');
      expect(result.errors).not.toContain('Passphrase must contain at least one lowercase letter');
    });
  });

  describe('number requirement', () => {
    it('should reject passphrase without number', () => {
      const result = validatePassphraseStrength('Abcdefghij!@');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one number');
    });

    it('should accept passphrase with number', () => {
      const result = validatePassphraseStrength('Abcdefghi1!@');
      expect(result.errors).not.toContain('Passphrase must contain at least one number');
    });
  });

  describe('symbol requirement', () => {
    it('should reject passphrase without symbol', () => {
      const result = validatePassphraseStrength('Abcdefghij12');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one symbol');
    });

    it('should accept passphrase with common symbols', () => {
      const symbols = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '='];
      for (const symbol of symbols) {
        const result = validatePassphraseStrength(`Abcdefghi1${symbol}x`);
        expect(result.errors).not.toContain('Passphrase must contain at least one symbol');
      }
    });
  });

  describe('valid passphrases', () => {
    it('should accept a fully valid passphrase', () => {
      const result = validatePassphraseStrength('MySecurePass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept a complex passphrase', () => {
      const result = validatePassphraseStrength('C0mpl3x-P@ssphrase_2024!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept a long passphrase', () => {
      const result = validatePassphraseStrength(
        'This is a very long passphrase with Numbers123 and Symbols!@#'
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('multiple failures', () => {
    it('should report all failures at once', () => {
      const result = validatePassphraseStrength('short');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      // Should fail on length, uppercase, number, and symbol
      expect(result.errors.length).toBe(4);
    });
  });
});

describe('symmetricEncrypt and symmetricDecrypt', () => {
  const validPassphrase = 'MySecurePass123!';

  describe('basic encryption/decryption', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const original = 'Hello, World!';

      const encrypted = await symmetricEncrypt(original, validPassphrase);
      const decrypted = await symmetricDecrypt(encrypted, validPassphrase);

      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt hex data (like private keys)', async () => {
      const hexKey = 'deadbeef'.repeat(8); // 64 hex chars = 32 bytes = 256 bits
      const encrypted = await symmetricEncrypt(hexKey, validPassphrase);
      const decrypted = await symmetricDecrypt(encrypted, validPassphrase);

      expect(decrypted).toBe(hexKey);
    });

    it('should encrypt and decrypt unicode content', async () => {
      const original = '🔐 Encrypted: 秘密 مشفر';

      const encrypted = await symmetricEncrypt(original, validPassphrase);
      const decrypted = await symmetricDecrypt(encrypted, validPassphrase);

      expect(decrypted).toBe(original);
    });
  });

  describe('encrypted output format', () => {
    it('should produce base64-encoded output', async () => {
      const original = 'Test data';
      const encrypted = await symmetricEncrypt(original, validPassphrase);

      // Base64 should only contain these characters
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should produce different ciphertext for same plaintext (random salt/IV)', async () => {
      const original = 'Same plaintext';

      const encrypted1 = await symmetricEncrypt(original, validPassphrase);
      const encrypted2 = await symmetricEncrypt(original, validPassphrase);

      // Same plaintext, same passphrase, but different ciphertext
      expect(encrypted1).not.toBe(encrypted2);

      // Both should decrypt to same value
      expect(await symmetricDecrypt(encrypted1, validPassphrase)).toBe(original);
      expect(await symmetricDecrypt(encrypted2, validPassphrase)).toBe(original);
    });
  });

  describe('passphrase handling', () => {
    it('should fail decryption with wrong passphrase', async () => {
      const original = 'Secret message';
      const correctPassphrase = 'CorrectPass123!';
      const wrongPassphrase = 'WrongPass456!';

      const encrypted = await symmetricEncrypt(original, correctPassphrase);

      await expect(symmetricDecrypt(encrypted, wrongPassphrase)).rejects.toThrow();
    });

    it('should handle passphrases with special characters', async () => {
      const original = 'Test data';
      const passphrase = 'P@$$w0rd!#$%^&*()_+-=[]{}|;:,.<>?';

      const encrypted = await symmetricEncrypt(original, passphrase);
      const decrypted = await symmetricDecrypt(encrypted, passphrase);

      expect(decrypted).toBe(original);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string data', async () => {
      const original = '';

      const encrypted = await symmetricEncrypt(original, validPassphrase);
      const decrypted = await symmetricDecrypt(encrypted, validPassphrase);

      expect(decrypted).toBe(original);
    });

    it('should handle large data', async () => {
      const original = 'a'.repeat(100000); // 100KB of data

      const encrypted = await symmetricEncrypt(original, validPassphrase);
      const decrypted = await symmetricDecrypt(encrypted, validPassphrase);

      expect(decrypted).toBe(original);
    });
  });
});

