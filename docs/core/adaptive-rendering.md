# Adaptive Rendering

Tuiuiu detects terminal capabilities at startup and exposes utilities that pick the best rendering variant automatically. Components use these internally, but you can also call them directly when building custom components that need to degrade gracefully across terminals.

## `adaptive()`

Select the best variant from up to three tiers: Nerd Fonts, Unicode, and ASCII. The first match wins.

```typescript
import { adaptive } from 'tuiuiu.js';

// Pick the best icon for the current terminal
const star = adaptive({
  nerdFont: '\uf0e7',  // Nerd Font glyph
  unicode: '\u2605',   // Unicode star
  ascii: '*',          // ASCII fallback (required)
});

// Only some tiers need to be provided; ascii is always required
const bullet = adaptive({
  unicode: '\u2022',
  ascii: '-',
});

// Works with any type, not just strings
const maxColumns = adaptive({
  unicode: 4,
  ascii: 2,
});
```

Resolution order:

1. `nerdFont` -- returned when Nerd Fonts are enabled (`setNerdFonts(true)`) and the key is present.
2. `unicode` -- returned when the terminal reports Unicode support and the key is present.
3. `ascii` -- always returned as the final fallback.

## `adaptiveUnderline()`

Request a styled underline and let the library downgrade to a simple underline on terminals that do not support extended underline styles.

```typescript
import { adaptiveUnderline } from 'tuiuiu.js';

const style = adaptiveUnderline('curly');
// Returns 'curly' on Kitty/WezTerm, or `true` (simple underline) elsewhere
```

Accepted values: `'curly'`, `'dotted'`, `'dashed'`, `'double'`, `'single'`, or `true`.

If the terminal supports styled underlines, the preferred value is returned as-is. Otherwise the function returns `true`, which maps to a standard single underline.

## `adaptiveColor()`

Provide color values for three tiers of color support and get back the best one the terminal can render.

```typescript
import { adaptiveColor } from 'tuiuiu.js';

const orange = adaptiveColor(
  '#ff5500',   // truecolor (24-bit)
  '208',       // ANSI 256 fallback
  'red',       // basic 16-color fallback
);
```

Resolution order:

1. **Truecolor** -- the first argument is returned when the terminal supports 24-bit color.
2. **ANSI 256** -- the second argument is returned when the terminal reports 256 colors but not truecolor.
3. **Basic** -- the third argument is returned for 16-color terminals. If omitted, the truecolor value is passed through unchanged.

All fallback arguments are optional. When a fallback is not provided the function falls through to the next tier, ultimately returning the truecolor value.

## Capability Query Helpers

Thin boolean wrappers around the detected capabilities object. Use them to guard features that only make sense on certain terminals.

| Helper | What it checks |
|--------|----------------|
| `canSyncOutput()` | Synchronized output (flicker-free rendering) |
| `canStyleUnderlines()` | Styled underlines (curly, dotted, dashed, double) |
| `canColorUnderlines()` | Colored underlines (separate underline color) |
| `canClipboard()` | OSC 52 clipboard access |
| `canNotify()` | Desktop notifications via OSC 9/99/777 |
| `canHyperlink()` | Clickable hyperlinks (OSC 8) |
| `hasGpuAcceleration()` | GPU-accelerated rendering (Kitty, WezTerm, Alacritty) |
| `getTerminalName()` | Returns the terminal profile name, or the raw `TERM` value as fallback |

```typescript
import { canHyperlink, canClipboard, getTerminalName } from 'tuiuiu.js';

if (canHyperlink()) {
  // Render clickable link
} else {
  // Render plain URL text
}

console.log(`Running in: ${getTerminalName()}`);
```

## Real-World Examples

### Smart spinner

Pick spinner characters that look best in the current terminal.

```typescript
import { adaptive } from 'tuiuiu.js';

const frames = adaptive({
  nerdFont: ['\uf110', '\uf110', '\uf110'],       // Nerd Font spinner
  unicode:  ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f'], // Braille dots
  ascii:    ['|', '/', '-', '\\'],                  // Classic ASCII
});
```

### Error text with undercurl

Show a curly underline on terminals that support it, plain underline everywhere else.

```typescript
import { adaptiveUnderline, canColorUnderlines } from 'tuiuiu.js';

function ErrorText(message: string) {
  return Text({
    underline: adaptiveUnderline('curly'),
    color: canColorUnderlines() ? 'red' : undefined,
  }, message);
}
```

### Terminal-aware icons

Render rich icons in capable terminals, fall back to simple characters otherwise.

```typescript
import { adaptive } from 'tuiuiu.js';

const icons = {
  folder: adaptive({ nerdFont: '\uf07b', unicode: '\ud83d\udcc1', ascii: '[D]' }),
  file:   adaptive({ nerdFont: '\uf15b', unicode: '\ud83d\udcc4', ascii: '[F]' }),
  check:  adaptive({ nerdFont: '\uf00c', unicode: '\u2714',       ascii: '[x]' }),
  cross:  adaptive({ nerdFont: '\uf00d', unicode: '\u2718',       ascii: '[!]' }),
};
```

## API Reference

| Function | Signature | Returns |
|----------|-----------|---------|
| `adaptive` | `adaptive<T>(variants: { nerdFont?: T; unicode?: T; ascii: T }): T` | Best variant for the terminal |
| `adaptiveUnderline` | `adaptiveUnderline(preferred): 'curly' \| 'dotted' \| ... \| true` | Styled underline or `true` |
| `adaptiveColor` | `adaptiveColor(truecolor, ansi256?, basic?): string` | Best color string |
| `canSyncOutput` | `(): boolean` | |
| `canStyleUnderlines` | `(): boolean` | |
| `canColorUnderlines` | `(): boolean` | |
| `canClipboard` | `(): boolean` | |
| `canNotify` | `(): boolean` | |
| `canHyperlink` | `(): boolean` | |
| `hasGpuAcceleration` | `(): boolean` | |
| `getTerminalName` | `(): string` | |
