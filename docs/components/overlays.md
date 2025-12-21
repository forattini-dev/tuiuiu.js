# Overlay Components

Components that appear on top of other content, such as modals, dialogs, and command palettes.

## CommandPalette

A searchable command menu, similar to VS Code's command palette (Ctrl+Shift+P) or Spotlight.

### Usage

```typescript
import { createCommandPalette, CommandPalette, useInput } from 'tuiuiu.js';

// 1. Create state
const palette = createCommandPalette({
  items: [
    { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', action: () => save() },
    { id: 'open', label: 'Open File', shortcut: 'Ctrl+O' },
  ],
  onSelect: (item) => item.action?.(),
  onClose: () => setShowPalette(false)
});

// 2. Handle input
useInput((input, key) => {
  if (showPalette()) {
    if (key.upArrow) palette.selectPrev();
    if (key.downArrow) palette.selectNext();
    if (key.return) palette.confirm();
    // ... forward input to palette.type(input)
  }
});

// 3. Render
if (showPalette()) {
  CommandPalette({
    ...palette.props,
    query: palette.query(),
    filteredItems: palette.filteredItems(),
    selectedIndex: palette.selectedIndex()
  });
}
```

## OverlayStack

A manager for handling multiple overlapping overlays (modals, dialogs, etc.) with correct z-ordering and focus handling.

### Usage

```typescript
import { createOverlayStack, OverlayContainer } from 'tuiuiu.js';

// Create global stack
const overlays = createOverlayStack();

// Push an overlay
overlays.push({
  id: 'confirm-delete',
  component: () => ConfirmDialog({ ... }),
  priority: 'normal'
});

// Render the container (usually at root of app)
OverlayContainer({ stack: overlays });
```

## GoToDialog

A simple numeric input dialog, often used for jumping to a specific page or line.

```typescript
import { GoToDialog } from 'tuiuiu.js';

GoToDialog({
  value: '10',
  max: 100,
  prompt: 'Go to line:'
});
```
