import type { FramePhaseMetrics, FrameSnapshot, FrameStructuralMetrics } from './frame.js';
import { reportMotionBudgetResult } from './motion-runtime.js';
import {
  getDefaultRuntimeResource,
  getDefaultRuntimeScope,
  getRuntimeResource,
  getRuntimeScope,
  type RuntimeScope,
} from './runtime-scope.js';

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

interface PerfInspectorRuntimeState {
  config: PerfInspectorConfig;
  ring: Array<PerfFrameRecord | undefined>;
  start: number;
  count: number;
  slowFrameListeners: Set<(frame: PerfFrameRecord) => void>;
}

const PERF_INSPECTOR_RUNTIME_STATE =
  Symbol('tuiuiu.perf-inspector-runtime-state');

function clonePerfConfig(config: PerfInspectorConfig): PerfInspectorConfig {
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

function createPerfInspectorRuntimeState(
  scope: RuntimeScope,
): PerfInspectorRuntimeState {
  const defaults = scope.id === 0
    ? null
    : getDefaultRuntimeResource(
        PERF_INSPECTOR_RUNTIME_STATE,
        () => createPerfInspectorRuntimeState(getDefaultRuntimeScope()),
      );
  const config = clonePerfConfig(defaults?.config ?? DEFAULT_PERF_CONFIG);
  return {
    config,
    ring: new Array(config.maxFrames),
    start: 0,
    count: 0,
    slowFrameListeners: new Set(),
  };
}

function getPerfInspectorRuntimeState(): PerfInspectorRuntimeState {
  const scope = getRuntimeScope();
  return getRuntimeResource(
    PERF_INSPECTOR_RUNTIME_STATE,
    () => createPerfInspectorRuntimeState(scope),
    scope,
  );
}

function clampMaxFrames(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PERF_CONFIG.maxFrames;
  }
  return Math.max(1, Math.floor(value));
}

function getFrameTotalMs(frame: FrameSnapshot): number {
  return frame.metrics.runtimeTotalMs ?? frame.metrics.totalFrameMs;
}

function resizeRing(state: PerfInspectorRuntimeState, nextSize: number): void {
  const frames = getPerfFrames().slice(-nextSize);
  state.ring = new Array(nextSize);
  state.start = 0;
  state.count = frames.length;

  for (let index = 0; index < frames.length; index++) {
    state.ring[index] = frames[index];
  }
}

function pushFrame(
  state: PerfInspectorRuntimeState,
  record: PerfFrameRecord,
): void {
  if (state.ring.length !== state.config.maxFrames) {
    resizeRing(state, state.config.maxFrames);
  }

  const index = (state.start + state.count) % state.ring.length;
  state.ring[index] = record;

  if (state.count < state.ring.length) {
    state.count++;
    return;
  }

  state.start = (state.start + 1) % state.ring.length;
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
  const state = getPerfInspectorRuntimeState();
  const nextMaxFrames = options.maxFrames === undefined
    ? state.config.maxFrames
    : clampMaxFrames(options.maxFrames);

  state.config = {
    enabled: options.enabled ?? state.config.enabled,
    maxFrames: nextMaxFrames,
    budget: {
      frameMs: options.budget?.frameMs ?? state.config.budget.frameMs,
      slowFrameMs:
        options.budget?.slowFrameMs ?? state.config.budget.slowFrameMs,
      phases: options.budget?.phases
        ? { ...options.budget.phases }
        : { ...state.config.budget.phases },
    },
  };

  if (state.ring.length !== nextMaxFrames) {
    resizeRing(state, nextMaxFrames);
  }
}

export function getPerfInspectorConfig(): Readonly<PerfInspectorConfig> {
  return clonePerfConfig(getPerfInspectorRuntimeState().config);
}

export function onSlowFrame(listener: (frame: PerfFrameRecord) => void): () => void {
  const state = getPerfInspectorRuntimeState();
  state.slowFrameListeners.add(listener);
  return () => {
    state.slowFrameListeners.delete(listener);
  };
}

export function resetPerfInspector(): void {
  const state = getPerfInspectorRuntimeState();
  state.config = clonePerfConfig(DEFAULT_PERF_CONFIG);
  state.ring = new Array(state.config.maxFrames);
  state.start = 0;
  state.count = 0;
  state.slowFrameListeners.clear();
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
  const state = getPerfInspectorRuntimeState();
  const totalMs = getFrameTotalMs(frame);
  const budgetOverrunMs = Math.max(0, totalMs - state.config.budget.frameMs);
  const phaseBudgetOverruns = getPhaseBudgetOverruns(
    frame.metrics.phases,
    state.config.budget.phases,
  );
  const overBudgetPhaseCount = Object.keys(phaseBudgetOverruns).length;
  const slow = totalMs >= state.config.budget.slowFrameMs;
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

  if (!state.config.enabled) {
    return null;
  }

  pushFrame(state, record);

  if (slow) {
    for (const listener of [...state.slowFrameListeners]) {
      listener(record);
    }
  }

  return record;
}

export function getPerfFrames(): PerfFrameRecord[] {
  const state = getPerfInspectorRuntimeState();
  const frames: PerfFrameRecord[] = [];

  for (let index = 0; index < state.count; index++) {
    const entry =
      state.ring[(state.start + index) % state.ring.length];
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
