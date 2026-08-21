# ADR 0010: Focused editors own the physical cursor anchor

- Status: accepted
- Date: 2026-08-21

## Context

Painting a virtual cursor is visually stable but does not tell the terminal
where an IME candidate window belongs. Deriving the position from source text
is also incorrect after wide glyphs, clipping, scrolling, or overlay layout.

## Decision

The active editor emits one zero-width `CursorAnchor`. Frame construction
resolves that metadata after final layout and drawing into an absolute cell
coordinate. Both presentation backends position the terminal cursor at the
resolved coordinate.

The hardware cursor stays hidden by default because built-in editors paint a
virtual cursor. `showHardwareCursor` opts into visibility without changing
anchor ownership. Input-triggered invalidations bypass background frame
throttling so the anchor follows editing immediately.

## Consequences

CJK IME candidate windows track the real insertion point across wide glyphs,
scroll containers, and overlays. Custom editors can emit `CursorAnchor` from
`tuiuiu.js/ui`; renderers do not inspect editor internals or sentinel text.
