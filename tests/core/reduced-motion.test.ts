/**
 * Tests for Reduced Motion Preference
 *
 * Tests setPrefersReducedMotion, getPrefersReducedMotion from motion-runtime.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  setPrefersReducedMotion,
  getPrefersReducedMotion,
  resetMotionRuntime,
} from '../../src/core/motion-runtime.js';

describe('Reduced Motion Preference', () => {
  beforeEach(() => {
    resetMotionRuntime();
  });

  it('defaults to false', () => {
    expect(getPrefersReducedMotion()).toBe(false);
  });

  it('returns true after setPrefersReducedMotion(true)', () => {
    setPrefersReducedMotion(true);
    expect(getPrefersReducedMotion()).toBe(true);
  });

  it('returns false after setPrefersReducedMotion(false)', () => {
    setPrefersReducedMotion(true);
    expect(getPrefersReducedMotion()).toBe(true);

    setPrefersReducedMotion(false);
    expect(getPrefersReducedMotion()).toBe(false);
  });

  it('can be toggled multiple times', () => {
    setPrefersReducedMotion(true);
    expect(getPrefersReducedMotion()).toBe(true);

    setPrefersReducedMotion(false);
    expect(getPrefersReducedMotion()).toBe(false);

    setPrefersReducedMotion(true);
    expect(getPrefersReducedMotion()).toBe(true);
  });

  it('resetMotionRuntime resets the preference to false', () => {
    setPrefersReducedMotion(true);
    expect(getPrefersReducedMotion()).toBe(true);

    resetMotionRuntime();
    expect(getPrefersReducedMotion()).toBe(false);
  });

  it('resetMotionRuntime resets even after multiple toggles', () => {
    setPrefersReducedMotion(true);
    setPrefersReducedMotion(false);
    setPrefersReducedMotion(true);

    resetMotionRuntime();
    expect(getPrefersReducedMotion()).toBe(false);
  });

  it('setting the same value multiple times is idempotent', () => {
    setPrefersReducedMotion(true);
    setPrefersReducedMotion(true);
    setPrefersReducedMotion(true);
    expect(getPrefersReducedMotion()).toBe(true);

    setPrefersReducedMotion(false);
    setPrefersReducedMotion(false);
    expect(getPrefersReducedMotion()).toBe(false);
  });
});
