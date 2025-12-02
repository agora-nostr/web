import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  describe('basic class merging', () => {
    it('should merge multiple class strings', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle single class', () => {
      expect(cn('foo')).toBe('foo');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });
  });

  describe('conditional classes', () => {
    it('should handle boolean conditions', () => {
      expect(cn('foo', true && 'bar')).toBe('foo bar');
      expect(cn('foo', false && 'bar')).toBe('foo');
    });

    it('should handle undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    it('should handle null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar');
    });

    it('should handle object syntax', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should handle mixed syntax', () => {
      expect(cn('base', { conditional: true }, false && 'skipped', 'always')).toBe(
        'base conditional always'
      );
    });
  });

  describe('tailwind class merging', () => {
    it('should merge conflicting padding classes', () => {
      // Later class should win
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });

    it('should merge conflicting margin classes', () => {
      expect(cn('m-4', 'm-8')).toBe('m-8');
    });

    it('should merge conflicting text color classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should merge conflicting background classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('should keep non-conflicting classes', () => {
      expect(cn('p-4', 'm-4')).toBe('p-4 m-4');
    });

    it('should merge complex tailwind patterns', () => {
      expect(cn('px-4 py-2', 'px-2')).toBe('py-2 px-2');
    });

    it('should handle responsive prefixes', () => {
      expect(cn('md:p-4', 'md:p-2')).toBe('md:p-2');
    });

    it('should keep different breakpoint classes', () => {
      expect(cn('p-4', 'md:p-2', 'lg:p-6')).toBe('p-4 md:p-2 lg:p-6');
    });

    it('should handle hover states', () => {
      expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
    });

    it('should keep different state classes', () => {
      expect(cn('hover:bg-red-500', 'focus:bg-blue-500')).toBe('hover:bg-red-500 focus:bg-blue-500');
    });
  });

  describe('array inputs', () => {
    it('should handle array of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle nested arrays', () => {
      expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
    });
  });

  describe('real-world component patterns', () => {
    it('should handle button variant pattern', () => {
      const baseClasses = 'px-4 py-2 rounded font-medium';
      const variantClasses = 'bg-blue-500 text-white';
      const overrideClasses = 'px-6'; // Override padding

      expect(cn(baseClasses, variantClasses, overrideClasses)).toBe(
        'py-2 rounded font-medium bg-blue-500 text-white px-6'
      );
    });

    it('should handle disabled state pattern', () => {
      const isDisabled = true;
      expect(
        cn('bg-blue-500 hover:bg-blue-600', isDisabled && 'opacity-50 cursor-not-allowed')
      ).toBe('bg-blue-500 hover:bg-blue-600 opacity-50 cursor-not-allowed');
    });

    it('should handle size variant pattern', () => {
      const size = 'lg';
      const sizeClasses = {
        sm: 'text-sm px-2 py-1',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3',
      };

      expect(cn('rounded', sizeClasses[size])).toBe('rounded text-lg px-6 py-3');
    });
  });
});

