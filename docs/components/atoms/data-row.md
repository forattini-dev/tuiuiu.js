# DataRow

Compact label-value row for details panels, request inspectors, and settings screens.

## Import

```typescript
import { DataRow } from 'tuiuiu.js'
```

## Basic Usage

```typescript
DataRow({ label: 'Host', value: 'api.example.com' })
DataRow({ label: 'Latency', value: '145ms', status: 'warning' })
```

## Reactive Usage

```typescript
const [request] = createSignal({
  id: 'req_01JY3Y6X4J',
  status: 'success' as const,
  duration: 145,
})

Box(
  { flexDirection: 'column', gap: 1 },
  DataRow({ label: 'Request', value: () => request().id, truncate: 18 }),
  DataRow({ label: 'Duration', value: () => request().duration + 'ms', status: () => request().status }),
)
```

## Fixed Label Width

```typescript
Box(
  { flexDirection: 'column', gap: 1 },
  DataRow({ label: 'Method', value: 'POST', labelWidth: 12 }),
  DataRow({ label: 'Status', value: '404 Not Found', labelWidth: 12, status: 'error' }),
  DataRow({ label: 'Duration', value: '512ms', labelWidth: 12, status: 'warning' }),
)
```

## Truncation

```typescript
DataRow({
  label: 'Trace ID',
  value: '01JY3Y6X4JPMAXM94T7V2Q8Z1P',
  truncate: 16,
})
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `MaybeReactive<string>` | - | Left-side label |
| `value` | `MaybeReactive<string \| number \| VNode>` | - | Right-side value |
| `labelWidth` | `MaybeReactive<number>` | - | Fixed width for the label column |
| `labelColor` | `MaybeReactive<ColorValue>` | `'muted'` | Label color |
| `valueColor` | `MaybeReactive<ColorValue>` | - | Value color |
| `status` | `MaybeReactive<StatusType>` | - | Optional semantic indicator |
| `truncate` | `MaybeReactive<number>` | - | Truncate string values after the given width |

## Related Components

- [ListItem](./list-item.md) - For list-oriented rows
- [HttpStatus](./http-status.md) - For HTTP-specific status rendering
- [StatusIndicator](./status-indicator.md) - For standalone status displays
