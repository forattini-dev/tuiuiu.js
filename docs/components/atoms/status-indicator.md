# StatusIndicator

Semantic status display with color-coded icons, optional pulse animation, and preset factories.

## Import

```typescript
import {
  StatusIndicator,
  // Presets
  successStatus,
  errorStatus,
  warningStatus,
  infoStatus,
  loadingStatus,
  pendingStatus,
  stoppedStatus,
} from 'tuiuiu.js'
```

## Basic Usage

```typescript
// Built-in status types
StatusIndicator({ status: 'success', label: 'Connected' })
StatusIndicator({ status: 'running', label: 'Processing...' })
StatusIndicator({ status: 'error', label: 'Failed' })
StatusIndicator({ status: 'warning', label: 'Low disk space' })
StatusIndicator({ status: 'info', label: 'Update available' })
StatusIndicator({ status: 'pending', label: 'Waiting...' })
StatusIndicator({ status: 'stopped', label: 'Service stopped' })
```

## Using Presets

Presets are factory functions that return pre-configured props:

```typescript
// These are equivalent:
StatusIndicator({ status: 'success', label: 'Connected' })
StatusIndicator(successStatus('Connected'))

// All presets:
StatusIndicator(successStatus('Done'))
StatusIndicator(errorStatus('Failed'))
StatusIndicator(warningStatus('Warning'))
StatusIndicator(infoStatus('Info'))
StatusIndicator(loadingStatus('Processing...'))  // Includes pulse: true
StatusIndicator(pendingStatus('Waiting'))
StatusIndicator(stoppedStatus('Stopped'))
```

## Pulse Animation

The `pulse` prop creates a blinking effect, perfect for active/running states:

```typescript
// Auto-enabled for 'running' status
StatusIndicator({ status: 'running', label: 'Syncing...' })

// Manual pulse on any status
StatusIndicator({ status: 'info', label: 'Recording', pulse: true })
```

## Custom Status

Create custom statuses with any color and icon:

```typescript
StatusIndicator({
  status: { color: 'magenta', icon: '◆' },
  label: 'Custom Status',
})

StatusIndicator({
  status: { color: '#FF6600', icon: '★' },
  label: 'Starred',
})
```

## Reactive Status

Status and label can be reactive (signals or getters):

```typescript
const [isConnected, setIsConnected] = createSignal(true)

StatusIndicator({
  status: () => isConnected() ? 'success' : 'error',
  label: () => isConnected() ? 'Online' : 'Offline',
})
```

## Size Variants

```typescript
StatusIndicator({ status: 'success', label: 'Small', size: 'sm' })
StatusIndicator({ status: 'success', label: 'Medium', size: 'md' })  // default
StatusIndicator({ status: 'success', label: 'Large', size: 'lg' })
```

## Dot Mode

Show a simple colored dot instead of status-specific icons:

```typescript
StatusIndicator({ status: 'success', showDot: true })
StatusIndicator({ status: 'error', label: 'Error', showDot: true })
```

## Status Colors Reference

| Status | Color | Icon |
|--------|-------|------|
| `success` | `success` (green) | ✓ |
| `warning` | `warning` (yellow) | ⚠ |
| `error` | `error` (red) | ✗ |
| `info` | `info` (blue) | ℹ |
| `pending` | `muted` (gray) | ◌ |
| `running` | `success` + pulse | ● |
| `stopped` | `muted` | ⏹ |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `BuiltInStatus \| CustomStatus` | - | Status type or custom `{ color, icon }` |
| `label` | `MaybeReactive<string>` | - | Optional label text |
| `showIcon` | `boolean` | `true` | Display status icon |
| `showDot` | `boolean` | `false` | Show dot instead of icon |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `pulse` | `boolean` | auto | Pulse animation |
| `gap` | `number` | `1` | Gap between icon and label |

## Real-World Example

```typescript
function ServiceStatus() {
  const [services] = createSignal([
    { name: 'API Gateway', status: 'running' },
    { name: 'Database', status: 'success' },
    { name: 'Cache', status: 'warning' },
    { name: 'Queue', status: 'stopped' },
  ])

  return Box(
    { flexDirection: 'column', gap: 1 },
    ...services().map(svc =>
      StatusIndicator({
        status: svc.status as BuiltInStatus,
        label: svc.name,
      })
    )
  )
}
```

## Related Components

- [Badge](./badge.md) - For labels and counts
- [InfoBox](./tooltip.md#infobox) - For status messages with descriptions
- [MetricDisplay](./metric-display.md) - For metrics with trends
