import { onTerminalFocusChange, readTerminalFocus } from './terminal-focus.js';

export type MotionQualityTier = 'full' | 'reduced' | 'skip';

export interface MotionRuntimeConfig {
  targetFps: number;
  reducedFps: number;
  unfocusedFps: number;
  frameBudgetMs: number;
  recoveryFrames: number;
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
  focused: boolean;
  targetFrameMs: number;
  onBudgetStreak: number;
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

const DEFAULT_CONFIG: MotionRuntimeConfig = {
  targetFps: 60,
  reducedFps: 30,
  unfocusedFps: 10,
  frameBudgetMs: 16.67,
  recoveryFrames: 5,
};

let config: MotionRuntimeConfig = { ...DEFAULT_CONFIG };
let qualityTier: MotionQualityTier = 'full';
let onBudgetStreak = 0;
let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
let cleanupFocusSubscription: (() => void) | null = null;
let nextFrameRequestId = 1;
let nextIntervalId = 1;
let lastPresentationAt = 0;

const frameCallbacks = new Map<number, MotionFrameCallback>();
const intervalSubscriptions = new Map<number, MotionIntervalSubscription>();

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

function hasPendingWork(): boolean {
  return frameCallbacks.size > 0 || intervalSubscriptions.size > 0;
}

function ensureFocusSubscription(): void {
  if (cleanupFocusSubscription) {
    return;
  }

  cleanupFocusSubscription = onTerminalFocusChange((focused) => {
    if (focused) {
      const resumedAt = Date.now();
      for (const subscription of intervalSubscriptions.values()) {
        if (subscription.pauseWhenUnfocused) {
          subscription.lastRunAt = resumedAt;
        }
      }
    }
    rescheduleMotionRuntime();
  });
}

function getTargetFrameMs(focused = readTerminalFocus()): number {
  if (!focused) {
    return 1000 / config.unfocusedFps;
  }

  switch (qualityTier) {
    case 'reduced':
      return 1000 / config.reducedFps;
    case 'skip':
      return 0;
    case 'full':
    default:
      return 1000 / config.targetFps;
  }
}

function createMotionFrame(now: number, targetFrameMs: number, deltaMs: number): MotionFrame {
  return {
    now,
    deltaMs,
    tier: qualityTier,
    focused: readTerminalFocus(),
    budgetMs: config.frameBudgetMs,
    targetFrameMs,
  };
}

function computeNextDelay(now: number): number | null {
  const focused = readTerminalFocus();
  let nextDelay = Number.POSITIVE_INFINITY;

  if (frameCallbacks.size > 0) {
    const targetFrameMs = getTargetFrameMs(focused);
    const elapsed = lastPresentationAt === 0 ? 0 : now - lastPresentationAt;
    nextDelay = Math.min(nextDelay, Math.max(0, targetFrameMs - elapsed));
  }

  for (const subscription of intervalSubscriptions.values()) {
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

function clearSchedulerTimer(): void {
  if (!schedulerTimer) {
    return;
  }

  clearTimeout(schedulerTimer);
  schedulerTimer = null;
}

function scheduleMotionRuntime(): void {
  if (schedulerTimer || !hasPendingWork()) {
    return;
  }

  ensureFocusSubscription();
  const delay = computeNextDelay(Date.now());
  if (delay === null) {
    return;
  }

  schedulerTimer = setTimeout(flushMotionRuntime, delay);
}

function flushMotionRuntime(): void {
  schedulerTimer = null;
  if (!hasPendingWork()) {
    return;
  }

  const now = Date.now();
  const focused = readTerminalFocus();
  const targetFrameMs = getTargetFrameMs(focused);
  const elapsedSincePresentation = lastPresentationAt === 0 ? targetFrameMs : now - lastPresentationAt;

  if (frameCallbacks.size > 0 && elapsedSincePresentation >= targetFrameMs) {
    lastPresentationAt = now;
    const callbacks = [...frameCallbacks.values()];
    frameCallbacks.clear();
    const frame = createMotionFrame(
      now,
      targetFrameMs,
      targetFrameMs === 0 ? 0 : Math.max(targetFrameMs, elapsedSincePresentation),
    );

    for (const callback of callbacks) {
      callback(frame);
    }
  }

  for (const subscription of intervalSubscriptions.values()) {
    if (!focused && subscription.pauseWhenUnfocused) {
      continue;
    }

    const elapsed = now - subscription.lastRunAt;
    if (elapsed < subscription.intervalMs) {
      continue;
    }

    subscription.lastRunAt = now;
    subscription.callback(
      createMotionFrame(now, targetFrameMs, Math.max(subscription.intervalMs, elapsed)),
    );
  }

  scheduleMotionRuntime();
}

function rescheduleMotionRuntime(): void {
  clearSchedulerTimer();
  scheduleMotionRuntime();
}

export function configureMotionRuntime(options: Partial<MotionRuntimeConfig>): void {
  const nextTargetFps = clampPositiveInteger(
    options.targetFps ?? config.targetFps,
    DEFAULT_CONFIG.targetFps,
  );
  const nextReducedFps = clampPositiveInteger(
    options.reducedFps ?? config.reducedFps,
    Math.max(1, Math.floor(nextTargetFps / 2)),
  );

  config = {
    targetFps: nextTargetFps,
    reducedFps: Math.min(nextTargetFps, nextReducedFps),
    unfocusedFps: clampPositiveInteger(
      options.unfocusedFps ?? config.unfocusedFps,
      DEFAULT_CONFIG.unfocusedFps,
    ),
    frameBudgetMs: clampPositiveNumber(
      options.frameBudgetMs ?? config.frameBudgetMs,
      DEFAULT_CONFIG.frameBudgetMs,
    ),
    recoveryFrames: clampPositiveInteger(
      options.recoveryFrames ?? config.recoveryFrames,
      DEFAULT_CONFIG.recoveryFrames,
    ),
  };

  rescheduleMotionRuntime();
}

export function getMotionRuntimeState(): MotionRuntimeState {
  return {
    config: { ...config },
    qualityTier,
    focused: readTerminalFocus(),
    targetFrameMs: getTargetFrameMs(),
    onBudgetStreak,
  };
}

export function reportMotionFrameCost(frameMs: number): MotionQualityTier {
  if (!Number.isFinite(frameMs) || frameMs < 0) {
    return qualityTier;
  }

  if (frameMs > config.frameBudgetMs) {
    onBudgetStreak = 0;
    if (qualityTier === 'full') {
      qualityTier = 'reduced';
    } else if (qualityTier === 'reduced') {
      qualityTier = 'skip';
    }
    rescheduleMotionRuntime();
    return qualityTier;
  }

  onBudgetStreak++;
  if (onBudgetStreak >= config.recoveryFrames) {
    if (qualityTier === 'skip') {
      qualityTier = 'reduced';
      onBudgetStreak = 0;
    } else if (qualityTier === 'reduced') {
      qualityTier = 'full';
      onBudgetStreak = 0;
    }
  }

  rescheduleMotionRuntime();
  return qualityTier;
}

export function requestMotionFrame(callback: MotionFrameCallback): () => void {
  const requestId = nextFrameRequestId++;
  frameCallbacks.set(requestId, callback);
  scheduleMotionRuntime();

  return () => {
    frameCallbacks.delete(requestId);
    if (!hasPendingWork()) {
      clearSchedulerTimer();
    }
  };
}

export function cancelAllMotionFrames(): void {
  frameCallbacks.clear();
  if (!hasPendingWork()) {
    clearSchedulerTimer();
  } else {
    rescheduleMotionRuntime();
  }
}

export function subscribeMotionInterval(
  intervalMs: number,
  callback: MotionIntervalCallback,
  options: MotionIntervalOptions = {},
): () => void {
  const subscriptionId = nextIntervalId++;
  intervalSubscriptions.set(subscriptionId, {
    intervalMs: clampPositiveNumber(intervalMs, 16),
    callback,
    pauseWhenUnfocused: options.pauseWhenUnfocused ?? false,
    lastRunAt: Date.now(),
  });
  scheduleMotionRuntime();

  return () => {
    intervalSubscriptions.delete(subscriptionId);
    if (!hasPendingWork()) {
      clearSchedulerTimer();
    } else {
      rescheduleMotionRuntime();
    }
  };
}

export function resetMotionRuntime(): void {
  clearSchedulerTimer();
  cleanupFocusSubscription?.();
  cleanupFocusSubscription = null;
  frameCallbacks.clear();
  intervalSubscriptions.clear();
  config = { ...DEFAULT_CONFIG };
  qualityTier = 'full';
  onBudgetStreak = 0;
  lastPresentationAt = 0;
  nextFrameRequestId = 1;
  nextIntervalId = 1;
}
