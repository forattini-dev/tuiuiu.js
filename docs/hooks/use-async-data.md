# useAsyncData

Async data fetching with full lifecycle management: loading state, error handling, abort on refetch/unmount, and optional auto-polling.

## Basic Usage

```typescript
import { useAsyncData, Text, Spinner } from 'tuiuiu.js';

function DataDisplay() {
  const { data, loading, error } = useAsyncData(
    (signal) => fetch('/api/data', { signal }).then(r => r.json())
  );

  if (loading()) return Spinner({ label: 'Loading...' });
  if (error()) return Text({ color: 'error' }, `Error: ${error()!.message}`);
  return Text({}, `Data: ${JSON.stringify(data())}`);
}
```

## Signature

```typescript
function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  options?: UseAsyncDataOptions
): UseAsyncDataReturn<T>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|:----------|:-----|:---------|:--------|:------------|
| `fetcher` | `(signal: AbortSignal) => Promise<T>` | Yes | - | Async function that fetches data. Receives an AbortSignal for cancellation. |
| `options.enabled` | `boolean` | No | `true` | Enable/disable fetching reactively |
| `options.refreshInterval` | `number` | No | - | Auto-refetch interval in milliseconds |

## Return Value

| Property | Type | Description |
|:---------|:-----|:------------|
| `data` | `() => T \| undefined` | The fetched data (undefined until loaded) |
| `loading` | `() => boolean` | Whether a fetch is in progress |
| `error` | `() => Error \| undefined` | Error from the last fetch attempt |
| `refetch` | `() => void` | Trigger a manual refetch (aborts any in-flight request) |

## Examples

### With Auto-Polling

```typescript
function StatusMonitor() {
  const { data, loading } = useAsyncData(
    (signal) => fetch('/api/status', { signal }).then(r => r.json()),
    { refreshInterval: 5000 }
  );

  return Box({ flexDirection: 'column' },
    Text({ dim: loading() }, 'System Status'),
    Text({}, data()?.status ?? 'Unknown')
  );
}
```

### Manual Refetch

```typescript
function RefreshableView() {
  const { data, loading, refetch } = useAsyncData(
    (signal) => fetch('/api/items', { signal }).then(r => r.json())
  );

  useHotkeys('r', () => refetch());

  return Box({ flexDirection: 'column' },
    Text({ dim: true }, loading() ? 'Refreshing...' : 'Press R to refresh'),
    Text({}, `Items: ${data()?.length ?? 0}`)
  );
}
```

### Conditional Fetching

```typescript
function ConditionalFetch() {
  const [userId, setUserId] = useState<string | null>(null);

  const { data, loading, error } = useAsyncData(
    (signal) => fetch(`/api/users/${userId()}`, { signal }).then(r => r.json()),
    { enabled: userId() !== null }
  );

  return Box({ flexDirection: 'column' },
    TextInput({
      placeholder: 'Enter user ID...',
      onSubmit: (value) => setUserId(value),
    }),
    loading() ? Spinner({}) : null,
    error() ? Text({ color: 'error' }, error()!.message) : null,
    data() ? Text({}, `Name: ${data().name}`) : null,
  );
}
```

### With AbortSignal

```typescript
function CancellableFetch() {
  const { data, loading, refetch } = useAsyncData(async (signal) => {
    const res = await fetch('/api/slow-endpoint', { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

  // Refetch aborts the previous request automatically
  useHotkeys('r', () => refetch());

  return Text({}, loading() ? 'Loading...' : JSON.stringify(data()));
}
```

## Comparison

| Feature | `useAsyncData` | Manual fetch in `useEffect` |
|:--------|:---------------|:---------------------------|
| Loading state | Built-in | Manual signal |
| Error handling | Built-in | Manual try/catch |
| Abort on unmount | Automatic | Manual AbortController |
| Abort on refetch | Automatic | Manual |
| Auto-polling | Built-in option | Manual setInterval |
| Type-safe | Yes | Manual |

## Best Practices

1. **Always use the `signal` parameter** — pass it to `fetch()` or check `signal.aborted` in long operations
2. **Use `refreshInterval`** for polling instead of combining with `useInterval`
3. **Use `enabled`** to defer fetching until dependencies are ready
4. **Use `refetch()`** for user-triggered refreshes — it automatically cancels in-flight requests

## API Reference

```typescript
interface UseAsyncDataOptions {
  enabled?: boolean;         // default: true
  refreshInterval?: number;  // auto-polling interval in ms
}

interface UseAsyncDataReturn<T> {
  data: () => T | undefined;
  loading: () => boolean;
  error: () => Error | undefined;
  refetch: () => void;
}
```
