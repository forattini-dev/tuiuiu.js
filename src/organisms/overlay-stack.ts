/**
 * Overlay Stack Manager
 *
 * Manages a stack of overlay components (modals, dialogs, menus)
 * with exclusive focus handling and proper z-ordering.
 *
 * Features:
 * - Push/pop overlay management
 * - Exclusive focus (only top overlay receives input)
 * - Named overlays for easy management
 * - Backdrop/dimming support
 * - Animation hooks
 * - Priority levels
 *
 * @example
 * ```typescript
 * import { createOverlayStack, OverlayContainer } from 'tuiuiu.js';
 *
 * const overlays = createOverlayStack();
 *
 * // Push an overlay
 * overlays.push({
 *   id: 'confirm',
 *   component: () => ConfirmDialog({ ... }),
 *   priority: 'normal',
 *   closeOnEscape: true,
 * });
 *
 * // In your app (render the overlay container last)
 * Box({ position: 'relative', width: 'fill', height: 'fill' },
 *   MainContent(),
 *   OverlayContainer({ stack: overlays })
 * )
 *
 * // Handle input
 * useInput((_, key) => {
 *   if (overlays.hasOverlay()) {
 *     if (key.escape && overlays.current()?.closeOnEscape) {
 *       overlays.pop();
 *     }
 *     return true; // Don't propagate input to main content
 *   }
 *   // Normal input handling
 * }, { priority: 'modal', stopPropagation: true });
 * ```
 */

import { Box } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { createSignal } from '../primitives/signal.js';
import { stringWidth } from '../utils/text-utils.js';
import { segmentGraphemes } from '../utils/grapheme.js';

// =============================================================================
// Types
// =============================================================================

export type OverlayPriority = 'low' | 'normal' | 'high' | 'critical';
export type OverlayPosition = 'center' | 'top' | 'bottom' | {
  x: number;
  y: number;
};

export interface OverlayConfig {
  /** Unique identifier */
  id: string;
  /** Component to render */
  component: () => VNode | null;
  /** Priority level (higher = above lower) */
  priority?: OverlayPriority;
  /** Close when escape is pressed */
  closeOnEscape?: boolean;
  /** Close when clicking outside */
  closeOnClickOutside?: boolean;
  /** Show backdrop/dim behind */
  showBackdrop?: boolean;
  /** Backdrop character */
  backdropChar?: string;
  /** Backdrop color */
  backdropColor?: string;
  /** Position of the overlay component inside its full-screen layer */
  position?: OverlayPosition;
  /** Automatically close this overlay after the given number of milliseconds */
  autoCloseMs?: number;
  /** Callback when overlay is opened */
  onOpen?: () => void;
  /** Callback when overlay is closed */
  onClose?: () => void;
  /** Callback before close (return false to cancel) */
  beforeClose?: () => boolean;
  /** Custom data */
  data?: unknown;
}

export interface OverlayEntry extends OverlayConfig {
  /** Timestamp when pushed */
  pushedAt: number;
  /** Priority as number for sorting */
  priorityValue: number;
  /** Monotonic insertion order used when timestamps are equal */
  order: number;
}

export interface OverlayStackState {
  /** Get all overlays (bottom to top) */
  all: () => OverlayEntry[];
  /** Get current (top) overlay */
  current: () => OverlayEntry | null;
  /** Check if stack has any overlays */
  hasOverlay: () => boolean;
  /** Check if specific overlay is open */
  isOpen: (id: string) => boolean;
  /** Get overlay by ID */
  get: (id: string) => OverlayEntry | null;
  /** Push new overlay */
  push: (config: OverlayConfig) => void;
  /** Pop top overlay */
  pop: () => OverlayEntry | null;
  /** Close specific overlay by ID */
  close: (id: string) => boolean;
  /** Close all overlays */
  closeAll: () => void;
  /** Replace overlay by ID */
  replace: (id: string, config: OverlayConfig) => boolean;
  /** Bring overlay to top */
  bringToTop: (id: string) => boolean;
  /** Get stack size */
  size: () => number;
  /** Subscribe to changes */
  subscribe: (callback: () => void) => () => void;
  /** Close all overlays, clear timers, and remove subscribers */
  dispose: () => void;
}

// =============================================================================
// Priority Values
// =============================================================================

const PRIORITY_VALUES: Record<OverlayPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  critical: 4,
};

function validateOverlayConfig(config: OverlayConfig): void {
  if (!config.id || config.id.trim().length === 0) {
    throw new TypeError('Overlay id must be a non-empty string');
  }
  if (
    config.autoCloseMs !== undefined
    && (!Number.isFinite(config.autoCloseMs) || config.autoCloseMs < 0)
  ) {
    throw new RangeError('autoCloseMs must be a finite non-negative number');
  }
  if (config.backdropChar !== undefined) {
    const graphemes = segmentGraphemes(config.backdropChar);
    if (
      graphemes.length !== 1
      || stringWidth(graphemes[0]!.segment) !== 1
    ) {
      throw new RangeError(
        'backdropChar must contain exactly one single-cell grapheme',
      );
    }
  }
  if (typeof config.position === 'object') {
    if (
      !Number.isFinite(config.position.x)
      || !Number.isFinite(config.position.y)
      || config.position.x < 0
      || config.position.y < 0
    ) {
      throw new RangeError(
        'Custom overlay position must use finite non-negative coordinates',
      );
    }
  }
}

// =============================================================================
// Implementation
// =============================================================================

/**
 * Create an overlay stack manager
 */
export function createOverlayStack(): OverlayStackState {
  const [version, setVersion] = createSignal(0);
  const triggerUpdate = () => setVersion(v => v + 1);

  const stack: OverlayEntry[] = [];
  const subscribers = new Set<() => void>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let nextOrder = 0;
  let disposed = false;

  const notify = () => {
    triggerUpdate();
    const errors: unknown[] = [];
    for (const callback of [...subscribers]) {
      try {
        callback();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, 'One or more overlay subscribers failed');
    }
  };

  const assertActive = () => {
    if (disposed) {
      throw new Error('This overlay stack has been disposed');
    }
  };

  const clearEntryTimer = (id: string) => {
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }
  };

  const scheduleAutoClose = (entry: OverlayEntry) => {
    clearEntryTimer(entry.id);
    if (entry.autoCloseMs === undefined) return;
    if (!Number.isFinite(entry.autoCloseMs) || entry.autoCloseMs < 0) {
      throw new RangeError('autoCloseMs must be a finite non-negative number');
    }
    if (entry.autoCloseMs === 0) return;

    const timer = setTimeout(() => {
      timers.delete(entry.id);
      api.close(entry.id);
    }, entry.autoCloseMs);
    timer.unref?.();
    timers.set(entry.id, timer);
  };

  const sortStack = () => {
    // Sort by priority (lower first), then by pushedAt (earlier first)
    stack.sort((a, b) => {
      if (a.priorityValue !== b.priorityValue) {
        return a.priorityValue - b.priorityValue;
      }
      return a.order - b.order;
    });
  };

  const api: OverlayStackState = {
    all: () => {
      version(); // Subscribe
      return [...stack];
    },

    current: () => {
      version();
      return stack.length > 0 ? stack[stack.length - 1]! : null;
    },

    hasOverlay: () => {
      version();
      return stack.length > 0;
    },

    isOpen: (id: string) => {
      version();
      return stack.some(entry => entry.id === id);
    },

    get: (id: string) => {
      version();
      return stack.find(entry => entry.id === id) || null;
    },

    push: (config: OverlayConfig) => {
      assertActive();
      validateOverlayConfig(config);
      // Don't allow duplicate IDs
      if (stack.some(entry => entry.id === config.id)) {
        console.warn(`Overlay with id '${config.id}' already exists`);
        return;
      }

      const entry: OverlayEntry = {
        ...config,
        priority: config.priority || 'normal',
        priorityValue: PRIORITY_VALUES[config.priority || 'normal'],
        pushedAt: Date.now(),
        order: nextOrder++,
        closeOnEscape: config.closeOnEscape ?? true,
        closeOnClickOutside: config.closeOnClickOutside ?? false,
        showBackdrop: config.showBackdrop ?? true,
        backdropChar: config.backdropChar ?? ' ',
        backdropColor: config.backdropColor ?? undefined,
        position: config.position ?? 'center',
      };

      stack.push(entry);
      sortStack();
      try {
        scheduleAutoClose(entry);
        entry.onOpen?.();
      } finally {
        notify();
      }
    },

    pop: () => {
      assertActive();
      if (stack.length === 0) return null;

      const entry = stack[stack.length - 1]!;

      // Check beforeClose
      if (entry.beforeClose && !entry.beforeClose()) {
        return null;
      }

      stack.pop();
      clearEntryTimer(entry.id);
      try {
        entry.onClose?.();
      } finally {
        notify();
      }
      return entry;
    },

    close: (id: string) => {
      assertActive();
      const index = stack.findIndex(entry => entry.id === id);
      if (index === -1) return false;

      const entry = stack[index]!;

      // Check beforeClose
      if (entry.beforeClose && !entry.beforeClose()) {
        return false;
      }

      stack.splice(index, 1);
      clearEntryTimer(entry.id);
      try {
        entry.onClose?.();
      } finally {
        notify();
      }
      return true;
    },

    closeAll: () => {
      assertActive();
      const errors: unknown[] = [];
      let changed = false;
      // Work from a snapshot so a veto cannot trap closeAll in an infinite loop.
      for (const entry of [...stack].reverse()) {
        try {
          if (entry.beforeClose && !entry.beforeClose()) continue;
          const index = stack.indexOf(entry);
          if (index === -1) continue;
          stack.splice(index, 1);
          clearEntryTimer(entry.id);
          changed = true;
          entry.onClose?.();
        } catch (error) {
          errors.push(error);
        }
      }
      if (changed) {
        try {
          notify();
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length > 0) {
        throw new AggregateError(errors, 'One or more overlays failed to close');
      }
    },

    replace: (id: string, config: OverlayConfig) => {
      assertActive();
      validateOverlayConfig(config);
      const index = stack.findIndex(entry => entry.id === id);
      if (index === -1) return false;

      const oldEntry = stack[index]!;
      if (oldEntry.beforeClose && !oldEntry.beforeClose()) return false;
      if (config.id !== id && stack.some(entry => entry.id === config.id)) {
        throw new Error(`Overlay with id '${config.id}' already exists`);
      }

      const newEntry: OverlayEntry = {
        ...config,
        priority: config.priority || 'normal',
        priorityValue: PRIORITY_VALUES[config.priority || 'normal'],
        pushedAt: oldEntry.pushedAt, // Keep original position
        order: oldEntry.order,
        closeOnEscape: config.closeOnEscape ?? true,
        closeOnClickOutside: config.closeOnClickOutside ?? false,
        showBackdrop: config.showBackdrop ?? true,
        backdropChar: config.backdropChar ?? ' ',
        backdropColor: config.backdropColor ?? undefined,
        position: config.position ?? 'center',
      };

      clearEntryTimer(oldEntry.id);
      stack[index] = newEntry;
      sortStack();
      const errors: unknown[] = [];
      try {
        oldEntry.onClose?.();
      } catch (error) {
        errors.push(error);
      }
      try {
        scheduleAutoClose(newEntry);
        newEntry.onOpen?.();
      } catch (error) {
        errors.push(error);
      }
      try {
        notify();
      } catch (error) {
        errors.push(error);
      }
      if (errors.length > 0) {
        throw new AggregateError(errors, `Overlay '${id}' was replaced with lifecycle errors`);
      }
      return true;
    },

    bringToTop: (id: string) => {
      assertActive();
      const index = stack.findIndex(entry => entry.id === id);
      if (index === -1) return false;

      const entry = stack[index]!;
      entry.pushedAt = Date.now();
      entry.order = nextOrder++;
      sortStack();
      notify();
      return true;
    },

    size: () => {
      version();
      return stack.length;
    },

    subscribe: (callback: () => void) => {
      assertActive();
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },
    dispose: () => {
      if (disposed) return;
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      stack.length = 0;
      subscribers.clear();
      disposed = true;
      triggerUpdate();
    },
  };

  return api;
}

// =============================================================================
// Overlay Container Component
// =============================================================================

export interface OverlayContainerProps {
  /** Overlay stack to render */
  stack: OverlayStackState;
  /** Render backdrop */
  renderBackdrop?: (entry: OverlayEntry) => VNode | null;
}

/**
 * Full-screen absolute container that renders all overlays in the stack
 *
 * @example
 * ```typescript
 * // At the end of your main component
 * Box({ position: 'relative', width: 'fill', height: 'fill' },
 *   MainContent(),
 *   OverlayContainer({ stack: overlays })
 * )
 * ```
 */
export function OverlayContainer(props: OverlayContainerProps): VNode {
  const { stack, renderBackdrop } = props;
  const overlays = stack.all();
  const containerProps = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: 'fill' as const,
    height: 'fill' as const,
  };

  if (overlays.length === 0) {
    return Box(containerProps);
  }

  const children: VNode[] = [];

  for (const entry of overlays) {
    // Backdrop
    if (entry.showBackdrop) {
      const backdrop = renderBackdrop?.(entry);
      children.push(
        Box(
          {
            key: `${entry.id}-backdrop`,
            position: 'absolute',
            top: 0,
            left: 0,
            width: 'fill',
            height: 'fill',
            backgroundColor: backdrop ? undefined : (entry.backdropColor ?? 'black'),
            __fillChar: backdrop ? undefined : entry.backdropChar,
            onClick: entry.closeOnClickOutside
              ? () => stack.close(entry.id)
              : undefined,
          },
          ...(backdrop ? [backdrop] : []),
        ),
      );
    }

    // Each component gets its own full-screen layer. Absolute siblings render
    // in stack order, so later/higher-priority overlays cover earlier ones.
    const component = entry.component();
    if (component) {
      const position = entry.position ?? 'center';
      const customPosition = typeof position === 'object';
      children.push(
        Box(
          {
            key: `${entry.id}-content`,
            position: 'absolute',
            top: customPosition ? position.y : 0,
            left: customPosition ? position.x : 0,
            width: 'fill',
            height: 'fill',
            alignItems: 'center',
            justifyContent: position === 'bottom'
              ? 'flex-end'
              : position === 'center'
                ? 'center'
                : 'flex-start',
          },
          component,
        ),
      );
    }
  }

  return Box(containerProps, ...children);
}

// =============================================================================
// Hook for Input Handling
// =============================================================================

export interface UseOverlayInputOptions {
  /** Overlay stack */
  stack: OverlayStackState;
  /** Handle escape key */
  handleEscape?: boolean;
}

/**
 * Check if input should be blocked (overlay is active)
 *
 * @example
 * ```typescript
 * const overlays = createOverlayStack();
 *
 * useInput((input, key) => {
 *   // Handle escape for overlays
 *   if (key.escape && overlays.hasOverlay()) {
 *     const current = overlays.current();
 *     if (current?.closeOnEscape) {
 *       overlays.pop();
 *     }
 *     return true; // Block further input
 *   }
 *
 *   // Block all input when overlay is active
 *   if (shouldBlockInput(overlays)) {
 *     return true;
 *   }
 *
 *   // Normal input handling...
 * }, { priority: 'modal', stopPropagation: true });
 * ```
 */
export function shouldBlockInput(stack: OverlayStackState): boolean {
  return stack.hasOverlay();
}

/**
 * Handle escape key for overlay stack
 * Returns true if handled (overlay was closed or blocked)
 */
export function handleOverlayEscape(stack: OverlayStackState): boolean {
  const current = stack.current();
  if (!current) return false;

  if (current.closeOnEscape) {
    stack.pop();
    return true;
  }

  // Overlay exists but doesn't close on escape - still block
  return true;
}

// =============================================================================
// Utility: Create common overlays
// =============================================================================

/**
 * Helper to create a modal overlay config
 */
export function createModalOverlay(options: {
  id: string;
  component: () => VNode | null;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
  showBackdrop?: boolean;
  backdropChar?: string;
  backdropColor?: string;
  position?: OverlayPosition;
  onClose?: () => void;
}): OverlayConfig {
  return {
    id: options.id,
    component: options.component,
    priority: 'normal',
    closeOnEscape: options.closeOnEscape ?? true,
    closeOnClickOutside: options.closeOnClickOutside ?? false,
    showBackdrop: options.showBackdrop ?? true,
    backdropChar: options.backdropChar,
    backdropColor: options.backdropColor,
    position: options.position ?? 'center',
    onClose: options.onClose,
  };
}

/**
 * Helper to create a toast overlay config (low priority, no backdrop)
 */
export function createToastOverlay(options: {
  id: string;
  component: () => VNode | null;
  duration?: number;
  onClose?: () => void;
}): OverlayConfig & { autoClose: () => void } {
  if (
    options.duration !== undefined
    && (!Number.isFinite(options.duration) || options.duration < 0)
  ) {
    throw new RangeError('Toast duration must be a finite non-negative number');
  }
  const config: OverlayConfig = {
    id: options.id,
    component: options.component,
    priority: 'low',
    closeOnEscape: false,
    showBackdrop: false,
    autoCloseMs: options.duration,
    onClose: options.onClose,
  };

  // Kept for source compatibility. The stack now owns and starts the timer
  // when this config is pushed, so callers no longer need to invoke it.
  const autoClose = () => {
    // Intentionally empty.
  };

  return { ...config, autoClose };
}

/**
 * Helper to create a critical overlay config (highest priority)
 */
export function createCriticalOverlay(options: {
  id: string;
  component: () => VNode | null;
  closeOnEscape?: boolean;
  onClose?: () => void;
}): OverlayConfig {
  return {
    id: options.id,
    component: options.component,
    priority: 'critical',
    closeOnEscape: options.closeOnEscape ?? false,
    showBackdrop: true,
    onClose: options.onClose,
  };
}
