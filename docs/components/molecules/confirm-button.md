# ConfirmButton

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

## Props

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
