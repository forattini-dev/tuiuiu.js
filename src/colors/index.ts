/**
 * Colors Module - Terminal ANSI colors API
 *
 * Zero-dependency module for styling terminal text.
 * Integrates with tuiuiu.js themes for semantic colors.
 *
 * @module colors
 *
 * @example
 * // Import specific functions
 * import { red, bold, compose, c } from 'tuiuiu.js/colors'
 *
 * // Simple usage
 * console.log(red('Error!'))
 * console.log(bold('Important'))
 *
 * // Composition
 * console.log(compose(red, bold)('Critical!'))
 *
 * // Chainable
 * console.log(c.red.bold('Error!'))
 * console.log(c.bgBlue.white('Info'))
 *
 * // With theme integration
 * import { theme } from 'tuiuiu.js/colors'
 * console.log(theme.primary('Action'))
 * console.log(theme.success('Done!'))
 */

// Re-export all functions
export {
  // Types
  type ColorFn,
  type ColorLevel,

  // Foreground colors
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  grey,
  blackBright,
  redBright,
  greenBright,
  yellowBright,
  blueBright,
  magentaBright,
  cyanBright,
  whiteBright,

  // Background colors
  bgBlack,
  bgRed,
  bgGreen,
  bgYellow,
  bgBlue,
  bgMagenta,
  bgCyan,
  bgWhite,
  bgGray,
  bgGrey,
  bgBlackBright,
  bgRedBright,
  bgGreenBright,
  bgYellowBright,
  bgBlueBright,
  bgMagentaBright,
  bgCyanBright,
  bgWhiteBright,

  // Modifiers
  reset,
  bold,
  dim,
  italic,
  underline,
  overline,
  inverse,
  hidden,
  strikethrough,
  strike,

  // RGB/Hex/256
  rgb,
  bgRgb,
  hex,
  bgHex,
  ansi256,
  bgAnsi256,

  // Composition
  compose,
  styled,

  // Chainable API
  c,

  // Utilities
  stripAnsi,
  hasAnsi,
  visibleLength,

  // Semantic aliases
  success,
  error,
  warning,
  info,
  muted,
  primary,
  secondary,

  // Color detection
  supportsColor,
  supportsTrueColor,
  getColorLevel,

  // Template literal
  tpl,
} from './ansi.js';

// =============================================================================
// Theme Integration
// =============================================================================

import { resolveColor } from '../core/theme.js';
import { hex as hexFn, type ColorFn, compose, bold as boldFn } from './ansi.js';

/**
 * Create a color function from the current theme
 */
function createThemeColor(semantic: string): ColorFn {
  return (text: string) => {
    const color = resolveColor(semantic);
    return hexFn(color)(text);
  };
}

/**
 * Theme-aware color functions
 * Uses the current tuiuiu theme's semantic colors
 *
 * @example
 * import { theme } from 'tuiuiu.js/colors'
 *
 * console.log(theme.primary('Click here'))
 * console.log(theme.success('Operation complete'))
 * console.log(theme.error('Something went wrong'))
 */
export const theme = {
  /** Primary action color */
  get primary(): ColorFn {
    return createThemeColor('primary');
  },

  /** Secondary color */
  get secondary(): ColorFn {
    return createThemeColor('secondary');
  },

  /** Success/positive color */
  get success(): ColorFn {
    return createThemeColor('success');
  },

  /** Warning/caution color */
  get warning(): ColorFn {
    return createThemeColor('warning');
  },

  /** Error/danger color */
  get error(): ColorFn {
    return createThemeColor('error');
  },

  /** Info/informational color */
  get info(): ColorFn {
    return createThemeColor('info');
  },

  /** Muted/de-emphasized color */
  get muted(): ColorFn {
    return createThemeColor('muted');
  },

  /** Default foreground color */
  get foreground(): ColorFn {
    return createThemeColor('foreground');
  },

  /** Accent color */
  get accent(): ColorFn {
    return createThemeColor('accent');
  },

  /** Bold primary */
  get primaryBold(): ColorFn {
    return compose(createThemeColor('primary'), boldFn);
  },

  /** Bold success */
  get successBold(): ColorFn {
    return compose(createThemeColor('success'), boldFn);
  },

  /** Bold error */
  get errorBold(): ColorFn {
    return compose(createThemeColor('error'), boldFn);
  },

  /** Bold warning */
  get warningBold(): ColorFn {
    return compose(createThemeColor('warning'), boldFn);
  },

  /** Bold info */
  get infoBold(): ColorFn {
    return compose(createThemeColor('info'), boldFn);
  },
};

// =============================================================================
// Tailwind Color Integration
// =============================================================================

import { colors as tailwindColors, type ColorShade } from '../core/colors.js';

/**
 * Tailwind palette color functions
 */
type TailwindColorFns = {
  [K in keyof typeof tailwindColors]: typeof tailwindColors[K] extends string
    ? ColorFn
    : { [S in ColorShade]: ColorFn };
};

function createTailwindProxy(): TailwindColorFns {
  return new Proxy({} as TailwindColorFns, {
    get(_, colorName: string) {
      const palette = tailwindColors[colorName as keyof typeof tailwindColors];

      if (!palette) {
        return (text: string) => text;
      }

      // Base colors (white, black, transparent)
      if (typeof palette === 'string') {
        if (palette === 'transparent') {
          return (text: string) => text;
        }
        return hexFn(palette);
      }

      // Color palette with shades
      return new Proxy({} as { [S in ColorShade]: ColorFn }, {
        get(_, shade: string) {
          const shadeNum = parseInt(shade, 10) as ColorShade;
          const color = (palette as Record<ColorShade, string>)[shadeNum];
          if (!color) return (text: string) => text;
          return hexFn(color);
        },
      });
    },
  });
}

/**
 * Tailwind-palette color functions
 *
 * @example
 * import { tw } from 'tuiuiu.js/colors'
 *
 * console.log(tw.blue[500]('Blue-500'))
 * console.log(tw.red[600]('Red-600'))
 */
export const tw = createTailwindProxy();

// =============================================================================
// Pre-composed Common Styles
// =============================================================================

import {
  compose as composeFn,
  red as redFn,
  green as greenFn,
  yellow as yellowFn,
  blue as blueFn,
  cyan as cyanFn,
  magenta as magentaFn,
  gray as grayFn,
  bold as boldChalk,
  dim as dimFn,
  underline as underlineFn,
  bgRed as bgRedFn,
  bgYellow as bgYellowFn,
  bgGreen as bgGreenFn,
  white as whiteFn,
  black as blackFn,
} from './ansi.js';

/**
 * Pre-composed styles for common use cases
 *
 * @example
 * import { styles } from 'tuiuiu.js/colors'
 *
 * console.log(styles.errorBold('Error!'))
 * console.log(styles.link('https://example.com'))
 */
export const styles = {
  // Error variations
  errorBold: composeFn(redFn, boldChalk),
  errorDim: composeFn(redFn, dimFn),

  // Success variations
  successBold: composeFn(greenFn, boldChalk),
  successDim: composeFn(greenFn, dimFn),

  // Warning variations
  warningBold: composeFn(yellowFn, boldChalk),
  warningDim: composeFn(yellowFn, dimFn),

  // Info variations
  infoBold: composeFn(cyanFn, boldChalk),
  infoDim: composeFn(cyanFn, dimFn),

  // Primary variations
  primaryBold: composeFn(blueFn, boldChalk),
  primaryDim: composeFn(blueFn, dimFn),

  // Muted variations
  mutedBold: composeFn(grayFn, boldChalk),

  // Links
  link: composeFn(cyanFn, underlineFn),
  linkBold: composeFn(cyanFn, underlineFn, boldChalk),

  // Highlights
  highlight: composeFn(bgYellowFn, blackFn),
  highlightError: composeFn(bgRedFn, whiteFn, boldChalk),
  highlightSuccess: composeFn(bgGreenFn, blackFn, boldChalk),

  // Code/monospace-like
  code: composeFn(magentaFn),
  codeBold: composeFn(magentaFn, boldChalk),

  // Headers
  h1: composeFn(boldChalk, underlineFn),
  h2: boldChalk,
  h3: composeFn(boldChalk, dimFn),
};
