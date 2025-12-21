# Renderer

The Renderer is the heart of Tuiuiu, responsible for converting your Virtual DOM tree into ANSI escape sequences that can be displayed in the terminal.

## How it Works

The rendering process happens in three main stages:

1.  **Virtual DOM Tree**: The application builds a tree of Virtual Nodes (VNodes).
2.  **Layout Calculation**: The renderer calculates the position (`x`, `y`) and size (`width`, `height`) of each node using the layout engine.
3.  **Painting**: The nodes are drawn onto a 2D character buffer, which is then serialized to a string and written to `stdout`.

## The Output Buffer

Tuiuiu uses a "double buffer" approach implicitly. It constructs a full frame in memory before outputting it. This prevents flickering and allows for complex layering.

The `OutputBuffer` handles:
- **ANSI Styling**: Applying colors and text modifiers.
- **Wide Characters**: Correctly handling emojis and CJK characters (which take up 2 cells).
- **Z-Index**: (Implicitly) by painting nodes in tree order (painters algorithm).

## Usage

In most cases, you don't interact with the renderer directly. You use the `render` function from the main package entry point.

```typescript
import { render } from 'tuiuiu';

render(<App />);
```

However, understanding the renderer helps when debugging layout issues or creating custom low-level components.

## Performance

The renderer is optimized for terminal performance:
- **Text Measurement Caching**: It caches the width of strings to avoid repeated calculations.
- **Diffing (Future)**: While currently it does a full re-render on signal updates, future versions will implement efficient diffing to only update changed parts of the screen.

## Key APIs

### `renderToString(node, width, height)`

Renders a VNode tree to a string directly. Useful for testing or generating static output.

```typescript
import { renderToString } from 'tuiuiu/core/renderer';

const output = renderToString(Text({}, 'Hello'), 80, 24);
console.log(output);
```
