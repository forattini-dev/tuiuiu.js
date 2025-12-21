/**
 * Overlay Stack Manager - Kyma-inspired overlay system
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
 * import { createOverlayStack, OverlayContainer } from 'tuiuiu';
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
 * // In your app
 * Box({},
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
 *     // Don't propagate input to main content
 *     return;
 *   }
 *   // Normal input handling
 * });
 * ```
 */

import { Box } from '../../components/components.js';
import type { VNode } from '../../utils/types.js';
import { createSignal } from '../../primitives/signal.js';

// =============================================================================
// Types
// =============================================================================

export type OverlayPriority = 'low' | 'normal' | 'high' | 'critical';

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

  const notify = () => {
    triggerUpdate();
    for (const callback of subscribers) {
      callback();
    }
  };

  const sortStack = () => {
    // Sort by priority (lower first), then by pushedAt (earlier first)
    stack.sort((a, b) => {
      if (a.priorityValue !== b.priorityValue) {
        return a.priorityValue - b.priorityValue;
      }
      return a.pushedAt - b.pushedAt;
    });
  };

  return {
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
        closeOnEscape: config.closeOnEscape ?? true,
        closeOnClickOutside: config.closeOnClickOutside ?? false,
        showBackdrop: config.showBackdrop ?? true,
        backdropChar: config.backdropChar ?? ' ',
        backdropColor: config.backdropColor ?? undefined,
      };

      stack.push(entry);
      sortStack();
      entry.onOpen?.();
      notify();
    },

    pop: () => {
      if (stack.length === 0) return null;

      const entry = stack[stack.length - 1]!;

      // Check beforeClose
      if (entry.beforeClose && !entry.beforeClose()) {
        return null;
      }

      stack.pop();
      entry.onClose?.();
      notify();
      return entry;
    },

    close: (id: string) => {
      const index = stack.findIndex(entry => entry.id === id);
      if (index === -1) return false;

      const entry = stack[index]!;

      // Check beforeClose
      if (entry.beforeClose && !entry.beforeClose()) {
        return false;
      }

      stack.splice(index, 1);
      entry.onClose?.();
      notify();
      return true;
    },

    closeAll: () => {
      // Close from top to bottom
      while (stack.length > 0) {
        const entry = stack.pop()!;
        entry.onClose?.();
      }
      notify();
    },

    replace: (id: string, config: OverlayConfig) => {
      const index = stack.findIndex(entry => entry.id === id);
      if (index === -1) return false;

      const oldEntry = stack[index]!;

      const newEntry: OverlayEntry = {
        ...config,
        priority: config.priority || 'normal',
        priorityValue: PRIORITY_VALUES[config.priority || 'normal'],
        pushedAt: oldEntry.pushedAt, // Keep original position
        closeOnEscape: config.closeOnEscape ?? true,
        closeOnClickOutside: config.closeOnClickOutside ?? false,
        showBackdrop: config.showBackdrop ?? true,
      };

      stack[index] = newEntry;
      sortStack();
      notify();
      return true;
    },

    bringToTop: (id: string) => {
      const index = stack.findIndex(entry => entry.id === id);
      if (index === -1) return false;

      const entry = stack[index]!;
      entry.pushedAt = Date.now();
      sortStack();
      notify();
      return true;
    },

    size: () => {
      version();
      return stack.length;
    },

    subscribe: (callback: () => void) => {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },
  };
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
 * Container component that renders all overlays in the stack
 *
 * @example
 * ```typescript
 * // At the end of your main component
 * Box({},
 *   MainContent(),
 *   OverlayContainer({ stack: overlays })
 * )
 * ```
 */
export function OverlayContainer(props: OverlayContainerProps): VNode {
  const { stack, renderBackdrop } = props;
  const overlays = stack.all();

  if (overlays.length === 0) {
    return Box({});
  }

  const children: VNode[] = [];

  for (const entry of overlays) {
    // Backdrop
    if (entry.showBackdrop && renderBackdrop) {
      const backdrop = renderBackdrop(entry);
      if (backdrop) {
        children.push(backdrop);
      }
    }

    // Overlay component
    const component = entry.component();
    if (component) {
      children.push(component);
    }
  }

  return Box({ flexDirection: 'column' }, ...children);
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
 *     return; // Block further input
 *   }
 *
 *   // Block all input when overlay is active
 *   if (shouldBlockInput(overlays)) {
 *     return;
 *   }
 *
 *   // Normal input handling...
 * });
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
  onClose?: () => void;
}): OverlayConfig {
  return {
    id: options.id,
    component: options.component,
    priority: 'normal',
    closeOnEscape: options.closeOnEscape ?? true,
    showBackdrop: true,
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
  let timeoutId: NodeJS.Timeout | null = null;

  const config: OverlayConfig = {
    id: options.id,
    component: options.component,
    priority: 'low',
    closeOnEscape: false,
    showBackdrop: false,
    onClose: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      options.onClose?.();
    },
  };

  const autoClose = () => {
    if (options.duration && options.duration > 0) {
      timeoutId = setTimeout(() => {
        // This will be called by the stack manager
        config.onClose?.();
      }, options.duration);
    }
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
