# Hotkeys & Input

Tuiuiu provides a robust system for handling keyboard input and hotkeys directly in your components.

## useInput

The primary way to handle input is the `useInput` hook. It provides access to raw character input and parsed key events.

```typescript
import { useInput } from 'tuiuiu.js';

useInput((input, key) => {
  // input: string (e.g. "a", "A", "1", " ")
  // key: Key object (e.g. { return: true, ctrl: true, ... })
});
```

### Key Object

The `key` object contains boolean flags for special keys and modifiers:

| Property | Description |
|:---------|:------------|
| `upArrow`, `downArrow`, `leftArrow`, `rightArrow` | Navigation keys |
| `return`, `enter` | Enter key |
| `escape` | Escape key |
| `backspace`, `delete` | Deletion keys |
| `tab` | Tab key |
| `home`, `end`, `pageUp`, `pageDown` | Navigation helpers |
| `f1` - `f12` | Function keys |
| `ctrl`, `shift`, `meta` (Alt), `option` | Modifiers |

## isHotkey

For complex key combinations, Tuiuiu provides the `isHotkey` utility. It allows you to match key events against a string pattern.

```typescript
import { useInput, isHotkey } from 'tuiuiu.js';

useInput((input, key) => {
  // Check for Ctrl+C
  if (isHotkey('ctrl+c', key, input)) {
    exit();
  }

  // Check for Shift+Enter
  if (isHotkey('shift+enter', key)) {
    insertNewline();
  }

  // Check for function keys
  if (isHotkey('f1', key)) {
    showHelp();
  }
});
```

### Supported Patterns

Patterns are case-insensitive and can combine modifiers with keys using `+`.

- **Modifiers:** `ctrl`, `shift`, `meta` (or `alt`), `option` (or `opt`)
- **Keys:**
  - `a`-`z`, `0`-`9`
  - `return`, `enter`
  - `escape`, `esc`
  - `backspace`, `delete`, `del`
  - `tab`, `space`
  - `up`, `down`, `left`, `right`
  - `home`, `end`, `pageup`, `pagedown`
  - `f1`-`f12`

### Examples

| Pattern | Description |
|:--------|:------------|
| `ctrl+s` | Control + S |
| `shift+up` | Shift + Up Arrow |
| `meta+d` | Alt/Meta + D |
| `ctrl+shift+p` | Control + Shift + P |
| `enter` | Enter key |
| `esc` | Escape key |

## Best Practices

1.  **Scope Input:** `useInput` handles input globally for the app by default. To scope it to a specific active component, check your component's active state (e.g., `if (!isActive) return;`) inside the handler.
2.  **Prevent Default:** If you handle a key that has a default behavior (like `tab` for navigation), you may need to stop propagation if your component consumes it (though Tuiuiu's event bubbling is manual currently).
3.  **Global Shortcuts:** For global app shortcuts (like `Ctrl+Q` to quit), place the `useInput` hook in your root `App` component.
