# useTerminalSize

Reactive hook for terminal dimensions that updates on resize.

## Import

```typescript
import { useTerminalSize } from 'tuiuiu.js'
```

## Basic Usage

```typescript
function ResponsiveApp() {
  const { columns, rows } = useTerminalSize()

  return Box({ flexDirection: 'column' },
    Text({}, `Terminal: ${columns}x${rows}`),
    columns > 80
      ? WideLayout()
      : NarrowLayout()
  )
}
```

## Return Value

```typescript
interface TerminalSize {
  columns: number;  // Width in characters
  rows: number;     // Height in lines
}
```

| Property | Type | Description |
|----------|------|-------------|
| `columns` | `number` | Terminal width in characters |
| `rows` | `number` | Terminal height in lines |

## Reactivity

The hook automatically updates when the terminal is resized:

```typescript
function SizeMonitor() {
  const { columns, rows } = useTerminalSize()

  // This re-renders whenever terminal is resized
  return Text({}, `Size: ${columns}x${rows}`)
}
```

## Examples

### Responsive Layout

```typescript
function Dashboard() {
  const { columns, rows } = useTerminalSize()

  // Switch between layouts based on width
  if (columns < 60) {
    return NarrowDashboard()
  } else if (columns < 100) {
    return MediumDashboard()
  } else {
    return WideDashboard()
  }
}
```

### Conditional Components

```typescript
function App() {
  const { columns, rows } = useTerminalSize()

  return Box({ flexDirection: 'column' },
    Header(),
    Main(),
    // Only show footer if we have room
    rows > 20 && Footer(),
    // Only show sidebar on wide terminals
    columns > 100 && Sidebar(),
  )
}
```

### Centered Content

```typescript
function CenteredBox() {
  const { columns, rows } = useTerminalSize()
  const boxWidth = 40
  const boxHeight = 10

  return Box({
    position: 'absolute',
    left: Math.floor((columns - boxWidth) / 2),
    top: Math.floor((rows - boxHeight) / 2),
    width: boxWidth,
    height: boxHeight,
    borderStyle: 'round',
  },
    Text({}, 'Centered!')
  )
}
```

### Dynamic Table Columns

```typescript
function ResponsiveTable({ data }) {
  const { columns } = useTerminalSize()

  // Show fewer columns on narrow terminals
  const visibleColumns = columns > 100
    ? ['id', 'name', 'email', 'role', 'status']
    : columns > 60
      ? ['id', 'name', 'email']
      : ['name', 'email']

  return DataTable({
    columns: visibleColumns.map(key => ({ key, header: key })),
    data,
  })
}
```

### Full Screen Layout

```typescript
function FullScreenApp() {
  const { columns, rows } = useTerminalSize()

  return Box({
    width: columns,
    height: rows,
    flexDirection: 'column',
  },
    Header({ height: 3 }),
    Box({
      flexGrow: 1,
      flexDirection: 'row',
    },
      Sidebar({ width: Math.min(30, columns / 4) }),
      MainContent({ flexGrow: 1 }),
    ),
    Footer({ height: 2 }),
  )
}
```

### Breakpoint System

```typescript
function useBreakpoint() {
  const { columns } = useTerminalSize()

  if (columns < 40) return 'xs'
  if (columns < 60) return 'sm'
  if (columns < 80) return 'md'
  if (columns < 120) return 'lg'
  return 'xl'
}

function App() {
  const breakpoint = useBreakpoint()

  return Box({},
    breakpoint === 'xs' && MinimalView(),
    breakpoint === 'sm' && CompactView(),
    breakpoint === 'md' && StandardView(),
    (breakpoint === 'lg' || breakpoint === 'xl') && FullView(),
  )
}
```

### Resize Animation

```typescript
function ResizeIndicator() {
  const { columns, rows } = useTerminalSize()
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    setShowIndicator(true)
    const timer = setTimeout(() => setShowIndicator(false), 1000)
    return () => clearTimeout(timer)
  }) // Runs on every resize

  return showIndicator
    ? Box({
        position: 'absolute',
        right: 2,
        top: 0,
        backgroundColor: 'primary',
      },
        Text({ color: 'white' }, ` ${columns}×${rows} `)
      )
    : null
}
```

### Split Panel Sizing

```typescript
function SplitView() {
  const { columns, rows } = useTerminalSize()

  return SplitPanel({
    left: LeftPanel(),
    right: RightPanel(),
    // Responsive sidebar width
    leftWidth: Math.max(20, Math.min(40, columns * 0.25)),
    divider: columns > 60,
    dividerStyle: 'line',
  })
}
```

## Tips

### Performance

The hook uses native terminal resize events, so there's no polling overhead. Updates only occur on actual resize.

### Initial Value

The hook returns the current terminal size immediately on first render - no loading state needed.

### Testing

In tests or non-TTY environments, you may get default values. Consider mocking for consistent tests:

```typescript
// In tests
vi.mock('tuiuiu.js', () => ({
  useTerminalSize: () => ({ columns: 80, rows: 24 }),
}))
```

## Related

- [useApp](/hooks/use-app.md) - Application lifecycle
- [SplitPanel](/components/organisms/split-panel.md) - Responsive layouts
- [Layout](/core/layout.md) - Flexbox layout system

