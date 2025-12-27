# Hotkeys & Input

> **Complete keyboard handling for terminal applications.** Tuiuiu provides both low-level input handling and high-level hotkey management with scopes to prevent conflicts.

## Overview

| API | Use Case | Conflict Prevention |
|:----|:---------|:--------------------|
| `useHotkeys` | Actions, shortcuts, commands | Built-in scopes |
| `useInput` | Data entry, raw key access | Manual via `isActive` |
| `isHotkey` | Pattern matching in callbacks | N/A |

## Quick Start

```typescript
import { useHotkeys, useInput, isHotkey } from 'tuiuiu.js'

// useHotkeys - Declarative, with scope support
useHotkeys('ctrl+s', () => save(), { scope: 'editor' })
useHotkeys('escape', () => close(), { scope: 'modal' })

// useInput - Raw input handling
useInput((input, key) => {
  if (key.backspace) deleteChar()
  else if (input && !key.ctrl) insertChar(input)
})
```

---

## useHotkeys Hook

The recommended way to handle keyboard shortcuts. Provides automatic scope management to prevent conflicts.

```typescript
import { useHotkeys, pushHotkeyScope, popHotkeyScope } from 'tuiuiu.js'

function MyComponent() {
  // Simple hotkey (global scope)
  useHotkeys('ctrl+s', () => save())

  // Cross-platform (Ctrl on Linux/Windows, Cmd on Mac)
  useHotkeys(['ctrl+z', 'cmd+z'], () => undo())

  // Scoped hotkey (only active when scope matches)
  useHotkeys('escape', () => closeModal(), { scope: 'modal' })
}
```

### Scope System

Scopes prevent hotkey conflicts between components. Only hotkeys in the current scope (or 'global') are active.

```typescript
// Default scope is 'global'
setHotkeyScope('modal')   // Only 'modal' and 'global' hotkeys work
setHotkeyScope('global')  // Back to default

// Stack-based for nested contexts
pushHotkeyScope('modal')           // Modal opens
pushHotkeyScope('command-palette') // Palette opens inside modal
popHotkeyScope()                   // Palette closes → back to 'modal'
popHotkeyScope()                   // Modal closes → back to 'global'
```

### Full API Reference

See [useHotkeys Hook Documentation](/hooks/use-hotkeys.md) for complete details.

---

## useInput Hook

For raw keyboard input handling. Use when you need character-by-character processing.

```typescript
import { useInput } from 'tuiuiu.js'

useInput((input, key) => {
  // input: string (e.g. "a", "A", "1", " ")
  // key: Key object with boolean flags
}, { isActive: true })  // Only process when active
```

### Key Object Properties

| Property | Description |
|:---------|:------------|
| `upArrow`, `downArrow`, `leftArrow`, `rightArrow` | Navigation keys |
| `return` | Enter key |
| `escape` | Escape key |
| `backspace`, `delete` | Deletion keys |
| `tab` | Tab key |
| `home`, `end`, `pageUp`, `pageDown` | Navigation helpers |
| `f1` - `f12` | Function keys |
| `ctrl`, `shift`, `meta`, `option` | Modifiers |

---

## isHotkey Utility

Match key events against string patterns within `useInput` callbacks.

```typescript
import { useInput, isHotkey } from 'tuiuiu.js'

useInput((input, key) => {
  if (isHotkey('ctrl+c', key, input)) exit()
  if (isHotkey('shift+enter', key)) insertNewline()
  if (isHotkey('f1', key)) showHelp()
})
```

### Pattern Format

| Pattern | Description |
|:--------|:------------|
| `ctrl+s` | Control + S |
| `shift+up` | Shift + Up Arrow |
| `meta+d` | Alt/Meta + D |
| `ctrl+shift+p` | Control + Shift + P |
| `enter` | Enter key |
| `esc` | Escape key |

---

## Avoiding Hotkey Conflicts

### Problem: Multiple Components Responding

When multiple components use `useInput`, they all receive key events:

```typescript
// BAD: Both components respond to arrow keys!
function ListA() {
  useInput((input, key) => {
    if (key.upArrow) navigateUp()  // BOTH fire!
  })
}

function ListB() {
  useInput((input, key) => {
    if (key.upArrow) navigateUp()  // BOTH fire!
  })
}
```

### Solution 1: Use `isActive` Flag

```typescript
// GOOD: Only active component responds
function ListA({ isActive }) {
  useInput((input, key) => {
    if (key.upArrow) navigateUp()
  }, { isActive })  // Only fires when isActive=true
}
```

### Solution 2: Use Hotkey Scopes

```typescript
// BEST: Scopes prevent conflicts automatically
function ListA() {
  useHotkeys('up', () => navigateUp(), { scope: 'list-a' })
}

function ListB() {
  useHotkeys('up', () => navigateUp(), { scope: 'list-b' })
}

// Parent controls which is active
function Parent() {
  const [activeList, setActiveList] = useState('list-a')

  useEffect(() => {
    setHotkeyScope(activeList)
  }, [activeList])
}
```

### Solution 3: Component-Level Scope Props

Components like `ScrollList` accept a `hotkeyScope` prop:

```typescript
// Two scroll lists, different scopes
ScrollList({
  items: chatMessages,
  hotkeyScope: 'chat',
  // ...
})

ScrollList({
  items: searchResults,
  hotkeyScope: 'search',
  // ...
})

// Activate one or the other
pushHotkeyScope('chat')   // Chat list responds to keys
// or
pushHotkeyScope('search') // Search list responds to keys
```

---

## Components with Built-in Hotkeys

These components have keyboard navigation built-in:

| Component | Keys | Scope Control |
|:----------|:-----|:--------------|
| `ScrollList` | ↑/↓, j/k, PgUp/PgDn, Home/End | `hotkeyScope` prop |
| `ChatList` | Same as ScrollList (inverted) | `hotkeyScope` prop |
| `Select` | ↑/↓, Enter, Escape | `isActive` prop |
| `Modal` | Escape to close | Push/pop scope on mount |
| `CommandPalette` | ↑/↓, Enter, Escape | Auto-manages scope |
| `Tabs` | ←/→, Tab | `isActive` prop |

### ScrollList Hotkeys

```typescript
ScrollList({
  items: myItems,
  children: (item) => Text({}, item),
  height: 20,
  keysEnabled: true,    // Enable/disable all hotkeys
  isActive: true,       // Component is focused
  hotkeyScope: 'global', // Scope for conflict prevention
})
```

| Key | Action (Normal) | Action (Inverted) |
|:----|:----------------|:------------------|
| `↑` / `k` | Scroll up | Scroll down (older) |
| `↓` / `j` | Scroll down | Scroll up (newer) |
| `Page Up` | Page up | Page down |
| `Page Down` | Page down | Page up |
| `Home` | Go to top | Go to bottom (oldest) |
| `End` | Go to bottom | Go to top (newest) |

---

## Patterns

### Modal with Scoped Hotkeys

```typescript
function Modal({ onClose, children }) {
  // Push scope when modal mounts
  useEffect(() => {
    pushHotkeyScope('modal')
    return () => popHotkeyScope()
  })

  // Modal-only hotkeys
  useHotkeys('escape', onClose, { scope: 'modal' })
  useHotkeys('enter', () => confirm(), { scope: 'modal' })

  return Box({ borderStyle: 'round' }, children)
}
```

### Focus-Based Activation

```typescript
function FocusableList({ items }) {
  const { isFocused } = useFocus()

  return ScrollList({
    items,
    children: (item) => Text({}, item.name),
    height: 10,
    isActive: isFocused,  // Only respond when focused
  })
}
```

### Global Application Shortcuts

```typescript
function App() {
  // These work regardless of focus
  useHotkeys('ctrl+q', () => process.exit(0), {
    scope: 'global',
    description: 'Quit application'
  })

  useHotkeys('ctrl+k', () => openCommandPalette(), {
    scope: 'global',
    description: 'Open command palette'
  })

  useHotkeys('f1', () => showHelp(), {
    scope: 'global',
    description: 'Show help'
  })

  return AppShell({ /* ... */ })
}
```

### Help Screen

```typescript
import { getRegisteredHotkeys, formatHotkeyPlatform } from 'tuiuiu.js'

function HelpScreen() {
  const hotkeys = getRegisteredHotkeys()
    .filter(h => h.description) // Only documented ones

  return Box({ flexDirection: 'column' },
    Text({ bold: true }, 'Keyboard Shortcuts'),
    ...hotkeys.map(h =>
      Box({ flexDirection: 'row' },
        Text({ color: 'cyan', width: 15 }, formatHotkeyPlatform(h.keys)),
        Text({}, h.description),
      )
    )
  )
}
```

---

## Best Practices

1. **Use `useHotkeys` for shortcuts** - It has built-in scope support
2. **Use `useInput` for data entry** - When you need raw character input
3. **Always set `isActive`** - Prevents inactive components from responding
4. **Use scopes for overlays** - Modals, palettes, popups should push/pop scope
5. **Document shortcuts** - Use `description` option for help screens
6. **Cross-platform bindings** - Use arrays: `['ctrl+s', 'cmd+s']`

---

## Related

- [useHotkeys Hook](/hooks/use-hotkeys.md) - Full API reference
- [useInput Hook](/hooks/use-input.md) - Raw input handling
- [ScrollList](/components/scroll.md) - Scrollable list with keyboard navigation
- [Modal](/components/overlays.md) - Modal dialogs
- [CommandPalette](/components/organisms/command-palette.md) - Command palette
