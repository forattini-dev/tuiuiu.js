/**
 * Tests for Terminal-Adaptive Rendering Utilities
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  adaptive,
  adaptiveUnderline,
  adaptiveColor,
  canSyncOutput,
  canStyleUnderlines,
  canColorUnderlines,
  canClipboard,
  canNotify,
  canHyperlink,
  hasGpuAcceleration,
  getTerminalName,
} from '../../src/core/adaptive.js';
import {
  configureProgressive,
  resetProgressive,
  setNerdFonts,
} from '../../src/core/progressive.js';

afterEach(() => {
  resetProgressive();
});

// =============================================================================
// adaptive()
// =============================================================================

describe('adaptive', () => {
  it('should return nerdFont variant when nerd fonts are enabled', () => {
    setNerdFonts(true);
    configureProgressive({ overrides: { unicode: true } });

    const result = adaptive({
      nerdFont: '\uf0e7', // nerd font icon
      unicode: '\u2605',  // star
      ascii: '*',
    });

    expect(result).toBe('\uf0e7');
  });

  it('should skip nerdFont and return unicode when nerd fonts disabled but unicode available', () => {
    setNerdFonts(false);
    configureProgressive({ overrides: { unicode: true } });

    const result = adaptive({
      nerdFont: '\uf0e7',
      unicode: '\u2605',
      ascii: '*',
    });

    expect(result).toBe('\u2605');
  });

  it('should fall back to ascii when unicode is not available', () => {
    setNerdFonts(false);
    configureProgressive({ overrides: { unicode: false } });

    const result = adaptive({
      nerdFont: '\uf0e7',
      unicode: '\u2605',
      ascii: '*',
    });

    expect(result).toBe('*');
  });

  it('should fall back to ascii when only ascii variant is provided', () => {
    configureProgressive({ overrides: { unicode: true } });

    const result = adaptive({ ascii: 'fallback' });

    expect(result).toBe('fallback');
  });

  it('should return unicode variant even when nerdFont key is absent', () => {
    setNerdFonts(true);
    configureProgressive({ overrides: { unicode: true } });

    const result = adaptive({
      unicode: 'U',
      ascii: 'A',
    });

    // nerdFont key missing, so skip to unicode
    expect(result).toBe('U');
  });

  it('should work with non-string types', () => {
    configureProgressive({ overrides: { unicode: true } });

    const result = adaptive({
      unicode: 42,
      ascii: 0,
    });

    expect(result).toBe(42);
  });

  it('should fall back to ascii when unicode is false and no nerd fonts', () => {
    setNerdFonts(false);
    configureProgressive({ overrides: { unicode: false } });

    const result = adaptive({
      unicode: 'U',
      ascii: 'A',
    });

    expect(result).toBe('A');
  });
});

// =============================================================================
// adaptiveUnderline()
// =============================================================================

describe('adaptiveUnderline', () => {
  it('should return styled underline when terminal supports styled underlines', () => {
    configureProgressive({ overrides: { styledUnderlines: true } });

    expect(adaptiveUnderline('curly')).toBe('curly');
    expect(adaptiveUnderline('dotted')).toBe('dotted');
    expect(adaptiveUnderline('dashed')).toBe('dashed');
    expect(adaptiveUnderline('double')).toBe('double');
    expect(adaptiveUnderline('single')).toBe('single');
  });

  it('should return true (simple underline) when styled underlines not supported', () => {
    configureProgressive({ overrides: { styledUnderlines: false } });

    expect(adaptiveUnderline('curly')).toBe(true);
    expect(adaptiveUnderline('dotted')).toBe(true);
    expect(adaptiveUnderline('dashed')).toBe(true);
  });

  it('should return true when preferred is true regardless of support', () => {
    configureProgressive({ overrides: { styledUnderlines: true } });
    expect(adaptiveUnderline(true)).toBe(true);

    configureProgressive({ overrides: { styledUnderlines: false } });
    expect(adaptiveUnderline(true)).toBe(true);
  });
});

// =============================================================================
// adaptiveColor()
// =============================================================================

describe('adaptiveColor', () => {
  it('should return truecolor hex when terminal supports truecolor', () => {
    configureProgressive({ overrides: { trueColor: true, colors: 'truecolor' } });

    expect(adaptiveColor('#ff5500', 'orange', 'red')).toBe('#ff5500');
  });

  it('should return ansi256 fallback when terminal has 256 colors but not truecolor', () => {
    configureProgressive({ overrides: { trueColor: false, colors: 256 } });

    expect(adaptiveColor('#ff5500', 'orange', 'red')).toBe('orange');
  });

  it('should return basic fallback when terminal has only 16 colors', () => {
    configureProgressive({ overrides: { trueColor: false, colors: 16 } });

    expect(adaptiveColor('#ff5500', 'orange', 'red')).toBe('red');
  });

  it('should return truecolor value when no basic fallback given and 16 colors', () => {
    configureProgressive({ overrides: { trueColor: false, colors: 16 } });

    expect(adaptiveColor('#ff5500', 'orange')).toBe('#ff5500');
  });

  it('should return truecolor value when no fallbacks given and 256 colors', () => {
    configureProgressive({ overrides: { trueColor: false, colors: 256 } });

    // No ansi256Fallback provided, so falls through to basicFallback ?? truecolor
    expect(adaptiveColor('#ff5500')).toBe('#ff5500');
  });

  it('should return ansi256 fallback even when basic fallback is also provided', () => {
    configureProgressive({ overrides: { trueColor: false, colors: 256 } });

    expect(adaptiveColor('#ff5500', '208', 'red')).toBe('208');
  });
});

// =============================================================================
// Capability query helpers
// =============================================================================

describe('capability helpers', () => {
  it('canSyncOutput returns true when synchronizedOutput is enabled', () => {
    configureProgressive({ overrides: { synchronizedOutput: true } });
    expect(canSyncOutput()).toBe(true);
  });

  it('canSyncOutput returns false when synchronizedOutput is disabled', () => {
    configureProgressive({ overrides: { synchronizedOutput: false } });
    expect(canSyncOutput()).toBe(false);
  });

  it('canStyleUnderlines reflects styledUnderlines capability', () => {
    configureProgressive({ overrides: { styledUnderlines: true } });
    expect(canStyleUnderlines()).toBe(true);

    configureProgressive({ overrides: { styledUnderlines: false } });
    expect(canStyleUnderlines()).toBe(false);
  });

  it('canColorUnderlines reflects coloredUnderlines capability', () => {
    configureProgressive({ overrides: { coloredUnderlines: true } });
    expect(canColorUnderlines()).toBe(true);

    configureProgressive({ overrides: { coloredUnderlines: false } });
    expect(canColorUnderlines()).toBe(false);
  });

  it('canClipboard reflects clipboard capability', () => {
    configureProgressive({ overrides: { clipboard: true } });
    expect(canClipboard()).toBe(true);

    configureProgressive({ overrides: { clipboard: false } });
    expect(canClipboard()).toBe(false);
  });

  it('canNotify reflects notifications capability', () => {
    configureProgressive({ overrides: { notifications: 'osc9' } });
    expect(canNotify()).toBe(true);

    configureProgressive({ overrides: { notifications: false } });
    expect(canNotify()).toBe(false);
  });

  it('canHyperlink reflects hyperlinks capability', () => {
    configureProgressive({ overrides: { hyperlinks: true } });
    expect(canHyperlink()).toBe(true);

    configureProgressive({ overrides: { hyperlinks: false } });
    expect(canHyperlink()).toBe(false);
  });

  it('hasGpuAcceleration reflects gpuAccelerated capability', () => {
    configureProgressive({ overrides: { gpuAccelerated: true } });
    expect(hasGpuAcceleration()).toBe(true);

    configureProgressive({ overrides: { gpuAccelerated: false } });
    expect(hasGpuAcceleration()).toBe(false);
  });

  it('getTerminalName returns profile name when available', () => {
    configureProgressive({
      overrides: {
        profile: {
          id: 'kitty',
          name: 'Kitty',
          gpuAccelerated: true,
          knownCaps: {
            trueColor: true,
            mouse: true,
            italic: true,
            strikethrough: true,
            hyperlinks: true,
            styledUnderlines: true,
            coloredUnderlines: true,
            clipboard: true,
            synchronizedOutput: true,
            cursorStyleControl: true,
            windowTitle: true,
            kittyKeyboard: true,
            kittyGraphics: true,
            sixel: false,
            iterm2Graphics: false,
            preferredGraphics: 'kitty',
            focusEvents: true,
            notifications: 'osc99',
            nerdFonts: false,
          },
        },
      },
    });

    expect(getTerminalName()).toBe('Kitty');
  });

  it('getTerminalName falls back to terminalName when no profile', () => {
    configureProgressive({
      overrides: {
        terminalName: 'xterm-256color',
        profile: undefined,
      },
    });

    expect(getTerminalName()).toBe('xterm-256color');
  });
});
