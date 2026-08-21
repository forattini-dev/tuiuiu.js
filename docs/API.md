# API overview

The compiled declarations are the exhaustive API contract. This page explains
the stable module boundaries used to find them.

## `tuiuiu.js`

The compact everyday surface contains:

- `render`, `renderOnce`, `component`, `AppSlot`, and `defineSlots`
- `Box`, `Text`, basic layout nodes, signals, and common hooks
- `useCommand`, `useCommandBinding`, `useInteractionMode`, `useInteraction`,
  and `useShortcut`
- commonly used controls and layouts
- runtime theme selection

```ts
const app = render(App, {
  screen: 'alternate',
  maxFps: 60,
  fixedStep: {
    updateFps: 60,
    onUpdate: ({ deltaTimeMs }) => updateSimulation(deltaTimeMs),
  },
});

await app.waitUntilExit();
```

`AppHandle` owns exit, unmount, terminal output, focus, commands, overlays,
prompts, contributions, and the runtime scope. Signal invalidation schedules
rendering automatically.

## `tuiuiu.js/app`

Application ownership and lifecycle:

- render lifecycle and `AppHandle`
- `component()` and keyed ComponentOwners
- state, effect, timing, terminal, focus, mouse, and semantic interaction hooks
- typed contribution slots
- BackgroundExecutor implementations and pools

## `tuiuiu.js/ui`

The complete visual catalog: primitives, atoms, molecules, organisms,
templates, data visualization, themes, styling, and presets.

Visual functions are presentation. Lifecycle-bearing UI such as a modal is
opened through its runtime host (`openModal()`), while ordinary components own
their local state through ComponentOwners.

## `tuiuiu.js/interaction`

Renderer-independent interaction:

- normalized events, commands, bindings, modes, targets, and inspection
- identity-based collection state and bindings
- text editor, completion, fuzzy search, and key-sequence parsing
- OverlayHost and PromptHost sessions
- standalone and in-app prompt functions

## `tuiuiu.js/core`

Low-level terminal and rendering mechanics: signals, layout calculation,
static rendering, frame snapshots, performance inspection, capabilities,
graphics, image loading, key parsing, and incremental input streams.

## Tooling modules

- `tuiuiu.js/testing`: isolated component rendering, app probes, interaction
  drivers, and snapshots
- `tuiuiu.js/devtools`: inspection and debugging
- `tuiuiu.js/storybook`: story authoring and interactive catalog runtime
- `tuiuiu.js/mcp`: MCP documentation server
- `tuiuiu.js/colors`: standalone ANSI styling

See the [import map](/core/imports.md) and generated `.d.ts` files for exact
names and types.
