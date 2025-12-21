# Primitive Components

These are the fundamental building blocks of the Tuiuiu design system. They provide the structural and logical foundation for all other components.

## Box

The core layout component. See [Layout System](../core/layout.md) for details.

```typescript
Box({ borderStyle: 'single', color: 'cyan' },
  Text({}, 'Content')
)
```

## Text

The core typography component. See [Typography](../components/typography.md) for details.

```typescript
Text({ color: 'green', bold: true }, 'Success')
```

## Spacer

A flexible space that expands to fill available room.

```typescript
HStack({}, 
  Text({}, 'Left'),
  Spacer(),
  Text({}, 'Right')
)
```

## Divider

A visual separator line with optional title.

### Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientation of the line. |
| `width` | `number \| string` | `'100%'` | Length of the divider. |
| `color` | `string` | `theme.border` | Color of the line. |
| `title` | `string` | `undefined` | Optional centered title. |
| `char` | `string` | `─` or `│` | Custom character. |

### Usage

```typescript
// Simple
Divider()

// With Title
Divider({ title: 'Section A', titleColor: 'cyan' })

// Vertical
Divider({ direction: 'vertical', width: 10 })
```

## Slot

A utility for reserving layout space. It prevents layout shifts when content appears or disappears.

### Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `visible` | `boolean` | Whether content is currently shown. |
| `height` | `number` | Height to reserve when hidden. |
| `minHeight` | `number` | Minimum height when visible. |

### Usage

```typescript
Slot({ visible: isLoading, height: 1 },
  Text({}, 'Loading...') 
)
```

## Logic Helpers

### `When`
Conditionally renders content. Cleaner than ternary operators for simple checks.

```typescript
When(isReady,
  Text({}, 'Ready!')
)
```

### `Each`
Renders a list of items.

```typescript
Each(items, (item, i) => 
  Text({ key: i }, item.name)
)
```

## Transform

Applies a text transformation function to its rendered children. Useful for gradients, masking, or custom text effects.

### Usage

```typescript
Transform({
  transform: (text, lineIndex) => text.toUpperCase()
},
  Text({}, 'hello world')
)
```

## Static

Renders items permanently at a fixed position (absolute positioning), typically used for log outputs or finished tasks that shouldn't be re-rendered.

### Usage

```typescript
Static({
  items: logs,
  children: (log, i) => Text({}, log)
})
```
