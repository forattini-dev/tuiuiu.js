/**
 * Progressive Enhancement Facade
 *
 * Provides escape sequence generators that adapt to the current
 * terminal's capabilities. Returns empty strings when unsupported,
 * enabling graceful degradation without conditionals at call sites.
 *
 *
 */

import type { MultiplexerInfo, CursorStyle, UnderlineStyle } from './terminal-profile.js';
import type { TerminalCapabilities } from './capabilities.js';
import { getCapabilities } from './capabilities.js';
import type { Color } from './buffer.js';
import { colorToAnsi } from './buffer.js';
import {
  sanitizeOsc777Field,
  sanitizeOscField,
  sanitizeTerminalLabel,
} from '../utils/terminal-sanitize.js';

// =============================================================================
// Passthrough / Multiplexer Wrapping
// =============================================================================

/**
 * Wrap an escape sequence for multiplexer passthrough.
 * tmux requires DCS passthrough, screen uses DCS as well,
 * zellij passes through natively.
 */
export function passthroughWrap(sequence: string, multiplexer?: MultiplexerInfo | null): string {
  const mux = multiplexer ?? getCapabilities().multiplexer;
  if (!mux) return sequence;

  switch (mux.type) {
    case 'tmux':
      // tmux DCS passthrough: \x1bPtmux;\x1b{seq}\x1b\\
      // Each ESC inside the sequence must be doubled
      return `\x1bPtmux;${sequence.replace(/\x1b/g, '\x1b\x1b')}\x1b\\`;
    case 'screen':
      // GNU Screen DCS passthrough
      return `\x1bP${sequence.replace(/\x1b/g, '\x1b\x1b')}\x1b\\`;
    case 'zellij':
      // Zellij passes through natively
      return sequence;
  }
}

// =============================================================================
// Synchronized Output (DEC mode 2026)
// =============================================================================

/** Begin Synchronized Update (BSU) */
export const BSU = '\x1b[?2026h';
/** End Synchronized Update (ESU) */
export const ESU = '\x1b[?2026l';

/**
 * Wrap output string in synchronized output markers.
 * Returns the original string unchanged if not supported.
 */
export function wrapSynchronized(output: string, caps?: TerminalCapabilities): string {
  const c = caps ?? getCapabilities();
  if (!c.synchronizedOutput) return output;

  const bsu = passthroughWrap(BSU, c.multiplexer);
  const esu = passthroughWrap(ESU, c.multiplexer);
  return `${bsu}${output}${esu}`;
}

/**
 * Get BSU sequence (or empty string if unsupported).
 */
export function getSynchronizedBegin(caps?: TerminalCapabilities): string {
  const c = caps ?? getCapabilities();
  if (!c.synchronizedOutput) return '';
  return passthroughWrap(BSU, c.multiplexer);
}

/**
 * Get ESU sequence (or empty string if unsupported).
 */
export function getSynchronizedEnd(caps?: TerminalCapabilities): string {
  const c = caps ?? getCapabilities();
  if (!c.synchronizedOutput) return '';
  return passthroughWrap(ESU, c.multiplexer);
}

// =============================================================================
// Cursor Styles (DECSCUSR)
// =============================================================================

const CURSOR_STYLE_MAP: Record<CursorStyle, { blinking: number; steady: number }> = {
  block: { blinking: 1, steady: 2 },
  underline: { blinking: 3, steady: 4 },
  beam: { blinking: 5, steady: 6 },
};

/**
 * Get escape sequence to set cursor style.
 * Returns empty string if terminal doesn't support cursor style control.
 */
export function setCursorStyle(style: CursorStyle, blinking = false, caps?: TerminalCapabilities): string {
  const c = caps ?? getCapabilities();
  if (!c.cursorStyleControl) return '';

  const entry = CURSOR_STYLE_MAP[style];
  const code = blinking ? entry.blinking : entry.steady;
  return passthroughWrap(`\x1b[${code} q`, c.multiplexer);
}

/**
 * Reset cursor to terminal default.
 */
export function resetCursorStyle(caps?: TerminalCapabilities): string {
  const c = caps ?? getCapabilities();
  if (!c.cursorStyleControl) return '';
  return passthroughWrap('\x1b[0 q', c.multiplexer);
}

// =============================================================================
// Window Title (OSC 0/2)
// =============================================================================

/**
 * Get escape sequence to set terminal window title.
 * Returns empty string if unsupported.
 */
export function setWindowTitle(title: string, caps?: TerminalCapabilities): string {
  const c = caps ?? getCapabilities();
  if (!c.windowTitle) return '';
  // OSC 2 ; title ST
  return passthroughWrap(`\x1b]2;${sanitizeOscField(title)}\x07`, c.multiplexer);
}

// =============================================================================
// Clipboard (OSC 52)
// =============================================================================

/**
 * Get escape sequence to write text to system clipboard via OSC 52.
 * Returns null if clipboard is not supported.
 */
export function getClipboardWriteSequence(text: string, caps?: TerminalCapabilities): string | null {
  const c = caps ?? getCapabilities();
  if (!c.clipboard) return null;

  // OSC 52 ; c ; base64-data ST
  const encoded = Buffer.from(text, 'utf-8').toString('base64');
  return passthroughWrap(`\x1b]52;c;${encoded}\x07`, c.multiplexer);
}

/**
 * Get escape sequence to query clipboard contents via OSC 52.
 * Returns null if clipboard is not supported.
 */
export function getClipboardQuerySequence(caps?: TerminalCapabilities): string | null {
  const c = caps ?? getCapabilities();
  if (!c.clipboard) return null;
  return passthroughWrap('\x1b]52;c;?\x07', c.multiplexer);
}

/**
 * Format an OSC 8 hyperlink when the terminal supports it.
 * Falls back to plain text when hyperlinks are unavailable.
 */
export function formatHyperlink(text: string, url: string, caps?: TerminalCapabilities): string {
  const c = caps ?? getCapabilities();
  const safeText = sanitizeTerminalLabel(text);
  if (!hyperlinksEnabled || !c.hyperlinks) {
    return safeText;
  }

  return passthroughWrap(
    `\x1b]8;;${sanitizeOscField(url)}\x07${safeText}\x1b]8;;\x07`,
    c.multiplexer,
  );
}

// =============================================================================
// Notifications (OSC 9/99/777)
// =============================================================================

/**
 * Get escape sequence to send a terminal notification.
 * Returns null if notifications are not supported.
 */
export function getNotificationSequence(
  title: string,
  body?: string,
  caps?: TerminalCapabilities,
): string | null {
  const c = caps ?? getCapabilities();
  if (!c.notifications) return null;

  switch (c.notifications) {
    case 'osc9':
      // iTerm2/WezTerm: OSC 9 ; message ST
      return passthroughWrap(
        `\x1b]9;${sanitizeOscField(body ? `${title}: ${body}` : title)}\x07`,
        c.multiplexer,
      );
    case 'osc99':
      // Kitty: OSC 99 ; i=1:d=0:p=title ; body ST
      if (body) {
        return passthroughWrap(
          `\x1b]99;i=1:d=0:p=body;${sanitizeOscField(title)}\x07` +
          `\x1b]99;i=1:d=1:p=body;${sanitizeOscField(body)}\x07`,
          c.multiplexer,
        );
      }
      return passthroughWrap(`\x1b]99;i=1:d=0;${sanitizeOscField(title)}\x07`, c.multiplexer);
    case 'osc777':
      // Foot/Tilix: OSC 777 ; notify ; title ; body ST
      return passthroughWrap(
        `\x1b]777;notify;${sanitizeOsc777Field(title)};${sanitizeOsc777Field(body || '')}\x07`,
        c.multiplexer,
      );
  }
}

// =============================================================================
// Styled Underlines (SGR colon sub-parameters)
// =============================================================================

/** Underline style to SGR sub-parameter value */
const UNDERLINE_STYLE_MAP: Record<UnderlineStyle, string> = {
  single: '1',
  double: '2',
  curly: '3',
  dotted: '4',
  dashed: '5',
};

/**
 * Get SGR code for a styled underline.
 * Falls back to simple underline ('4') if styled underlines are not supported.
 */
export function getUnderlineCode(
  style: UnderlineStyle | true | boolean,
  caps?: TerminalCapabilities,
): string {
  if (!style) return '';

  const c = caps ?? getCapabilities();

  if (typeof style === 'string' && c.styledUnderlines) {
    return `4:${UNDERLINE_STYLE_MAP[style]}`;
  }

  // Fallback: simple underline
  return '4';
}

/**
 * Get SGR code for colored underline (SGR 58).
 * Returns empty string if colored underlines are not supported.
 */
export function getUnderlineColorCode(color: Color, caps?: TerminalCapabilities): string {
  const c = caps ?? getCapabilities();
  if (!c.coloredUnderlines) return '';

  // Use the same color format as foreground but with code 58
  if (typeof color === 'string') {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `58;2;${r};${g};${b}`;
    }
    // Named color — resolve using foreground logic then remap to 58
    const fgCode = colorToAnsi(color, false);
    if (fgCode) {
      // Convert "38;2;R;G;B" or "38;5;N" to "58;..." or named "3x" to "58;5;x"
      if (fgCode.startsWith('38;')) {
        return '58;' + fgCode.slice(3);
      }
      // Named color (30-37, 90-97) — convert to 256-color for underline
      const num = parseInt(fgCode, 10);
      if (!isNaN(num)) {
        return `58;5;${num < 38 ? num - 30 : num - 82}`;
      }
    }
    return '';
  }

  if ('r' in color) {
    return `58;2;${color.r};${color.g};${color.b}`;
  }

  if ('ansi256' in color) {
    return `58;5;${color.ansi256}`;
  }

  return '';
}

/**
 * Reset underline color (SGR 59).
 */
export function getUnderlineColorResetCode(): string {
  return '59';
}

// =============================================================================
// Nerd Fonts
// =============================================================================

let nerdFontsEnabled = false;
let hyperlinksEnabled = true;
let progressiveVersion = 0;

/**
 * Enable or disable Nerd Fonts support.
 * When enabled, components may use Nerd Font icons.
 */
export function setNerdFonts(enabled: boolean): void {
  nerdFontsEnabled = enabled;
  progressiveVersion++;
}

/**
 * Check if Nerd Fonts are enabled.
 * Checks both explicit opt-in and NERD_FONT env var.
 */
export function hasNerdFonts(): boolean {
  return nerdFontsEnabled || process.env.NERD_FONT === '1' || process.env.NERD_FONTS === '1';
}

/**
 * Enable or disable OSC 8 hyperlink emission globally.
 * Defaults to enabled.
 */
export function setHyperlinksEnabled(enabled: boolean): void {
  hyperlinksEnabled = enabled;
  progressiveVersion++;
}

/**
 * Check whether hyperlink emission is enabled.
 */
export function areHyperlinksEnabled(): boolean {
  return hyperlinksEnabled;
}

// =============================================================================
// Configuration
// =============================================================================

let capabilityOverrides: Partial<TerminalCapabilities> | null = null;

/**
 * Override detected capabilities for progressive enhancement.
 * Useful for testing or forcing specific behavior.
 */
export function configureProgressive(options: {
  overrides?: Partial<TerminalCapabilities>;
  hyperlinks?: boolean;
}): void {
  capabilityOverrides = options.overrides ?? null;
  if (options.hyperlinks !== undefined) {
    hyperlinksEnabled = options.hyperlinks;
  }
  progressiveVersion++;
}

/**
 * Get any configured overrides.
 */
export function getProgressiveOverrides(): Partial<TerminalCapabilities> | null {
  return capabilityOverrides;
}

/**
 * Get the current progressive configuration version.
 * Used by capability caching to invalidate stale snapshots.
 */
export function getProgressiveVersion(): number {
  return progressiveVersion;
}

/**
 * Reset progressive configuration.
 */
export function resetProgressive(): void {
  capabilityOverrides = null;
  nerdFontsEnabled = false;
  hyperlinksEnabled = true;
  progressiveVersion++;
}
