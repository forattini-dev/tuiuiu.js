# Renderer

The Renderer is the heart of Tuiuiu, responsible for converting your Virtual DOM tree into ANSI escape sequences that can be displayed in the terminal.

## Rendering Modes

Tuiuiu supports two rendering modes:

| Mode | Default | Description |
|------|---------|-------------|
| **Delta Renderer** | ✅ Yes | Cell-level diffing with double buffering. Only changed cells are updated. |
| **String Renderer** | No | Full string-based rendering with line diffing via log-update. |

### Delta Renderer (Default)

The delta renderer is enabled by default and provides optimal performance:

```typescript
import { render } from 'tuiuiu.js';

// Delta renderer is used by default
const { waitUntilExit } = render(App);

// To disable delta renderer (use string renderer instead):
const { waitUntilExit } = render(App, { useDeltaRenderer: false });
```

**Features:**
- **Cell-level diffing**: Only changed cells are redrawn
- **Double buffering**: Prevents flickering
- **ANSI parsing**: Handles pre-colored text (e.g., from Canvas)
- **Background inheritance**: Boxes properly fill their background

### String Renderer

The legacy string-based renderer can be useful for:
- Static component support (`<Static>`)
- Debugging rendering issues
- Compatibility with older terminals

## How it Works

The rendering process happens in three main stages:

1.  **Virtual DOM Tree**: The application builds a tree of Virtual Nodes (VNodes).
2.  **Layout Calculation**: The renderer calculates the position (`x`, `y`) and size (`width`, `height`) of each node using the layout engine.
3.  **Painting**: The nodes are drawn onto a 2D character buffer, which is then serialized and written to `stdout`.

## The Cell Buffer (Delta Renderer)

The delta renderer uses a `CellBuffer` with double buffering:

```typescript
interface Cell {
  char: string;      // The character to display
  fg?: Color;        // Foreground color
  bg?: Color;        // Background color
  attrs: CellAttrs;  // bold, dim, italic, underline, etc.
}
```

**Key features:**
- **Double Buffering**: Front buffer (displayed) and back buffer (being drawn)
- **Dirty Tracking**: Only cells that changed are written to terminal
- **ANSI Optimization**: Minimizes escape sequences by tracking style state

## The Output Buffer (String Renderer)

The string renderer uses a simpler approach, constructing a full frame in memory:

- **ANSI Styling**: Applying colors and text modifiers.
- **Wide Characters**: Correctly handling emojis and CJK characters (which take up 2 cells).
- **Z-Index**: (Implicitly) by painting nodes in tree order (painters algorithm).

## Usage

In most cases, you don't interact with the renderer directly. You use the `render` function from the main package entry point.

```typescript
import { render } from 'tuiuiu.js';

render(App);
```

However, understanding the renderer helps when debugging layout issues or creating custom low-level components.

## Render Options

```typescript
interface RenderOptions {
  stdout?: NodeJS.WriteStream;    // Output stream (default: process.stdout)
  stdin?: NodeJS.ReadStream;      // Input stream (default: process.stdin)
  debug?: boolean;                // Debug mode - prints each render separately
  exitOnCtrlC?: boolean;          // Exit on Ctrl+C (default: true)
  maxFps?: number;                // Maximum FPS for throttling (default: 30)
  clearOnStart?: boolean;         // Clear screen on start (default: true)
  showCursor?: boolean;           // Show cursor (default: false)
  autoTabNavigation?: boolean;    // Tab/Shift+Tab navigation (default: true)
  fullHeight?: boolean;           // Fill entire terminal (default: false)
  useDeltaRenderer?: boolean;     // Use delta renderer (default: true)
}
```

## Performance

The renderer is optimized for terminal performance:

- **Cell-level Diffing**: Delta renderer only updates changed cells
- **Text Measurement Caching**: It caches the width of strings to avoid repeated calculations
- **Batched Updates**: Multiple signal changes result in a single re-render frame
- **FPS Throttling**: Renders are throttled to 30 FPS by default

## Key APIs

### `render(node, options)`

Renders an interactive application with input handling.

```typescript
import { render } from 'tuiuiu.js';

const { waitUntilExit, rerender, unmount, clear } = render(App);
await waitUntilExit();
```

### `renderToString(node, width, height)`

Renders a VNode tree to a string directly. Useful for testing or generating static output.

```typescript
import { renderToString } from 'tuiuiu.js';

const output = renderToString(Text({}, 'Hello'), 80, 24);
console.log(output);
```

### `createDeltaRenderer(options)`

Creates a standalone delta renderer for advanced use cases.

```typescript
import { createDeltaRenderer } from 'tuiuiu.js/core';

const deltaRenderer = createDeltaRenderer({
  stdout: process.stdout,
  showCursor: false,
  useDelta: true,
});

deltaRenderer.render(myVNode);
deltaRenderer.cleanup();
```
