/**
 * Reck Text Utilities - ANSI-aware text manipulation
 *
 * Features:
 * - Text wrapping with ANSI preservation
 * - Text truncation (start, middle, end)
 * - Advanced color support (named, hex, RGB, ANSI256)
 */

// ANSI escape sequence constants
const ESC = '\u001B';
const CSI = '[';
const OSC = ']';
const SGR_END = 'm';
const BELL = '\u0007';
const HYPERLINK_START = `${OSC}8;;`;

// Regex patterns
const ANSI_REGEX = /\u001B\[[0-9;]*m/g;
const SGR_REGEX = /^\u001B\[(\d+)m/;

/**
 * Strip ANSI escape codes from text
 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '');
}

/**
 * Get visible width of text (excluding ANSI codes)
 * Handles wide characters (CJK, emoji) as width 2
 */
export function stringWidth(text: string): number {
  const stripped = stripAnsi(text);
  let width = 0;

  for (const char of stripped) {
    const code = char.codePointAt(0) ?? 0;

    // Control characters
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      continue;
    }

    // Zero-width characters (should not contribute to width)
    if (isZeroWidthCharacter(code)) {
      continue;
    }

    // Wide characters (CJK, emoji, etc.)
    if (isWideCharacter(code)) {
      width += 2;
    } else {
      width += 1;
    }
  }

  return width;
}

/**
 * Check if a character is zero-width (variation selectors, joiners, etc.)
 */
function isZeroWidthCharacter(code: number): boolean {
  return (
    // Variation Selectors (VS1-VS16)
    (code >= 0xfe00 && code <= 0xfe0f) ||
    // Variation Selectors Supplement (VS17-VS256)
    (code >= 0xe0100 && code <= 0xe01ef) ||
    // Zero Width Space
    code === 0x200b ||
    // Zero Width Non-Joiner
    code === 0x200c ||
    // Zero Width Joiner (used in emoji sequences)
    code === 0x200d ||
    // Word Joiner
    code === 0x2060 ||
    // Zero Width No-Break Space (BOM)
    code === 0xfeff ||
    // Combining marks (general range)
    (code >= 0x0300 && code <= 0x036f) ||
    // Combining Diacritical Marks Extended
    (code >= 0x1ab0 && code <= 0x1aff) ||
    // Combining Diacritical Marks Supplement
    (code >= 0x1dc0 && code <= 0x1dff) ||
    // Combining Half Marks
    (code >= 0xfe20 && code <= 0xfe2f) ||
    // Soft hyphen
    code === 0x00ad
  );
}

/**
 * Check if a character is a wide character (CJK, emoji, fullwidth)
 * Note: Many terminals render these symbols as width 2, even if Unicode
 * standard says width 1. We prioritize visual consistency in terminals.
 */
function isWideCharacter(code: number): boolean {
  return (
    // CJK Unified Ideographs
    (code >= 0x4e00 && code <= 0x9fff) ||
    // CJK Extension A-F
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df) ||
    (code >= 0x2a700 && code <= 0x2ceaf) ||
    // Fullwidth Forms
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    // Hiragana, Katakana
    (code >= 0x3040 && code <= 0x30ff) ||
    // Hangul
    (code >= 0xac00 && code <= 0xd7a3) ||
    // Emoji (basic range) - actual pictographic emoji are width 2
    (code >= 0x1f300 && code <= 0x1f9ff) ||
    (code >= 0x1fa00 && code <= 0x1faff) ||
    // Specific emoji-presentation characters from Dingbats/Misc Symbols
    // These render as emoji (width 2) in most terminals
    isEmojiPresentationChar(code)
    // Note: Simple symbols like ✓ ✗ ⚠ ℹ (U+2713, U+2717, U+26A0, U+2139)
    // are "Ambiguous Width" and render as width 1 in most Western terminals
  );
}

/**
 * Check if character has default emoji presentation (renders as width 2)
 * These are specific characters from Dingbats/Misc Symbols ranges that
 * typically render as colored emoji rather than simple text symbols
 */
function isEmojiPresentationChar(code: number): boolean {
  // Common emoji from Dingbats range (0x2700-0x27BF)
  const dingbatEmoji = [
    0x2702, // ✂ scissors
    0x2705, // ✅ check mark
    0x2708, // ✈ airplane
    0x2709, // ✉ envelope
    0x270a, // ✊ fist
    0x270b, // ✋ hand
    0x270c, // ✌ victory
    0x270d, // ✍ writing hand
    0x270f, // ✏ pencil
    0x2712, // ✒ nib
    0x2714, // ✔ heavy check
    0x2716, // ✖ heavy x
    0x2728, // ✨ sparkles
    0x2733, // ✳ asterisk
    0x2734, // ✴ star
    0x2744, // ❄ snowflake
    0x2747, // ❇ sparkle
    0x274c, // ❌ cross mark
    0x274e, // ❎ negative cross
    0x2753, // ❓ question
    0x2754, // ❔ question
    0x2755, // ❕ exclamation
    0x2757, // ❗ exclamation
    0x2763, // ❣ heart exclamation
    0x2764, // ❤ heart
    0x2795, // ➕ plus
    0x2796, // ➖ minus
    0x2797, // ➗ division
    0x27a1, // ➡ arrow
    0x27b0, // ➰ loop
  ];

  // Common emoji from Misc Symbols range (0x2600-0x26FF)
  const miscEmoji = [
    0x2600, // ☀ sun
    0x2601, // ☁ cloud
    0x2602, // ☂ umbrella
    0x2603, // ☃ snowman
    0x2604, // ☄ comet
    0x260e, // ☎ telephone
    0x2611, // ☑ ballot check
    0x2614, // ☔ umbrella rain
    0x2615, // ☕ coffee
    0x2618, // ☘ shamrock
    0x261d, // ☝ index finger
    0x2620, // ☠ skull
    0x2622, // ☢ radioactive
    0x2623, // ☣ biohazard
    0x2626, // ☦ cross
    0x262a, // ☪ star crescent
    0x262e, // ☮ peace
    0x262f, // ☯ yin yang
    0x2638, // ☸ wheel
    0x2639, // ☹ frown
    0x263a, // ☺ smile
    0x2640, // ♀ female
    0x2642, // ♂ male
    0x2648, 0x2649, 0x264a, 0x264b, 0x264c, 0x264d, // zodiac
    0x264e, 0x264f, 0x2650, 0x2651, 0x2652, 0x2653,
    0x265f, // ♟ chess pawn
    0x2660, // ♠ spade
    0x2663, // ♣ club
    0x2665, // ♥ heart
    0x2666, // ♦ diamond
    0x2668, // ♨ hot springs
    0x267b, // ♻ recycle
    0x267e, // ♾ infinity
    0x267f, // ♿ wheelchair
    0x2692, // ⚒ hammers
    0x2693, // ⚓ anchor
    0x2694, // ⚔ swords
    0x2695, // ⚕ medical
    0x2696, // ⚖ scales
    0x2697, // ⚗ alembic
    0x2699, // ⚙ gear
    0x269b, // ⚛ atom
    0x269c, // ⚜ fleur-de-lis
    0x26a1, // ⚡ lightning
    0x26aa, // ⚪ white circle
    0x26ab, // ⚫ black circle
    0x26b0, // ⚰ coffin
    0x26b1, // ⚱ urn
    0x26bd, // ⚽ soccer
    0x26be, // ⚾ baseball
    0x26c4, // ⛄ snowman
    0x26c5, // ⛅ sun cloud
    0x26ce, // ⛎ ophiuchus
    0x26d4, // ⛔ no entry
    0x26ea, // ⛪ church
    0x26f2, // ⛲ fountain
    0x26f3, // ⛳ golf
    0x26f5, // ⛵ sailboat
    0x26fa, // ⛺ tent
    0x26fd, // ⛽ fuel pump
  ];

  return dingbatEmoji.includes(code) || miscEmoji.includes(code);
}

// ============================================
// Text Wrapping
// ============================================

export interface WrapOptions {
  /** Hard wrap (break words) or soft wrap (keep words intact) */
  hard?: boolean;
  /** Trim leading/trailing whitespace */
  trim?: boolean;
  /** Preserve word boundaries */
  wordWrap?: boolean;
}

/**
 * Wrap text to fit within a given width
 * Preserves ANSI escape codes across line breaks
 */
export function wrapText(text: string, columns: number, options: WrapOptions = {}): string {
  const { hard = true, trim = true, wordWrap = true } = options;

  if (columns < 1) return '';
  if (trim && text.trim() === '') return '';

  return text
    .split('\n')
    .map(line => wrapLine(line, columns, { hard, trim, wordWrap }))
    .join('\n');
}

/**
 * Wrap a single line of text
 */
function wrapLine(text: string, columns: number, options: WrapOptions): string {
  const { hard, trim, wordWrap } = options;
  const words = text.split(' ');
  const rows: string[] = [''];

  let currentStyle = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let row = rows[rows.length - 1];

    if (trim) {
      row = row.trimStart();
    }

    const rowWidth = stringWidth(row);
    const wordWidth = stringWidth(word);

    // Add space between words (except at start of line)
    const needsSpace = i !== 0 && rowWidth > 0;
    const spaceWidth = needsSpace ? 1 : 0;

    if (rowWidth + spaceWidth + wordWidth <= columns) {
      // Word fits on current line
      rows[rows.length - 1] = row + (needsSpace ? ' ' : '') + word;
    } else if (hard && wordWidth > columns) {
      // Word is longer than line width - break it
      wrapWord(rows, word, columns, currentStyle);
    } else if (wordWrap && rowWidth > 0) {
      // Start new line
      if (currentStyle) {
        rows[rows.length - 1] += '\u001B[0m'; // Reset at end of line
      }
      rows.push(currentStyle + word); // Apply style at start of new line
    } else {
      rows[rows.length - 1] = row + (needsSpace ? ' ' : '') + word;
    }

    // Track current style
    const styleMatches = word.match(/\u001B\[\d+m/g);
    if (styleMatches) {
      for (const match of styleMatches) {
        if (match === '\u001B[0m') {
          currentStyle = '';
        } else {
          currentStyle = match;
        }
      }
    }
  }

  // Trim trailing spaces if needed
  if (trim) {
    return rows.map(row => row.trimEnd()).join('\n');
  }

  return rows.join('\n');
}

/**
 * Break a long word across multiple lines
 */
function wrapWord(rows: string[], word: string, columns: number, currentStyle: string): void {
  let visible = stringWidth(rows[rows.length - 1]);
  let charIndex = 0;
  const chars: string[] = [];
  for (const char of word) {
    chars.push(char);
  }

  while (charIndex < chars.length) {
    const char = chars[charIndex];
    const charWidth = stringWidth(char);

    // Skip ANSI escape sequences
    if (char === ESC) {
      let escape = char;
      charIndex++;
      while (charIndex < chars.length && !chars[charIndex].match(/[a-zA-Z]/)) {
        escape += chars[charIndex];
        charIndex++;
      }
      if (charIndex < chars.length) {
        escape += chars[charIndex];
        charIndex++;
      }
      rows[rows.length - 1] += escape;
      continue;
    }

    if (visible + charWidth <= columns) {
      rows[rows.length - 1] += char;
      visible += charWidth;
    } else {
      // Start new line
      if (currentStyle) {
        rows[rows.length - 1] += '\u001B[0m';
      }
      rows.push(currentStyle + char);
      visible = charWidth;
    }

    charIndex++;
  }
}

// ============================================
// Text Truncation
// ============================================

export type TruncatePosition = 'start' | 'middle' | 'end';

export interface TruncateOptions {
  /** Where to truncate: 'start', 'middle', or 'end' */
  position?: TruncatePosition;
  /** Truncation character (default: '...') */
  truncationCharacter?: string;
  /** Add space around truncation character */
  space?: boolean;
  /** Prefer truncating at word boundaries */
  preferTruncationOnSpace?: boolean;
}

/**
 * Truncate text to fit within a given width
 * Preserves ANSI escape codes
 */
export function truncateText(
  text: string,
  columns: number,
  options: TruncateOptions = {}
): string {
  const {
    position = 'end',
    truncationCharacter = '...',
    space = false,
    preferTruncationOnSpace = false,
  } = options;

  const length = stringWidth(text);

  if (length <= columns) {
    return text;
  }

  if (columns < stringWidth(truncationCharacter)) {
    return truncationCharacter.slice(0, columns);
  }

  const ellipsis = space
    ? position === 'middle'
      ? ` ${truncationCharacter} `
      : position === 'start'
        ? `${truncationCharacter} `
        : ` ${truncationCharacter}`
    : truncationCharacter;

  const ellipsisWidth = stringWidth(ellipsis);

  if (position === 'start') {
    return truncateStart(text, columns, ellipsis, ellipsisWidth, preferTruncationOnSpace);
  }

  if (position === 'middle') {
    return truncateMiddle(text, columns, ellipsis, ellipsisWidth, preferTruncationOnSpace);
  }

  return truncateEnd(text, columns, ellipsis, ellipsisWidth, preferTruncationOnSpace);
}

/**
 * Truncate from the start
 */
function truncateStart(
  text: string,
  columns: number,
  ellipsis: string,
  ellipsisWidth: number,
  preferSpace: boolean
): string {
  const visibleChars = columns - ellipsisWidth;
  const result = sliceAnsi(text, stringWidth(text) - visibleChars);

  if (preferSpace) {
    const spaceIndex = result.indexOf(' ');
    if (spaceIndex !== -1 && spaceIndex < 4) {
      return ellipsis + result.slice(spaceIndex + 1);
    }
  }

  return ellipsis + result;
}

/**
 * Truncate from the end
 */
function truncateEnd(
  text: string,
  columns: number,
  ellipsis: string,
  ellipsisWidth: number,
  preferSpace: boolean
): string {
  const visibleChars = columns - ellipsisWidth;
  const result = sliceAnsi(text, 0, visibleChars);

  if (preferSpace) {
    const lastSpace = result.lastIndexOf(' ');
    if (lastSpace !== -1 && result.length - lastSpace < 4) {
      return result.slice(0, lastSpace) + ellipsis;
    }
  }

  return result + ellipsis;
}

/**
 * Truncate from the middle
 */
function truncateMiddle(
  text: string,
  columns: number,
  ellipsis: string,
  ellipsisWidth: number,
  preferSpace: boolean
): string {
  const half = Math.floor((columns - ellipsisWidth) / 2);
  const start = sliceAnsi(text, 0, half);
  const end = sliceAnsi(text, stringWidth(text) - half);

  return start + ellipsis + end;
}

/**
 * Slice ANSI string by visible character positions
 * Preserves ANSI escape codes
 */
export function sliceAnsi(text: string, start: number, end?: number): string {
  const chars: string[] = [];
  for (const char of text) {
    chars.push(char);
  }

  let result = '';
  let visible = 0;
  let currentStyle = '';
  let i = 0;

  while (i < chars.length && (end === undefined || visible < end)) {
    const char = chars[i];

    // Handle ANSI escape sequences
    if (char === ESC && i + 1 < chars.length && chars[i + 1] === '[') {
      let escape = char;
      i++;
      while (i < chars.length) {
        escape += chars[i];
        if (chars[i].match(/[a-zA-Z]/)) {
          i++;
          break;
        }
        i++;
      }

      // Track style for preservation
      if (escape === '\u001B[0m') {
        currentStyle = '';
      } else if (escape.match(/\u001B\[\d+m/)) {
        currentStyle = escape;
      }

      // Include escape if we're in the visible range
      if (visible >= start) {
        result += escape;
      }
      continue;
    }

    const charWidth = stringWidth(char);

    if (visible >= start && (end === undefined || visible < end)) {
      // Add style if starting fresh
      if (result === '' && currentStyle) {
        result += currentStyle;
      }
      result += char;
    }

    visible += charWidth;
    i++;
  }

  // Reset style at end if we have active styling
  if (currentStyle && result) {
    result += '\u001B[0m';
  }

  return result;
}

/**
 * Skip (remove) N visible characters from the start of ANSI string
 * Preserves ANSI escape codes and reapplies active styles
 *
 *
 *
 * @example
 * ```typescript
 * skipAnsi('\u001B[31mHello\u001B[0m World', 3)
 * // Returns: '\u001B[31mlo\u001B[0m World'
 * ```
 */
export function skipAnsi(text: string, count: number): string {
  if (count <= 0) return text;
  return sliceAnsi(text, count);
}

/**
 * Take only N visible characters from the start of ANSI string
 * Alias for sliceAnsi(text, 0, count) - useful for transition APIs
 *
 * @example
 * ```typescript
 * takeAnsi('\u001B[31mHello\u001B[0m World', 3)
 * // Returns: '\u001B[31mHel\u001B[0m'
 * ```
 */
export function takeAnsi(text: string, count: number): string {
  if (count <= 0) return '';
  return sliceAnsi(text, 0, count);
}

/**
 * Pad string to width, preserving ANSI codes
 * Useful for aligning columns in tables and transitions
 */
export function padAnsi(text: string, width: number, align: 'left' | 'right' | 'center' = 'left', char = ' '): string {
  const visibleWidth = stringWidth(text);
  if (visibleWidth >= width) return text;

  const padding = width - visibleWidth;

  switch (align) {
    case 'right':
      return char.repeat(padding) + text;
    case 'center': {
      const left = Math.floor(padding / 2);
      const right = padding - left;
      return char.repeat(left) + text + char.repeat(right);
    }
    case 'left':
    default:
      return text + char.repeat(padding);
  }
}

/**
 * Split text into lines, handling both \n and \r\n
 */
export function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

/**
 * Join lines with newline character
 */
export function joinLines(lines: string[]): string {
  return lines.join('\n');
}

/**
 * Ensure text has exactly N lines (pad with empty or truncate)
 */
export function normalizeLines(text: string, lineCount: number): string[] {
  const lines = splitLines(text);
  if (lines.length >= lineCount) {
    return lines.slice(0, lineCount);
  }
  return [...lines, ...Array(lineCount - lines.length).fill('')];
}

/**
 * Composite two texts horizontally for transition effects
 * Each text is split into lines and combined side by side
 *
 * Used for swipe/slide transitions where both prev and next content
 * are visible during the animation
 *
 * @example
 * ```typescript
 * // During swipe left animation at 50%
 * const prev = 'Hello\nWorld';
 * const next = 'Goodbye\nEarth';
 * compositeHorizontal(prev, next, 40, 20) // 20 chars from each
 * ```
 */
export function compositeHorizontal(
  left: string,
  right: string,
  totalWidth: number,
  splitPoint: number,
  gap = 0
): string {
  const leftLines = splitLines(left);
  const rightLines = splitLines(right);
  const maxLines = Math.max(leftLines.length, rightLines.length);

  const leftWidth = splitPoint;
  const rightWidth = totalWidth - splitPoint - gap;

  const result: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const leftLine = leftLines[i] || '';
    const rightLine = rightLines[i] || '';

    // Take rightmost part of left content (sliding out)
    const leftVisible = skipAnsi(leftLine, Math.max(0, stringWidth(leftLine) - leftWidth));
    const leftPadded = padAnsi(leftVisible, leftWidth, 'right');

    // Take leftmost part of right content (sliding in)
    const rightVisible = takeAnsi(rightLine, rightWidth);
    const rightPadded = padAnsi(rightVisible, rightWidth, 'left');

    result.push(leftPadded + ' '.repeat(gap) + rightPadded);
  }

  return joinLines(result);
}

/**
 * Composite two texts vertically for slide up/down transitions
 */
export function compositeVertical(
  top: string,
  bottom: string,
  totalHeight: number,
  splitPoint: number,
  gap = 0
): string {
  const topLines = splitLines(top);
  const bottomLines = splitLines(bottom);

  const topHeight = splitPoint;
  const bottomHeight = totalHeight - splitPoint - gap;

  // Take bottom part of top content (sliding out)
  const topVisible = topLines.slice(-topHeight);

  // Take top part of bottom content (sliding in)
  const bottomVisible = bottomLines.slice(0, bottomHeight);

  return joinLines([
    ...topVisible,
    ...Array(gap).fill(''),
    ...bottomVisible
  ]);
}

// ============================================
// Advanced Color Support
// ============================================

export type ColorType = 'foreground' | 'background';

/**
 * Parse a color value and return ANSI codes
 * Supports:
 * - Named colors (red, green, blue, etc.)
 * - Hex colors (#fff, #ffffff)
 * - RGB colors (rgb(255, 0, 0))
 * - ANSI 256 colors (ansi256(196))
 */
export function colorToAnsi(color: string, type: ColorType = 'foreground'): string {
  if (!color) return '';

  // Named colors
  const namedColors: Record<string, [number, number]> = {
    black: [30, 40],
    red: [31, 41],
    green: [32, 42],
    yellow: [33, 43],
    blue: [34, 44],
    magenta: [35, 45],
    cyan: [36, 46],
    white: [37, 47],
    gray: [90, 100],
    grey: [90, 100],
    blackBright: [90, 100],
    redBright: [91, 101],
    greenBright: [92, 102],
    yellowBright: [93, 103],
    blueBright: [94, 104],
    magentaBright: [95, 105],
    cyanBright: [96, 106],
    whiteBright: [97, 107],
  };

  const named = namedColors[color];
  if (named) {
    return `\u001B[${type === 'foreground' ? named[0] : named[1]}m`;
  }

  // Hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    let r: number, g: number, b: number;

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return '';
    }

    return type === 'foreground'
      ? `\u001B[38;2;${r};${g};${b}m`
      : `\u001B[48;2;${r};${g};${b}m`;
  }

  // RGB colors
  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return type === 'foreground'
      ? `\u001B[38;2;${r};${g};${b}m`
      : `\u001B[48;2;${r};${g};${b}m`;
  }

  // ANSI 256 colors
  const ansi256Match = color.match(/^ansi256\(\s*(\d+)\s*\)$/);
  if (ansi256Match) {
    const code = ansi256Match[1];
    return type === 'foreground'
      ? `\u001B[38;5;${code}m`
      : `\u001B[48;5;${code}m`;
  }

  return '';
}

/**
 * Apply color to text
 */
export function colorize(text: string, color: string, type: ColorType = 'foreground'): string {
  const code = colorToAnsi(color, type);
  if (!code) return text;
  return `${code}${text}\u001B[0m`;
}

// ============================================
// Text Style Helpers
// ============================================

const styles = {
  reset: '\u001B[0m',
  bold: '\u001B[1m',
  dim: '\u001B[2m',
  italic: '\u001B[3m',
  underline: '\u001B[4m',
  inverse: '\u001B[7m',
  strikethrough: '\u001B[9m',
  boldOff: '\u001B[22m',
  dimOff: '\u001B[22m',
  italicOff: '\u001B[23m',
  underlineOff: '\u001B[24m',
  inverseOff: '\u001B[27m',
  strikethroughOff: '\u001B[29m',
};

/**
 * Apply text style
 */
export function style(text: string, ...styleNames: (keyof typeof styles)[]): string {
  const codes = styleNames.map(name => styles[name]).join('');
  return `${codes}${text}${styles.reset}`;
}

/**
 * Create a hyperlink (OSC 8)
 */
export function hyperlink(text: string, url: string): string {
  return `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`;
}

// Export style codes for direct use
export { styles };
