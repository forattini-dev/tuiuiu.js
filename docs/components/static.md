# Static

Render content once and keep it above dynamic content.

## Overview

The `Static` component renders its items once and "freezes" them in place. Static content appears above the interactive portion of your app and doesn't re-render when state changes. This is perfect for:

- Log messages that accumulate
- Completed task history
- Progress history
- Any content that should persist above interactive UI


## Basic Usage

```typescript
import { Static, Text, Box } from 'tuiuiu.js';
import { createSignal } from 'tuiuiu.js';

const [logs, setLogs] = createSignal<string[]>([]);

function App() {
  return Box({ flexDirection: 'column' },
    // Static content - rendered once per item, stays at top
    Static({
      items: logs(),
      children: (log, i) => Text({ key: i, color: 'gray' }, log)
    }),

    // Interactive content - re-renders on state change
    Text({ color: 'cyan' }, 'Current task: Processing...')
  );
}
```

## API Reference

### `Static<T>(props: StaticProps<T>): VNode`

Renders items that persist above dynamic content.

**Props:**

| Prop | Type | Description |
| :--- | :--- | :--- |
| `items` | `T[]` | Array of items to render |
| `children` | `(item: T, index: number) => VNode` | Render function for each item |
| `style` | `BoxStyle` | Optional container styles |

**Example:**

```typescript
interface LogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

const logs: LogEntry[] = [
  { timestamp: '10:00:01', message: 'Server started', level: 'info' },
  { timestamp: '10:00:05', message: 'Low memory', level: 'warn' },
  { timestamp: '10:00:10', message: 'Connection failed', level: 'error' },
];

Static({
  items: logs,
  children: (log, i) => Text(
    {
      key: i,
      color: log.level === 'error' ? 'red'
           : log.level === 'warn' ? 'yellow'
           : 'green'
    },
    `[${log.timestamp}] ${log.message}`
  )
});
```

## How It Works

1. **Render Once**: Each item is rendered only when first added
2. **Freeze in Place**: Rendered items don't change on subsequent renders
3. **Stack Above**: Static content appears above interactive content
4. **Efficient**: Only new items cause output, existing items are skipped

```
┌─────────────────────────────┐
│ [10:00:01] Server started   │  ← Static (frozen)
│ [10:00:05] Low memory       │  ← Static (frozen)
│ [10:00:10] Connection failed│  ← Static (frozen)
├─────────────────────────────┤
│ Current: Processing file... │  ← Interactive (re-renders)
│ Progress: ████████░░ 80%    │  ← Interactive (re-renders)
└─────────────────────────────┘
```

## Common Patterns

### Task Completion Log

```typescript
const [completed, setCompleted] = createSignal<Task[]>([]);
const [current, setCurrent] = createSignal<Task | null>(null);

function TaskRunner() {
  return Box({ flexDirection: 'column' },
    // Completed tasks (static)
    Static({
      items: completed(),
      children: (task, i) => Text(
        { key: i, color: 'green' },
        `✓ ${task.name} (${task.duration}ms)`
      )
    }),

    // Current task (interactive)
    When(current() !== null,
      Box({ borderStyle: 'single' },
        Spinner({ style: 'dots' }),
        Text({}, ` Running: ${current()?.name}`)
      )
    )
  );
}
```

### Build Output

```typescript
interface BuildStep {
  name: string;
  status: 'success' | 'error';
  output?: string;
}

const [steps, setSteps] = createSignal<BuildStep[]>([]);

function BuildProgress() {
  return Box({ flexDirection: 'column' },
    Static({
      items: steps(),
      children: (step, i) => Box({ key: i },
        Text(
          { color: step.status === 'success' ? 'green' : 'red' },
          step.status === 'success' ? '✓' : '✗'
        ),
        Text({}, ` ${step.name}`),
        When(step.output !== undefined,
          Text({ color: 'gray', dim: true }, ` → ${step.output}`)
        )
      )
    }),

    // Current build info...
  );
}
```

### Multiple Static Sections

You can have multiple Static components:

```typescript
function App() {
  return Box({ flexDirection: 'column' },
    // Errors section
    Static({
      items: errors(),
      children: (err, i) => Text({ key: i, color: 'red' }, `✗ ${err}`)
    }),

    // Warnings section
    Static({
      items: warnings(),
      children: (warn, i) => Text({ key: i, color: 'yellow' }, `⚠ ${warn}`)
    }),

    // Success section
    Static({
      items: successes(),
      children: (msg, i) => Text({ key: i, color: 'green' }, `✓ ${msg}`)
    }),

    // Interactive content below
    Text({}, 'Processing...')
  );
}
```

## Best Practices

1. **Use keys** - Always provide unique keys for efficient rendering
2. **Keep items immutable** - Don't modify items after adding them
3. **Add incrementally** - Push new items to the array, don't replace it
4. **Limit size** - Consider limiting the number of static items to avoid memory issues

```typescript
// Good: Incrementally add items
setLogs(prev => [...prev, newLog]);

// Good: Limit to last N items
setLogs(prev => [...prev, newLog].slice(-100));

// Bad: Replace entire array on each change
setLogs([...allLogs]); // This re-renders everything
```

## Comparison with Regular Content

| Feature | Static | Regular |
| :--- | :--- | :--- |
| Re-renders on state change | No | Yes |
| Position | Above interactive | In tree order |
| Use case | Logs, history | Dynamic UI |
| Performance | Render once | Re-render each time |

## See Also

- [Box](/components/layout.md) - Layout container
- [Text](/components/typography.md) - Text rendering
- [Signals](/core/signals.md) - Reactive state for items array
