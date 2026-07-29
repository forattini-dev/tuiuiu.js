# Tooltip & Popover

Informational overlay components for contextual help and status indicators.

## Import

```typescript
import { Tooltip, WithTooltip, helpTooltip, Popover, InfoBox } from 'tuiuiu.js'
```

## Tooltip

Floating tooltip that appears on hover or focus.

### Basic Usage

```typescript
// Simple tooltip
Tooltip({ content: 'This is helpful info', visible: true })

// With custom position
Tooltip({
  content: 'Save your changes',
  visible: isHovered,
  position: 'top',
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | - | Tooltip text |
| `visible` | `boolean` | `false` | Show tooltip |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Position |
| `color` | `ColorValue` | - | Background color |
| `foreground` | `ColorValue` | - | Text color |

## WithTooltip

Wrapper that adds tooltip to any component:

```typescript
WithTooltip({
  tooltip: 'Click to save',
  position: 'bottom',
  children: Button({ label: 'Save' }),
})
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `tooltip` | `string` | Tooltip text |
| `position` | `Position` | Tooltip position |
| `children` | `VNode` | Wrapped component |
| `showOnFocus` | `boolean` | Show on focus |

## HelpTooltip

Question mark icon with tooltip - ideal for form field help:

```typescript
Box({ flexDirection: 'row', gap: 1 },
  Text({}, 'Username'),
  helpTooltip('Your unique identifier', { active: true })
)
```

Output: `Username [?]` → hover shows "Your unique identifier"

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | - | Help text, passed as the first argument |
| `icon` | `string` | `'?'` | Trigger icon |
| `iconColor` | `ColorValue` | `'primary'` | Icon color |
| `active` | `boolean` | `false` | Show the tooltip |

## Badge

Badge has its own reference with the current semantic `variant` and visual
`style` properties: [Badge](/components/atoms/badge.md).

## Popover

Larger floating panel for extended content:

```typescript
Popover({
  visible: isOpen,
  content: Box({ flexDirection: 'column' },
    Text({ bold: true }, 'Settings'),
    Text({}, 'Configure your preferences'),
    Switch({ label: 'Dark mode' })
  ),
})
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Show popover |
| `content` | `VNode` | Popover content |
| `position` | `Position` | Placement |
| `width` | `number` | Fixed width |
| `arrow` | `boolean` | Show the position arrow |

## InfoBox

Styled information box for help text:

```typescript
InfoBox({
  title: 'Tip',
  message: 'Press Tab to navigate between fields',
  type: 'info',
})
```

### Variants

| Variant | Use Case |
|---------|----------|
| `'info'` | General information (blue) |
| `'success'` | Success messages (green) |
| `'warning'` | Caution notes (yellow) |
| `'danger'` | Error information (red) |

## Examples

### Form with Help

```typescript
function FormField({ label, help, children }) {
  return Box({ flexDirection: 'column', gap: 1 },
    Box({ flexDirection: 'row', gap: 1 },
      Text({}, label),
      helpTooltip(help, { active: true })
    ),
    children
  )
}

FormField({
  label: 'Email',
  help: 'Your account email address',
  children: TextInput({ placeholder: 'email@example.com' })
})
```

### Notification Badge

```typescript
function NavItem({ label, count }) {
  return Box({ flexDirection: 'row', gap: 1 },
    Text({}, label),
    count > 0 && Badge({
      label: count > 99 ? '99+' : String(count),
      variant: 'danger',
    })
  )
}
```

### Status Tags

```typescript
function StatusBadge({ status }) {
  const variants = {
    active: 'success',
    pending: 'warning',
    error: 'danger',
    inactive: 'default',
  }

  return Badge({
    label: status.toUpperCase(),
    variant: variants[status],
    style: 'subtle',
  })
}
```

## Related

- [Modal](/components/organisms/modal.md) - Modal dialogs
- [Overlays](/components/overlays.md) - Overlay components
- [Typography](/components/typography.md) - Text styling
