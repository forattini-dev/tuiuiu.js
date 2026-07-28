import { describe, expect, it } from 'vitest';
import {
  readTerminalSequence,
  sanitizeOsc777Field,
  sanitizeOscField,
  sanitizeTerminalText,
  stripTerminalControls,
} from '../../src/utils/terminal-sanitize.js';

describe('terminal sanitization', () => {
  it('preserves SGR but removes cursor and erase commands', () => {
    expect(sanitizeTerminalText('a\x1b[31mred\x1b[0m\x1b[2Jb')).toBe(
      'a\x1b[31mred\x1b[0mb',
    );
  });

  it('removes OSC, DCS and C0/C1 controls', () => {
    const input = `a\x1b]2;owned\x07b\x1bPpayload\x1b\\c\x00\x9fd`;
    expect(sanitizeTerminalText(input)).toBe('abcd');
    expect(stripTerminalControls('\x1b[31mred\x1b[0m')).toBe('red');
  });

  it('fails closed for unterminated string protocols', () => {
    expect(sanitizeTerminalText('before\x1b]2;unterminated')).toBe('before');
  });

  it('sanitizes OSC fields and OSC 777 delimiters', () => {
    expect(sanitizeOscField('safe\x07\x1b[2Jtitle')).toBe('safe  [2Jtitle');
    expect(sanitizeOsc777Field('a;b')).toBe('a:b');
  });

  it('classifies only strict SGR as styling', () => {
    expect(readTerminalSequence('\x1b[38;2;1;2;3m', 0)?.kind).toBe('sgr');
    expect(readTerminalSequence('\x1b[2J', 0)?.kind).toBe('control');
    expect(readTerminalSequence('\x1b[?25l', 0)?.kind).toBe('control');
  });
});
