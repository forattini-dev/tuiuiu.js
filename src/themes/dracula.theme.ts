/**
 * Dracula Theme
 *
 * Popular dark theme with purple accents.
 */

import { defineTheme } from '../core/theme-loader.js';
import * as colors from '../core/colors.js';

// =============================================================================
// Dracula Colors
// =============================================================================

const dracula = {
  background: '#282A36',
  currentLine: '#44475A',
  foreground: '#F8F8F2',
  comment: '#6272A4',
  cyan: '#8BE9FD',
  green: '#50FA7B',
  orange: '#FFB86C',
  pink: '#FF79C6',
  purple: '#BD93F9',
  red: '#FF5555',
  yellow: '#F1FA8C',
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
    400: '#BD93F9',
    500: '#BD93F9',
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
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#50FA7B',
    500: '#50FA7B',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  warning: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#F1FA8C',
    500: '#F1FA8C',
    600: '#CA8A04',
    700: '#A16207',
    800: '#854D0E',
    900: '#713F12',
  },
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#FF5555',
    500: '#FF5555',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
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

export const draculaTheme = defineTheme({
  name: 'dracula',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Popular Dracula dark theme with purple accents',
  },

  palette,

  background: {
    lowest: '#21222C',
    base: dracula.background,
    subtle: dracula.currentLine,
    surface: '#4D4F5F',
    raised: '#565869',
    elevated: dracula.comment,
    popover: dracula.currentLine,
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  foreground: {
    primary: dracula.foreground,
    secondary: '#E8E8E2',
    muted: dracula.comment,
    disabled: '#565869',
    inverse: {
      base: dracula.background,
      soft: 'rgba(40, 42, 54, 0.8)',
      subtle: 'rgba(40, 42, 54, 0.6)',
    },
  },

  accents: {
    positive: dracula.green,
    warning: dracula.yellow,
    critical: dracula.red,
    info: dracula.cyan,
    highlight: dracula.purple,
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
      border: dracula.purple,
      ring: {
        color: dracula.purple,
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: dracula.currentLine,
      fg: '#565869',
    },
    selected: {
      bg: dracula.currentLine,
      fg: dracula.foreground,
    },
  },

  borders: {
    default: dracula.comment,
    subtle: dracula.currentLine,
    strong: dracula.purple,
    accent: dracula.purple,
    danger: dracula.red,
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
        bg: dracula.purple,
        fg: dracula.foreground,
        hoverBg: '#CDA4FF',
        activeBg: '#A77EE8',
        border: 'transparent',
      },
      secondary: {
        bg: dracula.currentLine,
        fg: dracula.foreground,
        hoverBg: '#565869',
        activeBg: '#4D4F5F',
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: dracula.purple,
        hoverBg: 'rgba(189, 147, 249, 0.1)',
        activeBg: 'rgba(189, 147, 249, 0.2)',
        border: dracula.purple,
      },
      ghost: {
        bg: 'transparent',
        fg: dracula.foreground,
        hoverBg: 'rgba(255, 255, 255, 0.1)',
        activeBg: 'rgba(255, 255, 255, 0.2)',
        border: 'transparent',
      },
    },

    panel: {
      bg: dracula.currentLine,
      headerBg: '#4D4F5F',
      footerBg: '#4D4F5F',
      border: dracula.comment,
    },

    menu: {
      bg: dracula.currentLine,
      border: dracula.comment,
      item: {
        fg: dracula.foreground,
        hoverBg: '#4D4F5F',
        activeBg: '#565869',
        selectedBg: '#4D4F5F',
        disabledFg: '#565869',
      },
    },

    tabs: {
      bg: dracula.currentLine,
      border: dracula.comment,
      tab: {
        fg: dracula.comment,
        activeFg: dracula.foreground,
        activeBg: dracula.background,
        hoverFg: '#E8E8E2',
        indicator: dracula.purple,
      },
    },

    dropdown: {
      bg: dracula.currentLine,
      border: dracula.comment,
      item: {
        fg: dracula.foreground,
        hoverBg: '#4D4F5F',
        selectedBg: '#565869',
      },
    },

    input: {
      bg: dracula.currentLine,
      fg: dracula.foreground,
      placeholder: dracula.comment,
      border: dracula.comment,
      focusBorder: dracula.purple,
      invalidBorder: dracula.red,
    },

    checkbox: {
      bg: dracula.currentLine,
      border: dracula.comment,
      checkColor: dracula.foreground,
      checkedBg: dracula.purple,
    },

    radio: {
      bg: dracula.currentLine,
      dotColor: dracula.purple,
      border: dracula.comment,
      checkedBorder: dracula.purple,
    },

    tooltip: {
      bg: '#4D4F5F',
      fg: dracula.foreground,
    },

    modal: {
      bg: dracula.currentLine,
      border: dracula.comment,
      overlay: 'rgba(0, 0, 0, 0.7)',
    },

    badge: {
      default: {
        bg: dracula.comment,
        fg: dracula.foreground,
      },
      success: {
        bg: dracula.green,
        fg: dracula.background,
      },
      warning: {
        bg: dracula.yellow,
        fg: dracula.background,
      },
      danger: {
        bg: dracula.red,
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: dracula.currentLine,
        selectedBg: '#4D4F5F',
        fg: dracula.foreground,
      },
    },

    header: {
      default: {
        bg: dracula.currentLine,
        fg: dracula.foreground,
        titleFg: dracula.foreground,
        subtitleFg: dracula.comment,
        border: dracula.comment,
      },
      primary: {
        bg: dracula.purple,
        fg: dracula.foreground,
        titleFg: dracula.foreground,
        subtitleFg: 'rgba(248, 248, 242, 0.8)',
        border: '#A78BFA',
      },
      secondary: {
        bg: '#4D4F5F',
        fg: dracula.foreground,
        titleFg: dracula.foreground,
        subtitleFg: dracula.comment,
        border: '#565869',
      },
      success: {
        bg: dracula.green,
        fg: dracula.background,
        titleFg: dracula.background,
        subtitleFg: 'rgba(40, 42, 54, 0.8)',
        border: '#059669',
      },
      warning: {
        bg: dracula.yellow,
        fg: dracula.background,
        titleFg: dracula.background,
        subtitleFg: 'rgba(40, 42, 54, 0.7)',
        border: dracula.orange,
      },
      danger: {
        bg: dracula.red,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: '#DC2626',
      },
    },

    statusbar: {
      default: {
        bg: dracula.currentLine,
        fg: dracula.comment,
      },
      primary: {
        bg: dracula.purple,
        fg: dracula.foreground,
      },
      info: {
        bg: dracula.cyan,
        fg: dracula.background,
      },
      success: {
        bg: dracula.green,
        fg: dracula.background,
      },
      warning: {
        bg: dracula.yellow,
        fg: dracula.background,
      },
      danger: {
        bg: dracula.red,
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: dracula.background,
        titleFg: dracula.foreground,
        subtitleFg: dracula.comment,
        border: dracula.comment,
      },
      primary: {
        bg: dracula.background,
        titleFg: dracula.purple,
        subtitleFg: dracula.comment,
        border: dracula.purple,
      },
      secondary: {
        bg: dracula.background,
        titleFg: '#E8E8E2',
        subtitleFg: dracula.comment,
        border: dracula.currentLine,
      },
    },

    appshell: {
      bg: '#21222C',
      dividerFg: dracula.comment,
      sidebarBg: dracula.background,
      asideBg: dracula.background,
    },

    collapsible: {
      default: {
        headerBg: dracula.currentLine,
        headerFg: dracula.foreground,
        contentBg: dracula.background,
        border: dracula.comment,
        iconFg: dracula.comment,
      },
      primary: {
        headerBg: '#4D4F5F',
        headerFg: dracula.purple,
        contentBg: dracula.background,
        border: dracula.purple,
        iconFg: dracula.purple,
      },
      secondary: {
        headerBg: '#4D4F5F',
        headerFg: dracula.foreground,
        contentBg: dracula.currentLine,
        border: '#565869',
        iconFg: dracula.comment,
      },
    },

    commandPalette: {
      bg: dracula.currentLine,
      border: dracula.comment,
      inputBg: dracula.background,
      inputFg: dracula.foreground,
      inputPlaceholder: dracula.comment,
      itemFg: dracula.foreground,
      itemHoverBg: '#4D4F5F',
      itemSelectedBg: '#565869',
      itemSelectedFg: dracula.foreground,
      highlightFg: dracula.purple,
      categoryFg: dracula.comment,
    },

    splitPanel: {
      bg: dracula.background,
      dividerBg: dracula.comment,
      dividerHoverBg: '#4D4F5F',
      dividerActiveBg: dracula.purple,
      border: dracula.comment,
      titleFg: dracula.comment,
    },
    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: dracula.green,
        iconFg: dracula.green,
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: dracula.red,
        iconFg: dracula.red,
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: dracula.yellow,
        iconFg: dracula.yellow,
      },
      info: {
        bg: '#0E4A5C',
        fg: '#CFFAFE',
        border: dracula.cyan,
        iconFg: dracula.cyan,
      },
    },
    window: {
      default: {
        bg: dracula.background,
        fg: dracula.foreground,
        titleBarBg: dracula.currentLine,
        titleBarFg: dracula.foreground,
        border: dracula.comment,
        buttonFg: dracula.comment,
        closeFg: dracula.red,
      },
      primary: {
        bg: dracula.background,
        fg: dracula.foreground,
        titleBarBg: dracula.purple,
        titleBarFg: dracula.foreground,
        border: '#A78BFA',
        buttonFg: 'rgba(248, 248, 242, 0.8)',
        closeFg: dracula.foreground,
      },
      success: {
        bg: dracula.background,
        fg: dracula.foreground,
        titleBarBg: dracula.green,
        titleBarFg: dracula.background,
        border: '#059669',
        buttonFg: 'rgba(40, 42, 54, 0.8)',
        closeFg: dracula.background,
      },
      warning: {
        bg: dracula.background,
        fg: dracula.foreground,
        titleBarBg: dracula.yellow,
        titleBarFg: dracula.background,
        border: dracula.orange,
        buttonFg: 'rgba(40, 42, 54, 0.8)',
        closeFg: dracula.background,
      },
      danger: {
        bg: dracula.background,
        fg: dracula.foreground,
        titleBarBg: dracula.red,
        titleBarFg: '#ffffff',
        border: '#DC2626',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default draculaTheme;
