# ADR 0003: Component controller lifecycle

- Status: accepted
- Date: 2026-07-30

## Context

Stateful components had several ad hoc combinations of `isRenderingHooks`,
`useConst`, direct factory calls, and option refreshes. This could recreate
signals on every frame or leak component lifecycle knowledge into UI layers.

## Decision

Stateful components run through `component()` and use
`useFactoryState(externalState, options, factory)`. The helper preserves factory
identity inside that ComponentOwner and refreshes options where supported.
Standalone consumers call the corresponding `createX()` controller factory;
components do not synthesize an ownerless fallback state.

## Consequences

UI layers do not import hook context internals. New stateful components must
have an explicit ComponentOwner, provide an external-state path where useful,
and use the canonical helper.
