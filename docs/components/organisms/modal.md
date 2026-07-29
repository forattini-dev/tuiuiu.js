# Modal

Modal dialogs for displaying content that requires user attention or interaction.

## Import

```typescript
import { Modal, ConfirmDialog, Toast, AlertBox, Window } from 'tuiuiu.js'
```

## Modal

Centered modal dialog with backdrop support.

### Basic Usage

```typescript
When(showModal(),
  Modal({
    title: 'Settings',
    content: SettingsForm(),
    onClose: () => setShowModal(false),
  })
)
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Modal title |
| `content` | `VNode` | required | Modal content |
| `size` | `'small' \| 'medium' \| 'large' \| 'fullscreen' \| { width, height }` | `'medium'` | Modal size |
| `position` | `'center' \| 'top' \| 'bottom' \| { x, y }` | `'center'` | Modal position |
| `borderStyle` | `BorderStyle` | `'round'` | Border style |
| `borderColor` | `string` | - | Border color |
| `titleColor` | `string` | - | Title text color |
| `backdrop` | `boolean` | `true` | Show dimmed backdrop |
| `backdropChar` | `string` | - | Custom backdrop character |
| `showCloseHint` | `boolean` | `false` | Show close hint text |
| `closeHint` | `string` | `'Press Esc to close'` | Close hint text |
| `footer` | `VNode` | - | Footer content |
| `padding` | `number` | `1` | Internal padding |
| `showCloseButton` | `boolean` | `false` | Show X close button |
| `onClose` | `() => void` | - | Close callback |

### Sizes

```typescript
// Small (good for confirmations)
Modal({ size: 'small', title: 'Confirm', content: message })

// Medium (default)
Modal({ size: 'medium', title: 'Settings', content: form })

// Large (for complex content)
Modal({ size: 'large', title: 'File Browser', content: browser })

// Fullscreen
Modal({ size: 'fullscreen', content: editor })

// Custom dimensions
Modal({ size: { width: 60, height: 20 }, content: custom })
```

### Using Presets

```typescript
import { presets } from 'tuiuiu.js'

// Confirm modal preset
Modal({
  ...presets.confirmModal,
  title: 'Delete File?',
  content: Text({}, 'This action cannot be undone.'),
})

// Alert modal preset
Modal({
  ...presets.alertModal,
  title: 'Warning',
  content: Text({}, 'Your session will expire soon.'),
})

// Form modal preset
Modal({
  ...presets.formModal,
  title: 'Edit Profile',
  content: ProfileForm(),
})
```

## ConfirmDialog

Pre-built confirmation dialog with keyboard- and mouse-accessible actions.

```typescript
ConfirmDialog({
  title: 'Delete File?',
  message: 'This action cannot be undone.',
  onConfirm: handleDelete,
  onCancel: closeDialog,
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Dialog title |
| `message` | `string` | required | Dialog message |
| `confirmText` | `string` | `'Confirm'` | Confirm button label |
| `cancelText` | `string` | `'Cancel'` | Cancel button label |
| `confirmColor` | `string` | Theme positive color | Confirm button color |
| `cancelColor` | `string` | Theme muted color | Cancel button color |
| `selected` | `number` | `0` | Selected button: cancel is `0`, confirm is `1` |
| `type` | `'info' \| 'warning' \| 'danger'` | `'info'` | Dialog color treatment |
| `onConfirm` | `() => void` | - | Confirm callback |
| `onCancel` | `() => void` | - | Cancel callback |

Use `createConfirmDialog()` when the selection should respond to keyboard input.
Its `props` getter is reactive and includes the configured callbacks:

```typescript
const dialog = createConfirmDialog({
  title: 'Delete file?',
  message: 'This cannot be undone.',
  type: 'danger',
  onConfirm: deleteFile,
  onCancel: closeDialog,
})

useInput((_, key) => {
  if (key.leftArrow || key.rightArrow || key.tab) dialog.toggle()
  if (key.return) dialog.confirm()
  if (key.escape) dialog.cancel()
})

ConfirmDialog(dialog.props)
```

### Complete Quit Confirmation

This is a complete application: the button opens a centered overlay, the
dialog owns input while open, `Enter` invokes the selected action, `Esc`
cancels, and both dialog actions are clickable.

```typescript
import {
  Box,
  Button,
  ConfirmDialog,
  OverlayContainer,
  Text,
  createConfirmDialog,
  createModalOverlay,
  createOverlayStack,
  render,
  useApp,
  useConst,
  useInput,
  useState,
} from 'tuiuiu.js'

const DIALOG_ID = 'confirm-quit'

function App() {
  const app = useApp()
  const overlays = useConst(createOverlayStack)
  const [status, setStatus] = useState('Ready')

  const dialog = useConst(() => createConfirmDialog({
    title: 'Quit?',
    message: 'Unsaved work will be lost.',
    confirmText: 'Quit',
    cancelText: 'Keep working',
    type: 'danger',
    onConfirm: () => {
      overlays.close(DIALOG_ID)
      app.exit()
    },
    onCancel: () => {
      overlays.close(DIALOG_ID)
      setStatus('Quit cancelled')
    },
  }))

  const openQuitDialog = () => {
    if (overlays.isOpen(DIALOG_ID)) return
    dialog.selectCancel()
    overlays.push(createModalOverlay({
      id: DIALOG_ID,
      closeOnEscape: false,
      component: () => ConfirmDialog(dialog.props),
    }))
  }

  useInput((input, key) => {
    if (overlays.hasOverlay()) {
      if (key.leftArrow || key.rightArrow || key.tab) dialog.toggle()
      else if (key.return) dialog.confirm()
      else if (key.escape) dialog.cancel()
      return true
    }

    if (input.toLowerCase() === 'q' || key.return) openQuitDialog()
  }, { priority: 'modal', stopPropagation: true })

  return Box(
    {
      position: 'relative',
      width: 'fill',
      height: 'fill',
      flexDirection: 'column',
      padding: 1,
    },
    Text({ bold: true, color: 'cyan' }, 'Overlay example'),
    Button({ label: 'Quit application', color: 'red', onClick: openQuitDialog }),
    Text({ color: 'gray' }, status()),
    OverlayContainer({ stack: overlays }),
  )
}

const { waitUntilExit } = render(App, {
  fullHeight: true,
  autoTabNavigation: false,
})
await waitUntilExit()
```

Run the checked-in version with:

```powershell
pnpm example confirm-dialog-overlay
```

The command and key handling are portable to Windows 10/11 in Windows
Terminal or PowerShell; they do not depend on POSIX shell features.

## Toast

Temporary notification message.

```typescript
Toast({
  message: 'File saved successfully',
  type: 'success',
  duration: 3000,
  onDismiss: () => setShowToast(false),
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | required | Toast message |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Toast type |
| `duration` | `number` | `3000` | Auto-dismiss time (ms) |
| `position` | `'top' \| 'bottom'` | `'bottom'` | Toast position |
| `onDismiss` | `() => void` | - | Dismiss callback |

## AlertBox

Inline alert message.

```typescript
AlertBox({
  title: 'Warning',
  message: 'Your changes have not been saved.',
  type: 'warning',
})
```

## Window

Floating window with position and drag support.

```typescript
Window({
  title: 'Terminal',
  x: 10,
  y: 5,
  width: 60,
  height: 20,
  content: TerminalContent(),
  onClose: () => setShowWindow(false),
})
```

## OverlayStack

Manage multiple overlays with proper stacking.

```typescript
const overlays = createOverlayStack()

overlays.push(createModalOverlay({
  id: 'settings',
  component: () => SettingsModal(),
}))

overlays.close('settings') // or overlays.pop()

// Place this last in a position: 'relative' root container.
OverlayContainer({ stack: overlays })
```

## Patterns

### Modal with Form

```typescript
function EditModal({ item, onSave, onClose }) {
  const form = useForm({
    initialValues: { name: item.name, email: item.email },
    onSubmit: async (values) => {
      await onSave(values)
      onClose()
    },
  })

  return Modal({
    title: 'Edit Item',
    content: Box({ flexDirection: 'column', gap: 1 },
      FormField({
        label: 'Name',
        error: form.errors().name,
        children: TextInput({ ...form.field('name') }),
      }),
      FormField({
        label: 'Email',
        error: form.errors().email,
        children: TextInput({ ...form.field('email') }),
      }),
    ),
    footer: Box({ flexDirection: 'row', gap: 1, justifyContent: 'flex-end' },
      Button({ label: 'Cancel', variant: 'ghost', onClick: onClose }),
      Button({
        label: 'Save',
        variant: 'solid',
        color: 'success',
        loading: form.isSubmitting(),
        onClick: () => form.submit(),
      }),
    ),
    onClose,
  })
}
```

## Related

- [Button](/components/atoms/button.md) - Button components
- [Forms](/components/forms.md) - Form components
- [Overlays](/components/overlays.md) - Overview of overlays
