/**
 * Terminal control-sequence parsing and sanitization.
 *
 * Normal component text is allowed to contain SGR styling (CSI ... m), but it
 * must never be able to execute cursor movement, erase commands, OSC, DCS, or
 * other terminal protocols. Protocol builders use the stricter OSC field
 * sanitizer because a BEL or ST inside a field would terminate the sequence.
 */

export interface TerminalSequence {
  /** Index immediately after the consumed sequence. */
  end: number;
  /** Full sequence, including ESC and final byte. */
  value: string;
  /** Only strictly-valid SGR sequences are classified as styling. */
  kind: 'sgr' | 'control';
}

const ESC = '\x1b';
const BEL = '\x07';
const ST = `${ESC}\\`;

function isCsiFinal(code: number): boolean {
  return code >= 0x40 && code <= 0x7e;
}

function findStringTerminator(text: string, start: number): number {
  for (let i = start; i < text.length; i++) {
    if (text[i] === BEL) {
      return i + 1;
    }
    if (text[i] === ESC && text[i + 1] === '\\') {
      return i + 2;
    }
  }
  return text.length;
}

/**
 * Read one ESC-prefixed terminal sequence.
 *
 * Unterminated string protocols consume the rest of the input. This is
 * intentionally fail-closed: rendering part of an attacker-controlled OSC or
 * DCS payload is preferable to accidentally reactivating it later.
 */
export function readTerminalSequence(text: string, start: number): TerminalSequence | null {
  if (text[start] !== ESC) {
    return null;
  }

  const introducer = text[start + 1];
  if (introducer === undefined) {
    return { end: start + 1, value: ESC, kind: 'control' };
  }

  // CSI: ESC [ parameters/intermediates final-byte
  if (introducer === '[') {
    let end = start + 2;
    while (end < text.length && !isCsiFinal(text.charCodeAt(end))) {
      end++;
    }
    if (end >= text.length) {
      return { end: text.length, value: text.slice(start), kind: 'control' };
    }

    const value = text.slice(start, end + 1);
    const kind = /^\x1b\[[0-9:;]*m$/.test(value) ? 'sgr' : 'control';
    return { end: end + 1, value, kind };
  }

  // OSC, DCS, SOS, PM and APC are string protocols terminated by BEL or ST.
  if (introducer === ']' || introducer === 'P' || introducer === 'X' || introducer === '^' || introducer === '_') {
    const end = findStringTerminator(text, start + 2);
    return { end, value: text.slice(start, end), kind: 'control' };
  }

  // Fe escape sequences are two bytes. Consume both instead of leaving a
  // potentially meaningful final byte behind.
  return {
    end: Math.min(text.length, start + 2),
    value: text.slice(start, start + 2),
    kind: 'control',
  };
}

function isUnsafeControl(code: number): boolean {
  return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
}

/**
 * Sanitize regular terminal text while preserving newlines, tabs and SGR.
 */
export function sanitizeTerminalText(text: string): string {
  let result = '';
  let index = 0;

  while (index < text.length) {
    if (text[index] === ESC) {
      const sequence = readTerminalSequence(text, index);
      if (sequence) {
        if (sequence.kind === 'sgr') {
          result += sequence.value;
        }
        index = sequence.end;
        continue;
      }
    }

    const code = text.charCodeAt(index);
    if (!isUnsafeControl(code) || text[index] === '\n' || text[index] === '\t') {
      result += text[index];
    }
    index++;
  }

  return result;
}

/**
 * Strip every terminal protocol and control character, including SGR.
 */
export function stripTerminalControls(text: string): string {
  let result = '';
  let index = 0;

  while (index < text.length) {
    if (text[index] === ESC) {
      const sequence = readTerminalSequence(text, index);
      if (sequence) {
        index = sequence.end;
        continue;
      }
    }

    const code = text.charCodeAt(index);
    if (!isUnsafeControl(code) || text[index] === '\n' || text[index] === '\t') {
      result += text[index];
    }
    index++;
  }

  return result;
}

/**
 * Sanitize user-entered text that will be rendered on a single terminal line.
 *
 * Unlike stripTerminalControls(), this also removes newlines, tabs, and every
 * remaining C0/C1 control after consuming complete terminal protocols.
 */
export function sanitizeInlineInput(text: string): string {
  return stripTerminalControls(text).replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
}

/**
 * Sanitize a field interpolated into an OSC protocol.
 */
export function sanitizeOscField(value: string): string {
  let result = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      result += ' ';
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Sanitize OSC 777 fields, where semicolon is also a protocol delimiter.
 */
export function sanitizeOsc777Field(value: string): string {
  return sanitizeOscField(value).replaceAll(';', ':');
}

/**
 * Return a safe label for direct terminal output. SGR is retained, all other
 * terminal protocols are removed.
 */
export function sanitizeTerminalLabel(value: string): string {
  return sanitizeTerminalText(value);
}

export const terminalTerminators = { BEL, ST } as const;
