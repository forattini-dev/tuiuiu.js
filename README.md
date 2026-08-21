# tuiuiu.js

A zero-dependency TypeScript framework for fast, composable terminal user
interfaces. Tuiuiu combines keyed function components, fine-grained signals, a
deterministic cell renderer, semantic interaction, and runtime-owned overlays
and prompts.

## Install

```bash
pnpm add tuiuiu.js
```

Node.js 22.12 or newer is required.

## Quick start

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

  useShortcut(['up', 'k'], () => setCount((value) => value + 1));
  useShortcut(['down', 'j'], () => setCount((value) => value - 1));
  useShortcut('q', exit);

  return Box({ flexDirection: 'column', padding: 1 },
    Text({ bold: true, color: 'cyan' }, 'Tuiuiu'),
    Text({}, `Count: ${count()}`),
    Text({ dim: true }, '↑/k up · ↓/j down · q quit'),
  );
});

const app = render(() => Counter({ key: 'counter' }), { screen: 'inline' });
await app.waitUntilExit();
```

`component()` gives every stateful instance its own hook and cleanup owner.
Signals automatically schedule the latest tree; applications do not manually
rerender.

## Architecture

- `AppHandle` owns one render runtime, terminal screen, focus tree, command
  runtime, overlays, prompts, contributions, and cleanup.
- `InteractionRuntime` maps normalized key sequences to semantic commands with
  token-owned modes and targets.
- `CollectionController` preserves cursor and selection by stable identity.
- `OverlayHost` and `PromptHost` own complete sessions from open through
  exactly-once settlement.
- The cell renderer coalesces invalidations, caps presentation at 60 FPS by
  default, drops stale frames under backpressure, and supports fixed-step logic.

## Public modules

| Import | Purpose |
|---|---|
| `tuiuiu.js` | Compact everyday application surface |
| `tuiuiu.js/app` | Lifecycle, ownership, hooks, contributions, background work |
| `tuiuiu.js/ui` | Complete component, layout, styling, and theme catalog |
| `tuiuiu.js/interaction` | Commands, events, collections, completion, overlays, prompts |
| `tuiuiu.js/core` | Low-level renderer, frames, layout, input stream, graphics |
| `tuiuiu.js/testing` | Render helpers, snapshots, probes, interaction drivers |
| `tuiuiu.js/devtools` | Inspection and diagnostics |
| `tuiuiu.js/storybook` | Interactive component catalog tooling |
| `tuiuiu.js/mcp` | MCP documentation server |
| `tuiuiu.js/colors` | Standalone ANSI colors |

Version 2 has no v1 compatibility, minimal, experimental, or layer-specific
entrypoints. See the [import map](docs/core/imports.md) and
[migration guide](docs/migration/2.0.md).

## Development

```bash
pnpm typecheck
pnpm typecheck:tests
pnpm typecheck:examples
pnpm lint
pnpm test:run
pnpm build
pnpm verify:contracts
pnpm check:cycles
pnpm test:performance
```

Examples are available through `pnpm example:list`; launch the component
catalog with `pnpm storybook`.

MIT License.
