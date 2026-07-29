import { onTerminalFocusChange, readTerminalFocus } from './terminal-focus.js';
import {
  bindRuntimeScope,
  getDefaultRuntimeResource,
  getDefaultRuntimeScope,
  getRuntimeResource,
  getRuntimeScope,
  RUNTIME_RESOURCE_DISPOSE,
  type RuntimeScope,
} from './runtime-scope.js';

export type MotionQualityTier = 'full' | 'reduced' | 'skip';
export type MotionPresentationPressure = 'normal' | 'elevated' | 'critical';

export interface MotionRuntimeConfig {
  targetFps: number;
  reducedFps: number;
  unfocusedFps: number;
  frameBudgetMs: number;
  recoveryFrames: number;
  elevatedFrameBudgetFactor: number;
  criticalFrameBudgetFactor: number;
}

export interface MotionFrame {
  now: number;
  deltaMs: number;
  tier: MotionQualityTier;
  focused: boolean;
  budgetMs: number;
  targetFrameMs: number;
}

export interface MotionRuntimeState {
  config: MotionRuntimeConfig;
  qualityTier: MotionQualityTier;
  presentationPressure: MotionPresentationPressure;
  focused: boolean;
  targetFrameMs: number;
  recommendedPresentationIntervalMs: number;
  onBudgetStreak: number;
  pressureOnBudgetStreak: number;
}

export interface MotionIntervalOptions {
  pauseWhenUnfocused?: boolean;
}

type MotionFrameCallback = (frame: MotionFrame) => void;
type MotionIntervalCallback = (frame: MotionFrame) => void;

interface MotionIntervalSubscription {
  intervalMs: number;
  callback: MotionIntervalCallback;
  pauseWhenUnfocused: boolean;
  lastRunAt: number;
}

export interface MotionBudgetResult {
  totalMs: number;
  overBudget?: boolean;
  phaseOverrunCount?: number;
}

const DEFAULT_CONFIG: MotionRuntimeConfig = {
  targetFps: 60,
  reducedFps: 30,
  unfocusedFps: 10,
  frameBudgetMs: 16.67,
  recoveryFrames: 5,
  elevatedFrameBudgetFactor: 1,
  criticalFrameBudgetFactor: 2,
};

interface InternalMotionRuntimeState {
  config: MotionRuntimeConfig;
  qualityTier: MotionQualityTier;
  presentationPressure: MotionPresentationPressure;
  onBudgetStreak: number;
  pressureOnBudgetStreak: number;
  schedulerTimer: ReturnType<typeof setTimeout> | null;
  cleanupFocusSubscription: (() => void) | null;
  nextFrameRequestId: number;
  nextIntervalId: number;
  lastPresentationAt: number;
  frameCallbacks: Map<number, MotionFrameCallback>;
  intervalSubscriptions: Map<number, MotionIntervalSubscription>;
  prefersReducedMotion: boolean;
  scope: RuntimeScope;
  [RUNTIME_RESOURCE_DISPOSE](): void;
}

const MOTION_RUNTIME_STATE = Symbol('tuiuiu.motion-runtime-state');

function createMotionRuntimeState(scope: RuntimeScope): InternalMotionRuntimeState {
  const defaults = scope.id === 0
    ? null
    : getDefaultRuntimeResource(
        MOTION_RUNTIME_STATE,
        () => createMotionRuntimeState(getDefaultRuntimeScope()),
      );
  const state: InternalMotionRuntimeState = {
    config: { ...(defaults?.config ?? DEFAULT_CONFIG) },
    qualityTier: 'full',
    presentationPressure: 'normal',
    onBudgetStreak: 0,
    pressureOnBudgetStreak: 0,
    schedulerTimer: null,
    cleanupFocusSubscription: null,
    nextFrameRequestId: 1,
    nextIntervalId: 1,
    lastPresentationAt: 0,
    frameCallbacks: new Map(),
    intervalSubscriptions: new Map(),
    prefersReducedMotion: defaults?.prefersReducedMotion ?? false,
    scope,
    [RUNTIME_RESOURCE_DISPOSE]() {
      clearSchedulerTimer(state);
      state.cleanupFocusSubscription?.();
      state.cleanupFocusSubscription = null;
      state.frameCallbacks.clear();
      state.intervalSubscriptions.clear();
    },
  };
  return state;
}

function getInternalMotionRuntimeState(): InternalMotionRuntimeState {
  const scope = getRuntimeScope();
  return getRuntimeResource(
    MOTION_RUNTIME_STATE,
    () => createMotionRuntimeState(scope),
    scope,
  );
}

function clampPositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.round(value));
}

function clampPositiveNumber(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0.1, value);
}

function getRecommendedPresentationIntervalMs(
  state: InternalMotionRuntimeState,
): number {
  switch (state.presentationPressure) {
    case 'elevated':
      return state.config.frameBudgetMs * state.config.elevatedFrameBudgetFactor;
    case 'critical':
      return state.config.frameBudgetMs * state.config.criticalFrameBudgetFactor;
    case 'normal':
    default:
      return 0;
  }
}

function hasPendingWork(state: InternalMotionRuntimeState): boolean {
  return state.frameCallbacks.size > 0 || state.intervalSubscriptions.size > 0;
}

function ensureFocusSubscription(state: InternalMotionRuntimeState): void {
  if (state.cleanupFocusSubscription) {
    return;
  }

  state.cleanupFocusSubscription = onTerminalFocusChange(bindRuntimeScope(state.scope, (focused) => {
    if (focused) {
      const resumedAt = Date.now();
      for (const subscription of state.intervalSubscriptions.values()) {
        if (subscription.pauseWhenUnfocused) {
          subscription.lastRunAt = resumedAt;
        }
      }
    }
    rescheduleMotionRuntime(state);
  }));
}

function getTargetFrameMs(
  state: InternalMotionRuntimeState,
  focused = readTerminalFocus(state.scope),
): number {
  if (!focused) {
    return 1000 / state.config.unfocusedFps;
  }

  switch (state.qualityTier) {
    case 'reduced':
      return 1000 / state.config.reducedFps;
    case 'skip':
      return 0;
    case 'full':
    default:
      return 1000 / state.config.targetFps;
  }
}

function createMotionFrame(
  state: InternalMotionRuntimeState,
  now: number,
  targetFrameMs: number,
  deltaMs: number,
): MotionFrame {
  return {
    now,
    deltaMs,
    tier: state.qualityTier,
    focused: readTerminalFocus(state.scope),
    budgetMs: state.config.frameBudgetMs,
    targetFrameMs,
  };
}

function computeNextDelay(
  state: InternalMotionRuntimeState,
  now: number,
): number | null {
  const focused = readTerminalFocus(state.scope);
  let nextDelay = Number.POSITIVE_INFINITY;

  if (state.frameCallbacks.size > 0) {
    const targetFrameMs = getTargetFrameMs(state, focused);
    const elapsed = state.lastPresentationAt === 0
      ? 0
      : now - state.lastPresentationAt;
    nextDelay = Math.min(nextDelay, Math.max(0, targetFrameMs - elapsed));
  }

  for (const subscription of state.intervalSubscriptions.values()) {
    if (!focused && subscription.pauseWhenUnfocused) {
      continue;
    }

    const elapsed = now - subscription.lastRunAt;
    nextDelay = Math.min(nextDelay, Math.max(0, subscription.intervalMs - elapsed));
  }

  if (!Number.isFinite(nextDelay)) {
    return null;
  }

  return Math.ceil(nextDelay);
}

function clearSchedulerTimer(state: InternalMotionRuntimeState): void {
  if (!state.schedulerTimer) {
    return;
  }

  clearTimeout(state.schedulerTimer);
  state.schedulerTimer = null;
}

function scheduleMotionRuntime(state: InternalMotionRuntimeState): void {
  if (state.schedulerTimer || !hasPendingWork(state)) {
    return;
  }

  ensureFocusSubscription(state);
  const delay = computeNextDelay(state, Date.now());
  if (delay === null) {
    return;
  }

  state.schedulerTimer = setTimeout(
    bindRuntimeScope(state.scope, () => flushMotionRuntime(state)),
    delay,
  );
}

function flushMotionRuntime(state: InternalMotionRuntimeState): void {
  state.schedulerTimer = null;
  if (!hasPendingWork(state)) {
    return;
  }

  const now = Date.now();
  const focused = readTerminalFocus(state.scope);
  const targetFrameMs = getTargetFrameMs(state, focused);
  const elapsedSincePresentation = state.lastPresentationAt === 0
    ? targetFrameMs
    : now - state.lastPresentationAt;

  if (
    state.frameCallbacks.size > 0 &&
    elapsedSincePresentation >= targetFrameMs
  ) {
    state.lastPresentationAt = now;
    const callbacks = [...state.frameCallbacks.values()];
    state.frameCallbacks.clear();
    const frame = createMotionFrame(
      state,
      now,
      targetFrameMs,
      targetFrameMs === 0 ? 0 : Math.max(targetFrameMs, elapsedSincePresentation),
    );

    for (const callback of callbacks) {
      callback(frame);
    }
  }

  for (const subscription of state.intervalSubscriptions.values()) {
    if (!focused && subscription.pauseWhenUnfocused) {
      continue;
    }

    const elapsed = now - subscription.lastRunAt;
    if (elapsed < subscription.intervalMs) {
      continue;
    }

    subscription.lastRunAt = now;
    subscription.callback(
      createMotionFrame(
        state,
        now,
        targetFrameMs,
        Math.max(subscription.intervalMs, elapsed),
      ),
    );
  }

  scheduleMotionRuntime(state);
}

function rescheduleMotionRuntime(state: InternalMotionRuntimeState): void {
  clearSchedulerTimer(state);
  scheduleMotionRuntime(state);
}

export function configureMotionRuntime(options: Partial<MotionRuntimeConfig>): void {
  const state = getInternalMotionRuntimeState();
  const nextTargetFps = clampPositiveInteger(
    options.targetFps ?? state.config.targetFps,
    DEFAULT_CONFIG.targetFps,
  );
  const nextReducedFps = clampPositiveInteger(
    options.reducedFps ?? state.config.reducedFps,
    Math.max(1, Math.floor(nextTargetFps / 2)),
  );

  state.config = {
    targetFps: nextTargetFps,
    reducedFps: Math.min(nextTargetFps, nextReducedFps),
    unfocusedFps: clampPositiveInteger(
      options.unfocusedFps ?? state.config.unfocusedFps,
      DEFAULT_CONFIG.unfocusedFps,
    ),
    frameBudgetMs: clampPositiveNumber(
      options.frameBudgetMs ?? state.config.frameBudgetMs,
      DEFAULT_CONFIG.frameBudgetMs,
    ),
    recoveryFrames: clampPositiveInteger(
      options.recoveryFrames ?? state.config.recoveryFrames,
      DEFAULT_CONFIG.recoveryFrames,
    ),
    elevatedFrameBudgetFactor: clampPositiveNumber(
      options.elevatedFrameBudgetFactor ?? state.config.elevatedFrameBudgetFactor,
      DEFAULT_CONFIG.elevatedFrameBudgetFactor,
    ),
    criticalFrameBudgetFactor: clampPositiveNumber(
      options.criticalFrameBudgetFactor ?? state.config.criticalFrameBudgetFactor,
      DEFAULT_CONFIG.criticalFrameBudgetFactor,
    ),
  };

  rescheduleMotionRuntime(state);
}

export function getMotionRuntimeState(): MotionRuntimeState {
  const state = getInternalMotionRuntimeState();
  return {
    config: { ...state.config },
    qualityTier: state.qualityTier,
    presentationPressure: state.presentationPressure,
    focused: readTerminalFocus(state.scope),
    targetFrameMs: getTargetFrameMs(state),
    recommendedPresentationIntervalMs:
      getRecommendedPresentationIntervalMs(state),
    onBudgetStreak: state.onBudgetStreak,
    pressureOnBudgetStreak: state.pressureOnBudgetStreak,
  };
}

function escalatePresentationPressure(state: InternalMotionRuntimeState): void {
  state.pressureOnBudgetStreak = 0;
  if (state.presentationPressure === 'normal') {
    state.presentationPressure = 'elevated';
    return;
  }
  if (state.presentationPressure === 'elevated') {
    state.presentationPressure = 'critical';
  }
}

function recoverPresentationPressure(state: InternalMotionRuntimeState): void {
  if (state.presentationPressure === 'normal') {
    state.pressureOnBudgetStreak = 0;
    return;
  }

  state.pressureOnBudgetStreak++;
  if (state.pressureOnBudgetStreak < state.config.recoveryFrames) {
    return;
  }

  if (state.presentationPressure === 'critical') {
    state.presentationPressure = 'elevated';
  } else {
    state.presentationPressure = 'normal';
  }
  state.pressureOnBudgetStreak = 0;
}

export function reportMotionBudgetResult(result: MotionBudgetResult): MotionQualityTier {
  const state = getInternalMotionRuntimeState();
  if (!Number.isFinite(result.totalMs) || result.totalMs < 0) {
    return state.qualityTier;
  }

  const totalOverBudget =
    result.overBudget ?? result.totalMs > state.config.frameBudgetMs;
  const hasPhaseOverrun = (result.phaseOverrunCount ?? 0) > 0;

  if (totalOverBudget) {
    state.onBudgetStreak = 0;
    if (state.qualityTier === 'full') {
      state.qualityTier = 'reduced';
    } else if (state.qualityTier === 'reduced') {
      state.qualityTier = 'skip';
    }
    rescheduleMotionRuntime(state);
  } else {
    state.onBudgetStreak++;
    if (state.onBudgetStreak >= state.config.recoveryFrames) {
      if (state.qualityTier === 'skip') {
        state.qualityTier = 'reduced';
        state.onBudgetStreak = 0;
      } else if (state.qualityTier === 'reduced') {
        state.qualityTier = 'full';
        state.onBudgetStreak = 0;
      }
    }
  }

  if (totalOverBudget || hasPhaseOverrun) {
    escalatePresentationPressure(state);
  } else {
    recoverPresentationPressure(state);
  }

  rescheduleMotionRuntime(state);
  return state.qualityTier;
}

export function reportMotionFrameCost(frameMs: number): MotionQualityTier {
  return reportMotionBudgetResult({ totalMs: frameMs });
}

export function requestMotionFrame(callback: MotionFrameCallback): () => void {
  const state = getInternalMotionRuntimeState();
  const requestId = state.nextFrameRequestId++;
  state.frameCallbacks.set(requestId, callback);
  scheduleMotionRuntime(state);

  return () => {
    state.frameCallbacks.delete(requestId);
    if (!hasPendingWork(state)) {
      clearSchedulerTimer(state);
    }
  };
}

export function cancelAllMotionFrames(): void {
  const state = getInternalMotionRuntimeState();
  state.frameCallbacks.clear();
  if (!hasPendingWork(state)) {
    clearSchedulerTimer(state);
  } else {
    rescheduleMotionRuntime(state);
  }
}

export function subscribeMotionInterval(
  intervalMs: number,
  callback: MotionIntervalCallback,
  options: MotionIntervalOptions = {},
): () => void {
  const state = getInternalMotionRuntimeState();
  const subscriptionId = state.nextIntervalId++;
  state.intervalSubscriptions.set(subscriptionId, {
    intervalMs: clampPositiveNumber(intervalMs, 16),
    callback,
    pauseWhenUnfocused: options.pauseWhenUnfocused ?? false,
    lastRunAt: Date.now(),
  });
  scheduleMotionRuntime(state);

  return () => {
    state.intervalSubscriptions.delete(subscriptionId);
    if (!hasPendingWork(state)) {
      clearSchedulerTimer(state);
    } else {
      rescheduleMotionRuntime(state);
    }
  };
}

export function resetMotionRuntime(): void {
  const state = getInternalMotionRuntimeState();
  clearSchedulerTimer(state);
  state.cleanupFocusSubscription?.();
  state.cleanupFocusSubscription = null;
  state.frameCallbacks.clear();
  state.intervalSubscriptions.clear();
  state.config = { ...DEFAULT_CONFIG };
  state.qualityTier = 'full';
  state.presentationPressure = 'normal';
  state.onBudgetStreak = 0;
  state.pressureOnBudgetStreak = 0;
  state.lastPresentationAt = 0;
  state.nextFrameRequestId = 1;
  state.nextIntervalId = 1;
  state.prefersReducedMotion = false;
}

// =============================================================================
// Reduced Motion Preference
// =============================================================================

/**
 * Set the reduced motion preference.
 * When enabled, animation-heavy components should fall back to static rendering.
 *
 * @example
 * setPrefersReducedMotion(true); // Disable animations globally
 */
export function setPrefersReducedMotion(value: boolean): void {
  getInternalMotionRuntimeState().prefersReducedMotion = value;
}

/**
 * Get the current reduced motion preference.
 */
export function getPrefersReducedMotion(): boolean {
  return getInternalMotionRuntimeState().prefersReducedMotion;
}
