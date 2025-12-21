/**
 * useInput - Handle keyboard input
 */

import {
  addInputHandler,
  removeInputHandler,
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
} from './context.js';
import type { Key, InputHandler } from './types.js';

export type { Key, InputHandler };

/**
 * Key name mapping from escape sequences
 * Supports xterm, gnome, rxvt, putty, cygwin terminals
 */
const KEY_NAME_MAP: Record<string, string> = {
  // xterm/gnome ESC O letter
  'OP': 'f1', 'OQ': 'f2', 'OR': 'f3', 'OS': 'f4',
  // xterm/rxvt ESC [ number ~
  '[11~': 'f1', '[12~': 'f2', '[13~': 'f3', '[14~': 'f4',
  // Cygwin / libuv
  '[[A': 'f1', '[[B': 'f2', '[[C': 'f3', '[[D': 'f4', '[[E': 'f5',
  // Common function keys
  '[15~': 'f5', '[17~': 'f6', '[18~': 'f7', '[19~': 'f8',
  '[20~': 'f9', '[21~': 'f10', '[23~': 'f11', '[24~': 'f12',
  // xterm ESC [ letter
  '[A': 'up', '[B': 'down', '[C': 'right', '[D': 'left',
  '[E': 'clear', '[F': 'end', '[H': 'home',
  // xterm/gnome ESC O letter
  'OA': 'up', 'OB': 'down', 'OC': 'right', 'OD': 'left',
  'OE': 'clear', 'OF': 'end', 'OH': 'home',
  // xterm/rxvt navigation
  '[1~': 'home', '[2~': 'insert', '[3~': 'delete', '[4~': 'end',
  '[5~': 'pageup', '[6~': 'pagedown',
  // Putty
  '[[5~': 'pageup', '[[6~': 'pagedown',
  // rxvt
  '[7~': 'home', '[8~': 'end',
  // rxvt with Shift
  '[a': 'up', '[b': 'down', '[c': 'right', '[d': 'left', '[e': 'clear',
  '[2$': 'insert', '[3$': 'delete', '[5$': 'pageup', '[6$': 'pagedown',
  '[7$': 'home', '[8$': 'end',
  // rxvt with Ctrl
  'Oa': 'up', 'Ob': 'down', 'Oc': 'right', 'Od': 'left', 'Oe': 'clear',
  '[2^': 'insert', '[3^': 'delete', '[5^': 'pageup', '[6^': 'pagedown',
  '[7^': 'home', '[8^': 'end',
  // Shift+Tab
  '[Z': 'tab',
};

// Sequences that indicate Shift modifier
const SHIFT_CODES = new Set(['[a', '[b', '[c', '[d', '[e', '[2$', '[3$', '[5$', '[6$', '[7$', '[8$', '[Z']);

// Sequences that indicate Ctrl modifier
const CTRL_CODES = new Set(['Oa', 'Ob', 'Oc', 'Od', 'Oe', '[2^', '[3^', '[5^', '[6^', '[7^', '[8^']);

// Regex to parse function key escape sequences with modifiers
const FN_KEY_RE = /^(?:\x1b+)(O|N|\[|\[\[)(?:(\d+)(?:;(\d+))?([~^$])|(?:1;)?(\d+)?([a-zA-Z]))/;

/**
 * Apply key name to key object
 */
function applyKeyName(key: Key, name: string): void {
  switch (name) {
    case 'up': key.upArrow = true; break;
    case 'down': key.downArrow = true; break;
    case 'left': key.leftArrow = true; break;
    case 'right': key.rightArrow = true; break;
    case 'pageup': key.pageUp = true; break;
    case 'pagedown': key.pageDown = true; break;
    case 'home': key.home = true; break;
    case 'end': key.end = true; break;
    case 'insert': key.insert = true; break;
    case 'delete': key.delete = true; break;
    case 'clear': key.clear = true; break;
    case 'tab': key.tab = true; break;
    case 'f1': key.f1 = true; break;
    case 'f2': key.f2 = true; break;
    case 'f3': key.f3 = true; break;
    case 'f4': key.f4 = true; break;
    case 'f5': key.f5 = true; break;
    case 'f6': key.f6 = true; break;
    case 'f7': key.f7 = true; break;
    case 'f8': key.f8 = true; break;
    case 'f9': key.f9 = true; break;
    case 'f10': key.f10 = true; break;
    case 'f11': key.f11 = true; break;
    case 'f12': key.f12 = true; break;
  }
}

/**
 * Parse raw input data into key info
 * Supports multiple terminal types: xterm, gnome, rxvt, putty, cygwin
 */
export function parseKeypress(data: Buffer | string): { input: string; key: Key } {
  let str = data.toString();

  // Handle high-bit meta prefix (some terminals)
  if (Buffer.isBuffer(data) && data[0] !== undefined && data[0] > 127 && data[1] === undefined) {
    str = '\x1b' + String.fromCharCode(data[0] - 128);
  }

  const key: Key = {
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

  let input = '';

  // Carriage return
  if (str === '\r') {
    key.return = true;
    return { input, key };
  }

  // Enter/newline
  if (str === '\n') {
    key.return = true;
    return { input, key };
  }

  // Tab
  if (str === '\t') {
    key.tab = true;
    return { input, key };
  }

  // Backspace - most terminals send \x7f (DEL) for backspace key
  // Some older terminals send \b (BS)
  if (str === '\x7f' || str === '\x1b\x7f' || str === '\b' || str === '\x1b\b') {
    key.backspace = true;
    key.meta = str.charAt(0) === '\x1b';
    return { input, key };
  }

  // Escape
  if (str === '\x1b' || str === '\x1b\x1b') {
    key.escape = true;
    key.meta = str.length === 2;
    return { input, key };
  }

  // Space (with possible meta)
  if (str === ' ' || str === '\x1b ') {
    key.meta = str.length === 2;
    input = ' ';
    return { input, key };
  }

  // Ctrl+letter (0x01-0x1a)
  if (str.length === 1 && str <= '\x1a') {
    key.ctrl = true;
    input = String.fromCharCode(str.charCodeAt(0) + 'a'.charCodeAt(0) - 1);
    return { input, key };
  }

  // Number keys
  if (str.length === 1 && str >= '0' && str <= '9') {
    input = str;
    return { input, key };
  }

  // Lowercase letter
  if (str.length === 1 && str >= 'a' && str <= 'z') {
    input = str;
    return { input, key };
  }

  // Uppercase letter (shift)
  if (str.length === 1 && str >= 'A' && str <= 'Z') {
    key.shift = true;
    input = str.toLowerCase();
    return { input, key };
  }

  // Meta+character
  const metaMatch = /^(?:\x1b)([a-zA-Z0-9])$/.exec(str);
  if (metaMatch) {
    key.meta = true;
    key.shift = /^[A-Z]$/.test(metaMatch[1]!);
    input = metaMatch[1]!.toLowerCase();
    return { input, key };
  }

  // Function keys and special keys with escape sequences
  const fnMatch = FN_KEY_RE.exec(str);
  if (fnMatch) {
    // Check for option key (double escape at start)
    const segs = [...str];
    if (segs[0] === '\x1b' && segs[1] === '\x1b') {
      key.option = true;
    }

    // Build key code from parts
    const code = [fnMatch[1], fnMatch[2], fnMatch[4], fnMatch[6]]
      .filter(Boolean)
      .join('');

    // Parse modifier bits (CSI 1;n format)
    const modifier = ((fnMatch[3] || fnMatch[5] || 1) as unknown as number) - 1;
    key.ctrl = !!(modifier & 4);
    key.meta = !!(modifier & 10);
    key.shift = !!(modifier & 1);

    // Map to key name
    const keyName = KEY_NAME_MAP[code];
    if (keyName) {
      applyKeyName(key, keyName);
    }

    // Check for shift/ctrl from code pattern
    if (SHIFT_CODES.has(code)) key.shift = true;
    if (CTRL_CODES.has(code)) key.ctrl = true;

    return { input, key };
  }

  // Regular character
  if (str.length === 1 && str.charCodeAt(0) >= 32) {
    input = str;
    return { input, key };
  }

  // Multi-character paste
  if (str.length > 1 && !str.startsWith('\x1b')) {
    input = str;
  }

  return { input, key };
}

/**
 * useInput - Handle keyboard input
 *
 * Uses hook state persistence to avoid registering duplicate handlers
 * across re-renders.
 *
 * @example
 * useInput((input, key) => {
 *   if (key.return) {
 *     submit();
 *   } else if (key.escape) {
 *     cancel();
 *   } else {
 *     setInput(prev => prev + input);
 *   }
 * });
 */
export function useInput(handler: InputHandler, options: { isActive?: boolean } = {}): void {
  const { isActive = true } = options;

  // Get or create hook state for this useInput call
  const { value: hookData, isNew } = getHookState<{
    handler: InputHandler;
    wrapper: InputHandler;
    registered: boolean;
  } | null>(null);

  if (isNew || hookData === null) {
    // First render - create wrapper and register
    const wrapper: InputHandler = (input, key) => {
      // Always call the latest handler (stored in hookData)
      const data = getStoredHookData();
      if (data && data.registered) {
        data.handler(input, key);
      }
    };

    const data = {
      handler,
      wrapper,
      registered: isActive,
    };

    // Store the data
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);

    // Helper to get stored data (closure over hookIndex)
    function getStoredHookData() {
      return getHookStateByIndex(hookIndex) as typeof data | null;
    }

    if (isActive) {
      addInputHandler(wrapper);
    }
  } else {
    // Subsequent render - update handler reference and active state
    const prevRegistered = hookData.registered;
    hookData.handler = handler; // Update to latest handler
    hookData.registered = isActive;

    // Handle activation/deactivation
    if (isActive && !prevRegistered) {
      addInputHandler(hookData.wrapper);
    } else if (!isActive && prevRegistered) {
      removeInputHandler(hookData.wrapper);
    }
  }
}
