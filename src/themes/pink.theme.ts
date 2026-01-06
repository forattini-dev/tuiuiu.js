/**
 * Pink Theme - Tuiuiu Player Special Edition
 *
 * A beautiful pink/magenta theme with vibrant colors.
 */

import { defineTheme } from '../core/theme-loader.js';
import * as colors from '../core/colors.js';

// =============================================================================
// Pink Colors
// =============================================================================

const pink = {
  background: '#1A0A14',       // Deep dark pink/burgundy
  currentLine: '#2D1422',      // Slightly lighter
  foreground: '#FFF0F5',       // Lavender blush
  comment: '#B86B94',          // Muted pink
  cyan: '#89CFF0',             // Baby blue
  green: '#98FB98',            // Pale green
  orange: '#FFB6C1',           // Light pink
  pink: '#FF69B4',             // Hot pink - main accent!
  purple: '#DDA0DD',           // Plum
  red: '#FF6B6B',              // Coral red
  yellow: '#FFE4B5',           // Moccasin
  magenta: '#FF1493',          // Deep pink
  hotPink: '#FF69B4',          // Hot pink
  fuchsia: '#FF00FF',          // Fuchsia
  rose: '#FF007F',             // Rose
};

// =============================================================================
// Palette
// =============================================================================

const palette = {
  primary: {
    50: '#FFF0F5',
    100: '#FFE4EC',
    200: '#FFC1D6',
    300: '#FF9DBF',
    400: '#FF69B4',
    500: '#FF1493',
    600: '#DB147F',
    700: '#B8106B',
    800: '#940D57',
    900: '#700A43',
  },
  secondary: {
    50: '#FDF4FF',
    100: '#FAE8FF',
    200: '#F5D0FE',
    300: '#F0ABFC',
    400: '#E879F9',
    500: '#D946EF',
    600: '#C026D3',
    700: '#A21CAF',
    800: '#86198F',
    900: '#701A75',
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  danger: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  neutral: {
    50: '#FFF0F5',
    100: '#FFE4EC',
    200: '#E8C4D4',
    300: '#D1A4B4',
    400: '#BA8494',
    500: '#A36474',
    600: '#8C4454',
    700: '#752434',
    800: '#5E0414',
    900: '#470004',
  },
};

// =============================================================================
// Theme Definition
// =============================================================================

export const pinkTheme = defineTheme({
  name: 'pink',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Beautiful pink theme - Tuiuiu Player Special Edition',
  },

  palette,

  background: {
    lowest: '#0D0508',
    base: pink.background,
    subtle: pink.currentLine,
    surface: '#3D1F2E',
    raised: '#4D2940',
    elevated: '#5D3352',
    popover: pink.currentLine,
    overlay: 'rgba(26, 10, 20, 0.85)',
  },

  foreground: {
    primary: pink.foreground,
    secondary: '#FFD6E8',
    muted: pink.comment,
    disabled: '#5D3352',
    inverse: {
      base: pink.background,
      soft: 'rgba(26, 10, 20, 0.8)',
      subtle: 'rgba(26, 10, 20, 0.6)',
    },
  },

  accents: {
    positive: pink.green,
    warning: pink.yellow,
    critical: pink.red,
    info: pink.cyan,
    highlight: pink.hotPink,
  },

  states: {
    hover: {
      bg: 'rgba(255, 105, 180, 0.15)',
      fg: null,
    },
    active: {
      bg: 'rgba(255, 105, 180, 0.25)',
    },
    focus: {
      border: pink.hotPink,
      ring: {
        color: pink.hotPink,
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: pink.currentLine,
      fg: '#5D3352',
    },
    selected: {
      bg: '#4D2940',
      fg: pink.foreground,
    },
  },

  borders: {
    default: pink.comment,
    subtle: pink.currentLine,
    strong: pink.hotPink,
    accent: pink.hotPink,
    danger: pink.red,
  },

  opacity: {
    disabled: 0.4,
    muted: 0.7,
    overlay: 0.85,
    ghost: 0.2,
  },

  components: {
    button: {
      primary: {
        bg: pink.hotPink,
        fg: '#ffffff',
        hoverBg: '#FF85C2',
        activeBg: '#E0529C',
        border: 'transparent',
      },
      secondary: {
        bg: pink.currentLine,
        fg: pink.foreground,
        hoverBg: '#3D1F2E',
        activeBg: '#4D2940',
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: pink.hotPink,
        hoverBg: 'rgba(255, 105, 180, 0.15)',
        activeBg: 'rgba(255, 105, 180, 0.25)',
        border: pink.hotPink,
      },
      ghost: {
        bg: 'transparent',
        fg: pink.foreground,
        hoverBg: 'rgba(255, 255, 255, 0.1)',
        activeBg: 'rgba(255, 255, 255, 0.2)',
        border: 'transparent',
      },
    },

    panel: {
      bg: pink.currentLine,
      headerBg: '#3D1F2E',
      footerBg: '#3D1F2E',
      border: pink.comment,
    },

    menu: {
      bg: pink.currentLine,
      border: pink.comment,
      item: {
        fg: pink.foreground,
        hoverBg: '#3D1F2E',
        activeBg: '#4D2940',
        selectedBg: '#4D2940',
        disabledFg: '#5D3352',
      },
    },

    tabs: {
      bg: pink.currentLine,
      border: pink.comment,
      tab: {
        fg: pink.comment,
        activeFg: pink.foreground,
        activeBg: pink.background,
        hoverFg: '#FFD6E8',
        indicator: pink.hotPink,
      },
    },

    dropdown: {
      bg: pink.currentLine,
      border: pink.comment,
      item: {
        fg: pink.foreground,
        hoverBg: '#3D1F2E',
        selectedBg: '#4D2940',
      },
    },

    input: {
      bg: pink.currentLine,
      fg: pink.foreground,
      placeholder: pink.comment,
      border: pink.comment,
      focusBorder: pink.hotPink,
      invalidBorder: pink.red,
    },

    checkbox: {
      bg: pink.currentLine,
      border: pink.comment,
      checkColor: pink.foreground,
      checkedBg: pink.hotPink,
    },

    radio: {
      bg: pink.currentLine,
      dotColor: pink.hotPink,
      border: pink.comment,
      checkedBorder: pink.hotPink,
    },

    tooltip: {
      bg: '#4D2940',
      fg: pink.foreground,
    },

    modal: {
      bg: pink.currentLine,
      border: pink.comment,
      overlay: 'rgba(26, 10, 20, 0.85)',
    },

    badge: {
      default: {
        bg: pink.comment,
        fg: pink.foreground,
      },
      success: {
        bg: pink.green,
        fg: pink.background,
      },
      warning: {
        bg: pink.yellow,
        fg: pink.background,
      },
      danger: {
        bg: pink.red,
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: pink.currentLine,
        selectedBg: '#4D2940',
        fg: pink.foreground,
      },
    },

    header: {
      default: {
        bg: pink.currentLine,
        fg: pink.foreground,
        titleFg: pink.foreground,
        subtitleFg: pink.comment,
        border: pink.comment,
      },
      primary: {
        bg: pink.hotPink,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.85)',
        border: '#FF85C2',
      },
      secondary: {
        bg: '#4D2940',
        fg: pink.foreground,
        titleFg: pink.foreground,
        subtitleFg: pink.comment,
        border: '#5D3352',
      },
      success: {
        bg: pink.green,
        fg: pink.background,
        titleFg: pink.background,
        subtitleFg: 'rgba(26, 10, 20, 0.8)',
        border: '#16A34A',
      },
      warning: {
        bg: pink.yellow,
        fg: pink.background,
        titleFg: pink.background,
        subtitleFg: 'rgba(26, 10, 20, 0.7)',
        border: pink.orange,
      },
      danger: {
        bg: pink.red,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: '#E11D48',
      },
    },

    statusbar: {
      default: {
        bg: pink.currentLine,
        fg: pink.comment,
      },
      primary: {
        bg: pink.hotPink,
        fg: '#ffffff',
      },
      info: {
        bg: pink.cyan,
        fg: pink.background,
      },
      success: {
        bg: pink.green,
        fg: pink.background,
      },
      warning: {
        bg: pink.yellow,
        fg: pink.background,
      },
      danger: {
        bg: pink.red,
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: pink.background,
        titleFg: pink.foreground,
        subtitleFg: pink.comment,
        border: pink.comment,
      },
      primary: {
        bg: pink.background,
        titleFg: pink.hotPink,
        subtitleFg: pink.comment,
        border: pink.hotPink,
      },
      secondary: {
        bg: pink.background,
        titleFg: '#FFD6E8',
        subtitleFg: pink.comment,
        border: pink.currentLine,
      },
    },

    appshell: {
      bg: '#0D0508',
      dividerFg: pink.comment,
      sidebarBg: pink.background,
      asideBg: pink.background,
    },

    collapsible: {
      default: {
        headerBg: pink.currentLine,
        headerFg: pink.foreground,
        contentBg: pink.background,
        border: pink.comment,
        iconFg: pink.comment,
      },
      primary: {
        headerBg: '#4D2940',
        headerFg: pink.hotPink,
        contentBg: pink.background,
        border: pink.hotPink,
        iconFg: pink.hotPink,
      },
      secondary: {
        headerBg: '#4D2940',
        headerFg: pink.foreground,
        contentBg: pink.currentLine,
        border: '#5D3352',
        iconFg: pink.comment,
      },
    },

    commandPalette: {
      bg: pink.currentLine,
      border: pink.comment,
      inputBg: pink.background,
      inputFg: pink.foreground,
      inputPlaceholder: pink.comment,
      itemFg: pink.foreground,
      itemHoverBg: '#3D1F2E',
      itemSelectedBg: '#4D2940',
      itemSelectedFg: pink.foreground,
      highlightFg: pink.hotPink,
      categoryFg: pink.comment,
    },

    splitPanel: {
      bg: pink.background,
      dividerBg: pink.comment,
      dividerHoverBg: '#4D2940',
      dividerActiveBg: pink.hotPink,
      border: pink.comment,
      titleFg: pink.comment,
    },

    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: pink.green,
        iconFg: pink.green,
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: pink.red,
        iconFg: pink.red,
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: pink.yellow,
        iconFg: pink.yellow,
      },
      info: {
        bg: '#0E4A5C',
        fg: '#CFFAFE',
        border: pink.cyan,
        iconFg: pink.cyan,
      },
    },

    window: {
      default: {
        bg: pink.background,
        fg: pink.foreground,
        titleBarBg: pink.currentLine,
        titleBarFg: pink.foreground,
        border: pink.comment,
        buttonFg: pink.comment,
        closeFg: pink.red,
      },
      primary: {
        bg: pink.background,
        fg: pink.foreground,
        titleBarBg: pink.hotPink,
        titleBarFg: '#ffffff',
        border: '#FF85C2',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
      success: {
        bg: pink.background,
        fg: pink.foreground,
        titleBarBg: pink.green,
        titleBarFg: pink.background,
        border: '#16A34A',
        buttonFg: 'rgba(26, 10, 20, 0.8)',
        closeFg: pink.background,
      },
      warning: {
        bg: pink.background,
        fg: pink.foreground,
        titleBarBg: pink.yellow,
        titleBarFg: pink.background,
        border: pink.orange,
        buttonFg: 'rgba(26, 10, 20, 0.8)',
        closeFg: pink.background,
      },
      danger: {
        bg: pink.background,
        fg: pink.foreground,
        titleBarBg: pink.red,
        titleBarFg: '#ffffff',
        border: '#E11D48',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default pinkTheme;
