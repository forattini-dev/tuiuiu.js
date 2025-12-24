/**
 * Monochrome Theme
 *
 * Grayscale-only theme for a minimalist look.
 */

import { defineTheme } from '../core/theme-loader.js';
import * as colors from '../core/colors.js';

// =============================================================================
// Palette (all neutral/gray)
// =============================================================================

const palette = {
  primary: {
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
  warning: {
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
  danger: {
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

export const monochromeTheme = defineTheme({
  name: 'monochrome',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Minimalist grayscale-only monochrome theme',
  },

  palette,

  background: {
    lowest: colors.neutral[950],
    base: colors.neutral[900],
    subtle: colors.neutral[800],
    surface: colors.neutral[700],
    raised: colors.neutral[600],
    elevated: colors.neutral[500],
    popover: colors.neutral[800],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  foreground: {
    primary: colors.neutral[50],
    secondary: colors.neutral[200],
    muted: colors.neutral[400],
    disabled: colors.neutral[500],
    inverse: {
      base: colors.neutral[900],
      soft: 'rgba(23, 23, 23, 0.8)',
      subtle: 'rgba(23, 23, 23, 0.6)',
    },
  },

  accents: {
    positive: colors.neutral[300],
    warning: colors.neutral[400],
    critical: colors.neutral[200],
    info: colors.neutral[300],
    highlight: colors.neutral[300],
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
      border: colors.neutral[400],
      ring: {
        color: colors.neutral[400],
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: colors.neutral[800],
      fg: colors.neutral[500],
    },
    selected: {
      bg: colors.neutral[700],
      fg: colors.neutral[50],
    },
  },

  borders: {
    default: colors.neutral[600],
    subtle: colors.neutral[700],
    strong: colors.neutral[400],
    accent: colors.neutral[400],
    danger: colors.neutral[400],
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
        bg: colors.neutral[300],
        fg: colors.neutral[900],
        hoverBg: colors.neutral[200],
        activeBg: colors.neutral[400],
        border: 'transparent',
      },
      secondary: {
        bg: colors.neutral[700],
        fg: colors.neutral[50],
        hoverBg: colors.neutral[600],
        activeBg: colors.neutral[800],
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: colors.neutral[300],
        hoverBg: 'rgba(255, 255, 255, 0.1)',
        activeBg: 'rgba(255, 255, 255, 0.2)',
        border: colors.neutral[400],
      },
      ghost: {
        bg: 'transparent',
        fg: colors.neutral[50],
        hoverBg: 'rgba(255, 255, 255, 0.1)',
        activeBg: 'rgba(255, 255, 255, 0.2)',
        border: 'transparent',
      },
    },

    panel: {
      bg: colors.neutral[800],
      headerBg: colors.neutral[700],
      footerBg: colors.neutral[700],
      border: colors.neutral[600],
    },

    menu: {
      bg: colors.neutral[800],
      border: colors.neutral[600],
      item: {
        fg: colors.neutral[50],
        hoverBg: colors.neutral[700],
        activeBg: colors.neutral[600],
        selectedBg: colors.neutral[700],
        disabledFg: colors.neutral[500],
      },
    },

    tabs: {
      bg: colors.neutral[800],
      border: colors.neutral[600],
      tab: {
        fg: colors.neutral[400],
        activeFg: colors.neutral[50],
        activeBg: colors.neutral[700],
        hoverFg: colors.neutral[200],
        indicator: colors.neutral[300],
      },
    },

    dropdown: {
      bg: colors.neutral[800],
      border: colors.neutral[600],
      item: {
        fg: colors.neutral[50],
        hoverBg: colors.neutral[700],
        selectedBg: colors.neutral[600],
      },
    },

    input: {
      bg: colors.neutral[800],
      fg: colors.neutral[50],
      placeholder: colors.neutral[500],
      border: colors.neutral[600],
      focusBorder: colors.neutral[400],
      invalidBorder: colors.neutral[300],
    },

    checkbox: {
      bg: colors.neutral[800],
      border: colors.neutral[500],
      checkColor: colors.neutral[900],
      checkedBg: colors.neutral[300],
    },

    radio: {
      bg: colors.neutral[800],
      dotColor: colors.neutral[300],
      border: colors.neutral[500],
      checkedBorder: colors.neutral[300],
    },

    tooltip: {
      bg: colors.neutral[700],
      fg: colors.neutral[50],
    },

    modal: {
      bg: colors.neutral[800],
      border: colors.neutral[600],
      overlay: 'rgba(0, 0, 0, 0.7)',
    },

    badge: {
      default: {
        bg: colors.neutral[700],
        fg: colors.neutral[50],
      },
      success: {
        bg: colors.neutral[400],
        fg: colors.neutral[900],
      },
      warning: {
        bg: colors.neutral[500],
        fg: colors.neutral[900],
      },
      danger: {
        bg: colors.neutral[300],
        fg: colors.neutral[900],
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: colors.neutral[800],
        selectedBg: colors.neutral[700],
        fg: colors.neutral[50],
      },
    },

    header: {
      default: {
        bg: colors.neutral[800],
        fg: colors.neutral[50],
        titleFg: colors.neutral[50],
        subtitleFg: colors.neutral[400],
        border: colors.neutral[600],
      },
      primary: {
        bg: colors.neutral[300],
        fg: colors.neutral[900],
        titleFg: colors.neutral[900],
        subtitleFg: 'rgba(23, 23, 23, 0.7)',
        border: colors.neutral[400],
      },
      secondary: {
        bg: colors.neutral[700],
        fg: colors.neutral[50],
        titleFg: colors.neutral[50],
        subtitleFg: colors.neutral[400],
        border: colors.neutral[600],
      },
      success: {
        bg: colors.neutral[400],
        fg: colors.neutral[900],
        titleFg: colors.neutral[900],
        subtitleFg: 'rgba(23, 23, 23, 0.7)',
        border: colors.neutral[500],
      },
      warning: {
        bg: colors.neutral[500],
        fg: colors.neutral[900],
        titleFg: colors.neutral[900],
        subtitleFg: 'rgba(23, 23, 23, 0.7)',
        border: colors.neutral[600],
      },
      danger: {
        bg: colors.neutral[300],
        fg: colors.neutral[900],
        titleFg: colors.neutral[900],
        subtitleFg: 'rgba(23, 23, 23, 0.7)',
        border: colors.neutral[400],
      },
    },

    statusbar: {
      default: {
        bg: colors.neutral[800],
        fg: colors.neutral[400],
      },
      primary: {
        bg: colors.neutral[300],
        fg: colors.neutral[900],
      },
      info: {
        bg: colors.neutral[400],
        fg: colors.neutral[900],
      },
      success: {
        bg: colors.neutral[400],
        fg: colors.neutral[900],
      },
      warning: {
        bg: colors.neutral[500],
        fg: colors.neutral[900],
      },
      danger: {
        bg: colors.neutral[300],
        fg: colors.neutral[900],
      },
    },

    page: {
      default: {
        bg: colors.neutral[900],
        titleFg: colors.neutral[50],
        subtitleFg: colors.neutral[400],
        border: colors.neutral[600],
      },
      primary: {
        bg: colors.neutral[900],
        titleFg: colors.neutral[200],
        subtitleFg: colors.neutral[400],
        border: colors.neutral[500],
      },
      secondary: {
        bg: colors.neutral[900],
        titleFg: colors.neutral[300],
        subtitleFg: colors.neutral[500],
        border: colors.neutral[700],
      },
    },

    appshell: {
      bg: colors.neutral[950],
      dividerFg: colors.neutral[600],
      sidebarBg: colors.neutral[900],
      asideBg: colors.neutral[900],
    },

    collapsible: {
      default: {
        headerBg: colors.neutral[800],
        headerFg: colors.neutral[50],
        contentBg: colors.neutral[900],
        border: colors.neutral[600],
        iconFg: colors.neutral[400],
      },
      primary: {
        headerBg: colors.neutral[700],
        headerFg: colors.neutral[200],
        contentBg: colors.neutral[900],
        border: colors.neutral[500],
        iconFg: colors.neutral[300],
      },
      secondary: {
        headerBg: colors.neutral[700],
        headerFg: colors.neutral[50],
        contentBg: colors.neutral[800],
        border: colors.neutral[600],
        iconFg: colors.neutral[400],
      },
    },

    commandPalette: {
      bg: colors.neutral[800],
      border: colors.neutral[600],
      inputBg: colors.neutral[900],
      inputFg: colors.neutral[50],
      inputPlaceholder: colors.neutral[500],
      itemFg: colors.neutral[50],
      itemHoverBg: colors.neutral[700],
      itemSelectedBg: colors.neutral[600],
      itemSelectedFg: colors.neutral[50],
      highlightFg: colors.neutral[200],
      categoryFg: colors.neutral[500],
    },

    splitPanel: {
      bg: colors.neutral[900],
      dividerBg: colors.neutral[600],
      dividerHoverBg: colors.neutral[500],
      dividerActiveBg: colors.neutral[300],
      border: colors.neutral[600],
      titleFg: colors.neutral[400],
    },
    toast: {
      success: {
        bg: colors.neutral[800],
        fg: colors.neutral[100],
        border: colors.neutral[400],
        iconFg: colors.neutral[300],
      },
      error: {
        bg: colors.neutral[800],
        fg: colors.neutral[100],
        border: colors.neutral[300],
        iconFg: colors.neutral[200],
      },
      warning: {
        bg: colors.neutral[800],
        fg: colors.neutral[100],
        border: colors.neutral[500],
        iconFg: colors.neutral[400],
      },
      info: {
        bg: colors.neutral[800],
        fg: colors.neutral[100],
        border: colors.neutral[400],
        iconFg: colors.neutral[300],
      },
    },
    window: {
      default: {
        bg: colors.neutral[900],
        fg: colors.neutral[50],
        titleBarBg: colors.neutral[800],
        titleBarFg: colors.neutral[50],
        border: colors.neutral[600],
        buttonFg: colors.neutral[400],
        closeFg: colors.neutral[300],
      },
      primary: {
        bg: colors.neutral[900],
        fg: colors.neutral[50],
        titleBarBg: colors.neutral[300],
        titleBarFg: colors.neutral[900],
        border: colors.neutral[400],
        buttonFg: 'rgba(23, 23, 23, 0.8)',
        closeFg: colors.neutral[900],
      },
      success: {
        bg: colors.neutral[900],
        fg: colors.neutral[50],
        titleBarBg: colors.neutral[400],
        titleBarFg: colors.neutral[900],
        border: colors.neutral[500],
        buttonFg: 'rgba(23, 23, 23, 0.8)',
        closeFg: colors.neutral[900],
      },
      warning: {
        bg: colors.neutral[900],
        fg: colors.neutral[50],
        titleBarBg: colors.neutral[500],
        titleBarFg: colors.neutral[900],
        border: colors.neutral[600],
        buttonFg: 'rgba(23, 23, 23, 0.8)',
        closeFg: colors.neutral[900],
      },
      danger: {
        bg: colors.neutral[900],
        fg: colors.neutral[50],
        titleBarBg: colors.neutral[300],
        titleBarFg: colors.neutral[900],
        border: colors.neutral[400],
        buttonFg: 'rgba(23, 23, 23, 0.8)',
        closeFg: colors.neutral[900],
      },
    },
  },

  borderRadius: 'none',
});

export default monochromeTheme;
