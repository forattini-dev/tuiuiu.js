# Engine Runtime Contract Coverage

This page defines the validation contract for the engine runtime work around `FrameSnapshot`, semantic draw commands, explicit-ID queries, and inspector snapshots.

## Primary Runner

Use the consolidated runner when you touch frame assembly, low-level rendering, query behavior, or inspector data:

```bash
pnpm validate:runtime-contracts
```

It runs:

- `pnpm test:runtime-contracts`
- `pnpm typecheck`
- `pnpm build`
- `pnpm verify:contracts`

## What This Guarantees

The runtime contract runner is intended to prove:

- convenience renderers still flow through committed frame assembly
- committed frame metadata and draw-command output stay stable enough for runtime consumers
- draw-command order stays deterministic for semantic backends
- clipping-compatible constraints remain available to render backends
- explicit-ID queries return correct `found` / `missing` / `ambiguous` states
- programmatic scroll-by-ID clamps and applies through next-frame semantics
- inspector snapshots read committed frame data instead of ANSI output or bespoke debug-only state
- ANSI and delta renderers record phase metrics on the same frame artifact

## Coverage Matrix

### Canonical Frame Model

Covered by:

- [frame.test.ts](../../tests/core/frame.test.ts)
- [frame-commands.test.ts](../../tests/core/frame-commands.test.ts)
- [render-loop.test.ts](../../tests/app/render-loop.test.ts)

Guarantees:

- `FrameSnapshot` is created with frame identity and viewport metadata
- committed frame state does not depend on the global hit-test registry
- `render()` and `renderToString()` keep using the same frame model
- semantic draw-command order remains deterministic for representative layouts
- renderer backends receive clipping-compatible text constraints

### Query API

Covered by:

- [frame-queries.test.ts](../../tests/core/frame-queries.test.ts)
- [scroll.test.ts](../../tests/primitives/scroll.test.ts)
- [scroll-area.test.ts](../../tests/organisms/scroll-area.test.ts)
- [tabs-mouse.test.ts](../../tests/layout/tabs-mouse.test.ts)
- [scroll-area-mouse.test.ts](../../tests/layout/scroll-area-mouse.test.ts)

Guarantees:

- element bounds are root-relative
- `pointerOver()` agrees with committed geometry
- duplicate explicit IDs degrade to `ambiguous`
- missing IDs fail safely
- scroll container lookups expose imperative controls without mutating committed snapshots in place

### Renderers and Semantic Output

Covered by:

- [renderer.test.ts](../../tests/core/renderer.test.ts)
- [delta-render.test.ts](../../tests/core/delta-render.test.ts)

Guarantees:

- canonical frame rendering remains ANSI-compatible for representative layouts
- delta rendering consumes the same committed frame data
- phase metrics can be attached to ANSI and delta render paths on the same frame

### Inspector and Debug Snapshot

Covered by:

- [debugger.test.ts](../../tests/dev-tools/debugger.test.ts)
- [inspector-snapshot.test.ts](../../tests/dev-tools/inspector-snapshot.test.ts)

Guarantees:

- inspector layout/tree projection comes from committed frame data
- warnings and metrics are readable without ANSI parsing
- debug panel aggregation can consume the committed frame directly

## Contract Boundaries

These checks validate the runtime contract defined by:

- `define-engine-runtime-contracts`

They do **not** mean:

- a full HTML renderer is already promised
- HTML/CSS parity exists today
- every internal engine helper is stable public API

## When To Run It

Run `pnpm validate:runtime-contracts` whenever you change:

- frame assembly or committed-frame behavior
- render-loop lifecycle ordering
- `DrawCommand[]` generation
- explicit-ID query semantics
- programmatic scroll control by ID
- inspector snapshots, warnings, or frame metrics
