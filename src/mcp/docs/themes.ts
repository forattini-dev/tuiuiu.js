/**
 * Themes Documentation
 */

import type { ComponentDoc, ThemeDoc } from '../types.js';

export const themeSystem: ComponentDoc = {
  name: 'Theme System',
  category: 'utils',
  description: 'Global theming with 11 built-in themes, semantic colors with auto-contrast, and component tokens.',
  props: [
    { name: 'resolveColor(name)', type: "function", required: false, description: 'Resolve semantic color: primary, success, warning, error, info, background, foreground, muted, mutedForeground' },
    { name: 'primaryForeground', type: "semantic", required: false, description: 'Auto-contrast text color for primary background (returns white or black)' },
    { name: 'successForeground', type: "semantic", required: false, description: 'Auto-contrast text color for success background' },
    { name: 'warningForeground', type: "semantic", required: false, description: 'Auto-contrast text color for warning background' },
    { name: 'dangerForeground', type: "semantic", required: false, description: 'Auto-contrast text color for danger/error background' },
    { name: 'theme.palette.primary[500]', type: "ColorScale", required: false, description: 'Color scales 50-900 for primary, secondary, success, warning, danger, neutral' },
    { name: 'theme.background', type: "hierarchy", required: false, description: 'Background levels: lowest, base, subtle, surface, raised, elevated, popover, overlay' },
    { name: 'theme.foreground', type: "hierarchy", required: false, description: 'Foreground levels: primary, secondary, muted, disabled, inverse' },
    { name: 'theme.accents', type: "object", required: false, description: 'Accent colors: positive, warning, critical, info, highlight' },
    { name: 'theme.components', type: "tokens", required: false, description: 'Component tokens: button, panel, tabs, modal, badge, etc.' },
  ],
  examples: [
    `// Use semantic colors (recommended)\nText({ color: resolveColor('primary') }, 'Primary')\nText({ color: resolveColor('success') }, 'Success')`,
    `// Auto-contrast for text on colored backgrounds\nBox({ backgroundColor: resolveColor('primary') },\n  Text({ color: resolveColor('primaryForeground') }, 'Always readable!')\n)`,
    `// Switch and cycle themes\nsetTheme(themes.dracula);\nconst next = getNextTheme(useTheme());\nsetTheme(next);`,
    `// Direct theme access\nconst theme = useTheme();\ntheme.palette.primary[500]; // Color scale\ntheme.background.surface; // Background hierarchy`,
  ],
};

export const availableThemes: ThemeDoc[] = [
  { name: 'darkTheme', description: 'Default dark theme (slate/blue)', colors: { primary: '#3b82f6', background: '#0f172a' } },
  { name: 'lightTheme', description: 'Clean light theme', colors: { primary: '#2563eb', background: '#ffffff' } },
  { name: 'monokaiTheme', description: 'Classic Monokai (green accents)', colors: { primary: '#a6e22e', background: '#272822' } },
  { name: 'draculaTheme', description: 'Dracula purple-pink theme', colors: { primary: '#bd93f9', background: '#282a36' } },
  { name: 'nordTheme', description: 'Arctic-inspired blue palette', colors: { primary: '#88c0d0', background: '#2e3440' } },
  { name: 'solarizedDarkTheme', description: 'Solarized Dark by Ethan Schoonover', colors: { primary: '#268bd2', background: '#002b36' } },
  { name: 'gruvboxTheme', description: 'Retro groove with warm colors', colors: { primary: '#fabd2f', background: '#282828' } },
  { name: 'tokyoNightTheme', description: 'Tokyo city lights inspired', colors: { primary: '#7aa2f7', background: '#1a1b26' } },
  { name: 'catppuccinTheme', description: 'Catppuccin Mocha (soothing pastel)', colors: { primary: '#cba6f7', background: '#1e1e2e' } },
  { name: 'highContrastDarkTheme', description: 'High contrast for accessibility', colors: { primary: '#00ff00', background: '#000000' } },
  { name: 'monochromeTheme', description: 'Grayscale only, no colors', colors: { primary: '#ffffff', background: '#1a1a1a' } },
];

export const customThemeGuide = `# Creating Custom Themes in Tuiuiu

Tuiuiu provides two approaches for creating custom themes:

## 1. Quick Customization with \`createTheme\`

Extend an existing theme with partial overrides. Perfect for simple color tweaks.

\`\`\`typescript
import { createTheme, darkTheme, setTheme } from 'tuiuiu.js';

// Create a custom theme by extending darkTheme
const myTheme = createTheme(darkTheme, {
  name: 'my-brand',

  // Override just the colors you need
  accents: {
    ...darkTheme.accents,
    positive: '#10b981',  // Custom success color
    highlight: '#8b5cf6', // Custom primary highlight
  },

  // Override background hierarchy
  background: {
    ...darkTheme.background,
    base: '#1a1a2e',
    surface: '#252538',
  },
});

setTheme(myTheme);
\`\`\`

## 2. Full Theme Definition with \`defineTheme\`

Create a complete theme from scratch with full control.

## 3. Merge Themes with \`mergeThemes\`

Deep merge for more complex overrides including component tokens.

\`\`\`typescript
import { mergeThemes, darkTheme, setTheme } from 'tuiuiu.js';

const customTheme = mergeThemes(darkTheme, {
  name: 'custom-dark',
  components: {
    button: {
      primary: {
        bg: '#8b5cf6',
        hoverBg: '#a78bfa',
      },
    },
  },
});

setTheme(customTheme);
\`\`\`

## Theme API Reference

| Function | Description |
|----------|-------------|
| \`setTheme(theme)\` | Set the global theme |
| \`useTheme()\` | Get current theme (reactive) |
| \`getTheme()\` | Get current theme (non-reactive) |
| \`pushTheme(theme)\` | Push theme onto stack (temporary) |
| \`popTheme()\` | Pop theme from stack (restore previous) |
| \`getNextTheme(current)\` | Get next theme in cycle |
| \`getPreviousTheme(current)\` | Get previous theme in cycle |
| \`resolveColor(name)\` | Resolve semantic color to hex |
| \`createTheme(base, overrides)\` | Extend theme (shallow merge) |
| \`mergeThemes(base, overrides)\` | Extend theme (deep merge) |
| \`defineTheme(definition)\` | Create complete theme from scratch |
`;
