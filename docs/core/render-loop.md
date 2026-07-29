# Interactive Render Loop

This page documents how the interactive runtime decides **when** to evaluate, **when** to paint, and **when** to intentionally skip stale work.

Use it when you need:

- the exact render scheduling model behind `render()`
- an explicit inline, fullscreen, or alternate-screen terminal contract
- safe output from jobs, subprocesses, and other imperative producers
- predictable update behavior for games or animation-heavy apps
- the performance rationale for `maxFps`, fixed-step updates, and backpressure handling

## High-Level Model

The interactive runtime now separates three concerns:

1. **Invalidation**: signals mark the app as needing fresh work.
2. **Evaluation**: the root component tree is re-run to produce the latest VNode tree.
3. **Presentation**: the committed frame is painted to the terminal.

That separation matters because the fastest terminal app is usually **not** the app that paints every intermediate state.

## Default Scheduler Semantics

`render()` follows these rules by default:

1. The first render is eager so the app becomes visible immediately.
2. Later signal-driven reruns are scheduled instead of re-running synchronously for every invalidation.
3. Multiple invalidations in the same burst window collapse into one evaluation of the latest state.
4. Presentation is still bounded by `maxFps` (`30` by default).
5. If the output stream applies backpressure, stale intermediate frames are dropped and the runtime resumes with the newest pending frame after `drain`.

In practice this gives the runtime a **latest-state-wins** policy.

## Screen Modes

The 1.x `render()` defaults remain unchanged for compatibility. New
applications should choose their terminal ownership explicitly:

```typescript
import {
  renderAlternateScreen,
  renderFullscreen,
  renderInline,
} from 'tuiuiu.js/minimal';

// Progress, prompts, and output that should stay in shell scrollback.
renderInline(ProgressApp);

// Full-height app on the primary buffer.
renderFullscreen(Dashboard);

// Full-height app that restores the user's primary screen on exit.
renderAlternateScreen(Editor);
```

The equivalent low-level option is:

```typescript
render(App, {
  screenMode: 'inline', // 'inline' | 'fullscreen' | 'alternate'
});
```

If a legacy `clearOnStart`, `fullHeight`, or `alternateScreen` boolean is
provided with `screenMode`, that explicit boolean wins. This makes migration
incremental instead of changing existing 1.x behavior.

## Safe External Output

Writing directly to `process.stdout` while a live frame owns the terminal can
split ANSI sequences or leave ghost rows. Use `writeLine()` instead:

```typescript
const tui = renderInline(App);

worker.on('message', (message) => {
  tui.writeLine(`worker: ${message}`);
});
```

Components can access the same writer through `useApp()`:

```typescript
const { writeLine } = useApp();
writeLine('download complete');
```

The writer batches with the render scheduler, places output above the live
region, adjusts mouse coordinates, and repaints the app. It preserves SGR color
codes but strips terminal control protocols such as screen clears and OSC
commands. Do not call it unconditionally during component evaluation; invoke it
from input handlers, effects, or external-event callbacks.

The first `writeLine()` call moves that render session from the coordinate-only
delta path to the offset-aware ANSI renderer. This is an intentional
correctness trade-off for sessions that mix permanent logs with a live frame.

## Presentation Cap

`maxFps` limits how often the terminal is allowed to paint.

```typescript
render(App, {
  maxFps: 30,
});
```

Important boundaries:

- `maxFps` is a **presentation** cap, not a simulation cap.
- `maxFps: 0` removes the presentation throttle, but invalidations are still coalesced within the same scheduled flush.
- lower `maxFps` values reduce terminal pressure and can be the right trade-off for dashboards or slow terminals.

## Fixed-Step Updates

For game-like workloads, use `fixedStep` to run logic on a stable cadence while leaving paint frequency independently capped.

```typescript
render(Game, {
  maxFps: 30,
  fixedStep: {
    updateFps: 60,
    onUpdate: ({ deltaTimeMs, step, elapsedMs }) => {
      advanceSimulation(deltaTimeMs);
    },
  },
});
```

### `fixedStep` contract

```typescript
interface FixedStepOptions {
  updateFps: number;
  maxCatchUpUpdates?: number; // default: 5
  pauseWhenUnfocused?: boolean; // default: true
  onUpdate: (update: FixedStepUpdate) => void;
}

interface FixedStepUpdate {
  deltaTimeMs: number;
  step: number;
  elapsedMs: number;
}
```

What the runtime guarantees:

- logical updates run on a fixed cadence derived from `updateFps`
- multiple signal writes inside one fixed update are batched together
- presentation still follows the render scheduler and `maxFps`
- catch-up work is bounded by `maxCatchUpUpdates`
- stale catch-up backlog is dropped once that limit is exceeded to avoid a spiral of death
- fixed-step updates pause while the terminal is unfocused unless `pauseWhenUnfocused: false` is set

This means you can run `60 Hz` simulation with `30 Hz` presentation without forcing the terminal to paint every logical tick.

### Focus-aware fixed-step

By default, the runtime treats terminal focus as a scheduling hint:

```typescript
render(Game, {
  fixedStep: {
    updateFps: 30,
    pauseWhenUnfocused: true,
    onUpdate: stepSimulation,
  },
});
```

Behavior:

- when the terminal loses focus, pending fixed-step timers are cleared
- logical backlog is discarded instead of replayed later
- when focus returns, updates resume from “now” rather than performing a catch-up burst

If you are building something that must continue simulation in the background, opt out:

```typescript
render(Game, {
  fixedStep: {
    updateFps: 30,
    pauseWhenUnfocused: false,
    onUpdate: stepSimulation,
  },
});
```

## Backpressure Handling

Terminal streams can refuse immediate writes by returning `false` from `write(...)`.

When that happens, the runtime now:

1. stops scheduling new flushes to the terminal
2. keeps only the most recent pending render callback/frame
3. waits for the stream `drain` event
4. resumes with the latest state

This prevents a slow terminal from building an unbounded queue of obsolete frames.

## Renderer Path

After scheduling chooses to present, the runtime still follows the same committed-frame path:

1. evaluate the latest VNode tree
2. build a committed `FrameSnapshot`
3. register hit-test data from committed layout
4. render via delta renderer or string renderer

That means scheduling and renderer optimizations stack cleanly:

- lazy frame diagnostics avoid unnecessary production work
- dirty-rect delta updates reduce terminal writes for localized changes
- latest-state scheduling reduces how often large trees are re-evaluated
- fixed-step updates let simulation stay predictable without exploding paint cost
- backpressure handling prevents stale frame flushes from dominating runtime cost

## Tuning Guidance

Use these as starting points:

- dashboards: `maxFps: 15-30`, no `fixedStep`
- action-heavy terminal games: `fixedStep.updateFps: 30-60`, `maxFps: 30-60`
- slower terminals / remote shells: lower `maxFps` first before reducing simulation cadence

If the app still feels slow, the next suspects are usually:

- too much layout work per frame
- too much screen area changing per paint
- component code doing heavy work during tree evaluation

## Related Pages

- [Rendering](/core/renderer.md)
- [Rendering Architecture](/core/rendering-architecture.md)
- [Engine Runtime Contracts](/core/runtime-contracts.md)
- [Runtime Performance](/resources/runtime-performance.md)
