# useMouse

Handle mouse input events from the terminal.

## Requirements

The terminal must support mouse tracking (most modern terminals like xterm, iTerm2, Kitty, Windows Terminal do).

**Note:** When mouse tracking is enabled, selecting text in the terminal might require holding `Shift` (depending on the terminal emulator).

## Usage

```typescript
import { useMouse } from 'tuiuiu';

function ClickableBox() {
  const [active, setActive] = createSignal(false);

  useMouse((event) => {
    // Check if click is within bounds of our logic
    // Note: To map coordinates to components, you currently need to know their position manually
    // or use full-screen absolute positioning.
    
    if (event.action === 'click' && event.button === 'left') {
      console.log(`Clicked at ${event.x}, ${event.y}`);
      setActive(true);
    }
  });

  return Box({ borderStyle: active() ? 'double' : 'single' },
    Text({}, 'Click anywhere!')
  );
}
```

## Mouse Event Object

| Property | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | Column index (0-based) |
| `y` | `number` | Row index (0-based) |
| `button` | `'left' \| 'middle' \| 'right' \| 'scroll-up' \| 'scroll-down'` | The button pressed |
| `action` | `'click' \| 'double-click' \| 'drag' \| 'release' \| 'move'` | The action type |
| `modifiers` | `{ ctrl: boolean, shift: boolean, alt: boolean }` | Modifier keys held |

## Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `isActive` | `boolean` | `true` | Whether the handler is active. |
| `enableTracking` | `boolean` | `true` | Whether to enable terminal mouse tracking mode automatically. |

## Double Click

The `useMouse` hook automatically detects double-clicks and upgrades the `action` to `'double-click'`.

## Limitations

- **Hit Testing**: Currently, `tuiuiu` does not provide built-in hit testing for components (i.e., "did I click *this* box?"). You receive global coordinates and must calculate logic based on known layout positions. Future versions may add event bubbling.
