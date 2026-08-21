/**
 * Hook types - Shared type definitions
 */

import type { Key } from '../core/hotkeys.js';

export type { Key };

/** Metadata used by the internal terminal-input adapter. */
export interface InputEvent {
  /** The input string */
  input: string;
  /** Parsed key information */
  key: Key;
  /** Whether this input originated from a paste operation */
  isPasted: boolean;
  /** Raw terminal data */
  raw?: string;
}

export type InputHandler = (input: string, key: Key, event?: InputEvent) => void | boolean;

// =============================================================================
// Paste Event System
// =============================================================================

/** Event emitted when text is pasted */
export interface PasteEvent {
  /** The pasted text content */
  text: string;
  /** Whether paste was detected via bracketed paste mode (vs heuristic) */
  isBracketed: boolean;
}

export type PasteHandler = (event: PasteEvent) => void | boolean;

/** Internal entry for a registered paste handler */
export interface PasteHandlerEntry {
  /** The actual handler function */
  handler: PasteHandler;
  /** Priority value for sorting */
  priorityValue: number;
  /** Whether to stop propagation when handler returns truthy */
  stopPropagation: boolean;
  /** Unique ID for removal */
  id: number;
}

// =============================================================================
// Input Priority System
// =============================================================================

/**
 * Input priority levels (higher = fires first)
 *
 * - `background`: Ambient listeners (analytics, debugging) - fires last
 * - `normal`: Regular components - default priority
 * - `modal`: Modals, command palette, overlays - fires before normal
 * - `critical`: Error dialogs, system alerts - fires first
 */
export type InputPriority = 'background' | 'normal' | 'modal' | 'critical';

/** Numeric values for priority sorting (higher = fires first) */
export const INPUT_PRIORITY_VALUES: Record<InputPriority, number> = {
  background: 0,
  normal: 1,
  modal: 2,
  critical: 3,
};

/** Options for useInput hook */
export interface UseInputOptions {
  /**
   * Whether the handler is active (receives events)
   * @default true
   */
  isActive?: boolean;

  /**
   * Priority level for this handler
   * Higher priority handlers fire before lower priority ones
   * @default 'normal'
   */
  priority?: InputPriority;

  /**
   * If true, prevents lower priority handlers from firing
   * when this handler returns a truthy value
   * @default false
   */
  stopPropagation?: boolean;
}

/** Internal entry for a registered input handler */
export interface InputHandlerEntry {
  /** The actual handler function */
  handler: InputHandler;
  /** Priority value for sorting */
  priorityValue: number;
  /** Whether to stop propagation when handler returns truthy */
  stopPropagation: boolean;
  /** Unique ID for removal */
  id: number;
}

export interface AppContext {
  exit: (error?: Error) => void;
  /** Release input listeners and restore terminal modes without terminating the process. */
  dispose: () => void;
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
  /** Register an exit callback. Returns a function that unregisters it. */
  onExit: (callback: (error?: Error) => void) => () => void;
  /** Whether automatic Tab/Shift+Tab navigation is enabled */
  autoTabNavigation: boolean;
  /** Set automatic Tab navigation enabled/disabled */
  setAutoTabNavigation: (enabled: boolean) => void;
  /** Enable/disable raw mode with reference counting */
  setRawMode: (enabled: boolean) => void;
  /** Current raw mode reference count */
  rawModeEnabledCount: number;
  /** Whether raw mode is currently active */
  isRawModeEnabled: () => boolean;
  /** Whether the terminal currently reports itself as focused */
  isTerminalFocused?: () => boolean;
  /** Clear the screen and reset render state (use for splash->main transitions) */
  clearScreen?: () => void;
  /**
   * Write trusted application text above the live UI without corrupting its
   * render region. Terminal control protocols are stripped; SGR colors remain.
   */
  writeLine: (text: string) => void;
  /**
   * Enqueue an external async update so bursty producers can be coalesced
   * before mutating reactive state.
   */
  enqueueExternalUpdate?: (update: () => void) => void;
  /** Flush any queued external updates immediately. */
  flushExternalUpdates?: () => void;
  /** Whether external updates are currently pending. */
  hasPendingExternalUpdates?: () => boolean;
}

export interface FocusOptions {
  autoFocus?: boolean;
  isActive?: boolean;
  id?: string;
}

export interface FocusResult {
  isFocused: boolean;
  focus: () => void;
}

/** Focus manager interface */
export interface FocusManager {
  register(id: string, setFocused: (focused: boolean) => void): void;
  unregister(id: string): void;
  focus(id: string): void;
  focusNext(): void;
  focusPrevious(): void;
  /** Blur current focus (no component focused) */
  blur(): void;
  /** Get currently focused ID */
  getActiveId(): string | undefined;
}
