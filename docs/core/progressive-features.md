# Progressive Enhancement

The progressive enhancement system provides escape sequence generators that adapt to the terminal's detected capabilities. When a feature is unsupported, functions return empty strings or `null` instead of throwing errors. This enables graceful degradation without conditionals at call sites -- components simply write the returned value, and unsupported features silently become no-ops.

All functions accept an optional `caps` parameter (a `TerminalCapabilities` object). When omitted, the system calls `getCapabilities()` to use auto-detected values.

```typescript
import {
  wrapSynchronized,
  setCursorStyle,
  setWindowTitle,
  formatHyperlink,
  getNotificationSequence,
  getUnderlineCode,
  getUnderlineColorCode,
  getClipboardWriteSequence,
  passthroughWrap,
  setNerdFonts,
  hasNerdFonts,
  configureProgressive,
  resetProgressive,
  getProgressiveVersion,
  getProgressiveOverrides,
} from 'tuiuiu.js';
```

---

## Synchronized Output (DEC 2026)

Synchronized output prevents screen tearing by batching terminal updates between a Begin Synchronized Update (BSU) and End Synchronized Update (ESU) marker. The terminal holds rendering until it receives the ESU, then paints everything at once.

**Constants:**

- `BSU` -- `\x1b[?2026h` (begin)
- `ESU` -- `\x1b[?2026l` (end)

**Functions:**

| Function | Returns when unsupported |
|----------|------------------------|
| `wrapSynchronized(output, caps?)` | The original string unchanged |
| `getSynchronizedBegin(caps?)` | Empty string |
| `getSynchronizedEnd(caps?)` | Empty string |

```typescript
import { wrapSynchronized, getSynchronizedBegin, getSynchronizedEnd, BSU, ESU } from 'tuiuiu.js';

// Wrap an entire frame
const frame = wrapSynchronized(renderedOutput);
process.stdout.write(frame);

// Or use begin/end separately for streaming
process.stdout.write(getSynchronizedBegin());
process.stdout.write(partOne);
process.stdout.write(partTwo);
process.stdout.write(getSynchronizedEnd());
```

---

## Cursor Styles (DECSCUSR)

Controls the cursor shape using the DECSCUSR (DEC Set Cursor Style) escape sequence. Three shapes are available, each with a blinking or steady variant.

| Style | Steady | Blinking |
|-------|--------|----------|
| `block` | 2 | 1 |
| `underline` | 4 | 3 |
| `beam` | 6 | 5 |

**Functions:**

| Function | Returns when unsupported |
|----------|------------------------|
| `setCursorStyle(style, blinking?, caps?)` | Empty string |
| `resetCursorStyle(caps?)` | Empty string |

```typescript
import { setCursorStyle, resetCursorStyle } from 'tuiuiu.js';

// Switch to a blinking beam cursor (good for text input)
process.stdout.write(setCursorStyle('beam', true));

// Steady block cursor
process.stdout.write(setCursorStyle('block'));

// Restore the terminal's default cursor
process.stdout.write(resetCursorStyle());
```

---

## Window Title (OSC 2)

Sets the terminal window or tab title using the OSC 2 escape sequence.

| Function | Returns when unsupported |
|----------|------------------------|
| `setWindowTitle(title, caps?)` | Empty string |

```typescript
import { setWindowTitle } from 'tuiuiu.js';

process.stdout.write(setWindowTitle('My App - Dashboard'));
```

---

## Clipboard (OSC 52)

Reads and writes the system clipboard through the terminal using OSC 52. The text is base64-encoded in the escape sequence. Not all terminals support this, and some require explicit opt-in in their settings.

| Function | Returns when unsupported |
|----------|------------------------|
| `getClipboardWriteSequence(text, caps?)` | `null` |
| `getClipboardQuerySequence(caps?)` | `null` |

```typescript
import { getClipboardWriteSequence, getClipboardQuerySequence } from 'tuiuiu.js';

// Write to clipboard
const seq = getClipboardWriteSequence('copied text');
if (seq) {
  process.stdout.write(seq);
}

// Query clipboard contents (terminal responds with OSC 52 reply)
const query = getClipboardQuerySequence();
if (query) {
  process.stdout.write(query);
}
```

---

## Hyperlinks (OSC 8)

Renders clickable hyperlinks in terminals that support OSC 8. When unsupported or globally disabled, falls back to returning the plain display text.

Hyperlink emission is enabled by default. You can toggle it globally with `setHyperlinksEnabled()`.

| Function | Returns when unsupported |
|----------|------------------------|
| `formatHyperlink(text, url, caps?)` | The plain `text` string |
| `setHyperlinksEnabled(enabled)` | `void` |
| `areHyperlinksEnabled()` | `boolean` |

```typescript
import { formatHyperlink, setHyperlinksEnabled, areHyperlinksEnabled } from 'tuiuiu.js';

// Render a clickable link (or plain text if unsupported)
const link = formatHyperlink('Documentation', 'https://example.com/docs');
process.stdout.write(link);

// Disable hyperlinks globally (e.g., when piping output)
setHyperlinksEnabled(false);

// Check current state
if (areHyperlinksEnabled()) {
  // hyperlinks will be emitted
}
```

Both the terminal capability (`caps.hyperlinks`) and the global toggle must be `true` for OSC 8 sequences to be emitted. Disabling either one causes `formatHyperlink` to return plain text.

---

## Notifications (OSC 9/99/777)

Sends desktop notifications through the terminal. Three protocols are supported, matching different terminal emulators:

| Protocol | Terminals | OSC Code |
|----------|-----------|----------|
| `osc9` | iTerm2, WezTerm | OSC 9 |
| `osc99` | Kitty | OSC 99 |
| `osc777` | Foot, Tilix | OSC 777 |

The correct protocol is chosen automatically based on detected terminal capabilities.

| Function | Returns when unsupported |
|----------|------------------------|
| `getNotificationSequence(title, body?, caps?)` | `null` |

```typescript
import { getNotificationSequence } from 'tuiuiu.js';

// Title only
const seq = getNotificationSequence('Build Complete');
if (seq) {
  process.stdout.write(seq);
}

// Title with body
const seq2 = getNotificationSequence('Build', 'All 47 tests passed');
if (seq2) {
  process.stdout.write(seq2);
}
```

**Protocol details:**

- **osc9** (iTerm2/WezTerm): Sends `OSC 9 ; message ST`. When a body is provided, title and body are joined with `: `.
- **osc99** (Kitty): Uses Kitty's structured notification protocol with `i=`, `d=`, and `p=` parameters. A title-only notification uses a single sequence; a title+body notification sends two sequences.
- **osc777** (Foot/Tilix): Sends `OSC 777 ; notify ; title ; body ST`.

---

## Styled Underlines

Uses SGR colon sub-parameters to render underlines in five styles. Falls back to a simple underline (SGR 4) when the terminal does not support styled underlines.

| Style | Sub-parameter |
|-------|--------------|
| `single` | `4:1` |
| `double` | `4:2` |
| `curly` | `4:3` |
| `dotted` | `4:4` |
| `dashed` | `4:5` |

| Function | Returns when unsupported |
|----------|------------------------|
| `getUnderlineCode(style, caps?)` | `'4'` (simple underline) for named styles, empty string for `false` |

```typescript
import { getUnderlineCode } from 'tuiuiu.js';

// Curly underline (squiggly, commonly used for spelling errors)
const code = getUnderlineCode('curly');
// Returns '4:3' when supported, '4' as fallback

// Simple boolean toggle
const simple = getUnderlineCode(true);
// Always returns '4'

// No underline
const none = getUnderlineCode(false);
// Returns ''
```

---

## Colored Underlines

Sets the underline color independently from the text foreground color using SGR 58. Supports hex strings, RGB objects, and ANSI 256-color values.

| Function | Returns when unsupported |
|----------|------------------------|
| `getUnderlineColorCode(color, caps?)` | Empty string |
| `getUnderlineColorResetCode()` | `'59'` (always) |

```typescript
import { getUnderlineColorCode, getUnderlineColorResetCode } from 'tuiuiu.js';

// Hex color
const red = getUnderlineColorCode('#ff0000');
// '58;2;255;0;0' when supported

// RGB object
const teal = getUnderlineColorCode({ r: 0, g: 128, b: 255 });
// '58;2;0;128;255'

// ANSI 256 palette
const orange = getUnderlineColorCode({ ansi256: 196 });
// '58;5;196'

// Reset underline color
const reset = getUnderlineColorResetCode();
// '59'
```

---

## Multiplexer Passthrough

Terminal multiplexers (tmux, screen) intercept escape sequences before they reach the outer terminal. `passthroughWrap()` wraps sequences in the appropriate DCS passthrough envelope so they are forwarded correctly.

| Multiplexer | Wrapping |
|-------------|----------|
| **tmux** | `\x1bPtmux;` ... `\x1b\\` with all ESC bytes doubled inside |
| **screen** | `\x1bP` ... `\x1b\\` with all ESC bytes doubled inside |
| **zellij** | No wrapping (passes through natively) |

| Function | Returns when no multiplexer |
|----------|---------------------------|
| `passthroughWrap(sequence, multiplexer?)` | The original sequence unchanged |

```typescript
import { passthroughWrap } from 'tuiuiu.js';

// Manual wrapping for a custom escape sequence
const seq = '\x1b]2;My Title\x07';
const wrapped = passthroughWrap(seq);
process.stdout.write(wrapped);

// Explicit multiplexer info
const tmuxWrapped = passthroughWrap(seq, { type: 'tmux', needsPassthrough: true });
```

Most progressive functions (`wrapSynchronized`, `setCursorStyle`, `formatHyperlink`, etc.) call `passthroughWrap()` internally, so you rarely need to use it directly.

---

## Nerd Fonts

Controls whether components may use Nerd Font icons. Nerd Fonts are not detected automatically from the terminal -- you must opt in explicitly or set an environment variable.

| Function | Description |
|----------|-------------|
| `setNerdFonts(enabled)` | Enable or disable Nerd Fonts |
| `hasNerdFonts()` | Check if Nerd Fonts are available |

Detection checks (in order):

1. Explicit call to `setNerdFonts(true)`
2. Environment variable `NERD_FONT=1`
3. Environment variable `NERD_FONTS=1`

Any of these returning true causes `hasNerdFonts()` to return `true`.

```typescript
import { setNerdFonts, hasNerdFonts } from 'tuiuiu.js';

// Explicit opt-in
setNerdFonts(true);

// Or set env: NERD_FONT=1 / NERD_FONTS=1

if (hasNerdFonts()) {
  // Use icon glyphs
}
```

---

## Configuration

Global configuration functions for overriding detected capabilities, resetting state, and tracking configuration changes.

### configureProgressive(options)

Override detected capabilities and toggle hyperlink emission in a single call.

```typescript
import { configureProgressive } from 'tuiuiu.js';

configureProgressive({
  overrides: {
    synchronizedOutput: true,
    clipboard: true,
  },
  hyperlinks: false,
});
```

The `overrides` object accepts any partial `TerminalCapabilities`. These overrides are applied on top of auto-detected values.

### resetProgressive()

Resets all progressive configuration to defaults:

- Clears capability overrides
- Disables Nerd Fonts
- Re-enables hyperlinks
- Increments the version counter

```typescript
import { resetProgressive } from 'tuiuiu.js';

resetProgressive();
```

### getProgressiveOverrides()

Returns the currently configured capability overrides, or `null` if none are set. Useful for inspecting or forwarding progressive state.

```typescript
import { getProgressiveOverrides, configureProgressive } from 'tuiuiu.js';

configureProgressive({ overrides: { synchronizedOutput: true } });
const overrides = getProgressiveOverrides();
// { synchronizedOutput: true }
```

### getProgressiveVersion()

Returns a monotonically increasing counter that increments whenever progressive configuration changes. Used by capability caching to invalidate stale snapshots.

```typescript
import { getProgressiveVersion } from 'tuiuiu.js';

const v1 = getProgressiveVersion();
configureProgressive({ hyperlinks: false });
const v2 = getProgressiveVersion();
// v2 > v1
```

Every call to `setNerdFonts()`, `setHyperlinksEnabled()`, `configureProgressive()`, or `resetProgressive()` increments the version.
