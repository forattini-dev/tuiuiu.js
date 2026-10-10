# Tuiuiu architecture context

## Purpose

Tuiuiu is a TypeScript library for building terminal interfaces with function
components, keyed VNodes, signals, and a deterministic render pipeline. It does
not use JSX or browser CSS.

## Ownership model

Every stateful function component must run through `component()`. A
`ComponentOwner` stores its hook state and keyed child owners. Rendering a
parent starts a child reconciliation pass; unvisited owners are disposed after
the pass and failed renders roll back newly-created owners. Keys identify
siblings and must be stable when their order can change.

An `AppHandle` owns exactly one application runtime: rendering, focus,
interaction, overlays, prompts, contributions, terminal screen mode, and
disposal. Runtime-scoped services must never fall back to another mounted app.
Standalone utilities may use the explicit default runtime scope only when no
app is involved.

## Architectural boundaries

The visual hierarchy is directional:

```text
primitives -> atoms -> molecules -> organisms -> templates
```

A visual layer may depend on itself or a lower layer. Shared non-visual
algorithms belong in `utils` or `interaction`; application lifecycle belongs in
`app`; terminal rendering mechanics belong in `core`.

## Canonical modules

- component ownership: `src/app/component.ts` and `src/hooks/context.ts`
- application lifecycle: `src/app/render-loop.ts`
- typed extension slots: `src/app/contributions.ts`
- frame activation and commit: `src/core/frame-lifecycle.ts`
- interaction routing: `src/interaction/runtime.ts`
- identity-based collections: `src/interaction/collection.ts`
- normalized collection bindings: `src/interaction/collection-bindings.ts`
- text completion: `src/interaction/completion.ts`
- text content/revisions: `src/interaction/text-document.ts`
  keeps the logical-line index current from raw changes. A weak, single latest
  change supports optional incremental reflow; missed revisions and external
  documents fall back to fresh layout. `setValue` retains its public replacement
  event while privately narrowing geometry invalidation to the changed interval.
- scalar text editing: `src/interaction/text-editor.ts`
- editable input adapter: `src/atoms/text-input.ts` owns a TextEditor, attaches
  segment snapshots to its undo checkpoints, and keeps submitted command history
  and completion separate. Hook-owned input controllers dispose on unmount.
- editable/read-only pointer capture: `src/hooks/use-pointer-selection.ts` keeps
  mouse lifetime and committed, unclipped node geometry shared across both views.
  Clipboard handles bind to the creating app output; password input copy is blocked.
- text reflow and terminal-coordinate mapping: `src/interaction/text-viewport.ts`
  reflows affected logical lines and shifts/reuses intact geometry. Its cache
  belongs to the caller, adds no document subscription, and invalidates on resize.
  Retained logical-line text is detached from old whole-string revisions to avoid
  substring-backed history retention; raw UTF-16, including lone surrogates, survives.
  Source-to-row lookup uses binary search; source storage and row arrays remain
  flat, not a rope or a fully virtualized layout.
- read-only source selection: `src/interaction/text-selection.ts`; bounded
  visual adapter: `src/atoms/text-view.ts`
- incremental Markdown blocks: `src/utils/markdown-document.ts`; visual
  formatting/cache adapter: `src/molecules/markdown.ts`
- structured text/style snapshots and canonical fitted source mapping:
  `src/utils/styled-text.ts`; visual adapter: `src/primitives/rich-text.ts`
- bounded terminal Markdown inline parsing: `src/utils/markdown-inline.ts`
- renderer-independent lexical code: `src/utils/code-tokenizer.ts` owns the
  language/alias registry and partitions raw UTF-16 source once, materializing
  token values only when requested. `src/utils/code-highlight.ts` owns palettes
  and immutable span adapters (CodeTheme or detailed token colors) over those
  same ranges. CodeBlock fits after highlighting; FilePreview tokenizes one
  visible source prefix instead of restarting per line. Both keep one RichText
  flow per code row; MarkdownSelection changes styles without replacing source
  provenance. The unused, non-public `src/core/highlighter.ts` ANSI adapter was
  removed; terminal presentation belongs to the existing render backends. This
  is lexical coloring, not a grammar/semantic parser, and themes may differ by view.
- selectable Markdown reader: `src/utils/markdown-selection.ts` composes inline
  and block source provenance through `src/utils/text-projection.ts`;
  `src/molecules/markdown-view.ts` adapts it to the style-only TextView viewport.
  Display offsets never stand in for raw Markdown offsets; generated decoration
  has no source interval. Ordinary Markdown rendering stays independent.
- line-based scrolling and stable item anchors: `src/organisms/scroll-list.ts`
- overlay and prompt ownership: `src/interaction/overlay.ts` and
  `src/interaction/prompt.ts`
- background execution: `src/utils/background-executor.ts`
- physical cursor ownership: `TextInput`/`CursorAnchor` metadata resolved by
  `src/core/frame.ts` and presented by both render backends

## Domain language

- **Component Owner** owns one component instance's hooks, cleanups, and keyed
  descendants.
- **Interaction Runtime** resolves normalized terminal events into semantic
  commands, modes, targets, and low-level normalized handlers.
- **Interaction Mode** is a token-owned input context such as `modal`,
  `autocomplete`, or `prompt`.
- **Collection Controller** owns cursor, selection, filtering, modality, and
  viewport reconciliation by stable item identity.
- **Text Document** owns content/revision and logical lines; editors own cursor,
  selection and bounded history; viewports own reflow and visual coordinates.
- **Markdown Document** retains only grammar-stable block identities while its
  unfinished tail remains reparsable. It is opt-in and belongs to one message.
- **Text Span** is immutable text/style data. RichText keeps spans in one VNode
  and draw command until the canonical cell rasterizer, never as early ANSI.
- **Overlay Session** owns an opened overlay's mode, focus capture, backdrop,
  timer, and exactly-once close result.
- **Prompt Session** is renderer-independent prompt state; VNode and ANSI hosts
  are presentation adapters.
- **Contribution Host** owns typed, ordered, disposable contributions to named
  application slots.

## Public API policy

Version 2 has these package entrypoints only:

```text
tuiuiu.js
tuiuiu.js/app
tuiuiu.js/colors
tuiuiu.js/core
tuiuiu.js/devtools
tuiuiu.js/interaction
tuiuiu.js/mcp
tuiuiu.js/storybook
tuiuiu.js/testing
tuiuiu.js/ui
```

The root is a small everyday surface. `app` owns lifecycle and hooks, `ui` owns
the full visual catalog, `interaction` owns renderer-independent interaction,
and `core` owns low-level terminal/rendering mechanics. There are no v1 aliases,
compatibility entrypoints, or experimental catch-all entrypoints.

MCP documentation must be a subset of the compiled public TypeScript contract.
Entrypoint names, exact export sets, and runtime reachability are enforced by
`pnpm verify:contracts`, `pnpm check:package-budget`, and
`pnpm check:cycles`.

## Composition policy

- Free-form layouts use `Component(props, ...children)`.
- Free-form layouts never accept a second `props.children` composition path.
- Structured components use named slots.
- Stateful components use `component()` and stable keys.
- Collections use data props and stable item keys.
- Deferred collections use render callbacks.
- App extensions use typed contributions instead of reaching into host state.

## Verification

```text
pnpm typecheck
pnpm typecheck:tests
pnpm typecheck:examples
pnpm lint
pnpm test:run
pnpm build
pnpm check:cycles
pnpm verify:contracts
pnpm check:package-budget
pnpm test:performance
```
