/**
 * Animation System - Smooth transitions for Tuiuiu
 *
 * Provides animation primitives and transition components for
 * smooth UI updates in terminal applications.
 */

import { createSignal, createEffect, untrack } from '../primitives/signal.js';
import { onTerminalFocusChange, readTerminalFocus } from './terminal-focus.js';
import {
  padTextToWidth,
  sliceAnsi,
  stringWidth,
} from '../utils/text-utils.js';
import {
  cancelAllMotionFrames,
  getMotionRuntimeState,
  requestMotionFrame,
  type MotionFrame,
} from './motion-runtime.js';

// =============================================================================
// Types
// =============================================================================

export type EasingFunction = (t: number) => number;
export type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';

export interface AnimationOptions {
  /** Duration in milliseconds */
  duration: number;
  /** Easing function name or custom function */
  easing?: EasingName | EasingFunction;
  /** Pause the animation while the terminal is unfocused */
  pauseWhenUnfocused?: boolean;
  /** Callback on each frame with progress (0-1) */
  onFrame: (progress: number) => void;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Callback when animation is cancelled */
  onCancel?: () => void;
}

export interface AnimationControls {
  /** Start the animation */
  start: () => void;
  /** Stop/cancel the animation */
  stop: () => void;
  /** Pause the animation */
  pause: () => void;
  /** Resume a paused animation */
  resume: () => void;
  /** Check if animation is running */
  isRunning: () => boolean;
  /** Get current progress (0-1) */
  progress: () => number;
}

export type TransitionEffect = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';

export interface TransitionOptions {
  /** Whether to show the content */
  show: boolean;
  /** Enter animation effect */
  enter?: TransitionEffect;
  /** Exit animation effect */
  exit?: TransitionEffect;
  /** Animation duration in ms */
  duration?: number;
  /** Easing function */
  easing?: EasingName;
  /** Callback when enter animation completes */
  onEnterComplete?: () => void;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
}

// =============================================================================
// Easing Functions
// =============================================================================

/**
 * Built-in easing functions
 */
export const easingFunctions: Record<EasingName, EasingFunction> = {
  linear: (t) => t,

  'ease-in': (t) => t * t,

  'ease-out': (t) => t * (2 - t),

  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },

  elastic: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  },
};

/**
 * Get easing function by name or return custom function
 */
function getEasingFunction(easing: EasingName | EasingFunction | undefined): EasingFunction {
  if (typeof easing === 'function') {
    return easing;
  }
  return easingFunctions[easing || 'linear'];
}

// =============================================================================
// Animation Hook
// =============================================================================

/**
 * useAnimation - Create an animation with controls
 *
 * @example
 * const animation = useAnimation({
 *   duration: 300,
 *   easing: 'ease-out',
 *   onFrame: (progress) => {
 *     setOpacity(progress);
 *   },
 * });
 *
 * // Start animation
 * animation.start();
 *
 * // Stop animation
 * animation.stop();
 */
export function useAnimation(options: AnimationOptions): AnimationControls {
  const { duration, easing, pauseWhenUnfocused = true, onFrame, onComplete, onCancel } = options;
  const easingFn = getEasingFunction(easing);

  let cancelFrame: (() => void) | null = null;
  let startTime = 0;
  let pausedTime = 0;
  let running = false;
  let paused = false;
  let pausedByFocus = false;
  let currentProgress = 0;
  let cleanupFocusSubscription: (() => void) | null = null;

  const clearFocusSubscription = () => {
    cleanupFocusSubscription?.();
    cleanupFocusSubscription = null;
  };

  const clearScheduledFrame = () => {
    cancelFrame?.();
    cancelFrame = null;
  };

  const ensureFocusSubscription = () => {
    if (!pauseWhenUnfocused || cleanupFocusSubscription) {
      return;
    }

    cleanupFocusSubscription = onTerminalFocusChange((focused) => {
      if (!focused) {
        if (running && !paused) {
          pausedByFocus = true;
          pause();
        }
        return;
      }

      if (pausedByFocus) {
        pausedByFocus = false;
        resume();
      }
    });
  };

  const scheduleFrame = () => {
    clearScheduledFrame();
    cancelFrame = requestMotionFrame(tick);
  };

  const tick = (frame?: MotionFrame) => {
    cancelFrame = null;
    if (!running || paused) return;

    const tier = frame?.tier ?? getMotionRuntimeState().qualityTier;
    if (tier === 'skip') {
      currentProgress = easingFn(1);
      onFrame(currentProgress);
      running = false;
      paused = false;
      clearFocusSubscription();
      onComplete?.();
      return;
    }

    const now = frame?.now ?? Date.now();
    const elapsed = now - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    currentProgress = easingFn(rawProgress);

    onFrame(currentProgress);

    if (rawProgress < 1) {
      scheduleFrame();
    } else {
      running = false;
      paused = false;
      clearFocusSubscription();
      onComplete?.();
    }
  };

  const start = () => {
    if (running && !paused) return;

    if (paused) {
      // Resume from paused state
      startTime = Date.now() - pausedTime;
      paused = false;
    } else {
      // Fresh start
      startTime = Date.now();
      currentProgress = 0;
    }

    running = true;
    ensureFocusSubscription();
    if (pauseWhenUnfocused && !readTerminalFocus()) {
      paused = true;
      pausedByFocus = true;
      pausedTime = pausedTime || 0;
      return;
    }
    tick();
  };

  const stop = () => {
    clearScheduledFrame();
    if (running) {
      running = false;
      paused = false;
      pausedByFocus = false;
      clearFocusSubscription();
      onCancel?.();
    }
  };

  const pause = () => {
    if (!running || paused) return;
    paused = true;
    pausedTime = Date.now() - startTime;
    clearScheduledFrame();
  };

  const resume = () => {
    if (!paused) return;
    start();
  };

  const isRunning = () => running && !paused;
  const progress = () => currentProgress;

  return { start, stop, pause, resume, isRunning, progress };
}

// =============================================================================
// Transition State
// =============================================================================

export type TransitionState = 'entering' | 'entered' | 'exiting' | 'exited';

/**
 * useTransition - Manage transition state for show/hide animations
 *
 * @example
 * const { state, style } = useTransition({
 *   show: isVisible,
 *   enter: 'fade',
 *   exit: 'fade',
 *   duration: 200,
 * });
 *
 * // state: 'entering' | 'entered' | 'exiting' | 'exited'
 * // style: { opacity: number, transform: string }
 */
export function useTransition(options: TransitionOptions): {
  state: () => TransitionState;
  progress: () => number;
  shouldRender: () => boolean;
} {
  const {
    show,
    enter = 'fade',
    exit = 'fade',
    duration = 200,
    easing = 'ease-out',
    onEnterComplete,
    onExitComplete,
  } = options;

  const [state, setState] = createSignal<TransitionState>(show ? 'entered' : 'exited');
  const [progress, setProgress] = createSignal(show ? 1 : 0);

  let animation: AnimationControls | null = null;

  // Track show prop changes
  createEffect(() => {
    const shouldShow = show;
    const currentState = untrack(state);

    if (shouldShow && (currentState === 'exited' || currentState === 'exiting')) {
      // Start enter animation
      if (animation) animation.stop();

      if (enter === 'none') {
        setState('entered');
        setProgress(1);
        onEnterComplete?.();
      } else {
        setState('entering');
        animation = useAnimation({
          duration,
          easing,
          onFrame: (p) => setProgress(p),
          onComplete: () => {
            setState('entered');
            onEnterComplete?.();
          },
        });
        animation.start();
      }
    } else if (!shouldShow && (currentState === 'entered' || currentState === 'entering')) {
      // Start exit animation
      if (animation) animation.stop();

      if (exit === 'none') {
        setState('exited');
        setProgress(0);
        onExitComplete?.();
      } else {
        setState('exiting');
        animation = useAnimation({
          duration,
          easing,
          onFrame: (p) => setProgress(1 - p),
          onComplete: () => {
            setState('exited');
            onExitComplete?.();
          },
        });
        animation.start();
      }
    }
  });

  const shouldRender = () => {
    const s = state();
    return s !== 'exited';
  };

  return { state, progress, shouldRender };
}

// =============================================================================
// Animation Helpers
// =============================================================================

/**
 * Interpolate between two values
 */
export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

/**
 * Interpolate between two colors (hex format)
 */
export function lerpColor(startHex: string, endHex: string, progress: number): string {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);

  if (!start || !end) return startHex;

  const r = Math.round(lerp(start.r, end.r, progress));
  const g = Math.round(lerp(start.g, end.g, progress));
  const b = Math.round(lerp(start.b, end.b, progress));

  return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// =============================================================================
// Frame Scheduler
// =============================================================================

type FrameCallback = () => void;

/**
 * Schedule a callback to run on the next frame
 */
export function requestAnimationFrame(callback: FrameCallback): () => void {
  return requestMotionFrame(() => {
    callback();
  });
}

/**
 * Cancel all pending frame callbacks
 */
export function cancelAllAnimationFrames(): void {
  cancelAllMotionFrames();
}

// =============================================================================
// Spring Animation (Advanced)
// =============================================================================

export interface SpringOptions {
  /** Spring stiffness (default: 100) */
  stiffness?: number;
  /** Damping coefficient (default: 10) */
  damping?: number;
  /** Mass (default: 1) */
  mass?: number;
  /** Velocity threshold to stop (default: 0.01) */
  threshold?: number;
}

/**
 * Create a spring animation
 *
 * @example
 * const spring = createSpring({ stiffness: 200, damping: 20 });
 * spring.start(0, 100, (value) => setPosition(value));
 */
export function createSpring(options: SpringOptions = {}) {
  const {
    stiffness = 100,
    damping = 10,
    mass = 1,
    threshold = 0.01,
  } = options;

  let cancelFrame: (() => void) | null = null;
  let currentValue = 0;
  let velocity = 0;
  let targetValue = 0;
  let onUpdate: ((value: number) => void) | null = null;
  let onComplete: (() => void) | null = null;
  let pausedByFocus = false;
  let cleanupFocusSubscription: (() => void) | null = null;

  const clearFocusSubscription = () => {
    cleanupFocusSubscription?.();
    cleanupFocusSubscription = null;
  };

  const scheduleTick = () => {
    cancelFrame?.();
    cancelFrame = requestMotionFrame(tick);
  };

  const tick = (frame?: MotionFrame) => {
    cancelFrame = null;
    const tier = frame?.tier ?? getMotionRuntimeState().qualityTier;
    if (tier === 'skip') {
      currentValue = targetValue;
      velocity = 0;
      onUpdate?.(currentValue);
      clearFocusSubscription();
      onComplete?.();
      return;
    }

    const dt = Math.max(0.001, Math.min(frame?.deltaMs ?? 16, 64) / 1000);

    // Spring physics
    const displacement = currentValue - targetValue;
    const springForce = -stiffness * displacement;
    const dampingForce = -damping * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    velocity += acceleration * dt;
    currentValue += velocity * dt;

    onUpdate?.(currentValue);

    // Check if we should stop
    if (Math.abs(velocity) < threshold && Math.abs(currentValue - targetValue) < threshold) {
      currentValue = targetValue;
      onUpdate?.(currentValue);
      clearFocusSubscription();
      onComplete?.();
      return;
    }

    if (!readTerminalFocus()) {
      pausedByFocus = true;
      return;
    }

    scheduleTick();
  };

  const start = (from: number, to: number, update: (value: number) => void, complete?: () => void) => {
    cancelFrame?.();
    cancelFrame = null;

    currentValue = from;
    targetValue = to;
    velocity = 0;
    onUpdate = update;
    onComplete = complete || null;
    pausedByFocus = false;

    clearFocusSubscription();
    cleanupFocusSubscription = onTerminalFocusChange((focused) => {
      if (!focused) {
        cancelFrame?.();
        cancelFrame = null;
        pausedByFocus = true;
        return;
      }

      if (pausedByFocus && !cancelFrame) {
        pausedByFocus = false;
        scheduleTick();
      }
    });

    if (readTerminalFocus()) {
      tick();
    } else {
      pausedByFocus = true;
    }
  };

  const stop = () => {
    cancelFrame?.();
    cancelFrame = null;
    pausedByFocus = false;
    clearFocusSubscription();
  };

  const setTarget = (to: number) => {
    targetValue = to;
  };

  return { start, stop, setTarget };
}

// =============================================================================
// Harmonica-style Spring (Frequency/Damping model)
// =============================================================================

export interface HarmonicaSpringOptions {
  /** Target FPS (default: 60) */
  fps?: number;
  /** Angular frequency - higher = faster oscillation (default: 7.0) */
  frequency?: number;
  /** Damping ratio - 0=undamped, 1=critical, >1=overdamped (default: 0.75) */
  damping?: number;
}

/**
 * Create a spring with frequency/damping model
 *
 * This model is more intuitive for UI animations:
 * - frequency: how "snappy" the spring is (7-15 for UI)
 * - damping: how quickly oscillations die (0.5-1.0 for UI)
 *
 * @example
 * ```typescript
 * const spring = createHarmonicaSpring({ frequency: 7, damping: 0.75 });
 * spring.start(0, 100, (value) => setOffset(value));
 * ```
 */
export function createHarmonicaSpring(options: HarmonicaSpringOptions = {}) {
  const {
    fps = 60,
    frequency = 7.0,
    damping = 0.75,
  } = options;

  const angularFreq = frequency * 2 * Math.PI;

  let cancelFrame: (() => void) | null = null;
  let position = 0;
  let velocity = 0;
  let target = 0;
  let onUpdate: ((value: number) => void) | null = null;
  let onComplete: (() => void) | null = null;
  let pausedByFocus = false;
  let cleanupFocusSubscription: (() => void) | null = null;

  const clearFocusSubscription = () => {
    cleanupFocusSubscription?.();
    cleanupFocusSubscription = null;
  };

  const scheduleTick = () => {
    cancelFrame?.();
    cancelFrame = requestMotionFrame(tick);
  };

  const tick = (frame?: MotionFrame) => {
    cancelFrame = null;
    const tier = frame?.tier ?? getMotionRuntimeState().qualityTier;
    if (tier === 'skip') {
      position = target;
      velocity = 0;
      onUpdate?.(position);
      clearFocusSubscription();
      onComplete?.();
      return;
    }

    const dt = Math.max(0.001, Math.min(frame?.deltaMs ?? (1000 / fps), 64) / 1000);

    // Damped harmonic oscillator physics
    const displacement = position - target;
    const dampingForce = 2 * damping * angularFreq * velocity;
    const springForce = angularFreq * angularFreq * displacement;
    const acceleration = -dampingForce - springForce;

    velocity += acceleration * dt;
    position += velocity * dt;

    onUpdate?.(position);

    // Check convergence
    const threshold = 0.01;
    if (Math.abs(velocity) < threshold && Math.abs(position - target) < threshold) {
      position = target;
      onUpdate?.(position);
      clearFocusSubscription();
      onComplete?.();
      return;
    }

    if (!readTerminalFocus()) {
      pausedByFocus = true;
      return;
    }

    scheduleTick();
  };

  const start = (from: number, to: number, update: (value: number) => void, complete?: () => void) => {
    cancelFrame?.();
    cancelFrame = null;

    position = from;
    target = to;
    velocity = 0;
    onUpdate = update;
    onComplete = complete || null;
    pausedByFocus = false;

    clearFocusSubscription();
    cleanupFocusSubscription = onTerminalFocusChange((focused) => {
      if (!focused) {
        cancelFrame?.();
        cancelFrame = null;
        pausedByFocus = true;
        return;
      }

      if (pausedByFocus && !cancelFrame) {
        pausedByFocus = false;
        scheduleTick();
      }
    });

    if (readTerminalFocus()) {
      tick();
    } else {
      pausedByFocus = true;
    }
  };

  const stop = () => {
    cancelFrame?.();
    cancelFrame = null;
    pausedByFocus = false;
    clearFocusSubscription();
  };

  const setTarget = (to: number) => {
    target = to;
  };

  const impulse = (force: number) => {
    velocity += force;
  };

  return { start, stop, setTarget, impulse };
}

// =============================================================================
// Composite Transitions
// =============================================================================

export type CompositeDirection = 'left' | 'right' | 'up' | 'down';

export interface CompositeTransitionState {
  /** Current animation progress 0-1 */
  progress: number;
  /** Direction of transition */
  direction: CompositeDirection;
  /** Whether animation is running */
  isAnimating: boolean;
  /** Previous content (sliding out) */
  prevContent: string;
  /** Next content (sliding in) */
  nextContent: string;
}

export interface CompositeTransitionOptions {
  /** Animation duration in ms */
  duration?: number;
  /** Use spring physics instead of easing */
  useSpring?: boolean;
  /** Spring options (if useSpring is true) */
  springOptions?: HarmonicaSpringOptions;
  /** Easing function (if useSpring is false) */
  easing?: EasingName | EasingFunction;
  /** Callback on each frame */
  onFrame?: (state: CompositeTransitionState) => void;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Create a composite transition manager
 * Manages animations where both previous and next content are visible
 *
 * Both slides are rendered during animation for smooth wipe/swipe effects.
 *
 * @example
 * ```typescript
 * const transition = createCompositeTransition({
 *   duration: 300,
 *   useSpring: true,
 *   onFrame: ({ progress, prevContent, nextContent }) => {
 *     const output = compositeHorizontal(prevContent, nextContent, width, progress * width);
 *     render(output);
 *   }
 * });
 *
 * // Start transition
 * transition.start('Hello World', 'Goodbye Earth', 'left');
 * ```
 */
export function createCompositeTransition(options: CompositeTransitionOptions = {}) {
  const {
    duration = 300,
    useSpring = true,
    springOptions = { frequency: 7, damping: 0.75 },
    easing = 'ease-out',
    onFrame,
    onComplete,
  } = options;

  let state: CompositeTransitionState = {
    progress: 0,
    direction: 'left',
    isAnimating: false,
    prevContent: '',
    nextContent: '',
  };

  let animation: ReturnType<typeof useAnimation> | null = null;
  let spring: ReturnType<typeof createHarmonicaSpring> | null = null;

  const updateState = (progress: number) => {
    state = { ...state, progress };
    onFrame?.(state);
  };

  const start = (prev: string, next: string, direction: CompositeDirection) => {
    // Stop any running animation
    stop();

    state = {
      progress: 0,
      direction,
      isAnimating: true,
      prevContent: prev,
      nextContent: next,
    };

    if (useSpring) {
      spring = createHarmonicaSpring(springOptions);
      spring.start(0, 1, updateState, () => {
        state = { ...state, progress: 1, isAnimating: false };
        onComplete?.();
      });
    } else {
      animation = useAnimation({
        duration,
        easing,
        onFrame: updateState,
        onComplete: () => {
          state = { ...state, progress: 1, isAnimating: false };
          onComplete?.();
        },
      });
      animation.start();
    }
  };

  const stop = () => {
    if (animation) {
      animation.stop();
      animation = null;
    }
    if (spring) {
      spring.stop();
      spring = null;
    }
    state = { ...state, isAnimating: false };
  };

  const getState = () => state;

  const reverse = () => {
    const reversedDirection: Record<CompositeDirection, CompositeDirection> = {
      left: 'right',
      right: 'left',
      up: 'down',
      down: 'up',
    };
    start(state.nextContent, state.prevContent, reversedDirection[state.direction]);
  };

  return { start, stop, getState, reverse };
}

// =============================================================================
// Swipe Transition Presets
// =============================================================================

export interface SwipeOptions {
  /** Content width in characters */
  width: number;
  /** Content height in lines */
  height: number;
  /** Gap between prev and next content */
  gap?: number;
  /** Animation options */
  animation?: Omit<CompositeTransitionOptions, 'onFrame'>;
}

/**
 * Create a horizontal swipe transition
 *
 * @example
 * ```typescript
 * const swipe = createSwipeTransition({
 *   width: 80,
 *   height: 24,
 *   animation: { useSpring: true }
 * });
 *
 * swipe.swipeLeft('Slide 1 content', 'Slide 2 content');
 *
 * // In render loop
 * const output = swipe.render();
 * ```
 */
export function createSwipeTransition(options: SwipeOptions) {
  const { width, height, gap = 1, animation = {} } = options;

  let compositeOutput = '';

  const transition = createCompositeTransition({
    ...animation,
    onFrame: (state) => {
      const { progress, direction, prevContent, nextContent } = state;

      // Import would be circular, so we inline the logic
      const splitPoint = direction === 'left' || direction === 'right'
        ? Math.round(width * (1 - progress))
        : Math.round(height * (1 - progress));

      if (direction === 'left') {
        // Content slides left: prev shrinks from right, next grows from right
        compositeOutput = compositeHorizontalInline(
          prevContent,
          nextContent,
          width,
          splitPoint,
          gap
        );
      } else if (direction === 'right') {
        // Content slides right: next shrinks from left, prev grows from left
        compositeOutput = compositeHorizontalInline(
          nextContent,
          prevContent,
          width,
          width - splitPoint,
          gap
        );
      }

    },
    onComplete: animation.onComplete,
  });

  // Inline composite function to avoid circular import
  function compositeHorizontalInline(
    left: string,
    right: string,
    totalWidth: number,
    splitPoint: number,
    gapSize: number
  ): string {
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    const maxLines = Math.max(leftLines.length, rightLines.length);

    const leftWidth = Math.max(0, splitPoint);
    const rightWidth = Math.max(0, totalWidth - splitPoint - gapSize);

    const result: string[] = [];

    for (let i = 0; i < maxLines; i++) {
      const leftLine = leftLines[i] || '';
      const rightLine = rightLines[i] || '';

      const leftVisible = padTextToWidth(
        sliceAnsi(leftLine, Math.max(0, stringWidth(leftLine) - leftWidth)),
        leftWidth,
        'right',
      );
      const rightVisible = padTextToWidth(
        sliceAnsi(rightLine, 0, rightWidth),
        rightWidth,
      );

      result.push(leftVisible + ' '.repeat(gapSize) + rightVisible);
    }

    return result.join('\n');
  }

  const swipeLeft = (prev: string, next: string) => {
    transition.start(prev, next, 'left');
  };

  const swipeRight = (prev: string, next: string) => {
    transition.start(prev, next, 'right');
  };

  const render = () => compositeOutput;

  const isAnimating = () => transition.getState().isAnimating;

  return {
    swipeLeft,
    swipeRight,
    render,
    isAnimating,
    stop: transition.stop,
    reverse: transition.reverse,
  };
}

/**
 * Create a vertical slide transition
 */
export function createSlideTransition(options: SwipeOptions) {
  const { width, height, gap = 0, animation = {} } = options;

  let compositeOutput = '';

  const transition = createCompositeTransition({
    ...animation,
    onFrame: (state) => {
      const { progress, direction, prevContent, nextContent } = state;
      const splitPoint = Math.round(height * (1 - progress));

      if (direction === 'up') {
        compositeOutput = compositeVerticalInline(
          prevContent,
          nextContent,
          width,
          height,
          splitPoint,
          gap
        );
      } else if (direction === 'down') {
        compositeOutput = compositeVerticalInline(
          nextContent,
          prevContent,
          width,
          height,
          height - splitPoint,
          gap
        );
      }

    },
    onComplete: animation.onComplete,
  });

  function compositeVerticalInline(
    top: string,
    bottom: string,
    lineWidth: number,
    totalHeight: number,
    splitPoint: number,
    gapSize: number
  ): string {
    const topLines = top.split('\n');
    const bottomLines = bottom.split('\n');

    const topHeight = Math.max(0, splitPoint);
    const bottomHeight = Math.max(0, totalHeight - splitPoint - gapSize);

    const fitLine = (line: string): string =>
      padTextToWidth(sliceAnsi(line, 0, lineWidth), lineWidth);
    const topVisible = topLines.slice(-topHeight).map(fitLine);
    const bottomVisible = bottomLines.slice(0, bottomHeight).map(fitLine);

    return [
      ...topVisible,
      ...Array(gapSize).fill(' '.repeat(lineWidth)),
      ...bottomVisible,
    ].join('\n');
  }

  const slideUp = (prev: string, next: string) => {
    transition.start(prev, next, 'up');
  };

  const slideDown = (prev: string, next: string) => {
    transition.start(prev, next, 'down');
  };

  const render = () => compositeOutput;

  const isAnimating = () => transition.getState().isAnimating;

  return {
    slideUp,
    slideDown,
    render,
    isAnimating,
    stop: transition.stop,
    reverse: transition.reverse,
  };
}
