# useMouse

Handle mouse input events from the terminal.

## Requirements

The terminal must support mouse tracking (most modern terminals like xterm, iTerm2, Kitty, Windows Terminal do).

**Note:** When mouse tracking is enabled, selecting text in the terminal might require holding `Shift` (depending on the terminal emulator).

## Component Events (Recommended)

The easiest way to handle mouse interaction is by using event props directly on components like `Box` and `Text`.

```typescript
import { Box, Text } from 'tuiuiu.js';

function Button() {
  return Box({
    borderStyle: 'round',
    padding: 1,
    // Handle click events directly on the component
    onClick: () => console.log('Clicked!'),
    onMouseEnter: () => console.log('Hovered'),
    onMouseLeave: () => console.log('Left'),
  },
    Text({}, 'Click Me')
  );
}
```

## Supported Events

All basic components (`Box`, `Text`, etc.) support the following events:

| Event | Description |
| :--- | :--- |
| `onClick` | Left mouse button click |
| `onDoubleClick` | Double click (left button) |
| `onContextMenu` | Right mouse button click |
| `onMouseDown` | Any mouse button pressed |
| `onMouseUp` | Any mouse button released |
| `onMouseMove` | Mouse moved over the component |
| `onMouseEnter` | Mouse entered the component area |
| `onMouseLeave` | Mouse left the component area |
| `onScroll` | Scroll wheel usage |

## Global Mouse Hook (`useMouse`)

If you need global mouse coordinates or low-level access (e.g. for drag-and-drop across the screen), use the `useMouse` hook.

```typescript
import { useMouse } from 'tuiuiu.js';

useMouse((event) => {
  console.log(`Global mouse event: ${event.action} at ${event.x}, ${event.y}`);
});
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

The system automatically detects double-clicks and triggers `onDoubleClick` or sets `action: 'double-click'`.
