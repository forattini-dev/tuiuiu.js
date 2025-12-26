# Theming

Tuiuiu includes a robust theming system powered by **Signals**, allowing for instant, reactive theme switching without reloading the application.

![Theme Showcase](../recordings/core/theme-showcase.gif)

## Quick Start

```typescript
import { useTheme, setTheme, themes, resolveColor } from 'tuiuiu.js';

// Get current theme
const theme = useTheme();

// Switch themes
setTheme(themes.dracula);

// Use semantic colors (recommended)
Text({ color: resolveColor('primary') }, 'Primary text');
Text({ color: resolveColor('success') }, 'Success text');
```

## Built-in Themes

Tuiuiu comes with **11 professionally designed themes**:

| Theme | Description | Mode |
|-------|-------------|------|
| `themes.dark` | Default dark mode (slate/blue) | Dark |
| `themes.light` | Clean light mode (white/blue) | Light |
| `themes.monokai` | Classic code editor theme (green accents) | Dark |
| `themes.dracula` | Popular purple-pink theme | Dark |
| `themes.nord` | Arctic-inspired blue palette | Dark |
| `themes['solarized-dark']` | Precision color scheme by Ethan Schoonover | Dark |
| `themes.gruvbox` | Retro groove with warm colors | Dark |
| `themes['tokyo-night']` | Inspired by Tokyo city lights | Dark |
| `themes.catppuccin` | Soothing pastel (Mocha variant) | Dark |
| `themes['high-contrast-dark']` | High contrast for accessibility | Dark |
| `themes.monochrome` | Grayscale only, no colors | Dark |

### Theme Color Palette

Each theme defines semantic colors that adapt automatically:

| Theme | Primary | Success | Warning | Error | Info |
|-------|---------|---------|---------|-------|------|
| **dark** | ![#3B82F6](https://via.placeholder.com/15/3B82F6/3B82F6.png) `#3B82F6` | ![#22C55E](https://via.placeholder.com/15/22C55E/22C55E.png) `#22C55E` | ![#F59E0B](https://via.placeholder.com/15/F59E0B/F59E0B.png) `#F59E0B` | ![#EF4444](https://via.placeholder.com/15/EF4444/EF4444.png) `#EF4444` | ![#06B6D4](https://via.placeholder.com/15/06B6D4/06B6D4.png) `#06B6D4` |
| **light** | ![#2563EB](https://via.placeholder.com/15/2563EB/2563EB.png) `#2563EB` | ![#16A34A](https://via.placeholder.com/15/16A34A/16A34A.png) `#16A34A` | ![#D97706](https://via.placeholder.com/15/D97706/D97706.png) `#D97706` | ![#DC2626](https://via.placeholder.com/15/DC2626/DC2626.png) `#DC2626` | ![#0891B2](https://via.placeholder.com/15/0891B2/0891B2.png) `#0891B2` |
| **dracula** | ![#BD93F9](https://via.placeholder.com/15/BD93F9/BD93F9.png) `#BD93F9` | ![#50FA7B](https://via.placeholder.com/15/50FA7B/50FA7B.png) `#50FA7B` | ![#F1FA8C](https://via.placeholder.com/15/F1FA8C/F1FA8C.png) `#F1FA8C` | ![#FF5555](https://via.placeholder.com/15/FF5555/FF5555.png) `#FF5555` | ![#8BE9FD](https://via.placeholder.com/15/8BE9FD/8BE9FD.png) `#8BE9FD` |
| **nord** | ![#88C0D0](https://via.placeholder.com/15/88C0D0/88C0D0.png) `#88C0D0` | ![#A3BE8C](https://via.placeholder.com/15/A3BE8C/A3BE8C.png) `#A3BE8C` | ![#EBCB8B](https://via.placeholder.com/15/EBCB8B/EBCB8B.png) `#EBCB8B` | ![#BF616A](https://via.placeholder.com/15/BF616A/BF616A.png) `#BF616A` | ![#81A1C1](https://via.placeholder.com/15/81A1C1/81A1C1.png) `#81A1C1` |
| **gruvbox** | ![#83A598](https://via.placeholder.com/15/83A598/83A598.png) `#83A598` | ![#B8BB26](https://via.placeholder.com/15/B8BB26/B8BB26.png) `#B8BB26` | ![#FABD2F](https://via.placeholder.com/15/FABD2F/FABD2F.png) `#FABD2F` | ![#FB4934](https://via.placeholder.com/15/FB4934/FB4934.png) `#FB4934` | ![#8EC07C](https://via.placeholder.com/15/8EC07C/8EC07C.png) `#8EC07C` |
| **tokyo-night** | ![#7AA2F7](https://via.placeholder.com/15/7AA2F7/7AA2F7.png) `#7AA2F7` | ![#9ECE6A](https://via.placeholder.com/15/9ECE6A/9ECE6A.png) `#9ECE6A` | ![#E0AF68](https://via.placeholder.com/15/E0AF68/E0AF68.png) `#E0AF68` | ![#F7768E](https://via.placeholder.com/15/F7768E/F7768E.png) `#F7768E` | ![#7DCFFF](https://via.placeholder.com/15/7DCFFF/7DCFFF.png) `#7DCFFF` |
| **catppuccin** | ![#CBA6F7](https://via.placeholder.com/15/CBA6F7/CBA6F7.png) `#CBA6F7` | ![#A6E3A1](https://via.placeholder.com/15/A6E3A1/A6E3A1.png) `#A6E3A1` | ![#F9E2AF](https://via.placeholder.com/15/F9E2AF/F9E2AF.png) `#F9E2AF` | ![#F38BA8](https://via.placeholder.com/15/F38BA8/F38BA8.png) `#F38BA8` | ![#89DCEB](https://via.placeholder.com/15/89DCEB/89DCEB.png) `#89DCEB` |
| **monokai** | ![#A6E22E](https://via.placeholder.com/15/A6E22E/A6E22E.png) `#A6E22E` | ![#A6E22E](https://via.placeholder.com/15/A6E22E/A6E22E.png) `#A6E22E` | ![#E6DB74](https://via.placeholder.com/15/E6DB74/E6DB74.png) `#E6DB74` | ![#F92672](https://via.placeholder.com/15/F92672/F92672.png) `#F92672` | ![#66D9EF](https://via.placeholder.com/15/66D9EF/66D9EF.png) `#66D9EF` |

### Switching Themes

```typescript
import { setTheme, themes, getNextTheme, useTheme } from 'tuiuiu.js';

// Switch to a specific theme
setTheme(themes.dracula);

// Cycle through themes
const currentTheme = useTheme();
const nextTheme = getNextTheme(currentTheme);
setTheme(nextTheme);

// Common pattern for Tab key cycling
useInput((input, key) => {
  if (key.tab) {
    const current = useTheme();
    setTheme(getNextTheme(current));
  }
});
```

## Semantic Colors

Use `resolveColor()` for theme-aware colors that automatically adapt:

```typescript
import { resolveColor } from 'tuiuiu.js';

// Semantic colors
Text({ color: resolveColor('primary') }, 'Primary color');
Text({ color: resolveColor('secondary') }, 'Secondary color');
Text({ color: resolveColor('success') }, 'Success/positive');
Text({ color: resolveColor('warning') }, 'Warning/caution');
Text({ color: resolveColor('error') }, 'Error/danger');
Text({ color: resolveColor('info') }, 'Informational');

// Auto-contrast foreground colors (for text on colored backgrounds)
Box(
  { backgroundColor: resolveColor('primary') },
  Text({ color: resolveColor('primaryForeground') }, 'Readable on primary!')
);

// Background hierarchy
Box({ backgroundColor: resolveColor('background') });  // Base background
Box({ backgroundColor: resolveColor('surface') });     // Card/panel surface
Box({ backgroundColor: resolveColor('muted') });       // Subtle background

// Foreground hierarchy
Text({ color: resolveColor('foreground') });           // Primary text
Text({ color: resolveColor('mutedForeground') });      // Secondary/muted text
```

### Auto-Contrast Foreground Colors

Semantic foreground colors automatically calculate the best contrast (white or black) based on the background luminance:

```typescript
// primaryForeground returns 'white' or 'black' based on primary color luminance
Box(
  { backgroundColor: resolveColor('primary') },
  Text({ color: resolveColor('primaryForeground') }, 'Always readable!')
);

// Works for all semantic colors
Text({ color: resolveColor('successForeground') });  // Auto-contrast on success bg
Text({ color: resolveColor('warningForeground') });  // Auto-contrast on warning bg
Text({ color: resolveColor('dangerForeground') });   // Auto-contrast on danger bg
Text({ color: resolveColor('infoForeground') });     // Auto-contrast on info bg
```

### Available Semantic Colors

| Color | Description |
|-------|-------------|
| `primary` | Primary brand color |
| `primaryForeground` | Auto-contrast text on primary |
| `secondary` | Secondary/accent color |
| `secondaryForeground` | Auto-contrast text on secondary |
| `success` | Positive/success state |
| `successForeground` | Auto-contrast text on success |
| `warning` | Warning/caution state |
| `warningForeground` | Auto-contrast text on warning |
| `error` / `danger` | Error/danger state |
| `dangerForeground` | Auto-contrast text on danger |
| `info` | Informational state |
| `infoForeground` | Auto-contrast text on info |
| `background` | Base background |
| `surface` | Elevated surface (cards) |
| `muted` | Subtle background |
| `foreground` | Primary text |
| `mutedForeground` | Secondary/muted text |
| `accent` | Accent highlight |
| `accentForeground` | Auto-contrast text on accent |

### Tailwind-Style Colors

You can also use Tailwind-style color names:

```typescript
Text({ color: resolveColor('blue-500') }, 'Blue');
Text({ color: resolveColor('red-600') }, 'Red');
Text({ color: resolveColor('green-400') }, 'Green');
```

## Theme Structure

Each theme defines a comprehensive structure:

### Palette (Color Scales)

Each semantic color has a scale from 50 (lightest) to 900 (darkest):

```typescript
const theme = useTheme();

// Access specific shades
theme.palette.primary[500];   // Base primary color
theme.palette.primary[300];   // Lighter shade
theme.palette.primary[700];   // Darker shade

theme.palette.success[500];   // Base success
theme.palette.danger[500];    // Base danger
theme.palette.neutral[500];   // Base neutral gray
```

### Background Hierarchy

```typescript
theme.background.lowest;   // Deepest background (app shell)
theme.background.base;     // Main application background
theme.background.subtle;   // Slightly elevated (sidebars)
theme.background.surface;  // Card/panel surface
theme.background.raised;   // Elevated surface (nested cards)
theme.background.elevated; // Floating elements
theme.background.popover;  // Popovers/dropdowns
theme.background.overlay;  // Modal overlay
```

### Foreground Hierarchy

```typescript
theme.foreground.primary;    // Highest contrast text
theme.foreground.secondary;  // Supporting content
theme.foreground.muted;      // De-emphasized content
theme.foreground.disabled;   // Inactive elements
theme.foreground.inverse;    // For colored backgrounds
```

### Accent Colors

```typescript
theme.accents.positive;   // Success (green)
theme.accents.warning;    // Caution (amber)
theme.accents.critical;   // Error (red)
theme.accents.info;       // Info (blue)
theme.accents.highlight;  // Selection highlight
```

### Component Tokens

Themes include pre-configured tokens for specific components:

```typescript
theme.components.button.primary.bg;
theme.components.button.primary.fg;
theme.components.panel.bg;
theme.components.tabs.tab.activeFg;
theme.components.modal.overlay;
theme.components.badge.success.bg;
```

## Creating Custom Themes

### Using `createTheme`

Extend an existing theme with overrides:

```typescript
import { createTheme, themes, setTheme } from 'tuiuiu.js';

const myTheme = createTheme(themes.dark, {
  name: 'my-custom',
  palette: {
    ...themes.dark.palette,
    primary: {
      ...themes.dark.palette.primary,
      500: '#8b5cf6',  // Custom purple primary
    },
  },
  accents: {
    ...themes.dark.accents,
    positive: '#10b981',  // Custom green
  },
});

setTheme(myTheme);
```

### Using `defineTheme`

Create a complete theme from scratch:

```typescript
import { defineTheme } from 'tuiuiu.js/themes';

const myTheme = defineTheme({
  name: 'my-theme',
  mode: 'dark',
  meta: {
    version: '1.0.0',
    author: 'Your Name',
    description: 'My custom theme',
  },
  palette: {
    primary: { /* 50-900 scale */ },
    secondary: { /* 50-900 scale */ },
    // ...
  },
  background: { /* hierarchy */ },
  foreground: { /* hierarchy */ },
  accents: { /* accent colors */ },
  states: { /* interactive states */ },
  borders: { /* border variants */ },
  opacity: { /* opacity values */ },
  components: { /* component tokens */ },
});
```

## Theme API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `useTheme()` | Get current theme (reactive) |
| `getTheme()` | Get current theme (non-reactive) |
| `setTheme(theme)` | Set the active theme |
| `pushTheme(theme)` | Push theme onto stack (temporary) |
| `popTheme()` | Pop theme from stack (restore previous) |
| `resolveColor(name)` | Resolve semantic color name to hex |
| `getNextTheme(current)` | Get next theme in cycle |
| `getPreviousTheme(current)` | Get previous theme in cycle |
| `createTheme(base, overrides)` | Create theme from base + overrides |
| `getContrastColor(bg)` | Get contrasting text color (white/black) |

### Theme Utilities

```typescript
import {
  themes,
  themeNames,
  getThemeByName,
  detectColorScheme,
  useSystemTheme,
} from 'tuiuiu.js';

// List all theme names
console.log(themeNames);
// ['dark', 'light', 'monokai', 'dracula', 'nord', ...]

// Get theme by name
const dracula = getThemeByName('dracula');

// Detect system preference
const scheme = detectColorScheme(); // 'dark' or 'light'

// Auto-set based on system preference
useSystemTheme();
```

## Border Radius

Themes can define border radius style affecting box characters:

```typescript
theme.borderRadius = 'none';  // ┌ ┐ └ ┘
theme.borderRadius = 'sm';    // ┌ ┐ └ ┘
theme.borderRadius = 'md';    // ╭ ╮ ╰ ╯
theme.borderRadius = 'lg';    // ╭ ╮ ╰ ╯
```

## System Theme Detection

Detect and use the system's preferred color scheme:

```typescript
import { useSystemTheme, detectColorScheme } from 'tuiuiu.js';

// Detect preference
const preference = detectColorScheme(); // 'dark' or 'light'

// Automatically set matching theme
useSystemTheme();
```

## Best Practices

1. **Use semantic colors**: Prefer `resolveColor('primary')` over hardcoded hex values
2. **Use auto-contrast**: Use `primaryForeground` for text on primary backgrounds
3. **Respect hierarchy**: Use background levels for proper layering
4. **Test across themes**: Ensure your UI works with all built-in themes
5. **Cycle themes for testing**: Use Tab key cycling during development

```typescript
// Development pattern for theme testing
useInput((input, key) => {
  if (key.tab) {
    const current = useTheme();
    setTheme(getNextTheme(current));
  }
});
```

## Migration from Legacy API

If upgrading from older versions:

```typescript
// Old (deprecated)
import { themeColor } from 'tuiuiu.js';
Text({ color: themeColor('primary') });

// New (recommended)
import { resolveColor } from 'tuiuiu.js';
Text({ color: resolveColor('primary') });
```

The `resolveColor` function is more powerful, supporting:
- All semantic colors with auto-contrast
- Tailwind-style color names (`blue-500`, `red-600`)
- Theme palette access
- Background/foreground hierarchy

