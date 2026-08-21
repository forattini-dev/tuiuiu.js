# useTimeout

Create a delayed execution with automatic cleanup on unmount. Perfect for debouncing, auto-hide, and delayed actions.

## Basic Usage

```typescript
import { useTimeout, useState } from 'tuiuiu.js';

function AutoHideNotification() {
  const [visible, setVisible] = useState(true);

  // Hide after 3 seconds
  useTimeout(() => setVisible(false), 3000, { enabled: visible() });

  return visible() ? Text({ color: 'green' }, 'Success!') : null;
}
```

## Signature

```typescript
function useTimeout(
  callback: () => void,
  delay: number,
  options?: UseTimeoutOptions
): UseTimeoutReturn
```

## Parameters

| Parameter | Type | Required | Default | Description |
|:----------|:-----|:---------|:--------|:------------|
| `callback` | `() => void` | Yes | - | Function to call after delay |
| `delay` | `number` | Yes | - | Delay in milliseconds before execution |
| `options.enabled` | `boolean` | No | `true` | Start/cancel timer reactively |

## Return Value

| Property | Type | Description |
|:---------|:-----|:------------|
| `start` | `() => void` | Manually start/restart the timeout |
| `cancel` | `() => void` | Cancel the pending timeout |
| `isPending` | `() => boolean` | Check if timeout is pending |

## Examples

### Auto-Save with Cancel

```typescript
function Editor() {
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(true);

  const { cancel, isPending } = useTimeout(
    async () => {
      await saveToServer(content());
      setSaved(true);
    },
    2000,
    { enabled: !saved() }
  );

  // Reset timeout on each change
  const handleChange = (value: string) => {
    setContent(value);
    setSaved(false);
  };

  return Box({ flexDirection: 'column' },
    TextInput({ value: content(), onChange: handleChange }),
    Text({ color: saved() ? 'green' : 'yellow' },
      saved() ? 'Saved' : isPending() ? 'Saving in 2s...' : 'Modified'
    )
  );
}
```

### Activity Timeout (Idle Detection)

```typescript
function SessionManager() {
  const [isActive, setIsActive] = useState(true);

  // Logout after 5 minutes of inactivity
  const { start, cancel } = useTimeout(
    () => {
      setIsActive(false);
      logout();
    },
    5 * 60 * 1000 // 5 minutes
  );

  // Reset timeout on any activity
  useInteraction(() => {
    cancel();
    start();
    return false;
  });

  useMouse(() => {
    cancel();
    start();
  });

  return Text({},
    isActive() ? 'Session active' : 'Session expired'
  );
}
```

### Debounced Search

```typescript
function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const { start, cancel } = useTimeout(
    async () => {
      const data = await search(query());
      setResults(data);
    },
    300 // 300ms debounce
  );

  const handleChange = (value: string) => {
    setQuery(value);
    cancel();  // Cancel previous
    start();   // Start new timeout
  };

  return Box({ flexDirection: 'column' },
    TextInput({ value: query(), onChange: handleChange }),
    Each(results(), item => Text({}, item.name))
  );
}
```

### Toast Notification

```typescript
function Toast({ message, duration = 3000, onClose }) {
  const { cancel } = useTimeout(onClose, duration);

  // Cancel auto-close on hover/interaction
  return Box({
    borderStyle: 'round',
    padding: 1,
    backgroundColor: 'blue',
    onMouseEnter: cancel,
    onMouseLeave: () => start()
  },
    Text({ color: 'white' }, message),
    Button({ label: '×', onClick: onClose })
  );
}
```

## Comparison with setTimeout

| Feature | `useTimeout` | `setTimeout` |
|:--------|:-------------|:-------------|
| Automatic cleanup | ✅ Yes | ❌ Manual clearTimeout |
| Reactive enable/disable | ✅ Yes | ❌ No |
| Start/cancel controls | ✅ Built-in | ❌ Manual |
| Memory leak safe | ✅ Yes | ⚠️ Needs cleanup |

## Best Practices

1. **Use `enabled` for conditional timeouts** - cleaner than manual start/cancel
2. **Use `cancel()` + `start()`** for restart behavior
3. **Always consider cleanup** - useTimeout handles this automatically
4. **For repeated delays**, consider `useInterval` instead

## API Reference

```typescript
interface UseTimeoutOptions {
  enabled?: boolean; // default: true
}

interface UseTimeoutReturn {
  start: () => void;
  cancel: () => void;
  isPending: () => boolean;
}
```
