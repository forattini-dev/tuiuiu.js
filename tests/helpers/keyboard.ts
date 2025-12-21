/**
 * Keyboard simulation helpers for testing
 *
 * This module provides comprehensive keyboard simulation for testing
 * terminal UI components. It includes all keys, modifiers, and common
 * keyboard shortcuts.
 */

import type { Key } from '../../src/hooks/types.js';
import { emitInput, getInputHandlerCount } from '../../src/hooks/context.js';

// =============================================================================
// Types
// =============================================================================

export interface KeyPress {
  input: string;
  key: Key;
}

export type KeyModifiers = Pick<Key, 'ctrl' | 'shift' | 'meta' | 'option'>;

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Create a default Key object with all properties false
 */
export function createEmptyKey(): Key {
  return {
    upArrow: false,
    downArrow: false,
    leftArrow: false,
    rightArrow: false,
    pageUp: false,
    pageDown: false,
    home: false,
    end: false,
    insert: false,
    return: false,
    escape: false,
    tab: false,
    backspace: false,
    delete: false,
    clear: false,
    ctrl: false,
    shift: false,
    meta: false,
    option: false,
    f1: false, f2: false, f3: false, f4: false,
    f5: false, f6: false, f7: false, f8: false,
    f9: false, f10: false, f11: false, f12: false,
  };
}

/**
 * Create a Key object for a specific key press
 */
export function createKey(overrides: Partial<Key> = {}): Key {
  return { ...createEmptyKey(), ...overrides };
}

/**
 * Simulate a character input (a-z, 0-9, symbols)
 */
export function charKey(char: string, modifiers: Partial<Key> = {}): KeyPress {
  return {
    input: char,
    key: createKey(modifiers),
  };
}

/**
 * Create key with Ctrl modifier
 */
export function ctrlKey(char: string): KeyPress {
  return charKey(char.toLowerCase(), { ctrl: true });
}

/**
 * Create key with Meta (Cmd) modifier
 */
export function metaKey(char: string): KeyPress {
  return charKey(char.toLowerCase(), { meta: true });
}

/**
 * Create key with Shift modifier
 */
export function shiftKey(char: string): KeyPress {
  return charKey(char.toUpperCase(), { shift: true });
}

/**
 * Create key with Option (Alt) modifier
 */
export function optionKey(char: string): KeyPress {
  return charKey(char.toLowerCase(), { option: true });
}

// =============================================================================
// Special Keys
// =============================================================================

/**
 * Comprehensive key simulators
 */
export const keys = {
  // === Arrow Keys ===
  left: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ leftArrow: true, ...modifiers }),
  }),
  right: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ rightArrow: true, ...modifiers }),
  }),
  up: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ upArrow: true, ...modifiers }),
  }),
  down: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ downArrow: true, ...modifiers }),
  }),

  // === Navigation ===
  home: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ home: true, ...modifiers }),
  }),
  end: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ end: true, ...modifiers }),
  }),
  pageUp: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ pageUp: true, ...modifiers }),
  }),
  pageDown: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ pageDown: true, ...modifiers }),
  }),

  // === Editing ===
  backspace: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ backspace: true, ...modifiers }),
  }),
  delete: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ delete: true, ...modifiers }),
  }),
  insert: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ insert: true, ...modifiers }),
  }),
  clear: (): KeyPress => ({
    input: '',
    key: createKey({ clear: true }),
  }),

  // === Actions ===
  enter: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ return: true, ...modifiers }),
  }),
  escape: (): KeyPress => ({
    input: '',
    key: createKey({ escape: true }),
  }),
  tab: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ tab: true, ...modifiers }),
  }),
  space: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: ' ',
    key: createKey(modifiers),
  }),

  // === Function Keys ===
  f1: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f1: true, ...modifiers }),
  }),
  f2: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f2: true, ...modifiers }),
  }),
  f3: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f3: true, ...modifiers }),
  }),
  f4: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f4: true, ...modifiers }),
  }),
  f5: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f5: true, ...modifiers }),
  }),
  f6: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f6: true, ...modifiers }),
  }),
  f7: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f7: true, ...modifiers }),
  }),
  f8: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f8: true, ...modifiers }),
  }),
  f9: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f9: true, ...modifiers }),
  }),
  f10: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f10: true, ...modifiers }),
  }),
  f11: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f11: true, ...modifiers }),
  }),
  f12: (modifiers: Partial<Key> = {}): KeyPress => ({
    input: '',
    key: createKey({ f12: true, ...modifiers }),
  }),

  // === Ctrl Combinations (a-z) ===
  ctrlA: (): KeyPress => ctrlKey('a'),
  ctrlB: (): KeyPress => ctrlKey('b'),
  ctrlC: (): KeyPress => ctrlKey('c'),
  ctrlD: (): KeyPress => ctrlKey('d'),
  ctrlE: (): KeyPress => ctrlKey('e'),
  ctrlF: (): KeyPress => ctrlKey('f'),
  ctrlG: (): KeyPress => ctrlKey('g'),
  ctrlH: (): KeyPress => ctrlKey('h'),
  ctrlI: (): KeyPress => ctrlKey('i'),
  ctrlJ: (): KeyPress => ctrlKey('j'),
  ctrlK: (): KeyPress => ctrlKey('k'),
  ctrlL: (): KeyPress => ctrlKey('l'),
  ctrlM: (): KeyPress => ctrlKey('m'),
  ctrlN: (): KeyPress => ctrlKey('n'),
  ctrlO: (): KeyPress => ctrlKey('o'),
  ctrlP: (): KeyPress => ctrlKey('p'),
  ctrlQ: (): KeyPress => ctrlKey('q'),
  ctrlR: (): KeyPress => ctrlKey('r'),
  ctrlS: (): KeyPress => ctrlKey('s'),
  ctrlT: (): KeyPress => ctrlKey('t'),
  ctrlU: (): KeyPress => ctrlKey('u'),
  ctrlV: (): KeyPress => ctrlKey('v'),
  ctrlW: (): KeyPress => ctrlKey('w'),
  ctrlX: (): KeyPress => ctrlKey('x'),
  ctrlY: (): KeyPress => ctrlKey('y'),
  ctrlZ: (): KeyPress => ctrlKey('z'),

  // === Ctrl+Arrow Combinations ===
  ctrlLeft: (): KeyPress => keys.left({ ctrl: true }),
  ctrlRight: (): KeyPress => keys.right({ ctrl: true }),
  ctrlUp: (): KeyPress => keys.up({ ctrl: true }),
  ctrlDown: (): KeyPress => keys.down({ ctrl: true }),

  // === Ctrl+Navigation ===
  ctrlHome: (): KeyPress => keys.home({ ctrl: true }),
  ctrlEnd: (): KeyPress => keys.end({ ctrl: true }),

  // === Ctrl+Edit ===
  ctrlBackspace: (): KeyPress => keys.backspace({ ctrl: true }),
  ctrlDelete: (): KeyPress => keys.delete({ ctrl: true }),

  // === Shift Combinations ===
  shiftEnter: (): KeyPress => keys.enter({ shift: true }),
  shiftTab: (): KeyPress => keys.tab({ shift: true }),
  shiftLeft: (): KeyPress => keys.left({ shift: true }),
  shiftRight: (): KeyPress => keys.right({ shift: true }),
  shiftUp: (): KeyPress => keys.up({ shift: true }),
  shiftDown: (): KeyPress => keys.down({ shift: true }),
  shiftHome: (): KeyPress => keys.home({ shift: true }),
  shiftEnd: (): KeyPress => keys.end({ shift: true }),

  // === Meta (Cmd) Combinations ===
  metaA: (): KeyPress => metaKey('a'),
  metaC: (): KeyPress => metaKey('c'),
  metaV: (): KeyPress => metaKey('v'),
  metaX: (): KeyPress => metaKey('x'),
  metaZ: (): KeyPress => metaKey('z'),
  metaS: (): KeyPress => metaKey('s'),
  metaLeft: (): KeyPress => keys.left({ meta: true }),
  metaRight: (): KeyPress => keys.right({ meta: true }),

  // === Option (Alt) Combinations ===
  optionLeft: (): KeyPress => keys.left({ option: true }),
  optionRight: (): KeyPress => keys.right({ option: true }),
  optionBackspace: (): KeyPress => keys.backspace({ option: true }),
  optionDelete: (): KeyPress => keys.delete({ option: true }),

  // === Number Keys ===
  num0: (modifiers: Partial<Key> = {}): KeyPress => charKey('0', modifiers),
  num1: (modifiers: Partial<Key> = {}): KeyPress => charKey('1', modifiers),
  num2: (modifiers: Partial<Key> = {}): KeyPress => charKey('2', modifiers),
  num3: (modifiers: Partial<Key> = {}): KeyPress => charKey('3', modifiers),
  num4: (modifiers: Partial<Key> = {}): KeyPress => charKey('4', modifiers),
  num5: (modifiers: Partial<Key> = {}): KeyPress => charKey('5', modifiers),
  num6: (modifiers: Partial<Key> = {}): KeyPress => charKey('6', modifiers),
  num7: (modifiers: Partial<Key> = {}): KeyPress => charKey('7', modifiers),
  num8: (modifiers: Partial<Key> = {}): KeyPress => charKey('8', modifiers),
  num9: (modifiers: Partial<Key> = {}): KeyPress => charKey('9', modifiers),

  // === Common Symbols ===
  slash: (modifiers: Partial<Key> = {}): KeyPress => charKey('/', modifiers),
  backslash: (modifiers: Partial<Key> = {}): KeyPress => charKey('\\', modifiers),
  colon: (modifiers: Partial<Key> = {}): KeyPress => charKey(':', modifiers),
  semicolon: (modifiers: Partial<Key> = {}): KeyPress => charKey(';', modifiers),
  comma: (modifiers: Partial<Key> = {}): KeyPress => charKey(',', modifiers),
  period: (modifiers: Partial<Key> = {}): KeyPress => charKey('.', modifiers),
  minus: (modifiers: Partial<Key> = {}): KeyPress => charKey('-', modifiers),
  plus: (modifiers: Partial<Key> = {}): KeyPress => charKey('+', modifiers),
  equals: (modifiers: Partial<Key> = {}): KeyPress => charKey('=', modifiers),
  question: (modifiers: Partial<Key> = {}): KeyPress => charKey('?', modifiers),
  at: (modifiers: Partial<Key> = {}): KeyPress => charKey('@', modifiers),
  hash: (modifiers: Partial<Key> = {}): KeyPress => charKey('#', modifiers),

  // === Brackets ===
  openParen: (modifiers: Partial<Key> = {}): KeyPress => charKey('(', modifiers),
  closeParen: (modifiers: Partial<Key> = {}): KeyPress => charKey(')', modifiers),
  openBracket: (modifiers: Partial<Key> = {}): KeyPress => charKey('[', modifiers),
  closeBracket: (modifiers: Partial<Key> = {}): KeyPress => charKey(']', modifiers),
  openBrace: (modifiers: Partial<Key> = {}): KeyPress => charKey('{', modifiers),
  closeBrace: (modifiers: Partial<Key> = {}): KeyPress => charKey('}', modifiers),
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Type a string character by character
 */
export function typeString(str: string): KeyPress[] {
  return str.split('').map(char => charKey(char));
}

/**
 * Create a sequence of key presses
 */
export function keySequence(...keyPresses: KeyPress[]): KeyPress[] {
  return keyPresses;
}

/**
 * Simulate typing a number
 */
export function typeNumber(num: number): KeyPress[] {
  return typeString(String(num));
}

/**
 * Get letter key (a-z)
 */
export function letterKey(letter: string, modifiers: Partial<Key> = {}): KeyPress {
  return charKey(letter.toLowerCase(), modifiers);
}

/**
 * Create custom key combinations
 */
export function customKey(overrides: Partial<Key>, input = ''): KeyPress {
  return { input, key: createKey(overrides) };
}

// =============================================================================
// Input Handler Helper
// =============================================================================

export type InputHandler = (input: string, key: Key) => void;

/**
 * Create a test harness for input handling
 *
 * @example
 * ```typescript
 * const harness = createInputHarness((input, key) => {
 *   if (key.upArrow) selectedIndex--;
 * });
 *
 * harness.press(keys.up());
 * harness.type('hello');
 * harness.pressMany([keys.enter(), keys.escape()]);
 * ```
 */
export function createInputHarness(handler: InputHandler) {
  return {
    /**
     * Press a single key
     */
    press(keyPress: KeyPress): void {
      handler(keyPress.input, keyPress.key);
    },

    /**
     * Press multiple keys in sequence
     */
    pressMany(keyPresses: KeyPress[]): void {
      for (const kp of keyPresses) {
        handler(kp.input, kp.key);
      }
    },

    /**
     * Type a string character by character
     */
    type(str: string): void {
      this.pressMany(typeString(str));
    },

    /**
     * Type a number
     */
    typeNum(num: number): void {
      this.pressMany(typeNumber(num));
    },

    /**
     * Get the handler for direct use
     */
    getHandler(): InputHandler {
      return handler;
    },
  };
}

// =============================================================================
// Focus Simulation
// =============================================================================

export interface FocusState {
  isFocused: boolean;
  focus: () => void;
  blur: () => void;
  toggle: () => void;
}

/**
 * Create a focus state for testing
 *
 * @example
 * ```typescript
 * const focus = createFocusState();
 *
 * // Component only responds when focused
 * if (focus.isFocused) {
 *   harness.press(keys.up());
 * }
 *
 * focus.blur();
 * // Keys now have no effect
 * ```
 */
export function createFocusState(initialFocus = false): FocusState {
  let isFocused = initialFocus;

  return {
    get isFocused() {
      return isFocused;
    },
    focus() {
      isFocused = true;
    },
    blur() {
      isFocused = false;
    },
    toggle() {
      isFocused = !isFocused;
    },
  };
}

/**
 * Create an input handler that only responds when focused
 *
 * @example
 * ```typescript
 * const focus = createFocusState(true);
 * const handler = createFocusedHandler(focus, (input, key) => {
 *   // Only called when focused
 * });
 * ```
 */
export function createFocusedHandler(
  focusState: FocusState,
  handler: InputHandler
): InputHandler {
  return (input: string, key: Key) => {
    if (focusState.isFocused) {
      handler(input, key);
    }
  };
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Check if a key matches specific properties
 */
export function keyMatches(key: Key, expected: Partial<Key>): boolean {
  for (const [prop, value] of Object.entries(expected)) {
    if (key[prop as keyof Key] !== value) {
      return false;
    }
  }
  return true;
}

/**
 * Check if key is any arrow key
 */
export function isArrowKey(key: Key): boolean {
  return key.upArrow || key.downArrow || key.leftArrow || key.rightArrow;
}

/**
 * Check if key is a navigation key
 */
export function isNavigationKey(key: Key): boolean {
  return isArrowKey(key) || key.home || key.end || key.pageUp || key.pageDown;
}

/**
 * Check if key is an editing key
 */
export function isEditingKey(key: Key): boolean {
  return key.backspace || key.delete || key.clear;
}

/**
 * Check if key has any modifier
 */
export function hasModifier(key: Key): boolean {
  return key.ctrl || key.shift || key.meta || key.option;
}

/**
 * Check if key is a function key
 */
export function isFunctionKey(key: Key): boolean {
  return (
    key.f1 || key.f2 || key.f3 || key.f4 ||
    key.f5 || key.f6 || key.f7 || key.f8 ||
    key.f9 || key.f10 || key.f11 || key.f12
  );
}

/**
 * Get the name of the function key pressed (if any)
 */
export function getFunctionKeyName(key: Key): string | null {
  if (key.f1) return 'f1';
  if (key.f2) return 'f2';
  if (key.f3) return 'f3';
  if (key.f4) return 'f4';
  if (key.f5) return 'f5';
  if (key.f6) return 'f6';
  if (key.f7) return 'f7';
  if (key.f8) return 'f8';
  if (key.f9) return 'f9';
  if (key.f10) return 'f10';
  if (key.f11) return 'f11';
  if (key.f12) return 'f12';
  return null;
}

// =============================================================================
// Global Input Simulation (EventEmitter-based)
// =============================================================================

/**
 * Simulate input to all registered handlers via EventEmitter
 * This is the preferred way to test input handling.
 *
 * @example
 * ```typescript
 * simulateInput('a', createEmptyKey()); // Type 'a'
 * simulateInputFromKeyPress(keys.enter()); // Press Enter
 * ```
 */
export function simulateInput(input: string, key: Key): void {
  emitInput(input, key);
}

/**
 * Simulate input from a KeyPress object
 */
export function simulateInputFromKeyPress(keyPress: KeyPress): void {
  emitInput(keyPress.input, keyPress.key);
}

/**
 * Get the count of registered input handlers
 */
export function getHandlerCount(): number {
  return getInputHandlerCount();
}
