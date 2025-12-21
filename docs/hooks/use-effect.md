# useEffect

Run side effects in response to signal changes.

## Usage

This hook wraps the core `createEffect` primitive but ensures it integrates correctly with the component lifecycle (auto-cleanup on unmount).

```typescript
import { useEffect, createSignal } from 'tuiuiu.js';

function Timer() {
  const [count, setCount] = createSignal(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);

    // Cleanup function called on unmount or re-run
    return () => clearInterval(timer);
  });

  return Text({}, `Seconds: ${count()}`);
}
```

## Behavior

- **Auto-tracking**: Automatically tracks any signals read within the function.
- **Re-runs**: Re-runs whenever a dependency changes.
- **Cleanup**: If a function is returned, it runs before the next effect run or when the component unmounts.
