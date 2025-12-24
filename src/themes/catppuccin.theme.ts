/**
 * Catppuccin Mocha Theme
 *
 * Soothing pastel theme for cozy coding sessions.
 */

import { defineTheme } from '../core/theme-loader.js';
import * as colors from '../core/colors.js';

// =============================================================================
// Catppuccin Mocha Colors
// =============================================================================

const catppuccin = {
  // Base
  base: '#1E1E2E',
  mantle: '#181825',
  crust: '#11111B',
  // Surface
  surface0: '#313244',
  surface1: '#45475A',
  surface2: '#585B70',
  // Overlay
  overlay0: '#6C7086',
  overlay1: '#7F849C',
  overlay2: '#9399B2',
  // Text
  text: '#CDD6F4',
  subtext1: '#BAC2DE',
  subtext0: '#A6ADC8',
  // Accent colors
  rosewater: '#F5E0DC',
  flamingo: '#F2CDCD',
  pink: '#F5C2E7',
  mauve: '#CBA6F7',
  red: '#F38BA8',
  maroon: '#EBA0AC',
  peach: '#FAB387',
  yellow: '#F9E2AF',
  green: '#A6E3A1',
  teal: '#94E2D5',
  sky: '#89DCEB',
  sapphire: '#74C7EC',
  blue: '#89B4FA',
  lavender: '#B4BEFE',
};

// =============================================================================
// Palette
// =============================================================================

const palette = {
  primary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: catppuccin.mauve,
    500: catppuccin.mauve,
    600: '#A78BFA',
    700: '#8B5CF6',
    800: '#7C3AED',
    900: '#6D28D9',
  },
  secondary: {
    50: colors.slate[50],
    100: colors.slate[100],
    200: colors.slate[200],
    300: colors.slate[300],
    400: colors.slate[400],
    500: colors.slate[500],
    600: colors.slate[600],
    700: colors.slate[700],
    800: colors.slate[800],
    900: colors.slate[900],
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: catppuccin.green,
    500: catppuccin.green,
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
    400: catppuccin.yellow,
    500: catppuccin.yellow,
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
    400: catppuccin.red,
    500: catppuccin.red,
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  neutral: {
    50: catppuccin.text,
    100: catppuccin.subtext1,
    200: catppuccin.subtext0,
    300: catppuccin.overlay2,
    400: catppuccin.overlay1,
    500: catppuccin.overlay0,
    600: catppuccin.surface2,
    700: catppuccin.surface1,
    800: catppuccin.surface0,
    900: catppuccin.base,
  },
};

// =============================================================================
// Theme Definition
// =============================================================================

export const catppuccinTheme = defineTheme({
  name: 'catppuccin',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Soothing Catppuccin Mocha pastel theme',
  },

  palette,

  background: {
    lowest: catppuccin.crust,
    base: catppuccin.base,
    subtle: catppuccin.surface0,
    surface: catppuccin.surface1,
    raised: catppuccin.surface2,
    elevated: catppuccin.overlay0,
    popover: catppuccin.surface0,
    overlay: 'rgba(0, 0, 0, 0.65)',
  },

  foreground: {
    primary: catppuccin.text,
    secondary: catppuccin.subtext1,
    muted: catppuccin.overlay0,
    disabled: catppuccin.surface2,
    inverse: {
      base: catppuccin.base,
      soft: 'rgba(30, 30, 46, 0.8)',
      subtle: 'rgba(30, 30, 46, 0.6)',
    },
  },

  accents: {
    positive: catppuccin.green,
    warning: catppuccin.yellow,
    critical: catppuccin.red,
    info: catppuccin.sky,
    highlight: catppuccin.mauve,
  },

  states: {
    hover: {
      bg: 'rgba(255, 255, 255, 0.08)',
      fg: null,
    },
    active: {
      bg: 'rgba(255, 255, 255, 0.15)',
    },
    focus: {
      border: catppuccin.mauve,
      ring: {
        color: catppuccin.mauve,
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: catppuccin.surface0,
      fg: catppuccin.surface2,
    },
    selected: {
      bg: catppuccin.surface0,
      fg: catppuccin.text,
    },
  },

  borders: {
    default: catppuccin.overlay0,
    subtle: catppuccin.surface1,
    strong: catppuccin.subtext1,
    accent: catppuccin.mauve,
    danger: catppuccin.red,
  },

  opacity: {
    disabled: 0.4,
    muted: 0.7,
    overlay: 0.65,
    ghost: 0.2,
  },

  components: {
    button: {
      primary: {
        bg: catppuccin.mauve,
        fg: catppuccin.base,
        hoverBg: '#D9B6FF',
        activeBg: '#B98EE8',
        border: 'transparent',
      },
      secondary: {
        bg: catppuccin.surface0,
        fg: catppuccin.text,
        hoverBg: catppuccin.surface1,
        activeBg: catppuccin.surface2,
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: catppuccin.mauve,
        hoverBg: 'rgba(203, 166, 247, 0.1)',
        activeBg: 'rgba(203, 166, 247, 0.2)',
        border: catppuccin.mauve,
      },
      ghost: {
        bg: 'transparent',
        fg: catppuccin.text,
        hoverBg: 'rgba(255, 255, 255, 0.08)',
        activeBg: 'rgba(255, 255, 255, 0.15)',
        border: 'transparent',
      },
    },

    panel: {
      bg: catppuccin.surface0,
      headerBg: catppuccin.surface1,
      footerBg: catppuccin.surface1,
      border: catppuccin.overlay0,
    },

    menu: {
      bg: catppuccin.surface0,
      border: catppuccin.overlay0,
      item: {
        fg: catppuccin.text,
        hoverBg: catppuccin.surface1,
        activeBg: catppuccin.surface2,
        selectedBg: catppuccin.surface1,
        disabledFg: catppuccin.surface2,
      },
    },

    tabs: {
      bg: catppuccin.surface0,
      border: catppuccin.overlay0,
      tab: {
        fg: catppuccin.overlay0,
        activeFg: catppuccin.text,
        activeBg: catppuccin.base,
        hoverFg: catppuccin.subtext1,
        indicator: catppuccin.mauve,
      },
    },

    dropdown: {
      bg: catppuccin.surface0,
      border: catppuccin.overlay0,
      item: {
        fg: catppuccin.text,
        hoverBg: catppuccin.surface1,
        selectedBg: catppuccin.surface2,
      },
    },

    input: {
      bg: catppuccin.surface0,
      fg: catppuccin.text,
      placeholder: catppuccin.overlay0,
      border: catppuccin.overlay0,
      focusBorder: catppuccin.mauve,
      invalidBorder: catppuccin.red,
    },

    checkbox: {
      bg: catppuccin.surface0,
      border: catppuccin.overlay0,
      checkColor: catppuccin.base,
      checkedBg: catppuccin.mauve,
    },

    radio: {
      bg: catppuccin.surface0,
      dotColor: catppuccin.mauve,
      border: catppuccin.overlay0,
      checkedBorder: catppuccin.mauve,
    },

    tooltip: {
      bg: catppuccin.surface1,
      fg: catppuccin.text,
    },

    modal: {
      bg: catppuccin.surface0,
      border: catppuccin.overlay0,
      overlay: 'rgba(0, 0, 0, 0.65)',
    },

    badge: {
      default: {
        bg: catppuccin.surface2,
        fg: catppuccin.text,
      },
      success: {
        bg: catppuccin.green,
        fg: catppuccin.base,
      },
      warning: {
        bg: catppuccin.yellow,
        fg: catppuccin.base,
      },
      danger: {
        bg: catppuccin.red,
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: catppuccin.surface0,
        selectedBg: catppuccin.surface1,
        fg: catppuccin.text,
      },
    },

    header: {
      default: {
        bg: catppuccin.surface0,
        fg: catppuccin.text,
        titleFg: catppuccin.text,
        subtitleFg: catppuccin.overlay0,
        border: catppuccin.overlay0,
      },
      primary: {
        bg: catppuccin.mauve,
        fg: catppuccin.base,
        titleFg: catppuccin.base,
        subtitleFg: 'rgba(30, 30, 46, 0.8)',
        border: '#A78BFA',
      },
      secondary: {
        bg: catppuccin.surface1,
        fg: catppuccin.text,
        titleFg: catppuccin.text,
        subtitleFg: catppuccin.overlay0,
        border: catppuccin.surface2,
      },
      success: {
        bg: catppuccin.green,
        fg: catppuccin.base,
        titleFg: catppuccin.base,
        subtitleFg: 'rgba(30, 30, 46, 0.8)',
        border: '#16A34A',
      },
      warning: {
        bg: catppuccin.yellow,
        fg: catppuccin.base,
        titleFg: catppuccin.base,
        subtitleFg: 'rgba(30, 30, 46, 0.7)',
        border: catppuccin.peach,
      },
      danger: {
        bg: catppuccin.red,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: '#E11D48',
      },
    },

    statusbar: {
      default: {
        bg: catppuccin.surface0,
        fg: catppuccin.overlay0,
      },
      primary: {
        bg: catppuccin.mauve,
        fg: catppuccin.base,
      },
      info: {
        bg: catppuccin.sky,
        fg: catppuccin.base,
      },
      success: {
        bg: catppuccin.green,
        fg: catppuccin.base,
      },
      warning: {
        bg: catppuccin.yellow,
        fg: catppuccin.base,
      },
      danger: {
        bg: catppuccin.red,
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: catppuccin.base,
        titleFg: catppuccin.text,
        subtitleFg: catppuccin.overlay0,
        border: catppuccin.overlay0,
      },
      primary: {
        bg: catppuccin.base,
        titleFg: catppuccin.mauve,
        subtitleFg: catppuccin.overlay0,
        border: catppuccin.mauve,
      },
      secondary: {
        bg: catppuccin.base,
        titleFg: catppuccin.subtext1,
        subtitleFg: catppuccin.overlay0,
        border: catppuccin.surface0,
      },
    },

    appshell: {
      bg: catppuccin.crust,
      dividerFg: catppuccin.overlay0,
      sidebarBg: catppuccin.base,
      asideBg: catppuccin.base,
    },

    collapsible: {
      default: {
        headerBg: catppuccin.surface0,
        headerFg: catppuccin.text,
        contentBg: catppuccin.base,
        border: catppuccin.overlay0,
        iconFg: catppuccin.overlay0,
      },
      primary: {
        headerBg: catppuccin.surface1,
        headerFg: catppuccin.mauve,
        contentBg: catppuccin.base,
        border: catppuccin.mauve,
        iconFg: catppuccin.mauve,
      },
      secondary: {
        headerBg: catppuccin.surface1,
        headerFg: catppuccin.text,
        contentBg: catppuccin.surface0,
        border: catppuccin.surface2,
        iconFg: catppuccin.overlay0,
      },
    },

    commandPalette: {
      bg: catppuccin.surface0,
      border: catppuccin.overlay0,
      inputBg: catppuccin.base,
      inputFg: catppuccin.text,
      inputPlaceholder: catppuccin.overlay0,
      itemFg: catppuccin.text,
      itemHoverBg: catppuccin.surface1,
      itemSelectedBg: catppuccin.surface2,
      itemSelectedFg: catppuccin.text,
      highlightFg: catppuccin.mauve,
      categoryFg: catppuccin.overlay0,
    },

    splitPanel: {
      bg: catppuccin.base,
      dividerBg: catppuccin.overlay0,
      dividerHoverBg: catppuccin.surface1,
      dividerActiveBg: catppuccin.mauve,
      border: catppuccin.overlay0,
      titleFg: catppuccin.overlay0,
    },
    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: catppuccin.green,
        iconFg: catppuccin.green,
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: catppuccin.red,
        iconFg: catppuccin.red,
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: catppuccin.yellow,
        iconFg: catppuccin.yellow,
      },
      info: {
        bg: '#0C4A6E',
        fg: '#E0F2FE',
        border: catppuccin.sky,
        iconFg: catppuccin.sky,
      },
    },
    window: {
      default: {
        bg: catppuccin.base,
        fg: catppuccin.text,
        titleBarBg: catppuccin.surface0,
        titleBarFg: catppuccin.text,
        border: catppuccin.overlay0,
        buttonFg: catppuccin.overlay0,
        closeFg: catppuccin.red,
      },
      primary: {
        bg: catppuccin.base,
        fg: catppuccin.text,
        titleBarBg: catppuccin.mauve,
        titleBarFg: catppuccin.base,
        border: '#A78BFA',
        buttonFg: 'rgba(30, 30, 46, 0.8)',
        closeFg: catppuccin.base,
      },
      success: {
        bg: catppuccin.base,
        fg: catppuccin.text,
        titleBarBg: catppuccin.green,
        titleBarFg: catppuccin.base,
        border: '#16A34A',
        buttonFg: 'rgba(30, 30, 46, 0.8)',
        closeFg: catppuccin.base,
      },
      warning: {
        bg: catppuccin.base,
        fg: catppuccin.text,
        titleBarBg: catppuccin.yellow,
        titleBarFg: catppuccin.base,
        border: catppuccin.peach,
        buttonFg: 'rgba(30, 30, 46, 0.8)',
        closeFg: catppuccin.base,
      },
      danger: {
        bg: catppuccin.base,
        fg: catppuccin.text,
        titleBarBg: catppuccin.red,
        titleBarFg: '#ffffff',
        border: '#E11D48',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default catppuccinTheme;
