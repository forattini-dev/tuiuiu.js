# ADR 0005: BackgroundExecutor is canonical

- Status: accepted
- Date: 2026-08-21

## Context

Workers, inline execution, pools, bridges, and the thread bus used overlapping
executor shapes and lifecycle ownership.

## Decision

`BackgroundExecutor` is the only `submit`/`execute`/`destroy` contract. Inline
and worker-backed implementations and pools implement this interface directly.
The ThreadBus coordinates executors without wrapping them in another lifecycle
abstraction.

## Consequences

Factories return a BackgroundExecutor, ownership stays explicit, and worker
features extend one contract.
