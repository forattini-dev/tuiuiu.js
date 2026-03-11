# useNotification

Capability-aware terminal notifications through `OSC 9`, `OSC 99`, or `OSC 777`.

## Import

```typescript
import { useNotification } from 'tuiuiu.js';
```

## Basic Usage

```typescript
function NotifyButton() {
  const { notify, supported } = useNotification();

  return Button({
    label: supported ? 'Notify' : 'Notifications unavailable',
    disabled: !supported,
    onClick: () => notify('Build finished', 'All checks passed'),
  });
}
```

## Return Value

```typescript
interface UseNotificationResult {
  notify: (title: string, body?: string) => void;
  supported: boolean;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `notify` | `(title: string, body?: string) => void` | Sends the best supported terminal notification sequence |
| `supported` | `boolean` | Whether the negotiated terminal capabilities expose a notification channel |

## Notes

- unsupported terminals degrade to a no-op
- the actual sequence depends on the terminal profile: `OSC 9`, `OSC 99`, or `OSC 777`
- this is terminal-level UX, not an in-app toast replacement

## Example

```typescript
import { Box, Button, Text, useNotification } from 'tuiuiu.js';

function DeployActions() {
  const { notify, supported } = useNotification();

  return Box({ flexDirection: 'column', gap: 1 },
    Button({
      label: 'Deploy',
      onClick: async () => {
        await runDeploy();
        notify('Deploy complete', 'Production is up to date');
      },
    }),
    Text({}, supported ? 'Terminal notifications enabled' : 'No terminal notification channel'),
  );
}
```
