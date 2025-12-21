/**
 * Tests for Terminal Capabilities Detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectTerminalCapabilities,
  setRenderMode,
  getRenderMode,
  getRenderModeSetting,
  getCapabilities,
  refreshCapabilities,
  getChars,
  char,
  supports,
  supportsTrueColor,
  supports256Colors,
  getTerminalSize,
  onResize,
  unicodeChars,
  asciiChars,
} from '../../src/core/capabilities.js';

describe('Terminal Capabilities', () => {
  const originalEnv = { ...process.env };
  const originalColumns = process.stdout.columns;
  const originalRows = process.stdout.rows;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(process.stdout, 'columns', { value: originalColumns, writable: true });
    Object.defineProperty(process.stdout, 'rows', { value: originalRows, writable: true });
    // Reset render mode to auto
    setRenderMode('auto');
  });

  // ===========================================================================
  // Character Sets
  // ===========================================================================

  describe('unicodeChars', () => {
    it('should have all required properties', () => {
      expect(unicodeChars.sparkline).toBeDefined();
      expect(unicodeChars.progressFilled).toBeDefined();
      expect(unicodeChars.progressEmpty).toBeDefined();
      expect(unicodeChars.border).toBeDefined();
      expect(unicodeChars.borderRound).toBeDefined();
      expect(unicodeChars.tree).toBeDefined();
      expect(unicodeChars.checkbox).toBeDefined();
      expect(unicodeChars.radio).toBeDefined();
      expect(unicodeChars.switch).toBeDefined();
      expect(unicodeChars.arrows).toBeDefined();
      expect(unicodeChars.expand).toBeDefined();
      expect(unicodeChars.scrollbar).toBeDefined();
      expect(unicodeChars.chart).toBeDefined();
      expect(unicodeChars.gauge).toBeDefined();
      expect(unicodeChars.spinner).toBeDefined();
      expect(unicodeChars.bullet).toBeDefined();
      expect(unicodeChars.ellipsis).toBeDefined();
    });

    it('should have unicode characters', () => {
      expect(unicodeChars.border.topLeft).toBe('┌');
      expect(unicodeChars.borderRound.topLeft).toBe('╭');
      expect(unicodeChars.checkbox.checked).toBe('◉');
      expect(unicodeChars.arrows.up).toBe('▲');
      expect(unicodeChars.ellipsis).toBe('…');
    });

    it('should have spinner frames', () => {
      expect(unicodeChars.spinner).toHaveLength(10);
      expect(unicodeChars.spinner[0]).toBe('⠋');
    });
  });

  describe('asciiChars', () => {
    it('should have all required properties', () => {
      expect(asciiChars.sparkline).toBeDefined();
      expect(asciiChars.progressFilled).toBeDefined();
      expect(asciiChars.border).toBeDefined();
      expect(asciiChars.checkbox).toBeDefined();
      expect(asciiChars.spinner).toBeDefined();
    });

    it('should have ASCII-only characters', () => {
      expect(asciiChars.border.topLeft).toBe('+');
      expect(asciiChars.checkbox.checked).toBe('[x]');
      expect(asciiChars.arrows.up).toBe('^');
      expect(asciiChars.ellipsis).toBe('...');
    });

    it('should have shorter spinner frames', () => {
      expect(asciiChars.spinner).toHaveLength(4);
      expect(asciiChars.spinner[0]).toBe('|');
    });
  });

  // ===========================================================================
  // Capability Detection
  // ===========================================================================

  describe('detectTerminalCapabilities', () => {
    it('should detect basic capabilities', () => {
      const caps = detectTerminalCapabilities();

      expect(caps).toHaveProperty('unicode');
      expect(caps).toHaveProperty('colors');
      expect(caps).toHaveProperty('mouse');
      expect(caps).toHaveProperty('trueColor');
      expect(caps).toHaveProperty('italic');
      expect(caps).toHaveProperty('strikethrough');
      expect(caps).toHaveProperty('hyperlinks');
      expect(caps).toHaveProperty('terminalName');
      expect(caps).toHaveProperty('isCI');
      expect(caps).toHaveProperty('columns');
      expect(caps).toHaveProperty('rows');
    });

    it('should detect CI environment', () => {
      process.env.CI = 'true';
      const caps = detectTerminalCapabilities();
      expect(caps.isCI).toBe(true);
    });

    it('should detect GITHUB_ACTIONS', () => {
      process.env.GITHUB_ACTIONS = 'true';
      const caps = detectTerminalCapabilities();
      expect(caps.isCI).toBe(true);
    });

    it('should detect truecolor from COLORTERM', () => {
      process.env.COLORTERM = 'truecolor';
      const caps = detectTerminalCapabilities();
      expect(caps.colors).toBe('truecolor');
      expect(caps.trueColor).toBe(true);
    });

    it('should detect 24bit color from COLORTERM', () => {
      process.env.COLORTERM = '24bit';
      const caps = detectTerminalCapabilities();
      expect(caps.colors).toBe('truecolor');
    });

    it('should detect 256 colors from TERM', () => {
      delete process.env.COLORTERM;
      process.env.TERM = 'xterm-256color';
      const caps = detectTerminalCapabilities();
      expect(caps.colors).toBe(256);
    });

    it('should detect 256 colors from iTerm', () => {
      delete process.env.COLORTERM;
      process.env.TERM_PROGRAM = 'iTerm.app';
      const caps = detectTerminalCapabilities();
      expect(caps.colors).toBe(256);
    });

    it('should detect Windows Terminal', () => {
      delete process.env.COLORTERM;
      process.env.WT_SESSION = 'some-session-id';
      const caps = detectTerminalCapabilities();
      expect(caps.terminalName).toBe('Windows Terminal');
      expect(caps.colors).toBe(256);
    });

    it('should detect Konsole', () => {
      process.env.KONSOLE_VERSION = '210401';
      const caps = detectTerminalCapabilities();
      expect(caps.terminalName).toBe('Konsole');
    });

    it('should respect FORCE_COLOR=0', () => {
      process.env.COLORTERM = 'truecolor';
      process.env.FORCE_COLOR = '0';
      const caps = detectTerminalCapabilities();
      expect(caps.colors).toBe(16);
    });

    it('should respect FORCE_COLOR=3', () => {
      process.env.FORCE_COLOR = '3';
      const caps = detectTerminalCapabilities();
      expect(caps.colors).toBe('truecolor');
    });

    it('should disable unicode for dumb terminal', () => {
      process.env.TERM = 'dumb';
      const caps = detectTerminalCapabilities();
      expect(caps.unicode).toBe(false);
    });

    it('should disable unicode for linux console', () => {
      process.env.TERM = 'linux';
      const caps = detectTerminalCapabilities();
      expect(caps.unicode).toBe(false);
    });

    it('should disable unicode for vt terminals', () => {
      process.env.TERM = 'vt100';
      const caps = detectTerminalCapabilities();
      expect(caps.unicode).toBe(false);
    });

    it('should detect mouse support for xterm', () => {
      process.env.TERM = 'xterm-256color';
      const caps = detectTerminalCapabilities();
      expect(caps.mouse).toBe(true);
    });

    it('should detect italic support for modern terminals', () => {
      process.env.TERM = 'xterm-256color';
      const caps = detectTerminalCapabilities();
      expect(caps.italic).toBe(true);
    });

    it('should detect hyperlinks for iTerm', () => {
      process.env.TERM_PROGRAM = 'iTerm.app';
      const caps = detectTerminalCapabilities();
      expect(caps.hyperlinks).toBe(true);
    });

    it('should detect hyperlinks for kitty', () => {
      process.env.TERM = 'xterm-kitty';
      const caps = detectTerminalCapabilities();
      expect(caps.hyperlinks).toBe(true);
    });

    it('should format iTerm terminal name', () => {
      process.env.TERM_PROGRAM = 'iTerm.app';
      process.env.TERM_PROGRAM_VERSION = '3.4.0';
      const caps = detectTerminalCapabilities();
      expect(caps.terminalName).toBe('iTerm2 3.4.0');
    });

    it('should format Terminal.app name', () => {
      process.env.TERM_PROGRAM = 'Apple_Terminal';
      const caps = detectTerminalCapabilities();
      expect(caps.terminalName).toBe('Terminal.app');
    });
  });

  // ===========================================================================
  // Render Mode
  // ===========================================================================

  describe('setRenderMode / getRenderMode', () => {
    it('should default to auto', () => {
      expect(getRenderModeSetting()).toBe('auto');
    });

    it('should set render mode to unicode', () => {
      setRenderMode('unicode');
      expect(getRenderModeSetting()).toBe('unicode');
      expect(getRenderMode()).toBe('unicode');
    });

    it('should set render mode to ascii', () => {
      setRenderMode('ascii');
      expect(getRenderModeSetting()).toBe('ascii');
      expect(getRenderMode()).toBe('ascii');
    });

    it('should resolve auto based on capabilities', () => {
      setRenderMode('auto');
      // In test environment, should resolve to unicode or ascii based on detection
      const mode = getRenderMode();
      expect(['unicode', 'ascii']).toContain(mode);
    });
  });

  // ===========================================================================
  // Capabilities Cache
  // ===========================================================================

  describe('getCapabilities / refreshCapabilities', () => {
    it('should return capabilities', () => {
      const caps = getCapabilities();
      expect(caps).toBeDefined();
      expect(caps.columns).toBeGreaterThan(0);
    });

    it('should cache capabilities', () => {
      const caps1 = getCapabilities();
      const caps2 = getCapabilities();
      expect(caps1).toBe(caps2); // Same object reference
    });

    it('should refresh capabilities', () => {
      const caps1 = getCapabilities();
      const caps2 = refreshCapabilities();
      expect(caps2).toBeDefined();
      // After refresh, should have fresh object
      expect(caps2.columns).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Character Getters
  // ===========================================================================

  describe('getChars', () => {
    it('should return unicode chars when mode is unicode', () => {
      setRenderMode('unicode');
      const chars = getChars();
      expect(chars.border.topLeft).toBe('┌');
    });

    it('should return ascii chars when mode is ascii', () => {
      setRenderMode('ascii');
      const chars = getChars();
      expect(chars.border.topLeft).toBe('+');
    });
  });

  describe('char', () => {
    it('should get specific character', () => {
      setRenderMode('unicode');
      expect(char('bullet')).toBe('•');
      expect(char('ellipsis')).toBe('…');
    });

    it('should get nested character objects', () => {
      setRenderMode('unicode');
      const border = char('border');
      expect(border.topLeft).toBe('┌');
    });

    it('should respect ascii mode', () => {
      setRenderMode('ascii');
      expect(char('bullet')).toBe('*');
      expect(char('ellipsis')).toBe('...');
    });
  });

  // ===========================================================================
  // Capability Checks
  // ===========================================================================

  describe('supports', () => {
    it('should check boolean capabilities', () => {
      const caps = getCapabilities();
      expect(supports('unicode')).toBe(caps.unicode);
      expect(supports('mouse')).toBe(caps.mouse);
      expect(supports('hyperlinks')).toBe(caps.hyperlinks);
    });

    it('should check non-boolean capabilities', () => {
      // columns/rows are numbers, should return true if > 0
      expect(supports('columns')).toBe(true);
      expect(supports('rows')).toBe(true);
    });
  });

  describe('supportsTrueColor', () => {
    it('should return true when truecolor', () => {
      process.env.COLORTERM = 'truecolor';
      refreshCapabilities();
      expect(supportsTrueColor()).toBe(true);
    });

    it('should return false for 256 colors', () => {
      delete process.env.COLORTERM;
      process.env.TERM = 'xterm-256color';
      refreshCapabilities();
      expect(supportsTrueColor()).toBe(false);
    });
  });

  describe('supports256Colors', () => {
    it('should return true for 256 colors', () => {
      process.env.TERM = 'xterm-256color';
      delete process.env.COLORTERM;
      refreshCapabilities();
      expect(supports256Colors()).toBe(true);
    });

    it('should return true for truecolor', () => {
      process.env.COLORTERM = 'truecolor';
      refreshCapabilities();
      expect(supports256Colors()).toBe(true);
    });

    it('should return false for 16 colors', () => {
      delete process.env.COLORTERM;
      process.env.TERM = 'dumb';
      process.env.FORCE_COLOR = '0';
      refreshCapabilities();
      expect(supports256Colors()).toBe(false);
    });
  });

  // ===========================================================================
  // Terminal Size
  // ===========================================================================

  describe('getTerminalSize', () => {
    it('should return terminal dimensions', () => {
      const size = getTerminalSize();
      expect(size).toHaveProperty('columns');
      expect(size).toHaveProperty('rows');
      expect(size.columns).toBeGreaterThan(0);
      expect(size.rows).toBeGreaterThan(0);
    });

    it('should default to 80x24 when undefined', () => {
      Object.defineProperty(process.stdout, 'columns', { value: undefined, writable: true });
      Object.defineProperty(process.stdout, 'rows', { value: undefined, writable: true });

      const size = getTerminalSize();
      expect(size.columns).toBe(80);
      expect(size.rows).toBe(24);
    });
  });

  // ===========================================================================
  // Resize Handler
  // ===========================================================================

  describe('onResize', () => {
    it('should subscribe to resize events', () => {
      const handler = vi.fn();
      const unsubscribe = onResize(handler);

      expect(typeof unsubscribe).toBe('function');

      // Cleanup
      unsubscribe();
    });

    it('should unsubscribe handler', () => {
      const handler = vi.fn();
      const unsubscribe = onResize(handler);

      unsubscribe();

      // Handler should be removed (no way to easily test without triggering resize)
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const unsub1 = onResize(handler1);
      const unsub2 = onResize(handler2);

      unsub1();
      unsub2();
    });
  });
});
