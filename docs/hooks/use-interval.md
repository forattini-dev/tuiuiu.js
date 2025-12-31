# useInterval

Create a recurring timer with automatic cleanup on unmount. Perfect for animations, polling, and periodic updates.

## Basic Usage

```typescript
import { useInterval, useState } from 'tuiuiu.js';

function AnimatedCounter() {
  const [count, setCount] = useState(0);

  // Increment every 100ms
  useInterval(() => setCount(c => c + 1), 100);

  return Text({}, `Frame: ${count()}`);
}
```

## Signature

```typescript
function useInterval(
  callback: () => void,
  delay: number,
  options?: UseIntervalOptions
): UseIntervalReturn
```

## Parameters

| Parameter | Type | Required | Default | Description |
|:----------|:-----|:---------|:--------|:------------|
| `callback` | `() => void` | Yes | - | Function to call on each interval tick |
| `delay` | `number` | Yes | - | Delay between ticks in milliseconds |
| `options.enabled` | `boolean` | No | `true` | Start/stop timer reactively |
| `options.immediate` | `boolean` | No | `false` | Execute callback immediately on mount |

## Return Value

| Property | Type | Description |
|:---------|:-----|:------------|
| `start` | `() => void` | Manually start/restart the interval |
| `stop` | `() => void` | Manually stop the interval |
| `isRunning` | `() => boolean` | Check if interval is currently active |

## Examples

### Polling Data

```typescript
function DataPoller() {
  const [data, setData] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  // Poll every 5 seconds when enabled
  useInterval(
    async () => {
      const response = await fetch('/api/data');
      setData(await response.json());
    },
    5000,
    { enabled: isPolling() }
  );

  return Box({ flexDirection: 'column' },
    Text({}, data() ? JSON.stringify(data()) : 'Loading...'),
    Button({
      label: isPolling() ? 'Stop Polling' : 'Start Polling',
      onClick: () => setIsPolling(p => !p)
    })
  );
}
```

### Animation with Manual Controls

```typescript
function AnimatedSpinner() {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const [frameIndex, setFrameIndex] = useState(0);

  const { start, stop, isRunning } = useInterval(
    () => setFrameIndex(i => (i + 1) % frames.length),
    80
  );

  return Box({ flexDirection: 'column' },
    Text({ color: 'cyan' }, frames[frameIndex()]),
    Box({ marginTop: 1 },
      Button({ label: 'Start', onClick: start, disabled: isRunning() }),
      Button({ label: 'Stop', onClick: stop, disabled: !isRunning() })
    )
  );
}
```

### Immediate Execution

```typescript
function Clock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  // Update immediately, then every second
  useInterval(
    () => setTime(new Date().toLocaleTimeString()),
    1000,
    { immediate: true }
  );

  return Text({ bold: true }, time());
}
```

### Progress Animation

```typescript
function LoadingBar() {
  const [progress, setProgress] = useState(0);

  useInterval(
    () => setProgress(p => p >= 100 ? 0 : p + 2),
    50
  );

  return ProgressBar({ value: progress(), width: 40 });
}
```

## Comparison with setTimeout

| Feature | `useInterval` | `setTimeout` |
|:--------|:--------------|:-------------|
| Automatic cleanup | ✅ Yes | ❌ Manual |
| Reactive enable/disable | ✅ Yes | ❌ No |
| Start/stop controls | ✅ Built-in | ❌ Manual |
| Immediate execution | ✅ Option | ❌ Manual |

## Best Practices

1. **Use `enabled` for conditional intervals** instead of conditionally calling useInterval
2. **Use `immediate: true`** when you need the callback to run immediately on mount
3. **Use the returned controls** for manual start/stop instead of toggling `enabled`
4. **Keep callbacks light** - heavy operations should be debounced or throttled

## API Reference

```typescript
interface UseIntervalOptions {
  enabled?: boolean;   // default: true
  immediate?: boolean; // default: false
}

interface UseIntervalReturn {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}
```
