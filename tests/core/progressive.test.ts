/**
 * Tests for Progressive Enhancement Facade
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  passthroughWrap,
  wrapSynchronized,
  getSynchronizedBegin,
  getSynchronizedEnd,
  setCursorStyle,
  resetCursorStyle,
  setWindowTitle,
  getClipboardWriteSequence,
  getClipboardQuerySequence,
  formatHyperlink,
  getNotificationSequence,
  getUnderlineCode,
  getUnderlineColorCode,
  setHyperlinksEnabled,
  areHyperlinksEnabled,
  setNerdFonts,
  hasNerdFonts,
  configureProgressive,
  resetProgressive,
  BSU,
  ESU,
} from '../../src/core/progressive.js';
import type { MultiplexerInfo } from '../../src/core/terminal-profile.js';
import type { TerminalCapabilities } from '../../src/core/capabilities.js';

// Helper to create caps with specific overrides
function makeCaps(overrides: Partial<TerminalCapabilities> = {}): TerminalCapabilities {
  return {
    unicode: true,
    colors: 'truecolor',
    mouse: true,
    trueColor: true,
    italic: true,
    strikethrough: true,
    hyperlinks: true,
    terminalName: 'Test',
    isCI: false,
    columns: 80,
    rows: 24,
    synchronizedOutput: false,
    styledUnderlines: false,
    coloredUnderlines: false,
    clipboard: false,
    notifications: false,
    multiplexer: null,
    cursorStyleControl: false,
    windowTitle: false,
    ...overrides,
  };
}

describe('Progressive Enhancement', () => {
  afterEach(() => {
    resetProgressive();
  });

  // ===========================================================================
  // passthroughWrap
  // ===========================================================================

  describe('passthroughWrap', () => {
    it('should return sequence unchanged when no multiplexer', () => {
      expect(passthroughWrap('\x1b[?2026h', null)).toBe('\x1b[?2026h');
    });

    it('should wrap in tmux DCS passthrough', () => {
      const mux: MultiplexerInfo = { type: 'tmux', needsPassthrough: true };
      const result = passthroughWrap('\x1b[?2026h', mux);
      expect(result).toContain('\x1bPtmux;');
      expect(result).toContain('\x1b\\');
      // ESC should be doubled inside tmux passthrough
      expect(result).toContain('\x1b\x1b');
    });

    it('should wrap in screen DCS passthrough', () => {
      const mux: MultiplexerInfo = { type: 'screen', needsPassthrough: true };
      const result = passthroughWrap('\x1b[?2026h', mux);
      expect(result).toContain('\x1bP');
      expect(result).toContain('\x1b\\');
    });

    it('should not wrap for zellij', () => {
      const mux: MultiplexerInfo = { type: 'zellij', needsPassthrough: false };
      expect(passthroughWrap('\x1b[?2026h', mux)).toBe('\x1b[?2026h');
    });
  });

  // ===========================================================================
  // Synchronized Output
  // ===========================================================================

  describe('synchronized output', () => {
    it('BSU and ESU constants should be correct', () => {
      expect(BSU).toBe('\x1b[?2026h');
      expect(ESU).toBe('\x1b[?2026l');
    });

    it('wrapSynchronized should wrap when supported', () => {
      const caps = makeCaps({ synchronizedOutput: true });
      const result = wrapSynchronized('hello', caps);
      expect(result).toContain(BSU);
      expect(result).toContain(ESU);
      expect(result).toContain('hello');
    });

    it('wrapSynchronized should pass through when not supported', () => {
      const caps = makeCaps({ synchronizedOutput: false });
      expect(wrapSynchronized('hello', caps)).toBe('hello');
    });

    it('getSynchronizedBegin should return BSU when supported', () => {
      const caps = makeCaps({ synchronizedOutput: true });
      expect(getSynchronizedBegin(caps)).toBe(BSU);
    });

    it('getSynchronizedBegin should return empty when not supported', () => {
      const caps = makeCaps({ synchronizedOutput: false });
      expect(getSynchronizedBegin(caps)).toBe('');
    });

    it('getSynchronizedEnd should return ESU when supported', () => {
      const caps = makeCaps({ synchronizedOutput: true });
      expect(getSynchronizedEnd(caps)).toBe(ESU);
    });
  });

  // ===========================================================================
  // Cursor Styles
  // ===========================================================================

  describe('cursor styles', () => {
    it('should return empty string when not supported', () => {
      const caps = makeCaps({ cursorStyleControl: false });
      expect(setCursorStyle('beam', false, caps)).toBe('');
    });

    it('should return DECSCUSR for block', () => {
      const caps = makeCaps({ cursorStyleControl: true });
      expect(setCursorStyle('block', false, caps)).toContain('2 q');
    });

    it('should return DECSCUSR for blinking block', () => {
      const caps = makeCaps({ cursorStyleControl: true });
      expect(setCursorStyle('block', true, caps)).toContain('1 q');
    });

    it('should return DECSCUSR for beam', () => {
      const caps = makeCaps({ cursorStyleControl: true });
      expect(setCursorStyle('beam', false, caps)).toContain('6 q');
    });

    it('should return DECSCUSR for underline', () => {
      const caps = makeCaps({ cursorStyleControl: true });
      expect(setCursorStyle('underline', false, caps)).toContain('4 q');
    });

    it('resetCursorStyle should return reset sequence', () => {
      const caps = makeCaps({ cursorStyleControl: true });
      expect(resetCursorStyle(caps)).toContain('0 q');
    });
  });

  // ===========================================================================
  // Window Title
  // ===========================================================================

  describe('window title', () => {
    it('should return empty string when not supported', () => {
      const caps = makeCaps({ windowTitle: false });
      expect(setWindowTitle('Test', caps)).toBe('');
    });

    it('should return OSC 2 sequence when supported', () => {
      const caps = makeCaps({ windowTitle: true });
      const result = setWindowTitle('My App', caps);
      expect(result).toContain('\x1b]2;My App\x07');
    });
  });

  // ===========================================================================
  // Clipboard (OSC 52)
  // ===========================================================================

  describe('clipboard', () => {
    it('should return null when not supported', () => {
      const caps = makeCaps({ clipboard: false });
      expect(getClipboardWriteSequence('hello', caps)).toBeNull();
    });

    it('should return OSC 52 sequence with base64 data', () => {
      const caps = makeCaps({ clipboard: true });
      const result = getClipboardWriteSequence('hello', caps);
      expect(result).not.toBeNull();
      expect(result).toContain('\x1b]52;c;');
      // 'hello' in base64 = 'aGVsbG8='
      expect(result).toContain('aGVsbG8=');
      expect(result).toContain('\x07');
    });

    it('should return query sequence when supported', () => {
      const caps = makeCaps({ clipboard: true });
      const result = getClipboardQuerySequence(caps);
      expect(result).not.toBeNull();
      expect(result).toContain('\x1b]52;c;?\x07');
    });

    it('should return null for query when not supported', () => {
      const caps = makeCaps({ clipboard: false });
      expect(getClipboardQuerySequence(caps)).toBeNull();
    });
  });

  // ===========================================================================
  // Hyperlinks (OSC 8)
  // ===========================================================================

  describe('hyperlinks', () => {
    it('should default to hyperlinks enabled', () => {
      expect(areHyperlinksEnabled()).toBe(true);
    });

    it('should return plain text when hyperlinks are not supported', () => {
      const caps = makeCaps({ hyperlinks: false });
      expect(formatHyperlink('Docs', 'https://example.com', caps)).toBe('Docs');
    });

    it('should return plain text when hyperlinks are globally disabled', () => {
      const caps = makeCaps({ hyperlinks: true });
      setHyperlinksEnabled(false);
      expect(formatHyperlink('Docs', 'https://example.com', caps)).toBe('Docs');
    });

    it('should allow configureProgressive to disable hyperlink emission', () => {
      const caps = makeCaps({ hyperlinks: true });
      configureProgressive({ hyperlinks: false });
      expect(areHyperlinksEnabled()).toBe(false);
      expect(formatHyperlink('Docs', 'https://example.com', caps)).toBe('Docs');
    });

    it('should return OSC 8 hyperlink when supported', () => {
      const caps = makeCaps({ hyperlinks: true });
      const result = formatHyperlink('Docs', 'https://example.com', caps);
      expect(result).toContain('\x1b]8;;https://example.com\x07');
      expect(result).toContain('Docs');
      expect(result).toContain('\x1b]8;;\x07');
    });

    it('should allow configureProgressive to re-enable hyperlinks explicitly', () => {
      const caps = makeCaps({ hyperlinks: true });
      setHyperlinksEnabled(false);
      configureProgressive({ hyperlinks: true });
      expect(areHyperlinksEnabled()).toBe(true);
      expect(formatHyperlink('Docs', 'https://example.com', caps)).toContain('\x1b]8;;https://example.com\x07');
    });

    it('should wrap hyperlinks for tmux passthrough', () => {
      const caps = makeCaps({
        hyperlinks: true,
        multiplexer: { type: 'tmux', needsPassthrough: true },
      });
      const result = formatHyperlink('Docs', 'https://example.com', caps);
      expect(result).toContain('\x1bPtmux;');
      expect(result).toContain('https://example.com');
      expect(result).toContain('Docs');
    });
  });

  // ===========================================================================
  // Notifications
  // ===========================================================================

  describe('notifications', () => {
    it('should return null when not supported', () => {
      const caps = makeCaps({ notifications: false });
      expect(getNotificationSequence('title', undefined, caps)).toBeNull();
    });

    it('should return OSC 9 for osc9 protocol', () => {
      const caps = makeCaps({ notifications: 'osc9' });
      const result = getNotificationSequence('Build Done', undefined, caps);
      expect(result).not.toBeNull();
      expect(result).toContain('\x1b]9;Build Done\x07');
    });

    it('should return OSC 9 with body', () => {
      const caps = makeCaps({ notifications: 'osc9' });
      const result = getNotificationSequence('Build', 'All tests passed', caps);
      expect(result).toContain('Build: All tests passed');
    });

    it('should return OSC 99 for kitty', () => {
      const caps = makeCaps({ notifications: 'osc99' });
      const result = getNotificationSequence('Hello', undefined, caps);
      expect(result).not.toBeNull();
      expect(result).toContain('\x1b]99;');
    });

    it('should return OSC 777 for foot/tilix', () => {
      const caps = makeCaps({ notifications: 'osc777' });
      const result = getNotificationSequence('Alert', 'Something', caps);
      expect(result).not.toBeNull();
      expect(result).toContain('\x1b]777;notify;Alert;Something\x07');
    });
  });

  // ===========================================================================
  // Styled Underlines
  // ===========================================================================

  describe('underline codes', () => {
    it('should return simple underline for boolean true', () => {
      const caps = makeCaps({ styledUnderlines: false });
      expect(getUnderlineCode(true, caps)).toBe('4');
    });

    it('should return styled code when supported', () => {
      const caps = makeCaps({ styledUnderlines: true });
      expect(getUnderlineCode('curly', caps)).toBe('4:3');
      expect(getUnderlineCode('dotted', caps)).toBe('4:4');
      expect(getUnderlineCode('dashed', caps)).toBe('4:5');
      expect(getUnderlineCode('double', caps)).toBe('4:2');
      expect(getUnderlineCode('single', caps)).toBe('4:1');
    });

    it('should fall back to simple underline when styled not supported', () => {
      const caps = makeCaps({ styledUnderlines: false });
      expect(getUnderlineCode('curly', caps)).toBe('4');
    });

    it('should return empty for false', () => {
      expect(getUnderlineCode(false)).toBe('');
    });
  });

  describe('underline color codes', () => {
    it('should return empty when not supported', () => {
      const caps = makeCaps({ coloredUnderlines: false });
      expect(getUnderlineColorCode('#ff0000', caps)).toBe('');
    });

    it('should return SGR 58 for hex color', () => {
      const caps = makeCaps({ coloredUnderlines: true });
      expect(getUnderlineColorCode('#ff0000', caps)).toBe('58;2;255;0;0');
    });

    it('should return SGR 58 for RGB color', () => {
      const caps = makeCaps({ coloredUnderlines: true });
      expect(getUnderlineColorCode({ r: 0, g: 128, b: 255 }, caps)).toBe('58;2;0;128;255');
    });

    it('should return SGR 58;5 for ansi256 color', () => {
      const caps = makeCaps({ coloredUnderlines: true });
      expect(getUnderlineColorCode({ ansi256: 196 }, caps)).toBe('58;5;196');
    });
  });

  // ===========================================================================
  // Nerd Fonts
  // ===========================================================================

  describe('nerd fonts', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = originalEnv;
      resetProgressive();
    });

    it('should default to false', () => {
      delete process.env.NERD_FONT;
      delete process.env.NERD_FONTS;
      expect(hasNerdFonts()).toBe(false);
    });

    it('should detect NERD_FONT=1', () => {
      process.env.NERD_FONT = '1';
      expect(hasNerdFonts()).toBe(true);
    });

    it('should detect NERD_FONTS=1', () => {
      process.env.NERD_FONTS = '1';
      expect(hasNerdFonts()).toBe(true);
    });

    it('should respect setNerdFonts', () => {
      delete process.env.NERD_FONT;
      delete process.env.NERD_FONTS;
      setNerdFonts(true);
      expect(hasNerdFonts()).toBe(true);
      setNerdFonts(false);
      expect(hasNerdFonts()).toBe(false);
    });
  });

  // ===========================================================================
  // configureProgressive
  // ===========================================================================

  describe('configureProgressive', () => {
    afterEach(() => {
      resetProgressive();
    });

    it('should allow overriding capabilities', () => {
      configureProgressive({ overrides: { synchronizedOutput: true } });
      // The overrides are stored and applied during detection
      // (tested via getProgressiveOverrides in capabilities.ts)
    });
  });
});
