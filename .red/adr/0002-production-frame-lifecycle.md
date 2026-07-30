# ADR 0002: One production frame lifecycle

- Status: accepted
- Date: 2026-07-30

## Context

The app render loop, renderer, and delta renderer duplicated production frame
options and separately finalized signals, activated snapshots, and recorded
signal dependencies.

## Decision

`src/core/frame-lifecycle.ts` owns production frame options, snapshot
activation, and frame commit. Renderers provide presentation adapters but do
not reproduce lifecycle sequencing.

## Consequences

New render paths must call the canonical lifecycle. Signal finalization and
dependency recording cannot be reordered independently in individual
renderers.

