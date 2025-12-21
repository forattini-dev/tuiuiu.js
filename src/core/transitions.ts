/**
 * Screen Transitions - Animated transitions between screens
 *
 * Provides smooth animated transitions for the Screen Manager,
 * including slide, fade, and custom transition effects.
 *
 * Integrates with the animation system from Phase 004 including
 * spring physics for natural-feeling animations.
 */

import { createSignal, batch } from '../primitives/signal.js';
import {
  createHarmonicaSpring,
  useAnimation,
  easingFunctions,
  lerp,
  type HarmonicaSpringOptions,
  type EasingName,
  type EasingFunction,
  type AnimationControls,
} from './animation.js';
import type { Screen } from './screen.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Available screen transition effects
 */
export type ScreenTransitionType =
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'fade'
  | 'scale'
  | 'none';

/**
 * Configuration for a screen transition
 */
export interface ScreenTransitionConfig {
  /** Type of transition animation */
  type: ScreenTransitionType;
  /** Duration in milliseconds (default: 300) */
  duration?: number;
  /** Easing function or name (default: 'ease-out') */
  easing?: EasingName | EasingFunction;
  /** Use spring physics instead of easing (default: false) */
  useSpring?: boolean;
  /** Spring configuration (if useSpring is true) */
  springOptions?: HarmonicaSpringOptions;
}

/**
 * State of an in-progress screen transition
 */
export interface ScreenTransitionState {
  /** Whether a transition is currently running */
  isTransitioning: boolean;
  /** Current progress (0-1) */
  progress: number;
  /** The transition type being used */
  type: ScreenTransitionType;
  /** Direction of navigation ('forward' | 'backward') */
  direction: 'forward' | 'backward';
  /** The screen being transitioned from */
  fromScreen: Screen | null;
  /** The screen being transitioned to */
  toScreen: Screen | null;
}

/**
 * Computed render offsets for transition rendering
 */
export interface TransitionOffsets {
  /** Offset for the exiting screen */
  from: {
    x: number;
    y: number;
    opacity: number;
    scale: number;
  };
  /** Offset for the entering screen */
  to: {
    x: number;
    y: number;
    opacity: number;
    scale: number;
  };
}

/**
 * Options for the ScreenTransitionManager
 */
export interface ScreenTransitionManagerOptions {
  /** Default transition for forward navigation */
  defaultForward?: ScreenTransitionConfig;
  /** Default transition for backward navigation */
  defaultBackward?: ScreenTransitionConfig;
  /** Terminal width for calculating offsets */
  width?: number;
  /** Terminal height for calculating offsets */
  height?: number;
}

/**
 * Callback for frame updates during transition
 */
export type TransitionFrameCallback = (
  state: ScreenTransitionState,
  offsets: TransitionOffsets
) => void;

// =============================================================================
// Default Configurations
// =============================================================================

/** Default forward transition (slide left) */
export const DEFAULT_FORWARD_TRANSITION: ScreenTransitionConfig = {
  type: 'slide-left',
  duration: 300,
  easing: 'ease-out',
  useSpring: false,
};

/** Default backward transition (slide right) */
export const DEFAULT_BACKWARD_TRANSITION: ScreenTransitionConfig = {
  type: 'slide-right',
  duration: 300,
  easing: 'ease-out',
  useSpring: false,
};

/** Spring-based forward transition */
export const SPRING_FORWARD_TRANSITION: ScreenTransitionConfig = {
  type: 'slide-left',
  useSpring: true,
  springOptions: {
    frequency: 8,
    damping: 0.85,
  },
};

/** Spring-based backward transition */
export const SPRING_BACKWARD_TRANSITION: ScreenTransitionConfig = {
  type: 'slide-right',
  useSpring: true,
  springOptions: {
    frequency: 8,
    damping: 0.85,
  },
};

/** Fade transition */
export const FADE_TRANSITION: ScreenTransitionConfig = {
  type: 'fade',
  duration: 200,
  easing: 'ease-in-out',
};

/** No transition (instant) */
export const NO_TRANSITION: ScreenTransitionConfig = {
  type: 'none',
  duration: 0,
};

// =============================================================================
// Transition Presets
// =============================================================================

/**
 * Collection of pre-configured transition presets
 */
export const transitionPresets = {
  /** iOS-style slide transitions */
  ios: {
    forward: {
      type: 'slide-left' as const,
      useSpring: true,
      springOptions: { frequency: 12, damping: 0.9 },
    },
    backward: {
      type: 'slide-right' as const,
      useSpring: true,
      springOptions: { frequency: 12, damping: 0.9 },
    },
  },

  /** Android-style fade transitions */
  android: {
    forward: {
      type: 'fade' as const,
      duration: 200,
      easing: 'ease-out' as const,
    },
    backward: {
      type: 'fade' as const,
      duration: 150,
      easing: 'ease-in' as const,
    },
  },

  /** Material Design style */
  material: {
    forward: {
      type: 'slide-up' as const,
      duration: 250,
      easing: 'ease-out' as const,
    },
    backward: {
      type: 'slide-down' as const,
      duration: 200,
      easing: 'ease-in' as const,
    },
  },

  /** Quick slide transitions */
  quick: {
    forward: {
      type: 'slide-left' as const,
      duration: 150,
      easing: 'ease-out' as const,
    },
    backward: {
      type: 'slide-right' as const,
      duration: 150,
      easing: 'ease-out' as const,
    },
  },

  /** Smooth spring transitions */
  smooth: {
    forward: {
      type: 'slide-left' as const,
      useSpring: true,
      springOptions: { frequency: 6, damping: 0.75 },
    },
    backward: {
      type: 'slide-right' as const,
      useSpring: true,
      springOptions: { frequency: 6, damping: 0.75 },
    },
  },

  /** Instant transitions (no animation) */
  instant: {
    forward: NO_TRANSITION,
    backward: NO_TRANSITION,
  },
} as const;

// =============================================================================
// Offset Calculations
// =============================================================================

/**
 * Calculate render offsets for a given transition state
 */
export function calculateTransitionOffsets(
  state: ScreenTransitionState,
  width: number,
  height: number
): TransitionOffsets {
  const { progress, type, direction } = state;

  // For backward navigation, we often want to reverse the visual effect
  const effectiveProgress = progress;

  // Default: no offset
  const offsets: TransitionOffsets = {
    from: { x: 0, y: 0, opacity: 1, scale: 1 },
    to: { x: 0, y: 0, opacity: 1, scale: 1 },
  };

  switch (type) {
    case 'slide-left': {
      // Forward: from slides left, to slides in from right
      offsets.from.x = -Math.round(width * effectiveProgress) || 0;
      offsets.to.x = Math.round(width * (1 - effectiveProgress)) || 0;
      break;
    }

    case 'slide-right': {
      // Backward: from slides right, to slides in from left
      offsets.from.x = Math.round(width * effectiveProgress);
      offsets.to.x = -Math.round(width * (1 - effectiveProgress));
      break;
    }

    case 'slide-up': {
      // from slides up, to slides in from bottom
      offsets.from.y = -Math.round(height * effectiveProgress);
      offsets.to.y = Math.round(height * (1 - effectiveProgress));
      break;
    }

    case 'slide-down': {
      // from slides down, to slides in from top
      offsets.from.y = Math.round(height * effectiveProgress);
      offsets.to.y = -Math.round(height * (1 - effectiveProgress));
      break;
    }

    case 'fade': {
      // Crossfade: from fades out, to fades in
      offsets.from.opacity = 1 - effectiveProgress;
      offsets.to.opacity = effectiveProgress;
      break;
    }

    case 'scale': {
      // Scale: from scales down, to scales up
      offsets.from.scale = lerp(1, 0.9, effectiveProgress);
      offsets.from.opacity = 1 - effectiveProgress;
      offsets.to.scale = lerp(0.9, 1, effectiveProgress);
      offsets.to.opacity = effectiveProgress;
      break;
    }

    case 'none':
    default: {
      // Instant: full progress immediately
      offsets.from.opacity = effectiveProgress >= 0.5 ? 0 : 1;
      offsets.to.opacity = effectiveProgress >= 0.5 ? 1 : 0;
      break;
    }
  }

  return offsets;
}

// =============================================================================
// ScreenTransitionManager
// =============================================================================

/**
 * ScreenTransitionManager - Manages animated transitions between screens
 *
 * Integrates with the ScreenManager to provide smooth animated transitions
 * when navigating between screens.
 *
 * @example
 * ```typescript
 * const transitionManager = createScreenTransitionManager({
 *   width: 80,
 *   height: 24,
 *   defaultForward: transitionPresets.ios.forward,
 *   defaultBackward: transitionPresets.ios.backward,
 * });
 *
 * // Start a transition
 * transitionManager.start(fromScreen, toScreen, 'forward', (state, offsets) => {
 *   // Render both screens with offsets
 *   renderWithOffsets(fromScreen, offsets.from);
 *   renderWithOffsets(toScreen, offsets.to);
 * });
 * ```
 */
export class ScreenTransitionManager {
  private width: number;
  private height: number;
  private defaultForward: ScreenTransitionConfig;
  private defaultBackward: ScreenTransitionConfig;

  private _state = createSignal<ScreenTransitionState>({
    isTransitioning: false,
    progress: 0,
    type: 'none',
    direction: 'forward',
    fromScreen: null,
    toScreen: null,
  });

  private animation: AnimationControls | null = null;
  private spring: ReturnType<typeof createHarmonicaSpring> | null = null;
  private frameCallback: TransitionFrameCallback | null = null;
  private completeCallback: (() => void) | null = null;

  constructor(options: ScreenTransitionManagerOptions = {}) {
    this.width = options.width ?? 80;
    this.height = options.height ?? 24;
    this.defaultForward = options.defaultForward ?? DEFAULT_FORWARD_TRANSITION;
    this.defaultBackward = options.defaultBackward ?? DEFAULT_BACKWARD_TRANSITION;
  }

  /**
   * Get current transition state signal
   */
  get state() {
    return this._state[0];
  }

  /**
   * Check if a transition is currently running
   */
  get isTransitioning(): boolean {
    return this._state[0]().isTransitioning;
  }

  /**
   * Get current progress (0-1)
   */
  get progress(): number {
    return this._state[0]().progress;
  }

  /**
   * Set terminal dimensions
   */
  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Set default transition configurations
   */
  setDefaults(forward?: ScreenTransitionConfig, backward?: ScreenTransitionConfig): void {
    if (forward) this.defaultForward = forward;
    if (backward) this.defaultBackward = backward;
  }

  /**
   * Start a screen transition
   *
   * @param from - Screen being transitioned from
   * @param to - Screen being transitioned to
   * @param direction - Navigation direction
   * @param onFrame - Callback for each animation frame
   * @param config - Optional transition configuration override
   * @returns Promise that resolves when transition completes
   */
  start(
    from: Screen | null,
    to: Screen,
    direction: 'forward' | 'backward',
    onFrame?: TransitionFrameCallback,
    config?: ScreenTransitionConfig
  ): Promise<void> {
    // Stop any running transition
    this.stop();

    // Determine which config to use
    const transitionConfig =
      config ??
      (direction === 'forward' ? this.defaultForward : this.defaultBackward);

    // Handle instant transitions
    if (transitionConfig.type === 'none' || transitionConfig.duration === 0) {
      this._state[1]({
        isTransitioning: false,
        progress: 1,
        type: transitionConfig.type,
        direction,
        fromScreen: from,
        toScreen: to,
      });
      return Promise.resolve();
    }

    // Set initial state
    this._state[1]({
      isTransitioning: true,
      progress: 0,
      type: transitionConfig.type,
      direction,
      fromScreen: from,
      toScreen: to,
    });

    this.frameCallback = onFrame ?? null;

    return new Promise<void>((resolve) => {
      this.completeCallback = () => {
        this._state[1]((prev) => ({
          ...prev,
          isTransitioning: false,
          progress: 1,
        }));
        this.animation = null;
        this.spring = null;
        this.frameCallback = null;
        resolve();
      };

      const updateProgress = (progress: number) => {
        this._state[1]((prev) => ({
          ...prev,
          progress,
        }));

        if (this.frameCallback) {
          const offsets = calculateTransitionOffsets(
            this._state[0](),
            this.width,
            this.height
          );
          this.frameCallback(this._state[0](), offsets);
        }
      };

      if (transitionConfig.useSpring) {
        // Use spring physics
        const springOpts = transitionConfig.springOptions ?? {
          frequency: 8,
          damping: 0.85,
        };

        this.spring = createHarmonicaSpring(springOpts);
        this.spring.start(0, 1, updateProgress, this.completeCallback);
      } else {
        // Use easing-based animation
        const easing = transitionConfig.easing ?? 'ease-out';
        const duration = transitionConfig.duration ?? 300;

        this.animation = useAnimation({
          duration,
          easing,
          onFrame: updateProgress,
          onComplete: this.completeCallback,
        });
        this.animation.start();
      }
    });
  }

  /**
   * Stop the current transition
   */
  stop(): void {
    if (this.animation) {
      this.animation.stop();
      this.animation = null;
    }

    if (this.spring) {
      this.spring.stop();
      this.spring = null;
    }

    if (this.isTransitioning) {
      this._state[1]((prev) => ({
        ...prev,
        isTransitioning: false,
      }));
    }

    this.frameCallback = null;
    this.completeCallback = null;
  }

  /**
   * Get current offsets for rendering
   */
  getOffsets(): TransitionOffsets {
    return calculateTransitionOffsets(this._state[0](), this.width, this.height);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new ScreenTransitionManager
 */
export function createScreenTransitionManager(
  options?: ScreenTransitionManagerOptions
): ScreenTransitionManager {
  return new ScreenTransitionManager(options);
}

// =============================================================================
// Global Instance
// =============================================================================

let globalTransitionManager: ScreenTransitionManager | null = null;

/**
 * Get the global transition manager instance
 */
export function getTransitionManager(): ScreenTransitionManager {
  if (!globalTransitionManager) {
    globalTransitionManager = createScreenTransitionManager();
  }
  return globalTransitionManager;
}

/**
 * Reset the global transition manager
 */
export function resetTransitionManager(): void {
  if (globalTransitionManager) {
    globalTransitionManager.stop();
  }
  globalTransitionManager = null;
}

// =============================================================================
// Transition Helpers
// =============================================================================

/**
 * Create a custom transition configuration
 */
export function createTransition(
  type: ScreenTransitionType,
  options?: Partial<Omit<ScreenTransitionConfig, 'type'>>
): ScreenTransitionConfig {
  return {
    type,
    duration: options?.duration ?? 300,
    easing: options?.easing ?? 'ease-out',
    useSpring: options?.useSpring ?? false,
    springOptions: options?.springOptions,
  };
}

/**
 * Create a spring-based transition
 */
export function createSpringTransition(
  type: ScreenTransitionType,
  springOptions?: HarmonicaSpringOptions
): ScreenTransitionConfig {
  return {
    type,
    useSpring: true,
    springOptions: springOptions ?? { frequency: 8, damping: 0.85 },
  };
}

// =============================================================================
// Render Helpers
// =============================================================================

/**
 * Apply horizontal offset to content lines
 * Shifts content left (negative) or right (positive)
 */
export function applyHorizontalOffset(
  content: string,
  offset: number,
  width: number
): string {
  if (offset === 0) return content;

  const lines = content.split('\n');
  return lines
    .map((line) => {
      if (offset > 0) {
        // Shift right: add spaces on left, truncate on right
        const shifted = ' '.repeat(offset) + line;
        return shifted.slice(0, width);
      } else {
        // Shift left: remove from left, pad on right
        const absOffset = -offset;
        const shifted = line.slice(absOffset);
        return shifted.padEnd(width, ' ').slice(0, width);
      }
    })
    .join('\n');
}

/**
 * Apply vertical offset to content lines
 * Shifts content up (negative) or down (positive)
 */
export function applyVerticalOffset(
  content: string,
  offset: number,
  height: number
): string {
  if (offset === 0) return content;

  const lines = content.split('\n');
  const emptyLine = '';

  if (offset > 0) {
    // Shift down: add empty lines on top
    const shifted = [...Array(offset).fill(emptyLine), ...lines];
    return shifted.slice(0, height).join('\n');
  } else {
    // Shift up: remove from top, pad on bottom
    const absOffset = -offset;
    const shifted = lines.slice(absOffset);
    while (shifted.length < height) {
      shifted.push(emptyLine);
    }
    return shifted.slice(0, height).join('\n');
  }
}

/**
 * Apply opacity effect using dimmed characters
 * This is a simplified terminal approximation of opacity
 */
export function applyOpacity(content: string, opacity: number): string {
  if (opacity >= 1) return content;
  if (opacity <= 0) {
    // Return empty lines preserving structure
    return content
      .split('\n')
      .map((line) => ' '.repeat(line.length))
      .join('\n');
  }

  // For terminals, we approximate opacity by dimming
  // At 50% opacity, we could use dim ANSI codes
  // This is a simplified version that just returns content
  // Real implementation would use ANSI dim codes or color interpolation
  return content;
}

/**
 * Composite two screens during transition
 * Handles overlaying exiting and entering screens based on offsets
 */
export function compositeScreens(
  fromContent: string,
  toContent: string,
  offsets: TransitionOffsets,
  width: number,
  height: number
): string {
  // Apply offsets to each screen's content
  let fromRendered = fromContent;
  let toRendered = toContent;

  // Apply horizontal/vertical offsets
  if (offsets.from.x !== 0) {
    fromRendered = applyHorizontalOffset(fromRendered, offsets.from.x, width);
  }
  if (offsets.from.y !== 0) {
    fromRendered = applyVerticalOffset(fromRendered, offsets.from.y, height);
  }
  if (offsets.to.x !== 0) {
    toRendered = applyHorizontalOffset(toRendered, offsets.to.x, width);
  }
  if (offsets.to.y !== 0) {
    toRendered = applyVerticalOffset(toRendered, offsets.to.y, height);
  }

  // Apply opacity
  fromRendered = applyOpacity(fromRendered, offsets.from.opacity);
  toRendered = applyOpacity(toRendered, offsets.to.opacity);

  // For slide transitions, we composite horizontally or vertically
  // For fade, we use the 'to' content when opacity crosses 0.5
  const fromLines = fromRendered.split('\n');
  const toLines = toRendered.split('\n');
  const maxLines = Math.max(fromLines.length, toLines.length);

  // Determine which content is visible at each position
  const result: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const fromLine = fromLines[i] ?? '';
    const toLine = toLines[i] ?? '';

    // For horizontal slides, we composite based on x offset
    if (offsets.from.x !== 0 || offsets.to.x !== 0) {
      result.push(compositeLineHorizontal(fromLine, toLine, offsets, width));
    }
    // For vertical slides, lines are already offset, just pick the right one
    else if (offsets.from.y !== 0 || offsets.to.y !== 0) {
      // During vertical transition, both are shifted - show the visible parts
      result.push(toLine || fromLine);
    }
    // For fade, crossfade based on opacity
    else {
      // At opacity threshold, switch from 'from' to 'to'
      result.push(offsets.to.opacity > 0.5 ? toLine : fromLine);
    }
  }

  return result.slice(0, height).join('\n');
}

/**
 * Composite a single line horizontally during slide transition
 */
function compositeLineHorizontal(
  fromLine: string,
  toLine: string,
  offsets: TransitionOffsets,
  width: number
): string {
  const result: string[] = [];

  for (let x = 0; x < width; x++) {
    // Determine which character to show at this position
    const fromVisible =
      offsets.from.opacity > 0 &&
      x >= offsets.from.x &&
      x < offsets.from.x + width;
    const toVisible =
      offsets.to.opacity > 0 &&
      x >= offsets.to.x &&
      x < offsets.to.x + width;

    if (toVisible && toLine[x - offsets.to.x]) {
      result.push(toLine[x - offsets.to.x]!);
    } else if (fromVisible && fromLine[x - offsets.from.x]) {
      result.push(fromLine[x - offsets.from.x]!);
    } else {
      result.push(' ');
    }
  }

  return result.join('');
}

// =============================================================================
// useScreenTransition Hook
// =============================================================================

/**
 * Hook for using screen transitions in components
 *
 * @example
 * ```typescript
 * function NavigationView() {
 *   const transition = useScreenTransition({
 *     width: 80,
 *     height: 24,
 *   });
 *
 *   const handleNavigate = async (toScreen: Screen) => {
 *     await transition.run(currentScreen, toScreen, 'forward');
 *     setCurrentScreen(toScreen);
 *   };
 *
 *   return Box({},
 *     transition.isTransitioning()
 *       ? Text({}, transition.render(fromContent, toContent))
 *       : renderScreen(currentScreen)
 *   );
 * }
 * ```
 */
export function useScreenTransition(options: ScreenTransitionManagerOptions = {}) {
  const manager = createScreenTransitionManager(options);

  const [_content, setContent] = createSignal('');

  const run = async (
    from: Screen | null,
    to: Screen,
    direction: 'forward' | 'backward',
    config?: ScreenTransitionConfig
  ): Promise<void> => {
    return manager.start(from, to, direction, undefined, config);
  };

  const stop = () => manager.stop();

  const isTransitioning = () => manager.isTransitioning;

  const progress = () => manager.progress;

  const state = manager.state;

  const getOffsets = () => manager.getOffsets();

  const render = (fromContent: string, toContent: string): string => {
    const offsets = manager.getOffsets();
    return compositeScreens(
      fromContent,
      toContent,
      offsets,
      options.width ?? 80,
      options.height ?? 24
    );
  };

  return {
    run,
    stop,
    isTransitioning,
    progress,
    state,
    getOffsets,
    render,
    manager,
  };
}
