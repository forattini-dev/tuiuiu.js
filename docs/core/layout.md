# Layout System

Tuiuiu implements a simplified **Flexbox** layout engine optimized for terminals. It supports most common Flexbox properties, allowing you to build complex interfaces easily.

The layout system is built into the `Box` component, which serves as the fundamental building block for all UI elements.

## The Box Model

Every visual element in Tuiuiu is a rectangular box. The layout engine calculates the size and position of these boxes based on the CSS Box Model:

```
┌───────────────────────────────────────┐
│                Margin                 │
│  ┌─────────────────────────────────┐  │
│  │             Border              │  │
│  │  ┌───────────────────────────┐  │  │
│  │  │         Padding           │  │  │
│  │  │  ┌─────────────────────┐  │  │  │
│  │  │  │       Content       │  │  │  │
│  │  │  └─────────────────────┘  │  │  │
│  │  └───────────────────────────┘  │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

- **Content**: The size of text or children.
- **Padding**: Space inside the border, surrounding the content.
- **Border**: A 1-character wide border (optional).
- **Margin**: Space outside the border, separating the box from neighbors.

### Box Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `width`, `height` | `number` \| `string` | Fixed dimensions (e.g. `20`, `'50%'`). |
| `minWidth`, `minHeight` | `number` | Minimum dimensions. |
| `maxWidth`, `maxHeight` | `number` | Maximum dimensions. |
| `padding` | `number` | Padding on all sides. |
| `paddingX`, `paddingY` | `number` | Horizontal / Vertical padding. |
| `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight` | `number` | Individual side padding. |
| `margin` | `number` | Margin on all sides. |
| `marginX`, `marginY` | `number` | Horizontal / Vertical margin. |
| `marginTop`, `marginBottom`, `marginLeft`, `marginRight` | `number` | Individual side margin. |
| `borderStyle` | `string` | Style of the border (e.g., `'round'`, `'single'`). |
| `borderColor` | `string` | Color of the border. |

## Flexbox System

The `Box` component acts as a Flex Container. Its children are Flex Items.

### Flex Container Properties

Control how children are arranged.

| Property | Values | Description |
| :--- | :--- | :--- |
| `flexDirection` | `'row'` (default), `'column'`, `'row-reverse'`, `'column-reverse'` | Direction of the main axis. |
| `justifyContent` | `'flex-start'` (default), `'center'`, `'flex-end'`, `'space-between'`, `'space-around'` | Alignment along the main axis. |
| `alignItems` | `'flex-start'` (default), `'center'`, `'flex-end'`, `'stretch'` | Alignment along the cross axis. |
| `flexWrap` | `'nowrap'` (default), `'wrap'`, `'wrap-reverse'` | Whether items wrap to the next line. |
| `gap` | `number` | Space between items. |
| `rowGap`, `columnGap` | `number` | Specific gap for rows/columns. |

#### Direction & Alignment

**Row (default)**
```
flexDirection: 'row'
Main Axis: ──►
Cross Axis: ↓
```

**Column**
```
flexDirection: 'column'
Main Axis: ↓
Cross Axis: ──►
```

### Flex Item Properties

Control how an individual item behaves within the container.

| Property | Values | Description |
| :--- | :--- | :--- |
| `flexGrow` | `number` (default `0`) | Factor to grow to fill available space. |
| `flexShrink` | `number` (default `1`) | Factor to shrink if space is tight. |
| `flexBasis` | `number` \| `'auto'` | Initial size before growing/shrinking. |
| `alignSelf` | `'auto'`, `'flex-start'`, `'center'`, `'flex-end'`, `'stretch'` | Overrides `alignItems` for this specific item. |

## Positioning

Tuiuiu supports relative (default) and absolute positioning.

| Property | Values | Description |
| :--- | :--- | :--- |
| `position` | `'relative'` (default), `'absolute'` | Positioning method. |
| `top`, `bottom`, `left`, `right` | `number` | Offsets for absolute positioning. |
| `zIndex` | `number` | Stack order (higher is on top). |

**Absolute Positioning:**
An element with `position: 'absolute'` is removed from the normal flow and positioned relative to its closest positioned ancestor (or the screen).

## Common Patterns

### Centering Content

The classic "center everything" pattern.

```typescript
Box({
  width: '100%',
  height: '100%',
  justifyContent: 'center', // Horizontal center
  alignItems: 'center',     // Vertical center
},
  Text({}, 'I am centered!')
)
```

### Holy Grail Layout (Header, Sidebar, Content, Footer)

```typescript
Box({ flexDirection: 'column', width: '100%', height: '100%' },
  // Header (Fixed height)
  Box({ height: 3, borderStyle: 'single' },
    Text({}, 'Header')
  ),

  // Body (Grows to fill space)
  Box({ flexDirection: 'row', flexGrow: 1 },
    // Sidebar (Fixed width)
    Box({ width: 20, borderStyle: 'single' },
      Text({}, 'Sidebar')
    ),
    
    // Main Content (Grows)
    Box({ flexGrow: 1, borderStyle: 'single' },
      Text({}, 'Main Content')
    )
  ),

  // Footer (Fixed height)
  Box({ height: 3, borderStyle: 'single' },
    Text({}, 'Footer')
  )
)
```

### Grid Layout using Flexbox

You can create grid-like layouts using `flexWrap` and percentage widths.

```typescript
Box({ flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  // Item 1 (50%)
  Box({ width: '50%', borderStyle: 'single' }, Text({}, '1')),
  // Item 2 (50%)
  Box({ width: '50%', borderStyle: 'single' }, Text({}, '2')),
  // Item 3 (50%)
  Box({ width: '50%', borderStyle: 'single' }, Text({}, '3')),
  // Item 4 (50%)
  Box({ width: '50%', borderStyle: 'single' }, Text({}, '4'))
)
```

## Text Handling

Text nodes participate in the layout flow.

- **Wrapping**: Text wraps automatically by default based on the container width.
- **Overflow**:
  - `overflow: 'hidden'`: Hides text that spills out.
  - `textProps.wrap`: Control text wrapping behavior specifically.

```typescript
Text({ wrap: 'truncate' }, 'This long text will be cut off...')
```