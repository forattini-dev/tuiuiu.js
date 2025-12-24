/**
 * Dark Theme
 *
 * Default dark theme with blue primary and slate neutrals.
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

export const darkTheme = defineTheme({
  name: 'dark',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Default dark theme with blue primary and slate neutrals',
  },

  palette,

  background: {
    lowest: colors.slate[950],
    base: colors.slate[900],
    subtle: colors.slate[800],
    surface: colors.slate[700],
    raised: colors.slate[600],
    elevated: colors.slate[500],
    popover: colors.slate[800],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  foreground: {
    primary: colors.slate[50],
    secondary: colors.slate[200],
    muted: colors.slate[400],
    disabled: colors.slate[500],
    inverse: {
      base: '#ffffff',
      soft: 'rgba(255, 255, 255, 0.6)',
      subtle: 'rgba(255, 255, 255, 0.35)',
    },
  },

  accents: {
    positive: palette.success[500],
    warning: palette.warning[500],
    critical: palette.danger[500],
    info: colors.cyan[500],
    highlight: palette.primary[500],
  },

  states: {
    hover: {
      bg: 'rgba(255, 255, 255, 0.05)',
      fg: null,
    },
    active: {
      bg: 'rgba(255, 255, 255, 0.1)',
    },
    focus: {
      border: palette.primary[400],
      ring: {
        color: palette.primary[500],
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: colors.slate[800],
      fg: colors.slate[500],
    },
    selected: {
      bg: palette.primary[700],
      fg: '#ffffff',
    },
  },

  borders: {
    default: colors.slate[700],
    subtle: colors.slate[800],
    strong: colors.slate[500],
    accent: palette.primary[500],
    danger: palette.danger[500],
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
        bg: palette.primary[500],
        fg: '#ffffff',
        hoverBg: palette.primary[400],
        activeBg: palette.primary[600],
        border: 'transparent',
      },
      secondary: {
        bg: colors.slate[700],
        fg: colors.slate[50],
        hoverBg: colors.slate[600],
        activeBg: colors.slate[800],
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: palette.primary[400],
        hoverBg: 'rgba(255, 255, 255, 0.05)',
        activeBg: 'rgba(255, 255, 255, 0.1)',
        border: palette.primary[500],
      },
      ghost: {
        bg: 'transparent',
        fg: colors.slate[50],
        hoverBg: 'rgba(255, 255, 255, 0.05)',
        activeBg: 'rgba(255, 255, 255, 0.1)',
        border: 'transparent',
      },
    },

    panel: {
      bg: colors.slate[800],
      headerBg: colors.slate[700],
      footerBg: colors.slate[700],
      border: colors.slate[700],
    },

    menu: {
      bg: colors.slate[800],
      border: colors.slate[700],
      item: {
        fg: colors.slate[50],
        hoverBg: colors.slate[700],
        activeBg: palette.primary[700],
        selectedBg: palette.primary[600],
        disabledFg: colors.slate[500],
      },
    },

    tabs: {
      bg: colors.slate[800],
      border: colors.slate[700],
      tab: {
        fg: colors.slate[400],
        activeFg: colors.slate[50],
        activeBg: colors.slate[700],
        hoverFg: colors.slate[200],
        indicator: palette.primary[500],
      },
    },

    dropdown: {
      bg: colors.slate[800],
      border: colors.slate[700],
      item: {
        fg: colors.slate[50],
        hoverBg: colors.slate[700],
        selectedBg: palette.primary[700],
      },
    },

    input: {
      bg: colors.slate[800],
      fg: colors.slate[50],
      placeholder: colors.slate[500],
      border: colors.slate[700],
      focusBorder: palette.primary[500],
      invalidBorder: palette.danger[500],
    },

    checkbox: {
      bg: colors.slate[800],
      border: colors.slate[600],
      checkColor: '#ffffff',
      checkedBg: palette.primary[500],
    },

    radio: {
      bg: colors.slate[800],
      dotColor: palette.primary[500],
      border: colors.slate[600],
      checkedBorder: palette.primary[500],
    },

    tooltip: {
      bg: colors.slate[700],
      fg: colors.slate[50],
    },

    modal: {
      bg: colors.slate[800],
      border: colors.slate[700],
      overlay: 'rgba(0, 0, 0, 0.7)',
    },

    badge: {
      default: {
        bg: colors.slate[700],
        fg: colors.slate[50],
      },
      success: {
        bg: palette.success[500],
        fg: '#ffffff',
      },
      warning: {
        bg: palette.warning[500],
        fg: colors.slate[900],
      },
      danger: {
        bg: palette.danger[500],
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: colors.slate[800],
        selectedBg: palette.primary[700],
        fg: colors.slate[50],
      },
    },

    header: {
      default: {
        bg: colors.slate[800],
        fg: colors.slate[50],
        titleFg: colors.slate[50],
        subtitleFg: colors.slate[400],
        border: colors.slate[700],
      },
      primary: {
        bg: palette.primary[600],
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: palette.primary[700],
      },
      secondary: {
        bg: colors.slate[700],
        fg: colors.slate[50],
        titleFg: colors.slate[50],
        subtitleFg: colors.slate[400],
        border: colors.slate[600],
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
        bg: colors.slate[800],
        fg: colors.slate[400],
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
        bg: colors.slate[900],
        titleFg: colors.slate[50],
        subtitleFg: colors.slate[400],
        border: colors.slate[700],
      },
      primary: {
        bg: colors.slate[900],
        titleFg: palette.primary[400],
        subtitleFg: colors.slate[400],
        border: palette.primary[700],
      },
      secondary: {
        bg: colors.slate[900],
        titleFg: colors.slate[200],
        subtitleFg: colors.slate[500],
        border: colors.slate[700],
      },
    },

    appshell: {
      bg: colors.slate[950],
      dividerFg: colors.slate[700],
      sidebarBg: colors.slate[900],
      asideBg: colors.slate[900],
    },

    collapsible: {
      default: {
        headerBg: colors.slate[800],
        headerFg: colors.slate[50],
        contentBg: colors.slate[900],
        border: colors.slate[700],
        iconFg: colors.slate[400],
      },
      primary: {
        headerBg: palette.primary[700],
        headerFg: '#ffffff',
        contentBg: colors.slate[900],
        border: palette.primary[600],
        iconFg: 'rgba(255, 255, 255, 0.8)',
      },
      secondary: {
        headerBg: colors.slate[700],
        headerFg: colors.slate[50],
        contentBg: colors.slate[800],
        border: colors.slate[600],
        iconFg: colors.slate[400],
      },
    },

    commandPalette: {
      bg: colors.slate[800],
      border: colors.slate[700],
      inputBg: colors.slate[900],
      inputFg: colors.slate[50],
      inputPlaceholder: colors.slate[500],
      itemFg: colors.slate[50],
      itemHoverBg: colors.slate[700],
      itemSelectedBg: palette.primary[700],
      itemSelectedFg: '#ffffff',
      highlightFg: palette.primary[400],
      categoryFg: colors.slate[500],
    },

    splitPanel: {
      bg: colors.slate[900],
      dividerBg: colors.slate[700],
      dividerHoverBg: colors.slate[600],
      dividerActiveBg: palette.primary[500],
      border: colors.slate[700],
      titleFg: colors.slate[400],
    },
    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: palette.success[600],
        iconFg: palette.success[400],
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: palette.danger[600],
        iconFg: palette.danger[400],
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: palette.warning[500],
        iconFg: palette.warning[400],
      },
      info: {
        bg: colors.cyan[900],
        fg: colors.cyan[100],
        border: colors.cyan[600],
        iconFg: colors.cyan[400],
      },
    },
    window: {
      default: {
        bg: colors.slate[900],
        fg: colors.slate[100],
        titleBarBg: colors.slate[800],
        titleBarFg: colors.slate[100],
        border: colors.slate[700],
        buttonFg: colors.slate[400],
        closeFg: palette.danger[500],
      },
      primary: {
        bg: colors.slate[900],
        fg: colors.slate[100],
        titleBarBg: palette.primary[600],
        titleBarFg: '#ffffff',
        border: palette.primary[700],
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
      success: {
        bg: colors.slate[900],
        fg: colors.slate[100],
        titleBarBg: palette.success[600],
        titleBarFg: '#ffffff',
        border: palette.success[700],
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
      warning: {
        bg: colors.slate[900],
        fg: colors.slate[100],
        titleBarBg: palette.warning[500],
        titleBarFg: colors.slate[900],
        border: palette.warning[600],
        buttonFg: colors.slate[700],
        closeFg: colors.slate[900],
      },
      danger: {
        bg: colors.slate[900],
        fg: colors.slate[100],
        titleBarBg: palette.danger[600],
        titleBarFg: '#ffffff',
        border: palette.danger[700],
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default darkTheme;
