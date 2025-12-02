import { describe, it, expect } from 'vitest';
import { formatBalance, formatBalanceLong } from './formatBalance';

describe('formatBalance', () => {
  describe('zero handling', () => {
    it('should return "0" for zero sats', () => {
      expect(formatBalance(0)).toBe('0');
    });
  });

  describe('small amounts (under 1000)', () => {
    it('should format single digit amounts', () => {
      expect(formatBalance(1)).toBe('1');
      expect(formatBalance(9)).toBe('9');
    });

    it('should format double digit amounts', () => {
      expect(formatBalance(10)).toBe('10');
      expect(formatBalance(99)).toBe('99');
    });

    it('should format triple digit amounts with comma formatting', () => {
      expect(formatBalance(100)).toBe('100');
      expect(formatBalance(999)).toBe('999');
    });
  });

  describe('thousands (k)', () => {
    it('should format exactly 1000 as "1.0k"', () => {
      expect(formatBalance(1000)).toBe('1.0k');
    });

    it('should format thousands with one decimal place', () => {
      expect(formatBalance(1500)).toBe('1.5k');
      expect(formatBalance(2000)).toBe('2.0k');
      expect(formatBalance(9999)).toBe('10.0k');
    });

    it('should format tens of thousands', () => {
      expect(formatBalance(10000)).toBe('10.0k');
      expect(formatBalance(50000)).toBe('50.0k');
      expect(formatBalance(100000)).toBe('100.0k');
    });

    it('should format hundreds of thousands', () => {
      expect(formatBalance(500000)).toBe('500.0k');
      expect(formatBalance(999999)).toBe('1000.0k');
    });
  });

  describe('millions (M)', () => {
    it('should format exactly 1 million as "1.0M"', () => {
      expect(formatBalance(1000000)).toBe('1.0M');
    });

    it('should format millions with one decimal place', () => {
      expect(formatBalance(1500000)).toBe('1.5M');
      expect(formatBalance(2000000)).toBe('2.0M');
      expect(formatBalance(10000000)).toBe('10.0M');
    });

    it('should format large millions', () => {
      expect(formatBalance(100000000)).toBe('100.0M');
      expect(formatBalance(999999999)).toBe('1000.0M');
    });
  });
});

describe('formatBalanceLong', () => {
  describe('zero handling', () => {
    it('should return "0 sats" for zero', () => {
      expect(formatBalanceLong(0)).toBe('0 sats');
    });
  });

  describe('formatting with "sats" suffix', () => {
    it('should format small amounts with comma and "sats"', () => {
      expect(formatBalanceLong(1)).toBe('1 sats');
      expect(formatBalanceLong(100)).toBe('100 sats');
      expect(formatBalanceLong(999)).toBe('999 sats');
    });

    it('should format thousands with comma separator', () => {
      expect(formatBalanceLong(1000)).toBe('1,000 sats');
      expect(formatBalanceLong(10000)).toBe('10,000 sats');
      expect(formatBalanceLong(100000)).toBe('100,000 sats');
    });

    it('should format millions with comma separators', () => {
      expect(formatBalanceLong(1000000)).toBe('1,000,000 sats');
      expect(formatBalanceLong(1234567)).toBe('1,234,567 sats');
    });
  });
});

