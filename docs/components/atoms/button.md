# Button

Interactive button component with multiple variants, sizes, loading states, and icon support.

## Import

```typescript
import { Button, IconButton, ButtonGroup } from 'tuiuiu.js'
```

## Button

### Basic Usage

```typescript
Button({ label: 'Click me', onClick: () => console.log('clicked') })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Button label text |
| `onClick` | `() => void` | - | Click handler |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'link'` | `'solid'` | Visual variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `color` | `ColorValue` | theme accent | Button color |
| `disabled` | `boolean` | `false` | Disable interaction |
| `loading` | `boolean` | `false` | Show loading spinner |
| `loadingText` | `string` | - | Text to show while loading |
| `icon` | `string` | - | Icon before label |
| `iconRight` | `string` | - | Icon after label |
| `fullWidth` | `boolean` | `false` | Expand to fill container |
| `focused` | `boolean` | `false` | Focus state |
| `hovered` | `boolean` | `false` | Hover state |

### Variants

```typescript
// Solid (default) - filled background
Button({ label: 'Submit', variant: 'solid', color: 'success' })

// Outline - border only
Button({ label: 'Cancel', variant: 'outline' })

// Ghost - minimal, no background
Button({ label: 'Skip', variant: 'ghost' })

// Link - text link style
Button({ label: 'Learn more', variant: 'link' })
```

### With Icons

```typescript
Button({
  label: 'Save',
  icon: '💾',
  variant: 'solid',
  color: 'success',
  onClick: handleSave,
})

// Icon on the right
Button({
  label: 'Next',
  iconRight: '→',
})
```

### Loading State

```typescript
Button({
  label: 'Submit',
  loading: isSubmitting(),
  loadingText: 'Submitting...',
  onClick: handleSubmit,
})
```

### Using Presets

```typescript
import { presets } from 'tuiuiu.js'

// Danger button
Button({ ...presets.dangerButton, label: 'Delete' })

// Success button
Button({ ...presets.successButton, label: 'Save' })

// Ghost button
Button({ ...presets.ghostButton, label: 'Cancel' })
```

## IconButton

Button with just an icon, no label. Ideal for toolbars and compact UI.

```typescript
IconButton({ icon: '🗑️', label: 'Delete', onClick: handleDelete })
```

### Toolbar Example

```typescript
Box({ flexDirection: 'row', gap: 1 },
  IconButton({ icon: '📁', label: 'Open' }),
  IconButton({ icon: '💾', label: 'Save' }),
  IconButton({ icon: '↩️', label: 'Undo' }),
)
```

## ButtonGroup

Group of buttons with shared styling and keyboard navigation.

```typescript
ButtonGroup({
  buttons: [
    { label: 'Yes', variant: 'solid', color: 'success' },
    { label: 'No', variant: 'outline' },
    { label: 'Cancel', variant: 'ghost' },
  ],
  focusedIndex: selectedIndex(),
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `buttons` | `ButtonProps[]` | required | Array of button configs |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `gap` | `number` | `1` | Gap between buttons |
| `focusedIndex` | `number` | - | Currently focused index |

## ConfirmButton

Two-click safety button for destructive actions.

```typescript
import { ConfirmButton, createConfirmButton } from 'tuiuiu.js'

// Simple usage
ConfirmButton({
  label: 'Delete',
  confirmLabel: 'Click again to delete',
  onConfirm: () => deleteItem(),
})

// With state for programmatic control
const btn = createConfirmButton({ onConfirm: handleDelete })
ConfirmButton({ state: btn, label: 'Delete' })

// Cancel with Escape
useInput((_, key) => {
  if (key.escape) btn.cancel()
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Button label |
| `confirmLabel` | `string` | `'Are you sure?'` | Label during confirmation |
| `variant` | `ButtonVariant` | `'ghost'` | Initial variant |
| `confirmVariant` | `ButtonVariant` | `'solid'` | Variant during confirmation |
| `onConfirm` | `() => void` | - | Called when confirmed |
| `onCancel` | `() => void` | - | Called when cancelled |
| `timeout` | `number` | `3000` | Confirmation timeout (ms) |
| `showCountdown` | `boolean` | `true` | Show remaining time |

## Related

- [Forms](/components/forms.md) - Form components
- [Overlays](/components/overlays.md) - Modals and dialogs
