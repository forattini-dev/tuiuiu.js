/**
 * Solarized Dark Theme
 *
 * Popular low-contrast dark theme with a blue-tinted background.
 */

import { defineTheme } from '../core/theme-loader.js';
import * as colors from '../core/colors.js';

// =============================================================================
// Solarized Colors
// =============================================================================

const solarized = {
  // Base tones
  base03: '#002B36',
  base02: '#073642',
  base01: '#586E75',
  base00: '#657B83',
  base0: '#839496',
  base1: '#93A1A1',
  base2: '#EEE8D5',
  base3: '#FDF6E3',
  // Accent colors
  yellow: '#B58900',
  orange: '#CB4B16',
  red: '#DC322F',
  magenta: '#D33682',
  violet: '#6C71C4',
  blue: '#268BD2',
  cyan: '#2AA198',
  green: '#859900',
};

// =============================================================================
// Palette
// =============================================================================

const palette = {
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: solarized.blue,
    500: solarized.blue,
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
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
    50: '#F7FEE7',
    100: '#ECFCCB',
    200: '#D9F99D',
    300: '#BEF264',
    400: solarized.green,
    500: solarized.green,
    600: '#65A30D',
    700: '#4D7C0F',
    800: '#3F6212',
    900: '#365314',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: solarized.yellow,
    500: solarized.yellow,
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: solarized.red,
    500: solarized.red,
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  neutral: {
    50: solarized.base3,
    100: solarized.base2,
    200: solarized.base1,
    300: solarized.base0,
    400: solarized.base00,
    500: solarized.base01,
    600: '#4A5A60',
    700: solarized.base02,
    800: solarized.base03,
    900: '#001E26',
  },
};

// =============================================================================
// Theme Definition
// =============================================================================

export const solarizedDarkTheme = defineTheme({
  name: 'solarized-dark',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Popular Solarized dark theme with blue-tinted background',
  },

  palette,

  background: {
    lowest: '#001E26',
    base: solarized.base03,
    subtle: solarized.base02,
    surface: '#094652',
    raised: '#0B5A66',
    elevated: solarized.base01,
    popover: solarized.base02,
    overlay: 'rgba(0, 0, 0, 0.6)',
  },

  foreground: {
    primary: solarized.base0,
    secondary: solarized.base1,
    muted: solarized.base00,
    disabled: solarized.base01,
    inverse: {
      base: solarized.base3,
      soft: 'rgba(253, 246, 227, 0.8)',
      subtle: 'rgba(253, 246, 227, 0.6)',
    },
  },

  accents: {
    positive: solarized.green,
    warning: solarized.yellow,
    critical: solarized.red,
    info: solarized.cyan,
    highlight: solarized.blue,
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
      border: solarized.blue,
      ring: {
        color: solarized.blue,
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: solarized.base02,
      fg: solarized.base01,
    },
    selected: {
      bg: solarized.base02,
      fg: solarized.base1,
    },
  },

  borders: {
    default: solarized.base01,
    subtle: solarized.base02,
    strong: solarized.base0,
    accent: solarized.blue,
    danger: solarized.red,
  },

  opacity: {
    disabled: 0.4,
    muted: 0.7,
    overlay: 0.6,
    ghost: 0.2,
  },

  components: {
    button: {
      primary: {
        bg: solarized.blue,
        fg: solarized.base3,
        hoverBg: '#3A9BE3',
        activeBg: '#1F7ABF',
        border: 'transparent',
      },
      secondary: {
        bg: solarized.base02,
        fg: solarized.base1,
        hoverBg: '#094652',
        activeBg: solarized.base03,
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: solarized.blue,
        hoverBg: 'rgba(38, 139, 210, 0.1)',
        activeBg: 'rgba(38, 139, 210, 0.2)',
        border: solarized.blue,
      },
      ghost: {
        bg: 'transparent',
        fg: solarized.base0,
        hoverBg: 'rgba(255, 255, 255, 0.08)',
        activeBg: 'rgba(255, 255, 255, 0.15)',
        border: 'transparent',
      },
    },

    panel: {
      bg: solarized.base02,
      headerBg: '#094652',
      footerBg: '#094652',
      border: solarized.base01,
    },

    menu: {
      bg: solarized.base02,
      border: solarized.base01,
      item: {
        fg: solarized.base0,
        hoverBg: '#094652',
        activeBg: '#0B5A66',
        selectedBg: '#094652',
        disabledFg: solarized.base01,
      },
    },

    tabs: {
      bg: solarized.base02,
      border: solarized.base01,
      tab: {
        fg: solarized.base00,
        activeFg: solarized.base1,
        activeBg: solarized.base03,
        hoverFg: solarized.base0,
        indicator: solarized.blue,
      },
    },

    dropdown: {
      bg: solarized.base02,
      border: solarized.base01,
      item: {
        fg: solarized.base0,
        hoverBg: '#094652',
        selectedBg: '#0B5A66',
      },
    },

    input: {
      bg: solarized.base02,
      fg: solarized.base0,
      placeholder: solarized.base00,
      border: solarized.base01,
      focusBorder: solarized.blue,
      invalidBorder: solarized.red,
    },

    checkbox: {
      bg: solarized.base02,
      border: solarized.base01,
      checkColor: solarized.base3,
      checkedBg: solarized.blue,
    },

    radio: {
      bg: solarized.base02,
      dotColor: solarized.blue,
      border: solarized.base01,
      checkedBorder: solarized.blue,
    },

    tooltip: {
      bg: '#094652',
      fg: solarized.base1,
    },

    modal: {
      bg: solarized.base02,
      border: solarized.base01,
      overlay: 'rgba(0, 0, 0, 0.6)',
    },

    badge: {
      default: {
        bg: solarized.base01,
        fg: solarized.base1,
      },
      success: {
        bg: solarized.green,
        fg: solarized.base3,
      },
      warning: {
        bg: solarized.yellow,
        fg: solarized.base03,
      },
      danger: {
        bg: solarized.red,
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: solarized.base02,
        selectedBg: '#094652',
        fg: solarized.base0,
      },
    },

    header: {
      default: {
        bg: solarized.base02,
        fg: solarized.base0,
        titleFg: solarized.base1,
        subtitleFg: solarized.base00,
        border: solarized.base01,
      },
      primary: {
        bg: solarized.blue,
        fg: solarized.base3,
        titleFg: solarized.base3,
        subtitleFg: 'rgba(253, 246, 227, 0.8)',
        border: '#0284C7',
      },
      secondary: {
        bg: '#094652',
        fg: solarized.base0,
        titleFg: solarized.base1,
        subtitleFg: solarized.base00,
        border: '#0B5A66',
      },
      success: {
        bg: solarized.green,
        fg: solarized.base3,
        titleFg: solarized.base3,
        subtitleFg: 'rgba(253, 246, 227, 0.8)',
        border: '#65A30D',
      },
      warning: {
        bg: solarized.yellow,
        fg: solarized.base03,
        titleFg: solarized.base03,
        subtitleFg: 'rgba(0, 43, 54, 0.7)',
        border: solarized.orange,
      },
      danger: {
        bg: solarized.red,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: '#DC2626',
      },
    },

    statusbar: {
      default: {
        bg: solarized.base02,
        fg: solarized.base00,
      },
      primary: {
        bg: solarized.blue,
        fg: solarized.base3,
      },
      info: {
        bg: solarized.cyan,
        fg: solarized.base03,
      },
      success: {
        bg: solarized.green,
        fg: solarized.base3,
      },
      warning: {
        bg: solarized.yellow,
        fg: solarized.base03,
      },
      danger: {
        bg: solarized.red,
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: solarized.base03,
        titleFg: solarized.base1,
        subtitleFg: solarized.base00,
        border: solarized.base01,
      },
      primary: {
        bg: solarized.base03,
        titleFg: solarized.blue,
        subtitleFg: solarized.base00,
        border: solarized.blue,
      },
      secondary: {
        bg: solarized.base03,
        titleFg: solarized.base0,
        subtitleFg: solarized.base00,
        border: solarized.base02,
      },
    },

    appshell: {
      bg: '#001E26',
      dividerFg: solarized.base01,
      sidebarBg: solarized.base03,
      asideBg: solarized.base03,
    },

    collapsible: {
      default: {
        headerBg: solarized.base02,
        headerFg: solarized.base1,
        contentBg: solarized.base03,
        border: solarized.base01,
        iconFg: solarized.base00,
      },
      primary: {
        headerBg: '#094652',
        headerFg: solarized.blue,
        contentBg: solarized.base03,
        border: solarized.blue,
        iconFg: solarized.blue,
      },
      secondary: {
        headerBg: '#094652',
        headerFg: solarized.base1,
        contentBg: solarized.base02,
        border: '#0B5A66',
        iconFg: solarized.base00,
      },
    },

    commandPalette: {
      bg: solarized.base02,
      border: solarized.base01,
      inputBg: solarized.base03,
      inputFg: solarized.base0,
      inputPlaceholder: solarized.base00,
      itemFg: solarized.base0,
      itemHoverBg: '#094652',
      itemSelectedBg: '#0B5A66',
      itemSelectedFg: solarized.base1,
      highlightFg: solarized.blue,
      categoryFg: solarized.base00,
    },

    splitPanel: {
      bg: solarized.base03,
      dividerBg: solarized.base01,
      dividerHoverBg: '#094652',
      dividerActiveBg: solarized.blue,
      border: solarized.base01,
      titleFg: solarized.base00,
    },
    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: solarized.green,
        iconFg: solarized.green,
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: solarized.red,
        iconFg: solarized.red,
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: solarized.yellow,
        iconFg: solarized.yellow,
      },
      info: {
        bg: '#0C4A6E',
        fg: '#E0F2FE',
        border: solarized.cyan,
        iconFg: solarized.cyan,
      },
    },
    window: {
      default: {
        bg: solarized.base03,
        fg: solarized.base0,
        titleBarBg: solarized.base02,
        titleBarFg: solarized.base1,
        border: solarized.base01,
        buttonFg: solarized.base00,
        closeFg: solarized.red,
      },
      primary: {
        bg: solarized.base03,
        fg: solarized.base0,
        titleBarBg: solarized.blue,
        titleBarFg: solarized.base3,
        border: '#0284C7',
        buttonFg: 'rgba(253, 246, 227, 0.8)',
        closeFg: solarized.base3,
      },
      success: {
        bg: solarized.base03,
        fg: solarized.base0,
        titleBarBg: solarized.green,
        titleBarFg: solarized.base3,
        border: '#65A30D',
        buttonFg: 'rgba(253, 246, 227, 0.8)',
        closeFg: solarized.base3,
      },
      warning: {
        bg: solarized.base03,
        fg: solarized.base0,
        titleBarBg: solarized.yellow,
        titleBarFg: solarized.base03,
        border: solarized.orange,
        buttonFg: 'rgba(0, 43, 54, 0.8)',
        closeFg: solarized.base03,
      },
      danger: {
        bg: solarized.base03,
        fg: solarized.base0,
        titleBarBg: solarized.red,
        titleBarFg: '#ffffff',
        border: '#DC2626',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default solarizedDarkTheme;
