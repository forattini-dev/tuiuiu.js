# ADR 0003: Component controller lifecycle

- Status: accepted
- Date: 2026-07-30

## Context

Stateful components had several ad hoc combinations of `isRenderingHooks`,
`useConst`, direct factory calls, and option refreshes. This could recreate
signals on every frame or leak component lifecycle knowledge into UI layers.

## Decision

Stateful components use `useFactoryState(externalState, options, factory)`.
The helper preserves factory identity during component renders, refreshes
options where supported, and creates standalone state outside the render
lifecycle.

## Consequences

UI layers do not import hook context internals. New stateful components must
provide an external-state path and use the canonical helper.

