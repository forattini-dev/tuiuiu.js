/**
 * Terminal Colors API
 *
 * Zero-dependency ANSI colors for terminal text styling.
 * Supports function calls, method chaining, and composition.
 *
 * @example
 * // Simple functions
 * import { red, bold, bgBlue, compose } from 'tuiuiu.js/colors'
 *
 * console.log(red('Error!'))
 * console.log(bold('Important'))
 * console.log(bgBlue('Highlighted'))
 *
 * // Composition
 * console.log(compose(red, bold)('Critical Error!'))
 *
 * // Chainable API
 * import { c } from 'tuiuiu.js/colors'
 *
 * console.log(c.red('Error!'))
 * console.log(c.red.bold('Critical!'))
 * console.log(c.bgBlue.white('Info'))
 */

// =============================================================================
// ANSI Escape Codes
// =============================================================================

const ESC = '\u001B[';
const RESET = `${ESC}0m`;

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Apply ANSI color/style codes to text
 */
function applyCode(text: string, open: number, close: number): string {
  return `${ESC}${open}m${text}${ESC}${close}m`;
}

/**
 * Apply RGB color to text (foreground)
 */
function applyRgb(text: string, r: number, g: number, b: number): string {
  return `${ESC}38;2;${r};${g};${b}m${text}${RESET}`;
}

/**
 * Apply RGB color to text (background)
 */
function applyBgRgb(text: string, r: number, g: number, b: number): string {
  return `${ESC}48;2;${r};${g};${b}m${text}${RESET}`;
}

/**
 * Apply ANSI 256 color to text (foreground)
 */
function applyAnsi256(text: string, code: number): string {
  return `${ESC}38;5;${code}m${text}${RESET}`;
}

/**
 * Apply ANSI 256 color to text (background)
 */
function applyBgAnsi256(text: string, code: number): string {
  return `${ESC}48;5;${code}m${text}${RESET}`;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

// =============================================================================
// Color Function Type
// =============================================================================

export type ColorFn = (text: string) => string;

// =============================================================================
// Foreground Colors (Simple Functions)
// =============================================================================

/** Black text */
export const black: ColorFn = (text) => applyCode(text, 30, 39);
/** Red text */
export const red: ColorFn = (text) => applyCode(text, 31, 39);
/** Green text */
export const green: ColorFn = (text) => applyCode(text, 32, 39);
/** Yellow text */
export const yellow: ColorFn = (text) => applyCode(text, 33, 39);
/** Blue text */
export const blue: ColorFn = (text) => applyCode(text, 34, 39);
/** Magenta text */
export const magenta: ColorFn = (text) => applyCode(text, 35, 39);
/** Cyan text */
export const cyan: ColorFn = (text) => applyCode(text, 36, 39);
/** White text */
export const white: ColorFn = (text) => applyCode(text, 37, 39);
/** Gray text (bright black) */
export const gray: ColorFn = (text) => applyCode(text, 90, 39);
/** Grey text (alias for gray) */
export const grey: ColorFn = gray;

// Bright variants
/** Bright black text */
export const blackBright: ColorFn = (text) => applyCode(text, 90, 39);
/** Bright red text */
export const redBright: ColorFn = (text) => applyCode(text, 91, 39);
/** Bright green text */
export const greenBright: ColorFn = (text) => applyCode(text, 92, 39);
/** Bright yellow text */
export const yellowBright: ColorFn = (text) => applyCode(text, 93, 39);
/** Bright blue text */
export const blueBright: ColorFn = (text) => applyCode(text, 94, 39);
/** Bright magenta text */
export const magentaBright: ColorFn = (text) => applyCode(text, 95, 39);
/** Bright cyan text */
export const cyanBright: ColorFn = (text) => applyCode(text, 96, 39);
/** Bright white text */
export const whiteBright: ColorFn = (text) => applyCode(text, 97, 39);

// =============================================================================
// Background Colors (Simple Functions)
// =============================================================================

/** Black background */
export const bgBlack: ColorFn = (text) => applyCode(text, 40, 49);
/** Red background */
export const bgRed: ColorFn = (text) => applyCode(text, 41, 49);
/** Green background */
export const bgGreen: ColorFn = (text) => applyCode(text, 42, 49);
/** Yellow background */
export const bgYellow: ColorFn = (text) => applyCode(text, 43, 49);
/** Blue background */
export const bgBlue: ColorFn = (text) => applyCode(text, 44, 49);
/** Magenta background */
export const bgMagenta: ColorFn = (text) => applyCode(text, 45, 49);
/** Cyan background */
export const bgCyan: ColorFn = (text) => applyCode(text, 46, 49);
/** White background */
export const bgWhite: ColorFn = (text) => applyCode(text, 47, 49);
/** Gray background (bright black) */
export const bgGray: ColorFn = (text) => applyCode(text, 100, 49);
/** Grey background (alias for bgGray) */
export const bgGrey: ColorFn = bgGray;

// Bright variants
/** Bright black background */
export const bgBlackBright: ColorFn = (text) => applyCode(text, 100, 49);
/** Bright red background */
export const bgRedBright: ColorFn = (text) => applyCode(text, 101, 49);
/** Bright green background */
export const bgGreenBright: ColorFn = (text) => applyCode(text, 102, 49);
/** Bright yellow background */
export const bgYellowBright: ColorFn = (text) => applyCode(text, 103, 49);
/** Bright blue background */
export const bgBlueBright: ColorFn = (text) => applyCode(text, 104, 49);
/** Bright magenta background */
export const bgMagentaBright: ColorFn = (text) => applyCode(text, 105, 49);
/** Bright cyan background */
export const bgCyanBright: ColorFn = (text) => applyCode(text, 106, 49);
/** Bright white background */
export const bgWhiteBright: ColorFn = (text) => applyCode(text, 107, 49);

// =============================================================================
// Modifiers (Simple Functions)
// =============================================================================

/** Reset all styles */
export const reset: ColorFn = (text) => `${RESET}${text}${RESET}`;
/** Bold text */
export const bold: ColorFn = (text) => applyCode(text, 1, 22);
/** Dim text (reduced intensity) */
export const dim: ColorFn = (text) => applyCode(text, 2, 22);
/** Italic text */
export const italic: ColorFn = (text) => applyCode(text, 3, 23);
/** Underlined text */
export const underline: ColorFn = (text) => applyCode(text, 4, 24);
/** Overlined text */
export const overline: ColorFn = (text) => applyCode(text, 53, 55);
/** Inverse colors (swap fg/bg) */
export const inverse: ColorFn = (text) => applyCode(text, 7, 27);
/** Hidden text */
export const hidden: ColorFn = (text) => applyCode(text, 8, 28);
/** Strikethrough text */
export const strikethrough: ColorFn = (text) => applyCode(text, 9, 29);

// =============================================================================
// RGB and Hex Color Functions
// =============================================================================

/**
 * Apply RGB foreground color
 *
 * @example
 * rgb(255, 100, 50)('Orange text')
 */
export function rgb(r: number, g: number, b: number): ColorFn {
  return (text) => applyRgb(text, r, g, b);
}

/**
 * Apply RGB background color
 *
 * @example
 * bgRgb(0, 100, 200)('Blue background')
 */
export function bgRgb(r: number, g: number, b: number): ColorFn {
  return (text) => applyBgRgb(text, r, g, b);
}

/**
 * Apply hex foreground color
 *
 * @example
 * hex('#ff6600')('Orange text')
 * hex('#f60')('Short form')
 */
export function hex(color: string): ColorFn {
  const rgbVal = hexToRgb(color);
  if (!rgbVal) return (text) => text;
  return (text) => applyRgb(text, rgbVal[0], rgbVal[1], rgbVal[2]);
}

/**
 * Apply hex background color
 *
 * @example
 * bgHex('#0066ff')('Blue background')
 */
export function bgHex(color: string): ColorFn {
  const rgbVal = hexToRgb(color);
  if (!rgbVal) return (text) => text;
  return (text) => applyBgRgb(text, rgbVal[0], rgbVal[1], rgbVal[2]);
}

/**
 * Apply ANSI 256 foreground color
 *
 * @example
 * ansi256(196)('Bright red')
 */
export function ansi256(code: number): ColorFn {
  return (text) => applyAnsi256(text, code);
}

/**
 * Apply ANSI 256 background color
 *
 * @example
 * bgAnsi256(21)('Blue background')
 */
export function bgAnsi256(code: number): ColorFn {
  return (text) => applyBgAnsi256(text, code);
}

// =============================================================================
// Composition
// =============================================================================

/**
 * Compose multiple color functions
 *
 * @example
 * const error = compose(red, bold)
 * console.log(error('Critical failure!'))
 *
 * const highlight = compose(bgYellow, black, bold)
 * console.log(highlight('Important'))
 */
export function compose(...fns: ColorFn[]): ColorFn {
  return (text) => fns.reduce((acc, fn) => fn(acc), text);
}

/**
 * Create a styled string by applying multiple styles
 * Alternative syntax for compose
 *
 * @example
 * styled('Error!', red, bold)
 */
export function styled(text: string, ...fns: ColorFn[]): string {
  return compose(...fns)(text);
}

// =============================================================================
// Chainable API
// =============================================================================

type ColorChain = ColorFn & {
  // Foreground colors
  black: ColorChain;
  red: ColorChain;
  green: ColorChain;
  yellow: ColorChain;
  blue: ColorChain;
  magenta: ColorChain;
  cyan: ColorChain;
  white: ColorChain;
  gray: ColorChain;
  grey: ColorChain;
  blackBright: ColorChain;
  redBright: ColorChain;
  greenBright: ColorChain;
  yellowBright: ColorChain;
  blueBright: ColorChain;
  magentaBright: ColorChain;
  cyanBright: ColorChain;
  whiteBright: ColorChain;

  // Background colors
  bgBlack: ColorChain;
  bgRed: ColorChain;
  bgGreen: ColorChain;
  bgYellow: ColorChain;
  bgBlue: ColorChain;
  bgMagenta: ColorChain;
  bgCyan: ColorChain;
  bgWhite: ColorChain;
  bgGray: ColorChain;
  bgGrey: ColorChain;
  bgBlackBright: ColorChain;
  bgRedBright: ColorChain;
  bgGreenBright: ColorChain;
  bgYellowBright: ColorChain;
  bgBlueBright: ColorChain;
  bgMagentaBright: ColorChain;
  bgCyanBright: ColorChain;
  bgWhiteBright: ColorChain;

  // Modifiers
  reset: ColorChain;
  bold: ColorChain;
  dim: ColorChain;
  italic: ColorChain;
  underline: ColorChain;
  overline: ColorChain;
  inverse: ColorChain;
  hidden: ColorChain;
  strikethrough: ColorChain;

  // RGB/Hex/256 methods
  rgb(r: number, g: number, b: number): ColorChain;
  bgRgb(r: number, g: number, b: number): ColorChain;
  hex(color: string): ColorChain;
  bgHex(color: string): ColorChain;
  ansi256(code: number): ColorChain;
  bgAnsi256(code: number): ColorChain;
};

// All chainable properties
const CHAIN_PROPS = [
  // Foreground
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'gray', 'grey', 'blackBright', 'redBright', 'greenBright', 'yellowBright',
  'blueBright', 'magentaBright', 'cyanBright', 'whiteBright',
  // Background
  'bgBlack', 'bgRed', 'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan',
  'bgWhite', 'bgGray', 'bgGrey', 'bgBlackBright', 'bgRedBright', 'bgGreenBright',
  'bgYellowBright', 'bgBlueBright', 'bgMagentaBright', 'bgCyanBright', 'bgWhiteBright',
  // Modifiers
  'reset', 'bold', 'dim', 'italic', 'underline', 'overline', 'inverse',
  'hidden', 'strikethrough',
] as const;

// Simple color functions map
const COLOR_FNS: Record<string, ColorFn> = {
  // Foreground
  black, red, green, yellow, blue, magenta, cyan, white,
  gray, grey, blackBright, redBright, greenBright, yellowBright,
  blueBright, magentaBright, cyanBright, whiteBright,
  // Background
  bgBlack, bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan,
  bgWhite, bgGray, bgGrey, bgBlackBright, bgRedBright, bgGreenBright,
  bgYellowBright, bgBlueBright, bgMagentaBright, bgCyanBright, bgWhiteBright,
  // Modifiers
  reset, bold, dim, italic, underline, overline, inverse,
  hidden, strikethrough,
};

/**
 * Create a chainable color instance
 */
function createChain(styles: ColorFn[] = []): ColorChain {
  // The function itself applies all accumulated styles
  const chain = ((text: string) => {
    return styles.reduce((acc, fn) => fn(acc), text);
  }) as ColorChain;

  // Add all chainable properties
  for (const prop of CHAIN_PROPS) {
    Object.defineProperty(chain, prop, {
      get() {
        return createChain([...styles, COLOR_FNS[prop]]);
      },
      enumerable: true,
    });
  }

  // Add RGB/Hex/256 methods
  chain.rgb = (r: number, g: number, b: number) =>
    createChain([...styles, rgb(r, g, b)]);

  chain.bgRgb = (r: number, g: number, b: number) =>
    createChain([...styles, bgRgb(r, g, b)]);

  chain.hex = (color: string) =>
    createChain([...styles, hex(color)]);

  chain.bgHex = (color: string) =>
    createChain([...styles, bgHex(color)]);

  chain.ansi256 = (code: number) =>
    createChain([...styles, ansi256(code)]);

  chain.bgAnsi256 = (code: number) =>
    createChain([...styles, bgAnsi256(code)]);

  return chain;
}

/**
 * Chainable color API
 *
 * @example
 * c.red('Error!')
 * c.red.bold('Critical!')
 * c.bgBlue.white.bold('Info')
 * c.hex('#ff6600')('Orange')
 * c.rgb(255, 100, 50).bold('Custom')
 */
export const c = createChain();

// =============================================================================
// Strip ANSI (utility)
// =============================================================================

const ANSI_REGEX = /\u001B\[[0-9;]*m/g;

/**
 * Strip all ANSI escape codes from text
 *
 * @example
 * stripAnsi(red('Hello')) // 'Hello'
 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '');
}

// =============================================================================
// Visibility Detection
// =============================================================================

/**
 * Check if text contains ANSI escape codes
 */
export function hasAnsi(text: string): boolean {
  return ANSI_REGEX.test(text);
}

/**
 * Get visible length of text (without ANSI codes)
 */
export function visibleLength(text: string): number {
  return stripAnsi(text).length;
}

// =============================================================================
// Convenience Aliases
// =============================================================================

/** Alias for strikethrough */
export const strike = strikethrough;

/** Success color (green) */
export const success = green;

/** Error color (red) */
export const error = red;

/** Warning color (yellow) */
export const warning = yellow;

/** Info color (cyan) */
export const info = cyan;

/** Muted color (gray) */
export const muted = gray;

/** Primary color (blue) */
export const primary = blue;

/** Secondary color (magenta) */
export const secondary = magenta;

// =============================================================================
// Color Detection
// =============================================================================

/**
 * Check if the terminal supports colors
 */
export function supportsColor(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.FORCE_COLOR === '0') return false;

  if (process.env.FORCE_COLOR !== undefined) return true;
  if (process.env.COLORTERM === 'truecolor') return true;
  if (process.env.COLORTERM === '24bit') return true;

  if (process.stdout && typeof process.stdout.isTTY === 'boolean') {
    return process.stdout.isTTY;
  }

  if (process.env.CI) {
    return ['TRAVIS', 'CIRCLECI', 'GITHUB_ACTIONS', 'GITLAB_CI', 'BUILDKITE']
      .some(ci => process.env[ci] !== undefined);
  }

  return false;
}

/**
 * Check if the terminal supports true color (24-bit)
 */
export function supportsTrueColor(): boolean {
  if (process.env.COLORTERM === 'truecolor') return true;
  if (process.env.COLORTERM === '24bit') return true;

  const term = process.env.TERM || '';
  return term.includes('24bit') || term.includes('truecolor');
}

// =============================================================================
// Color Support Level
// =============================================================================

export type ColorLevel = 0 | 1 | 2 | 3;

/**
 * Get the color support level
 * - 0: No color support
 * - 1: Basic 16 colors
 * - 2: ANSI 256 colors
 * - 3: True color (16 million)
 */
export function getColorLevel(): ColorLevel {
  if (!supportsColor()) return 0;
  if (supportsTrueColor()) return 3;

  const term = process.env.TERM || '';
  if (term.includes('256color')) return 2;

  return 1;
}

// =============================================================================
// Template Literal Support
// =============================================================================

/**
 * Tagged template literal for colored strings
 *
 * @example
 * console.log(tpl`{red Error:} Something went wrong`)
 * console.log(tpl`{bold.underline Important} message`)
 * console.log(tpl`{hex('#ff6600') Orange text}`)
 */
export function tpl(strings: TemplateStringsArray, ...values: unknown[]): string {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += String(values[i]) + strings[i + 1];
  }

  // Parse {style text} patterns
  return result.replace(/\{(\S+)\s+([^}]+)\}/g, (_, style: string, text: string) => {
    const styleNames = style.split('.');
    let fn: ColorFn = (t) => t;

    for (const s of styleNames) {
      // Check for function calls like hex('#fff') or rgb(255,0,0)
      const hexMatch = s.match(/^hex\(['"]?([^'"]+)['"]?\)$/);
      if (hexMatch) {
        fn = compose(fn, hex(hexMatch[1]));
        continue;
      }

      const rgbMatch = s.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (rgbMatch) {
        fn = compose(fn, rgb(+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]));
        continue;
      }

      // Regular style name
      const styleFn = COLOR_FNS[s];
      if (styleFn) {
        fn = compose(fn, styleFn);
      }
    }

    return fn(text);
  });
}
