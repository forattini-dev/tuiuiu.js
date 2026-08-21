# Import map

Tuiuiu 2 exposes a small root and explicit ownership-oriented subpaths. These
are the complete package entrypoints; internal folders are not public imports.

| Import | Responsibility |
|---|---|
| `tuiuiu.js` | Everyday app primitives, signals, common controls, themes, and semantic interaction hooks |
| `tuiuiu.js/app` | App lifecycle, component ownership, hooks, typed contributions, and background executors |
| `tuiuiu.js/ui` | Full visual component, layout, theme, styling, and preset catalog |
| `tuiuiu.js/interaction` | Commands, normalized events, modes, targets, collections, completion, overlays, and prompts |
| `tuiuiu.js/core` | Low-level layout, renderer, frames, terminal capabilities, input parsing, and graphics |
| `tuiuiu.js/testing` | App probes, interaction drivers, render helpers, and snapshots for tests |
| `tuiuiu.js/devtools` | Runtime inspection and diagnostics |
| `tuiuiu.js/storybook` | TUI storybook runtime and authoring APIs |
| `tuiuiu.js/mcp` | MCP server and documentation tools |
| `tuiuiu.js/colors` | Standalone ANSI color functions |
| `tuiuiu.js/package.json` | Package metadata |

## Everyday application

```ts
import {
  Box,
  Text,
  component,
  render,
  useApp,
  useShortcut,
  useState,
} from 'tuiuiu.js';

const Counter = component('Counter', () => {
  const [count, setCount] = useState(0);
  const { exit } = useApp();

  useShortcut('up', () => setCount((value) => value + 1));
  useShortcut('q', exit);

  return Box({ flexDirection: 'column' },
    Text({}, `Count: ${count()}`),
    Text({ dim: true }, '↑ increments · q quits'),
  );
});

await render(() => Counter({ key: 'counter' }), { screen: 'inline' }).waitUntilExit();
```

`component()` supplies stable hook ownership. Pass a stable `key` whenever
siblings can reorder.

## Full UI catalog

```ts
import { AppShell, CommandPalette, DataTable, Modal, Page, Tabs } from 'tuiuiu.js/ui';
```

## Interaction infrastructure

```ts
import {
  createCollectionController,
  createInteractionRuntime,
  createInteractionTarget,
  getOverlayHost,
  prompt,
} from 'tuiuiu.js/interaction';
```

## Low-level rendering and terminal facilities

```ts
import {
  calculateLayout,
  createTerminalInputStream,
  getCapabilities,
  renderToString,
} from 'tuiuiu.js/core';
```

## Testing

```ts
import { createInteractionProbe, renderTestComponent } from 'tuiuiu.js/testing';
```

## Standalone colors

```ts
import { bold, green, red } from 'tuiuiu.js/colors';

console.log(green(bold('ready')));
console.error(red('failed'));
```

There is no `/minimal`, `/compat`, `/experimental`, or per-component-layer
entrypoint in v2. Import application concerns from their owning public module.
