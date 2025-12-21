/**
 * Tailwind CSS Color Palette
 *
 * Complete color palette with all Tailwind colors and shades.
 * Each color has shades from 50 (lightest) to 950 (darkest).
 */

// =============================================================================
// Color Shade Type
// =============================================================================

export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

// =============================================================================
// Base Colors
// =============================================================================

export const white = '#ffffff';
export const black = '#000000';
export const transparent = 'transparent';

// =============================================================================
// Neutral Colors
// =============================================================================

export const slate: ColorPalette = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

export const gray: ColorPalette = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  950: '#030712',
};

export const zinc: ColorPalette = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#09090b',
};

export const neutral: ColorPalette = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
};

export const stone: ColorPalette = {
  50: '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
  950: '#0c0a09',
};

// =============================================================================
// Color Palette
// =============================================================================

export const red: ColorPalette = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
};

export const orange: ColorPalette = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
  950: '#431407',
};

export const amber: ColorPalette = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
};

export const yellow: ColorPalette = {
  50: '#fefce8',
  100: '#fef9c3',
  200: '#fef08a',
  300: '#fde047',
  400: '#facc15',
  500: '#eab308',
  600: '#ca8a04',
  700: '#a16207',
  800: '#854d0e',
  900: '#713f12',
  950: '#422006',
};

export const lime: ColorPalette = {
  50: '#f7fee7',
  100: '#ecfccb',
  200: '#d9f99d',
  300: '#bef264',
  400: '#a3e635',
  500: '#84cc16',
  600: '#65a30d',
  700: '#4d7c0f',
  800: '#3f6212',
  900: '#365314',
  950: '#1a2e05',
};

export const green: ColorPalette = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16',
};

export const emerald: ColorPalette = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
};

export const teal: ColorPalette = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6',
  600: '#0d9488',
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
  950: '#042f2e',
};

export const cyan: ColorPalette = {
  50: '#ecfeff',
  100: '#cffafe',
  200: '#a5f3fc',
  300: '#67e8f9',
  400: '#22d3ee',
  500: '#06b6d4',
  600: '#0891b2',
  700: '#0e7490',
  800: '#155e75',
  900: '#164e63',
  950: '#083344',
};

export const sky: ColorPalette = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
  950: '#082f49',
};

export const blue: ColorPalette = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
};

export const indigo: ColorPalette = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
  950: '#1e1b4b',
};

export const violet: ColorPalette = {
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
  600: '#7c3aed',
  700: '#6d28d9',
  800: '#5b21b6',
  900: '#4c1d95',
  950: '#2e1065',
};

export const purple: ColorPalette = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',
  600: '#9333ea',
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87',
  950: '#3b0764',
};

export const fuchsia: ColorPalette = {
  50: '#fdf4ff',
  100: '#fae8ff',
  200: '#f5d0fe',
  300: '#f0abfc',
  400: '#e879f9',
  500: '#d946ef',
  600: '#c026d3',
  700: '#a21caf',
  800: '#86198f',
  900: '#701a75',
  950: '#4a044e',
};

export const pink: ColorPalette = {
  50: '#fdf2f8',
  100: '#fce7f3',
  200: '#fbcfe8',
  300: '#f9a8d4',
  400: '#f472b6',
  500: '#ec4899',
  600: '#db2777',
  700: '#be185d',
  800: '#9d174d',
  900: '#831843',
  950: '#500724',
};

export const rose: ColorPalette = {
  50: '#fff1f2',
  100: '#ffe4e6',
  200: '#fecdd3',
  300: '#fda4af',
  400: '#fb7185',
  500: '#f43f5e',
  600: '#e11d48',
  700: '#be123c',
  800: '#9f1239',
  900: '#881337',
  950: '#4c0519',
};

// =============================================================================
// Colors Object (for easy access)
// =============================================================================

export const colors = {
  // Base
  white,
  black,
  transparent,

  // Neutrals
  slate,
  gray,
  zinc,
  neutral,
  stone,

  // Colors
  red,
  orange,
  amber,
  yellow,
  lime,
  green,
  emerald,
  teal,
  cyan,
  sky,
  blue,
  indigo,
  violet,
  purple,
  fuchsia,
  pink,
  rose,
} as const;

export type ColorName = keyof typeof colors;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get a color value by name and shade
 *
 * @example
 * color('blue', 500) // '#3b82f6'
 * color('gray', 100) // '#f3f4f6'
 * color('red')       // '#ef4444' (default shade 500)
 */
export function color(name: string, shade: ColorShade = 500): string {
  const palette = colors[name as keyof typeof colors];

  if (!palette) {
    return name; // Return as-is if not a known color
  }

  if (typeof palette === 'string') {
    return palette; // white, black, transparent
  }

  return (palette as ColorPalette)[shade] ?? (palette as ColorPalette)[500];
}

/**
 * Parse a color string in format "colorName-shade"
 *
 * @example
 * parseColor('blue-500') // { name: 'blue', shade: 500, value: '#3b82f6' }
 * parseColor('gray-100') // { name: 'gray', shade: 100, value: '#f3f4f6' }
 * parseColor('#fff')     // null (not a Tailwind color)
 */
export function parseColor(colorString: string): { name: string; shade: ColorShade; value: string } | null {
  const match = colorString.match(/^([a-z]+)-(\d+)$/);
  if (!match) return null;

  const [, name, shadeStr] = match;
  const shade = parseInt(shadeStr, 10) as ColorShade;

  const palette = colors[name as keyof typeof colors];
  if (!palette || typeof palette === 'string') return null;

  const value = (palette as ColorPalette)[shade];
  if (!value) return null;

  return { name, shade, value };
}

/**
 * Get all shades of a color as an array
 *
 * @example
 * getShades('blue') // ['#eff6ff', '#dbeafe', ..., '#172554']
 */
export function getShades(name: string): string[] {
  const palette = colors[name as keyof typeof colors];
  if (!palette || typeof palette === 'string') return [];

  return [
    (palette as ColorPalette)[50],
    (palette as ColorPalette)[100],
    (palette as ColorPalette)[200],
    (palette as ColorPalette)[300],
    (palette as ColorPalette)[400],
    (palette as ColorPalette)[500],
    (palette as ColorPalette)[600],
    (palette as ColorPalette)[700],
    (palette as ColorPalette)[800],
    (palette as ColorPalette)[900],
    (palette as ColorPalette)[950],
  ];
}

/**
 * List all available color names
 */
export function listColors(): string[] {
  return Object.keys(colors);
}

/**
 * List all available shades
 */
export function listShades(): ColorShade[] {
  return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
}
