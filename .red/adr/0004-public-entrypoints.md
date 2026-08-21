# ADR 0004: Public entrypoint ownership

- Status: accepted
- Date: 2026-08-21

## Context

The v1 root and layer-specific subpaths exposed overlapping APIs, aliases, and
unfinished surfaces. Developers could not infer lifecycle or dependency
ownership from an import.

## Decision

Version 2 exposes only `.`, `app`, `colors`, `core`, `devtools`, `interaction`,
`mcp`, `storybook`, `testing`, `ui`, and `package.json`. The root is a capped
everyday surface. Each other subpath represents one architectural owner.

There are no compatibility, minimal, experimental, or visual-layer
entrypoints. New exports enter the smallest owning module and reach the root
only when they are common application vocabulary.

## Consequences

Imports communicate responsibility, obsolete concepts cannot survive through
aliases, and exact export baselines catch accidental surface growth.
