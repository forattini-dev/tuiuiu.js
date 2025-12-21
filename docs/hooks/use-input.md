# useInput

Handle keyboard input for a component.

## Usage

The handler receives two arguments: the raw input string and a structured `Key` object.

```typescript
import { useInput } from 'tuiuiu.js';

function Game() {
  useInput((input, key) => {
    if (key.upArrow) {
      movePlayer('up');
    }
    if (input === 'q') {
      quitGame();
    }
  });

  return Text({}, "Press arrows to move, 'q' to quit.");
}
```

## Key Object

The `Key` object provides boolean flags for special keys and modifiers:

- **Arrows**: `upArrow`, `downArrow`, `leftArrow`, `rightArrow`
- **Modifiers**: `ctrl`, `shift`, `meta`
- **Navigation**: `pageUp`, `pageDown`, `home`, `end`, `tab`
- **Editing**: `backspace`, `delete`, `insert`, `return` (Enter), `escape`

## Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `isActive` | `boolean` | `true` | Whether the handler is active. |

```typescript
useInput(handler, { isActive: isFocused });
```
