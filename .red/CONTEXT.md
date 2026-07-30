# Tuiuiu architecture context

## Purpose

Tuiuiu is a TypeScript library for building terminal interfaces with plain
function calls, VNodes, signals, and a deterministic render pipeline. It does
not use JSX and does not apply CSS to components.

## Architectural boundaries

The component hierarchy is directional:

```text
primitives -> atoms -> molecules -> organisms -> templates
```

A layer may depend on itself or a lower layer. Lower layers must not import
higher layers. Shared algorithms that do not render VNodes belong in `utils`.
Render-loop coordination belongs in `core` or `app`.

UI components must not inspect hook internals directly. Stateful component
factories use `useFactoryState`, which owns the distinction between standalone
calls and component render lifecycles.

## Canonical paths

- Child normalization: `normalizeChildren` in `src/primitives/nodes.ts`.
- Stateful component controllers: `useFactoryState` in
  `src/hooks/factory-state.ts`.
- Production frame activation and commit:
  `src/core/frame-lifecycle.ts`.
- Background execution: `BackgroundExecutor`; `TaskBridge` is a deprecated
  compatibility name.
- Low-level sparkline text: `src/utils/sparkline.ts`.

## Public API policy

- `tuiuiu.js` remains the compatibility aggregation for the 1.x line.
- New APIs should use the smallest owned subpath.
- Experimental APIs belong in `tuiuiu.js/experimental`.
- MCP prop documentation must be a subset of the compiled public TypeScript
  contract. `pnpm verify:contracts` enforces this.
- Public entrypoint names and runtime reachability are checked against
  committed baselines.

## Composition policy

- Free-form layout components use `Component(props, ...children)`.
- Variadic children take precedence over a declared `props.children` fallback.
- Structured components use their actual named slots (`Page.children`,
  `Modal.content`, and so on).
- Collection components use data props.
- Deferred collections use render callbacks.

## Verification

Before release:

```text
pnpm typecheck
pnpm typecheck:tests
pnpm lint
pnpm test:run
pnpm build
pnpm check:cycles
pnpm verify:contracts
```

The import-cycle check also enforces component-layer direction, UI lifecycle
boundaries, and runtime source reachability.

