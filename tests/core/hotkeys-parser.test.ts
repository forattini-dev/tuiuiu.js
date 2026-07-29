/**
 * Tests for core/hotkeys.ts - Input Parsing
 */

import { describe, it, expect } from 'vitest';
import { parseKeypress, isHotkey, type Key } from '../../src/core/hotkeys.js';

// Helper to create a key object with defaults
function createKey(overrides: Partial<Key> = {}): Key {
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
    ...overrides,
  };
}

describe('parseKeypress', () => {
  describe('basic keys', () => {
    it('should parse carriage return', () => {
      const result = parseKeypress('\r');
      expect(result.key.return).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should parse newline', () => {
      const result = parseKeypress('\n');
      expect(result.key.return).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should parse Alt+Enter (ESC+CR)', () => {
      const result = parseKeypress('\x1b\r');
      expect(result.key.return).toBe(true);
      expect(result.key.meta).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should parse Alt+Enter (ESC+LF)', () => {
      const result = parseKeypress('\x1b\n');
      expect(result.key.return).toBe(true);
      expect(result.key.meta).toBe(true);
      expect(result.length).toBe(2);
    });

    // Note: '\x1b\x0d' is same as '\x1b\r' so it matches Alt+Enter first
    // The Ctrl+Alt+Enter branch in source is currently unreachable

    it('should parse Tab', () => {
      const result = parseKeypress('\t');
      expect(result.key.tab).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should parse Backspace (DEL)', () => {
      const result = parseKeypress('\x7f');
      expect(result.key.backspace).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should parse Backspace (BS)', () => {
      const result = parseKeypress('\b');
      expect(result.key.backspace).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should parse Alt+Backspace', () => {
      const result = parseKeypress('\x1b\x7f');
      expect(result.key.backspace).toBe(true);
      expect(result.key.meta).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should parse Escape', () => {
      const result = parseKeypress('\x1b');
      expect(result.key.escape).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should parse double Escape (Alt+Escape)', () => {
      const result = parseKeypress('\x1b\x1b');
      expect(result.key.escape).toBe(true);
      expect(result.key.meta).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should parse Space', () => {
      const result = parseKeypress(' ');
      expect(result.input).toBe(' ');
      expect(result.length).toBe(1);
    });

    it('should parse Alt+Space', () => {
      const result = parseKeypress('\x1b ');
      expect(result.input).toBe(' ');
      expect(result.key.meta).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('Ctrl+letter', () => {
    it('should parse Ctrl+A', () => {
      const result = parseKeypress('\x01');
      expect(result.key.ctrl).toBe(true);
      expect(result.input).toBe('a');
    });

    it('should parse Ctrl+C', () => {
      const result = parseKeypress('\x03');
      expect(result.key.ctrl).toBe(true);
      expect(result.input).toBe('c');
    });

    it('should parse Ctrl+Z', () => {
      const result = parseKeypress('\x1a');
      expect(result.key.ctrl).toBe(true);
      expect(result.input).toBe('z');
    });
  });

  describe('arrow keys', () => {
    it('should parse Up arrow (xterm)', () => {
      const result = parseKeypress('\x1b[A');
      expect(result.key.upArrow).toBe(true);
    });

    it('should parse Down arrow (xterm)', () => {
      const result = parseKeypress('\x1b[B');
      expect(result.key.downArrow).toBe(true);
    });

    it('should parse Right arrow (xterm)', () => {
      const result = parseKeypress('\x1b[C');
      expect(result.key.rightArrow).toBe(true);
    });

    it('should parse Left arrow (xterm)', () => {
      const result = parseKeypress('\x1b[D');
      expect(result.key.leftArrow).toBe(true);
    });

    it('should parse Up arrow (gnome)', () => {
      const result = parseKeypress('\x1bOA');
      expect(result.key.upArrow).toBe(true);
    });

    it('should parse Down arrow (gnome)', () => {
      const result = parseKeypress('\x1bOB');
      expect(result.key.downArrow).toBe(true);
    });
  });

  describe('navigation keys', () => {
    it('should parse Home (xterm)', () => {
      const result = parseKeypress('\x1b[H');
      expect(result.key.home).toBe(true);
    });

    it('should parse End (xterm)', () => {
      const result = parseKeypress('\x1b[F');
      expect(result.key.end).toBe(true);
    });

    it('should parse Home (rxvt)', () => {
      const result = parseKeypress('\x1b[1~');
      expect(result.key.home).toBe(true);
    });

    it('should parse Insert', () => {
      const result = parseKeypress('\x1b[2~');
      expect(result.key.insert).toBe(true);
    });

    it('should parse Delete', () => {
      const result = parseKeypress('\x1b[3~');
      expect(result.key.delete).toBe(true);
    });

    it('should parse End (rxvt)', () => {
      const result = parseKeypress('\x1b[4~');
      expect(result.key.end).toBe(true);
    });

    it('should parse PageUp', () => {
      const result = parseKeypress('\x1b[5~');
      expect(result.key.pageUp).toBe(true);
    });

    it('should parse PageDown', () => {
      const result = parseKeypress('\x1b[6~');
      expect(result.key.pageDown).toBe(true);
    });
  });

  describe('function keys', () => {
    it('should parse F1 (xterm O style)', () => {
      const result = parseKeypress('\x1bOP');
      expect(result.key.f1).toBe(true);
    });

    it('should parse F2 (xterm O style)', () => {
      const result = parseKeypress('\x1bOQ');
      expect(result.key.f2).toBe(true);
    });

    it('should parse F3 (xterm O style)', () => {
      const result = parseKeypress('\x1bOR');
      expect(result.key.f3).toBe(true);
    });

    it('should parse F4 (xterm O style)', () => {
      const result = parseKeypress('\x1bOS');
      expect(result.key.f4).toBe(true);
    });

    it('should parse F5', () => {
      const result = parseKeypress('\x1b[15~');
      expect(result.key.f5).toBe(true);
    });

    it('should parse F6', () => {
      const result = parseKeypress('\x1b[17~');
      expect(result.key.f6).toBe(true);
    });

    it('should parse F7', () => {
      const result = parseKeypress('\x1b[18~');
      expect(result.key.f7).toBe(true);
    });

    it('should parse F8', () => {
      const result = parseKeypress('\x1b[19~');
      expect(result.key.f8).toBe(true);
    });

    it('should parse F9', () => {
      const result = parseKeypress('\x1b[20~');
      expect(result.key.f9).toBe(true);
    });

    it('should parse F10', () => {
      const result = parseKeypress('\x1b[21~');
      expect(result.key.f10).toBe(true);
    });

    it('should parse F11', () => {
      const result = parseKeypress('\x1b[23~');
      expect(result.key.f11).toBe(true);
    });

    it('should parse F12', () => {
      const result = parseKeypress('\x1b[24~');
      expect(result.key.f12).toBe(true);
    });

    it('should parse F1 (cygwin style)', () => {
      const result = parseKeypress('\x1b[[A');
      expect(result.key.f1).toBe(true);
    });
  });

  describe('shifted navigation (rxvt)', () => {
    it('should parse Shift+Tab', () => {
      const result = parseKeypress('\x1b[Z');
      expect(result.key.tab).toBe(true);
      expect(result.key.shift).toBe(true);
    });

    it('should parse Shift+Up', () => {
      const result = parseKeypress('\x1b[a');
      expect(result.key.upArrow).toBe(true);
      expect(result.key.shift).toBe(true);
    });

    it('should parse Shift+Down', () => {
      const result = parseKeypress('\x1b[b');
      expect(result.key.downArrow).toBe(true);
      expect(result.key.shift).toBe(true);
    });
  });

  describe('ctrl navigation (rxvt)', () => {
    it('should parse Ctrl+Up', () => {
      const result = parseKeypress('\x1bOa');
      expect(result.key.upArrow).toBe(true);
      expect(result.key.ctrl).toBe(true);
    });

    it('should parse Ctrl+Down', () => {
      const result = parseKeypress('\x1bOb');
      expect(result.key.downArrow).toBe(true);
      expect(result.key.ctrl).toBe(true);
    });
  });

  describe('enhanced keyboard protocols', () => {
    it('parses Kitty character modifiers and event phases', () => {
      const pressed = parseKeypress('\x1b[97;6u');
      expect(pressed).toMatchObject({
        input: 'a',
        length: 7,
        key: {
          ctrl: true,
          shift: true,
          eventType: 'press',
        },
      });

      const released = parseKeypress('\x1b[97;1:3u');
      expect(released.key.eventType).toBe('release');
    });

    it('preserves Kitty associated text for insertion', () => {
      const result = parseKeypress('\x1b[97;2;65u');

      expect(result.input).toBe('A');
      expect(result.key.shift).toBe(true);
    });

    it('maps Kitty C0 functional keys', () => {
      expect(parseKeypress('\x1b[27u').key.escape).toBe(true);
      expect(parseKeypress('\x1b[13u').key.return).toBe(true);
      expect(parseKeypress('\x1b[9u').key.tab).toBe(true);
      expect(parseKeypress('\x1b[127u').key.backspace).toBe(true);
    });

    it('parses xterm modifyOtherKeys characters and controls', () => {
      const ctrlA = parseKeypress('\x1b[27;5;97~');
      expect(ctrlA.input).toBe('a');
      expect(ctrlA.key.ctrl).toBe(true);
      expect(ctrlA.key.eventType).toBe('press');

      const altTab = parseKeypress('\x1b[27;3;9~');
      expect(altTab.key.tab).toBe(true);
      expect(altTab.key.meta).toBe(true);
      expect(altTab.key.option).toBe(true);
    });

    it('does not throw for invalid enhanced protocol integers', () => {
      expect(() =>
        parseKeypress('\x1b[999999999999999999999999u'),
      ).not.toThrow();
      expect(() =>
        parseKeypress('\x1b[27;999;1114112~'),
      ).not.toThrow();
    });
  });

  describe('regular characters', () => {
    it('should parse lowercase letter', () => {
      const result = parseKeypress('a');
      expect(result.input).toBe('a');
    });

    it('should parse uppercase letter with shift', () => {
      const result = parseKeypress('A');
      expect(result.input).toBe('a');
      expect(result.key.shift).toBe(true);
    });

    it('should parse number', () => {
      const result = parseKeypress('5');
      expect(result.input).toBe('5');
    });
  });

  describe('buffer input', () => {
    it('should handle Buffer input', () => {
      const buf = Buffer.from('\r');
      const result = parseKeypress(buf);
      expect(result.key.return).toBe(true);
    });

    it('should handle high-bit meta (single byte > 127)', () => {
      // Simulate high-bit meta: byte > 127 becomes ESC + (byte - 128)
      const buf = Buffer.from([225]); // 225 - 128 = 97 = 'a'
      const result = parseKeypress(buf);
      expect(result.key.meta).toBe(true);
    });
  });

  describe('fallback', () => {
    it('should handle unknown sequences', () => {
      const result = parseKeypress('\x1b[999~');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

describe('isHotkey', () => {
  describe('special keys', () => {
    it('should match return/enter', () => {
      const key = createKey({ return: true });
      expect(isHotkey('return', key)).toBe(true);
      expect(isHotkey('enter', key)).toBe(true);
    });

    it('should match escape/esc', () => {
      const key = createKey({ escape: true });
      expect(isHotkey('escape', key)).toBe(true);
      expect(isHotkey('esc', key)).toBe(true);
    });

    it('should match tab', () => {
      const key = createKey({ tab: true });
      expect(isHotkey('tab', key)).toBe(true);
    });

    it('should match backspace', () => {
      const key = createKey({ backspace: true });
      expect(isHotkey('backspace', key)).toBe(true);
    });

    it('should match delete/del', () => {
      const key = createKey({ delete: true });
      expect(isHotkey('delete', key)).toBe(true);
      expect(isHotkey('del', key)).toBe(true);
    });
  });

  describe('navigation keys', () => {
    it('should match arrow keys', () => {
      expect(isHotkey('up', createKey({ upArrow: true }))).toBe(true);
      expect(isHotkey('down', createKey({ downArrow: true }))).toBe(true);
      expect(isHotkey('left', createKey({ leftArrow: true }))).toBe(true);
      expect(isHotkey('right', createKey({ rightArrow: true }))).toBe(true);
    });

    it('should match pageup/pagedown', () => {
      expect(isHotkey('pageup', createKey({ pageUp: true }))).toBe(true);
      expect(isHotkey('pagedown', createKey({ pageDown: true }))).toBe(true);
    });

    it('should match home/end', () => {
      expect(isHotkey('home', createKey({ home: true }))).toBe(true);
      expect(isHotkey('end', createKey({ end: true }))).toBe(true);
    });
  });

  describe('modifiers', () => {
    it('should match ctrl modifier', () => {
      const key = createKey({ ctrl: true });
      expect(isHotkey('ctrl+c', key, 'c')).toBe(true);
      expect(isHotkey('ctrl+a', key, 'a')).toBe(true);
    });

    it('should not match without ctrl when required', () => {
      const key = createKey({ ctrl: false });
      expect(isHotkey('ctrl+c', key, 'c')).toBe(false);
    });

    it('should not match with extra ctrl modifier', () => {
      const key = createKey({ ctrl: true });
      expect(isHotkey('c', key, 'c')).toBe(false);
    });

    it('should not match with an extra shift modifier', () => {
      const key = createKey({ ctrl: true, shift: true });
      expect(isHotkey('ctrl+c', key, 'c')).toBe(false);
    });

    it('should match shift modifier', () => {
      const key = createKey({ shift: true });
      expect(isHotkey('shift+a', key, 'a')).toBe(true);
    });

    it('should match meta/alt modifier', () => {
      const key = createKey({ meta: true });
      expect(isHotkey('meta+a', key, 'a')).toBe(true);
      expect(isHotkey('alt+a', key, 'a')).toBe(true);
    });

    it('should not match with extra meta modifier', () => {
      const key = createKey({ meta: true });
      expect(isHotkey('a', key, 'a')).toBe(false);
    });

    it('should match option/opt modifier', () => {
      const key = createKey({ option: true });
      expect(isHotkey('option+a', key, 'a')).toBe(true);
      expect(isHotkey('opt+a', key, 'a')).toBe(true);
    });

    it('should not match with extra option modifier', () => {
      const key = createKey({ option: true });
      expect(isHotkey('a', key, 'a')).toBe(false);
    });

    it('should match multiple modifiers', () => {
      const key = createKey({ ctrl: true, shift: true });
      expect(isHotkey('ctrl+shift+a', key, 'a')).toBe(true);
    });
  });

  describe('function keys', () => {
    it('should match f1-f12', () => {
      expect(isHotkey('f1', createKey({ f1: true }))).toBe(true);
      expect(isHotkey('f2', createKey({ f2: true }))).toBe(true);
      expect(isHotkey('f3', createKey({ f3: true }))).toBe(true);
      expect(isHotkey('f4', createKey({ f4: true }))).toBe(true);
      expect(isHotkey('f5', createKey({ f5: true }))).toBe(true);
      expect(isHotkey('f6', createKey({ f6: true }))).toBe(true);
      expect(isHotkey('f7', createKey({ f7: true }))).toBe(true);
      expect(isHotkey('f8', createKey({ f8: true }))).toBe(true);
      expect(isHotkey('f9', createKey({ f9: true }))).toBe(true);
      expect(isHotkey('f10', createKey({ f10: true }))).toBe(true);
      expect(isHotkey('f11', createKey({ f11: true }))).toBe(true);
      expect(isHotkey('f12', createKey({ f12: true }))).toBe(true);
    });

    it('should match function key with modifiers', () => {
      const key = createKey({ ctrl: true, f1: true });
      expect(isHotkey('ctrl+f1', key)).toBe(true);
    });
  });

  describe('special input characters', () => {
    it('should match space', () => {
      const key = createKey();
      expect(isHotkey('space', key, ' ')).toBe(true);
    });

    it('should match plus sign', () => {
      const key = createKey();
      expect(isHotkey('plus', key, '+')).toBe(true);
      expect(isHotkey('+', key, '+')).toBe(true);
      expect(isHotkey('ctrl++', createKey({ ctrl: true }), '+')).toBe(true);
    });
  });

  describe('character matching', () => {
    it('should match single characters', () => {
      const key = createKey();
      expect(isHotkey('a', key, 'a')).toBe(true);
      expect(isHotkey('z', key, 'z')).toBe(true);
      expect(isHotkey('5', key, '5')).toBe(true);
    });

    it('should be case insensitive', () => {
      const key = createKey();
      expect(isHotkey('a', key, 'A')).toBe(true);
      expect(isHotkey('A', key, 'a')).toBe(true);
    });

    it('should not match wrong characters', () => {
      const key = createKey();
      expect(isHotkey('a', key, 'b')).toBe(false);
    });

    it('should not match unknown patterns', () => {
      const key = createKey();
      expect(isHotkey('unknown', key, 'x')).toBe(false);
    });
  });

  describe('negative cases', () => {
    it('should not match wrong special key', () => {
      const key = createKey({ tab: true });
      expect(isHotkey('enter', key)).toBe(false);
    });

    it('should not match when modifier missing', () => {
      const key = createKey({ shift: true });
      expect(isHotkey('ctrl+a', key, 'a')).toBe(false);
    });
  });
});
