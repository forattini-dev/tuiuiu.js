/**
 * Mouse Simulator - Simulate mouse events for testing
 *
 * This module provides utilities to simulate mouse events in tests
 * without needing an actual mouse device.
 *
 * Mouse events in terminals are just escape sequences:
 * - SGR format: \x1b[<button;x;yM (press) or \x1b[<button;x;ym (release)
 * - X10 format: \x1b[Mbutton_char x_char y_char
 */

import type { MouseEvent as TuiuiuMouseEvent, MouseButton, MouseAction } from '../hooks/use-mouse.js';
import { getHitTestRegistry } from '../core/hit-test.js';

// =============================================================================
// Types
// =============================================================================

export interface MouseSimulatorOptions {
  /** Use SGR format (default: true) */
  useSGR?: boolean;
}

export interface ClickOptions {
  /** Which button to use (default: 'left') */
  button?: 'left' | 'right' | 'middle';
  /** Modifier keys */
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface DragOptions extends ClickOptions {
  /** Number of steps for drag interpolation (default: 10) */
  steps?: number;
}

// =============================================================================
// SGR Mouse Sequence Generation
// =============================================================================

/**
 * Generate SGR mouse escape sequence
 *
 * SGR format: \x1b[<button;x;yM (press) or \x1b[<button;x;ym (release)
 *
 * Button encoding:
 *   0 = left, 1 = middle, 2 = right
 *   +4 = shift, +8 = meta/alt, +16 = ctrl
 *   +32 = motion (drag)
 *   64 = scroll up, 65 = scroll down
 */
export function generateSGRMouseSequence(
  x: number,
  y: number,
  button: MouseButton,
  action: MouseAction,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
): string {
  let buttonCode = 0;

  // Base button
  switch (button) {
    case 'left': buttonCode = 0; break;
    case 'middle': buttonCode = 1; break;
    case 'right': buttonCode = 2; break;
    case 'scroll-up': buttonCode = 64; break;
    case 'scroll-down': buttonCode = 65; break;
    case 'none': buttonCode = 3; break;
  }

  // Modifiers
  if (modifiers.shift) buttonCode += 4;
  if (modifiers.alt) buttonCode += 8;
  if (modifiers.ctrl) buttonCode += 16;

  // Motion flag for drag
  if (action === 'drag' || action === 'move') {
    buttonCode += 32;
  }

  // Coordinates are 1-indexed in SGR
  const coordX = x + 1;
  const coordY = y + 1;

  // Action suffix
  const suffix = action === 'release' ? 'm' : 'M';

  return `\x1b[<${buttonCode};${coordX};${coordY}${suffix}`;
}

/**
 * Generate X10 mouse escape sequence (legacy format)
 */
export function generateX10MouseSequence(
  x: number,
  y: number,
  button: MouseButton,
  _action: MouseAction,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
): string {
  let buttonCode = 0;

  switch (button) {
    case 'left': buttonCode = 0; break;
    case 'middle': buttonCode = 1; break;
    case 'right': buttonCode = 2; break;
    default: buttonCode = 3; break;
  }

  if (modifiers.shift) buttonCode += 4;
  if (modifiers.alt) buttonCode += 8;
  if (modifiers.ctrl) buttonCode += 16;

  // X10 uses character codes starting at 32
  const buttonChar = String.fromCharCode(32 + buttonCode);
  const xChar = String.fromCharCode(32 + x + 1);
  const yChar = String.fromCharCode(32 + y + 1);

  return `\x1b[M${buttonChar}${xChar}${yChar}`;
}

// =============================================================================
// Mouse Simulator Class
// =============================================================================

/**
 * Mouse Simulator for testing
 *
 * Provides high-level methods to simulate mouse interactions
 * and dispatches events to the hit-test registry.
 */
export class MouseSimulator {
  private options: Required<MouseSimulatorOptions>;
  private lastPosition = { x: 0, y: 0 };
  private pressedButton: MouseButton = 'none';

  constructor(options: MouseSimulatorOptions = {}) {
    this.options = {
      useSGR: options.useSGR ?? true,
    };
  }

  /**
   * Generate mouse sequence for the configured format
   */
  generateSequence(
    x: number,
    y: number,
    button: MouseButton,
    action: MouseAction,
    modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
  ): string {
    if (this.options.useSGR) {
      return generateSGRMouseSequence(x, y, button, action, modifiers);
    } else {
      return generateX10MouseSequence(x, y, button, action, modifiers);
    }
  }

  /**
   * Create a mouse event object
   */
  createEvent(
    x: number,
    y: number,
    button: MouseButton,
    action: MouseAction,
    modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
  ): TuiuiuMouseEvent {
    return {
      x,
      y,
      button,
      action,
      modifiers: {
        ctrl: modifiers.ctrl ?? false,
        shift: modifiers.shift ?? false,
        alt: modifiers.alt ?? false,
      },
    };
  }

  /**
   * Dispatch event directly to hit-test registry
   */
  dispatchEvent(event: TuiuiuMouseEvent): void {
    getHitTestRegistry().handleMouseEvent(event);
  }

  /**
   * Simulate a click at position
   */
  click(x: number, y: number, options: ClickOptions = {}): void {
    const button = options.button ?? 'left';
    const modifiers = {
      ctrl: options.ctrl,
      shift: options.shift,
      alt: options.alt,
    };

    // Mouse down
    this.dispatchEvent(this.createEvent(x, y, button, 'click', modifiers));

    // Mouse up (release)
    this.dispatchEvent(this.createEvent(x, y, button, 'release', modifiers));

    this.lastPosition = { x, y };
  }

  /**
   * Simulate a double click at position
   */
  doubleClick(x: number, y: number, options: ClickOptions = {}): void {
    // First click
    this.click(x, y, options);
    // Second click (will be detected as double-click)
    this.click(x, y, options);
  }

  /**
   * Simulate a right click (context menu)
   */
  rightClick(x: number, y: number, options: Omit<ClickOptions, 'button'> = {}): void {
    this.click(x, y, { ...options, button: 'right' });
  }

  /**
   * Simulate mouse down (press without release)
   */
  mouseDown(x: number, y: number, options: ClickOptions = {}): void {
    const button = options.button ?? 'left';
    this.pressedButton = button;
    this.dispatchEvent(
      this.createEvent(x, y, button, 'click', {
        ctrl: options.ctrl,
        shift: options.shift,
        alt: options.alt,
      })
    );
    this.lastPosition = { x, y };
  }

  /**
   * Simulate mouse up (release)
   */
  mouseUp(x: number, y: number, options: ClickOptions = {}): void {
    const button = options.button ?? this.pressedButton;
    this.dispatchEvent(
      this.createEvent(x, y, button, 'release', {
        ctrl: options.ctrl,
        shift: options.shift,
        alt: options.alt,
      })
    );
    this.pressedButton = 'none';
    this.lastPosition = { x, y };
  }

  /**
   * Simulate mouse move
   */
  moveTo(x: number, y: number): void {
    this.dispatchEvent(this.createEvent(x, y, 'none', 'move', {}));
    this.lastPosition = { x, y };
  }

  /**
   * Simulate drag from one position to another
   */
  drag(fromX: number, fromY: number, toX: number, toY: number, options: DragOptions = {}): void {
    const steps = options.steps ?? 10;
    const button = options.button ?? 'left';
    const modifiers = {
      ctrl: options.ctrl,
      shift: options.shift,
      alt: options.alt,
    };

    // Mouse down at start
    this.dispatchEvent(this.createEvent(fromX, fromY, button, 'click', modifiers));

    // Interpolate movement
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(fromX + (toX - fromX) * t);
      const y = Math.round(fromY + (toY - fromY) * t);
      this.dispatchEvent(this.createEvent(x, y, button, 'drag', modifiers));
    }

    // Mouse up at end
    this.dispatchEvent(this.createEvent(toX, toY, button, 'release', modifiers));

    this.lastPosition = { x: toX, y: toY };
  }

  /**
   * Simulate scroll wheel
   */
  scroll(x: number, y: number, direction: 'up' | 'down', amount = 1): void {
    const button: MouseButton = direction === 'up' ? 'scroll-up' : 'scroll-down';
    for (let i = 0; i < amount; i++) {
      this.dispatchEvent(this.createEvent(x, y, button, 'click', {}));
    }
    this.lastPosition = { x, y };
  }

  /**
   * Simulate hover (enter + stay)
   */
  hover(x: number, y: number): void {
    this.moveTo(x, y);
  }

  /**
   * Get last mouse position
   */
  getPosition(): { x: number; y: number } {
    return { ...this.lastPosition };
  }

  /**
   * Reset simulator state
   */
  reset(): void {
    this.lastPosition = { x: 0, y: 0 };
    this.pressedButton = 'none';
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a mouse simulator instance
 */
export function createMouseSimulator(options: MouseSimulatorOptions = {}): MouseSimulator {
  return new MouseSimulator(options);
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Simulate a click directly (without creating simulator instance)
 */
export function simulateClick(x: number, y: number, options: ClickOptions = {}): void {
  const simulator = new MouseSimulator();
  simulator.click(x, y, options);
}

/**
 * Simulate a right click directly
 */
export function simulateRightClick(x: number, y: number): void {
  const simulator = new MouseSimulator();
  simulator.rightClick(x, y);
}

/**
 * Simulate a double click directly
 */
export function simulateDoubleClick(x: number, y: number): void {
  const simulator = new MouseSimulator();
  simulator.doubleClick(x, y);
}

/**
 * Simulate scroll directly
 */
export function simulateScroll(x: number, y: number, direction: 'up' | 'down', amount = 1): void {
  const simulator = new MouseSimulator();
  simulator.scroll(x, y, direction, amount);
}

/**
 * Simulate drag directly
 */
export function simulateDrag(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  options: DragOptions = {}
): void {
  const simulator = new MouseSimulator();
  simulator.drag(fromX, fromY, toX, toY, options);
}
