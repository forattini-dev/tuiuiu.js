/**
 * Tests for threshold color utilities.
 */

import { describe, it, expect } from 'vitest';
import { createSignal } from '../../src/primitives/signal.js';
import { resolveColor } from '../../src/core/theme.js';
import {
  useThresholdColor,
  getThresholdColor,
  getThresholdColorName,
} from '../../src/hooks/use-threshold-color.js';

describe('useThresholdColor', () => {
  it('resolves built-in threshold colors reactively', () => {
    const [value, setValue] = createSignal(10);
    const thresholds = {
      success: [0, 20],
      error: [21, 100],
    } as const;

    const color = useThresholdColor(value, thresholds);
    expect(color()).toBe(resolveColor('success'));

    setValue(30);
    expect(color()).toBe(resolveColor('error'));
  });

  it('handles custom ranges and defaults', () => {
    const thresholds = { custom: [0, 10] } as const;

    expect(getThresholdColorName(5, thresholds, 'muted')).toBe('custom');
    expect(getThresholdColorName(50, thresholds, 'muted')).toBe('muted');

    expect(getThresholdColor(5, thresholds, 'muted')).toBe(resolveColor('custom'));
    expect(getThresholdColor(50, thresholds, 'muted')).toBe(resolveColor('muted'));
  });
});
