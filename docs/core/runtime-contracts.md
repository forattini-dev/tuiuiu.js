# Engine Runtime Contracts

This page documents the engine-level contract that now sits underneath `render()`, `renderToString()`, imperative queries, and debug tooling.

Use it when you need:

- deterministic frame lifecycle behavior
- explicit-ID geometry or scroll queries
- debug data that does not depend on ANSI parsing
- a clear boundary between the engine and future alternate renderers

## Canonical Frame Lifecycle

Every committed frame follows the same high-level order:

1. Normalize runtime inputs: viewport, pointer, scroll delta, timing.
2. Evaluate the root VNode tree.
3. Calculate layout.
4. Derive hit targets and query indexes from committed layout.
5. Emit semantic `DrawCommand[]`.
6. Commit one `FrameSnapshot`.
7. Let ANSI rendering, delta rendering, queries, and inspector utilities consume that same snapshot.

High-level APIs still follow that contract:

- `render()` uses the committed frame in the interactive render loop.
- `renderToString()` builds a frame first, then lowers it to ANSI.

## Committed Frame Semantics

The committed frame is the authoritative runtime truth.

That means:

- queries read the last committed frame, never speculative in-progress layout work
- hit-testing and `pointerOver()` agree because they read the same geometry
- inspector data is projected from committed runtime artifacts, not a second hidden tree
- imperative scroll commands apply to state and become visible on the next committed frame

## Core Runtime Artifacts

### `FrameSnapshot`

`FrameSnapshot` is the engine artifact shared by rendering, queries, and debugging.

```typescript
import type { FrameSnapshot } from 'tuiuiu.js';
```

Key fields:

- `info.frameId`: monotonic frame identity within the runtime session
- `info.viewport`: committed width and height
- `layout`: committed layout tree
- `drawCommands`: semantic render commands
- `hitTargets`: committed interactive geometry
- `queries`: explicit-ID query helpers
- `warnings`: engine/runtime diagnostics
- `metrics`: frame timing and structural counts

### `DrawCommand[]`

The draw-command layer is semantic, not cell-buffer-level.

Today it is meant to preserve:

- visual ordering
- enough identity metadata for debug and retained-mode consumers
- backend-independent intent before ANSI lowering

Backends remain responsible for turning those commands into terminal cells or other output formats.

### Query API

Use the committed-frame query helpers when you need imperative geometry or scroll access.

```typescript
import { getCommittedFrameQueries } from 'tuiuiu.js';

const queries = getCommittedFrameQueries();
const button = queries?.getElement('save-button');
const log = queries?.getScrollContainer('log-scroll');
```

Query status is explicit:

- `found`
- `missing`
- `ambiguous`

Bounds are root-relative terminal coordinates.

## Programmatic Control by Explicit ID

```typescript
import { getCommittedFrameQueries } from 'tuiuiu.js';

const queries = getCommittedFrameQueries();
const result = queries?.getScrollContainer('log-scroll');

if (result?.status === 'found') {
  result.controls?.scrollToEnd();
}
```

Important boundaries:

- explicit IDs are the contract for imperative lookup
- duplicate IDs intentionally degrade queries to `ambiguous`
- scroll control clamps to legal offsets
- calling scroll controls does not mutate the committed snapshot in place

## Inspector Contract

Use inspector helpers when you need runtime diagnostics without parsing ANSI output.

```typescript
import { getInspectorSnapshot } from 'tuiuiu.js';

const inspector = getInspectorSnapshot();

if (inspector) {
  console.log(inspector.metrics.structural.drawCommandCount);
  console.log(inspector.warnings);
}
```

The inspector snapshot is derived from the committed frame and exposes:

- projected inspector tree
- runtime warnings
- phase metrics
- structural metrics

## Renderer Boundary

This contract is what future alternate renderers should target.

That means this change enables:

- alternate terminal backends
- richer debug tooling
- non-ANSI inspection paths

It does **not** promise in this change:

- HTML renderer delivery
- CSS/className parity
- browser-like layout semantics

The current contract is renderer-agnostic enough to support future work, without promising HTML/CSS equivalence now.

## Clay Lessons Applied

The useful lessons taken from Clay were:

- one explicit per-frame lifecycle
- one renderer-agnostic command layer
- one explicit-ID query layer
- one debug snapshot derived from runtime artifacts

What Tuiuiu intentionally did **not** copy:

- C-style memory management
- single-header packaging
- pixel-GUI-first assumptions
- immediate-mode as the public identity

## Public API Direction

Today the most useful runtime helpers are:

```typescript
import {
  createFrameSnapshot,
  getCommittedFrameSnapshot,
  getCommittedFrameQueries,
  getInspectorSnapshot,
  renderToString,
} from 'tuiuiu.js';
```

Use them for:

- low-level testing
- imperative integrations
- debug tooling
- renderer experiments that should stay above private internals

## Validation

If you touch this contract, run:

```bash
pnpm validate:runtime-contracts
```

Reference:

- [Engine Runtime Contract Coverage](/resources/engine-runtime-contracts.md)
- [Programmatic Control](/guides/programmatic-control.md)
