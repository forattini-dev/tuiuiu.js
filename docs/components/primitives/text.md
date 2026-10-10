# Text

Render styled text content with colors, formatting, and text manipulation.

## Basic Usage

```typescript
import { Text } from 'tuiuiu.js';

Text({}, 'Hello, World!')
Text({ color: 'cyan' }, 'Cyan text')
Text({ bold: true }, 'Bold text')
```

## Multiple styles in one text flow

Use `RichText` from the visual subpath when words with different styles must
wrap together. It is one text node, not a row of independent flexbox elements:

```typescript
import { RichText, type TextSpan } from 'tuiuiu.js/ui';

const emphasis: TextSpan = {
  text: 'world',
  style: { color: '#65b7ff', bold: true },
};

RichText({ color: 'foreground', wrap: 'wrap' }, 'Hello ', emphasis, ' again');
```

Span styles support `color`, `backgroundColor`, `bold`, `dim`, `italic`,
`underline`, `underlineColor`, `strikethrough` and `inverse`. Omitted properties
inherit the node style; explicit `false` overrides it. Geometry and wrapping
belong to the node, not individual spans. Colors use the existing theme and
terminal capability machinery.

`RichText` snapshots its spans/styles. Changing the caller's objects afterwards
does not change an existing VNode; construct another VNode during the next
render. Embedded ANSI/control protocols are stripped from span text: styles
are data. Use `PreText` for intentionally pre-styled SGR content instead.

Wrapping, truncation and clipping use Text's canonical geometry. A grapheme
crossing a span boundary takes the first code unit's style; it is never split
into separate cells. Generated truncation markers inherit the node style.
There are no per-span mouse handlers or automatic OSC hyperlinks in this API.

## Read-only document selection

`TextView` from `tuiuiu.js/ui` displays a `TextSelection` from
`tuiuiu.js/interaction`. The caller owns the document and selection; mounting or
unmounting a view never disposes an external controller.

```typescript
import { createTextDocument, createTextSelection } from 'tuiuiu.js/interaction';
import { TextView } from 'tuiuiu.js/ui';

const document = createTextDocument({ initialValue: 'hello 界\nnext line' });
const selection = createTextSelection(document);

// Inside your application render:
TextView({ selection, width: 40, height: 8, isActive: true });

// Programmatic source offsets (UTF-16, clamped to grapheme boundaries):
selection.set(0, 7);
selection.copyText();
// On application disposal, the owner calls selection.dispose().
```

Drag with the left mouse button; Shift-click extends the existing anchor.
Capture ends on release, including outside the view. Keyboard handling is
opt-in through `isActive`: Shift+arrows/Home/End extend, Ctrl+A selects all,
Escape clears, and Ctrl+Shift+C copies. Plain Ctrl+C is not intercepted. A
terminal may reserve Ctrl+Shift+C for its own clipboard; applications can also
call `selection.copyText()` from their own commands. Without `onCopy`, copying
uses the existing OSC 52 adapter only when the terminal reports support.

`onCopy(text)` overrides that clipboard adapter. `copyText()` itself does not
write anything: it returns selected source text with terminal protocols removed,
preserves tabs and source newlines, and never inserts soft-wrap newlines. Source
controls are displayed as visible replacement characters, not interpreted as
ANSI. CRLF terminators do not occupy display cells; copied CRLF is normalized to LF.

`wrap` is `'word'` (default), `'grapheme'`, or `'none'`; `tabSize` defaults to 4.
`style` supplies base text styles and `selectionStyle` overrides selected ink
(default: inverse). Width/height are positive integers. Use a surrounding Box
for borders, padding and layout. No-wrap overflow is clipped; horizontal
scrolling is not implemented in this adapter.

Mouse wheel scrolling is internal unless `scrollTop` is supplied. Controlled
scrolling reports requested visual rows through `onScrollTopChange`; the parent
must update `scrollTop`. Resize and document edits reproject the same source
selection. `TextViewport.rangeRects(start, end, firstRow?, rowCount?)` exposes
immutable row/column/width ranges for other adapters, with no newline cells.

Only visible rows create VNodes. Reflow still processes the full document on
revision changes; this is not yet incremental large-document layout. Selection
does not automatically extend across separate views or ordinary Markdown VNodes.
The [MarkdownView reader](/components/molecules/markdown.md#selectable-markdown-reader)
provides an explicit formatted display-to-source projection on this viewport.

Try `pnpm example text-selection-lab` for an interactive copy preview.

## Colors

### Named Colors

```typescript
// Standard colors
Text({ color: 'red' }, 'Red')
Text({ color: 'green' }, 'Green')
Text({ color: 'blue' }, 'Blue')
Text({ color: 'yellow' }, 'Yellow')
Text({ color: 'magenta' }, 'Magenta')
Text({ color: 'cyan' }, 'Cyan')
Text({ color: 'white' }, 'White')
Text({ color: 'gray' }, 'Gray')

// Bright variants
Text({ color: 'redBright' }, 'Bright Red')
Text({ color: 'greenBright' }, 'Bright Green')
// ... etc
```

### Hex & RGB Colors

```typescript
Text({ color: '#ff6b6b' }, 'Coral')
Text({ color: '#4ecdc4' }, 'Teal')
Text({ color: 'rgb(255, 107, 107)' }, 'RGB Coral')
```

### Background Colors

```typescript
Text({ backgroundColor: 'blue' }, 'Blue background')
Text({ color: 'white', backgroundColor: 'red' }, 'White on red')
Text({ backgroundColor: '#333' }, 'Dark background')
```

## Text Styles

```typescript
Text({ bold: true }, 'Bold')
Text({ dim: true }, 'Dimmed')
Text({ italic: true }, 'Italic')
Text({ underline: true }, 'Underlined')
Text({ strikethrough: true }, 'Strikethrough')
Text({ inverse: true }, 'Inverted')

// Combine styles
Text({ bold: true, underline: true, color: 'cyan' }, 'Bold underlined cyan')
```

## Text Wrapping

```typescript
// Wrap text at container width
Text({ wrap: 'wrap' }, 'Long text that will wrap to multiple lines when needed...')

// Truncate with ellipsis
Text({ wrap: 'truncate' }, 'Long text that will be truncated with...')

// Truncate at start
Text({ wrap: 'truncate-start' }, '...truncated at the start')

// Truncate in middle
Text({ wrap: 'truncate-middle' }, 'Long te...iddle')

// Constrain to one visible line using truncation.
Text({ wrap: 'truncate-end' }, 'Text on single line')
```

## Props Reference

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `color` | `Color` | - | Text color |
| `backgroundColor` | `Color` | - | Background color |
| `bold` | `boolean` | `false` | Bold text |
| `dim` | `boolean` | `false` | Dimmed text |
| `italic` | `boolean` | `false` | Italic text |
| `underline` | `boolean` | `false` | Underlined text |
| `strikethrough` | `boolean` | `false` | Strikethrough text |
| `inverse` | `boolean` | `false` | Swap foreground/background |
| `wrap` | `'wrap' \| 'truncate' \| 'truncate-start' \| 'truncate-middle' \| 'truncate-end'` | wrapping | Text wrapping mode |

## Color Reference

### Standard Colors
`black` `red` `green` `yellow` `blue` `magenta` `cyan` `white` `gray`

### Bright Colors
`blackBright` `redBright` `greenBright` `yellowBright` `blueBright` `magentaBright` `cyanBright` `whiteBright`

## Examples

### Status Indicator

```typescript
function Status({ status }: { status: 'ok' | 'warning' | 'error' }) {
  const colors = { ok: 'green', warning: 'yellow', error: 'red' };
  const icons = { ok: '✓', warning: '⚠', error: '✗' };

  return Text({ color: colors[status], bold: true },
    `${icons[status]} ${status.toUpperCase()}`
  );
}
```

### Code Output

```typescript
Box({ padding: 1, backgroundColor: '#1e1e1e' },
  Text({ color: '#569cd6' }, 'const '),
  Text({ color: '#4ec9b0' }, 'message'),
  Text({ color: 'white' }, ' = '),
  Text({ color: '#ce9178' }, '"Hello"'),
  Text({ color: 'white' }, ';')
)
```
