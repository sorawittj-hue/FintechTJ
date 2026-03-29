/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn, formatCurrency } from '../lib/utils';

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const showActive = true;
    const showHidden = false;
    const result = cn('base', showActive && 'active', showHidden && 'hidden');
    expect(result).toBe('base active');
  });

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-8');
    // twMerge should keep only px-8
    expect(result).toBe('py-2 px-8');
  });

  it('should handle undefined and null', () => {
    const result = cn('base', undefined as unknown as string, null as unknown as string, 'end');
    expect(result).toBe('base end');
  });

  it('should handle empty strings', () => {
    const result = cn('', 'foo', '', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('should handle objects', () => {
    const result = cn({ foo: true, bar: false, baz: true });
    expect(result).toBe('foo baz');
  });
});

describe('formatCurrency', () => {
  it('should format USD by default', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('$');
    expect(result).toContain('1,234.56');
  });

  it('should format THB with Thai locale', () => {
    const result = formatCurrency(1000, 'THB');
    expect(result).toContain('฿');
    expect(result).toContain('1,000');
  });

  it('should format small numbers with more decimal places', () => {
    const result = formatCurrency(0.1234);
    expect(result).toContain('0.1234');
  });

  it('should format with compact notation', () => {
    const result = formatCurrency(1500000, 'USD', { compact: true });
    expect(result).toContain('M'); // Should show as millions
  });

  it('should respect minimumFractionDigits option', () => {
    const result = formatCurrency(100, 'USD', { minimumFractionDigits: 0 });
    expect(result).toBe('$100');
  });

  it('should respect maximumFractionDigits option', () => {
    const result = formatCurrency(100.123456, 'USD', { maximumFractionDigits: 2 });
    expect(result).toBe('$100.12');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('$');
    expect(result).toContain('0');
  });

  it('should handle negative numbers', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('-');
    expect(result).toContain('500');
  });
});
