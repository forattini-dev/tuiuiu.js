# Examples

Examples are now organized by intent and difficulty so the first contact with the library does not start on the most advanced patterns.

## Running Examples

Use the curated runner:

```bash
pnpm example:list
pnpm example app-counter
pnpm example app-layout
pnpm example app-forms
pnpm example app-dashboard
```

## Recommended Path

| Example | Difficulty | Why start here |
|---------|------------|----------------|
| `app-counter` | Easy | Smallest loop with `useState()` and keyboard input |
| `app-layout` | Easy | Layout primitives like `Screen`, `Header`, `Main`, `Footer` |
| `append-list` | Easy | Append-only output above a live region |
| `cli-wizard` | Easy | Prompt-oriented flow with low UI complexity |
| `prompts-demo` | Easy | Standalone prompts API walkthrough |
| `app-chat` | Medium | Real app composition and scrolling |
| `nested-input-components` | Medium | Focus routing between nested interactive components |
| `confirm-dialog-overlay` | Medium | Complete keyboard-and-mouse confirmation overlay |
| `dashboard-metrics` | Medium | Operational metrics and reusable data-display atoms |
| `mouse-events` | Medium | Click, hover, drag, context-menu, and wheel events |
| `app-forms` | Advanced | Canonical interactive inputs with `useTextInputState()` / `useSelectState()` |
| `rich-prompt-workbench` | Advanced | Structured prompt composition with semantic tokens, slash commands, async completions, and background status feedback |
| `shell-session-workbench` | Advanced | App-owned subprocess transcript routing, streamed output, persisted replay restoration, live status, and line-based stdin bridging |
| `app-dashboard` | Advanced | Heavy composition, metrics, and animation-like updates |
| `app-ai-assistant` | Advanced | Assistant-style composition, overlays, streaming, code, and settings |

## Showcase Examples

These are good for inspiration, not as a first implementation reference.

| Example | Difficulty | Focus |
|---------|------------|-------|
| `app-htop` | Advanced | System monitor layout |
| `app-ping` | Advanced | Network visualization |
| `app-mtr` | Advanced | Traceroute-style diagnostics |
| `whatsapp-clone` | Advanced | Large messaging UI |
| `tuiuiu-brush` | Advanced | Interactive drawing |
| `tuiuiu-player` | Advanced | Media-player style interface |
| `advanced-charts` | Advanced | Advanced data visualization composition |
| `interactive-charts` | Advanced | Keyboard navigation and chart selection |
| `terminal-image-pipeline` | Medium | Protocol selection, fallback, and terminal-image resize |
| `tuiuiu-invaders` | Advanced | Literal Space Invaders clone |
| [`tuiuiu-meteor`](/resources/examples/tuiuiu-meteor.md) | Advanced | Asteroids-style meteor splitter |
| [`tuiuiu-sideblaster`](/resources/examples/tuiuiu-sideblaster.md) | Advanced | Horizontal shoot'em up showcase |
| [`tuiuiu-tetris`](/resources/examples/tuiuiu-tetris.md) | Advanced | Falling-block puzzle showcase |
| [`tuiuiu-snake`](/resources/examples/tuiuiu-snake.md) | Advanced | Grid-chase snake showcase |
| `tuiuiu-doom` | Advanced | Raycasting, strafing, combat, and minimap HUD |
| `tuiuiu-defence` | Advanced | Tower-defence game with waves, placement, and upgrades |

## Arcade Showcase Notes

These examples are intentionally heavier than the onboarding apps. They exist to show how far the library can be pushed with `Canvas`, animation loops, overlays, telemetry panels, and testable game-state helpers.

### `tuiuiu-meteor`

Run it with:

```bash
pnpm example tuiuiu-meteor
```

- Genre: Asteroids-style arena shooter
- Controls: `Left` / `Right` rotate, `Up` thrust, `Down` brake, `Space` fire, `P` pause, `F1` help
- What it demonstrates: wrap-around movement, fragmenting meteors, responsive HUD, modal overlays, FPS in the header, and exported pure simulation helpers for tests
- Full docs: [/resources/examples/tuiuiu-meteor.md](/resources/examples/tuiuiu-meteor.md)

### `tuiuiu-sideblaster`

Run it with:

```bash
pnpm example tuiuiu-sideblaster
```

- Genre: Horizontal shoot'em up
- Controls: `Arrows` / `WASD` move, `Space` fire, `P` pause, `F1` help
- What it demonstrates: side-scrolling combat lanes, larger ship sprites, long forward lasers, enemy wave spawning, pressure tracking, FPS in the header, and exported gameplay helpers for tests
- Full docs: [/resources/examples/tuiuiu-sideblaster.md](/resources/examples/tuiuiu-sideblaster.md)

### `tuiuiu-tetris`

Run it with:

```bash
pnpm example tuiuiu-tetris
```

- Genre: Falling-block puzzle
- Controls: `Left` / `Right` move, `Up` or `X` rotate clockwise, `Z` rotate counter-clockwise, `Down` soft drop, `Space` hard drop, `C` hold
- What it demonstrates: deterministic bag randomizer, wall-kick rotation, hold/next previews, line clears, score and level gravity progression, responsive HUD, and exported gameplay helpers for tests
- Full docs: [/resources/examples/tuiuiu-tetris.md](/resources/examples/tuiuiu-tetris.md)

### `tuiuiu-snake`

Run it with:

```bash
pnpm example tuiuiu-snake
```

- Genre: Grid-chase snake arcade
- Controls: `Arrows` / `WASD` / `HJKL` turn, `P` pause, `R` restart
- What it demonstrates: deterministic food spawning, queued turn handling, growth and score ramps, wall/self collision outcomes, responsive HUD, and exported gameplay helpers for tests
- Full docs: [/resources/examples/tuiuiu-snake.md](/resources/examples/tuiuiu-snake.md)

## Programmatic Examples

These show lower-level control flows and are better after you understand the canonical component path.

| Example | Difficulty | Focus |
|---------|------------|-------|
| `programmatic-state-management` | Medium | External state changes |
| `programmatic-scroll-control` | Medium | Scroll control APIs |
| `programmatic-external-triggers` | Medium | Out-of-band updates |
| `thread-pool-demo` | Advanced | `createTaskBridgePool` with multiple workers + parallel jobs |
| `performance-demo` | Advanced | Rendering and update performance instrumentation |
| `programmatic-runtime-contracts` | Medium | Committed-frame queries, scroll-by-ID, and inspector usage |

Run it with:

```bash
pnpm example thread-pool-demo
```

## Canonical Input Pattern

For interactive inputs, prefer the rerender-safe hook path:

```typescript
import {
  Box,
  Text,
  TextInput,
  Select,
  useState,
  useTextInputState,
  useSelectState,
} from 'tuiuiu.js';

function ExampleForm() {
  const [step, setStep] = useState(0);
  const roleOptions = [
    { value: 'dev', label: 'Developer' },
    { value: 'design', label: 'Designer' },
  ];
  const name = useTextInputState({
    placeholder: 'Name',
    isActive: () => step() === 0,
    onSubmit: () => setStep(1),
  });
  const role = useSelectState({
    items: roleOptions,
    isActive: () => step() === 1,
  });

  return Box(
    { flexDirection: 'column', gap: 1 },
    Text({}, 'Profile'),
    TextInput({ state: name, borderStyle: 'round', fullWidth: true }),
    Select({ state: role, items: roleOptions, borderStyle: 'round', showCount: false })
  );
}
```

Use `createTextInput()` / `renderTextInput()` and `createSelect()` / `renderSelect()` when you explicitly want programmatic control outside the normal component lifecycle.

## Structured Prompt Reference

Run it with:

```bash
pnpm example rich-prompt-workbench
```

This example is the reference composition for the richer prompt foundation:

- semantic `TextInput` segments for mentions, files, and summarized paste tokens
- app-owned slash command routing layered on top of the shared prompt primitives
- command-specific slash argument completions demonstrated with `/seed <preset>`
- live slash-command context rendered from the shared registry while the user is still typing
- advisory slash-command diagnostics rendered before submit for missing or invalid `/seed` presets
- prompt-mode routing for default text, slash commands, and shell-style `!` input
- persisted semantic prompt history so structured prompts survive remounts and restore their tokens
- anchored async completions resolved through task-backed worker handles
- real worker-emitted progress events routed through `task.subscribe(...)` and `enqueueExternalUpdate()`
- persisted frecency ranking so accepted suggestions rise in later completion sessions and survive remounts

It intentionally stops short of product concerns like PTY lifecycle, shell ownership, or remote terminal emulation. Those remain application responsibilities built on top of the core primitives.

## Shell Session Reference

Run it with:

```bash
pnpm example shell-session-workbench
```

This example focuses on the app-owned side of subprocess-backed terminal/session UX:

- prompt-mode routing with `!` as the shell/session prefix
- streamed stdout/stderr from `child_process.spawn`
- bounded replay buffer restored after remount
- opt-in persisted replay state and command history across restarts
- live command lifecycle feedback for long or silent shell commands
- line-based stdin bridging for active subprocesses that explicitly allow input
- bounded shell command history with recall
- active-process interruption from the app-owned controller
- explicit separation between input primitives and process lifecycle

It is intentionally transcript-based, not a PTY, terminal emulator, or reconnectable terminal transport. Persisted state restores only replayable data, live status is app-owned metadata, and stdin bridging is a line-based `child.stdin` pattern rather than raw terminal passthrough. While stdin is active, only documented control commands such as `!interrupt` and `!stdin-close` stay reserved; other submissions can be routed to stdin intentionally. The point is to document the subprocess integration pattern while keeping shell ownership outside the library core.
