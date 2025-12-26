# useHotkeys

Keyboard shortcut system for terminal applications.

## Import

```typescript
import {
  useHotkeys,
  registerHotkey,
  getHotkeyScope,
  setHotkeyScope,
  pushHotkeyScope,
  popHotkeyScope,
  getRegisteredHotkeys,
  formatHotkey,
  formatHotkeyPlatform,
  parseHotkey,
} from 'tuiuiu.js'
```

## Basic Usage

```typescript
function MyComponent() {
  // Simple hotkey
  useHotkeys('ctrl+s', () => save())

  // Multiple bindings (cross-platform)
  useHotkeys(['ctrl+z', 'cmd+z'], () => undo())

  // With scope (only active when scope matches)
  useHotkeys('escape', () => closeModal(), { scope: 'modal' })

  return Box({}, Text({}, 'Press Ctrl+S to save'))
}
```

## useHotkeys Hook

### Signature

```typescript
useHotkeys(
  hotkeys: string | string[],
  handler: () => void,
  options?: HotkeyOptions
): void
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `hotkeys` | `string \| string[]` | Hotkey string(s) to bind |
| `handler` | `() => void` | Function to call when triggered |
| `options` | `HotkeyOptions` | Optional configuration |

### HotkeyOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scope` | `string` | `'global'` | Scope for this hotkey |
| `excludeInput` | `boolean` | `true` | Don't trigger when input focused |
| `description` | `string` | - | Description for help/display |

## Supported Keys

### Modifiers

| Key | Aliases |
|-----|---------|
| `ctrl` | `control` |
| `alt` | `option` |
| `shift` | - |
| `meta` | `cmd`, `command` |

### Special Keys

| Key | Aliases |
|-----|---------|
| `enter` | `return` |
| `escape` | `esc` |
| `tab` | - |
| `space` | - |
| `backspace` | - |
| `delete` | `del` |

### Navigation Keys

| Key | Aliases |
|-----|---------|
| `up` | `arrowup` |
| `down` | `arrowdown` |
| `left` | `arrowleft` |
| `right` | `arrowright` |
| `home` | - |
| `end` | - |
| `pageup` | `pgup` |
| `pagedown` | `pgdn` |

### Function Keys

`f1`, `f2`, `f3`, `f4`, `f5`, `f6`, `f7`, `f8`, `f9`, `f10`, `f11`, `f12`

### Letters & Numbers

`a-z`, `0-9`

## Hotkey String Format

```typescript
// Single modifier + key
'ctrl+s'

// Multiple modifiers
'ctrl+shift+s'

// Multiple bindings (array)
['ctrl+z', 'cmd+z']

// Multiple bindings (comma-separated)
'ctrl+z, cmd+z'

// Special keys
'escape'
'enter'
'f1'
'up'
```

## Standalone Registration

Use outside components for global hotkeys:

```typescript
// Register global hotkey
const unregister = registerHotkey('ctrl+q', () => process.exit(0), {
  description: 'Quit application',
  scope: 'global',
})

// Later: cleanup
unregister()
```

## Scope Management

Scopes allow enabling/disabling groups of hotkeys contextually.

### Basic Scopes

```typescript
// Set current scope
setHotkeyScope('modal')   // Only 'modal' and 'global' hotkeys active
setHotkeyScope('global')  // Reset to default

// Get current scope
const scope = getHotkeyScope() // 'global'
```

### Scope Stack (Nested Contexts)

```typescript
// Modal opens
pushHotkeyScope('modal')
// scope is now 'modal'

// Command palette opens inside modal
pushHotkeyScope('command-palette')
// scope is now 'command-palette'

// Command palette closes
popHotkeyScope()
// scope is back to 'modal'

// Modal closes
popHotkeyScope()
// scope is back to 'global'
```

### Scope Utilities

```typescript
// Get stack depth (for debugging)
const depth = getHotkeyScopeDepth() // 0 when at global

// Reset everything (emergency/testing)
resetHotkeyScope() // Clears stack, sets scope to 'global'
```

## Displaying Hotkeys

### Get All Registered

```typescript
const hotkeys = getRegisteredHotkeys()
// [{ keys: 'Ctrl+S', description: 'Save file', scope: 'global' }]

hotkeys.forEach(h => {
  console.log(`${h.keys}: ${h.description}`)
})
```

### Format for Display

```typescript
// Standard format
formatHotkey('ctrl+s')      // "Ctrl+S"
formatHotkey('ctrl+shift+n') // "Ctrl+Shift+N"

// Platform-aware (shows Mac symbols on macOS)
formatHotkeyPlatform('ctrl+s')
// macOS: "⌘S"
// Linux/Windows: "Ctrl+S"

formatHotkeyPlatform('ctrl+shift+alt+k')
// macOS: "⌘⇧⌥K"
// Linux/Windows: "Ctrl+Shift+Alt+K"
```

## When to Use

### useHotkeys vs useInput

| **useHotkeys** | **useInput** |
|----------------|--------------|
| Declarative (string-based) | Imperative (callback-based) |
| For **actions/commands** | For **data entry** |
| Interface shortcuts | Character-by-character input |
| Supports scopes | Raw key access |

```typescript
// useHotkeys - ACTIONS/COMMANDS
function App() {
  useHotkeys('ctrl+s', () => save(), { description: 'Save file' })
  useHotkeys('ctrl+k', () => openCommandPalette())
  useHotkeys('escape', () => closeModal(), { scope: 'modal' })
}

// useInput - DATA ENTRY
function TextInput() {
  const [value, setValue] = useState('')

  useInput((char, key) => {
    if (key.backspace) setValue(v => v.slice(0, -1))
    else if (char && !key.ctrl) setValue(v => v + char)
  })

  return Text({}, value)
}
```

## Examples

### Application Shortcuts

```typescript
function App() {
  // File operations
  useHotkeys('ctrl+s', save, { description: 'Save' })
  useHotkeys('ctrl+o', open, { description: 'Open' })
  useHotkeys('ctrl+n', newFile, { description: 'New file' })

  // Edit operations
  useHotkeys(['ctrl+z', 'cmd+z'], undo, { description: 'Undo' })
  useHotkeys(['ctrl+y', 'ctrl+shift+z'], redo, { description: 'Redo' })
  useHotkeys('ctrl+c', copy, { description: 'Copy' })
  useHotkeys('ctrl+v', paste, { description: 'Paste' })

  // Navigation
  useHotkeys('ctrl+k', openPalette, { description: 'Command Palette' })
  useHotkeys('ctrl+p', quickOpen, { description: 'Quick Open' })
  useHotkeys('f1', showHelp, { description: 'Help' })
}
```

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
  useHotkeys('enter', confirm, { scope: 'modal' })

  return Box({ borderStyle: 'round' }, children)
}
```

### Help Screen

```typescript
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

### Cross-Platform Bindings

```typescript
// Use array for cross-platform support
useHotkeys(['ctrl+s', 'cmd+s'], save)
useHotkeys(['ctrl+z', 'cmd+z'], undo)
useHotkeys(['ctrl+shift+z', 'cmd+shift+z'], redo)

// Check platform for display
const isMac = process.platform === 'darwin'
Text({}, `Press ${isMac ? '⌘S' : 'Ctrl+S'} to save`)
```

### Conditional Hotkeys

```typescript
function Editor({ readonly }) {
  // Only register edit hotkeys if not readonly
  if (!readonly) {
    useHotkeys('ctrl+s', save)
    useHotkeys('ctrl+z', undo)
  }

  // Always allow navigation
  useHotkeys('ctrl+g', goToLine)
  useHotkeys('ctrl+f', find)
}
```

## Advanced

### Custom Hotkey Parsing

```typescript
// Parse a hotkey string
const binding = parseHotkey('ctrl+shift+s')
// { key: 's', ctrl: true, alt: false, shift: true, meta: false }

// Parse multiple
const bindings = parseHotkeys('ctrl+s, cmd+s')
// Array of bindings
```

### Manual Hotkey Triggering

```typescript
import { triggerHotkey } from 'tuiuiu.js'

// Check if key event matches any registered hotkey
const handled = triggerHotkey(input, key)
if (handled) {
  // A hotkey was triggered
}
```

## Related

- [useInput](/hooks/use-input.md) - Raw keyboard input handling
- [CommandPalette](/components/organisms/command-palette.md) - Command palette component
- [Modal](/components/organisms/modal.md) - Modal dialogs

