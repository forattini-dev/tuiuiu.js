# Terminal Detection

Tuiuiu includes a static terminal detection system that identifies the running terminal emulator and its capabilities using **environment variable lookups only**. Detection is synchronous and zero-cost -- no escape sequence queries are needed.

This allows Tuiuiu to enable or disable features (graphics protocols, styled underlines, clipboard integration, etc.) based on what the detected terminal actually supports, rather than guessing or probing at runtime.

## API Reference

All functions are exported from `tuiuiu.js/core` or the main `tuiuiu.js` entry point.

```typescript
import {
  detectTerminalId,
  detectMultiplexer,
  detectTerminalProfile,
  getTerminalProfileById,
  listTerminalIds,
} from 'tuiuiu.js';
```

### `detectTerminalId(env?)`

Detects which terminal emulator is running by inspecting environment variables.

```typescript
function detectTerminalId(env?: Record<string, string | undefined>): TerminalId
```

- **env** -- Optional environment object. Defaults to `process.env`.
- **Returns** -- A `TerminalId` string (e.g. `'kitty'`, `'alacritty'`, `'unknown'`).

Detection uses a priority chain: terminal-specific env vars are checked first (most reliable), then `TERM_PROGRAM`, then `TERM`-based fallbacks. If nothing matches, returns `'unknown'`.

```typescript
detectTerminalId({ KITTY_WINDOW_ID: '1' })  // 'kitty'
detectTerminalId({ TERM_PROGRAM: 'iTerm.app' })  // 'iterm2'
detectTerminalId({})  // 'unknown'
```

### `detectMultiplexer(env?)`

Detects if the terminal session is running inside a multiplexer (tmux, screen, or zellij).

```typescript
function detectMultiplexer(env?: Record<string, string | undefined>): MultiplexerInfo | null
```

- **Returns** -- A `MultiplexerInfo` object or `null` if no multiplexer is detected.

```typescript
interface MultiplexerInfo {
  type: 'tmux' | 'screen' | 'zellij';
  version?: string;
  needsPassthrough: boolean;
}
```

The `needsPassthrough` flag indicates whether escape sequences need to be wrapped in passthrough sequences for the underlying terminal to receive them.

```typescript
detectMultiplexer({ TMUX: '/tmp/tmux-1000/default,1234,0' })
// { type: 'tmux', version: '1234', needsPassthrough: true }

detectMultiplexer({ ZELLIJ: '0' })
// { type: 'zellij', version: undefined, needsPassthrough: false }

detectMultiplexer({})
// null
```

### `detectTerminalProfile(env?)`

Returns the full terminal profile including capabilities and version (when available).

```typescript
function detectTerminalProfile(env?: Record<string, string | undefined>): TerminalProfile
```

- **Returns** -- A `TerminalProfile` with id, name, GPU acceleration flag, version, and known capabilities.

```typescript
interface TerminalProfile {
  id: TerminalId;
  name: string;
  version?: string;
  gpuAccelerated: boolean;
  knownCaps: KnownTerminalCaps;
}
```

Version extraction is supported for: iTerm2, Konsole, VS Code, and WezTerm (via `TERM_PROGRAM_VERSION` or `KONSOLE_VERSION`).

```typescript
const profile = detectTerminalProfile({ KITTY_WINDOW_ID: '1' });
// profile.id === 'kitty'
// profile.name === 'Kitty'
// profile.gpuAccelerated === true
// profile.knownCaps.kittyGraphics === true
```

### `getTerminalProfileById(id)`

Returns the static capability profile for a known terminal ID, without version information.

```typescript
function getTerminalProfileById(id: TerminalId): Omit<TerminalProfile, 'version'>
```

Useful when you already know the terminal ID and want to look up its capabilities directly.

```typescript
const profile = getTerminalProfileById('foot');
profile.knownCaps.sixel  // true
profile.knownCaps.preferredGraphics  // 'sixel'
```

### `listTerminalIds()`

Returns an array of all known terminal IDs (22+ entries including `'unknown'`).

```typescript
function listTerminalIds(): TerminalId[]
```

## Supported Terminals

The following terminals are detected via environment variables:

| Terminal | ID | Detection Method |
|----------|-----|-----------------|
| Kitty | `kitty` | `KITTY_WINDOW_ID` |
| Alacritty | `alacritty` | `ALACRITTY_WINDOW_ID` or `ALACRITTY_LOG` |
| Ghostty | `ghostty` | `GHOSTTY_RESOURCES_DIR` |
| WezTerm | `wezterm` | `WEZTERM_PANE` or `TERM_PROGRAM=WezTerm` |
| Rio | `rio` | `TERM_PROGRAM=rio` |
| Warp | `warp` | `WARP_IS_LOCAL_SHELL_SESSION` |
| Foot | `foot` | `TERM` starts with `foot` |
| Contour | `contour` | `CONTOUR_TERMINAL_ID` |
| VS Code | `vscode` | `VSCODE_PID` or `TERM_PROGRAM=vscode` |
| iTerm2 | `iterm2` | `TERM_PROGRAM=iTerm.app` |
| Terminal.app | `terminal-app` | `TERM_PROGRAM=Apple_Terminal` |
| Windows Terminal | `windows-terminal` | `WT_SESSION` |
| Konsole | `konsole` | `KONSOLE_VERSION` |
| GNOME Terminal | `gnome-terminal` | `VTE_VERSION` (without `TILIX_ID`) |
| Tilix | `tilix` | `VTE_VERSION` + `TILIX_ID` |
| Hyper | `hyper` | `TERM_PROGRAM=Hyper` |
| Terminology | `terminology` | `TERMINOLOGY` |
| mlterm | `mlterm` | `TERM_PROGRAM=mlterm` or `TERM` contains `mlterm` |
| Black Box | `black-box` | `TERM_PROGRAM=blackbox` or `BLACKBOX_THEMES_DIR` |
| Bobcat | `bobcat` | `TERM_PROGRAM=Bobcat` |
| st (suckless) | `st` | `TERM=st-256color` or `TERM=st` |
| rxvt-unicode | `rxvt-unicode` | `TERM` contains `rxvt-unicode` or `rxvt` |

Detection priority matters: terminal-specific env vars (like `KITTY_WINDOW_ID`) are checked before generic ones (like `TERM_PROGRAM`), so a Kitty session that also sets `TERM_PROGRAM=Hyper` will correctly resolve to `kitty`.

## Multiplexer Detection

Three terminal multiplexers are detected:

| Multiplexer | Env Var | Passthrough Required |
|-------------|---------|---------------------|
| tmux | `TMUX` | Yes |
| GNU Screen | `STY` | Yes |
| Zellij | `ZELLIJ` | No |

When `needsPassthrough` is `true`, escape sequences (e.g. for graphics protocols, clipboard, or notifications) must be wrapped in the multiplexer's passthrough mechanism to reach the outer terminal. Zellij handles this transparently, so no wrapping is needed.

For tmux, the version is extracted from the `TMUX` env var (the second comma-separated field).

## Terminal Capabilities Matrix

Each terminal profile includes a `knownCaps` object describing its known capabilities. The `unknown` profile uses conservative defaults (all capabilities disabled).

### Core Features

| Terminal | Sync Output | Styled Underlines | Colored Underlines | Clipboard | True Color |
|----------|:-----------:|:-----------------:|:------------------:|:---------:|:----------:|
| Kitty | Y | Y | Y | Y | Y |
| Alacritty | Y | Y | Y | - | Y |
| Ghostty | Y | Y | Y | Y | Y |
| WezTerm | Y | Y | Y | Y | Y |
| Rio | Y | Y | Y | Y | Y |
| Warp | - | - | - | - | Y |
| Foot | Y | Y | Y | Y | Y |
| Contour | Y | Y | Y | Y | Y |
| Hyper | - | - | - | - | Y |
| VS Code | Y | Y | Y | - | Y |
| iTerm2 | Y | Y | Y | Y | Y |
| Terminal.app | - | - | - | - | - |
| Windows Terminal | Y | Y | Y | - | Y |
| Konsole | Y | Y | Y | Y | Y |
| GNOME Terminal | - | - | - | - | Y |
| Tilix | - | - | - | - | Y |
| Terminology | - | - | - | - | Y |
| mlterm | - | - | - | - | Y |
| Black Box | - | - | - | - | Y |
| Bobcat | - | - | - | - | Y |
| st | - | - | - | - | Y |
| rxvt-unicode | - | - | - | - | - |

### Input and UI Features

| Terminal | Kitty Keyboard | Focus Events | Hyperlinks | Notifications | Window Title |
|----------|:-------------:|:------------:|:----------:|:-------------:|:------------:|
| Kitty | Y | Y | Y | osc99 | Y |
| Alacritty | - | Y | Y | - | Y |
| Ghostty | Y | Y | Y | osc99 | Y |
| WezTerm | Y | Y | Y | osc9 | Y |
| Rio | Y | Y | Y | - | Y |
| Warp | - | - | Y | - | Y |
| Foot | Y | Y | Y | osc777 | Y |
| Contour | Y | Y | Y | - | Y |
| Hyper | - | - | Y | - | Y |
| VS Code | - | Y | Y | - | Y |
| iTerm2 | - | Y | Y | osc9 | Y |
| Terminal.app | - | - | - | - | Y |
| Windows Terminal | - | Y | Y | - | Y |
| Konsole | - | Y | Y | - | Y |
| GNOME Terminal | - | - | Y | - | Y |
| Tilix | - | - | Y | osc777 | Y |
| Terminology | - | - | - | - | Y |
| mlterm | - | - | - | - | Y |
| Black Box | - | - | - | - | Y |
| Bobcat | - | - | - | - | Y |
| st | - | - | - | - | - |
| rxvt-unicode | - | - | - | - | Y |

### Graphics Protocols

| Terminal | Kitty Graphics | iTerm2 Graphics | Sixel | Preferred |
|----------|:-------------:|:---------------:|:-----:|:---------:|
| Kitty | Y | - | - | kitty |
| Ghostty | Y | - | - | kitty |
| WezTerm | - | Y | - | iterm2 |
| Rio | - | Y | - | iterm2 |
| Foot | - | - | Y | sixel |
| iTerm2 | - | Y | - | iterm2 |
| mlterm | - | - | Y | sixel |
| Black Box | - | - | Y | sixel |
| Bobcat | - | Y | Y | iterm2 |

All other terminals have no reliable graphics protocol support.

Notes on graphics support:
- **WezTerm** supports all three protocols but only iTerm2 is bug-free. Kitty and Sixel have known issues.
- **Rio** supports iTerm2 (verified) and Sixel (has glitches). iTerm2 is preferred.
- **Bobcat** supports both iTerm2 and Sixel. iTerm2 is preferred on all versions.
- **Contour** and **Konsole** have partial Sixel support that does not clear graphics properly, so it is disabled.
- **Black Box** Sixel is confirmed in flatpak builds; distro packages may not enable it.

### Additional Properties

| Terminal | GPU Accelerated |
|----------|:--------------:|
| Kitty | Y |
| Alacritty | Y |
| Ghostty | Y |
| WezTerm | Y |
| Rio | Y |
| Warp | Y |
| Contour | Y |
| Terminology | Y |
| Windows Terminal | Y |

All other terminals are not GPU-accelerated. The `nerdFonts` capability is always `false` in the static profile -- it must be detected at runtime.

## Usage Examples

### Basic detection

```typescript
import { detectTerminalProfile, detectMultiplexer } from 'tuiuiu.js';

const profile = detectTerminalProfile();
console.log(`Running in ${profile.name}`);

if (profile.knownCaps.trueColor) {
  // Use 24-bit colors
}

if (profile.knownCaps.preferredGraphics) {
  // Render inline images using the preferred protocol
  console.log(`Graphics: ${profile.knownCaps.preferredGraphics}`);
}
```

### Multiplexer-aware output

```typescript
import { detectMultiplexer } from 'tuiuiu.js';

const mux = detectMultiplexer();

if (mux?.needsPassthrough) {
  // Wrap escape sequences for tmux/screen passthrough
  console.log(`Inside ${mux.type}, passthrough needed`);
}
```

### Feature gating

```typescript
import { detectTerminalProfile } from 'tuiuiu.js';

const { knownCaps } = detectTerminalProfile();

// Only use kitty keyboard protocol where supported
if (knownCaps.kittyKeyboard) {
  enableKittyKeyboard();
}

// Choose notification protocol
if (knownCaps.notifications) {
  sendNotification(knownCaps.notifications);  // 'osc9' | 'osc99' | 'osc777'
}

// Select graphics protocol
if (knownCaps.preferredGraphics === 'kitty') {
  renderKittyImage(data);
} else if (knownCaps.preferredGraphics === 'iterm2') {
  renderIterm2Image(data);
} else if (knownCaps.preferredGraphics === 'sixel') {
  renderSixelImage(data);
}
```

### Custom env for testing

All detection functions accept an optional `env` parameter, making them easy to test without mocking `process.env`:

```typescript
import { detectTerminalId } from 'tuiuiu.js';

// Simulate different terminals
detectTerminalId({ KITTY_WINDOW_ID: '1' })  // 'kitty'
detectTerminalId({ TERM: 'foot' })  // 'foot'
detectTerminalId({})  // 'unknown'
```
