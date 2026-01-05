/**
 * Tests for format utility helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatDuration,
  formatRelative,
  formatNumber,
  formatCompact,
  formatPercent,
  formatDelta,
  truncateMiddle,
  truncateEnd,
} from '../../src/utils/formatters.js';

describe('formatters', () => {
  describe('formatBytes', () => {
    it('formats zero and non-finite values', () => {
      expect(formatBytes(0, 'short')).toBe('0B');
      expect(formatBytes(0, 'full')).toBe('0 B');
      expect(formatBytes(Number.POSITIVE_INFINITY, 'short')).toBe('\u221e');
      expect(formatBytes(Number.POSITIVE_INFINITY, 'full')).toBe('\u221e B');
    });

    it('formats negative and scaled values with precision', () => {
      expect(formatBytes(-1536, 'full')).toBe('-1.50 KiB');
      expect(formatBytes(512, 'full')).toBe('512 B');
      expect(formatBytes(10240, 'full')).toBe('10.0 KiB');
      expect(formatBytes(1024 * 1024 * 150, 'full')).toBe('150 MiB');
      expect(formatBytes(1536, 'short')).toBe('1.50K');
    });
  });

  describe('formatDuration', () => {
    it('handles invalid durations', () => {
      expect(formatDuration(-1)).toBe('0s');
      expect(formatDuration(-1, 'short')).toBe('0:00');
    });

    it('formats short durations with minutes and hours', () => {
      expect(formatDuration(90, 'short')).toBe('1:30');
      expect(formatDuration(3661, 'short')).toBe('1:01:01');
      expect(formatDuration(90061, 'short')).toBe('1d 1:01:01');
    });

    it('formats long durations with units', () => {
      expect(formatDuration(59)).toBe('59s');
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(3661)).toBe('1h 1m 1s');
    });
  });

  describe('formatRelative', () => {
    it('formats recent timestamps', () => {
      const now = 1_700_000_000_000;
      expect(formatRelative(now, now)).toBe('just now');
      expect(formatRelative(now - 120_000, now)).toBe('2 minutes ago');
    });

    it('formats future timestamps and seconds input', () => {
      const now = 1_700_000_000_000;
      expect(formatRelative(now + 3_600_000, now)).toBe('in 1 hour');
      const secondsTs = Math.floor((now - 60_000) / 1000);
      expect(formatRelative(secondsTs, now)).toBe('1 minute ago');
    });
  });

  describe('formatNumber', () => {
    it('adds separators and preserves decimals', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
      expect(formatNumber(1234, '.')).toBe('1.234');
    });

    it('returns non-finite numbers as strings', () => {
      expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('Infinity');
    });
  });

  describe('formatCompact', () => {
    it('handles ranges and sign', () => {
      expect(formatCompact(999)).toBe('999');
      expect(formatCompact(1000)).toBe('1K');
      expect(formatCompact(1_200_000)).toBe('1.2M');
      expect(formatCompact(2_500_000_000)).toBe('2.5B');
      expect(formatCompact(3_000_000_000_000)).toBe('3T');
      expect(formatCompact(-1500)).toBe('-1.5K');
    });
  });

  describe('formatPercent', () => {
    it('formats percentages and trims zeros', () => {
      expect(formatPercent(0.5)).toBe('50%');
      expect(formatPercent(1.234, 2)).toBe('123.40%');
    });

    it('handles non-finite inputs', () => {
      expect(formatPercent(Number.NaN)).toBe('\u2014');
    });
  });

  describe('formatDelta', () => {
    it('formats delta with sign', () => {
      expect(formatDelta(12.5)).toBe('+12.5%');
      expect(formatDelta(-3.2)).toBe('-3.2%');
      expect(formatDelta(0)).toBe('0%');
    });

    it('handles non-finite inputs', () => {
      expect(formatDelta(Number.NaN)).toBe('\u2014');
    });
  });

  describe('truncateMiddle', () => {
    it('truncates long strings and respects ellipsis length', () => {
      expect(truncateMiddle('short', 10)).toBe('short');
      expect(truncateMiddle('very-long-filename.txt', 15)).toBe('very-l...me.txt');
      expect(truncateMiddle('abcdef', 2, '...')).toBe('ab');
    });
  });

  describe('truncateEnd', () => {
    it('truncates long strings and respects ellipsis length', () => {
      expect(truncateEnd('short', 10)).toBe('short');
      expect(truncateEnd('very long filename', 12)).toBe('very long...');
      expect(truncateEnd('abcdef', 2, '...')).toBe('ab');
    });
  });
});
