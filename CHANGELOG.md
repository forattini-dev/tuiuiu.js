# Changelog

Notable changes to Tuiuiu are documented here.

## Unreleased

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

### Fixed

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

### Changed

- Move unfinished data-table facades to `tuiuiu.js/experimental`.
- Require Node.js 22.12 or newer.
- Separate functional tests from performance benchmarks.
- Make prerelease publication an explicit manual action.
- Keep test commands and platform-aware shortcut assertions portable across
  PowerShell, Bash, POSIX shells, Linux, Windows, and macOS.
- Enforce coverage, runtime reachability, package-size, public-contract, and
  real Linux PTY checks in CI.
