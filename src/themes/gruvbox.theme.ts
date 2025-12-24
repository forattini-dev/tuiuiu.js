/**
 * Gruvbox Theme
 *
 * Warm retro theme with earthy colors.
 */

import { defineTheme } from '../core/theme-loader.js';
import * as colors from '../core/colors.js';

// =============================================================================
// Gruvbox Colors
// =============================================================================

const gruvbox = {
  // Dark backgrounds
  bg0_h: '#1D2021',
  bg0: '#282828',
  bg1: '#3C3836',
  bg2: '#504945',
  bg3: '#665C54',
  bg4: '#7C6F64',
  // Light foregrounds
  fg0: '#FBF1C7',
  fg1: '#EBDBB2',
  fg2: '#D5C4A1',
  fg3: '#BDAE93',
  fg4: '#A89984',
  // Accent colors
  red: '#FB4934',
  green: '#B8BB26',
  yellow: '#FABD2F',
  blue: '#83A598',
  purple: '#D3869B',
  aqua: '#8EC07C',
  orange: '#FE8019',
  gray: '#928374',
};

// =============================================================================
// Palette
// =============================================================================

const palette = {
  primary: {
    50: '#F7FEE7',
    100: '#ECFCCB',
    200: '#D9F99D',
    300: '#BEF264',
    400: gruvbox.green,
    500: gruvbox.green,
    600: '#84CC16',
    700: '#65A30D',
    800: '#4D7C0F',
    900: '#3F6212',
  },
  secondary: {
    50: colors.stone[50],
    100: colors.stone[100],
    200: colors.stone[200],
    300: colors.stone[300],
    400: colors.stone[400],
    500: colors.stone[500],
    600: colors.stone[600],
    700: colors.stone[700],
    800: colors.stone[800],
    900: colors.stone[900],
  },
  success: {
    50: '#F7FEE7',
    100: '#ECFCCB',
    200: '#D9F99D',
    300: '#BEF264',
    400: gruvbox.green,
    500: gruvbox.green,
    600: '#84CC16',
    700: '#65A30D',
    800: '#4D7C0F',
    900: '#3F6212',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: gruvbox.yellow,
    500: gruvbox.yellow,
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
    400: gruvbox.red,
    500: gruvbox.red,
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  neutral: {
    50: gruvbox.fg0,
    100: gruvbox.fg1,
    200: gruvbox.fg2,
    300: gruvbox.fg3,
    400: gruvbox.fg4,
    500: gruvbox.gray,
    600: gruvbox.bg4,
    700: gruvbox.bg3,
    800: gruvbox.bg2,
    900: gruvbox.bg1,
  },
};

// =============================================================================
// Theme Definition
// =============================================================================

export const gruvboxTheme = defineTheme({
  name: 'gruvbox',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Warm retro Gruvbox theme with earthy colors',
  },

  palette,

  background: {
    lowest: gruvbox.bg0_h,
    base: gruvbox.bg0,
    subtle: gruvbox.bg1,
    surface: gruvbox.bg2,
    raised: gruvbox.bg3,
    elevated: gruvbox.bg4,
    popover: gruvbox.bg1,
    overlay: 'rgba(0, 0, 0, 0.65)',
  },

  foreground: {
    primary: gruvbox.fg1,
    secondary: gruvbox.fg2,
    muted: gruvbox.gray,
    disabled: gruvbox.bg3,
    inverse: {
      base: gruvbox.bg0,
      soft: 'rgba(40, 40, 40, 0.8)',
      subtle: 'rgba(40, 40, 40, 0.6)',
    },
  },

  accents: {
    positive: gruvbox.green,
    warning: gruvbox.yellow,
    critical: gruvbox.red,
    info: gruvbox.blue,
    highlight: gruvbox.green,
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
      border: gruvbox.green,
      ring: {
        color: gruvbox.green,
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: gruvbox.bg1,
      fg: gruvbox.bg3,
    },
    selected: {
      bg: gruvbox.bg2,
      fg: gruvbox.fg1,
    },
  },

  borders: {
    default: gruvbox.bg3,
    subtle: gruvbox.bg2,
    strong: gruvbox.gray,
    accent: gruvbox.green,
    danger: gruvbox.red,
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
        bg: gruvbox.green,
        fg: gruvbox.bg0,
        hoverBg: '#C9CC38',
        activeBg: '#A6A91E',
        border: 'transparent',
      },
      secondary: {
        bg: gruvbox.bg2,
        fg: gruvbox.fg1,
        hoverBg: gruvbox.bg3,
        activeBg: gruvbox.bg1,
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: gruvbox.green,
        hoverBg: 'rgba(184, 187, 38, 0.1)',
        activeBg: 'rgba(184, 187, 38, 0.2)',
        border: gruvbox.green,
      },
      ghost: {
        bg: 'transparent',
        fg: gruvbox.fg1,
        hoverBg: 'rgba(255, 255, 255, 0.08)',
        activeBg: 'rgba(255, 255, 255, 0.15)',
        border: 'transparent',
      },
    },

    panel: {
      bg: gruvbox.bg1,
      headerBg: gruvbox.bg2,
      footerBg: gruvbox.bg2,
      border: gruvbox.bg3,
    },

    menu: {
      bg: gruvbox.bg1,
      border: gruvbox.bg3,
      item: {
        fg: gruvbox.fg1,
        hoverBg: gruvbox.bg2,
        activeBg: gruvbox.bg3,
        selectedBg: gruvbox.bg2,
        disabledFg: gruvbox.bg3,
      },
    },

    tabs: {
      bg: gruvbox.bg1,
      border: gruvbox.bg3,
      tab: {
        fg: gruvbox.gray,
        activeFg: gruvbox.fg1,
        activeBg: gruvbox.bg0,
        hoverFg: gruvbox.fg2,
        indicator: gruvbox.green,
      },
    },

    dropdown: {
      bg: gruvbox.bg1,
      border: gruvbox.bg3,
      item: {
        fg: gruvbox.fg1,
        hoverBg: gruvbox.bg2,
        selectedBg: gruvbox.bg3,
      },
    },

    input: {
      bg: gruvbox.bg1,
      fg: gruvbox.fg1,
      placeholder: gruvbox.gray,
      border: gruvbox.bg3,
      focusBorder: gruvbox.green,
      invalidBorder: gruvbox.red,
    },

    checkbox: {
      bg: gruvbox.bg1,
      border: gruvbox.bg3,
      checkColor: gruvbox.bg0,
      checkedBg: gruvbox.green,
    },

    radio: {
      bg: gruvbox.bg1,
      dotColor: gruvbox.green,
      border: gruvbox.bg3,
      checkedBorder: gruvbox.green,
    },

    tooltip: {
      bg: gruvbox.bg2,
      fg: gruvbox.fg1,
    },

    modal: {
      bg: gruvbox.bg1,
      border: gruvbox.bg3,
      overlay: 'rgba(0, 0, 0, 0.65)',
    },

    badge: {
      default: {
        bg: gruvbox.bg3,
        fg: gruvbox.fg1,
      },
      success: {
        bg: gruvbox.green,
        fg: gruvbox.bg0,
      },
      warning: {
        bg: gruvbox.yellow,
        fg: gruvbox.bg0,
      },
      danger: {
        bg: gruvbox.red,
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: gruvbox.bg1,
        selectedBg: gruvbox.bg2,
        fg: gruvbox.fg1,
      },
    },

    header: {
      default: {
        bg: gruvbox.bg1,
        fg: gruvbox.fg1,
        titleFg: gruvbox.fg1,
        subtitleFg: gruvbox.gray,
        border: gruvbox.bg3,
      },
      primary: {
        bg: gruvbox.green,
        fg: gruvbox.bg0,
        titleFg: gruvbox.bg0,
        subtitleFg: 'rgba(40, 40, 40, 0.8)',
        border: '#84CC16',
      },
      secondary: {
        bg: gruvbox.bg2,
        fg: gruvbox.fg1,
        titleFg: gruvbox.fg1,
        subtitleFg: gruvbox.gray,
        border: gruvbox.bg3,
      },
      success: {
        bg: gruvbox.green,
        fg: gruvbox.bg0,
        titleFg: gruvbox.bg0,
        subtitleFg: 'rgba(40, 40, 40, 0.8)',
        border: '#84CC16',
      },
      warning: {
        bg: gruvbox.yellow,
        fg: gruvbox.bg0,
        titleFg: gruvbox.bg0,
        subtitleFg: 'rgba(40, 40, 40, 0.7)',
        border: gruvbox.orange,
      },
      danger: {
        bg: gruvbox.red,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: '#DC2626',
      },
    },

    statusbar: {
      default: {
        bg: gruvbox.bg1,
        fg: gruvbox.gray,
      },
      primary: {
        bg: gruvbox.green,
        fg: gruvbox.bg0,
      },
      info: {
        bg: gruvbox.blue,
        fg: gruvbox.bg0,
      },
      success: {
        bg: gruvbox.green,
        fg: gruvbox.bg0,
      },
      warning: {
        bg: gruvbox.yellow,
        fg: gruvbox.bg0,
      },
      danger: {
        bg: gruvbox.red,
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: gruvbox.bg0,
        titleFg: gruvbox.fg1,
        subtitleFg: gruvbox.gray,
        border: gruvbox.bg3,
      },
      primary: {
        bg: gruvbox.bg0,
        titleFg: gruvbox.green,
        subtitleFg: gruvbox.gray,
        border: gruvbox.green,
      },
      secondary: {
        bg: gruvbox.bg0,
        titleFg: gruvbox.fg2,
        subtitleFg: gruvbox.gray,
        border: gruvbox.bg2,
      },
    },

    appshell: {
      bg: gruvbox.bg0_h,
      dividerFg: gruvbox.bg3,
      sidebarBg: gruvbox.bg0,
      asideBg: gruvbox.bg0,
    },

    collapsible: {
      default: {
        headerBg: gruvbox.bg1,
        headerFg: gruvbox.fg1,
        contentBg: gruvbox.bg0,
        border: gruvbox.bg3,
        iconFg: gruvbox.gray,
      },
      primary: {
        headerBg: gruvbox.bg2,
        headerFg: gruvbox.green,
        contentBg: gruvbox.bg0,
        border: gruvbox.green,
        iconFg: gruvbox.green,
      },
      secondary: {
        headerBg: gruvbox.bg2,
        headerFg: gruvbox.fg1,
        contentBg: gruvbox.bg1,
        border: gruvbox.bg3,
        iconFg: gruvbox.gray,
      },
    },

    commandPalette: {
      bg: gruvbox.bg1,
      border: gruvbox.bg3,
      inputBg: gruvbox.bg0,
      inputFg: gruvbox.fg1,
      inputPlaceholder: gruvbox.gray,
      itemFg: gruvbox.fg1,
      itemHoverBg: gruvbox.bg2,
      itemSelectedBg: gruvbox.bg3,
      itemSelectedFg: gruvbox.fg1,
      highlightFg: gruvbox.green,
      categoryFg: gruvbox.gray,
    },

    splitPanel: {
      bg: gruvbox.bg0,
      dividerBg: gruvbox.bg3,
      dividerHoverBg: gruvbox.bg2,
      dividerActiveBg: gruvbox.green,
      border: gruvbox.bg3,
      titleFg: gruvbox.gray,
    },
    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: gruvbox.green,
        iconFg: gruvbox.green,
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: gruvbox.red,
        iconFg: gruvbox.red,
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: gruvbox.yellow,
        iconFg: gruvbox.yellow,
      },
      info: {
        bg: '#0C4A6E',
        fg: '#E0F2FE',
        border: gruvbox.blue,
        iconFg: gruvbox.blue,
      },
    },
    window: {
      default: {
        bg: gruvbox.bg0,
        fg: gruvbox.fg1,
        titleBarBg: gruvbox.bg1,
        titleBarFg: gruvbox.fg1,
        border: gruvbox.bg3,
        buttonFg: gruvbox.gray,
        closeFg: gruvbox.red,
      },
      primary: {
        bg: gruvbox.bg0,
        fg: gruvbox.fg1,
        titleBarBg: gruvbox.green,
        titleBarFg: gruvbox.bg0,
        border: '#84CC16',
        buttonFg: 'rgba(40, 40, 40, 0.8)',
        closeFg: gruvbox.bg0,
      },
      success: {
        bg: gruvbox.bg0,
        fg: gruvbox.fg1,
        titleBarBg: gruvbox.green,
        titleBarFg: gruvbox.bg0,
        border: '#84CC16',
        buttonFg: 'rgba(40, 40, 40, 0.8)',
        closeFg: gruvbox.bg0,
      },
      warning: {
        bg: gruvbox.bg0,
        fg: gruvbox.fg1,
        titleBarBg: gruvbox.yellow,
        titleBarFg: gruvbox.bg0,
        border: gruvbox.orange,
        buttonFg: 'rgba(40, 40, 40, 0.8)',
        closeFg: gruvbox.bg0,
      },
      danger: {
        bg: gruvbox.bg0,
        fg: gruvbox.fg1,
        titleBarBg: gruvbox.red,
        titleBarFg: '#ffffff',
        border: '#DC2626',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default gruvboxTheme;
