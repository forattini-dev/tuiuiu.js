import { describe, expect, it } from 'vitest';

import {
  parsePerformanceBudgetScale,
  performanceBudget,
  performanceBudgetScale,
} from './_shared/performance-budget.js';

describe('Performance benchmark budgets', () => {
  it('keeps local budgets unchanged when no scale is configured', () => {
    expect(parsePerformanceBudgetScale(undefined)).toBe(1);
  });

  it('accepts an explicit bounded hosted-runner scale', () => {
    expect(parsePerformanceBudgetScale('1.25')).toBe(1.25);
  });

  it.each(['', '0.99', '2.01', 'NaN', 'Infinity', 'not-a-number'])(
    'rejects an unsafe scale value: %s',
    (rawValue) => {
      expect(() => parsePerformanceBudgetScale(rawValue)).toThrow(
        'TUIUIU_PERF_BUDGET_SCALE must be a number between 1 and 2',
      );
    },
  );

  it('applies the configured scale to absolute time budgets', () => {
    expect(performanceBudget(10)).toBe(10 * performanceBudgetScale);
  });
});
