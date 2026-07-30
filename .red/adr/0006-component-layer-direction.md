# ADR 0006: Component layer direction

- Status: accepted
- Date: 2026-07-30

## Context

An atom depended on a molecule for sparkline rendering, and an organism
depended on templates for simple stacks. These inversions made isolated
subpath ownership unreliable.

## Decision

Dependencies flow from templates toward organisms, molecules, atoms, and
primitives. Lower layers cannot import higher layers. Shared non-visual
algorithms move to `utils`; simple layout inside a component uses primitives.

## Consequences

`pnpm check:cycles` fails on upward layer imports. Components cannot bypass the
hierarchy merely for convenience.

