# Quick start

## Create a project

```bash
npx tuiuiu.js@latest init my-tui-app
cd my-tui-app
pnpm install
```

The generator creates a TypeScript ESM application and refuses to overwrite a
non-empty directory.

## Build a counter

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
  useShortcut('r', () => setCount(0));
  useShortcut('escape', exit);

  return Box({ flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, 'Tuiuiu Counter'),
    Box({ borderStyle: 'round', padding: 1, marginTop: 1 },
      Text({ color: 'yellow', bold: true }, `Count: ${count()}`),
    ),
    Text({ dim: true }, '↑/k up · ↓/j down · r reset · Esc quit'),
  );
});

const app = render(() => Counter({ key: 'counter' }), {
  screen: 'inline',
});
await app.waitUntilExit();
```

Run it with `pnpm dev`.

## What owns what

- `component()` gives the function a stable hook and cleanup owner.
- `useState()` returns a getter and setter; reading the getter tracks the render.
- `useShortcut()` registers semantic actions in the app's InteractionRuntime.
- `render()` returns the `AppHandle` that owns this terminal session.
- `screen: 'inline'` preserves shell scrollback. Use `fullscreen` or `alternate`
  for full-screen applications.

Use stable component keys whenever sibling instances can reorder. Pure visual
helpers that do not call hooks do not need `component()`.

## Add a full UI component

The root contains common controls. The complete catalog lives in `tuiuiu.js/ui`:

```ts
import { AppShell, DataTable, Page, Tabs } from 'tuiuiu.js/ui';
```

See the [import map](/core/imports.md), [interaction runtime](/core/interaction-runtime.md),
and [migration guide](/migration/2.0.md).
