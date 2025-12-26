# Tooltip, Badge & Popover

Informational overlay components for contextual help and status indicators.

## Import

```typescript
import { Tooltip, WithTooltip, HelpTooltip, Badge, Popover, InfoBox } from 'tuiuiu.js'
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
  HelpTooltip({ content: 'Your unique identifier' })
)
```

Output: `Username [?]` → hover shows "Your unique identifier"

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | - | Help text |
| `icon` | `string` | `'?'` | Trigger icon |
| `color` | `ColorValue` | `'info'` | Icon color |

## Badge

Small status indicator or counter.

### Basic Usage

```typescript
// Status badge
Badge({ label: 'NEW', color: 'success' })

// Counter badge
Badge({ label: '42', color: 'primary' })

// Dot badge (no label)
Badge({ dot: true, color: 'danger' })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Badge text |
| `color` | `ColorValue` | `'primary'` | Background color |
| `foreground` | `ColorValue` | auto | Text color |
| `variant` | `'solid' \| 'outline' \| 'subtle'` | `'solid'` | Style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size |
| `dot` | `boolean` | `false` | Dot-only mode |
| `pulse` | `boolean` | `false` | Animated pulse |

### Variants

```typescript
// Solid (default)
Badge({ label: 'Active', color: 'success', variant: 'solid' })

// Outline
Badge({ label: 'Pending', color: 'warning', variant: 'outline' })

// Subtle
Badge({ label: 'Draft', color: 'neutral', variant: 'subtle' })
```

### Common Patterns

```typescript
// Unread count
Box({ flexDirection: 'row', gap: 1 },
  Text({}, 'Messages'),
  Badge({ label: '5', color: 'danger' })
)

// Status indicator
Box({ flexDirection: 'row', gap: 1 },
  Badge({ dot: true, color: 'success' }),
  Text({}, 'Online')
)

// Notification dot
Box({},
  Text({}, 'Inbox'),
  Badge({ dot: true, color: 'danger', pulse: true })
)
```

## Popover

Larger floating panel for extended content:

```typescript
Popover({
  visible: isOpen,
  title: 'Settings',
  content: Box({ flexDirection: 'column' },
    Text({}, 'Configure your preferences'),
    Switch({ label: 'Dark mode' })
  ),
})
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Show popover |
| `title` | `string` | Popover title |
| `content` | `VNode` | Popover content |
| `position` | `Position` | Placement |
| `onClose` | `() => void` | Close handler |

## InfoBox

Styled information box for help text:

```typescript
InfoBox({
  title: 'Tip',
  content: 'Press Tab to navigate between fields',
  variant: 'info',
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
      HelpTooltip({ content: help })
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
      color: 'danger',
      size: 'sm',
    })
  )
}
```

### Status Tags

```typescript
function StatusBadge({ status }) {
  const colors = {
    active: 'success',
    pending: 'warning',
    error: 'danger',
    inactive: 'neutral',
  }

  return Badge({
    label: status.toUpperCase(),
    color: colors[status],
    variant: 'subtle',
  })
}
```

## Related

- [Modal](/components/organisms/modal.md) - Modal dialogs
- [Overlays](/components/overlays.md) - Overlay components
- [Typography](/components/typography.md) - Text styling
