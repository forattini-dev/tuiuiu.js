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
import {
  ConfirmDialog,
  OverlayContainer,
  createModalOverlay,
  createOverlayStack,
} from 'tuiuiu.js';

// Create global stack
const overlays = createOverlayStack();

// Push an overlay
overlays.push(createModalOverlay({
  id: 'confirm-delete',
  component: () => ConfirmDialog({
    title: 'Delete file?',
    message: 'This action cannot be undone.',
  }),
}));

// Render last inside a full-size, position: 'relative' root Box.
OverlayContainer({ stack: overlays });
```

`OverlayContainer` occupies the root as an absolute layer, centers each
overlay, and keeps later/higher-priority entries above earlier ones. See the
[complete quit-confirmation example](/components/organisms/modal.md#complete-quit-confirmation)
for keyboard handling, cancellation, callbacks, mouse input, and a PowerShell
run command.

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

## Modal

See the [Modal](/components/organisms/modal.md) documentation for comprehensive coverage of:

- **Modal** - Centered modal dialog with backdrop
- **ConfirmDialog** - Pre-built Yes/No confirmation
- **Toast** - Temporary notifications
- **AlertBox** - Inline alert messages
- **Window** - Floating draggable windows

## Related

- [Modal Documentation](/components/organisms/modal.md) - Full modal component reference
- [Forms](/components/forms.md) - Form components for modal content
- [Button](/components/atoms/button.md) - Button components for modal actions
