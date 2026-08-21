# Tuiuiu v2 architecture: RedCode and Pi

Date: 2026-08-21
Query: Learn from RedCode and Pi to deliver the most coherent and performant TUI experience, without v1 compatibility or dead code.
Scope: The local RedCode and Pi repositories, their official repository documentation, and the interaction/rendering architecture relevant to Tuiuiu v2. Product-specific coding-agent behavior is excluded unless it generalizes to a TUI host.

## Executive Summary

Tuiuiu already has the deepest rendering module of the three systems: stable VNodes, dirty propagation, cached layout/draw work, damage-aware cell deltas, backpressure, and latest-state-wins scheduling. The remaining v2 work is primarily ownership and interface coherence rather than a new renderer.

Pi contributes three especially useful ideas: input-triggered renders must bypass background throttling, the focused editor must own a physical cursor for IME, and screen-buffer ownership must be explicit. RedCode contributes a semantic keymap shared by commands, shortcut labels, palettes and completion, plus token-owned modes and typed extension contributions.

The main architectural blocker in Tuiuiu is its app-global positional hook array. Dynamic keyed children, overlays, prompts, slots and plugins cannot have reliable state or cleanup until hook state is owned by a nested keyed Component Owner. That module must be implemented before the generic contribution host.

## Official Sources

- [Pi TUI README](https://github.com/earendil-works/pi/blob/main/packages/tui/README.md) — official interface and rendering model of the Pi TUI package.
- [Pi TUI architecture plan](https://github.com/earendil-works/pi/blob/main/tui-plan.md) — official design rationale and architecture notes.
- [Pi repository](https://github.com/earendil-works/pi) — official source inspected locally at the pinned revision below.
- [OpenCode repository](https://github.com/anomalyco/opencode) — official source and issue history for command/input ownership behavior also represented by the local RedCode fork.

## Hotlinks

- [Pi overlays](https://github.com/earendil-works/pi/blob/main/packages/tui/README.md#overlays) — placement, focus and responsive visibility.
- [Pi package source](https://github.com/earendil-works/pi/tree/main/packages/tui) — renderer, input and component contracts.
- [Pi coding-agent source](https://github.com/earendil-works/pi/tree/main/packages/coding-agent) — real composition of transcript, editor, status and overlays.

## Key Findings

### Adopt from Pi

- Schedule input-triggered rendering immediately through a microtask while retaining an FPS cap for background invalidation.
- Treat `inline`, `fullscreen` and `alternate` as explicit terminal ownership modes.
- Give the focused Interaction Target ownership of the physical cursor and IME position.
- Support capturing and non-capturing overlays, responsive visibility, placement and explicit focus/unfocus.
- Reproduce Pi's deep tests for focus restoration, CJK/wide characters, split input and render churn.

### Adopt from RedCode

- Make semantic commands the single source for key bindings, shortcut display, palette discovery and slash completion.
- Scope modes, targets and registrations with exact token-owned leases so out-of-order disposal is safe.
- Preserve collection cursor and selection by stable identity, including filtered and asynchronous collections.
- Model extension regions as typed slots whose contributions return update/dispose handles.
- Give the focused form/editor target precedence over application-global commands.

### Retain and teach from Tuiuiu

- Stable VNodes and dirty propagation avoid whole-transcript reconstruction at the terminal output layer.
- Cached layout and draw commands plus damage rectangles minimize work and bytes written.
- Backpressure retains the newest desired frame instead of allowing an unbounded stale-frame queue.
- One normalized interaction runtime can prevent the input leakage and competing Escape ownership seen in systems with parallel handler stacks.

### Do not copy

- Raw `handleInput` methods distributed through every visual module.
- Positional list identity or implicit top-of-stack ownership.
- Monolithic editor/application modules that combine input, state, layout and terminal output.
- Renderer objects exposed to extensions.
- Polling, double animation frames or timers used to repair focus after the fact.
- Full transcript rerendering on every interactive frame.
- Source-compatibility shims in a new major version.

## API / CLI / Config Details

- Pi's small visual contract (`render`, optional input handling and invalidation) is useful internally, but Tuiuiu should keep semantic input out of visual modules.
- Pi distinguishes terminal-owned scrollback from app-owned alternate-screen layout. Tuiuiu will express the distinction with one `screen` option instead of legacy booleans and wrapper functions.
- RedCode's command registration, mode layers and contributions should be represented by one Interaction Runtime and one App Host rather than separate contexts.
- Tuiuiu's public hierarchy becomes `core -> interaction -> ui -> app`, with tooling entrypoints kept separate.

## Version Notes

- Local Pi revision: `5cd93f688aaab89dbb6dfa4aca535f21796ae185`; `@earendil-works/pi-tui` and `@earendil-works/pi-coding-agent` are version `0.84.2`.
- Local RedCode revision: `f3eb659a57c9efdfba1dde3e4f1e2ad0a72a1ed6`; its TUI package is version `1.18.18`.
- Tuiuiu worktree declares `2.0.0`; the last published repository baseline remains `1.0.75`, so the incompatible cut can be completed before a v2 publication.

## Gotchas

- A generic extension host is unsafe on top of the current global hook index: removing one contribution can shift another contribution's state and cleanup.
- `blocking` and `captureFocus` are different overlay policies. Treating them as one flag focuses non-interactive notifications.
- A whole-app runtime benchmark against RedCode/OpenTUI would compare different runtimes and packaging. Use it for contract comparison; benchmark Pi TUI and Ink in the same Node harness.
- Terminal protocol compatibility is not source compatibility. Xterm input variants, Sixel and capability fallbacks remain valid after v1 interfaces are removed.

## Open Questions

No product decisions remain open for this implementation. External issues or pull requests to Pi, RedCode or OpenCode require separate authorization.

## Source-by-Source Notes

The Pi TUI package keeps its component interface deliberately small and centralizes children, focus, overlays, input, lifecycle and rendering in its TUI host. Its input path requests an immediate render, while background invalidations remain throttled. Its overlay tests cover focus restoration and non-capturing cases more deeply than Tuiuiu's current suite.

The Pi coding-agent package demonstrates a practical transcript/editor/status/footer composition and an extension-facing set of prompts and widgets. The useful abstraction is the capability host; directly exposing TUI renderer types would couple extensions too tightly.

RedCode's keymap demonstrates the leverage of deriving execution, discovery and shortcut labels from the same registry. Its typed plugin contributions demonstrate safe token ownership, while its provider/context layering and focus-repair scheduling are patterns Tuiuiu should avoid.

## Recommended Next Steps

1. Implement keyed nested Component Owners and the explicit `component()` interface.
2. Complete the Interaction Target seam and delete legacy raw input routing.
3. Deepen overlays and prompts around complete renderer-independent sessions.
4. Add the generic typed contribution host only after owner cleanup is reliable.
5. Make urgent input rendering and physical cursor ownership part of the renderer contract.
6. Perform the full public-entrypoint and compatibility cut, then enforce it with API and dead-code checks.

## Implementation Outcome

All six steps are implemented in v2. Stateful visual exports use keyed
ComponentOwners; application input routes through one InteractionRuntime;
overlay, prompt, and typed contribution hosts have token-owned disposal;
interactive invalidations are urgent; frame snapshots carry final physical
cursor coordinates; and package, reachability, layer, lifecycle, clean-v2,
test, and performance contracts enforce the cut.

The v1 unified input/state parser and ownerless factory fallback were removed
after the first compatibility audit. Terminal protocol support remains in
focused modules: incremental input framing, the canonical mouse decoder,
Kitty key parsing, terminal session modes, and grapheme-safe TextEditor.
