# Perf Inspector

`tuiuiu.js` now ships a low-overhead frame recorder for committed interactive renders.

Use it when you need to:

- inspect recent frame cost without attaching an external profiler
- detect slow frames and budget overruns in-app
- surface runtime metrics inside dev overlays or demos

## What It Records

Each committed frame sample keeps:

- committed frame id and timestamp
- renderer kind: `ansi` or `delta`
- total frame time
- per-phase timings when available:
  - `vnodeEvalMs`
  - `layoutMs`
  - `drawCommandMs`
  - `frameCommitMs`
  - `staticRenderMs`
  - `ansiRenderMs`
  - `deltaRenderMs`
  - `outputWriteMs`
- structural counts:
  - draw commands
  - reserved regions
  - patch count
  - dirty rect count
  - diff rect count
  - output bytes
  - `layoutReuseCount` / `layoutFreshCount`
  - `drawReuseCount` / `drawFreshCount`
  - `invalidationEscalationCount`
  - `absorbedLayoutDirtyCount`

The inspector reads from the same committed frame metrics used by the runtime. It does not maintain a second render pipeline.

## Basic Usage

```typescript
import {
  configurePerfInspector,
  getPerfFrames,
  getPerfInspectorSummary,
  onSlowFrame,
} from 'tuiuiu.js';

configurePerfInspector({
  maxFrames: 180,
  budget: {
    frameMs: 16.67,
    slowFrameMs: 33.34,
  },
});

const stop = onSlowFrame((frame) => {
  console.warn(
    `slow frame ${frame.frameId}: ${frame.totalMs.toFixed(2)}ms (${frame.renderer})`,
  );
});

const summary = getPerfInspectorSummary();
console.log(summary.averageFrameMs, summary.p95FrameMs);
console.log(getPerfFrames().at(-1));
```

## Configuration

```typescript
interface PerfInspectorConfig {
  enabled: boolean;
  maxFrames: number;
  budget: {
    frameMs: number;
    slowFrameMs: number;
  };
}
```

Notes:

- `enabled` defaults to `true`
- `maxFrames` controls the ring-buffer size
- `frameMs` is the normal budget target
- `slowFrameMs` is the threshold used by `onSlowFrame(...)`

If you want to disable recording entirely:

```typescript
configurePerfInspector({ enabled: false });
```

## Summary Model

`getPerfInspectorSummary()` returns aggregate data for the current ring buffer:

- `frameCount`
- `slowFrameCount`
- `overBudgetCount`
- `averageFrameMs`
- `minFrameMs`
- `maxFrameMs`
- `p95FrameMs`
- `averageOutputBytes`
- `averagePatchCount`
- `phaseAverages`
- `lastFrame`

This is the best entry point for dashboards and overlays.

## `PerfOverlay`

For quick visual inspection, use the optional overlay surface:

```typescript
import { Box, PerfOverlay } from 'tuiuiu.js';

function App() {
  return Box(
    { flexDirection: 'column' },
    PerfOverlay(),
  );
}
```

Available options:

```typescript
interface PerfOverlayProps {
  title?: string;
  compact?: boolean;
  showPhases?: boolean;
  showStructural?: boolean;
}
```

The overlay is just a view over `getPerfInspectorSummary()`. If no frame has been committed yet, it renders a placeholder message instead of crashing.

## Budget Interpretation

Recommended reading:

- `layoutMs` + `drawCommandMs` tell you how much time the runtime spent assembling the frame
- `ansiRenderMs` or `deltaRenderMs` tell you backend cost before terminal writes
- `outputWriteMs` shows terminal flush pressure
- `outputByteCount` helps explain slow terminals, multiplexers, and noisy full redraws

If `outputWriteMs` is low but total frame time is high, the problem is probably inside evaluation, layout, or draw-command generation.  
If `outputWriteMs` and `outputByteCount` spike together, terminal IO is likely the bottleneck.

## Subtree Reuse Diagnostics

The perf inspector now exposes conservative subtree invalidation counters through `frame.structural`:

- `layoutReuseCount`: cached layout subtrees reused this frame
- `layoutFreshCount`: layout subtrees recomputed this frame
- `drawReuseCount`: cached draw-command subtrees reused this frame
- `drawFreshCount`: draw-command subtrees rebuilt this frame
- `invalidationEscalationCount`: ambiguous ownership cases that fell back to broader work
- `absorbedLayoutDirtyCount`: child layout dirtiness that stopped at a fixed-dimension parent

These counters are especially useful when you are trying to preserve stable subtree identity in larger apps.

## Testing

The perf inspector contract is covered by:

- [tests/core/perf-inspector.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/core/perf-inspector.test.ts)
- [tests/app/render-loop.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/app/render-loop.test.ts)
- [tests/core/delta-render.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/core/delta-render.test.ts)
