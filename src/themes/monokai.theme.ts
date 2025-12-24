/**
 * Monokai Theme
 *
 * Classic code editor theme with warm yellows and greens.
 */

import { defineTheme } from '../core/theme-loader.js';
import * as colors from '../core/colors.js';

// =============================================================================
// Monokai Colors
// =============================================================================

const monokai = {
  background: '#272822',
  backgroundDark: '#1E1F1C',
  backgroundLight: '#3E3D32',
  foreground: '#F8F8F2',
  comment: '#75715E',
  green: '#A6E22E',
  yellow: '#E6DB74',
  pink: '#F92672',
  cyan: '#66D9EF',
  orange: '#FD971F',
  purple: '#AE81FF',
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
    400: '#A6E22E',
    500: '#A6E22E',
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
    400: '#A6E22E',
    500: '#A6E22E',
    600: '#84CC16',
    700: '#65A30D',
    800: '#4D7C0F',
    900: '#3F6212',
  },
  warning: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#E6DB74',
    500: '#E6DB74',
    600: '#CA8A04',
    700: '#A16207',
    800: '#854D0E',
    900: '#713F12',
  },
  danger: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#F92672',
    500: '#F92672',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  neutral: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
};

// =============================================================================
// Theme Definition
// =============================================================================

export const monokaiTheme = defineTheme({
  name: 'monokai',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Classic Monokai code editor theme',
  },

  palette,

  background: {
    lowest: monokai.backgroundDark,
    base: monokai.background,
    subtle: monokai.backgroundLight,
    surface: '#49483E',
    raised: '#5B5A4F',
    elevated: '#6D6C5F',
    popover: monokai.backgroundLight,
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  foreground: {
    primary: monokai.foreground,
    secondary: '#E8E8E2',
    muted: monokai.comment,
    disabled: '#5B5A4F',
    inverse: {
      base: monokai.background,
      soft: 'rgba(39, 40, 34, 0.8)',
      subtle: 'rgba(39, 40, 34, 0.6)',
    },
  },

  accents: {
    positive: monokai.green,
    warning: monokai.yellow,
    critical: monokai.pink,
    info: monokai.cyan,
    highlight: monokai.green,
  },

  states: {
    hover: {
      bg: 'rgba(255, 255, 255, 0.1)',
      fg: null,
    },
    active: {
      bg: 'rgba(255, 255, 255, 0.2)',
    },
    focus: {
      border: monokai.green,
      ring: {
        color: monokai.green,
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: monokai.backgroundLight,
      fg: '#5B5A4F',
    },
    selected: {
      bg: '#49483E',
      fg: monokai.foreground,
    },
  },

  borders: {
    default: '#49483E',
    subtle: monokai.backgroundLight,
    strong: monokai.comment,
    accent: monokai.green,
    danger: monokai.pink,
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
        bg: monokai.green,
        fg: monokai.background,
        hoverBg: '#B8F040',
        activeBg: '#8BC922',
        border: 'transparent',
      },
      secondary: {
        bg: '#49483E',
        fg: monokai.foreground,
        hoverBg: '#5B5A4F',
        activeBg: monokai.backgroundLight,
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: monokai.green,
        hoverBg: 'rgba(166, 226, 46, 0.1)',
        activeBg: 'rgba(166, 226, 46, 0.2)',
        border: monokai.green,
      },
      ghost: {
        bg: 'transparent',
        fg: monokai.foreground,
        hoverBg: 'rgba(255, 255, 255, 0.1)',
        activeBg: 'rgba(255, 255, 255, 0.2)',
        border: 'transparent',
      },
    },

    panel: {
      bg: monokai.backgroundLight,
      headerBg: '#49483E',
      footerBg: '#49483E',
      border: '#49483E',
    },

    menu: {
      bg: monokai.backgroundLight,
      border: '#49483E',
      item: {
        fg: monokai.foreground,
        hoverBg: '#49483E',
        activeBg: '#5B5A4F',
        selectedBg: '#49483E',
        disabledFg: '#5B5A4F',
      },
    },

    tabs: {
      bg: monokai.backgroundLight,
      border: '#49483E',
      tab: {
        fg: monokai.comment,
        activeFg: monokai.foreground,
        activeBg: monokai.background,
        hoverFg: '#E8E8E2',
        indicator: monokai.green,
      },
    },

    dropdown: {
      bg: monokai.backgroundLight,
      border: '#49483E',
      item: {
        fg: monokai.foreground,
        hoverBg: '#49483E',
        selectedBg: '#5B5A4F',
      },
    },

    input: {
      bg: monokai.backgroundLight,
      fg: monokai.foreground,
      placeholder: monokai.comment,
      border: '#49483E',
      focusBorder: monokai.green,
      invalidBorder: monokai.pink,
    },

    checkbox: {
      bg: monokai.backgroundLight,
      border: '#5B5A4F',
      checkColor: monokai.background,
      checkedBg: monokai.green,
    },

    radio: {
      bg: monokai.backgroundLight,
      dotColor: monokai.green,
      border: '#5B5A4F',
      checkedBorder: monokai.green,
    },

    tooltip: {
      bg: '#49483E',
      fg: monokai.foreground,
    },

    modal: {
      bg: monokai.backgroundLight,
      border: '#49483E',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },

    badge: {
      default: {
        bg: '#49483E',
        fg: monokai.foreground,
      },
      success: {
        bg: monokai.green,
        fg: monokai.background,
      },
      warning: {
        bg: monokai.yellow,
        fg: monokai.background,
      },
      danger: {
        bg: monokai.pink,
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: monokai.backgroundLight,
        selectedBg: '#49483E',
        fg: monokai.foreground,
      },
    },

    header: {
      default: {
        bg: monokai.backgroundLight,
        fg: monokai.foreground,
        titleFg: monokai.foreground,
        subtitleFg: monokai.comment,
        border: '#49483E',
      },
      primary: {
        bg: monokai.green,
        fg: monokai.background,
        titleFg: monokai.background,
        subtitleFg: 'rgba(39, 40, 34, 0.8)',
        border: '#84CC16',
      },
      secondary: {
        bg: '#49483E',
        fg: monokai.foreground,
        titleFg: monokai.foreground,
        subtitleFg: monokai.comment,
        border: '#5B5A4F',
      },
      success: {
        bg: monokai.green,
        fg: monokai.background,
        titleFg: monokai.background,
        subtitleFg: 'rgba(39, 40, 34, 0.8)',
        border: '#84CC16',
      },
      warning: {
        bg: monokai.yellow,
        fg: monokai.background,
        titleFg: monokai.background,
        subtitleFg: 'rgba(39, 40, 34, 0.7)',
        border: monokai.orange,
      },
      danger: {
        bg: monokai.pink,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: '#E11D48',
      },
    },

    statusbar: {
      default: {
        bg: monokai.backgroundLight,
        fg: monokai.comment,
      },
      primary: {
        bg: monokai.green,
        fg: monokai.background,
      },
      info: {
        bg: monokai.cyan,
        fg: monokai.background,
      },
      success: {
        bg: monokai.green,
        fg: monokai.background,
      },
      warning: {
        bg: monokai.yellow,
        fg: monokai.background,
      },
      danger: {
        bg: monokai.pink,
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: monokai.background,
        titleFg: monokai.foreground,
        subtitleFg: monokai.comment,
        border: '#49483E',
      },
      primary: {
        bg: monokai.background,
        titleFg: monokai.green,
        subtitleFg: monokai.comment,
        border: monokai.green,
      },
      secondary: {
        bg: monokai.background,
        titleFg: '#E8E8E2',
        subtitleFg: monokai.comment,
        border: '#49483E',
      },
    },

    appshell: {
      bg: monokai.backgroundDark,
      dividerFg: '#49483E',
      sidebarBg: monokai.background,
      asideBg: monokai.background,
    },

    collapsible: {
      default: {
        headerBg: monokai.backgroundLight,
        headerFg: monokai.foreground,
        contentBg: monokai.background,
        border: '#49483E',
        iconFg: monokai.comment,
      },
      primary: {
        headerBg: '#49483E',
        headerFg: monokai.green,
        contentBg: monokai.background,
        border: monokai.green,
        iconFg: monokai.green,
      },
      secondary: {
        headerBg: '#49483E',
        headerFg: monokai.foreground,
        contentBg: monokai.backgroundLight,
        border: '#5B5A4F',
        iconFg: monokai.comment,
      },
    },

    commandPalette: {
      bg: monokai.backgroundLight,
      border: '#49483E',
      inputBg: monokai.background,
      inputFg: monokai.foreground,
      inputPlaceholder: monokai.comment,
      itemFg: monokai.foreground,
      itemHoverBg: '#49483E',
      itemSelectedBg: '#5B5A4F',
      itemSelectedFg: monokai.foreground,
      highlightFg: monokai.green,
      categoryFg: monokai.comment,
    },

    splitPanel: {
      bg: monokai.background,
      dividerBg: '#49483E',
      dividerHoverBg: '#5B5A4F',
      dividerActiveBg: monokai.green,
      border: '#49483E',
      titleFg: monokai.comment,
    },
    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: monokai.green,
        iconFg: monokai.green,
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: monokai.pink,
        iconFg: monokai.pink,
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: monokai.yellow,
        iconFg: monokai.yellow,
      },
      info: {
        bg: '#0E4A5C',
        fg: '#CFFAFE',
        border: monokai.cyan,
        iconFg: monokai.cyan,
      },
    },
    window: {
      default: {
        bg: monokai.background,
        fg: monokai.foreground,
        titleBarBg: monokai.backgroundLight,
        titleBarFg: monokai.foreground,
        border: '#49483E',
        buttonFg: monokai.comment,
        closeFg: monokai.pink,
      },
      primary: {
        bg: monokai.background,
        fg: monokai.foreground,
        titleBarBg: monokai.green,
        titleBarFg: monokai.background,
        border: '#84CC16',
        buttonFg: 'rgba(39, 40, 34, 0.8)',
        closeFg: monokai.background,
      },
      success: {
        bg: monokai.background,
        fg: monokai.foreground,
        titleBarBg: monokai.green,
        titleBarFg: monokai.background,
        border: '#84CC16',
        buttonFg: 'rgba(39, 40, 34, 0.8)',
        closeFg: monokai.background,
      },
      warning: {
        bg: monokai.background,
        fg: monokai.foreground,
        titleBarBg: monokai.yellow,
        titleBarFg: monokai.background,
        border: monokai.orange,
        buttonFg: 'rgba(39, 40, 34, 0.8)',
        closeFg: monokai.background,
      },
      danger: {
        bg: monokai.background,
        fg: monokai.foreground,
        titleBarBg: monokai.pink,
        titleBarFg: '#ffffff',
        border: '#E11D48',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default monokaiTheme;
