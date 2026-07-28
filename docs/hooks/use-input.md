# useInput

Handle keyboard input with priority-based propagation control.

## Basic Usage

```typescript
import { useInput } from 'tuiuiu.js'

function Counter() {
  const [count, setCount] = useState(0)

  useInput((input, key) => {
    if (key.upArrow) setCount(c => c + 1)
    if (key.downArrow) setCount(c => c - 1)
    if (key.escape) exit()
  })

  return Text({}, `Count: ${count()}`)
}
```

## Key Object

The `Key` object provides boolean flags for special keys:

| Category | Keys |
|----------|------|
| **Arrows** | `upArrow`, `downArrow`, `leftArrow`, `rightArrow` |
| **Modifiers** | `ctrl`, `shift`, `meta` |
| **Navigation** | `pageUp`, `pageDown`, `home`, `end`, `tab` |
| **Editing** | `backspace`, `delete`, `return` (Enter), `escape` |
| **Enhanced protocols** | `eventType` (`press`, `repeat`, or `release`) |

UTF-8, partial escape sequences, and bracketed-paste markers are framed
incrementally, so stream chunk boundaries do not change the resulting input.
The parser accepts legacy sequences, Kitty CSI-u, and xterm
`modifyOtherKeys`.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `isActive` | `boolean` | `true` | Enable/disable handler |
| `priority` | `InputPriority` | `'normal'` | Handler priority level |
| `stopPropagation` | `boolean` | `false` | Block lower-priority handlers |

## Input Priority System

Tuiuiu uses a **priority-based** input system to control which components receive keyboard input.

### Priority Levels

| Priority | Value | Use Case |
|----------|-------|----------|
| `critical` | 3 | Error dialogs, system confirmations |
| `modal` | 2 | Modals, command palettes, overlays |
| `normal` | 1 | Regular components (default) |
| `background` | 0 | Analytics, debugging, always-on |

### How It Works

```
┌─────────────────────────────────────────────────┐
│  Input Event (e.g., Arrow Key)                  │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│  1. Sort handlers by priority (highest first)   │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│  2. Call critical handlers (priority=3)         │
│     → If stopPropagation + returns true: STOP   │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│  3. Call modal handlers (priority=2)            │
│     → If stopPropagation + returns true: STOP   │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│  4. Call normal handlers (priority=1)           │
│     → All at same priority receive input!       │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│  5. Call background handlers (priority=0)       │
└─────────────────────────────────────────────────┘
```

### Key Rules

1. **Higher priority handlers are called first**
2. **`stopPropagation: true` + returning truthy blocks LOWER priority handlers**
3. **Handlers at the SAME priority ALL receive input**

## Convenience Hooks

```typescript
// Modal priority with stopPropagation
useModalInput((input, key) => {
  if (key.escape) {
    closeModal()
    return true  // Block background
  }
})

// Critical priority with stopPropagation
useCriticalInput((input, key) => {
  if (key.return) {
    acknowledgeError()
    return true
  }
})
```

## Nested Components Pattern

### The Problem

When you have nested interactive components (e.g., Tabs containing ButtonGroup), both register input handlers at `normal` priority:

```
┌─────────────────────────────────────┐
│  App                                │
│  ┌───────────────────────────────┐  │
│  │  Tabs (useInput: ← →)         │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  ButtonGroup            │  │  │
│  │  │  (useInput: ← → Enter)  │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

Arrow key pressed:
  → Tabs.handleInput() called ✓
  → ButtonGroup.handleInput() called ✓
  → BOTH try to navigate! 💥
```

### Solution: Use `isActive`

The solution is to pass `isActive` to control which component handles input:

```typescript
function App() {
  const [focusArea, setFocusArea] = useState<'tabs' | 'buttons'>('tabs')

  // Tab key toggles focus between tabs and buttons
  useInput((_, key) => {
    if (key.tab) {
      setFocusArea(f => f === 'tabs' ? 'buttons' : 'tabs')
      return true
    }
  })

  return Tabs({
    tabs: [
      { key: 'settings', label: 'Settings', content: SettingsPanel() },
      {
        key: 'actions',
        label: 'Actions',
        content: ActionsPanel({ isActive: focusArea === 'buttons' }),
      },
    ],
    isActive: focusArea === 'tabs',  // Only handle ← → when tabs have focus
  })
}

function ActionsPanel({ isActive }: { isActive: boolean }) {
  return ButtonGroup({
    buttons: [
      { label: 'Save', onClick: save },
      { label: 'Cancel', onClick: cancel },
    ],
    isActive,  // Only handle ← → Enter when buttons have focus
  })
}
```

### Pattern: Focus Delegation

```typescript
// Parent component delegates focus to active child
function FormWithButtons() {
  const [focusArea, setFocusArea] = useState<'form' | 'buttons'>('form')

  // Tab toggles between form and buttons
  useInput((_, key) => {
    if (key.tab) {
      setFocusArea(f => f === 'form' ? 'buttons' : 'form')
      return true
    }
  })

  return Box({ flexDirection: 'column' },
    TextInput({
      isActive: focusArea === 'form',
      // ...
    }),
    ButtonGroup({
      buttons: [...],
      isActive: focusArea === 'buttons',
    })
  )
}
```

### Pattern: Modal Overlay

Modals should use `modal` priority to block background:

```typescript
function ConfirmDialog({ isOpen, onConfirm, onCancel }) {
  // Only handle input when open
  useModalInput((_, key) => {
    if (!isOpen) return

    if (key.escape) {
      onCancel()
      return true  // Block background
    }
    if (key.return) {
      onConfirm()
      return true
    }
  }, { isActive: isOpen })

  if (!isOpen) return null

  return Modal({},
    Text({}, 'Are you sure?'),
    ButtonGroup({
      buttons: [
        { label: 'Yes', onClick: onConfirm },
        { label: 'No', onClick: onCancel },
      ],
      // ButtonGroup uses normal priority
      // Modal's useModalInput blocks background but not ButtonGroup
      // because modal priority > normal, not blocking same level
    })
  )
}
```

### Built-in Component Behavior

| Component | Priority | stopPropagation | Notes |
|-----------|----------|-----------------|-------|
| `Select` | `normal` | `true` | Blocks siblings when returning true |
| `MultiSelect` | `normal` | `true` | Blocks siblings when returning true |
| `ButtonGroup` | `normal` | `true` | Blocks siblings when returning true |
| `Tabs` | `normal` | `true` | Use `isActive` to control |
| `TextInput` | `normal` | `true` | Use `isActive` to control |
| `Modal` | display only | - | Wire up `useModalInput` yourself |
| `CommandPalette` | display only | - | Wire up `useModalInput` yourself |

## Best Practices

### 1. Always Use `isActive` for Nested Components

```typescript
// ❌ Both components fight for arrow keys
Tabs({
  tabs: [
    { key: 'a', label: 'A', content: ButtonGroup({ buttons }) }
  ]
})

// ✅ Explicit control of which handles input
Tabs({
  tabs: [
    {
      key: 'a',
      label: 'A',
      content: ButtonGroup({ buttons, isActive: buttonsHaveFocus })
    }
  ],
  isActive: !buttonsHaveFocus,
})
```

### 2. Return `true` to Stop Propagation

```typescript
// ❌ Propagation continues to lower priorities
useInput((_, key) => {
  if (key.escape) closePanel()
})

// ✅ Propagation stops
useInput((_, key) => {
  if (key.escape) {
    closePanel()
    return true
  }
})
```

### 3. Use Correct Priority Level

```typescript
// ❌ Normal priority for overlay
useInput(handler) // Can't block background!

// ✅ Modal priority for overlay
useModalInput(handler) // Blocks normal-priority handlers
```

### 4. Handle Early Returns for Inactive State

```typescript
// ❌ Checks isActive but still processes key
useInput((_, key) => {
  if (key.escape && isActive) doSomething()
}, { isActive })

// ✅ Handler not called when inactive
useInput((_, key) => {
  if (key.escape) doSomething()
}, { isActive })
```

## Related

- [useHotkeys](./use-hotkeys.md) - Declarative keyboard shortcuts
- [useFocus](./use-focus.md) - Focus management
- [Context](./context.md) - Hook context system
