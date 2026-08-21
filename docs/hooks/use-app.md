# useApp

Access the global application context.

## Usage

```typescript
import { useApp } from 'tuiuiu.js';

function ExitButton() {
  const { exit } = useApp();

  return Box({ borderStyle: 'single', onClick: () => exit() },
    Text({}, 'Exit App')
  );
}
```

## API

Returns an `AppContext` object with:

| Property | Type | Description |
| :--- | :--- | :--- |
| `exit` | `(error?: Error) => void` | Closes the application. Optional error code 1. |
| `stdin` | `NodeJS.ReadStream` | Raw input stream. |
| `stdout` | `NodeJS.WriteStream` | Raw output stream. |
| `onExit` | `(cb: () => void) => void` | Register a cleanup callback. |
| `autoTabNavigation` | `boolean` | Whether built-in Tab / Shift+Tab navigation is enabled. |
| `setAutoTabNavigation` | `(enabled: boolean) => void` | Enable or disable built-in Tab navigation. |
| `setRawMode` | `(enabled: boolean) => void` | Reference-counted raw mode control. |
| `rawModeEnabledCount` | `number` | Current raw mode reference count. |
| `isRawModeEnabled` | `() => boolean` | Check if raw mode is currently active. |
| `clearScreen` | `() => void` | Reset renderer state and clear the screen when available. |

## Notes

- `useApp()` only works inside a running Tuiuiu app.
- the runtime enables terminal focus reporting automatically on compatible terminals
- use `useTerminalFocus()` when you want reactive focus state inside components

## Example

```typescript
import { Box, Text, useApp, useShortcut, useTerminalFocus } from 'tuiuiu.js';

function AppStatus() {
  const app = useApp();
  const { focused } = useTerminalFocus();

  useShortcut('escape', app.exit);

  return Box({ flexDirection: 'column' },
    Text({}, `Focused: ${focused}`),
    Text({}, `Raw mode refs: ${app.rawModeEnabledCount}`),
  );
}
```
