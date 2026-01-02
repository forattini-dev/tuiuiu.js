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

## Format Utilities

Pure formatting functions for common display patterns. All functions are zero-dependency and work with both static values and reactive wrappers.

```typescript
import {
  formatBytes,
  formatDuration,
  formatRelative,
  formatNumber,
  formatCompact,
  formatPercent,
  formatDelta,
  truncateMiddle,
  truncateEnd,
} from 'tuiuiu.js'
```

### `formatBytes(bytes, format?)`

Formats bytes as human-readable file sizes.

```typescript
formatBytes(1024)              // "1 KiB"
formatBytes(1536000)           // "1.5 MiB"
formatBytes(1536, 'short')     // "1.5K"
formatBytes(1536, 'full')      // "1.5 KiB"
formatBytes(0)                 // "0 B"
formatBytes(1073741824)        // "1 GiB"
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `bytes` | `number` | - | Number of bytes |
| `format` | `'short' \| 'full'` | `'full'` | Output format |

### `formatDuration(seconds, format?)`

Formats seconds as human-readable duration.

```typescript
formatDuration(90)             // "1m 30s"
formatDuration(3661)           // "1h 1m 1s"
formatDuration(3661, 'short')  // "1:01:01"
formatDuration(86400)          // "1d 0h 0m"
formatDuration(0.5)            // "0s"
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `seconds` | `number` | - | Duration in seconds |
| `format` | `'short' \| 'long'` | `'long'` | Output format |

### `formatRelative(timestamp, now?)`

Formats timestamp as relative time.

```typescript
formatRelative(Date.now() - 60000)    // "1 minute ago"
formatRelative(Date.now() - 3600000)  // "1 hour ago"
formatRelative(Date.now() + 120000)   // "in 2 minutes"
formatRelative(Date.now())            // "just now"
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `timestamp` | `Date \| number` | - | Timestamp (Date or ms) |
| `now` | `number` | `Date.now()` | Reference time |

### `formatNumber(n, separator?)`

Formats number with thousand separators.

```typescript
formatNumber(1234567)      // "1,234,567"
formatNumber(1234.56)      // "1,234.56"
formatNumber(1234, '.')    // "1.234"
```

### `formatCompact(n, decimals?)`

Formats large numbers compactly (K, M, B, T).

```typescript
formatCompact(999)         // "999"
formatCompact(1000)        // "1K"
formatCompact(1500000)     // "1.5M"
formatCompact(1234567890)  // "1.2B"
```

### `formatPercent(n, decimals?)`

Formats decimal as percentage.

```typescript
formatPercent(0.156)       // "15.6%"
formatPercent(0.5)         // "50%"
formatPercent(1.234, 2)    // "123.40%"
```

### `formatDelta(delta, decimals?)`

Formats a change value with sign.

```typescript
formatDelta(12.5)          // "+12.5%"
formatDelta(-3.2)          // "-3.2%"
formatDelta(0)             // "0%"
```

### `truncateMiddle(str, maxLength, ellipsis?)`

Truncates string in the middle with ellipsis.

```typescript
truncateMiddle('/very/long/path/to/file.txt', 20)
// "very-lo...file.txt"

truncateMiddle('short.txt', 20)
// "short.txt"

truncateMiddle('longname.txt', 10, '…')
// "long…e.txt"
```

### `truncateEnd(str, maxLength, ellipsis?)`

Truncates string at the end with ellipsis.

```typescript
truncateEnd('very long filename', 12)  // "very long..."
truncateEnd('short', 12)               // "short"
```

## Using with Signals

Formatters are pure functions, so wrap with `createMemo` for reactive usage:

```typescript
const [bytes, setBytes] = createSignal(0)
const formattedSize = createMemo(() => formatBytes(bytes()))

// formattedSize() updates whenever bytes() changes
Text({}, formattedSize())
```
