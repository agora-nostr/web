import { describe, it, expect } from 'vitest';
import { truncateContent } from './contentPreview';

describe('truncateContent', () => {
  describe('empty and null handling', () => {
    it('should return empty string for empty input', () => {
      expect(truncateContent('')).toBe('');
    });

    it('should return empty string for null-ish input', () => {
      // @ts-expect-error - testing runtime behavior with null
      expect(truncateContent(null)).toBe('');
      // @ts-expect-error - testing runtime behavior with undefined
      expect(truncateContent(undefined)).toBe('');
    });
  });

  describe('content shorter than maxLength', () => {
    it('should return content unchanged if shorter than default maxLength', () => {
      const shortContent = 'Hello world';
      expect(truncateContent(shortContent)).toBe('Hello world');
    });

    it('should return content unchanged if exactly maxLength', () => {
      const content = 'a'.repeat(100);
      expect(truncateContent(content)).toBe(content);
    });

    it('should return content unchanged if shorter than custom maxLength', () => {
      const content = 'Hello';
      expect(truncateContent(content, 10)).toBe('Hello');
    });
  });

  describe('content longer than maxLength', () => {
    it('should truncate and add ellipsis for content longer than default maxLength', () => {
      const longContent = 'a'.repeat(150);
      const result = truncateContent(longContent);
      expect(result).toBe('a'.repeat(100) + '...');
      expect(result.length).toBe(103); // 100 + 3 for '...'
    });

    it('should truncate at custom maxLength', () => {
      const content = 'Hello, this is a test message';
      expect(truncateContent(content, 10)).toBe('Hello, thi...');
    });

    it('should handle very short maxLength', () => {
      const content = 'Hello world';
      expect(truncateContent(content, 1)).toBe('H...');
    });

    it('should handle maxLength of 0', () => {
      const content = 'Hello world';
      expect(truncateContent(content, 0)).toBe('...');
    });
  });

  describe('special characters', () => {
    it('should handle content with newlines', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      expect(truncateContent(content, 10)).toBe('Line 1\nLin...');
    });

    it('should handle content with unicode characters', () => {
      const content = '🎉 Hello World! 🎊';
      expect(truncateContent(content, 10)).toBe('🎉 Hello W...');
    });

    it('should handle content with tabs and spaces', () => {
      const content = 'Hello\t\tWorld   Test';
      // Content is 19 chars, truncate at 15 = "Hello\t\tWorld   " + "..."
      expect(truncateContent(content, 15)).toBe('Hello\t\tWorld   ...');
    });
  });
});

