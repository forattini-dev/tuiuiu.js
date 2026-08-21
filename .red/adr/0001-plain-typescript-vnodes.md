# ADR 0001: Plain TypeScript VNodes

- Status: accepted
- Date: 2026-07-30

## Context

Examples and generated documentation had started describing JSX-like usage,
even though the runtime is based on function calls and VNodes.

## Decision

Tuiuiu does not expose JSX as an authoring model. Components are plain
TypeScript functions. Composition uses variadic children, named slots, data
collections, or render callbacks according to the public signature.

## Consequences

Documentation, MCP guidance, examples, and tests must not imply JSX support.
Composition normalization is implemented by `normalizeChildren`, not by a JSX
transform.
