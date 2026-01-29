# Table

Data table with headers, borders, alignment, and styling.

## Import

```typescript
import { Table, SimpleTable, KeyValueTable } from 'tuiuiu.js'
```

## Basic Usage

```typescript
Table({
  columns: [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', align: 'right' },
    { key: 'city', header: 'City' },
  ],
  data: [
    { name: 'Alice', age: 30, city: 'NYC' },
    { name: 'Bob', age: 25, city: 'LA' },
  ],
})
```

Output:
```
┌───────┬─────┬──────┐
│ Name  │ Age │ City │
├───────┼─────┼──────┤
│ Alice │  30 │ NYC  │
│ Bob   │  25 │ LA   │
└───────┴─────┴──────┘
```

## TableColumn

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Data key |
| `header` | `string` | Header label |
| `width` | `number` | Fixed column width |
| `minWidth` | `number` | Minimum width |
| `maxWidth` | `number` | Maximum width |
| `flex` | `number \| boolean` | Flex grow factor (fills remaining space) |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment |
| `color` | `ColorValue` | Column color |
| `format` | `(value) => string` | Value formatter |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `TableColumn[]` | required | Column definitions |
| `data` | `Record<string, any>[]` | required | Row data |
| `borderStyle` | `TableBorderStyle` | `'single'` | Border style |
| `borderColor` | `ColorValue` | - | Border color |
| `headerColor` | `ColorValue` | - | Header text color |
| `headerBg` | `ColorValue` | - | Header background |
| `stripedRows` | `boolean` | `false` | Alternate row colors |
| `stripedColor` | `ColorValue` | - | Striped row color |
| `compact` | `boolean` | `false` | Reduce padding |
| `maxWidth` | `number` | - | Max table width |
| `availableWidth` | `number` | terminal width | Available width for flex columns |

## Flex Columns

Columns with `flex` expand to fill remaining space after fixed-width columns:

```typescript
Table({
  columns: [
    { key: 'id', header: 'ID', width: 6 },           // fixed: 6 chars
    { key: 'name', header: 'Name', flex: 1 },        // 1 part of remaining
    { key: 'desc', header: 'Description', flex: 2 }, // 2 parts of remaining
    { key: 'status', header: 'Status', width: 10 },  // fixed: 10 chars
  ],
  data: items,
})
```

If 30 chars remain after fixed columns:
- `name` gets 10 chars (1/3)
- `desc` gets 20 chars (2/3)

Use `flex: true` as shorthand for `flex: 1`.

## Border Styles

```typescript
// Available styles
'single'  // ┌─┬─┐  │  ├─┼─┤  └─┴─┘
'double'  // ╔═╦═╗  ║  ╠═╬═╣  ╚═╩═╝
'round'   // ╭─┬─╮  │  ├─┼─┤  ╰─┴─╯
'bold'    // ┏━┳━┓  ┃  ┣━╋━┫  ┗━┻━┛
'ascii'   // +-+-+  |  +-+-+  +-+-+
'none'    // No borders
```

## Column Formatting

```typescript
Table({
  columns: [
    { key: 'name', header: 'Name' },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      format: (v) => `$${v.toFixed(2)}`,
    },
    {
      key: 'stock',
      header: 'In Stock',
      format: (v) => v ? '✓' : '✗',
      color: (v) => v ? 'green' : 'red',
    },
  ],
  data: products,
})
```

## SimpleTable

Quick table from 2D array:

```typescript
SimpleTable({
  headers: ['Name', 'Age', 'City'],
  rows: [
    ['Alice', '30', 'NYC'],
    ['Bob', '25', 'LA'],
  ],
})
```

## KeyValueTable

Two-column key-value display:

```typescript
KeyValueTable({
  data: {
    'Name': 'John Doe',
    'Email': 'john@example.com',
    'Status': 'Active',
  },
  keyColor: 'cyan',
  valueColor: 'white',
})
```

Output:
```
┌──────────┬──────────────────┐
│ Name     │ John Doe         │
│ Email    │ john@example.com │
│ Status   │ Active           │
└──────────┴──────────────────┘
```

## Styling Examples

### Striped Rows

```typescript
Table({
  columns: [...],
  data: [...],
  stripedRows: true,
  stripedColor: 'neutral-800',
})
```

### Colored Headers

```typescript
Table({
  columns: [...],
  data: [...],
  headerColor: 'white',
  headerBg: 'primary',
  borderColor: 'primary',
})
```

### Compact Mode

```typescript
Table({
  columns: [...],
  data: [...],
  compact: true,
  borderStyle: 'none',
})
```

## Examples

### Product List

```typescript
Table({
  columns: [
    { key: 'name', header: 'Product', minWidth: 20 },
    { key: 'price', header: 'Price', align: 'right', format: (v) => `$${v}` },
    { key: 'qty', header: 'Qty', align: 'center' },
    { key: 'total', header: 'Total', align: 'right', format: (v) => `$${v}` },
  ],
  data: cart,
  borderStyle: 'round',
})
```

### Server Status

```typescript
Table({
  columns: [
    { key: 'server', header: 'Server' },
    { key: 'status', header: 'Status', format: (v) => v ? '🟢 Online' : '🔴 Offline' },
    { key: 'uptime', header: 'Uptime', align: 'right' },
    { key: 'load', header: 'Load', align: 'right', format: (v) => `${v}%` },
  ],
  data: servers,
  headerBg: 'neutral-800',
})
```

### Comparison Table

```typescript
SimpleTable({
  headers: ['Feature', 'Basic', 'Pro', 'Enterprise'],
  rows: [
    ['Users', '1', '10', 'Unlimited'],
    ['Storage', '1GB', '10GB', '100GB'],
    ['Support', 'Email', 'Priority', '24/7'],
  ],
  borderStyle: 'double',
})
```

## Related

- [DataTable](/components/organisms/data-table.md) - Interactive data table
- [Tree](/components/molecules/tree.md) - Hierarchical data
- [KeyValueTable](#keyvaluetable) - Simple key-value display
