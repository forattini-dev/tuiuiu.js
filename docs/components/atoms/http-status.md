# HttpStatus

HTTP status renderer with automatic semantic coloring and internal lookup text.

## Import

```typescript
import { HttpStatus, httpOk, httpNotFound, httpError } from 'tuiuiu.js'
```

## Basic Usage

```typescript
HttpStatus({ code: 200 })
HttpStatus({ code: 404 })
HttpStatus({ code: 503 })
```

## Showing Text

```typescript
HttpStatus({ code: 404, showText: true, variant: 'text' })
HttpStatus({ code: 503, showText: true, variant: 'badge' })
```

## Variant Styles

```typescript
HttpStatus({ code: 201, variant: 'badge' })   // Filled badge
HttpStatus({ code: 302, variant: 'text' })    // Inline text
HttpStatus({ code: 500, variant: 'dot' })     // Dot + label
```

## Presets

```typescript
Box(
  { flexDirection: 'row', gap: 1 },
  httpOk(),
  httpNotFound(),
  httpError(503, true),
)
```

## Color Mapping

- `1xx`: muted
- `2xx`: success
- `3xx`: info
- `4xx`: warning
- `5xx`: error

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `MaybeReactive<number>` | - | HTTP status code |
| `showText` | `boolean` | `false` | Show lookup text such as `Not Found` |
| `variant` | `'badge' \| 'text' \| 'dot'` | `'badge'` | Visual style |

## Related Components

- [DataRow](./data-row.md) - Good fit for detail panels and inspectors
- [Badge](./tooltip.md) - General-purpose labeled badges
- [StatusIndicator](./status-indicator.md) - For semantic non-HTTP statuses
