# Layout Fundamentals

Tuiuiu uses a flexbox-inspired engine for terminal layouts. Familiar names
make the API approachable, but the values are typed component props measured
in terminal cells—not browser CSS.

## Box is everything

`Box` is the layout container. Every layout is built from nested Boxes.

```typescript
// Vertical stack (default)
Box({ flexDirection: 'column' },
  Text({}, 'Line 1'),
  Text({}, 'Line 2'),
)

// Horizontal row
Box({ flexDirection: 'row' },
  Text({}, 'Left'),
  Text({}, 'Right'),
)
```

## Key properties

| Property | Values | Default | What it does |
|----------|--------|---------|--------------|
| `flexDirection` | `'row'`, `'column'` | `'row'` | Main axis direction |
| `width` | number, `'fill'`, `'auto'` | `'auto'` | Width in columns |
| `height` | number, `'fill'`, `'auto'` | `'auto'` | Height in rows |
| `padding` | number | `0` | Space inside borders |
| `gap` | number | `0` | Space between children |
| `flexGrow` | number | `0` | How much to grow |
| `justifyContent` | `'flex-start'`, `'center'`, `'flex-end'`, `'space-between'` | `'flex-start'` | Align on main axis |
| `alignItems` | `'flex-start'`, `'center'`, `'flex-end'`, `'stretch'` | `'stretch'` | Align on cross axis |

## Common patterns

### Full-screen app

```typescript
Box({ flexDirection: 'column', width: 'fill', height: 'fill' },
  // Header: auto height, fills width
  Box({ backgroundColor: 'muted', paddingX: 1 },
    Text({ bold: true }, 'My App'),
  ),
  // Content: takes remaining space
  Box({ flexGrow: 1, padding: 1 },
    Text({}, 'Content here'),
  ),
  // Footer: auto height
  Box({ backgroundColor: 'muted', paddingX: 1 },
    Text({ dim: true }, 'Q: quit'),
  ),
)
```

Or use the layout helpers:

```typescript
Screen({},
  Header({}, Title('My App')),
  Main({}, Text({}, 'Content here')),
  Footer({}, Caption('Q: quit')),
)
```

### Sidebar layout

```typescript
Box({ flexDirection: 'row', width: 'fill', height: 'fill' },
  // Sidebar: fixed width
  Box({ width: 30, borderStyle: 'single', padding: 1 },
    Text({}, 'Menu'),
  ),
  // Content: fills remaining
  Box({ flexGrow: 1, padding: 1 },
    Text({}, 'Main content'),
  ),
)
```

### Centered content

```typescript
Box({
  width: 'fill',
  height: 'fill',
  justifyContent: 'center',
  alignItems: 'center',
},
  Panel({ title: 'Welcome', padding: 2 },
    Text({}, 'Hello, world!'),
  ),
)
```

### Spacing

```typescript
// Gap between children
Box({ flexDirection: 'column', gap: 1 },
  Text({}, 'Item 1'),
  Text({}, 'Item 2'),  // 1 empty line between
  Text({}, 'Item 3'),
)

// Push items apart
Box({ flexDirection: 'row', width: 'fill' },
  Text({}, 'Left'),
  Spacer(),             // Fills remaining space
  Text({}, 'Right'),
)
```

## Terminal vs browser

| Concept | Browser | Terminal |
|---------|---------|----------|
| Unit | pixel | character cell |
| Width | px, %, vw | columns (number) |
| Height | px, %, vh | rows (number) |
| Fill | `100%` | `'fill'` |
| Borders | CSS border | Box characters (╭╮╰╯) |
| Colors | hex, rgb | theme tokens (`'primary'`, `'error'`) |

## Tips

- Use `width: 'fill'` and `height: 'fill'` for full-screen apps
- Use `flexGrow: 1` on the main content area to fill remaining space
- Use `gap` instead of empty `Newline()` for spacing
- Use `Panel` for bordered sections with titles
- Borders take 1 character of space on each side
