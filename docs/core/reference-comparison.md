# Reference comparison: Ink, Codex, OpenCode, and OpenTUI

This document records architectural lessons, not compatibility promises. The
projects solve related terminal problems with different UI models:

- [Ink](https://github.com/vadimdemedes/ink) renders React component trees.
- [Codex](https://github.com/openai/codex) builds its interactive UI in Rust on
  top of Ratatui.
- [OpenCode](https://github.com/anomalyco/opencode) uses
  [OpenTUI](https://github.com/sst/opentui), whose core owns terminal parsing,
  cells, and rendering.
- Tuiuiu keeps a zero-runtime-dependency, signal-based TypeScript API.

The goal is to borrow invariants and small mechanisms while preserving
Tuiuiu's simpler public model.

## What was adopted

| Area | Useful reference behavior | Tuiuiu decision |
| --- | --- | --- |
| Terminal lifecycle | Ink reference-counts terminal modes; Codex restores terminal state through a centralized guard | Cleanup is idempotent, terminal modes and listeners are released on every exit path, and library code does not terminate the host process by default |
| Input | OpenTUI parses bytes incrementally and does not depend on stream chunk boundaries | UTF-8 decoding and CSI, OSC, mouse, focus, and bracketed-paste parsing retain incomplete input across chunks and cap buffered paste data |
| Text editing | Modern terminal editors move through grapheme clusters rather than UTF-16 code units | Cursor motion, selection, deletion, width, masking, and wrapping preserve combining marks, emoji modifiers, and ZWJ sequences |
| Rendering security | Mature renderers distinguish styling from arbitrary control protocols | Ordinary text may preserve validated SGR styles but cannot emit cursor movement, OSC, DCS, erase commands, or other terminal controls |
| Process ownership | Embeddable libraries let the application decide whether Ctrl-C exits | `exitOnCtrlC` is honored and `process.exit()` is opt-in |
| Network tools | Network transports need explicit trust boundaries | MCP defaults to loopback, requires auth for remote binds, denies browser origins by default, bounds requests and concurrency, and isolates SSE sessions |

## Where Tuiuiu is intentionally different

Tuiuiu does not need React reconciliation to offer components, and it should
not copy Ink's React-specific abstraction cost. Signals and explicit VNodes
remain a useful small core.

Codex can rely on Rust ownership and RAII. TypeScript cannot reproduce those
guarantees directly, so Tuiuiu uses idempotent disposers and explicit resource
registration.

OpenTUI provides a lower-level native-style rendering engine. Moving all of
Tuiuiu to that model would trade away the zero-dependency core. The better
near-term path is to isolate the parser, terminal session, cell buffer, and
diff algorithm behind internal interfaces so implementations can evolve
without changing component APIs.

## Architecture progress and follow-up

### 1. `TerminalSession`

Implemented: raw mode, paused-input restoration, focus reporting and bracketed
paste now have one idempotent, reference-counted owner. `RuntimeScope` also
isolates hook, input, focus, mouse, hit-test, dirty, committed-frame,
capability, theme, motion, tick, overlay, graphics and performance state.
Capability caches and resize listeners follow the output stream that owns the
session.

The convenience event bus, error boundary, focus zones, command and keybinding
registries, router, screen stack, transition manager and legacy delta-renderer
singleton are runtime-owned as well. Declarative command, keybinding, router
and screen defaults created before `render()` are cloned into each app; later
mutations, listeners, history and recent-command state remain local.

Multiple roots are supported when each owns a distinct stdin/stdout pair.
Sharing either terminal stream concurrently is rejected because raw mode,
input consumption and cursor placement cannot have two independent owners.

### 2. Byte-oriented input parser

Implemented: `TerminalInputStream` now owns UTF-8 decoding, partial CSI/SS3/
OSC/DCS retention, bracketed-paste framing, and bounded paste/escape buffers.
`use-app` only schedules the configured deadlines and dispatches the resulting
events. Byte-boundary, randomized chunk-equivalence, malformed input, overflow,
abort, Kitty, mouse, focus, and mixed-protocol fixtures cover the boundary.

Remaining: share more protocol fixtures with the readline-based prompt package
where their input models overlap, and validate real PTYs in the OS/terminal CI
matrix.

### 3. Real virtualized data components

`VirtualDataTable` now performs true windowed rendering, keeps cursor and
selection indices global, exposes an external scroll controller and samples
overscan rows without rendering them. It remains experimental while large-data
performance contracts mature.

`EditableDataTable` now provides editable-cell focus, grapheme-safe text
editing, typed number/select values, validation, and explicit commit/cancel
semantics. It remains controlled and experimental while larger keyboard and
accessibility contracts mature.

### 4. Cell-buffer renderer boundary

Implemented: full and delta rendering now rasterize through one structured
`CellBuffer`. It owns grapheme clusters, wide-glyph footprints, structured
colors and attributes. Partial SGR resets and colon-form styled underlines are
interpreted once for both output modes.

Hyperlink identity and alternate diff strategies remain useful extensions.

### 5. Capability negotiation

Implemented: capability detection, progressive overrides, render mode,
graphics negotiation and resize invalidation are cached per runtime.
Pre-render configuration becomes an inherited default, while later mutations
stay local to the owning app. Unsupported protocols degrade predictably to
ANSI/Unicode or ASCII without each component keeping its own mutable cache.

Remaining validation belongs to the real-PTY matrix: ConPTY, iTerm2, xterm,
tmux and screen can disagree with environment hints and cannot be represented
faithfully by a deterministic unit-test stream.

### 6. Contract and fuzz testing

Generated deterministic tests now cover arbitrary input, unsafe Kitty values,
recursive event batches, every byte split in bracketed paste, Unicode editing,
wide-cell mutation and renderer sanitization. Storage/selector generators and
real PTY matrices remain useful additions. Cross-platform CI and benchmarks
stay separate from deterministic functional tests.
