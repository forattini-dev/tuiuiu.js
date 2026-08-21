/** Terminal protocol helpers shared by the app input boundary. */

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

export interface KittyKeyEvent {
  keyCode: number;
  baseKey?: number;
  shiftedKey?: number;
  text: string;
  eventType: 'press' | 'repeat' | 'release';
  modifiers: KeyModifiers;
}

export interface TerminalFocusEvent {
  focused: boolean;
}

/** Parse one complete Kitty keyboard protocol event. */
export function parseKittyKeyEvent(sequence: string): KittyKeyEvent | null {
  const match = sequence.match(
    /^\x1b\[(?:(\d+)(?::(\d+))?(?::(\d+))?)?(?:;(\d+)(?::(\d+))?)?(?:;(.+))?u$/u,
  );
  if (!match) return null;

  const parseInteger = (
    value: string | undefined,
    fallback?: number,
  ): number | null => {
    if (value === undefined) return fallback ?? null;
    if (!/^\d+$/u.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  };
  const isCodePoint = (value: number): boolean =>
    value >= 0
    && value <= 0x10ffff
    && !(value >= 0xd800 && value <= 0xdfff);

  const keyCode = parseInteger(match[1], 0);
  const shiftedKey = parseInteger(match[2]);
  const baseKey = parseInteger(match[3]);
  const encodedModifiers = parseInteger(match[4], 1);
  const eventTypeBits = parseInteger(match[5], 1);
  const textCodes = match[6];
  if (
    keyCode === null
    || encodedModifiers === null
    || encodedModifiers < 1
    || eventTypeBits === null
    || (shiftedKey !== null && !isCodePoint(shiftedKey))
    || (baseKey !== null && !isCodePoint(baseKey))
  ) {
    return null;
  }

  const modifierBits = encodedModifiers - 1;
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

  let eventType: KittyKeyEvent['eventType'] = 'press';
  if (eventTypeBits === 2) eventType = 'repeat';
  else if (eventTypeBits === 3) eventType = 'release';

  let text = '';
  if (textCodes) {
    const codePoints = textCodes.split(':').map((code) => parseInteger(code));
    if (
      codePoints.length === 0
      || codePoints.some((code): code is null => code === null || !isCodePoint(code))
    ) {
      return null;
    }
    text = codePoints.map((code) => String.fromCodePoint(code!)).join('');
  } else if (keyCode >= 32 && keyCode < 127) {
    text = String.fromCharCode(keyCode);
  }

  return {
    keyCode,
    baseKey: baseKey ?? undefined,
    shiftedKey: shiftedKey ?? undefined,
    text,
    eventType,
    modifiers,
  };
}

export const PASTE_START = '\x1b[200~';
export const PASTE_END = '\x1b[201~';
const FOCUS_IN = '\x1b[I';
const FOCUS_OUT = '\x1b[O';

export function enableBracketedPaste(): string {
  return '\x1b[?2004h';
}

export function disableBracketedPaste(): string {
  return '\x1b[?2004l';
}

export function enableFocusEvents(): string {
  return '\x1b[?1004h';
}

export function disableFocusEvents(): string {
  return '\x1b[?1004l';
}

export function parseFocusEvent(input: string): TerminalFocusEvent | null {
  if (input === FOCUS_IN) return { focused: true };
  if (input === FOCUS_OUT) return { focused: false };
  return null;
}

export function enableAlternateScreen(): string {
  return '\x1b[?1049h';
}

export function disableAlternateScreen(): string {
  return '\x1b[?1049l';
}
