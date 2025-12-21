# useApp

Access the global application context.

## Usage

```typescript
import { useApp } from 'tuiuiu';

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
