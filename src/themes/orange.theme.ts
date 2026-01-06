/**
 * Orange Theme - Tuiuiu Player Edition
 *
 * A warm, vibrant orange theme perfect for music players.
 */

import { defineTheme } from '../core/theme-loader.js';

// =============================================================================
// Orange Colors
// =============================================================================

const orange = {
  background: '#1A1008',       // Deep dark brown/orange
  currentLine: '#2D1A0E',      // Slightly lighter
  foreground: '#FFF5E6',       // Warm white
  comment: '#B87333',          // Copper/muted orange
  cyan: '#89CFF0',             // Baby blue (contrast)
  green: '#98FB98',            // Pale green
  orange: '#FF8C00',           // Dark orange - main accent!
  yellow: '#FFD700',           // Gold
  red: '#FF6347',              // Tomato red
  amber: '#FFBF00',            // Amber
  tangerine: '#FF9966',        // Tangerine
  rust: '#B7410E',             // Rust
  peach: '#FFCBA4',            // Peach
  fire: '#FF4500',             // Orange red
};

// =============================================================================
// Palette
// =============================================================================

const palette = {
  primary: {
    50: '#FFF5E6',
    100: '#FFE4C4',
    200: '#FFD39B',
    300: '#FFC372',
    400: '#FFB347',
    500: '#FF8C00',
    600: '#E07800',
    700: '#C06400',
    800: '#A05000',
    900: '#803C00',
  },
  secondary: {
    50: '#FFFAF0',
    100: '#FFEFD5',
    200: '#FFE4B5',
    300: '#FFD700',
    400: '#FFC125',
    500: '#FFBF00',
    600: '#DAA520',
    700: '#B8860B',
    800: '#8B6914',
    900: '#6B4C1E',
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
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
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  neutral: {
    50: '#FFF5E6',
    100: '#FFE4C4',
    200: '#E8C4A4',
    300: '#D1A484',
    400: '#BA8464',
    500: '#A36444',
    600: '#8C4424',
    700: '#752404',
    800: '#5E1400',
    900: '#470400',
  },
};

// =============================================================================
// Theme Definition
// =============================================================================

export const orangeTheme = defineTheme({
  name: 'orange',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'tuiuiu',
    description: 'Warm orange theme - Tuiuiu Player Edition',
  },

  palette,

  background: {
    lowest: '#0D0804',
    base: orange.background,
    subtle: orange.currentLine,
    surface: '#3D2A1E',
    raised: '#4D3628',
    elevated: '#5D4232',
    popover: orange.currentLine,
    overlay: 'rgba(26, 16, 8, 0.85)',
  },

  foreground: {
    primary: orange.foreground,
    secondary: '#FFE4C4',
    muted: orange.comment,
    disabled: '#5D4232',
    inverse: {
      base: orange.background,
      soft: 'rgba(26, 16, 8, 0.8)',
      subtle: 'rgba(26, 16, 8, 0.6)',
    },
  },

  accents: {
    positive: orange.green,
    warning: orange.yellow,
    critical: orange.red,
    info: orange.cyan,
    highlight: orange.orange,
  },

  states: {
    hover: {
      bg: 'rgba(255, 140, 0, 0.15)',
      fg: null,
    },
    active: {
      bg: 'rgba(255, 140, 0, 0.25)',
    },
    focus: {
      border: orange.orange,
      ring: {
        color: orange.orange,
        width: 2,
      },
    },
    disabled: {
      opacity: 0.4,
      bg: orange.currentLine,
      fg: '#5D4232',
    },
    selected: {
      bg: '#4D3628',
      fg: orange.foreground,
    },
  },

  borders: {
    default: orange.comment,
    subtle: orange.currentLine,
    strong: orange.orange,
    accent: orange.orange,
    danger: orange.red,
  },

  opacity: {
    disabled: 0.4,
    muted: 0.7,
    overlay: 0.85,
    ghost: 0.2,
  },

  components: {
    button: {
      primary: {
        bg: orange.orange,
        fg: '#ffffff',
        hoverBg: '#FFA033',
        activeBg: '#E07800',
        border: 'transparent',
      },
      secondary: {
        bg: orange.currentLine,
        fg: orange.foreground,
        hoverBg: '#3D2A1E',
        activeBg: '#4D3628',
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: orange.orange,
        hoverBg: 'rgba(255, 140, 0, 0.15)',
        activeBg: 'rgba(255, 140, 0, 0.25)',
        border: orange.orange,
      },
      ghost: {
        bg: 'transparent',
        fg: orange.foreground,
        hoverBg: 'rgba(255, 255, 255, 0.1)',
        activeBg: 'rgba(255, 255, 255, 0.2)',
        border: 'transparent',
      },
    },

    panel: {
      bg: orange.currentLine,
      headerBg: '#3D2A1E',
      footerBg: '#3D2A1E',
      border: orange.comment,
    },

    menu: {
      bg: orange.currentLine,
      border: orange.comment,
      item: {
        fg: orange.foreground,
        hoverBg: '#3D2A1E',
        activeBg: '#4D3628',
        selectedBg: '#4D3628',
        disabledFg: '#5D4232',
      },
    },

    tabs: {
      bg: orange.currentLine,
      border: orange.comment,
      tab: {
        fg: orange.comment,
        activeFg: orange.foreground,
        activeBg: orange.background,
        hoverFg: '#FFE4C4',
        indicator: orange.orange,
      },
    },

    dropdown: {
      bg: orange.currentLine,
      border: orange.comment,
      item: {
        fg: orange.foreground,
        hoverBg: '#3D2A1E',
        selectedBg: '#4D3628',
      },
    },

    input: {
      bg: orange.currentLine,
      fg: orange.foreground,
      placeholder: orange.comment,
      border: orange.comment,
      focusBorder: orange.orange,
      invalidBorder: orange.red,
    },

    checkbox: {
      bg: orange.currentLine,
      border: orange.comment,
      checkColor: orange.foreground,
      checkedBg: orange.orange,
    },

    radio: {
      bg: orange.currentLine,
      dotColor: orange.orange,
      border: orange.comment,
      checkedBorder: orange.orange,
    },

    tooltip: {
      bg: '#4D3628',
      fg: orange.foreground,
    },

    modal: {
      bg: orange.currentLine,
      border: orange.comment,
      overlay: 'rgba(26, 16, 8, 0.85)',
    },

    badge: {
      default: {
        bg: orange.comment,
        fg: orange.foreground,
      },
      success: {
        bg: orange.green,
        fg: orange.background,
      },
      warning: {
        bg: orange.yellow,
        fg: orange.background,
      },
      danger: {
        bg: orange.red,
        fg: '#ffffff',
      },
    },

    list: {
      item: {
        bg: 'transparent',
        hoverBg: orange.currentLine,
        selectedBg: '#4D3628',
        fg: orange.foreground,
      },
    },

    header: {
      default: {
        bg: orange.currentLine,
        fg: orange.foreground,
        titleFg: orange.foreground,
        subtitleFg: orange.comment,
        border: orange.comment,
      },
      primary: {
        bg: orange.orange,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.85)',
        border: '#FFA033',
      },
      secondary: {
        bg: '#4D3628',
        fg: orange.foreground,
        titleFg: orange.foreground,
        subtitleFg: orange.comment,
        border: '#5D4232',
      },
      success: {
        bg: orange.green,
        fg: orange.background,
        titleFg: orange.background,
        subtitleFg: 'rgba(26, 16, 8, 0.8)',
        border: '#16A34A',
      },
      warning: {
        bg: orange.yellow,
        fg: orange.background,
        titleFg: orange.background,
        subtitleFg: 'rgba(26, 16, 8, 0.7)',
        border: orange.amber,
      },
      danger: {
        bg: orange.red,
        fg: '#ffffff',
        titleFg: '#ffffff',
        subtitleFg: 'rgba(255, 255, 255, 0.8)',
        border: '#E11D48',
      },
    },

    statusbar: {
      default: {
        bg: orange.currentLine,
        fg: orange.comment,
      },
      primary: {
        bg: orange.orange,
        fg: '#ffffff',
      },
      info: {
        bg: orange.cyan,
        fg: orange.background,
      },
      success: {
        bg: orange.green,
        fg: orange.background,
      },
      warning: {
        bg: orange.yellow,
        fg: orange.background,
      },
      danger: {
        bg: orange.red,
        fg: '#ffffff',
      },
    },

    page: {
      default: {
        bg: orange.background,
        titleFg: orange.foreground,
        subtitleFg: orange.comment,
        border: orange.comment,
      },
      primary: {
        bg: orange.background,
        titleFg: orange.orange,
        subtitleFg: orange.comment,
        border: orange.orange,
      },
      secondary: {
        bg: orange.background,
        titleFg: '#FFE4C4',
        subtitleFg: orange.comment,
        border: orange.currentLine,
      },
    },

    appshell: {
      bg: '#0D0804',
      dividerFg: orange.comment,
      sidebarBg: orange.background,
      asideBg: orange.background,
    },

    collapsible: {
      default: {
        headerBg: orange.currentLine,
        headerFg: orange.foreground,
        contentBg: orange.background,
        border: orange.comment,
        iconFg: orange.comment,
      },
      primary: {
        headerBg: '#4D3628',
        headerFg: orange.orange,
        contentBg: orange.background,
        border: orange.orange,
        iconFg: orange.orange,
      },
      secondary: {
        headerBg: '#4D3628',
        headerFg: orange.foreground,
        contentBg: orange.currentLine,
        border: '#5D4232',
        iconFg: orange.comment,
      },
    },

    commandPalette: {
      bg: orange.currentLine,
      border: orange.comment,
      inputBg: orange.background,
      inputFg: orange.foreground,
      inputPlaceholder: orange.comment,
      itemFg: orange.foreground,
      itemHoverBg: '#3D2A1E',
      itemSelectedBg: '#4D3628',
      itemSelectedFg: orange.foreground,
      highlightFg: orange.orange,
      categoryFg: orange.comment,
    },

    splitPanel: {
      bg: orange.background,
      dividerBg: orange.comment,
      dividerHoverBg: '#4D3628',
      dividerActiveBg: orange.orange,
      border: orange.comment,
      titleFg: orange.comment,
    },

    toast: {
      success: {
        bg: palette.success[900],
        fg: palette.success[100],
        border: orange.green,
        iconFg: orange.green,
      },
      error: {
        bg: palette.danger[900],
        fg: palette.danger[100],
        border: orange.red,
        iconFg: orange.red,
      },
      warning: {
        bg: palette.warning[900],
        fg: palette.warning[100],
        border: orange.yellow,
        iconFg: orange.yellow,
      },
      info: {
        bg: '#0E4A5C',
        fg: '#CFFAFE',
        border: orange.cyan,
        iconFg: orange.cyan,
      },
    },

    window: {
      default: {
        bg: orange.background,
        fg: orange.foreground,
        titleBarBg: orange.currentLine,
        titleBarFg: orange.foreground,
        border: orange.comment,
        buttonFg: orange.comment,
        closeFg: orange.red,
      },
      primary: {
        bg: orange.background,
        fg: orange.foreground,
        titleBarBg: orange.orange,
        titleBarFg: '#ffffff',
        border: '#FFA033',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
      success: {
        bg: orange.background,
        fg: orange.foreground,
        titleBarBg: orange.green,
        titleBarFg: orange.background,
        border: '#16A34A',
        buttonFg: 'rgba(26, 16, 8, 0.8)',
        closeFg: orange.background,
      },
      warning: {
        bg: orange.background,
        fg: orange.foreground,
        titleBarBg: orange.yellow,
        titleBarFg: orange.background,
        border: orange.amber,
        buttonFg: 'rgba(26, 16, 8, 0.8)',
        closeFg: orange.background,
      },
      danger: {
        bg: orange.background,
        fg: orange.foreground,
        titleBarBg: orange.red,
        titleBarFg: '#ffffff',
        border: '#E11D48',
        buttonFg: 'rgba(255, 255, 255, 0.8)',
        closeFg: '#ffffff',
      },
    },
  },
});

export default orangeTheme;
