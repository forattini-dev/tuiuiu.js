/**
 * High Contrast Dark Theme
 *
 * Accessibility-focused dark theme with maximum contrast.
 */

import { defineTheme } from '../core/theme-loader.js';
import * as colors from '../core/colors.js';

// =============================================================================
// Palette
// =============================================================================

const palette = {
  primary: {
    50: colors.blue[50],
    100: colors.blue[100],
    200: colors.blue[200],
    300: colors.blue[300],
    400: colors.blue[400],
    500: colors.blue[500],
    600: colors.blue[600],
    700: colors.blue[700],
    800: colors.blue[800],
    900: colors.blue[900],
  },
  secondary: {
    50: colors.neutral[50],
    100: colors.neutral[100],
    200: colors.neutral[200],
    300: colors.neutral[300],
    400: colors.neutral[400],
    500: colors.neutral[500],
    600: colors.neutral[600],
    700: colors.neutral[700],
    800: colors.neutral[800],
    900: colors.neutral[900],
  },
  success: {
    50: colors.green[50],
    100: colors.green[100],
    200: colors.green[200],
    300: colors.green[300],
    400: colors.green[400],
    500: colors.green[500],
    600: colors.green[600],
    700: colors.green[700],
    800: colors.green[800],
    900: colors.green[900],
  },
  warning: {
    50: colors.amber[50],
    100: colors.amber[100],
    200: colors.amber[200],
    300: colors.amber[300],
    400: colors.amber[400],
    500: colors.amber[500],
    600: colors.amber[600],
    700: colors.amber[700],
    800: colors.amber[800],
    900: colors.amber[900],
  },
  danger: {
    50: colors.red[50],
    100: colors.red[100],
    200: colors.red[200],
    300: colors.red[300],
    400: colors.red[400],
    500: colors.red[500],
    600: colors.red[600],
    700: colors.red[700],
    800: colors.red[800],
    900: colors.red[900],
  },
  neutral: {
    50: colors.neutral[50],
    100: colors.neutral[100],
    200: colors.neutral[200],
    300: colors.neutral[300],
    400: colors.neutral[400],
    500: colors.neutral[500],
    600: colors.neutral[600],
    700: colors.neutral[700],
    800: colors.neutral[800],
    900: colors.neutral[900],
  },
};

// =============================================================================
// Theme Definition
// =============================================================================

export const highContrastDarkTheme = defineTheme({
  name: 'high-contrast-dark',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Accessibility-focused high contrast dark theme',
  },

  palette,

  background: {
    lowest: '#000000',
    base: '#000000',
    subtle: colors.neutral[950],
    surface: colors.neutral[900],
    raised: colors.neutral[800],
    elevated: colors.neutral[700],
    popover: colors.neutral[950],
    overlay: 'rgba(0, 0, 0, 0.8)',
  },

  foreground: {
    primary: '#ffffff',
    secondary: colors.neutral[100],
    muted: colors.neutral[300],
    disabled: colors.neutral[500],
    inverse: {
      base: '#000000',
      soft: 'rgba(0, 0, 0, 0.8)',
      subtle: 'rgba(0, 0, 0, 0.6)',
    },
  },

  accents: {
    positive: colors.green[400],
    warning: colors.amber[400],
    critical: colors.red[400],
    info: colors.cyan[400],
    highlight: colors.blue[400],
  },

  states: {
    hover: {
      bg: 'rgba(255, 255, 255, 0.15)',
      fg: null,
    },
    active: {
      bg: 'rgba(255, 255, 255, 0.25)',
    },
    focus: {
      border: colors.blue[400],
      ring: {
        color: colors.blue[400],
        width: 3,
      },
    },
    disabled: {
      opacity: 0.5,
      bg: colors.neutral[900],
      fg: colors.neutral[500],
    },
    selected: {
      bg: colors.blue[800],
      fg: '#ffffff',
    },
  },

  borders: {
    default: colors.neutral[500],
    subtle: colors.neutral[700],
    strong: colors.neutral[300],
    accent: colors.blue[400],
    danger: colors.red[400],
  },

  opacity: {
    disabled: 0.5,
    muted: 0.8,
    overlay: 0.8,
    ghost: 0.25,
  },

  components: {
    button: {
      primary: {
        bg: colors.blue[500],
        fg: '#ffffff',
        hoverBg: colors.blue[400],
        activeBg: colors.blue[600],
        border: colors.blue[300],
      },
      secondary: {
        bg: colors.neutral[800],
        fg: '#ffffff',
        hoverBg: colors.neutral[700],
        activeBg: colors.neutral[900],
        border: colors.neutral[500],
      },
      outline: {
        bg: 'transparent',
        fg: colors.blue[400],
        hoverBg: 'rgba(255, 255, 255, 0.1)',
        activeBg: 'rgba(255, 255, 255, 0.2)',
        border: colors.blue[400],
      },
      ghost: {
        bg: 'transparent',
        fg: '#ffffff',
        hoverBg: 'rgba(255, 255, 255, 0.15)',
        activeBg: 'rgba(255, 255, 255, 0.25)',
        border: 'transparent',
      },
    },

    panel: {
      bg: colors.neutral[950],
      headerBg: colors.neutral[900],
      footerBg: colors.neutral[900],
      border: colors.neutral[500],
    },

    menu: {
      bg: colors.neutral[950],
      border: colors.neutral[500],
      item: {
        fg: '#ffffff',
        hoverBg: colors.neutral[800],
        activeBg: colors.blue[800],
        selectedBg: colors.blue[900],
        disabledFg: colors.neutral[500],
      },
    },

    tabs: {
      bg: colors.neutral[950],
      border: colors.neutral[500],
      tab: {
        fg: colors.neutral[300],
        activeFg: '#ffffff',
        activeBg: colors.neutral[800],
        hoverFg: colors.neutral[100],
        indicator: colors.blue[400],
      },
    },

    dropdown: {
      bg: colors.neutral[950],
      border: colors.neutral[500],
      item: {
        fg: '#ffffff',
        hoverBg: colors.neutral[800],
        selectedBg: colors.blue[800],
      },
    },

    input: {
      bg: '#000000',
      fg: '#ffffff',
      placeholder: colors.neutral[400],
      border: colors.neutral[500],
      focusBorder: colors.blue[400],
      invalidBorder: colors.red[400],
    },

    checkbox: {
      bg: '#000000',
      border: colors.neutral[400],
      checkColor: '#000000',
      checkedBg: colors.blue[400],
    },

    radio: {
      bg: '#000000',
      dotColor: colors.blue[400],
      border: colors.neutral[400],
      checkedBorder: colors.blue[400],
    },

    tooltip: {
      bg: colors.neutral[800],
      fg: '#ffffff',
    },

    modal: {
      bg: colors.neutral[950],
      border: colors.neutral[500],
      overlay: 'rgba(0, 0, 0, 0.8)',
    },

    badge: {
      default: {
        bg: colors.neutral[700],
        fg: '#ffffff',
      },
      success: {
        bg: colors.green[500],
        fg: '#000000',
      },
      warning: {
        bg: colors.amber[400],
        fg: '#000000',
      },
      danger: {
        bg: colors.red[500],
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: colors.neutral[900],
        selectedBg: colors.blue[800],
        fg: '#ffffff',
      },
    },

    header: {
      default: {
        bg: colors.neutral[950],
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: colors.neutral[300],
        border: colors.neutral[500],
      },
      primary: {
        bg: colors.blue[500],
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: colors.blue[300],
      },
      secondary: {
        bg: colors.neutral[800],
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: colors.neutral[300],
        border: colors.neutral[500],
      },
      success: {
        bg: colors.green[500],
        fg: '#000000',
        titleFg: '#000000',
        subtitleFg: 'rgba(0, 0, 0, 0.7)',
        border: colors.green[300],
      },
      warning: {
        bg: colors.amber[400],
        fg: '#000000',
        titleFg: '#000000',
        subtitleFg: 'rgba(0, 0, 0, 0.7)',
        border: colors.amber[600],
      },
      danger: {
        bg: colors.red[500],
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: colors.red[300],
      },
    },

    statusbar: {
      default: {
        bg: colors.neutral[950],
        fg: colors.neutral[300],
      },
      primary: {
        bg: colors.blue[500],
        fg: '#ffffff',
      },
      info: {
        bg: colors.cyan[500],
        fg: '#000000',
      },
      success: {
        bg: colors.green[500],
        fg: '#000000',
      },
      warning: {
        bg: colors.amber[400],
        fg: '#000000',
      },
      danger: {
        bg: colors.red[500],
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: '#000000',
        titleFg: '#ffffff',
        subtitleFg: colors.neutral[300],
        border: colors.neutral[500],
      },
      primary: {
        bg: '#000000',
        titleFg: colors.blue[400],
        subtitleFg: colors.neutral[300],
        border: colors.blue[400],
      },
      secondary: {
        bg: '#000000',
        titleFg: colors.neutral[100],
        subtitleFg: colors.neutral[400],
        border: colors.neutral[700],
      },
    },

    appshell: {
      bg: '#000000',
      dividerFg: colors.neutral[500],
      sidebarBg: '#000000',
      asideBg: '#000000',
    },

    collapsible: {
      default: {
        headerBg: colors.neutral[950],
        headerFg: '#ffffff',
        contentBg: '#000000',
        border: colors.neutral[500],
        iconFg: colors.neutral[300],
      },
      primary: {
        headerBg: colors.neutral[900],
        headerFg: colors.blue[400],
        contentBg: '#000000',
        border: colors.blue[400],
        iconFg: colors.blue[400],
      },
      secondary: {
        headerBg: colors.neutral[900],
        headerFg: '#ffffff',
        contentBg: colors.neutral[950],
        border: colors.neutral[500],
        iconFg: colors.neutral[300],
      },
    },

    commandPalette: {
      bg: colors.neutral[950],
      border: colors.neutral[500],
      inputBg: '#000000',
      inputFg: '#ffffff',
      inputPlaceholder: colors.neutral[400],
      itemFg: '#ffffff',
      itemHoverBg: colors.neutral[800],
      itemSelectedBg: colors.blue[800],
      itemSelectedFg: '#ffffff',
      highlightFg: colors.blue[400],
      categoryFg: colors.neutral[400],
    },

    splitPanel: {
      bg: '#000000',
      dividerBg: colors.neutral[500],
      dividerHoverBg: colors.neutral[400],
      dividerActiveBg: colors.blue[400],
      border: colors.neutral[500],
      titleFg: colors.neutral[300],
    },
    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: colors.green[400],
        iconFg: colors.green[400],
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: colors.red[400],
        iconFg: colors.red[400],
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: colors.amber[400],
        iconFg: colors.amber[400],
      },
      info: {
        bg: '#0C4A6E',
        fg: '#E0F2FE',
        border: colors.cyan[400],
        iconFg: colors.cyan[400],
      },
    },
    window: {
      default: {
        bg: '#000000',
        fg: '#ffffff',
        titleBarBg: colors.neutral[950],
        titleBarFg: '#ffffff',
        border: colors.neutral[500],
        buttonFg: colors.neutral[300],
        closeFg: colors.red[400],
      },
      primary: {
        bg: '#000000',
        fg: '#ffffff',
        titleBarBg: colors.blue[500],
        titleBarFg: '#ffffff',
        border: colors.blue[300],
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
      success: {
        bg: '#000000',
        fg: '#ffffff',
        titleBarBg: colors.green[500],
        titleBarFg: '#000000',
        border: colors.green[300],
        buttonFg: 'rgba(0, 0, 0, 0.8)',
        closeFg: '#000000',
      },
      warning: {
        bg: '#000000',
        fg: '#ffffff',
        titleBarBg: colors.amber[400],
        titleBarFg: '#000000',
        border: colors.amber[600],
        buttonFg: 'rgba(0, 0, 0, 0.8)',
        closeFg: '#000000',
      },
      danger: {
        bg: '#000000',
        fg: '#ffffff',
        titleBarBg: colors.red[500],
        titleBarFg: '#ffffff',
        border: colors.red[300],
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },

  borderRadius: 'sm',
});

export default highContrastDarkTheme;
