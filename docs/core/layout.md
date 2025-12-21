# Layout System

Tuiuiu implements a simplified **Flexbox** layout engine optimized for terminals. It supports most common Flexbox properties, allowing you to build complex interfaces easily.

## The Box Model

Every visual element in Tuiuiu is a rectangular box. The layout engine calculates the size and position of these boxes based on the following:

- **Content**: The size of text or children.
- **Padding**: Space inside the border.
- **Border**: A 1-character wide border (optional).
- **Margin**: Space outside the border.

## Flex Container Properties

Apply these to a `Box` to control its children.

| Property | Values | Description |
| :--- | :--- | :--- |
| `flexDirection` | `row` (default), `column` | Direction of the main axis. |
| `justifyContent` | `flex-start`, `center`, `flex-end`, `space-between`, `space-around` | Alignment along the main axis. |
| `alignItems` | `flex-start`, `center`, `flex-end`, `stretch` | Alignment along the cross axis. |
| `gap` | `number` | Space between items. |
| `flexWrap` | `nowrap` (default), `wrap` | Whether items wrap to the next line. |

## Flex Item Properties

Apply these to children of a flex container.

| Property | Values | Description |
| :--- | :--- | :--- |
| `flexGrow` | `number` (e.g., `1`) | How much the item should grow to fill available space. |
| `flexShrink` | `number` | How much the item should shrink if space is tight. |
| `alignSelf` | `auto`, `flex-start`, `center`, `flex-end`, `stretch` | Overrides `alignItems` for this item. |

## Sizing

- **Fixed Size**: `width={20}`, `height={10}`
- **Percentage**: `width="50%"`
- **Auto**: If no size is set, the box sizes to its content.

## Example

```typescript
```typescript
Box({ flexDirection: 'column', width: '100%', height: '100%' },
  // Header
  Box({ height: 3, borderStyle: 'single', justifyContent: 'center', alignItems: 'center' },
    Text({}, 'My Application')
  ),

  // Main area with Sidebar and Content
  Box({ flexDirection: 'row', flexGrow: 1 },
    // Sidebar
    Box({ width: 20, borderStyle: 'single' },
      Text({}, 'Sidebar')
    ),
    
    // Content
    Box({ flexGrow: 1, borderStyle: 'single', justifyContent: 'center', alignItems: 'center' },
      Text({}, 'Main Content Area')
    )
  )
);
```
```

## Text Handling

Text nodes participate in the layout.
- `text-wrap`: Text wraps automatically by default.
- `truncate`: You can truncate text that overflows.

```typescript
Text({ wrap: 'truncate' }, 'This text will be cut off...')
```
