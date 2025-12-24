/**
 * Tokyo Night Theme
 *
 * Modern VSCode theme with vibrant colors inspired by Tokyo nights.
 */

import { defineTheme } from '../core/theme-loader.js';
import * as colors from '../core/colors.js';

// =============================================================================
// Tokyo Night Colors
// =============================================================================

const tokyo = {
  // Backgrounds
  bg: '#1A1B26',
  bgDark: '#16161E',
  bgHighlight: '#24283B',
  bgPopup: '#2F3549',
  // Foregrounds
  fg: '#A9B1D6',
  fgDark: '#9AA5CE',
  // Accents
  blue: '#7AA2F7',
  cyan: '#7DCFFF',
  green: '#9ECE6A',
  magenta: '#BB9AF7',
  orange: '#FF9E64',
  purple: '#9D7CD8',
  red: '#F7768E',
  teal: '#73DACA',
  yellow: '#E0AF68',
  // Dim colors
  comment: '#565F89',
  dark3: '#414868',
  dark5: '#737AA2',
};

// =============================================================================
// Palette
// =============================================================================

const palette = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: tokyo.blue,
    500: tokyo.blue,
    600: '#2563EB',
    700: '#1D4ED8',
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
    50: '#F7FEE7',
    100: '#ECFCCB',
    200: '#D9F99D',
    300: '#BEF264',
    400: tokyo.green,
    500: tokyo.green,
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
    400: tokyo.yellow,
    500: tokyo.yellow,
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
    400: tokyo.red,
    500: tokyo.red,
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
};

// =============================================================================
// Theme Definition
// =============================================================================

export const tokyoNightTheme = defineTheme({
  name: 'tokyo-night',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Modern Tokyo Night theme with vibrant colors',
  },

  palette,

  background: {
    lowest: tokyo.bgDark,
    base: tokyo.bg,
    subtle: tokyo.bgHighlight,
    surface: tokyo.bgPopup,
    raised: tokyo.dark3,
    elevated: tokyo.comment,
    popover: tokyo.bgHighlight,
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  foreground: {
    primary: tokyo.fg,
    secondary: tokyo.fgDark,
    muted: tokyo.comment,
    disabled: tokyo.dark3,
    inverse: {
      base: tokyo.bg,
      soft: 'rgba(26, 27, 38, 0.8)',
      subtle: 'rgba(26, 27, 38, 0.6)',
    },
  },

  accents: {
    positive: tokyo.green,
    warning: tokyo.yellow,
    critical: tokyo.red,
    info: tokyo.cyan,
    highlight: tokyo.blue,
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
      border: tokyo.blue,
      ring: {
        color: tokyo.blue,
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: tokyo.bgHighlight,
      fg: tokyo.dark3,
    },
    selected: {
      bg: tokyo.bgHighlight,
      fg: tokyo.fg,
    },
  },

  borders: {
    default: tokyo.dark3,
    subtle: tokyo.bgHighlight,
    strong: tokyo.comment,
    accent: tokyo.blue,
    danger: tokyo.red,
  },

  opacity: {
    disabled: 0.4,
    muted: 0.7,
    overlay: 0.7,
    ghost: 0.2,
  },

  components: {
    button: {
      primary: {
        bg: tokyo.blue,
        fg: tokyo.bg,
        hoverBg: '#8BB3FF',
        activeBg: '#6691E8',
        border: 'transparent',
      },
      secondary: {
        bg: tokyo.bgHighlight,
        fg: tokyo.fg,
        hoverBg: tokyo.bgPopup,
        activeBg: tokyo.dark3,
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: tokyo.blue,
        hoverBg: 'rgba(122, 162, 247, 0.1)',
        activeBg: 'rgba(122, 162, 247, 0.2)',
        border: tokyo.blue,
      },
      ghost: {
        bg: 'transparent',
        fg: tokyo.fg,
        hoverBg: 'rgba(255, 255, 255, 0.08)',
        activeBg: 'rgba(255, 255, 255, 0.15)',
        border: 'transparent',
      },
    },

    panel: {
      bg: tokyo.bgHighlight,
      headerBg: tokyo.bgPopup,
      footerBg: tokyo.bgPopup,
      border: tokyo.dark3,
    },

    menu: {
      bg: tokyo.bgHighlight,
      border: tokyo.dark3,
      item: {
        fg: tokyo.fg,
        hoverBg: tokyo.bgPopup,
        activeBg: tokyo.dark3,
        selectedBg: tokyo.bgPopup,
        disabledFg: tokyo.dark3,
      },
    },

    tabs: {
      bg: tokyo.bgHighlight,
      border: tokyo.dark3,
      tab: {
        fg: tokyo.comment,
        activeFg: tokyo.fg,
        activeBg: tokyo.bg,
        hoverFg: tokyo.fgDark,
        indicator: tokyo.blue,
      },
    },

    dropdown: {
      bg: tokyo.bgHighlight,
      border: tokyo.dark3,
      item: {
        fg: tokyo.fg,
        hoverBg: tokyo.bgPopup,
        selectedBg: tokyo.dark3,
      },
    },

    input: {
      bg: tokyo.bgHighlight,
      fg: tokyo.fg,
      placeholder: tokyo.comment,
      border: tokyo.dark3,
      focusBorder: tokyo.blue,
      invalidBorder: tokyo.red,
    },

    checkbox: {
      bg: tokyo.bgHighlight,
      border: tokyo.dark3,
      checkColor: tokyo.bg,
      checkedBg: tokyo.blue,
    },

    radio: {
      bg: tokyo.bgHighlight,
      dotColor: tokyo.blue,
      border: tokyo.dark3,
      checkedBorder: tokyo.blue,
    },

    tooltip: {
      bg: tokyo.bgPopup,
      fg: tokyo.fg,
    },

    modal: {
      bg: tokyo.bgHighlight,
      border: tokyo.dark3,
      overlay: 'rgba(0, 0, 0, 0.7)',
    },

    badge: {
      default: {
        bg: tokyo.dark3,
        fg: tokyo.fg,
      },
      success: {
        bg: tokyo.green,
        fg: tokyo.bg,
      },
      warning: {
        bg: tokyo.yellow,
        fg: tokyo.bg,
      },
      danger: {
        bg: tokyo.red,
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: tokyo.bgHighlight,
        selectedBg: tokyo.bgPopup,
        fg: tokyo.fg,
      },
    },

    header: {
      default: {
        bg: tokyo.bgHighlight,
        fg: tokyo.fg,
        titleFg: tokyo.fg,
        subtitleFg: tokyo.comment,
        border: tokyo.dark3,
      },
      primary: {
        bg: tokyo.blue,
        fg: tokyo.bg,
        titleFg: tokyo.bg,
        subtitleFg: 'rgba(26, 27, 38, 0.8)',
        border: '#2563EB',
      },
      secondary: {
        bg: tokyo.bgPopup,
        fg: tokyo.fg,
        titleFg: tokyo.fg,
        subtitleFg: tokyo.comment,
        border: tokyo.dark3,
      },
      success: {
        bg: tokyo.green,
        fg: tokyo.bg,
        titleFg: tokyo.bg,
        subtitleFg: 'rgba(26, 27, 38, 0.8)',
        border: '#65A30D',
      },
      warning: {
        bg: tokyo.yellow,
        fg: tokyo.bg,
        titleFg: tokyo.bg,
        subtitleFg: 'rgba(26, 27, 38, 0.7)',
        border: tokyo.orange,
      },
      danger: {
        bg: tokyo.red,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: '#E11D48',
      },
    },

    statusbar: {
      default: {
        bg: tokyo.bgHighlight,
        fg: tokyo.comment,
      },
      primary: {
        bg: tokyo.blue,
        fg: tokyo.bg,
      },
      info: {
        bg: tokyo.cyan,
        fg: tokyo.bg,
      },
      success: {
        bg: tokyo.green,
        fg: tokyo.bg,
      },
      warning: {
        bg: tokyo.yellow,
        fg: tokyo.bg,
      },
      danger: {
        bg: tokyo.red,
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: tokyo.bg,
        titleFg: tokyo.fg,
        subtitleFg: tokyo.comment,
        border: tokyo.dark3,
      },
      primary: {
        bg: tokyo.bg,
        titleFg: tokyo.blue,
        subtitleFg: tokyo.comment,
        border: tokyo.blue,
      },
      secondary: {
        bg: tokyo.bg,
        titleFg: tokyo.fgDark,
        subtitleFg: tokyo.comment,
        border: tokyo.bgHighlight,
      },
    },

    appshell: {
      bg: tokyo.bgDark,
      dividerFg: tokyo.dark3,
      sidebarBg: tokyo.bg,
      asideBg: tokyo.bg,
    },

    collapsible: {
      default: {
        headerBg: tokyo.bgHighlight,
        headerFg: tokyo.fg,
        contentBg: tokyo.bg,
        border: tokyo.dark3,
        iconFg: tokyo.comment,
      },
      primary: {
        headerBg: tokyo.bgPopup,
        headerFg: tokyo.blue,
        contentBg: tokyo.bg,
        border: tokyo.blue,
        iconFg: tokyo.blue,
      },
      secondary: {
        headerBg: tokyo.bgPopup,
        headerFg: tokyo.fg,
        contentBg: tokyo.bgHighlight,
        border: tokyo.dark3,
        iconFg: tokyo.comment,
      },
    },

    commandPalette: {
      bg: tokyo.bgHighlight,
      border: tokyo.dark3,
      inputBg: tokyo.bg,
      inputFg: tokyo.fg,
      inputPlaceholder: tokyo.comment,
      itemFg: tokyo.fg,
      itemHoverBg: tokyo.bgPopup,
      itemSelectedBg: tokyo.dark3,
      itemSelectedFg: tokyo.fg,
      highlightFg: tokyo.blue,
      categoryFg: tokyo.comment,
    },

    splitPanel: {
      bg: tokyo.bg,
      dividerBg: tokyo.dark3,
      dividerHoverBg: tokyo.bgPopup,
      dividerActiveBg: tokyo.blue,
      border: tokyo.dark3,
      titleFg: tokyo.comment,
    },
    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: tokyo.green,
        iconFg: tokyo.green,
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: tokyo.red,
        iconFg: tokyo.red,
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: tokyo.yellow,
        iconFg: tokyo.yellow,
      },
      info: {
        bg: '#0C4A6E',
        fg: '#E0F2FE',
        border: tokyo.cyan,
        iconFg: tokyo.cyan,
      },
    },
    window: {
      default: {
        bg: tokyo.bg,
        fg: tokyo.fg,
        titleBarBg: tokyo.bgHighlight,
        titleBarFg: tokyo.fg,
        border: tokyo.dark3,
        buttonFg: tokyo.comment,
        closeFg: tokyo.red,
      },
      primary: {
        bg: tokyo.bg,
        fg: tokyo.fg,
        titleBarBg: tokyo.blue,
        titleBarFg: tokyo.bg,
        border: '#2563EB',
        buttonFg: 'rgba(26, 27, 38, 0.8)',
        closeFg: tokyo.bg,
      },
      success: {
        bg: tokyo.bg,
        fg: tokyo.fg,
        titleBarBg: tokyo.green,
        titleBarFg: tokyo.bg,
        border: '#65A30D',
        buttonFg: 'rgba(26, 27, 38, 0.8)',
        closeFg: tokyo.bg,
      },
      warning: {
        bg: tokyo.bg,
        fg: tokyo.fg,
        titleBarBg: tokyo.yellow,
        titleBarFg: tokyo.bg,
        border: tokyo.orange,
        buttonFg: 'rgba(26, 27, 38, 0.8)',
        closeFg: tokyo.bg,
      },
      danger: {
        bg: tokyo.bg,
        fg: tokyo.fg,
        titleBarBg: tokyo.red,
        titleBarFg: '#ffffff',
        border: '#E11D48',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default tokyoNightTheme;
