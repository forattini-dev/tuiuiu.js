# Changelog

Notable changes to Tuiuiu are documented here.

## Unreleased (2.0)

Version 2 changes public entrypoints, component ownership and interaction APIs.
Follow [the migration guide](docs/migration/2.0.md); this is not a 1.x patch.
Release candidates are published through the explicit `next` channel before
promotion to the stable `latest` channel.

### Added

- Add the `tuiuiu.js/interaction` entry point with semantic commands,
  token-owned modes, identity-based collections, OverlayHost sessions, and
  renderer-independent PromptHost orchestration.
- Add automatic VNode overlay and prompt adapters to the app render loop.
- Add a breaking 2.0 migration guide and ownership-oriented package entrypoints.
- Add a runtime-backed CommandPalette adapter, `openModal()`, and a shared
  grapheme-safe scalar TextEditor.
- Add keyed ComponentOwners for every stateful visual component and physical
  cursor anchors for CJK IME positioning.
- Add shared text documents and independent viewports, source-based selection,
  read-only TextView, and bounded text-editor undo/redo.
- Add owned TextInput drag selection and clipboard integration, stable scroll
  anchors, and opt-in incremental Markdown rendering.
- Add a bounded `MarkdownView` reader with caller-owned `createMarkdownSelection`,
  explicit display/source copy policy, source-mapped inline formatting and a
  runnable `markdown-selection-lab` example.
- Add style-only spans to `TextView` without changing viewport geometry; selection
  preserves inline attributes and edits invalidate stale pointer captures.
- Add shared structured lexical highlighting to selectable Markdown fences,
  with opt-out and code-theme configuration that preserve source/copy geometry.
- Add owned incremental code highlighting and fitted-row reuse to Markdown
  documents/readers. Eight shipped language definitions resume from safe lexical
  checkpoints; other languages and modified definitions retain full scanning.

### Security

- Treat terminal text as untrusted and allow only validated SGR styling.
- Require authentication for non-loopback MCP binds and add origin, request,
  timeout, concurrency, and SSE isolation limits.
- Harden filesystem storage against traversal, symlinks, partial writes, and
  permissive file modes.
- Remove shell interpolation from clipboard image commands and bound image
  probing and decoding.
- Pin GitHub Actions by commit and enable provenance-capable OIDC publishing,
  retaining the existing npm token as a transition fallback.
- Update the dependency graph to remove known audit advisories.
- Refresh development tooling and transitive dependency constraints, and audit
  the isolated framework benchmark lockfile alongside the root lockfile in CI.

### Fixed

- Highlight code before fitting lines, preserving multiline comments/strings and
  deterministic numeric tokens. CodeBlock and InlineCode no longer create a flex
  item per token; explicit-width wrapping reserves real terminal gutter columns.
- Reflow affected logical text lines instead of repeatedly rebuilding the entire
  document, and use binary search for source-to-visual-row lookup.
- Detach retained text and code-row slices from old source revisions, preventing
  substring-backed history retention while preserving raw UTF-16 and Unicode.
- Preserve UTF-8 characters split across input chunks.
- Parse fragmented CSI, OSC, bracketed-paste, mouse, and focus input
  incrementally with bounded buffers.
- Make text editing and measurement grapheme-aware.
- Restore terminal state and listeners through idempotent application cleanup.
- Respect `exitOnCtrlC` and avoid terminating the host process by default.
- Keep app rerenders attached to the latest component function.
- Implement complete `:nth-child()` matching and fail closed for invalid
  pseudo-selectors.
- Correct autocomplete keyboard navigation and Unicode deletion.
- Prevent VNode cache collisions caused by incomplete child fingerprints.
- Make clipboard and notification hooks respect the active app output stream.
- Refresh inline-trigger sources when their semantic configuration changes.
- Restore clipboard-image subscriptions after re-enabling the hook and remove
  temporary image directories during cleanup.
- Add cancellation, timeouts, bounded queues, health-aware scheduling, and
  automatic worker recovery to background executors and task pools.
- Keep `StatusIndicator` pulse state and `LogViewer` scroll state stable across
  component rerenders without creating raw signals during render.
- Honor `showValue`, `showEta`, `showSpeed`, `eta`, `speed`, `description`,
  gradients, and fill-step options in the standalone `ProgressBar`.
- Bound `MultiProgressBar` bars and legends to the configured width and truncate
  long legends with an ellipsis.
- Preserve narrow siblings when integer `flexShrink` rounding can assign a
  one-column overflow to a wider child.
- Keep `useShortcut()` callbacks argument-free, so passing `useApp().exit`
  directly does not interpret command context as an application error.
- Correct macOS shortcut-label expectations and cover native labels explicitly
  on all test platforms.
- Cover forced delta redraw and runtime-scoped renderer reset without weakening
  coverage thresholds; capture complete PTY output when a child exits.

### Changed

- Route application input through the single InteractionRuntime.
- Make free-form composition uniformly variadic and remove ownerless component
  state, `props.children` precedence, and other v1 lifecycle fallbacks.
- Move Tabs, Select, MultiSelect, Menu, Autocomplete, TextInput completion,
  and CommandPalette navigation onto stable collection identity; Tabs now use
  automatic activation unless configured as manual.
- Replace overlay stacks, independent modal lifecycle, and the old command
  registry with runtime-owned OverlayHost sessions and semantic commands.
- Require explicit prompt defaults in non-interactive terminals.
- Promote supported data-table variants to the `tuiuiu.js/ui` catalog.
- Replace TuiInstance with AppHandle and one `screen` option; remove manual
  rerender and mode-specific render helpers.
- Remove v1 compatibility aliases, obsolete entrypoints, deprecated
  TaskBridge, and unreachable ANSI-buffer and string-chart implementations.
- Require Node.js 22.12 or newer.
- Separate functional tests from performance benchmarks.
- Make prerelease publication an explicit manual action.
- Keep test commands and platform-aware shortcut assertions portable across
  PowerShell, Bash, POSIX shells, Linux, Windows, and macOS.
- Enforce coverage, runtime reachability, package-size, public-contract, and
  real Linux PTY checks in CI.
