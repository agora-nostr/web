import { describe, it, expect } from 'vitest';
import { encodeGeohash } from './geohash';

describe('encodeGeohash', () => {
  describe('known locations', () => {
    it('should encode San Francisco coordinates correctly', () => {
      // San Francisco: 37.7749, -122.4194
      const geohash = encodeGeohash(37.7749, -122.4194);
      expect(geohash).toBe('9q8yy');
    });

    it('should encode New York coordinates correctly', () => {
      // New York: 40.7128, -74.0060
      const geohash = encodeGeohash(40.7128, -74.006);
      expect(geohash).toBe('dr5re');
    });

    it('should encode London coordinates correctly', () => {
      // London: 51.5074, -0.1278
      const geohash = encodeGeohash(51.5074, -0.1278);
      expect(geohash).toBe('gcpvj');
    });

    it('should encode Tokyo coordinates correctly', () => {
      // Tokyo: 35.6762, 139.6503
      const geohash = encodeGeohash(35.6762, 139.6503);
      expect(geohash).toBe('xn76c');
    });

    it('should encode Sydney coordinates correctly', () => {
      // Sydney: -33.8688, 151.2093
      const geohash = encodeGeohash(-33.8688, 151.2093);
      expect(geohash).toBe('r3gx2');
    });
  });

  describe('precision handling', () => {
    it('should default to precision 5', () => {
      const geohash = encodeGeohash(0, 0);
      expect(geohash.length).toBe(5);
    });

    it('should handle precision 1', () => {
      const geohash = encodeGeohash(37.7749, -122.4194, 1);
      expect(geohash.length).toBe(1);
      expect(geohash).toBe('9');
    });

    it('should handle precision 3', () => {
      const geohash = encodeGeohash(37.7749, -122.4194, 3);
      expect(geohash.length).toBe(3);
      expect(geohash).toBe('9q8');
    });

    it('should handle precision 8 for high accuracy', () => {
      const geohash = encodeGeohash(37.7749, -122.4194, 8);
      expect(geohash.length).toBe(8);
    });

    it('should handle precision 12 for maximum accuracy', () => {
      const geohash = encodeGeohash(37.7749, -122.4194, 12);
      expect(geohash.length).toBe(12);
    });
  });

  describe('edge cases', () => {
    it('should handle origin point (0, 0)', () => {
      const geohash = encodeGeohash(0, 0);
      expect(geohash).toBe('s0000');
    });

    it('should handle maximum latitude (90)', () => {
      const geohash = encodeGeohash(90, 0);
      expect(geohash.length).toBe(5);
    });

    it('should handle minimum latitude (-90)', () => {
      const geohash = encodeGeohash(-90, 0);
      expect(geohash.length).toBe(5);
    });

    it('should handle maximum longitude (180)', () => {
      const geohash = encodeGeohash(0, 180);
      expect(geohash.length).toBe(5);
    });

    it('should handle minimum longitude (-180)', () => {
      const geohash = encodeGeohash(0, -180);
      expect(geohash.length).toBe(5);
    });

    it('should handle all corners of the world', () => {
      // NE corner
      expect(encodeGeohash(90, 180)).toBeTruthy();
      // NW corner
      expect(encodeGeohash(90, -180)).toBeTruthy();
      // SE corner
      expect(encodeGeohash(-90, 180)).toBeTruthy();
      // SW corner
      expect(encodeGeohash(-90, -180)).toBeTruthy();
    });
  });

  describe('nearby locations should have similar prefixes', () => {
    it('should produce similar hashes for nearby points', () => {
      // Two points ~100m apart in SF
      const hash1 = encodeGeohash(37.7749, -122.4194);
      const hash2 = encodeGeohash(37.7750, -122.4195);

      // First 4 characters should match for nearby points
      expect(hash1.slice(0, 4)).toBe(hash2.slice(0, 4));
    });

    it('should produce different hashes for distant points', () => {
      const sfHash = encodeGeohash(37.7749, -122.4194);
      const nyHash = encodeGeohash(40.7128, -74.006);

      // Different cities should have different first characters
      expect(sfHash[0]).not.toBe(nyHash[0]);
    });
  });
});

