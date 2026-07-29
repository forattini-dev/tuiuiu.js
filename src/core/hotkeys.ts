/**
 * Hotkeys & Input Processing
 *
 * Handles raw input parsing and hotkey matching.
 */

import { parseKittyKeyEvent } from './input.js';

export interface Key {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  pageUp: boolean;
  pageDown: boolean;
  home: boolean;
  end: boolean;
  insert: boolean;
  return: boolean;
  escape: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  clear: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  option: boolean;
  f1: boolean;
  f2: boolean;
  f3: boolean;
  f4: boolean;
  f5: boolean;
  f6: boolean;
  f7: boolean;
  f8: boolean;
  f9: boolean;
  f10: boolean;
  f11: boolean;
  f12: boolean;
  /** Event phase reported by enhanced keyboard protocols. */
  eventType?: 'press' | 'repeat' | 'release';
}

export type InputHandler = (input: string, key: Key) => void;

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
const KITTY_KEY_RE = /^\x1b\[\d+(?::\d*){0,2}(?:;\d+(?::\d+)?)?(?:;[0-9:]+)?u/;
const MODIFY_OTHER_KEYS_RE = /^\x1b\[27;(\d+);(\d+)~/;

function applyModifierCode(key: Key, encodedModifier: number): boolean {
  if (
    !Number.isSafeInteger(encodedModifier) ||
    encodedModifier < 1 ||
    encodedModifier > 16
  ) {
    return false;
  }
  const modifier = encodedModifier - 1;
  key.shift = !!(modifier & 1);
  key.option = !!(modifier & 2);
  key.ctrl = !!(modifier & 4);
  key.meta = !!(modifier & (2 | 8 | 16 | 32));
  return true;
}

function isUnicodeScalar(value: number): boolean {
  return (
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= 0x10ffff &&
    !(value >= 0xd800 && value <= 0xdfff)
  );
}

function applyEncodedKey(
  key: Key,
  keyCode: number,
  associatedText = '',
): string {
  switch (keyCode) {
    case 9:
      key.tab = true;
      return '';
    case 13:
      key.return = true;
      return '';
    case 27:
      key.escape = true;
      return '';
    case 127:
      key.backspace = true;
      return '';
  }

  if (
    !isUnicodeScalar(keyCode) ||
    (keyCode >= 57344 && keyCode <= 63743)
  ) {
    return '';
  }

  return associatedText || String.fromCodePoint(keyCode);
}

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
export function parseKeypress(data: Buffer | string): { input: string; key: Key; length: number } {
  let str = data.toString();

  // Handle high-bit meta prefix (some terminals)
  if (Buffer.isBuffer(data) && data[0] !== undefined && data[0] > 127 && data[1] === undefined) {
    str = '\u001b' + String.fromCharCode(data[0] - 128);
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
    return { input, key, length: 1 };
  }

  // Enter/newline
  if (str === '\n') {
    key.return = true;
    return { input, key, length: 1 };
  }

  // Alt+Enter (ESC + carriage return or newline)
  if (str === '\x1b\r' || str === '\x1b\n') {
    key.return = true;
    key.meta = true;
    return { input, key, length: 2 };
  }

  // Ctrl+Alt+Enter (ESC + Ctrl+M which is \x0d)
  if (str === '\x1b\x0d') {
    key.return = true;
    key.meta = true;
    key.ctrl = true;
    return { input, key, length: 2 };
  }

  // Tab
  if (str === '\t') {
    key.tab = true;
    return { input, key, length: 1 };
  }

  // Backspace - most terminals send \x7f (DEL) for backspace key
  // Some older terminals send \b (BS)
  if (str === '\x7f' || str === '\b') {
    key.backspace = true;
    return { input, key, length: 1 };
  }
  
  if (str === '\x1b\x7f' || str === '\x1b\b') {
    key.backspace = true;
    key.meta = true;
    return { input, key, length: 2 };
  }

  // Escape
  if (str === '\x1b') {
    key.escape = true;
    return { input, key, length: 1 };
  }
  
  if (str === '\x1b\x1b') {
    key.escape = true;
    key.meta = true;
    return { input, key, length: 2 };
  }

  // Space (with possible meta)
  if (str === ' ') {
    input = ' ';
    return { input, key, length: 1 };
  }
  
  if (str === '\x1b ') {
    key.meta = true;
    input = ' ';
    return { input, key, length: 2 };
  }

  // Ctrl+letter (0x01-0x1a)
  if (str.length >= 1 && str.charCodeAt(0) <= 26) {
    key.ctrl = true;
    input = String.fromCharCode(str.charCodeAt(0) + 'a'.charCodeAt(0) - 1);
    return { input, key, length: 1 };
  }

  // Kitty keyboard protocol: CSI codepoint;modifiers:event-type;text u
  const kittyMatch = KITTY_KEY_RE.exec(str);
  if (kittyMatch) {
    const event = parseKittyKeyEvent(kittyMatch[0]);
    if (event) {
      key.shift = event.modifiers.shift;
      key.option = event.modifiers.alt;
      key.ctrl = event.modifiers.ctrl;
      key.meta =
        event.modifiers.alt ||
        event.modifiers.super ||
        event.modifiers.hyper ||
        event.modifiers.meta;
      key.eventType = event.eventType;
      const hasAssociatedText = kittyMatch[0].split(';').length >= 3;
      input = applyEncodedKey(
        key,
        event.keyCode,
        hasAssociatedText ? event.text : '',
      );
      return {
        input,
        key,
        length: kittyMatch[0].length,
      };
    }
  }

  // xterm modifyOtherKeys: CSI 27 ; modifier ; Unicode-codepoint ~
  const modifyOtherKeysMatch = MODIFY_OTHER_KEYS_RE.exec(str);
  if (modifyOtherKeysMatch) {
    const encodedModifier = Number(modifyOtherKeysMatch[1]);
    const keyCode = Number(modifyOtherKeysMatch[2]);
    if (
      applyModifierCode(key, encodedModifier) &&
      isUnicodeScalar(keyCode)
    ) {
      input = applyEncodedKey(key, keyCode);
      key.eventType = 'press';
      return {
        input,
        key,
        length: modifyOtherKeysMatch[0].length,
      };
    }
  }

  // Function keys and special keys with escape sequences
  // Try to match escape sequences first before single chars
  const fnMatch = FN_KEY_RE.exec(str);
  if (fnMatch && fnMatch.index === 0) {
    // Check for option key (double escape at start)
    const segs = [...str];
    if (segs[0] === '\u001b' && segs[1] === '\u001b') {
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

    return { input, key, length: fnMatch[0].length };
  }

  // Meta+character
  const metaMatch = /^(?:)([a-zA-Z0-9])/.exec(str);
  if (metaMatch) {
    key.meta = true;
    key.shift = /^[A-Z]$/.test(metaMatch[1]!);
    input = metaMatch[1]!.toLowerCase();
    return { input, key, length: 2 };
  }

  // Read until a C0 control or DEL.
  const textMatch = /^[^\x00-\x1f\x7f]+/u.exec(str);
  if (textMatch) {
      const text = textMatch[0];
      
      // If exactly 1 char and uppercase, normalize it (legacy behavior)
      if (text.length === 1 && text >= 'A' && text <= 'Z') {
          key.shift = true;
          input = text.toLowerCase();
          return { input, key, length: 1 };
      }
      
      input = text;
      return { input, key, length: text.length };
  }

  return { input, key, length: str.length }; // Fallback
}

/**
 * Check if a key event matches a hotkey string.
 * 
 * Pattern format: "modifier+key"
 * Modifiers: ctrl, shift, meta, alt (alias for meta), opt (alias for option)
 * Keys: a-z, 0-9, return, enter, escape, esc, tab, backspace, delete, up, down, left, right, home, end, pageup, pagedown, f1-f12
 * 
 * @example
 * isHotkey('ctrl+c', key)
 * isHotkey('shift+enter', key)
 * isHotkey('esc', key)
 */
export function isHotkey(pattern: string, key: Key, input?: string): boolean {
  const normalizedPattern = pattern.trim().toLowerCase();
  let parts: string[];
  let targetKey: string;

  if (normalizedPattern === '+') {
    parts = [];
    targetKey = '+';
  } else if (normalizedPattern.endsWith('++')) {
    parts = normalizedPattern.slice(0, -2).split('+').filter(Boolean);
    targetKey = '+';
  } else {
    parts = normalizedPattern.split('+');
    targetKey = parts.pop() ?? '';
  }
  const modifiers = new Set(parts);
  const knownModifiers = new Set([
    'ctrl',
    'shift',
    'meta',
    'alt',
    'option',
    'opt',
  ]);
  if (!targetKey || parts.some(part => !knownModifiers.has(part))) {
    return false;
  }

  // Check modifiers
  if (modifiers.has('ctrl') && !key.ctrl) return false;
  if (modifiers.has('shift') && !key.shift) return false;
  if ((modifiers.has('meta') || modifiers.has('alt')) && !key.meta) return false;
  if ((modifiers.has('option') || modifiers.has('opt')) && !key.option) return false;

  // Ensure no extra modifiers are pressed (strict match)
  // If pattern says 'ctrl+c', and user presses 'ctrl+shift+c', should it match?
  // Usually strict matching is preferred for explicit hotkeys.
  if (key.ctrl && !modifiers.has('ctrl')) return false;
  if (key.shift && !modifiers.has('shift')) return false;
  if (key.meta && !modifiers.has('meta') && !modifiers.has('alt')) return false;
  if (key.option && !modifiers.has('option') && !modifiers.has('opt')) return false;

  // Check specific key
  switch (targetKey) {
    case 'return':
    case 'enter': return key.return;
    case 'escape':
    case 'esc': return key.escape;
    case 'tab': return key.tab;
    case 'backspace': return key.backspace;
    case 'delete':
    case 'del': return key.delete;
    case 'up': return key.upArrow;
    case 'down': return key.downArrow;
    case 'left': return key.leftArrow;
    case 'right': return key.rightArrow;
    case 'pageup': return key.pageUp;
    case 'pagedown': return key.pageDown;
    case 'home': return key.home;
    case 'end': return key.end;
    case 'space': return input === ' ';
    case 'plus':
    case '+': return input === '+';
  }

  // Function keys
  if (/^f\d+$/.test(targetKey)) {
    return (key as any)[targetKey];
  }

  // Character match
  if (targetKey.length === 1) {
    return input?.toLowerCase() === targetKey;
  }

  return false;
}
