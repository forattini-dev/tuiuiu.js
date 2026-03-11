# SplitView

Master-detail layout with built-in selection state and keyboard navigation.

## Import

```typescript
import { SplitView, createSplitView, ListItem, DataRow } from 'tuiuiu.js'
```

## Basic Usage

```typescript
const requests = [
  { id: 'req_1', path: '/health', status: 200 },
  { id: 'req_2', path: '/orders', status: 503 },
]

const view = createSplitView({
  items: requests,
  initialIndex: 0,
})

SplitView({
  state: view,
  renderItem: (item, _index, selected) =>
    ListItem({
      primary: item.path,
      trailing: item.status,
      selected,
    }),
  renderDetail: (item) =>
    item
      ? DataRow({ label: 'Request ID', value: item.id })
      : Text({}, 'Select a request'),
})
```

## Uncontrolled Mode

```typescript
SplitView({
  items: requests,
  ratio: 0.4,
  renderItem: (item, _index, selected) =>
    ListItem({
      primary: item.path,
      secondary: 'status ' + item.status,
      selected,
    }),
  renderDetail: (item) =>
    item ? Text({}, item.path) : Text({}, 'Nothing selected'),
})
```

## Keyboard Navigation

When `keysEnabled` is enabled on `createSplitView()` or `SplitView`, the list pane responds to:

- `Up` / `k`: previous item
- `Down` / `j`: next item
- `Escape`: clear selection

## Layout Options

```typescript
SplitView({ ...props, direction: 'horizontal', ratio: 0.33 })
SplitView({ ...props, direction: 'vertical', ratio: 0.55 })
SplitView({ ...props, listWidth: 28 }) // Fixed list width
```

## createSplitView API

```typescript
interface CreateSplitViewOptions<T> {
  items: MaybeReactive<T[]>
  initialIndex?: number
  keysEnabled?: boolean
  isActive?: MaybeReactive<boolean>
  onSelect?: (item: T | null, index: number | null) => void
}

interface SplitViewState<T> {
  items: () => T[]
  selectedIndex: () => number | null
  selectedItem: () => T | null
  isSelected: (index: number) => boolean
  select: (index: number | null) => void
  selectNext: () => void
  selectPrevious: () => void
  clearSelection: () => void
}
```

## Related Components

- [ListItem](../atoms/list-item.md) - Common renderer for list pane rows
- [DataRow](../atoms/data-row.md) - Common renderer for detail pane metadata
- [Tree](./tree.md) - Hierarchical master-detail alternative
