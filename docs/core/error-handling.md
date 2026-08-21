# Error Handling

Tuiuiu provides error boundaries and utilities to prevent crashes from breaking your terminal UI.

## `withErrorBoundary`

Wraps a component so that errors show a formatted error screen instead of crashing the process.

```typescript
import { render, withErrorBoundary, Box, Text, useState, useShortcut } from 'tuiuiu.js';

function App() {
  const [count, setCount] = useState(0);
  useShortcut('up', () => setCount(c => c + 1));

  // This will crash when count > 5
  if (count() > 5) {
    throw new Error('Count too high!');
  }

  return Box({ padding: 1 },
    Text({}, `Count: ${count()} (crashes at 6)`)
  );
}

// Wrap with error boundary
const SafeApp = withErrorBoundary(App);
const { waitUntilExit } = render(SafeApp);
await waitUntilExit();
```

When an error occurs, tuiuiu shows:
- Error message and type
- Stack trace with file paths
- Source code excerpt (if available)
- The app stays alive — no terminal corruption

## `tryCatch`

Safe execution wrapper that catches errors without crashing.

```typescript
import { tryCatch } from 'tuiuiu.js';

// Returns null on error instead of throwing
const data = tryCatch(() => JSON.parse(rawInput));

// With error handler
const result = tryCatch(
  () => riskyOperation(),
  (error) => console.error('Failed:', error.message)
);
```

## `ErrorOverview` component

Display an error with formatted stack trace. Useful for custom error UI.

```typescript
import { ErrorOverview } from 'tuiuiu.js';

function MyErrorScreen() {
  const error = getLastError();
  if (!error) return null;
  return ErrorOverview({ error });
}
```

## Terminal Panic Hooks

Error boundaries catch render errors, but process-level crashes (uncaught exceptions, unhandled rejections, SIGINT/SIGTERM) can leave the terminal corrupted — raw mode on, cursor hidden, mouse tracking active.

`installPanicHooks()` registers centralized process handlers that restore the terminal to a clean state before exiting. It's called automatically by `render()`, but you can also register custom cleanup callbacks.

```typescript
import { onTerminalPanic, installPanicHooks } from 'tuiuiu.js';

// Automatically installed by render() — you don't need to call this manually
// installPanicHooks();

// Register custom cleanup (e.g., save state, close connections)
const unregister = onTerminalPanic(() => {
  db.close();
  saveState();
});

// Later, if you no longer need this cleanup:
unregister();
```

### What gets restored automatically

When `render()` is used, these are registered automatically:
- Raw mode disabled (`stdin.setRawMode(false)`)
- Cursor restored (`\x1b[?25h`)
- Focus events disabled (`\x1b[?1004l`)
- Bracketed paste disabled (`\x1b[?2004l`)
- Mouse tracking disabled

### Handled signals

- `process.on('exit')` — normal exit
- `SIGINT` (Ctrl+C) — exit code 130
- `SIGTERM` — exit code 143
- `uncaughtException` — logs error, exit code 1
- `unhandledRejection` — logs reason, exit code 1

### API

```typescript
// Register a cleanup callback. Returns unregister function.
function onTerminalPanic(cleanup: () => void): () => void;

// Install process handlers (idempotent, called by render()).
function installPanicHooks(): void;

// Execute all registered cleanups (LIFO order).
function restoreTerminal(): void;

// Remove all handlers and clear registry (for tests).
function removePanicHooks(): void;
```

## Best practices

1. **Always wrap your root component** with `withErrorBoundary` in production apps
2. Use `tryCatch` for operations that might fail (parsing, file I/O, network)
3. Use `onCleanup` in effects to prevent resource leaks that cause errors later
4. Errors in interaction handlers and shortcuts are isolated and reported through the app error boundary
5. Use `onTerminalPanic` to register cleanup for external resources (database connections, temp files) that should be cleaned up on crash
