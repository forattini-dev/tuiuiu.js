# Programmatic Control

This guide explains how to control Tuiuiu components programmatically without requiring keyboard focus or user interaction.

## Overview

While Tuiuiu components are typically controlled through keyboard input, many applications need to:
- Update UI from external events (WebSocket, API responses)
- Animate or auto-scroll without user interaction
- Control multiple components from a central state store
- Process command queues from external sources

## Key Pattern: External State Controller

The fundamental pattern is creating state and control methods **outside** the component:

```typescript
import { createSignal } from 'tuiuiu';

// Create controller OUTSIDE component
function createController() {
  const [state, setState] = createSignal({ value: 0 });

  return {
    state,
    increment: () => setState(s => ({ ...s, value: s.value + 1 })),
    setValue: (v: number) => setState(s => ({ ...s, value: v })),
    reset: () => setState({ value: 0 }),
  };
}

// Instantiate OUTSIDE component - accessible anywhere
const controller = createController();

// Control from external sources
setInterval(() => controller.increment(), 1000);
websocket.on('value', (v) => controller.setValue(v));

// Use in component
function Display() {
  const { value } = controller.state();
  return Text({}, `Value: ${value}`);
}
```

## Pattern 1: Scroll Controller

Control scroll position programmatically:

```typescript
function createScrollController(items: string[], visibleCount: number) {
  const [state, setState] = createSignal({
    items,
    visibleCount,
    scrollOffset: 0,
    selectedIndex: 0,
  });

  return {
    state,

    scrollToItem(index: number, align: 'start' | 'center' | 'end' = 'center') {
      setState((s) => {
        const safeIndex = Math.max(0, Math.min(index, s.items.length - 1));
        let newOffset: number;

        switch (align) {
          case 'start': newOffset = safeIndex; break;
          case 'end': newOffset = Math.max(0, safeIndex - s.visibleCount + 1); break;
          case 'center':
          default: newOffset = Math.max(0, safeIndex - Math.floor(s.visibleCount / 2));
        }

        newOffset = Math.max(0, Math.min(newOffset, s.items.length - s.visibleCount));
        return { ...s, scrollOffset: newOffset, selectedIndex: safeIndex };
      });
    },

    scrollBy(delta: number) {
      setState((s) => ({
        ...s,
        scrollOffset: Math.max(0, Math.min(s.scrollOffset + delta, s.items.length - s.visibleCount)),
      }));
    },

    scrollToTop() {
      setState((s) => ({ ...s, scrollOffset: 0, selectedIndex: 0 }));
    },

    scrollToBottom() {
      setState((s) => ({
        ...s,
        scrollOffset: Math.max(0, s.items.length - s.visibleCount),
        selectedIndex: s.items.length - 1,
      }));
    },
  };
}

// Usage
const scroll = createScrollController(logs, 10);

// Auto-scroll to bottom on new data
websocket.on('log', (log) => {
  logs.push(log);
  scroll.scrollToBottom();
});

// Jump to specific log
scroll.scrollToItem(500, 'center');
```

## Pattern 2: Animation Controller

Control animations with external timing:

```typescript
function createAnimationController() {
  const [frame, setFrame] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);

  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  return {
    frame,
    isPlaying,
    getCurrentFrame: () => frames[frame() % frames.length],
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    toggle: () => setIsPlaying(p => !p),
    reset: () => setFrame(0),
    nextFrame: () => setFrame(f => (f + 1) % frames.length),
  };
}

const anim = createAnimationController();

// External tick (independent of component)
setInterval(() => {
  if (anim.isPlaying()) {
    anim.nextFrame();
  }
}, 100);

// Control from anywhere
anim.play();
anim.pause();
```

## Pattern 3: Command Queue

Process commands from external sources:

```typescript
type Command =
  | { type: 'navigate'; target: string }
  | { type: 'notify'; message: string }
  | { type: 'update'; key: string; value: any };

function createCommandQueue() {
  const [commands, setCommands] = createSignal<Command[]>([]);

  return {
    commands,
    push: (cmd: Command) => setCommands(c => [...c, cmd]),
    process: () => {
      let cmd: Command | null = null;
      setCommands(c => {
        if (c.length === 0) return c;
        [cmd] = c;
        return c.slice(1);
      });
      return cmd;
    },
    clear: () => setCommands([]),
    size: () => commands().length,
  };
}

const queue = createCommandQueue();

// External source pushes commands
websocket.on('command', queue.push);
apiClient.onAction(queue.push);

// Process in component effect
createEffect(() => {
  const cmd = queue.process();
  if (cmd) {
    handleCommand(cmd);
  }
});
```

## Pattern 4: Batch Updates

Optimize multiple state changes:

```typescript
import { batch } from 'tuiuiu';

function createStore() {
  const [metrics, setMetrics] = createSignal({});
  const [notifications, setNotifications] = createSignal([]);
  const [status, setStatus] = createSignal('idle');

  return {
    metrics, notifications, status,

    // Single render for multiple updates
    processData(data) {
      batch(() => {
        setMetrics(data.metrics);
        setNotifications(n => [...n, ...data.notifications]);
        setStatus(data.status);
      });
    },
  };
}
```

## Pattern 5: Event Emitter

Emit and track events:

```typescript
function createEventEmitter() {
  const [events, setEvents] = createSignal<Event[]>([]);
  let eventId = 0;

  return {
    events,
    emit: (type: string, data: any) => {
      setEvents(e => [...e.slice(-99), {
        id: ++eventId,
        type,
        data,
        time: new Date(),
      }]);
    },
    clear: () => setEvents([]),
    getLatest: () => {
      const e = events();
      return e.length > 0 ? e[e.length - 1] : null;
    },
  };
}
```

## Component Integration

When using external controllers in components:

```typescript
function MyComponent() {
  // Read from external controller
  const state = controller.state();

  // Optional: keyboard shortcuts that call controller methods
  useInput((input, key) => {
    if (key.upArrow) controller.selectPrev();
    if (key.downArrow) controller.selectNext();
    if (input === 'r') controller.reset();
  });

  // Render based on external state
  return Box({}, ...renderItems(state));
}
```

## Auto-Scroll Example

Complete auto-scroll implementation:

```typescript
const scroll = createScrollController(items, 10);

function AutoScrollList() {
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll effect
  createEffect(() => {
    if (!autoScroll()) return;
    const interval = setInterval(() => scroll.selectNext(), 500);
    return () => clearInterval(interval);
  });

  useInput((input) => {
    if (input === 'a') setAutoScroll(v => !v);
  });

  const state = scroll.state();
  const visible = state.items.slice(
    state.scrollOffset,
    state.scrollOffset + state.visibleCount
  );

  return Box(
    { flexDirection: 'column' },
    ...visible.map((item, i) => Text({}, item))
  );
}
```

## Examples

See the full examples in:
- `examples/programmatic/scroll-control.ts`
- `examples/programmatic/state-management.ts`
- `examples/programmatic/external-triggers.ts`

Run with:
```bash
npx tsx examples/programmatic/scroll-control.ts
```
