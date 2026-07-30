const DEFAULT_PERFORMANCE_BUDGET_SCALE = 1;
const MAX_PERFORMANCE_BUDGET_SCALE = 2;

export function parsePerformanceBudgetScale(rawValue: string | undefined): number {
  if (rawValue === undefined) {
    return DEFAULT_PERFORMANCE_BUDGET_SCALE;
  }

  const scale = Number(rawValue);
  if (
    rawValue.trim() === '' ||
    !Number.isFinite(scale) ||
    scale < DEFAULT_PERFORMANCE_BUDGET_SCALE ||
    scale > MAX_PERFORMANCE_BUDGET_SCALE
  ) {
    throw new Error(
      `TUIUIU_PERF_BUDGET_SCALE must be a number between ${DEFAULT_PERFORMANCE_BUDGET_SCALE} and ${MAX_PERFORMANCE_BUDGET_SCALE}; received ${JSON.stringify(rawValue)}`,
    );
  }

  return scale;
}

export const performanceBudgetScale = parsePerformanceBudgetScale(
  process.env.TUIUIU_PERF_BUDGET_SCALE,
);

export const shouldSkipPerformanceBenchmarks =
  process.env.CI === 'true' &&
  process.env.TUIUIU_RUN_BENCHMARKS !== 'true';

export function performanceBudget(localBudgetMs: number): number {
  return localBudgetMs * performanceBudgetScale;
}
