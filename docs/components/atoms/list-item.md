# ListItem

Reusable list row with icon, primary/secondary text, trailing content, and selection styling.

## Import

```typescript
import { ListItem } from 'tuiuiu.js'
```

## Basic Usage

```typescript
ListItem({
  icon: '📄',
  primary: 'README.md',
  secondary: '2.1 KB',
  trailing: 'today',
})
```

## Selected and Disabled States

```typescript
ListItem({
  primary: 'POST /api/orders',
  secondary: '145ms',
  selected: true,
})

ListItem({
  primary: 'Deploy Job',
  secondary: 'Paused by policy',
  disabled: true,
})
```

## Reactive Status

```typescript
const [job] = createSignal({
  name: 'sync-catalog',
  owner: 'worker-03',
  healthy: true,
})

ListItem({
  primary: () => job().name,
  secondary: () => job().owner,
  status: () => job().healthy ? 'success' : 'error',
})
```

## Indented Lists

```typescript
Box(
  { flexDirection: 'column', gap: 1 },
  ListItem({ primary: 'services/', icon: '📁' }),
  ListItem({ primary: 'api.ts', icon: '📄', indent: 1 }),
  ListItem({ primary: 'worker.ts', icon: '📄', indent: 1 }),
)
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `primary` | `MaybeReactive<string \| number \| VNode>` | - | Primary content |
| `secondary` | `MaybeReactive<string \| number \| VNode>` | - | Secondary content below primary |
| `icon` | `MaybeReactive<string \| number \| VNode>` | - | Leading icon or glyph |
| `trailing` | `MaybeReactive<string \| number \| VNode>` | - | Trailing content |
| `status` | `MaybeReactive<StatusType>` | - | Optional semantic indicator |
| `selected` | `MaybeReactive<boolean>` | `false` | Selected state styling |
| `disabled` | `MaybeReactive<boolean>` | `false` | Disabled styling |
| `indent` | `MaybeReactive<number>` | `0` | Indentation level |

## Related Components

- [SplitView](../molecules/split-view.md) - Common container for list-detail layouts
- [DataRow](./data-row.md) - For structured details panels
- [StatusIndicator](./status-indicator.md) - For standalone status displays
