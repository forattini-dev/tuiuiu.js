/**
 * Advanced Input Handling System
 *
 * Features:
 * - Kitty Keyboard Protocol support
 * - Mouse events (click, drag, wheel, move)
 * - Bracketed paste mode
 * - Enhanced modifier detection
 * - Input state machine for text editing
 *
 * 
 */

// =============================================================================
// Types
// =============================================================================

/** Keyboard protocol modes */
export type KeyboardProtocol = 'legacy' | 'kitty' | 'xterm';

/** Mouse button */
export type MouseButton = 'left' | 'middle' | 'right' | 'none' | 'wheelUp' | 'wheelDown';

/** Mouse event type */
export type MouseEventType = 'down' | 'up' | 'move' | 'drag' | 'wheel';

/** Mouse event data */
export interface MouseEvent {
  type: MouseEventType;
  button: MouseButton;
  x: number;
  y: number;
  /** Pixels for high-precision mode */
  pixelX?: number;
  pixelY?: number;
  /** Modifiers */
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

/** Kitty key event with full modifier support */
export interface KittyKeyEvent {
  /** Key code (Unicode codepoint) */
  keyCode: number;
  /** Base layout key (for non-ASCII layouts) */
  baseKey?: number;
  /** Shifted key */
  shiftedKey?: number;
  /** Key text */
  text: string;
  /** Event type */
  eventType: 'press' | 'repeat' | 'release';
  /** Modifiers */
  modifiers: KeyModifiers;
}

/** Key modifiers */
export interface KeyModifiers {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
  super: boolean;
  hyper: boolean;
  meta: boolean;
  capsLock: boolean;
  numLock: boolean;
}

/** Paste event data */
export interface PasteEvent {
  text: string;
  isBracketed: boolean;
}

/** Parsed input result */
export interface ParsedInput {
  /** Raw input string */
  raw: string;
  /** Key events (may be multiple for paste) */
  keys: KittyKeyEvent[];
  /** Mouse event if present */
  mouse?: MouseEvent;
  /** Paste event if bracketed paste */
  paste?: PasteEvent;
  /** Unknown sequence */
  unknown?: string;
}

// =============================================================================
// Protocol Detection
// =============================================================================

let detectedProtocol: KeyboardProtocol | null = null;
let manualProtocol: KeyboardProtocol | null = null;

/**
 * Detect keyboard protocol support
 */
export function detectKeyboardProtocol(): KeyboardProtocol {
  if (manualProtocol) return manualProtocol;
  if (detectedProtocol) return detectedProtocol;

  // Check environment
  const kittyWindow = process.env.KITTY_WINDOW_ID;
  const termProgram = process.env.TERM_PROGRAM?.toLowerCase();
  const term = process.env.TERM?.toLowerCase() || '';

  // Kitty detection
  if (kittyWindow || termProgram === 'kitty') {
    detectedProtocol = 'kitty';
    return detectedProtocol;
  }

  // WezTerm supports Kitty protocol
  if (termProgram === 'wezterm') {
    detectedProtocol = 'kitty';
    return detectedProtocol;
  }

  // Foot terminal supports Kitty protocol
  if (term.includes('foot')) {
    detectedProtocol = 'kitty';
    return detectedProtocol;
  }

  // Default to legacy
  detectedProtocol = 'legacy';
  return detectedProtocol;
}

/**
 * Set keyboard protocol manually
 */
export function setKeyboardProtocol(protocol: KeyboardProtocol | null): void {
  manualProtocol = protocol;
}

/**
 * Get current keyboard protocol
 */
export function getKeyboardProtocol(): KeyboardProtocol {
  return manualProtocol || detectedProtocol || detectKeyboardProtocol();
}

/**
 * Reset protocol detection (for testing)
 */
export function resetKeyboardProtocol(): void {
  detectedProtocol = null;
  manualProtocol = null;
}

// =============================================================================
// Kitty Keyboard Protocol
// =============================================================================

/**
 * Enable Kitty keyboard protocol
 * Returns the escape sequence to enable it
 */
export function enableKittyProtocol(flags: number = 0b11111): string {
  // Flags:
  // 1 = Disambiguate escape codes
  // 2 = Report event types (press, repeat, release)
  // 4 = Report alternate keys
  // 8 = Report all keys as escape codes
  // 16 = Report associated text
  return `\x1b[>${flags}u`;
}

/**
 * Disable Kitty keyboard protocol
 */
export function disableKittyProtocol(): string {
  return '\x1b[<u';
}

/**
 * Query Kitty keyboard protocol status
 */
export function queryKittyProtocol(): string {
  return '\x1b[?u';
}

/**
 * Parse Kitty protocol key event
 * Format: CSI unicode-key-code:shifted-key:base-layout-key ; modifiers:event-type ; text-as-codepoints u
 */
export function parseKittyKeyEvent(seq: string): KittyKeyEvent | null {
  // Match CSI ... u format
  const match = seq.match(/^\x1b\[(?:(\d+)(?::(\d+))?(?::(\d+))?)?(?:;(\d+)(?::(\d+))?)?(?:;(.+))?u$/);
  if (!match) return null;

  const keyCode = parseInt(match[1] || '0', 10);
  const shiftedKey = match[2] ? parseInt(match[2], 10) : undefined;
  const baseKey = match[3] ? parseInt(match[3], 10) : undefined;
  const modifierBits = parseInt(match[4] || '1', 10) - 1;
  const eventTypeBits = parseInt(match[5] || '1', 10);
  const textCodes = match[6];

  // Parse modifiers
  const modifiers: KeyModifiers = {
    shift: !!(modifierBits & 1),
    alt: !!(modifierBits & 2),
    ctrl: !!(modifierBits & 4),
    super: !!(modifierBits & 8),
    hyper: !!(modifierBits & 16),
    meta: !!(modifierBits & 32),
    capsLock: !!(modifierBits & 64),
    numLock: !!(modifierBits & 128),
  };

  // Parse event type
  let eventType: 'press' | 'repeat' | 'release' = 'press';
  if (eventTypeBits === 2) eventType = 'repeat';
  else if (eventTypeBits === 3) eventType = 'release';

  // Parse text
  let text = '';
  if (textCodes) {
    text = textCodes
      .split(':')
      .map((code) => String.fromCodePoint(parseInt(code, 10)))
      .join('');
  } else if (keyCode >= 32 && keyCode < 127) {
    text = String.fromCharCode(keyCode);
  }

  return {
    keyCode,
    baseKey,
    shiftedKey,
    text,
    eventType,
    modifiers,
  };
}

// =============================================================================
// Mouse Input
// =============================================================================

/** Mouse tracking modes */
export type MouseMode = 'none' | 'x10' | 'normal' | 'button' | 'any' | 'sgr' | 'urxvt' | 'pixel';

/**
 * Enable mouse tracking
 */
export function enableMouseTracking(mode: MouseMode = 'sgr'): string {
  let seq = '';

  switch (mode) {
    case 'x10':
      seq = '\x1b[?9h'; // X10 mouse reporting
      break;
    case 'normal':
      seq = '\x1b[?1000h'; // Normal tracking mode
      break;
    case 'button':
      seq = '\x1b[?1002h'; // Button event tracking
      break;
    case 'any':
      seq = '\x1b[?1003h'; // Any event tracking (including motion)
      break;
    case 'sgr':
      seq = '\x1b[?1006h'; // SGR extended mode
      break;
    case 'urxvt':
      seq = '\x1b[?1015h'; // urxvt extended mode
      break;
    case 'pixel':
      seq = '\x1b[?1016h'; // SGR pixel mode
      break;
  }

  // Also enable button events for most modes
  if (mode !== 'x10' && mode !== 'none') {
    seq = '\x1b[?1002h' + seq;
  }

  return seq;
}

/**
 * Disable mouse tracking
 */
export function disableMouseTracking(): string {
  return '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l\x1b[?1015l\x1b[?1016l';
}

/**
 * Parse mouse event
 * Supports X10, normal, SGR, and urxvt formats
 */
export function parseMouseEvent(seq: string): MouseEvent | null {
  // SGR format: CSI < Cb ; Cx ; Cy M/m
  const sgrMatch = seq.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/);
  if (sgrMatch) {
    const cb = parseInt(sgrMatch[1]!, 10);
    const x = parseInt(sgrMatch[2]!, 10);
    const y = parseInt(sgrMatch[3]!, 10);
    const isRelease = sgrMatch[4] === 'm';

    return parseSGRMouse(cb, x, y, isRelease);
  }

  // SGR pixel format: CSI < Cb ; Px ; Py M/m
  const pixelMatch = seq.match(/^\x1b\[<(\d+);(\d+);(\d+);(\d+);(\d+)([Mm])$/);
  if (pixelMatch) {
    const cb = parseInt(pixelMatch[1]!, 10);
    const px = parseInt(pixelMatch[2]!, 10);
    const py = parseInt(pixelMatch[3]!, 10);
    const cx = parseInt(pixelMatch[4]!, 10);
    const cy = parseInt(pixelMatch[5]!, 10);
    const isRelease = pixelMatch[6] === 'm';

    const event = parseSGRMouse(cb, cx, cy, isRelease);
    if (event) {
      event.pixelX = px;
      event.pixelY = py;
    }
    return event;
  }

  // X10/Normal format: CSI M Cb Cx Cy
  const x10Match = seq.match(/^\x1b\[M([\x00-\xff])([\x00-\xff])([\x00-\xff])$/);
  if (x10Match) {
    const cb = x10Match[1]!.charCodeAt(0) - 32;
    const x = x10Match[2]!.charCodeAt(0) - 32;
    const y = x10Match[3]!.charCodeAt(0) - 32;

    return parseX10Mouse(cb, x, y);
  }

  // urxvt format: CSI Cb ; Cx ; Cy M
  const urxvtMatch = seq.match(/^\x1b\[(\d+);(\d+);(\d+)M$/);
  if (urxvtMatch) {
    const cb = parseInt(urxvtMatch[1]!, 10) - 32;
    const x = parseInt(urxvtMatch[2]!, 10);
    const y = parseInt(urxvtMatch[3]!, 10);

    return parseX10Mouse(cb, x, y);
  }

  return null;
}

function parseSGRMouse(cb: number, x: number, y: number, isRelease: boolean): MouseEvent {
  const button = cb & 0b11;
  const shift = !!(cb & 0b100);
  const alt = !!(cb & 0b1000);
  const ctrl = !!(cb & 0b10000);
  const motion = !!(cb & 0b100000);
  const wheel = !!(cb & 0b1000000);

  let mouseButton: MouseButton;
  let eventType: MouseEventType;

  if (wheel) {
    mouseButton = button === 0 ? 'wheelUp' : 'wheelDown';
    eventType = 'wheel';
  } else if (button === 0) {
    mouseButton = 'left';
    eventType = isRelease ? 'up' : motion ? 'drag' : 'down';
  } else if (button === 1) {
    mouseButton = 'middle';
    eventType = isRelease ? 'up' : motion ? 'drag' : 'down';
  } else if (button === 2) {
    mouseButton = 'right';
    eventType = isRelease ? 'up' : motion ? 'drag' : 'down';
  } else {
    mouseButton = 'none';
    eventType = motion ? 'move' : 'down';
  }

  return {
    type: eventType,
    button: mouseButton,
    x,
    y,
    ctrl,
    alt,
    shift,
    meta: false,
  };
}

function parseX10Mouse(cb: number, x: number, y: number): MouseEvent {
  const button = cb & 0b11;
  const shift = !!(cb & 0b100);
  const alt = !!(cb & 0b1000);
  const ctrl = !!(cb & 0b10000);
  const motion = !!(cb & 0b100000);

  let mouseButton: MouseButton;
  let eventType: MouseEventType;

  if (button === 0) {
    mouseButton = 'left';
    eventType = motion ? 'drag' : 'down';
  } else if (button === 1) {
    mouseButton = 'middle';
    eventType = motion ? 'drag' : 'down';
  } else if (button === 2) {
    mouseButton = 'right';
    eventType = motion ? 'drag' : 'down';
  } else if (button === 3) {
    mouseButton = 'none';
    eventType = motion ? 'move' : 'up';
  } else if ((cb & 0b1000000) !== 0) {
    mouseButton = (cb & 1) === 0 ? 'wheelUp' : 'wheelDown';
    eventType = 'wheel';
  } else {
    mouseButton = 'none';
    eventType = 'move';
  }

  return {
    type: eventType,
    button: mouseButton,
    x,
    y,
    ctrl,
    alt,
    shift,
    meta: false,
  };
}

// =============================================================================
// Bracketed Paste
// =============================================================================

const PASTE_START = '\x1b[200~';
const PASTE_END = '\x1b[201~';

/**
 * Enable bracketed paste mode
 */
export function enableBracketedPaste(): string {
  return '\x1b[?2004h';
}

/**
 * Disable bracketed paste mode
 */
export function disableBracketedPaste(): string {
  return '\x1b[?2004l';
}

/**
 * Check if input contains bracketed paste
 */
export function hasBracketedPaste(input: string): boolean {
  return input.includes(PASTE_START);
}

/**
 * Extract bracketed paste content
 */
export function extractBracketedPaste(input: string): { paste: string; remaining: string } | null {
  const startIdx = input.indexOf(PASTE_START);
  if (startIdx === -1) return null;

  const endIdx = input.indexOf(PASTE_END, startIdx);
  if (endIdx === -1) {
    // Incomplete paste, return content so far
    return {
      paste: input.slice(startIdx + PASTE_START.length),
      remaining: input.slice(0, startIdx),
    };
  }

  return {
    paste: input.slice(startIdx + PASTE_START.length, endIdx),
    remaining: input.slice(0, startIdx) + input.slice(endIdx + PASTE_END.length),
  };
}

// =============================================================================
// Input State Machine
// =============================================================================

/** Input state machine state */
export interface InputState {
  /** Current buffer content */
  buffer: string;
  /** Cursor position (character index) */
  cursor: number;
  /** Selection start (if selecting) */
  selectionStart: number | null;
  /** Selection end (if selecting) */
  selectionEnd: number | null;
  /** Composition mode (for IME) */
  composing: boolean;
  /** History for undo/redo */
  history: string[];
  /** Current history index */
  historyIndex: number;
}

/** Input action */
export type InputAction =
  | { type: 'insert'; text: string }
  | { type: 'delete'; direction: 'backward' | 'forward'; count?: number }
  | { type: 'deleteWord'; direction: 'backward' | 'forward' }
  | { type: 'deleteLine'; direction: 'toStart' | 'toEnd' | 'all' }
  | { type: 'move'; direction: 'left' | 'right' | 'home' | 'end' | 'wordLeft' | 'wordRight' }
  | { type: 'select'; direction: 'left' | 'right' | 'all' | 'word' | 'line' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'clear' };

/**
 * Create initial input state
 */
export function createInputState(initialValue = ''): InputState {
  return {
    buffer: initialValue,
    cursor: initialValue.length,
    selectionStart: null,
    selectionEnd: null,
    composing: false,
    history: [initialValue],
    historyIndex: 0,
  };
}

/**
 * Apply action to input state
 */
export function applyInputAction(state: InputState, action: InputAction): InputState {
  const newState = { ...state };

  // Save to history before modification (for non-movement actions)
  const saveHistory = () => {
    if (newState.buffer !== state.history[state.historyIndex]) {
      // Truncate future history
      newState.history = state.history.slice(0, state.historyIndex + 1);
      newState.history.push(newState.buffer);
      newState.historyIndex = newState.history.length - 1;
    }
  };

  switch (action.type) {
    case 'insert': {
      // Delete selection first if present
      if (state.selectionStart !== null && state.selectionEnd !== null) {
        const start = Math.min(state.selectionStart, state.selectionEnd);
        const end = Math.max(state.selectionStart, state.selectionEnd);
        newState.buffer = state.buffer.slice(0, start) + state.buffer.slice(end);
        newState.cursor = start;
        newState.selectionStart = null;
        newState.selectionEnd = null;
      }
      // Insert text at cursor
      newState.buffer =
        newState.buffer.slice(0, newState.cursor) + action.text + newState.buffer.slice(newState.cursor);
      newState.cursor += action.text.length;
      saveHistory();
      break;
    }

    case 'delete': {
      if (state.selectionStart !== null && state.selectionEnd !== null) {
        const start = Math.min(state.selectionStart, state.selectionEnd);
        const end = Math.max(state.selectionStart, state.selectionEnd);
        newState.buffer = state.buffer.slice(0, start) + state.buffer.slice(end);
        newState.cursor = start;
        newState.selectionStart = null;
        newState.selectionEnd = null;
      } else if (action.direction === 'backward') {
        const count = action.count ?? 1;
        if (state.cursor > 0) {
          const deleteFrom = Math.max(0, state.cursor - count);
          newState.buffer = state.buffer.slice(0, deleteFrom) + state.buffer.slice(state.cursor);
          newState.cursor = deleteFrom;
        }
      } else {
        const count = action.count ?? 1;
        if (state.cursor < state.buffer.length) {
          newState.buffer = state.buffer.slice(0, state.cursor) + state.buffer.slice(state.cursor + count);
        }
      }
      saveHistory();
      break;
    }

    case 'deleteWord': {
      if (action.direction === 'backward') {
        // Find word boundary backwards
        let pos = state.cursor;
        // Skip whitespace
        while (pos > 0 && /\s/.test(state.buffer[pos - 1]!)) pos--;
        // Skip word characters
        while (pos > 0 && /\S/.test(state.buffer[pos - 1]!)) pos--;
        newState.buffer = state.buffer.slice(0, pos) + state.buffer.slice(state.cursor);
        newState.cursor = pos;
      } else {
        let pos = state.cursor;
        // Skip whitespace
        while (pos < state.buffer.length && /\s/.test(state.buffer[pos]!)) pos++;
        // Skip word characters
        while (pos < state.buffer.length && /\S/.test(state.buffer[pos]!)) pos++;
        newState.buffer = state.buffer.slice(0, state.cursor) + state.buffer.slice(pos);
      }
      saveHistory();
      break;
    }

    case 'deleteLine': {
      if (action.direction === 'toStart') {
        newState.buffer = state.buffer.slice(state.cursor);
        newState.cursor = 0;
      } else if (action.direction === 'toEnd') {
        newState.buffer = state.buffer.slice(0, state.cursor);
      } else {
        newState.buffer = '';
        newState.cursor = 0;
      }
      saveHistory();
      break;
    }

    case 'move': {
      newState.selectionStart = null;
      newState.selectionEnd = null;

      switch (action.direction) {
        case 'left':
          newState.cursor = Math.max(0, state.cursor - 1);
          break;
        case 'right':
          newState.cursor = Math.min(state.buffer.length, state.cursor + 1);
          break;
        case 'home':
          newState.cursor = 0;
          break;
        case 'end':
          newState.cursor = state.buffer.length;
          break;
        case 'wordLeft': {
          let pos = state.cursor;
          while (pos > 0 && /\s/.test(state.buffer[pos - 1]!)) pos--;
          while (pos > 0 && /\S/.test(state.buffer[pos - 1]!)) pos--;
          newState.cursor = pos;
          break;
        }
        case 'wordRight': {
          let pos = state.cursor;
          while (pos < state.buffer.length && /\S/.test(state.buffer[pos]!)) pos++;
          while (pos < state.buffer.length && /\s/.test(state.buffer[pos]!)) pos++;
          newState.cursor = pos;
          break;
        }
      }
      break;
    }

    case 'select': {
      if (state.selectionStart === null) {
        newState.selectionStart = state.cursor;
      }

      switch (action.direction) {
        case 'left':
          newState.cursor = Math.max(0, state.cursor - 1);
          newState.selectionEnd = newState.cursor;
          break;
        case 'right':
          newState.cursor = Math.min(state.buffer.length, state.cursor + 1);
          newState.selectionEnd = newState.cursor;
          break;
        case 'all':
          newState.selectionStart = 0;
          newState.selectionEnd = state.buffer.length;
          newState.cursor = state.buffer.length;
          break;
        case 'word': {
          // Select current word
          let start = state.cursor;
          let end = state.cursor;
          while (start > 0 && /\S/.test(state.buffer[start - 1]!)) start--;
          while (end < state.buffer.length && /\S/.test(state.buffer[end]!)) end++;
          newState.selectionStart = start;
          newState.selectionEnd = end;
          newState.cursor = end;
          break;
        }
        case 'line':
          newState.selectionStart = 0;
          newState.selectionEnd = state.buffer.length;
          newState.cursor = state.buffer.length;
          break;
      }
      break;
    }

    case 'undo': {
      if (state.historyIndex > 0) {
        newState.historyIndex = state.historyIndex - 1;
        newState.buffer = state.history[newState.historyIndex]!;
        newState.cursor = newState.buffer.length;
        newState.selectionStart = null;
        newState.selectionEnd = null;
      }
      break;
    }

    case 'redo': {
      if (state.historyIndex < state.history.length - 1) {
        newState.historyIndex = state.historyIndex + 1;
        newState.buffer = state.history[newState.historyIndex]!;
        newState.cursor = newState.buffer.length;
        newState.selectionStart = null;
        newState.selectionEnd = null;
      }
      break;
    }

    case 'clear': {
      newState.buffer = '';
      newState.cursor = 0;
      newState.selectionStart = null;
      newState.selectionEnd = null;
      saveHistory();
      break;
    }
  }

  return newState;
}

/**
 * Get selected text from state
 */
export function getSelectedText(state: InputState): string | null {
  if (state.selectionStart === null || state.selectionEnd === null) {
    return null;
  }
  const start = Math.min(state.selectionStart, state.selectionEnd);
  const end = Math.max(state.selectionStart, state.selectionEnd);
  return state.buffer.slice(start, end);
}

// =============================================================================
// Unified Input Parser
// =============================================================================

/**
 * Parse raw terminal input into structured events
 */
export function parseInput(input: string | Buffer): ParsedInput {
  const raw = input.toString();
  const result: ParsedInput = {
    raw,
    keys: [],
  };

  // Check for bracketed paste first
  if (hasBracketedPaste(raw)) {
    const extracted = extractBracketedPaste(raw);
    if (extracted) {
      result.paste = {
        text: extracted.paste,
        isBracketed: true,
      };
      // Process remaining input
      if (extracted.remaining) {
        const remainingResult = parseInput(extracted.remaining);
        result.keys = remainingResult.keys;
        result.mouse = remainingResult.mouse;
      }
      return result;
    }
  }

  // Check for mouse event
  const mouseEvent = parseMouseEvent(raw);
  if (mouseEvent) {
    result.mouse = mouseEvent;
    return result;
  }

  // Check for Kitty protocol key event
  if (raw.includes('\x1b[') && raw.endsWith('u')) {
    const kittyEvent = parseKittyKeyEvent(raw);
    if (kittyEvent) {
      result.keys.push(kittyEvent);
      return result;
    }
  }

  // Fall back to legacy parsing
  // Convert to default key event format
  const legacyKey = parseLegacyKey(raw);
  if (legacyKey) {
    result.keys.push(legacyKey);
  }

  return result;
}

/**
 * Parse legacy key format
 */
function parseLegacyKey(input: string): KittyKeyEvent | null {
  if (!input) return null;

  const modifiers: KeyModifiers = {
    shift: false,
    alt: false,
    ctrl: false,
    super: false,
    hyper: false,
    meta: false,
    capsLock: false,
    numLock: false,
  };

  let keyCode = 0;
  let text = '';

  // Single character
  if (input.length === 1) {
    keyCode = input.charCodeAt(0);
    text = input;

    // Check for Ctrl+letter (0x01-0x1a)
    if (keyCode >= 1 && keyCode <= 26) {
      modifiers.ctrl = true;
      keyCode = keyCode + 96; // Convert to lowercase letter
      text = String.fromCharCode(keyCode);
    }

    // Check for uppercase (shift)
    if (input >= 'A' && input <= 'Z') {
      modifiers.shift = true;
    }
  }

  // Meta+character
  const metaMatch = input.match(/^\x1b(.)$/);
  if (metaMatch) {
    modifiers.alt = true;
    keyCode = metaMatch[1]!.charCodeAt(0);
    text = metaMatch[1]!;
  }

  // Special keys
  if (input === '\r' || input === '\n') {
    keyCode = 13;
    text = '';
  } else if (input === '\t') {
    keyCode = 9;
    text = '';
  } else if (input === '\x7f' || input === '\b') {
    keyCode = 127;
    text = '';
  } else if (input === '\x1b') {
    keyCode = 27;
    text = '';
  }

  if (keyCode === 0 && !text) {
    return null;
  }

  return {
    keyCode,
    text,
    eventType: 'press',
    modifiers,
  };
}

// =============================================================================
// Terminal Mode Control
// =============================================================================

/**
 * Enter raw mode (for reading individual keypresses)
 */
export function enterRawMode(): string {
  return '';
}

/**
 * Exit raw mode
 */
export function exitRawMode(): string {
  return '';
}

/**
 * Enable alternate screen buffer
 */
export function enableAlternateScreen(): string {
  return '\x1b[?1049h';
}

/**
 * Disable alternate screen buffer
 */
export function disableAlternateScreen(): string {
  return '\x1b[?1049l';
}

/**
 * Hide cursor
 */
export function hideCursor(): string {
  return '\x1b[?25l';
}

/**
 * Show cursor
 */
export function showCursor(): string {
  return '\x1b[?25h';
}

/**
 * Request cursor position report
 */
export function requestCursorPosition(): string {
  return '\x1b[6n';
}

/**
 * Parse cursor position report
 */
export function parseCursorPosition(response: string): { row: number; col: number } | null {
  const match = response.match(/^\x1b\[(\d+);(\d+)R$/);
  if (!match) return null;
  return {
    row: parseInt(match[1]!, 10),
    col: parseInt(match[2]!, 10),
  };
}
