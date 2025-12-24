/**
 * Nord Theme
 *
 * Arctic, bluish theme inspired by the nordics.
 */

import { defineTheme } from '../core/theme-loader.js';
import * as colors from '../core/colors.js';

// =============================================================================
// Nord Colors
// =============================================================================

const nord = {
  // Polar Night (dark backgrounds)
  nord0: '#2E3440',
  nord1: '#3B4252',
  nord2: '#434C5E',
  nord3: '#4C566A',
  // Snow Storm (light text)
  nord4: '#D8DEE9',
  nord5: '#E5E9F0',
  nord6: '#ECEFF4',
  // Frost (blue accents)
  nord7: '#8FBCBB',
  nord8: '#88C0D0',
  nord9: '#81A1C1',
  nord10: '#5E81AC',
  // Aurora (status colors)
  nord11: '#BF616A', // red
  nord12: '#D08770', // orange
  nord13: '#EBCB8B', // yellow
  nord14: '#A3BE8C', // green
  nord15: '#B48EAD', // purple
};

// =============================================================================
// Palette
// =============================================================================

const palette = {
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: nord.nord8,
    400: nord.nord8,
    500: nord.nord8,
    600: nord.nord9,
    700: nord.nord10,
    800: '#1E40AF',
    900: '#1E3A8A',
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
    400: nord.nord14,
    500: nord.nord14,
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: nord.nord13,
    400: nord.nord13,
    500: nord.nord13,
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
    400: nord.nord11,
    500: nord.nord11,
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  neutral: {
    50: nord.nord6,
    100: nord.nord5,
    200: nord.nord4,
    300: '#A3ADB8',
    400: '#7A8694',
    500: nord.nord3,
    600: nord.nord2,
    700: nord.nord1,
    800: nord.nord0,
    900: '#242933',
  },
};

// =============================================================================
// Theme Definition
// =============================================================================

export const nordTheme = defineTheme({
  name: 'nord',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Arctic, bluish theme inspired by the nordics',
  },

  palette,

  background: {
    lowest: '#242933',
    base: nord.nord0,
    subtle: nord.nord1,
    surface: nord.nord2,
    raised: nord.nord3,
    elevated: '#5E6779',
    popover: nord.nord1,
    overlay: 'rgba(0, 0, 0, 0.6)',
  },

  foreground: {
    primary: nord.nord6,
    secondary: nord.nord5,
    muted: nord.nord4,
    disabled: nord.nord3,
    inverse: {
      base: nord.nord0,
      soft: 'rgba(46, 52, 64, 0.8)',
      subtle: 'rgba(46, 52, 64, 0.6)',
    },
  },

  accents: {
    positive: nord.nord14,
    warning: nord.nord13,
    critical: nord.nord11,
    info: nord.nord9,
    highlight: nord.nord8,
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
      border: nord.nord8,
      ring: {
        color: nord.nord8,
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: nord.nord1,
      fg: nord.nord3,
    },
    selected: {
      bg: nord.nord1,
      fg: nord.nord6,
    },
  },

  borders: {
    default: nord.nord3,
    subtle: nord.nord1,
    strong: nord.nord4,
    accent: nord.nord8,
    danger: nord.nord11,
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
        bg: nord.nord8,
        fg: nord.nord0,
        hoverBg: '#9CD0DF',
        activeBg: '#6FAFBF',
        border: 'transparent',
      },
      secondary: {
        bg: nord.nord2,
        fg: nord.nord6,
        hoverBg: nord.nord3,
        activeBg: nord.nord1,
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: nord.nord8,
        hoverBg: 'rgba(136, 192, 208, 0.1)',
        activeBg: 'rgba(136, 192, 208, 0.2)',
        border: nord.nord8,
      },
      ghost: {
        bg: 'transparent',
        fg: nord.nord6,
        hoverBg: 'rgba(255, 255, 255, 0.08)',
        activeBg: 'rgba(255, 255, 255, 0.15)',
        border: 'transparent',
      },
    },

    panel: {
      bg: nord.nord1,
      headerBg: nord.nord2,
      footerBg: nord.nord2,
      border: nord.nord3,
    },

    menu: {
      bg: nord.nord1,
      border: nord.nord3,
      item: {
        fg: nord.nord6,
        hoverBg: nord.nord2,
        activeBg: nord.nord3,
        selectedBg: nord.nord2,
        disabledFg: nord.nord3,
      },
    },

    tabs: {
      bg: nord.nord1,
      border: nord.nord3,
      tab: {
        fg: nord.nord4,
        activeFg: nord.nord6,
        activeBg: nord.nord0,
        hoverFg: nord.nord5,
        indicator: nord.nord8,
      },
    },

    dropdown: {
      bg: nord.nord1,
      border: nord.nord3,
      item: {
        fg: nord.nord6,
        hoverBg: nord.nord2,
        selectedBg: nord.nord3,
      },
    },

    input: {
      bg: nord.nord1,
      fg: nord.nord6,
      placeholder: nord.nord4,
      border: nord.nord3,
      focusBorder: nord.nord8,
      invalidBorder: nord.nord11,
    },

    checkbox: {
      bg: nord.nord1,
      border: nord.nord3,
      checkColor: nord.nord0,
      checkedBg: nord.nord8,
    },

    radio: {
      bg: nord.nord1,
      dotColor: nord.nord8,
      border: nord.nord3,
      checkedBorder: nord.nord8,
    },

    tooltip: {
      bg: nord.nord2,
      fg: nord.nord6,
    },

    modal: {
      bg: nord.nord1,
      border: nord.nord3,
      overlay: 'rgba(0, 0, 0, 0.6)',
    },

    badge: {
      default: {
        bg: nord.nord3,
        fg: nord.nord6,
      },
      success: {
        bg: nord.nord14,
        fg: nord.nord0,
      },
      warning: {
        bg: nord.nord13,
        fg: nord.nord0,
      },
      danger: {
        bg: nord.nord11,
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: nord.nord1,
        selectedBg: nord.nord2,
        fg: nord.nord6,
      },
    },

    header: {
      default: {
        bg: nord.nord1,
        fg: nord.nord6,
        titleFg: nord.nord6,
        subtitleFg: nord.nord4,
        border: nord.nord3,
      },
      primary: {
        bg: nord.nord8,
        fg: nord.nord0,
        titleFg: nord.nord0,
        subtitleFg: 'rgba(46, 52, 64, 0.8)',
        border: nord.nord9,
      },
      secondary: {
        bg: nord.nord2,
        fg: nord.nord6,
        titleFg: nord.nord6,
        subtitleFg: nord.nord4,
        border: nord.nord3,
      },
      success: {
        bg: nord.nord14,
        fg: nord.nord0,
        titleFg: nord.nord0,
        subtitleFg: 'rgba(46, 52, 64, 0.8)',
        border: '#16A34A',
      },
      warning: {
        bg: nord.nord13,
        fg: nord.nord0,
        titleFg: nord.nord0,
        subtitleFg: 'rgba(46, 52, 64, 0.7)',
        border: nord.nord12,
      },
      danger: {
        bg: nord.nord11,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: '#DC2626',
      },
    },

    statusbar: {
      default: {
        bg: nord.nord1,
        fg: nord.nord4,
      },
      primary: {
        bg: nord.nord8,
        fg: nord.nord0,
      },
      info: {
        bg: nord.nord9,
        fg: '#ffffff',
      },
      success: {
        bg: nord.nord14,
        fg: nord.nord0,
      },
      warning: {
        bg: nord.nord13,
        fg: nord.nord0,
      },
      danger: {
        bg: nord.nord11,
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: nord.nord0,
        titleFg: nord.nord6,
        subtitleFg: nord.nord4,
        border: nord.nord3,
      },
      primary: {
        bg: nord.nord0,
        titleFg: nord.nord8,
        subtitleFg: nord.nord4,
        border: nord.nord8,
      },
      secondary: {
        bg: nord.nord0,
        titleFg: nord.nord5,
        subtitleFg: nord.nord4,
        border: nord.nord1,
      },
    },

    appshell: {
      bg: '#242933',
      dividerFg: nord.nord3,
      sidebarBg: nord.nord0,
      asideBg: nord.nord0,
    },

    collapsible: {
      default: {
        headerBg: nord.nord1,
        headerFg: nord.nord6,
        contentBg: nord.nord0,
        border: nord.nord3,
        iconFg: nord.nord4,
      },
      primary: {
        headerBg: nord.nord2,
        headerFg: nord.nord8,
        contentBg: nord.nord0,
        border: nord.nord8,
        iconFg: nord.nord8,
      },
      secondary: {
        headerBg: nord.nord2,
        headerFg: nord.nord6,
        contentBg: nord.nord1,
        border: nord.nord3,
        iconFg: nord.nord4,
      },
    },

    commandPalette: {
      bg: nord.nord1,
      border: nord.nord3,
      inputBg: nord.nord0,
      inputFg: nord.nord6,
      inputPlaceholder: nord.nord4,
      itemFg: nord.nord6,
      itemHoverBg: nord.nord2,
      itemSelectedBg: nord.nord3,
      itemSelectedFg: nord.nord6,
      highlightFg: nord.nord8,
      categoryFg: nord.nord4,
    },

    splitPanel: {
      bg: nord.nord0,
      dividerBg: nord.nord3,
      dividerHoverBg: nord.nord2,
      dividerActiveBg: nord.nord8,
      border: nord.nord3,
      titleFg: nord.nord4,
    },
    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: nord.nord14,
        iconFg: nord.nord14,
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: nord.nord11,
        iconFg: nord.nord11,
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: nord.nord13,
        iconFg: nord.nord13,
      },
      info: {
        bg: '#0C4A6E',
        fg: '#E0F2FE',
        border: nord.nord9,
        iconFg: nord.nord9,
      },
    },
    window: {
      default: {
        bg: nord.nord0,
        fg: nord.nord6,
        titleBarBg: nord.nord1,
        titleBarFg: nord.nord6,
        border: nord.nord3,
        buttonFg: nord.nord4,
        closeFg: nord.nord11,
      },
      primary: {
        bg: nord.nord0,
        fg: nord.nord6,
        titleBarBg: nord.nord8,
        titleBarFg: nord.nord0,
        border: nord.nord9,
        buttonFg: 'rgba(46, 52, 64, 0.8)',
        closeFg: nord.nord0,
      },
      success: {
        bg: nord.nord0,
        fg: nord.nord6,
        titleBarBg: nord.nord14,
        titleBarFg: nord.nord0,
        border: '#16A34A',
        buttonFg: 'rgba(46, 52, 64, 0.8)',
        closeFg: nord.nord0,
      },
      warning: {
        bg: nord.nord0,
        fg: nord.nord6,
        titleBarBg: nord.nord13,
        titleBarFg: nord.nord0,
        border: nord.nord12,
        buttonFg: 'rgba(46, 52, 64, 0.8)',
        closeFg: nord.nord0,
      },
      danger: {
        bg: nord.nord0,
        fg: nord.nord6,
        titleBarBg: nord.nord11,
        titleBarFg: '#ffffff',
        border: '#DC2626',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default nordTheme;
