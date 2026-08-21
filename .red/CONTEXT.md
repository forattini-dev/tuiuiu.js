# Tuiuiu architecture context

## Purpose

Tuiuiu is a TypeScript library for building terminal interfaces with function
components, keyed VNodes, signals, and a deterministic render pipeline. It does
not use JSX or browser CSS.

## Ownership model

Every stateful function component must run through `component()`. A
`ComponentOwner` stores its hook state and keyed child owners. Rendering a
parent starts a child reconciliation pass; unvisited owners are disposed after
the pass and failed renders roll back newly-created owners. Keys identify
siblings and must be stable when their order can change.

An `AppHandle` owns exactly one application runtime: rendering, focus,
interaction, overlays, prompts, contributions, terminal screen mode, and
disposal. Runtime-scoped services must never fall back to another mounted app.
Standalone utilities may use the explicit default runtime scope only when no
app is involved.

## Architectural boundaries

The visual hierarchy is directional:

```text
primitives -> atoms -> molecules -> organisms -> templates
```

A visual layer may depend on itself or a lower layer. Shared non-visual
algorithms belong in `utils` or `interaction`; application lifecycle belongs in
`app`; terminal rendering mechanics belong in `core`.

## Canonical modules

- component ownership: `src/app/component.ts` and `src/hooks/context.ts`
- application lifecycle: `src/app/render-loop.ts`
- typed extension slots: `src/app/contributions.ts`
- frame activation and commit: `src/core/frame-lifecycle.ts`
- interaction routing: `src/interaction/runtime.ts`
- identity-based collections: `src/interaction/collection.ts`
- normalized collection bindings: `src/interaction/collection-bindings.ts`
- text completion: `src/interaction/completion.ts`
- scalar text editing: `src/interaction/text-editor.ts`
- overlay and prompt ownership: `src/interaction/overlay.ts` and
  `src/interaction/prompt.ts`
- background execution: `src/utils/background-executor.ts`
- physical cursor ownership: `TextInput`/`CursorAnchor` metadata resolved by
  `src/core/frame.ts` and presented by both render backends

## Domain language

- **Component Owner** owns one component instance's hooks, cleanups, and keyed
  descendants.
- **Interaction Runtime** resolves normalized terminal events into semantic
  commands, modes, targets, and low-level normalized handlers.
- **Interaction Mode** is a token-owned input context such as `modal`,
  `autocomplete`, or `prompt`.
- **Collection Controller** owns cursor, selection, filtering, modality, and
  viewport reconciliation by stable item identity.
- **Overlay Session** owns an opened overlay's mode, focus capture, backdrop,
  timer, and exactly-once close result.
- **Prompt Session** is renderer-independent prompt state; VNode and ANSI hosts
  are presentation adapters.
- **Contribution Host** owns typed, ordered, disposable contributions to named
  application slots.

## Public API policy

Version 2 has these package entrypoints only:

```text
tuiuiu.js
tuiuiu.js/app
tuiuiu.js/colors
tuiuiu.js/core
tuiuiu.js/devtools
tuiuiu.js/interaction
tuiuiu.js/mcp
tuiuiu.js/storybook
tuiuiu.js/testing
tuiuiu.js/ui
```

The root is a small everyday surface. `app` owns lifecycle and hooks, `ui` owns
the full visual catalog, `interaction` owns renderer-independent interaction,
and `core` owns low-level terminal/rendering mechanics. There are no v1 aliases,
compatibility entrypoints, or experimental catch-all entrypoints.

MCP documentation must be a subset of the compiled public TypeScript contract.
Entrypoint names, exact export sets, and runtime reachability are enforced by
`pnpm verify:contracts`, `pnpm check:package-budget`, and
`pnpm check:cycles`.

## Composition policy

- Free-form layouts use `Component(props, ...children)`.
- Free-form layouts never accept a second `props.children` composition path.
- Structured components use named slots.
- Stateful components use `component()` and stable keys.
- Collections use data props and stable item keys.
- Deferred collections use render callbacks.
- App extensions use typed contributions instead of reaching into host state.

## Verification

```text
pnpm typecheck
pnpm typecheck:tests
pnpm typecheck:examples
pnpm lint
pnpm test:run
pnpm build
pnpm check:cycles
pnpm verify:contracts
pnpm check:package-budget
pnpm test:performance
```
