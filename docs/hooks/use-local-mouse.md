# useLocalMouse

Transform terminal-absolute mouse coordinates to component-relative coordinates. Essential for canvas drawing, drag-and-drop, and hit testing.

## Basic Usage

```typescript
import { useLocalMouse } from 'tuiuiu.js';

function DrawingCanvas() {
  const bounds = { x: 10, y: 5, width: 80, height: 24 };

  useLocalMouse(bounds, (event) => {
    if (event.isInside && event.action === 'click') {
      // event.x, event.y are relative to the canvas (0,0 is top-left)
      canvas.setPixel(event.x, event.y, '█');
    }
  });

  return Box({ ...bounds }, /* canvas content */);
}
```

## Signature

```typescript
function useLocalMouse(
  bounds: Bounds | (() => Bounds),
  handler: LocalMouseHandler,
  options?: UseLocalMouseOptions
): void
```

## Parameters

| Parameter | Type | Required | Default | Description |
|:----------|:-----|:---------|:--------|:------------|
| `bounds` | `Bounds \| () => Bounds` | Yes | - | Component bounds or getter function |
| `handler` | `LocalMouseHandler` | Yes | - | Handler receiving LocalMouseEvent |
| `options.onlyInside` | `boolean` | No | `false` | Only fire for events inside bounds |
| `options.isActive` | `boolean` | No | `true` | Enable/disable handler |
| `options.enableTracking` | `boolean` | No | `true` | Enable mouse tracking mode |

## Bounds Object

```typescript
interface Bounds {
  x: number;      // Left edge position in terminal
  y: number;      // Top edge position in terminal
  width: number;  // Component width
  height: number; // Component height
}
```

## LocalMouseEvent

```typescript
interface LocalMouseEvent {
  // Local coordinates (relative to bounds)
  x: number;           // 0 = left edge of component
  y: number;           // 0 = top edge of component

  // Global coordinates (terminal absolute)
  globalX: number;     // Terminal column
  globalY: number;     // Terminal row

  // Hit testing
  isInside: boolean;   // true if within bounds

  // Event details
  button: 'left' | 'right' | 'middle' | 'scroll-up' | 'scroll-down' | 'none';
  action: 'click' | 'double-click' | 'drag' | 'release' | 'move';
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
}
```

## Examples

### Canvas Drawing with Colors

```typescript
function PaintCanvas() {
  const canvas = createCanvas({ width: 80, height: 24 });
  const [color, setColor] = useState('#FF0000');
  const bounds = { x: 12, y: 2, width: 80, height: 24 };

  useLocalMouse(bounds, (event) => {
    if (!event.isInside) return;

    if (event.action === 'click' || event.action === 'drag') {
      canvas.setPixel(event.x, event.y, '█', color());
      rerender();
    }
  });

  return Box({ flexDirection: 'row' },
    // Color palette sidebar
    ColorPalette({ onSelect: setColor }),
    // Canvas area
    Box(bounds, ...canvas.render().map(line => Text({}, line)))
  );
}
```

### Drag and Drop

```typescript
function DraggableItem() {
  const [position, setPosition] = useState({ x: 10, y: 5 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useLocalMouse(
    () => ({ ...position(), width: 10, height: 3 }),
    (event) => {
      if (event.action === 'click' && event.isInside) {
        setDragging(true);
        setDragOffset({ x: event.x, y: event.y });
      }
      if (event.action === 'drag' && dragging()) {
        setPosition({
          x: event.globalX - dragOffset().x,
          y: event.globalY - dragOffset().y
        });
      }
      if (event.action === 'release') {
        setDragging(false);
      }
    }
  );

  return Box({
    position: 'absolute',
    left: position().x,
    top: position().y,
    width: 10,
    height: 3,
    borderStyle: 'round',
    backgroundColor: dragging() ? 'blue' : 'gray'
  },
    Text({}, 'Drag me!')
  );
}
```

### Button with Hover State

```typescript
function HoverButton({ x, y, label, onClick }) {
  const [hovered, setHovered] = useState(false);
  const bounds = { x, y, width: label.length + 4, height: 1 };

  useLocalMouse(bounds, (event) => {
    setHovered(event.isInside);
    if (event.isInside && event.action === 'click') {
      onClick();
    }
  });

  return Box({
    ...bounds,
    backgroundColor: hovered() ? 'cyan' : 'gray'
  },
    Text({ bold: hovered() }, `[ ${label} ]`)
  );
}
```

### Only Inside Events

```typescript
function ClickableArea() {
  const bounds = { x: 0, y: 0, width: 40, height: 20 };

  // Handler only fires when mouse is inside bounds
  useLocalMouse(bounds, (event) => {
    console.log(`Clicked at local (${event.x}, ${event.y})`);
  }, { onlyInside: true });

  return Box(bounds,
    Text({}, 'Click anywhere inside this box')
  );
}
```

### Reactive Bounds

```typescript
function MovableComponent() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const width = 40;
  const height = 20;

  // Bounds update when offset changes
  useLocalMouse(
    () => ({ x: offset().x, y: offset().y, width, height }),
    (event) => {
      if (event.action === 'click' && event.isInside) {
        handleClick(event.x, event.y);
      }
    }
  );

  return Box({
    position: 'absolute',
    left: offset().x,
    top: offset().y,
    width,
    height
  },
    Text({}, 'Component content')
  );
}
```

## Coordinate System

```
Terminal (global):              Component (local):
(0,0)────────────────────►      (0,0)──────────►
│                               │
│    ┌─────────────┐            │  Component
│    │ Component   │            │  bounds
│    │  (10,5)     │            │
│    └─────────────┘            ▼
▼

Global click at (15, 8) with bounds {x:10, y:5, width:20, height:10}
→ Local coordinates: (5, 3)
→ isInside: true
```

## Best Practices

1. **Use `onlyInside: true`** when you don't need outside events
2. **Use reactive bounds** (getter function) for moving components
3. **Check `isInside`** before processing events when not using `onlyInside`
4. **Use `isActive: false`** to temporarily disable mouse handling

## API Reference

```typescript
interface UseLocalMouseOptions {
  onlyInside?: boolean;    // default: false
  isActive?: boolean;      // default: true
  enableTracking?: boolean; // default: true
}

type LocalMouseHandler = (event: LocalMouseEvent) => void;

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
```
