# Capabilities, Terminal Profiles, and Fallbacks

Modern terminals are not all equivalent. `tuiuiu.js` keeps a capability model so the runtime can:

- choose Unicode or ASCII safely
- pick the right graphics backend for terminal images
- enable richer protocols only when they are actually useful
- degrade cleanly on older terminals, remote shells, or multiplexers

This page documents the runtime view of terminal capabilities and how to override it when needed.

**See also:**

- [Terminal Detection](./terminal-detection.md) — env-var-based identification logic and supported terminals
- [Progressive Features](./progressive-features.md) — overrides, passthrough, and feature toggles
- [Adaptive Rendering](./adaptive-rendering.md) — runtime rendering adjustments

## Detection Model

The runtime combines three sources of truth:

1. **Terminal profile detection**
   - static env-based identification for 22+ supported terminal emulators
   - includes a capability profile and a preferred graphics backend when known
   - see [Terminal Detection](./terminal-detection.md) for the full list and detection logic
2. **Active queries**
   - used for graphics negotiation and cell-size discovery
   - important for Kitty/Sixel/image sizing
3. **Progressive overrides**
   - explicit app-level toggles for things like synchronized output, hyperlinks, or testing
   - see [Progressive Features](./progressive-features.md) for configuration details

The result is exposed through `getCapabilities()`.

```typescript
import { getCapabilities } from 'tuiuiu.js';

const caps = getCapabilities();

console.log(caps.terminalName);
console.log(caps.colors);
console.log(caps.hyperlinks);
console.log(caps.focusEvents);
console.log(caps.profile?.id);
```

## Core Capabilities

The base capability snapshot includes:

- `unicode`
- `colors`
- `trueColor`
- `mouse`
- `italic`
- `strikethrough`
- `hyperlinks`
- `columns`
- `rows`

The extended runtime also exposes:

- `profile`
- `multiplexer`
- `synchronizedOutput`
- `styledUnderlines`
- `coloredUnderlines`
- `clipboard`
- `notifications`
- `cursorStyleControl`
- `windowTitle`
- `gpuAccelerated`
- `kittyKeyboard`
- `focusEvents`
- `nerdFonts`

## `KnownTerminalCaps` Interface

The `KnownTerminalCaps` interface describes the static capability profile for each terminal in the database. Every field is determined at detection time from env vars — no escape sequences needed.

| Field | Type | Description |
|-------|------|-------------|
| `synchronizedOutput` | `boolean` | Terminal supports `DCS` synchronized output (BSU/ESU) to eliminate flicker |
| `styledUnderlines` | `boolean` | Supports underline styles beyond single (double, curly, dotted, dashed) |
| `coloredUnderlines` | `boolean` | Supports colored underlines via `SGR 58/59` |
| `clipboard` | `boolean` | Supports OSC 52 clipboard read/write |
| `notifications` | `NotificationProtocol \| false` | Notification protocol supported: `'osc9'`, `'osc99'`, `'osc777'`, or `false` |
| `cursorStyleControl` | `boolean` | Supports `DECSCUSR` cursor shape changes (block, underline, beam) |
| `windowTitle` | `boolean` | Supports setting window title via `OSC 2` |
| `kittyKeyboard` | `boolean` | Supports Kitty keyboard protocol for unambiguous key reporting |
| `kittyGraphics` | `boolean` | Supports Kitty graphics protocol for inline images |
| `sixel` | `boolean` | Supports Sixel graphics for inline images |
| `iterm2Graphics` | `boolean` | Supports iTerm2 inline image protocol (`OSC 1337`) |
| `preferredGraphics` | `GraphicsProtocolId \| false` | The most reliable graphics protocol for this terminal: `'kitty'`, `'iterm2'`, `'sixel'`, or `false` |
| `hyperlinks` | `boolean` | Supports OSC 8 terminal hyperlinks |
| `trueColor` | `boolean` | Supports 24-bit true color (`SGR 38;2;r;g;b`) |
| `mouse` | `boolean` | Supports mouse tracking (click, scroll, movement) |
| `italic` | `boolean` | Supports italic text rendering |
| `strikethrough` | `boolean` | Supports strikethrough text rendering |
| `focusEvents` | `boolean` | Supports terminal focus in/out event reporting |
| `nerdFonts` | `false` | Always `false` in profiles — Nerd Font presence is runtime-detected only |

### Supporting Types

```typescript
type NotificationProtocol = 'osc9' | 'osc99' | 'osc777';
type GraphicsProtocolId = 'kitty' | 'iterm2' | 'sixel';
type UnderlineStyle = 'single' | 'double' | 'curly' | 'dotted' | 'dashed';
type CursorStyle = 'block' | 'underline' | 'beam';
```

## Render Mode

You can force a specific character mode if auto-detection is not what you want:

```typescript
import { setRenderMode } from 'tuiuiu.js';

setRenderMode('ascii');
setRenderMode('unicode');
setRenderMode('auto');
```

Use ASCII for CI logs, plain serial terminals, or when you want deterministic fallback behavior.

## Terminal Profiles

`tuiuiu.js` ships a terminal profile database that identifies 22+ known emulators and multiplexers synchronously via env vars. Each profile includes the terminal name, GPU acceleration flag, and the full `KnownTerminalCaps` set.

Supported terminals:

| Terminal | ID | GPU | Preferred Graphics |
|----------|----|-----|--------------------|
| Kitty | `kitty` | Yes | `kitty` |
| Alacritty | `alacritty` | Yes | none |
| Ghostty | `ghostty` | Yes | `kitty` |
| WezTerm | `wezterm` | Yes | `iterm2` |
| Rio | `rio` | Yes | `iterm2` |
| Warp | `warp` | Yes | none |
| Foot | `foot` | No | `sixel` |
| Contour | `contour` | Yes | none |
| Hyper | `hyper` | No | none |
| VS Code Terminal | `vscode` | No | none |
| iTerm2 | `iterm2` | No | `iterm2` |
| Terminal.app | `terminal-app` | No | none |
| Windows Terminal | `windows-terminal` | Yes | none |
| Konsole | `konsole` | No | none |
| GNOME Terminal | `gnome-terminal` | No | none |
| Tilix | `tilix` | No | none |
| Terminology | `terminology` | Yes | none |
| mlterm | `mlterm` | No | `sixel` |
| Black Box | `black-box` | No | `sixel` |
| Bobcat | `bobcat` | No | `iterm2` |
| st (suckless) | `st` | No | none |
| rxvt-unicode | `rxvt-unicode` | No | none |

For detection logic details, see [Terminal Detection](./terminal-detection.md).

```typescript
import { detectTerminalProfile, detectMultiplexer } from 'tuiuiu.js';

const profile = detectTerminalProfile();
const mux = detectMultiplexer();

console.log(profile.id, profile.knownCaps.preferredGraphics);
console.log(mux?.type, mux?.needsPassthrough);
```

This is especially useful for:

- selecting a preferred image protocol
- enabling kitty keyboard only on compatible terminals
- deciding whether passthrough wrapping is needed inside `tmux` or `screen`

## Graphics Capability Negotiation

The image pipeline uses both profile hints and active terminal queries.

```typescript
import {
  detectGraphicsProtocol,
  getGraphicsCapabilities,
  queryGraphicsCapabilities,
} from 'tuiuiu.js';

const fastGuess = detectGraphicsProtocol();
const cachedCaps = getGraphicsCapabilities();
const negotiated = await queryGraphicsCapabilities();
```

Selection order is:

1. explicit `TUIUIU_GRAPHICS` override
2. strong session markers like Kitty/iTerm2 env markers
3. terminal profile `preferredGraphics`
4. coarse term hints like `sixel` in `TERM`
5. fallback to `halfblock` or `braille`

### Graphics Preferences by Terminal

Terminals are grouped by their preferred graphics protocol:

- **Kitty protocol** — Kitty, Ghostty
- **iTerm2 protocol** — iTerm2, WezTerm, Rio, Bobcat
- **Sixel** — Foot, mlterm, Black Box
- **No graphics** — Alacritty, Warp, Contour, Hyper, VS Code, Terminal.app, Windows Terminal, Konsole, GNOME Terminal, Tilix, Terminology, st, rxvt-unicode

Common outcomes:

- Kitty / Ghostty -> `kitty`
- iTerm2 / WezTerm / Rio -> usually `iterm2`
- Foot / mlterm / xterm with sixel enabled -> `sixel`
- everything else -> `halfblock` or `braille`

## Character Fallbacks

For text rendering, prefer `char()` or `getChars()` instead of hardcoding glyphs:

```typescript
import { char, getChars } from 'tuiuiu.js';

const check = getChars().checkbox.checked;
const arrow = char('arrows').right;
```

Character sets cover:

- borders
- progress bars
- spinners
- tree connectors
- checkboxes/radios
- switches
- scrollbars

## Progressive Overrides

Progressive enhancement is configurable without having to fake terminal detection. See [Progressive Features](./progressive-features.md) for full documentation.

```typescript
import {
  configureProgressive,
  setHyperlinksEnabled,
  setNerdFonts,
} from 'tuiuiu.js';

configureProgressive({
  overrides: {
    synchronizedOutput: true,
    focusEvents: true,
  },
  hyperlinks: true,
});

setHyperlinksEnabled(false);
setNerdFonts(true);
```

Use this for:

- forcing features on/off in integration tests
- disabling hyperlinks even on capable terminals
- opting into Nerd Font rendering

## Hyperlinks

Terminal hyperlink support and hyperlink emission are separate concerns:

- `caps.hyperlinks` answers whether the terminal likely supports `OSC 8`
- `setHyperlinksEnabled(false)` disables hyperlink emission globally

Use `formatHyperlink()` when you want capability-aware output:

```typescript
import { formatHyperlink } from 'tuiuiu.js';

const docsLink = formatHyperlink('Docs', 'https://example.com/docs');
```

If hyperlinks are unsupported or disabled, it returns plain text.

## Focus Events

Modern terminals can report focus in/out. `tuiuiu.js` exposes that as a capability and as a reactive hook.

```typescript
import { getCapabilities, useTerminalFocus } from 'tuiuiu.js';

const caps = getCapabilities();
const { focused } = useTerminalFocus();
```

The runtime uses focus information for:

- pausing animations by default
- pausing the global tick
- pausing `fixedStep` loops unless opted out

## Multiplexers

When running inside `tmux`, `screen`, or `zellij`, capability handling changes:

- `tmux` and `screen` often require passthrough wrapping for OSC/DCS
- `zellij` usually passes modern sequences through directly
- image, clipboard, notifications, and synchronized output may need different policy from the outer terminal

Always treat the multiplexer as a separate layer from the terminal emulator itself.

See [Progressive Features](./progressive-features.md) for passthrough wrapping details and multiplexer-specific configuration.

```typescript
import { detectMultiplexer } from 'tuiuiu.js';

const mux = detectMultiplexer();

if (mux) {
  console.log(mux.type);             // 'tmux' | 'screen' | 'zellij'
  console.log(mux.needsPassthrough); // true for tmux/screen, false for zellij
  console.log(mux.version);          // version string when available
}
```

## Related APIs

- `getCapabilities()`
- `refreshCapabilities()`
- `detectTerminalProfile()`
- `detectMultiplexer()`
- `detectGraphicsProtocol()`
- `queryGraphicsCapabilities()`
- `configureProgressive()`
- `setHyperlinksEnabled()`
- `useTerminalFocus()`
- `getTerminalProfileById()`
- `listTerminalIds()`
