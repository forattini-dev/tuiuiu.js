# Utilities

Tuiuiu provides a set of low-level utilities for handling text, ANSI codes, and rendering optimization.

## Text Utils

Helper functions for ANSI-aware text manipulation.

### `stringWidth(text)`
Calculates the visible width of a string, accounting for ANSI escape codes and wide characters (like emojis or CJK characters).

```typescript
import { stringWidth } from 'tuiuiu/utils/text-utils';

stringWidth('\x1b[31mHello\x1b[0m'); // Returns 5
stringWidth('👋'); // Returns 2 (wide char)
```

### `stripAnsi(text)`
Removes all ANSI escape codes from a string.

```typescript
import { stripAnsi } from 'tuiuiu/utils/text-utils';

stripAnsi('\x1b[31mHello\x1b[0m'); // Returns 'Hello'
```

### `wrapText(text, width, options)`
Wraps text to a specific width, preserving ANSI codes across line breaks.

```typescript
import { wrapText } from 'tuiuiu/utils/text-utils';

const wrapped = wrapText('Long text with \x1b[31mcolors\x1b[0m...', 10);
```

### `truncateText(text, width, options)`
Truncates text to fit a specific width, inserting an ellipsis.

```typescript
import { truncateText } from 'tuiuiu/utils/text-utils';

truncateText('Hello World', 5); // "Hello..."
truncateText('Hello World', 5, { position: 'middle' }); // "He...ld"
```

## Batcher

Utilities for throttling and debouncing updates.

### `createUpdateBatcher(callback, interval)`
Batches rapid updates into a single callback execution per interval. Useful for rendering high-frequency data streams.

```typescript
import { createUpdateBatcher } from 'tuiuiu/utils/batcher';

const batcher = createUpdateBatcher(() => render(), 50);

onData((chunk) => {
  buffer.push(chunk);
  batcher.schedule();
});
```

### `createDebounced(fn, wait)`
Delays execution until a pause in calls.

### `createThrottled(fn, interval)`
Limits execution to once per interval.

## LogUpdate

Handles efficient incremental rendering to the terminal `stdout`.

```typescript
import { createLogUpdate } from 'tuiuiu/utils/log-update';

const log = createLogUpdate(process.stdout);

log('Frame 1');
// ... time passes ...
log('Frame 2'); // Replaces Frame 1
```

## Cursor

Utilities for hiding and showing the terminal cursor.

```typescript
import { hideCursor, showCursor } from 'tuiuiu/utils/cursor';

hideCursor(); // \u001B[?25l
showCursor(); // \u001B[?25h
```
