/**
 * Timer Component - Presentation timer
 *
 * @layer Atom
 * @description Countdown and stopwatch timer with formatting
 *
 * A flexible timer component for countdowns, stopwatches,
 * and presentation timing. Supports pause/resume and multiple formats.
 *
 * @example
 * ```typescript
 * import { Timer, createTimer } from 'tuiuiu.js';
 *
 * // Create timer state
 * const timer = createTimer({
 *   mode: 'stopwatch',
 *   onTick: (time) => console.log(time),
 * });
 *
 * // Render
 * Timer({
 *   time: timer.elapsed(),
 *   format: 'mm:ss',
 *   color: 'primary',
 * })
 *
 * // Control
 * timer.start();
 * timer.pause();
 * timer.resume();
 * timer.reset();
 * ```
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';

// =============================================================================
// Types
// =============================================================================

export type TimerFormat = 'ss' | 'mm:ss' | 'hh:mm:ss' | 'hh:mm:ss.ms' | 'human';

export interface TimerProps {
  /** Time in milliseconds */
  time: number;
  /** Display format */
  format?: TimerFormat;
  /** Text color */
  color?: string;
  /** Whether timer is running (affects color/style) */
  running?: boolean;
  /** Whether timer is paused */
  paused?: boolean;
  /** Running indicator */
  runningIndicator?: string;
  /** Paused indicator */
  pausedIndicator?: string;
  /** Show indicator */
  showIndicator?: boolean;
  /** Label before time */
  label?: string;
  /** Bold text */
  bold?: boolean;
  /** Dim when paused */
  dimWhenPaused?: boolean;
}

export type TimerMode = 'stopwatch' | 'countdown';

export interface TimerState {
  /** Get elapsed/remaining time in ms */
  elapsed: () => number;
  /** Check if timer is running */
  isRunning: () => boolean;
  /** Check if timer is paused */
  isPaused: () => boolean;
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Resume the timer */
  resume: () => void;
  /** Reset the timer */
  reset: () => void;
  /** Toggle pause/resume */
  toggle: () => void;
  /** Set time manually (ms) */
  setTime: (ms: number) => void;
  /** Add time (ms) */
  addTime: (ms: number) => void;
  /** Subtract time (ms) */
  subtractTime: (ms: number) => void;
  /** Stop and cleanup */
  stop: () => void;
}

export interface CreateTimerOptions {
  /** Timer mode */
  mode?: TimerMode;
  /** Initial time in ms (for countdown) */
  initialTime?: number;
  /** Callback on each tick */
  onTick?: (elapsed: number) => void;
  /** Callback when countdown reaches zero */
  onComplete?: () => void;
  /** Tick interval in ms (default: 1000) */
  tickInterval?: number;
  /** Auto-start */
  autoStart?: boolean;
}

// =============================================================================
// Time Formatting
// =============================================================================

/**
 * Format milliseconds to string
 */
export function formatTime(ms: number, format: TimerFormat): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((Math.abs(ms) % 1000) / 10);

  const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
  const sign = ms < 0 ? '-' : '';

  switch (format) {
    case 'ss':
      return `${sign}${totalSeconds}`;

    case 'mm:ss':
      return `${sign}${pad(minutes)}:${pad(seconds)}`;

    case 'hh:mm:ss':
      return `${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    case 'hh:mm:ss.ms':
      return `${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`;

    case 'human': {
      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      return sign + parts.join(' ');
    }

    default:
      return `${sign}${pad(minutes)}:${pad(seconds)}`;
  }
}

/**
 * Parse time string to milliseconds
 */
export function parseTime(timeStr: string): number {
  // Try hh:mm:ss format
  const hhmmss = timeStr.match(/^(\d+):(\d+):(\d+)$/);
  if (hhmmss) {
    const [, h, m, s] = hhmmss;
    return (parseInt(h!, 10) * 3600 + parseInt(m!, 10) * 60 + parseInt(s!, 10)) * 1000;
  }

  // Try mm:ss format
  const mmss = timeStr.match(/^(\d+):(\d+)$/);
  if (mmss) {
    const [, m, s] = mmss;
    return (parseInt(m!, 10) * 60 + parseInt(s!, 10)) * 1000;
  }

  // Try human format (1h 30m 45s)
  const human = timeStr.match(/(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/);
  if (human) {
    const [, h = '0', m = '0', s = '0'] = human;
    return (parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10)) * 1000;
  }

  // Try seconds only
  const secs = parseInt(timeStr, 10);
  if (!isNaN(secs)) {
    return secs * 1000;
  }

  return 0;
}

// =============================================================================
// Timer Component
// =============================================================================

/**
 * Timer Component
 *
 * Renders a formatted time display.
 */
export function Timer(props: TimerProps): VNode {
  const {
    time,
    format = 'mm:ss',
    color = 'foreground',
    running = false,
    paused = false,
    runningIndicator = '●',
    pausedIndicator = '❚❚',
    showIndicator = true,
    label,
    bold = true,
    dimWhenPaused = true,
  } = props;

  const timeStr = formatTime(time, format);
  const indicator = running ? runningIndicator : paused ? pausedIndicator : '';
  const indicatorColor = running ? 'success' : paused ? 'warning' : 'mutedForeground';

  const children: VNode[] = [];

  if (label) {
    children.push(Text({ color: 'mutedForeground' }, `${label} `));
  }

  if (showIndicator && indicator) {
    children.push(Text({ color: indicatorColor }, `${indicator} `));
  }

  children.push(
    Text({
      color,
      bold,
      dim: dimWhenPaused && paused,
    }, timeStr)
  );

  return Box({ flexDirection: 'row' }, ...children);
}

// =============================================================================
// Timer State Manager
// =============================================================================

/**
 * Create timer state manager
 *
 * @example
 * ```typescript
 * // Stopwatch
 * const stopwatch = createTimer({
 *   mode: 'stopwatch',
 *   onTick: (elapsed) => setTime(elapsed),
 * });
 * stopwatch.start();
 *
 * // Countdown
 * const countdown = createTimer({
 *   mode: 'countdown',
 *   initialTime: 60000, // 1 minute
 *   onComplete: () => console.log('Time up!'),
 * });
 * countdown.start();
 * ```
 */
export function createTimer(options: CreateTimerOptions = {}): TimerState {
  const {
    mode = 'stopwatch',
    initialTime = 0,
    onTick,
    onComplete,
    tickInterval = 1000,
    autoStart = false,
  } = options;

  let elapsed = mode === 'countdown' ? initialTime : 0;
  let running = false;
  let paused = false;
  let startTime = 0;
  let pausedAt = 0;
  let intervalId: NodeJS.Timeout | null = null;

  const tick = () => {
    if (!running || paused) return;

    const now = Date.now();
    const delta = now - startTime;

    if (mode === 'stopwatch') {
      elapsed = delta;
    } else {
      elapsed = Math.max(0, initialTime - delta);

      if (elapsed === 0) {
        stop();
        onComplete?.();
        return;
      }
    }

    onTick?.(elapsed);
  };

  const start = () => {
    if (running) return;

    running = true;
    paused = false;
    startTime = Date.now();

    if (mode === 'countdown') {
      elapsed = initialTime;
    } else {
      elapsed = 0;
    }

    intervalId = setInterval(tick, tickInterval);
    tick(); // Immediate first tick
  };

  const pause = () => {
    if (!running || paused) return;

    paused = true;
    pausedAt = Date.now();

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const resume = () => {
    if (!running || !paused) return;

    paused = false;
    const pauseDuration = Date.now() - pausedAt;
    startTime += pauseDuration;

    intervalId = setInterval(tick, tickInterval);
    tick();
  };

  const reset = () => {
    stop();
    elapsed = mode === 'countdown' ? initialTime : 0;
    onTick?.(elapsed);
  };

  const toggle = () => {
    if (!running) {
      start();
    } else if (paused) {
      resume();
    } else {
      pause();
    }
  };

  const setTime = (ms: number) => {
    elapsed = Math.max(0, ms);
    if (mode === 'countdown') {
      startTime = Date.now() - (initialTime - elapsed);
    } else {
      startTime = Date.now() - elapsed;
    }
    onTick?.(elapsed);
  };

  const addTime = (ms: number) => {
    setTime(elapsed + ms);
  };

  const subtractTime = (ms: number) => {
    setTime(elapsed - ms);
  };

  const stop = () => {
    running = false;
    paused = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  // Auto-start if requested
  if (autoStart) {
    start();
  }

  return {
    elapsed: () => elapsed,
    isRunning: () => running && !paused,
    isPaused: () => paused,
    start,
    pause,
    resume,
    reset,
    toggle,
    setTime,
    addTime,
    subtractTime,
    stop,
  };
}

// =============================================================================
// Multi-Timer (for per-slide timing)
// =============================================================================

export interface MultiTimerState {
  /** Get timer for specific ID */
  get: (id: string) => TimerState;
  /** Create new timer */
  create: (id: string, options?: CreateTimerOptions) => TimerState;
  /** Remove timer */
  remove: (id: string) => void;
  /** Pause all timers */
  pauseAll: () => void;
  /** Resume all timers */
  resumeAll: () => void;
  /** Reset all timers */
  resetAll: () => void;
  /** Stop and cleanup all timers */
  stopAll: () => void;
  /** Get all timer IDs */
  ids: () => string[];
  /** Get total elapsed time across all timers */
  totalElapsed: () => number;
}

/**
 * Create a multi-timer manager
 *
 * Useful for tracking time per slide/page
 *
 * @example
 * ```typescript
 * const timers = createMultiTimer();
 *
 * // Create timer for each slide
 * timers.create('slide-1', { mode: 'stopwatch' });
 * timers.create('slide-2', { mode: 'stopwatch' });
 *
 * // When entering a slide
 * timers.get('slide-1').start();
 *
 * // When leaving a slide
 * timers.get('slide-1').pause();
 * ```
 */
export function createMultiTimer(): MultiTimerState {
  const timers = new Map<string, TimerState>();

  const get = (id: string): TimerState => {
    const timer = timers.get(id);
    if (!timer) {
      throw new Error(`Timer '${id}' not found`);
    }
    return timer;
  };

  const create = (id: string, options: CreateTimerOptions = {}): TimerState => {
    if (timers.has(id)) {
      return timers.get(id)!;
    }
    const timer = createTimer(options);
    timers.set(id, timer);
    return timer;
  };

  const remove = (id: string) => {
    const timer = timers.get(id);
    if (timer) {
      timer.stop();
      timers.delete(id);
    }
  };

  const pauseAll = () => {
    for (const timer of timers.values()) {
      timer.pause();
    }
  };

  const resumeAll = () => {
    for (const timer of timers.values()) {
      timer.resume();
    }
  };

  const resetAll = () => {
    for (const timer of timers.values()) {
      timer.reset();
    }
  };

  const stopAll = () => {
    for (const timer of timers.values()) {
      timer.stop();
    }
    timers.clear();
  };

  const ids = () => [...timers.keys()];

  const totalElapsed = () => {
    let total = 0;
    for (const timer of timers.values()) {
      total += timer.elapsed();
    }
    return total;
  };

  return {
    get,
    create,
    remove,
    pauseAll,
    resumeAll,
    resetAll,
    stopAll,
    ids,
    totalElapsed,
  };
}
