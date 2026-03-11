# useClipboard

Capability-aware clipboard writes through `OSC 52`.

## Import

```typescript
import { useClipboard } from 'tuiuiu.js';
```

## Basic Usage

```typescript
function CopyButton() {
  const { copy, supported } = useClipboard();

  return Button({
    label: supported ? 'Copy build id' : 'Clipboard unavailable',
    disabled: !supported,
    onClick: () => copy('build-42'),
  });
}
```

## Return Value

```typescript
interface UseClipboardResult {
  copy: (text: string) => void;
  supported: boolean;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `copy` | `(text: string) => void` | Emits an `OSC 52` clipboard write sequence when supported |
| `supported` | `boolean` | Whether the negotiated terminal capabilities currently allow clipboard writes |

## Notes

- this hook writes directly to `stdout`
- unsupported terminals degrade to a no-op
- multiplexers like `tmux` are handled through the progressive passthrough layer

## Example

```typescript
import { Box, Button, Text, useClipboard } from 'tuiuiu.js';

function CopyPanel({ payload }: { payload: string }) {
  const { copy, supported } = useClipboard();

  return Box({ flexDirection: 'column', gap: 1 },
    Button({
      label: supported ? 'Copy JSON' : 'Clipboard unavailable',
      disabled: !supported,
      onClick: () => copy(payload),
    }),
    Text({}, supported ? 'Uses OSC 52' : 'Current terminal does not expose clipboard write'),
  );
}
```
