# Capabilities & Fallbacks

Terminals vary widely in their support for colors, unicode characters, and features like mouse tracking. Tuiuiu includes a detection system to gracefully degrade on older terminals.

## Detection

Tuiuiu automatically detects:
- **Unicode Support**: Whether to use specialized symbols (e.g. `✔`) or ASCII fallbacks (`[x]`).
- **Color Depth**: 16 colors, 256 colors, or True Color (16m).
- **Mouse Support**: If the terminal handles mouse events.

## Render Mode

You can force a specific rendering mode if auto-detection fails or for testing.

```typescript
import { setRenderMode } from 'tuiuiu';

// Force ASCII mode (useful for CI/CD logs)
setRenderMode('ascii');

// Force Unicode
setRenderMode('unicode');

// Default
setRenderMode('auto');
```

## Character Sets

To ensure your app looks good everywhere, avoid hardcoding symbols. Use the `char` helper or `getChars()` to get the correct symbol for the current environment.

```typescript
import { char, getChars } from 'tuiuiu';

// Automatic fallback: '✔' (unicode) or '[x]' (ascii)
const check = getChars().checkbox.checked;

// Or specific char lookup
const arrow = char('arrows').right; 
```

## Available Character Sets

The `getChars()` object contains sets for:
- **Borders**: `border`, `borderRound`
- **Progress**: `progressFilled`, `progressEmpty`
- **Spinners**: `spinner`
- **Tree**: `tree` (branch, pipe, last)
- **UI Elements**: `checkbox`, `radio`, `switch`, `scrollbar`
