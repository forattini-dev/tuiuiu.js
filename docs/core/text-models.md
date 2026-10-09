# Text documents, editors and viewports

Import these renderer-independent models from `tuiuiu.js/interaction`.
They use no component owner, terminal, JSX, or third-party dependencies.

```ts
import {
  createTextDocument, createTextEditor, createTextViewport,
} from 'tuiuiu.js/interaction';

const document = createTextDocument({ initialValue: 'Olá 👋\nsegunda linha' });
const editor = createTextEditor({ document, historyLimit: 100 });
const viewport = createTextViewport(document, { width: 20, wrap: 'word', tabSize: 4 });

editor.setSelection(0, 3);
editor.insert('Oi');
editor.undo();
editor.redo();

const rows = viewport.lines();
const cursor = viewport.positionAt(editor.snapshot().cursor);
const offset = viewport.offsetAt(cursor.row, cursor.column);
viewport.configure({ width: 10, wrap: 'grapheme' });
editor.dispose();
```

## Ownership and coordinates

A document owns content, its revision, an indexed set of logical lines, and an
optional `maxLength`. An editor owns its cursor, selection, and bounded history.
A viewport owns terminal geometry and cached visual rows. Several editors and
viewports may share a document without sharing cursor state.

Offsets are safe-integer UTF-16 positions, not terminal columns or character
counts. Cursor/selection positions clamp left to grapheme boundaries. Replacement
ranges expand to cover whole graphemes; insertion positions clamp left.
Out-of-range integer offsets clamp to the document. Invalid numbers are rejected.
Limits count UTF-16 units and never split a grapheme to meet the limit.

`document.line(index)` excludes LF and CRLF terminators but preserves original
source offsets; a trailing newline produces a final empty logical line.
`document.subscribe()` reports the old replacement range and inserted text.
Unchanged content produces no revision or notification.

## Editing and lifetime

`setSelection(anchor, head)` preserves selection direction. Insertion/deletion
replaces a selected range. Movement accepts `extend` as its last parameter;
ordinary left/right movement collapses a selection to its respective edge.
Home/end refer to the entire document, not a visual row.

Undo/redo restore content, cursor and selection. The default retains at most
100 edits; `historyLimit: 0` disables history. History stores full strings rather
than a rope or edit log, so memory still depends on document length. A fresh edit
clears redo. `setValue()` resets history.

External document changes remap cursor/selection and clear that editor's history,
preventing undo from overwriting another editor's intervening edit. Call
`dispose()` to unsubscribe an editor sharing a long-lived document. Disposal is
idempotent; later mutations through that editor are rejected. When passing
`document`, configure `initialValue`/`maxLength` on the document, not the editor.

## Reflow and mapping

`lines()` is a frozen array of frozen rows, reused until document revision or
configuration changes. Each row exposes raw `text`, terminal `displayText`
(tabs expanded), `width`, `start`, `end`, and `logicalLine`.

`positionAt(offset, 'forward')` maps a soft-wrap boundary to the next visual
row; `'backward'` keeps it at the preceding row's end. `offsetAt(row, column)`
clamps coordinates and never places a cursor inside a wide glyph. A glyph wider
than the viewport occupies one row rather than being split or discarded.

This is a plain-text model, not an ANSI/Markdown parser. Reflow still visits the
whole document on a content/configuration change; unchanged reads reuse layout.
TextInput reuses this wrapping implementation with two cached width configurations
per controller (content with and without its scrollbar). Its rich segments and
completion state remain separate; this does not add selection/undo keybindings
to TextInput automatically.

## Stable list anchors

`ScrollList` and `ChatList` accept a stable unique `getKey`:

```ts
import { Text } from 'tuiuiu.js';
import { component, useConst } from 'tuiuiu.js/app';
import { ScrollList, createScrollList } from 'tuiuiu.js/ui';

const MessageList = component('MessageList', (props: {
  messages: { id: string; content: string }[];
}) => {
  const state = useConst(() => createScrollList());
  return ScrollList({
    state, items: props.messages, getKey: message => message.id,
    height: 20, width: 80,
    children: message => Text({ wrap: 'wrap' }, message.content),
    autoScroll: true, autoScrollThreshold: 2,
  });
});
```

With keys, `preserveAnchor` defaults to true: prepend, removals and reflow preserve
the visible item and its physical-line offset, within the available scroll range.
If the anchor disappears, the next surviving old item is preferred, then a prior
one. Keys must be unique strings or finite numbers. Use `preserveAnchor: false`
to retain numeric scroll offsets; lists without keys keep that behavior.

Smart auto-follow takes precedence when content grows while near the bottom.
The historical `autoScrollThreshold: 0` means **always follow growth**, not
"only when exactly at bottom". Use a positive threshold for reading history.

Inverted scroll offsets measure distance upward from the bottom. Item order
remains oldest-to-newest on screen, including partial multiline items.
Anchoring stores physical-line offsets, not a character position across reflow.
Height measurement and prefix rebuilding still visit items; this is not a
million-row data virtualization API.
