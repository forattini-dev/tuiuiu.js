# ADR 0005: BackgroundExecutor is canonical

- Status: accepted
- Date: 2026-07-30

## Context

Workers, inline execution, pools, bridges, and the thread bus used overlapping
executor shapes. Wrapping an executor in a task bridge could create needless
identity and lifecycle ambiguity.

## Decision

`BackgroundExecutor` is the canonical `submit`/`execute`/`destroy` contract.
`TaskBridge` remains a deprecated source-compatible interface. Factory
adapters return an existing compatible executor by identity.

## Consequences

Thread-bus and pool documentation use `BackgroundExecutor`. New worker
features target the executor contract rather than adding another abstraction.

