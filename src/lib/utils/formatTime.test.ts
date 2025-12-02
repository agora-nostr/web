import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimeAgo, formatDateAgo } from './formatTime';

describe('formatTimeAgo', () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper to create timestamp X seconds ago
  const secondsAgo = (seconds: number) => Math.floor(Date.now() / 1000) - seconds;

  // Helper to create timestamp X seconds in the future
  const secondsFromNow = (seconds: number) => Math.floor(Date.now() / 1000) + seconds;

  describe('future timestamps', () => {
    it('should return "in the future" for timestamps 5 minutes ahead', () => {
      const futureTimestamp = secondsFromNow(5 * 60);
      expect(formatTimeAgo(futureTimestamp)).toBe('in the future');
    });

    it('should return "in the future" for timestamps 1 hour ahead', () => {
      const futureTimestamp = secondsFromNow(60 * 60);
      expect(formatTimeAgo(futureTimestamp)).toBe('in the future');
    });

    it('should return "in the future" for timestamps 1 day ahead', () => {
      const futureTimestamp = secondsFromNow(24 * 60 * 60);
      expect(formatTimeAgo(futureTimestamp)).toBe('in the future');
    });

    it('should return "in the future" for timestamps 1 second ahead', () => {
      const futureTimestamp = secondsFromNow(1);
      expect(formatTimeAgo(futureTimestamp)).toBe('in the future');
    });
  });

  describe('just now (< 60 seconds)', () => {
    it('should return "just now" for current time', () => {
      expect(formatTimeAgo(secondsAgo(0))).toBe('just now');
    });

    it('should return "just now" for 30 seconds ago', () => {
      expect(formatTimeAgo(secondsAgo(30))).toBe('just now');
    });

    it('should return "just now" for 59 seconds ago', () => {
      expect(formatTimeAgo(secondsAgo(59))).toBe('just now');
    });
  });

  describe('minutes (1-59 minutes)', () => {
    it('should return "1m" for 60 seconds ago', () => {
      expect(formatTimeAgo(secondsAgo(60))).toBe('1m');
    });

    it('should return "5m" for 5 minutes ago', () => {
      expect(formatTimeAgo(secondsAgo(5 * 60))).toBe('5m');
    });

    it('should return "59m" for 59 minutes ago', () => {
      expect(formatTimeAgo(secondsAgo(59 * 60))).toBe('59m');
    });
  });

  describe('hours (1-23 hours)', () => {
    it('should return "1h" for 1 hour ago', () => {
      expect(formatTimeAgo(secondsAgo(60 * 60))).toBe('1h');
    });

    it('should return "12h" for 12 hours ago', () => {
      expect(formatTimeAgo(secondsAgo(12 * 60 * 60))).toBe('12h');
    });

    it('should return "23h" for 23 hours ago', () => {
      expect(formatTimeAgo(secondsAgo(23 * 60 * 60))).toBe('23h');
    });
  });

  describe('days (1-6 days)', () => {
    it('should return "1d" for 1 day ago', () => {
      expect(formatTimeAgo(secondsAgo(24 * 60 * 60))).toBe('1d');
    });

    it('should return "3d" for 3 days ago', () => {
      expect(formatTimeAgo(secondsAgo(3 * 24 * 60 * 60))).toBe('3d');
    });

    it('should return "6d" for 6 days ago', () => {
      expect(formatTimeAgo(secondsAgo(6 * 24 * 60 * 60))).toBe('6d');
    });
  });

  describe('weeks (1-3 weeks)', () => {
    it('should return "1w" for 7 days ago', () => {
      expect(formatTimeAgo(secondsAgo(7 * 24 * 60 * 60))).toBe('1w');
    });

    it('should return "2w" for 14 days ago', () => {
      expect(formatTimeAgo(secondsAgo(14 * 24 * 60 * 60))).toBe('2w');
    });

    it('should return "3w" for 21 days ago', () => {
      expect(formatTimeAgo(secondsAgo(21 * 24 * 60 * 60))).toBe('3w');
    });
  });

  describe('months (1-11 months)', () => {
    it('should return "1mo" for ~30 days ago', () => {
      expect(formatTimeAgo(secondsAgo(30 * 24 * 60 * 60))).toBe('1mo');
    });

    it('should return "6mo" for ~180 days ago', () => {
      expect(formatTimeAgo(secondsAgo(180 * 24 * 60 * 60))).toBe('6mo');
    });

    it('should return "11mo" for ~330 days ago', () => {
      expect(formatTimeAgo(secondsAgo(330 * 24 * 60 * 60))).toBe('11mo');
    });
  });

  describe('years', () => {
    it('should return "1y" for 365 days ago', () => {
      expect(formatTimeAgo(secondsAgo(365 * 24 * 60 * 60))).toBe('1y');
    });

    it('should return "2y" for 730 days ago', () => {
      expect(formatTimeAgo(secondsAgo(730 * 24 * 60 * 60))).toBe('2y');
    });
  });
});

describe('formatDateAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should convert Date to timestamp and call formatTimeAgo', () => {
    const date = new Date('2025-01-15T11:55:00Z'); // 5 minutes ago
    expect(formatDateAgo(date)).toBe('5m');
  });

  it('should handle dates from hours ago', () => {
    const date = new Date('2025-01-15T10:00:00Z'); // 2 hours ago
    expect(formatDateAgo(date)).toBe('2h');
  });

  it('should handle dates from days ago', () => {
    const date = new Date('2025-01-12T12:00:00Z'); // 3 days ago
    expect(formatDateAgo(date)).toBe('3d');
  });
});

