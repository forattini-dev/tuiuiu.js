# ADR 0004: Public entrypoint ownership

- Status: accepted
- Date: 2026-07-30

## Context

The root package became a broad aggregation with ambiguous aliases and a large
compatibility burden.

## Decision

The root entrypoint is retained for 1.x compatibility. New APIs should be
exported from the smallest owned subpath. Unstable APIs use
`tuiuiu.js/experimental`; compact applications should prefer
`tuiuiu.js/minimal`.

## Consequences

Root export growth is exceptional and requires an explicit compatibility
reason. Public export baselines and semantic contract checks guard accidental
surface changes.

