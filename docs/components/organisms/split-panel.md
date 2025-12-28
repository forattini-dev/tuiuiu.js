# SplitPanel

Two-panel layouts with dividers, resizable splits, and collapsible panels.

## Import

```typescript
import { SplitPanel, createSplitPanel, ThreePanel } from 'tuiuiu.js'
```

## Basic Usage

```typescript
// Fixed width left panel
SplitPanel({
  left: Sidebar(),
  right: Content(),
  leftWidth: 30,
  divider: true,
})

// Percentage split
SplitPanel({
  left: Navigation(),
  right: MainContent(),
  ratio: 0.25, // 25% left, 75% right
})
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `left` | `VNode` | required | Left/top panel content |
| `right` | `VNode` | required | Right/bottom panel content |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Split direction |
| `width` | `number` | terminal width | Container width |
| `height` | `number` | terminal height | Container height |
| `leftWidth` | `number` | - | Fixed left/top panel width |
| `rightWidth` | `number` | - | Fixed right/bottom panel width |
| `ratio` | `number` | `0.5` | Split ratio (0-1) |
| `divider` | `boolean` | `false` | Show divider line |
| `dividerStyle` | `DividerStyle` | `'line'` | Divider visual style |
| `dividerColor` | `string` | theme | Divider color |
| `gap` | `number` | `0` | Gap when no divider |
| `border` | `boolean` | `false` | Border around container |
| `borderStyle` | `'single' \| 'double' \| 'round'` | `'single'` | Border style |
| `borderColor` | `string` | theme | Border color |
| `minWidth` | `number` | `10` | Minimum panel width |
| `leftTitle` | `string` | - | Left panel title |
| `rightTitle` | `string` | - | Right panel title |
| `leftTitleColor` | `string` | theme | Left title color |
| `rightTitleColor` | `string` | theme | Right title color |

## Divider Styles

```typescript
type DividerStyle = 'line' | 'double' | 'dotted' | 'dashed' | 'thick' | 'none'
```

| Style | Vertical | Horizontal |
|-------|----------|------------|
| `line` | `│` | `─` |
| `double` | `║` | `═` |
| `dotted` | `┊` | `┈` |
| `dashed` | `┆` | `┄` |
| `thick` | `┃` | `━` |
| `none` | - | - |

## Split Directions

### Horizontal (Side by Side)

```typescript
SplitPanel({
  left: LeftPanel(),
  right: RightPanel(),
  direction: 'horizontal', // default
  ratio: 0.3,
  divider: true,
})
```

Output:
```
│ Left Panel  │ Right Panel          │
│             │                      │
│             │                      │
```

### Vertical (Stacked)

```typescript
SplitPanel({
  left: TopPanel(),
  right: BottomPanel(),
  direction: 'vertical',
  leftWidth: 5, // 5 lines for top
  divider: true,
  dividerStyle: 'dashed',
})
```

Output:
```
│ Top Panel                          │
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
│ Bottom Panel                       │
│                                    │
```

## Programmatic Control

For interactive resizing and collapsing:

```typescript
const split = createSplitPanel({
  initialRatio: 0.3,
  minRatio: 0.1,
  maxRatio: 0.9,
})

// Change ratio
split.setRatio(0.4)

// Collapse panels
split.toggleLeft()    // Toggle left panel
split.toggleRight()   // Toggle right panel
split.expandLeft()    // Expand left, collapse right
split.expandRight()   // Expand right, collapse left

// State access
split.ratio           // Current ratio (0 if left collapsed, 1 if right)
split.leftCollapsed   // Is left collapsed
split.rightCollapsed  // Is right collapsed

// Use with component
SplitPanel({
  left: split.leftCollapsed ? CollapsedSidebar() : FullSidebar(),
  right: MainContent(),
  ratio: split.ratio,
  divider: true,
})
```

## ThreePanel

Three-panel layout for IDE-like interfaces:

```typescript
ThreePanel({
  left: FileTree(),
  center: Editor(),
  right: Properties(),
  leftWidth: 25,
  rightWidth: 30,
  dividers: true,
  dividerStyle: 'line',
})
```

Output:
```
│ FileTree │ Editor Content        │ Properties │
│          │                       │            │
│          │                       │            │
```

### ThreePanel Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `left` | `VNode` | required | Left sidebar |
| `center` | `VNode` | required | Main content |
| `right` | `VNode` | - | Right sidebar (optional) |
| `width` | `number` | terminal | Container width |
| `height` | `number` | terminal | Container height |
| `leftWidth` | `number` | `25` | Left panel width |
| `rightWidth` | `number` | `30` | Right panel width |
| `dividers` | `boolean` | `true` | Show dividers |
| `dividerStyle` | `DividerStyle` | `'line'` | Divider style |

## Features

### With Panel Titles

```typescript
SplitPanel({
  left: FileList(),
  right: Preview(),
  leftTitle: 'Files',
  rightTitle: 'Preview',
  leftTitleColor: 'cyan',
  rightTitleColor: 'green',
  ratio: 0.3,
  divider: true,
})
```

Output:
```
Files        │ Preview
─────────────│────────────────────────
file1.txt    │ File content here...
file2.txt    │
```

### With Border

```typescript
SplitPanel({
  left: Sidebar(),
  right: Content(),
  border: true,
  borderStyle: 'round',
  borderColor: 'primary',
  divider: true,
})
```

### Fixed vs Ratio

```typescript
// Fixed left width (30 chars)
SplitPanel({
  left: Sidebar(),
  right: Content(),
  leftWidth: 30,
})

// Fixed right width (40 chars)
SplitPanel({
  left: Content(),
  right: Details(),
  rightWidth: 40,
})

// Ratio-based (30% left, 70% right)
SplitPanel({
  left: Sidebar(),
  right: Content(),
  ratio: 0.3,
})
```

## Examples

### File Browser Layout

```typescript
function FileBrowser() {
  const split = createSplitPanel({ initialRatio: 0.25 })

  useInput((input, key) => {
    if (input === '[') split.toggleLeft()
    if (input === ']') split.toggleRight()
  })

  return SplitPanel({
    left: split.leftCollapsed
      ? Box({ width: 3 }, Text({}, '▶'))
      : FileTree({ files }),
    right: FilePreview({ file: selectedFile }),
    ratio: split.ratio,
    divider: true,
    leftTitle: split.leftCollapsed ? '' : 'Explorer',
    rightTitle: 'Preview',
  })
}
```

### Editor with Terminal

```typescript
SplitPanel({
  left: CodeEditor({ code }),
  right: Terminal({ output }),
  direction: 'vertical',
  ratio: 0.7, // 70% editor, 30% terminal
  divider: true,
  dividerStyle: 'thick',
  leftTitle: 'editor.ts',
  rightTitle: 'Terminal',
})
```

### Dashboard Layout

```typescript
ThreePanel({
  left: Box({ flexDirection: 'column' },
    Text({ bold: true }, 'Navigation'),
    Menu({ items: navItems }),
  ),
  center: Box({ flexDirection: 'column' },
    Text({ bold: true }, 'Dashboard'),
    Stats({ data: dashboardData }),
  ),
  right: Box({ flexDirection: 'column' },
    Text({ bold: true }, 'Details'),
    Details({ item: selectedItem }),
  ),
  leftWidth: 20,
  rightWidth: 30,
  dividers: true,
})
```

### Nested Splits

```typescript
SplitPanel({
  left: Sidebar(),
  right: SplitPanel({
    left: MainContent(),
    right: SideDetails(),
    ratio: 0.7,
    direction: 'horizontal',
    divider: true,
  }),
  leftWidth: 25,
  divider: true,
})
```

### Header + Main + Footer

```typescript
Box({ flexDirection: 'column' },
  Header({ title: 'My App' }),
  SplitPanel({
    left: SplitPanel({
      left: Navigation(),
      right: Content(),
      leftWidth: 20,
      divider: true,
    }),
    right: Box({}), // Placeholder for the rest
    ratio: 1, // Full width
    direction: 'vertical',
    leftWidth: termHeight - 4, // Header + footer
  }),
  Footer({ status: 'Ready' }),
)
```

## Related

- [Modal](/components/organisms/modal.md) - Modal dialogs
- [Tabs](/components/molecules/tabs.md) - Tabbed content
- [Scroll](/components/scroll.md) - Scrollable containers (ScrollList, ChatList, Scroll)

