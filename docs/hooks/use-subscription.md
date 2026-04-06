# useSubscription

Connect external event sources (EventEmitter, WebSocket, streams) to reactive signals. The subscription is automatically cleaned up on unmount.

## Basic Usage

```typescript
import { useSubscription, Text } from 'tuiuiu.js';

function PriceDisplay() {
  const price = useSubscription<number>(
    (cb) => {
      ws.on('price', cb);
      return () => ws.off('price', cb);
    },
    { initialValue: 0 }
  );

  return Text({}, `Price: $${price()}`);
}
```

## Signature

```typescript
function useSubscription<T>(
  subscribe: (callback: (value: T) => void) => () => void,
  options?: UseSubscriptionOptions<T>
): () => T | undefined
```

## Parameters

| Parameter | Type | Required | Default | Description |
|:----------|:-----|:---------|:--------|:------------|
| `subscribe` | `(cb: (value: T) => void) => () => void` | Yes | - | Function that subscribes to a source and returns an unsubscribe function |
| `options.initialValue` | `T` | No | `undefined` | Value before the first emission |
| `options.enabled` | `boolean` | No | `true` | Enable/disable the subscription reactively |

## Return Value

A signal getter `() => T | undefined` that updates whenever the subscription emits a new value.

## Examples

### EventEmitter

```typescript
function LogViewer() {
  const lastLog = useSubscription<string>((cb) => {
    process.stderr.on('data', (chunk) => cb(chunk.toString()));
    return () => process.stderr.off('data', cb);
  });

  return Text({}, lastLog() ?? 'Waiting for logs...');
}
```

### WebSocket

```typescript
function LiveFeed() {
  const message = useSubscription<string>((cb) => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.onmessage = (e) => cb(e.data);
    return () => ws.close();
  });

  return Text({}, message() ?? 'Connecting...');
}
```

### Node.js Readable Stream

```typescript
function FileWatcher() {
  const line = useSubscription<string>((cb) => {
    const rl = readline.createInterface({ input: stream });
    rl.on('line', cb);
    return () => rl.close();
  });

  return Text({}, line() ?? 'Waiting...');
}
```

### Conditional Subscription

```typescript
function ConditionalFeed() {
  const [active, setActive] = useState(true);

  const data = useSubscription<string>(
    (cb) => {
      source.on('data', cb);
      return () => source.off('data', cb);
    },
    { enabled: active(), initialValue: 'idle' }
  );

  useHotkeys('space', () => setActive(a => !a));

  return Box({ flexDirection: 'column' },
    Text({}, `Status: ${active() ? 'listening' : 'paused'}`),
    Text({}, `Last: ${data()}`)
  );
}
```

## Comparison with useEffect

| Feature | `useSubscription` | Manual `useEffect` |
|:--------|:------------------|:-------------------|
| Automatic cleanup | Yes | Manual return |
| Signal integration | Built-in | Manual createSignal |
| Enable/disable | Built-in option | Manual logic |
| Type-safe getter | Yes | Manual |

## Best Practices

1. **Always return an unsubscribe function** from the subscribe callback
2. **Use `initialValue`** to avoid `undefined` flicker on first render
3. **Use `enabled`** to pause/resume subscriptions instead of conditional hook calls
4. **Keep the subscribe function stable** — it's called once on mount, not on every render

## API Reference

```typescript
interface UseSubscriptionOptions<T> {
  initialValue?: T;    // default: undefined
  enabled?: boolean;   // default: true
}
```
