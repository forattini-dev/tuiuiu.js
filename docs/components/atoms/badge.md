# Badge

Compact labels for statuses, counts, and categories.

## Import

```typescript
import { Badge } from 'tuiuiu.js'
```

## Usage

```typescript
Badge({ label: 'NEW', variant: 'primary' })
Badge({ label: 'Healthy', variant: 'success', style: 'subtle' })
Badge({ label: '3', variant: 'danger', style: 'outline' })
Badge({ label: 'Custom', color: '#ff6600' })
```

`variant` chooses the semantic theme color. `style` chooses how that color is
drawn. They are separate properties.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Text displayed by the badge |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | Semantic theme color |
| `style` | `'solid' \| 'outline' \| 'subtle'` | `'solid'` | Visual treatment |
| `color` | `ColorValue` | - | Explicit color override |

For a dot-only status, use
[`StatusIndicator`](/components/atoms/status-indicator.md). `Badge` always
requires a label.

## Related

- [StatusIndicator](/components/atoms/status-indicator.md)
- [Tooltip](/components/atoms/tooltip.md)
- [Theming](/core/theming.md)
