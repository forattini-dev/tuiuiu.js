# Error Handling

Tuiuiu provides error boundaries and utilities to prevent crashes from breaking your terminal UI.

## `withErrorBoundary`

Wraps a component so that errors show a formatted error screen instead of crashing the process.

```typescript
import { render, withErrorBoundary, Box, Text, useState, useHotkeys } from 'tuiuiu.js';

function App() {
  const [count, setCount] = useState(0);
  useHotkeys('up', () => setCount(c => c + 1));

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

## Best practices

1. **Always wrap your root component** with `withErrorBoundary` in production apps
2. Use `tryCatch` for operations that might fail (parsing, file I/O, network)
3. Use `onCleanup` in effects to prevent resource leaks that cause errors later
4. Errors in event handlers (useInput, useHotkeys) are caught and logged — they don't crash the app
