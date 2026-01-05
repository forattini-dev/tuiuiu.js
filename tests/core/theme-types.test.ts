/**
 * Tests for theme type helpers.
 */

import { describe, it, expect } from 'vitest';
import { getShade } from '../../src/core/theme-types.js';

describe('theme-types', () => {
  it('returns shade values from a scale', () => {
    const scale = {
      50: 'a',
      100: 'b',
      200: 'c',
      300: 'd',
      400: 'e',
      500: 'f',
      600: 'g',
      700: 'h',
      800: 'i',
      900: 'j',
    };

    expect(getShade(scale)).toBe('f');
    expect(getShade(scale, 100)).toBe('b');
  });
});
