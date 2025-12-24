/**
 * Light Theme
 *
 * Light background theme with blue primary and slate neutrals.
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
};

// =============================================================================
// Theme Definition
// =============================================================================

export const lightTheme = defineTheme({
  name: 'light',
  mode: 'light',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Light background theme with blue primary and slate neutrals',
  },

  palette,

  background: {
    lowest: colors.slate[100],
    base: '#ffffff',
    subtle: colors.slate[50],
    surface: '#ffffff',
    raised: colors.slate[100],
    elevated: colors.slate[200],
    popover: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  foreground: {
    primary: colors.slate[950],
    secondary: colors.slate[700],
    muted: colors.slate[500],
    disabled: colors.slate[400],
    inverse: {
      base: '#ffffff',
      soft: 'rgba(255, 255, 255, 0.8)',
      subtle: 'rgba(255, 255, 255, 0.6)',
    },
  },

  accents: {
    positive: colors.green[600],
    warning: colors.amber[600],
    critical: colors.red[600],
    info: colors.cyan[600],
    highlight: palette.primary[600],
  },

  states: {
    hover: {
      bg: 'rgba(0, 0, 0, 0.05)',
      fg: null,
    },
    active: {
      bg: 'rgba(0, 0, 0, 0.1)',
    },
    focus: {
      border: palette.primary[600],
      ring: {
        color: palette.primary[600],
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: colors.slate[100],
      fg: colors.slate[400],
    },
    selected: {
      bg: palette.primary[100],
      fg: palette.primary[900],
    },
  },

  borders: {
    default: colors.slate[200],
    subtle: colors.slate[100],
    strong: colors.slate[300],
    accent: palette.primary[600],
    danger: palette.danger[600],
  },

  opacity: {
    disabled: 0.4,
    muted: 0.7,
    overlay: 0.5,
    ghost: 0.2,
  },

  components: {
    button: {
      primary: {
        bg: palette.primary[600],
        fg: '#ffffff',
        hoverBg: palette.primary[700],
        activeBg: palette.primary[800],
        border: 'transparent',
      },
      secondary: {
        bg: colors.slate[100],
        fg: colors.slate[900],
        hoverBg: colors.slate[200],
        activeBg: colors.slate[300],
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: palette.primary[600],
        hoverBg: palette.primary[50],
        activeBg: palette.primary[100],
        border: palette.primary[600],
      },
      ghost: {
        bg: 'transparent',
        fg: colors.slate[900],
        hoverBg: 'rgba(0, 0, 0, 0.05)',
        activeBg: 'rgba(0, 0, 0, 0.1)',
        border: 'transparent',
      },
    },

    panel: {
      bg: '#ffffff',
      headerBg: colors.slate[50],
      footerBg: colors.slate[50],
      border: colors.slate[200],
    },

    menu: {
      bg: '#ffffff',
      border: colors.slate[200],
      item: {
        fg: colors.slate[900],
        hoverBg: colors.slate[100],
        activeBg: palette.primary[100],
        selectedBg: palette.primary[50],
        disabledFg: colors.slate[400],
      },
    },

    tabs: {
      bg: '#ffffff',
      border: colors.slate[200],
      tab: {
        fg: colors.slate[600],
        activeFg: colors.slate[900],
        activeBg: '#ffffff',
        hoverFg: colors.slate[900],
        indicator: palette.primary[600],
      },
    },

    dropdown: {
      bg: '#ffffff',
      border: colors.slate[200],
      item: {
        fg: colors.slate[900],
        hoverBg: colors.slate[100],
        selectedBg: palette.primary[100],
      },
    },

    input: {
      bg: '#ffffff',
      fg: colors.slate[900],
      placeholder: colors.slate[400],
      border: colors.slate[300],
      focusBorder: palette.primary[600],
      invalidBorder: palette.danger[600],
    },

    checkbox: {
      bg: '#ffffff',
      border: colors.slate[300],
      checkColor: '#ffffff',
      checkedBg: palette.primary[600],
    },

    radio: {
      bg: '#ffffff',
      dotColor: palette.primary[600],
      border: colors.slate[300],
      checkedBorder: palette.primary[600],
    },

    tooltip: {
      bg: colors.slate[900],
      fg: colors.slate[50],
    },

    modal: {
      bg: '#ffffff',
      border: colors.slate[200],
      overlay: 'rgba(0, 0, 0, 0.5)',
    },

    badge: {
      default: {
        bg: colors.slate[100],
        fg: colors.slate[700],
      },
      success: {
        bg: palette.success[100],
        fg: palette.success[800],
      },
      warning: {
        bg: palette.warning[100],
        fg: palette.warning[800],
      },
      danger: {
        bg: palette.danger[100],
        fg: palette.danger[800],
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: colors.slate[50],
        selectedBg: palette.primary[100],
        fg: colors.slate[900],
      },
    },

    header: {
      default: {
        bg: colors.slate[100],
        fg: colors.slate[900],
        titleFg: colors.slate[900],
        subtitleFg: colors.slate[600],
        border: colors.slate[200],
      },
      primary: {
        bg: palette.primary[600],
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: palette.primary[700],
      },
      secondary: {
        bg: colors.slate[200],
        fg: colors.slate[800],
        titleFg: colors.slate[800],
        subtitleFg: colors.slate[600],
        border: colors.slate[300],
      },
      success: {
        bg: palette.success[600],
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: palette.success[700],
      },
      warning: {
        bg: palette.warning[500],
        fg: colors.slate[900],
        titleFg: colors.slate[900],
        subtitleFg: 'rgba(0, 0, 0, 0.7)',
        border: palette.warning[600],
      },
      danger: {
        bg: palette.danger[600],
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: palette.danger[700],
      },
    },

    statusbar: {
      default: {
        bg: colors.slate[100],
        fg: colors.slate[600],
      },
      primary: {
        bg: palette.primary[600],
        fg: '#ffffff',
      },
      info: {
        bg: colors.cyan[600],
        fg: '#ffffff',
      },
      success: {
        bg: palette.success[600],
        fg: '#ffffff',
      },
      warning: {
        bg: palette.warning[500],
        fg: colors.slate[900],
      },
      danger: {
        bg: palette.danger[600],
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: '#ffffff',
        titleFg: colors.slate[900],
        subtitleFg: colors.slate[600],
        border: colors.slate[200],
      },
      primary: {
        bg: '#ffffff',
        titleFg: palette.primary[700],
        subtitleFg: colors.slate[600],
        border: palette.primary[200],
      },
      secondary: {
        bg: colors.slate[50],
        titleFg: colors.slate[700],
        subtitleFg: colors.slate[500],
        border: colors.slate[200],
      },
    },

    appshell: {
      bg: colors.slate[100],
      dividerFg: colors.slate[300],
      sidebarBg: '#ffffff',
      asideBg: '#ffffff',
    },

    collapsible: {
      default: {
        headerBg: colors.slate[100],
        headerFg: colors.slate[900],
        contentBg: '#ffffff',
        border: colors.slate[200],
        iconFg: colors.slate[600],
      },
      primary: {
        headerBg: palette.primary[100],
        headerFg: palette.primary[900],
        contentBg: '#ffffff',
        border: palette.primary[200],
        iconFg: palette.primary[600],
      },
      secondary: {
        headerBg: colors.slate[200],
        headerFg: colors.slate[800],
        contentBg: colors.slate[50],
        border: colors.slate[300],
        iconFg: colors.slate[600],
      },
    },

    commandPalette: {
      bg: '#ffffff',
      border: colors.slate[200],
      inputBg: colors.slate[50],
      inputFg: colors.slate[900],
      inputPlaceholder: colors.slate[400],
      itemFg: colors.slate[900],
      itemHoverBg: colors.slate[100],
      itemSelectedBg: palette.primary[100],
      itemSelectedFg: palette.primary[900],
      highlightFg: palette.primary[600],
      categoryFg: colors.slate[500],
    },

    splitPanel: {
      bg: '#ffffff',
      dividerBg: colors.slate[200],
      dividerHoverBg: colors.slate[300],
      dividerActiveBg: palette.primary[500],
      border: colors.slate[200],
      titleFg: colors.slate[600],
    },
    toast: {
      success: {
        bg: palette.success[50],
        fg: palette.success[900],
        border: palette.success[200],
        iconFg: palette.success[600],
      },
      error: {
        bg: palette.danger[50],
        fg: palette.danger[900],
        border: palette.danger[200],
        iconFg: palette.danger[600],
      },
      warning: {
        bg: palette.warning[50],
        fg: palette.warning[900],
        border: palette.warning[200],
        iconFg: palette.warning[600],
      },
      info: {
        bg: colors.cyan[50],
        fg: colors.cyan[900],
        border: colors.cyan[200],
        iconFg: colors.cyan[600],
      },
    },
    window: {
      default: {
        bg: '#ffffff',
        fg: colors.slate[900],
        titleBarBg: colors.slate[100],
        titleBarFg: colors.slate[900],
        border: colors.slate[200],
        buttonFg: colors.slate[600],
        closeFg: palette.danger[500],
      },
      primary: {
        bg: '#ffffff',
        fg: colors.slate[900],
        titleBarBg: palette.primary[600],
        titleBarFg: '#ffffff',
        border: palette.primary[200],
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
      success: {
        bg: '#ffffff',
        fg: colors.slate[900],
        titleBarBg: palette.success[600],
        titleBarFg: '#ffffff',
        border: palette.success[200],
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
      warning: {
        bg: '#ffffff',
        fg: colors.slate[900],
        titleBarBg: palette.warning[500],
        titleBarFg: colors.slate[900],
        border: palette.warning[200],
        buttonFg: colors.slate[700],
        closeFg: colors.slate[900],
      },
      danger: {
        bg: '#ffffff',
        fg: colors.slate[900],
        titleBarBg: palette.danger[600],
        titleBarFg: '#ffffff',
        border: palette.danger[200],
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default lightTheme;
