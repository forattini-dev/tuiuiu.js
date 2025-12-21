# Examples

Here are some common patterns and examples to help you build with Tuiuiu.

## Running Examples

All examples can be run directly with `tsx`:

```bash
# Run any example
npx tsx examples/01-basic-counter.ts
npx tsx examples/06-dashboard.ts
npx tsx examples/12-animation-system.ts
```

## Example Index

| File | Description |
|------|-------------|
| `01-basic-counter.ts` | Simple counter with state and input |
| `02-async-loading.ts` | Async data fetching patterns |
| `03-global-state.ts` | Shared state between components |
| `04-forms.ts` | Form inputs and validation |
| `05-multi-component.ts` | Component composition patterns |
| `06-dashboard.ts` | Data viz: Sparkline, BarChart, LineChart, Gauge, Heatmap |
| `07-advanced-forms.ts` | MultiSelect, Autocomplete, RadioGroup, Switch, Slider |
| `08-layout-components.ts` | Tabs, Accordion, Collapsible, ScrollArea, Grid, Tree |
| `09-visual-components.ts` | BigText, Digits, Clock, Countdown, Stopwatch, Badge |
| `10-theme-context.ts` | Light/dark theme switching with Context API |
| `11-static-logs.ts` | Static output for build logs |
| `12-animation-system.ts` | Spring physics, easing functions, transitions |
| `13-virtual-scroll.ts` | Virtual scrolling for large datasets |
| `14-focus-management.ts` | Focus zones, focus traps, keyboard navigation |
| `15-constraint-layout.ts` | Constraint-based layouts (alternative to flexbox) |
| `16-graphics-braille.ts` | Braille graphics, patterns, animations |
| `17-event-system.ts` | Event bubbling, delegation, custom events |

## 1. Counter App

A simple interactive counter.

```typescript
import { render, createSignal, Box, Text } from 'tuiuiu.js';

function Counter() {
  const [count, setCount] = createSignal(0);

  return Box({ borderStyle: 'round', padding: 1 },
    Text({}, `Count: ${count()}`),
    Text({ color: 'gray' }, '(Press Ctrl+C to exit)')
  );
}

render(Counter());
```

## 2. Todo List

A list with input handling.

```typescript
import { render, createSignal, useInput, Box, Text, TextInput } from 'tuiuiu.js';

function TodoApp() {
  const [todos, setTodos] = createSignal<string[]>([]);
  const input = createTextInput({
    onSubmit: (text) => {
      setTodos(prev => [...prev, text]);
      input.clear();
    }
  });

  return Box({ flexDirection: 'column' },
    Box({ borderStyle: 'single', title: 'New Task' },
      renderTextInput(input)
    ),
    Box({ flexDirection: 'column', marginTop: 1 },
      ...todos().map((todo, i) => 
        Text({ key: i }, `• ${todo}`)
      )
    )
  );
}
```

## 3. Data Dashboard

Using layouts and tables.

```typescript
import { render, Box, Table, SplitPanel } from 'tuiuiu.js';

function Dashboard() {
  return SplitPanel({
    direction: 'horizontal',
    ratio: 0.3,
    left: Box({ borderStyle: 'single', title: 'Sidebar' },
      Text({}, 'Dashboard'),
      Text({}, 'Settings'),
      Text({}, 'Logs')
    ),
    right: Box({ padding: 1 },
      Table({
        columns: [
          { key: 'id', header: 'ID' },
          { key: 'status', header: 'Status' }
        ],
        data: [
          { id: 1, status: 'Active' },
          { id: 2, status: 'Pending' }
        ]
      })
    )
  });
}
```
