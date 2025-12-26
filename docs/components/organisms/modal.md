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

Pre-built confirmation dialog with Yes/No buttons.

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
| `confirmLabel` | `string` | `'Yes'` | Confirm button label |
| `cancelLabel` | `string` | `'No'` | Cancel button label |
| `confirmColor` | `ColorValue` | `'error'` | Confirm button color |
| `onConfirm` | `() => void` | - | Confirm callback |
| `onCancel` | `() => void` | - | Cancel callback |

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

// Add overlays
overlays.push({ id: 'modal1', content: Modal1() })
overlays.push({ id: 'modal2', content: Modal2() })

// Remove top overlay
overlays.pop()

// Render
OverlayStack({ stack: overlays })
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
