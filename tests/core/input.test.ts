import { describe, expect, it } from 'vitest';
import {
  disableAlternateScreen,
  disableBracketedPaste,
  disableFocusEvents,
  enableAlternateScreen,
  enableBracketedPaste,
  enableFocusEvents,
  parseFocusEvent,
  parseKittyKeyEvent,
} from '../../src/core/input.js';

describe('Kitty keyboard protocol', () => {
  it('parses text, alternate keys, modifiers, and event types', () => {
    expect(parseKittyKeyEvent('\x1b[97u')).toMatchObject({
      keyCode: 97,
      text: 'a',
      eventType: 'press',
    });
    expect(parseKittyKeyEvent('\x1b[97:65;5:2u')).toMatchObject({
      keyCode: 97,
      shiftedKey: 65,
      eventType: 'repeat',
      modifiers: { ctrl: true, shift: false },
    });
    expect(parseKittyKeyEvent('\x1b[97;1:3u')?.eventType).toBe('release');
  });

  it('parses associated Unicode text code points', () => {
    expect(parseKittyKeyEvent('\x1b[0;1;20320:22909u')?.text).toBe('你好');
  });

  it('rejects other terminal sequences and unsafe values', () => {
    const malformed = [
      '\x1b[A',
      'a',
      '\x1b[97;1;1114112u',
      '\x1b[97;1;55296u',
      '\x1b[999999999999999999999999999999u',
      '\x1b[97;0u',
    ];
    for (const sequence of malformed) {
      expect(parseKittyKeyEvent(sequence)).toBeNull();
    }
  });
});

describe('terminal input modes', () => {
  it('provides symmetric bracketed-paste ownership sequences', () => {
    expect(enableBracketedPaste()).toBe('\x1b[?2004h');
    expect(disableBracketedPaste()).toBe('\x1b[?2004l');
  });

  it('provides symmetric focus-reporting ownership sequences', () => {
    expect(enableFocusEvents()).toBe('\x1b[?1004h');
    expect(disableFocusEvents()).toBe('\x1b[?1004l');
  });

  it('parses complete focus events only', () => {
    expect(parseFocusEvent('\x1b[I')).toEqual({ focused: true });
    expect(parseFocusEvent('\x1b[O')).toEqual({ focused: false });
    expect(parseFocusEvent('\x1b[Orest')).toBeNull();
    expect(parseFocusEvent('\x1b[A')).toBeNull();
  });

  it('provides symmetric alternate-screen ownership sequences', () => {
    expect(enableAlternateScreen()).toBe('\x1b[?1049h');
    expect(disableAlternateScreen()).toBe('\x1b[?1049l');
  });
});
