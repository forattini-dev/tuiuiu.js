# ADR 0009: Overlay and prompt hosts own complete sessions

- Status: accepted
- Date: 2026-08-21

## Context

Overlay stacks, modal state, focus traps, input scopes, and imperative prompts
owned overlapping terminal lifecycle fragments. Prompts could create raw-mode
and input listeners that competed with the mounted application.

## Decision

`OverlayHost` is the only overlay lifecycle authority. Each `OverlaySession`
owns focus capture, its exclusive interaction mode, backdrop policy, timer, and
exactly-once close result. The app mounts one visual `OverlayHost` adapter.

`PromptHost` runs renderer-independent prompt sessions. In an application the
VNode adapter opens an overlay through the app's host; outside an application
the ANSI adapter owns the terminal session. `openModal()` adapts Modal
presentation to an overlay session.

## Consequences

Out-of-order close cannot release another session's resources. A prompt inside
an app never creates a competing terminal owner. Modal state, overlay stacks,
and prompt-specific render loops are not parallel lifecycle authorities and are
not exposed as compatibility APIs.
