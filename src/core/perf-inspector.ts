import type { FramePhaseMetrics, FrameSnapshot, FrameStructuralMetrics } from './frame.js';
import { reportMotionBudgetResult } from './motion-runtime.js';

export type PerfRendererKind = 'ansi' | 'delta';
export type PerfPhaseBudgetKey = keyof FramePhaseMetrics;
export type PerfPhaseBudgetMap = Partial<Record<PerfPhaseBudgetKey, number>>;

export interface PerfFrameRecord {
  frameId: number;
  committedAt: number;
  renderer: PerfRendererKind;
  totalMs: number;
  budgetOverrunMs: number;
  phaseBudgetOverruns: PerfPhaseBudgetMap;
  overBudgetPhaseCount: number;
  slow: boolean;
  phases: FramePhaseMetrics;
  structural: FrameStructuralMetrics;
}

export interface PerfBudgetConfig {
  frameMs: number;
  slowFrameMs: number;
  phases?: PerfPhaseBudgetMap;
}

export interface PerfInspectorConfig {
  enabled: boolean;
  maxFrames: number;
  budget: PerfBudgetConfig;
}

export interface PerfInspectorSummary {
  frameCount: number;
  slowFrameCount: number;
  overBudgetCount: number;
  overBudgetPhaseCounts: Partial<Record<PerfPhaseBudgetKey, number>>;
  averageFrameMs: number;
  minFrameMs: number;
  maxFrameMs: number;
  p95FrameMs: number;
  averageOutputBytes: number;
  averagePatchCount: number;
  phaseAverages: Partial<Record<keyof FramePhaseMetrics, number>>;
  lastFrame?: PerfFrameRecord;
}

export interface RecordPerfFrameOptions {
  renderer?: PerfRendererKind;
}

const DEFAULT_PERF_CONFIG: PerfInspectorConfig = {
  enabled: true,
  maxFrames: 120,
  budget: {
    frameMs: 16.67,
    slowFrameMs: 33.34,
    phases: {},
  },
};

let config: PerfInspectorConfig = {
  enabled: DEFAULT_PERF_CONFIG.enabled,
  maxFrames: DEFAULT_PERF_CONFIG.maxFrames,
  budget: { ...DEFAULT_PERF_CONFIG.budget },
};

let ring: Array<PerfFrameRecord | undefined> = new Array(DEFAULT_PERF_CONFIG.maxFrames);
let start = 0;
let count = 0;

const slowFrameListeners = new Set<(frame: PerfFrameRecord) => void>();

function clampMaxFrames(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PERF_CONFIG.maxFrames;
  }
  return Math.max(1, Math.floor(value));
}

function getFrameTotalMs(frame: FrameSnapshot): number {
  return frame.metrics.runtimeTotalMs ?? frame.metrics.totalFrameMs;
}

function resizeRing(nextSize: number): void {
  const frames = getPerfFrames().slice(-nextSize);
  ring = new Array(nextSize);
  start = 0;
  count = frames.length;

  for (let index = 0; index < frames.length; index++) {
    ring[index] = frames[index];
  }
}

function pushFrame(record: PerfFrameRecord): void {
  if (ring.length !== config.maxFrames) {
    resizeRing(config.maxFrames);
  }

  const index = (start + count) % ring.length;
  ring[index] = record;

  if (count < ring.length) {
    count++;
    return;
  }

  start = (start + 1) % ring.length;
}

function getAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getP95(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1));
  return sorted[index] ?? 0;
}

export function configurePerfInspector(options: Partial<PerfInspectorConfig>): void {
  const nextMaxFrames = options.maxFrames === undefined ? config.maxFrames : clampMaxFrames(options.maxFrames);

  config = {
    enabled: options.enabled ?? config.enabled,
    maxFrames: nextMaxFrames,
    budget: {
      frameMs: options.budget?.frameMs ?? config.budget.frameMs,
      slowFrameMs: options.budget?.slowFrameMs ?? config.budget.slowFrameMs,
      phases: options.budget?.phases
        ? { ...options.budget.phases }
        : { ...config.budget.phases },
    },
  };

  if (ring.length !== nextMaxFrames) {
    resizeRing(nextMaxFrames);
  }
}

export function getPerfInspectorConfig(): Readonly<PerfInspectorConfig> {
  return {
    enabled: config.enabled,
    maxFrames: config.maxFrames,
    budget: {
      frameMs: config.budget.frameMs,
      slowFrameMs: config.budget.slowFrameMs,
      phases: { ...config.budget.phases },
    },
  };
}

export function onSlowFrame(listener: (frame: PerfFrameRecord) => void): () => void {
  slowFrameListeners.add(listener);
  return () => {
    slowFrameListeners.delete(listener);
  };
}

export function resetPerfInspector(): void {
  config = {
    enabled: DEFAULT_PERF_CONFIG.enabled,
    maxFrames: DEFAULT_PERF_CONFIG.maxFrames,
    budget: {
      frameMs: DEFAULT_PERF_CONFIG.budget.frameMs,
      slowFrameMs: DEFAULT_PERF_CONFIG.budget.slowFrameMs,
      phases: {},
    },
  };
  ring = new Array(config.maxFrames);
  start = 0;
  count = 0;
  slowFrameListeners.clear();
}

function getPhaseBudgetOverruns(
  phases: FramePhaseMetrics,
  budgets: PerfPhaseBudgetMap | undefined,
): PerfPhaseBudgetMap {
  const overruns: PerfPhaseBudgetMap = {};
  if (!budgets) {
    return overruns;
  }

  for (const [phase, budget] of Object.entries(budgets) as Array<[PerfPhaseBudgetKey, number]>) {
    if (!Number.isFinite(budget) || budget < 0) {
      continue;
    }

    const actual = phases[phase];
    if (typeof actual !== 'number') {
      continue;
    }

    const overrun = actual - budget;
    if (overrun > 0) {
      overruns[phase] = overrun;
    }
  }

  return overruns;
}

export function recordCommittedFrame(
  frame: FrameSnapshot,
  options: RecordPerfFrameOptions = {},
): PerfFrameRecord | null {
  const totalMs = getFrameTotalMs(frame);
  const budgetOverrunMs = Math.max(0, totalMs - config.budget.frameMs);
  const phaseBudgetOverruns = getPhaseBudgetOverruns(frame.metrics.phases, config.budget.phases);
  const overBudgetPhaseCount = Object.keys(phaseBudgetOverruns).length;
  const slow = totalMs >= config.budget.slowFrameMs;
  reportMotionBudgetResult({
    totalMs,
    overBudget: budgetOverrunMs > 0,
    phaseOverrunCount: overBudgetPhaseCount,
  });

  const record: PerfFrameRecord = {
    frameId: frame.info.frameId,
    committedAt: frame.info.committedAt,
    renderer:
      options.renderer ??
      (frame.metrics.phases.deltaRenderMs !== undefined ? 'delta' : 'ansi'),
    totalMs,
    budgetOverrunMs,
    phaseBudgetOverruns,
    overBudgetPhaseCount,
    slow,
    phases: { ...frame.metrics.phases },
    structural: { ...frame.metrics.structural },
  };

  if (!config.enabled) {
    return null;
  }

  pushFrame(record);

  if (slow) {
    for (const listener of slowFrameListeners) {
      listener(record);
    }
  }

  return record;
}

export function getPerfFrames(): PerfFrameRecord[] {
  const frames: PerfFrameRecord[] = [];

  for (let index = 0; index < count; index++) {
    const entry = ring[(start + index) % ring.length];
    if (entry) {
      frames.push(entry);
    }
  }

  return frames;
}

export function getPerfInspectorSummary(): PerfInspectorSummary {
  const frames = getPerfFrames();
  const durations = frames.map((frame) => frame.totalMs);
  const outputBytes = frames.map((frame) => frame.structural.outputByteCount);
  const patchCounts = frames.map((frame) => frame.structural.patchCount);
  const slowFrameCount = frames.filter((frame) => frame.slow).length;
  const overBudgetCount = frames.filter((frame) => frame.budgetOverrunMs > 0).length;
  const overBudgetPhaseCounts: Partial<Record<PerfPhaseBudgetKey, number>> = {};
  const phaseKeys = new Set<keyof FramePhaseMetrics>();

  for (const frame of frames) {
    for (const key of Object.keys(frame.phases) as Array<keyof FramePhaseMetrics>) {
      phaseKeys.add(key);
    }

    for (const key of Object.keys(frame.phaseBudgetOverruns) as PerfPhaseBudgetKey[]) {
      overBudgetPhaseCounts[key] = (overBudgetPhaseCounts[key] ?? 0) + 1;
    }
  }

  const phaseAverages: Partial<Record<keyof FramePhaseMetrics, number>> = {};
  for (const key of phaseKeys) {
    const samples = frames
      .map((frame) => frame.phases[key])
      .filter((value): value is number => typeof value === 'number');

    if (samples.length > 0) {
      phaseAverages[key] = getAverage(samples);
    }
  }

  return {
    frameCount: frames.length,
    slowFrameCount,
    overBudgetCount,
    overBudgetPhaseCounts,
    averageFrameMs: getAverage(durations),
    minFrameMs: durations.length > 0 ? Math.min(...durations) : 0,
    maxFrameMs: durations.length > 0 ? Math.max(...durations) : 0,
    p95FrameMs: getP95(durations),
    averageOutputBytes: getAverage(outputBytes),
    averagePatchCount: getAverage(patchCounts),
    phaseAverages,
    lastFrame: frames[frames.length - 1],
  };
}
