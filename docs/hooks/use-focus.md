# useFocus

Manage focus state for interactive components.

## Overview

Tuiuiu provides a centralized focus management system with **automatic Tab navigation**. Components register themselves with the focus manager and can query their focus state.

## Automatic Tab Navigation

By default, Tuiuiu automatically handles Tab/Shift+Tab to cycle through focusable components:

- **Tab** - Focus next component
- **Shift+Tab** - Focus previous component
- **Escape** - Blur current focus (unfocus all)

This behavior is enabled by default but can be disabled:

```typescript
import { render } from 'tuiuiu.js';

// Disable automatic Tab navigation
render(App, { autoTabNavigation: false });
```

You can also toggle it at runtime:

```typescript
import { useApp } from 'tuiuiu.js';

function Settings() {
  const { setAutoTabNavigation, autoTabNavigation } = useApp();

  return Box({},
    Text({}, `Auto Tab: ${autoTabNavigation ? 'ON' : 'OFF'}`),
    // Toggle with a button...
  );
}
```

## Basic Usage

```typescript
import { useFocus, useInput, Box, Text } from 'tuiuiu.js';

function Button({ label }: { label: string }) {
  const { isFocused } = useFocus();

  useInput((_, key) => {
    if (key.return && isFocused) {
      console.log(`${label} clicked!`);
    }
  });

  return Box(
    {
      borderStyle: 'single',
      borderColor: isFocused ? 'green' : 'gray'
    },
    Text({}, label)
  );
}

function App() {
  return Box({ flexDirection: 'column', gap: 1 },
    Button({ label: 'Submit' }),
    Button({ label: 'Cancel' }),
    Button({ label: 'Help' })
  );
}
```

Press Tab to cycle through the buttons!

## API Reference

### `useFocus(options?): FocusResult`

Register a component as focusable and get its focus state.

**Options:**

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `autoFocus` | `boolean` | `false` | Grab focus on mount |
| `id` | `string` | auto-generated | Stable ID for this focus node |
| `isActive` | `boolean` | `true` | Whether to register with focus manager |

**Returns:**

```typescript
interface FocusResult {
  isFocused: boolean;  // Whether this component is focused
  focus: () => void;   // Programmatically focus this component
}
```

**Example:**

```typescript
function TextInput({ id }: { id: string }) {
  const { isFocused, focus } = useFocus({
    id,
    autoFocus: id === 'username' // Auto-focus the username field
  });

  return Box({
    borderColor: isFocused ? 'cyan' : 'gray'
  },
    Text({}, isFocused ? '> ' : '  '),
    Text({}, 'Enter value...')
  );
}
```

### `useFocusManager(): FocusManagerControls`

Get programmatic control over focus. Useful for custom navigation patterns.

**Returns:**

```typescript
interface FocusManagerControls {
  focusNext: () => void;           // Move to next focusable
  focusPrevious: () => void;       // Move to previous focusable
  focus: (id: string) => void;     // Focus specific component by ID
  blur: () => void;                // Unfocus all components
  getActiveId: () => string | undefined;  // Get currently focused ID
}
```

**Example:**

```typescript
import { useFocusManager, useInput } from 'tuiuiu.js';

function CustomNavigation() {
  const { focusNext, focusPrevious, blur, getActiveId } = useFocusManager();

  useInput((input, key) => {
    // Arrow key navigation instead of Tab
    if (key.downArrow) focusNext();
    if (key.upArrow) focusPrevious();
    if (input === 'q') blur();
  });

  return Text({}, `Focused: ${getActiveId() ?? 'none'}`);
}
```

## FocusContext

For advanced use cases, you can access the FocusManager via Context:

```typescript
import {
  FocusContext,
  useFocusContext,
  useFocusContextRequired,
  hasFocusContext
} from 'tuiuiu.js';

// Returns FocusManager or null
const fm = useFocusContext();

// Throws if not in a Reck app
const fm = useFocusContextRequired();

// Check if context exists
if (hasFocusContext()) {
  // Safe to use focus features
}
```

## Focus Order

Components are focused in the order they are registered (mount order). The focus cycles:

```
Component A → Component B → Component C → Component A → ...
     ↑                                         |
     └─────────────────────────────────────────┘
```

## Conditional Focus

Use `isActive` to conditionally include a component in the focus order:

```typescript
function ConditionalButton({ disabled }: { disabled: boolean }) {
  const { isFocused } = useFocus({
    isActive: !disabled  // Don't register if disabled
  });

  return Box({
    borderColor: disabled ? 'gray' : (isFocused ? 'green' : 'white')
  },
    Text({ dim: disabled }, 'Button')
  );
}
```

## Best Practices

1. **Use stable IDs** when you need to focus programmatically
2. **Let Tab navigation work** - don't override unless necessary
3. **Visual feedback** - always show focus state (border color, prefix, etc.)
4. **Escape to exit** - users expect Escape to clear focus

```typescript
// Good: Clear visual feedback
const { isFocused } = useFocus();
return Box({
  borderStyle: 'single',
  borderColor: isFocused ? 'cyan' : 'gray',
},
  Text({ bold: isFocused }, isFocused ? '● ' : '○ '),
  Text({}, label)
);
```

## See Also

- [useInput](/hooks/use-input.md) - Keyboard input handling
- [Context API](/hooks/context.md) - FocusContext details
- [useApp](/hooks/use-app.md) - App-level settings including autoTabNavigation
