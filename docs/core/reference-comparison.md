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

## Prioritized follow-up architecture

### 1. `TerminalSession`

Extract raw mode, alternate screen, paste mode, cursor state, signals, resize,
and input listeners into one ref-counted session object. The present safeguard
rejects a second active app because global terminal ownership is not yet
composable. A session abstraction should make multiple render roots on one
terminal explicit rather than silently corrupting state.

### 2. Byte-oriented input parser

Move the incremental parser out of `use-app` into a pure state machine with:

- byte-by-byte and arbitrary-chunk equivalence tests;
- configurable caps and deadlines;
- Kitty keyboard and modifyOtherKeys coverage;
- protocol fixtures shared by app and prompt input;
- fuzz and property tests over malformed sequences.

### 3. Real virtualized data components

`VirtualDataTable` and `EditableDataTable` remain in
`tuiuiu.js/experimental`. Promote them only after implementing true windowed
rows, stable row identity, editable cell focus, async validation, and
large-data performance contracts.

### 4. Cell-buffer renderer boundary

Keep component layout independent from terminal emission. A cell buffer with
grapheme, width, style, and hyperlink identity would simplify clipping,
wide-character invalidation, synchronized output, snapshots, and alternate
diff strategies.

### 5. Capability negotiation

Centralize terminal capability probes and cache them per session. Unsupported
protocols should degrade predictably to ANSI/Unicode or ASCII without each
component making its own environment guesses.

### 6. Contract and fuzz testing

Add property tests for parser chunk invariance, storage path containment,
selector parsing, Unicode editing, and renderer sanitization. Retain
cross-platform CI and keep benchmarks separate from deterministic functional
tests.
