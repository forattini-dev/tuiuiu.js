# Runtime Performance

This page tracks the representative frame budgets used to keep the core runtime fast for large interactive apps.

If you need live metrics inside an app instead of offline benchmarks, use the [Perf Inspector](/core/perf-inspector.md).

## Representative Workloads

The local benchmark suite exercises three synthetic dashboard workloads:

- `small`: 3 sections, 3 rows, 4 cards per row
- `medium`: 4 sections, 5 rows, 6 cards per row
- `large`: 6 sections, 8 rows, 10 cards per row

Each workload measures:

- frame assembly via `createFrameSnapshot(...)`
- layout phase from `FrameSnapshot.metrics.phases.layoutMs`
- ANSI rendering via `renderToString(...)`
- delta rendering via `createDeltaRenderer().renderFrame(...)`
- render-scheduler burst behavior via `render(...)` under synchronous invalidation bursts

There is now a second local stress suite focused on more interactive failure modes:

- large-tree churn where only part of a big tree changes each frame
- localized board repaint vs full board repaint
- keyboard burst handling
- mouse burst handling
- heavier scheduler/backpressure collapse under repeated invalidation

## Production Budgets

These are the target budgets for the current optimization phase:

| Workload | Frame Assembly | Layout | ANSI Render | Delta Render |
| --- | ---: | ---: | ---: | ---: |
| `small` | `< 12ms` | `< 10ms` | `< 8ms` | `< 10ms` |
| `medium` | `< 20ms` | `< 18ms` | `< 12ms` | `< 16ms` |
| `large` | `< 45ms` | `< 45ms` | `< 25ms` | `< 30ms` |

## Baseline Notes

Before this optimization change, a large dashboard-like workload with roughly `2400` draw commands on a `180x60` viewport was measuring in the rough range below on this machine:

- frame assembly: `~54ms`
- ANSI render: `~25ms`
- delta render: `~26-50ms`
- effective total cost: enough to collapse into the low-teens FPS range

After introducing lazy frame diagnostics and lazy query/index assembly for production rendering paths, the same workload dropped to approximately:

- frame assembly: `~30ms`
- ANSI render: `~17ms`
- delta render: `~19ms`

After the next hot-path pass, which added row-based fills, theme-aware color caches, and removed redundant patch sorting from the delta path, the same large workload dropped again to approximately:

- frame assembly: `~17ms`
- ANSI render: `~8ms`
- delta render: `~10ms`

That puts the representative large workload closer to:

- ANSI path total: `~25ms/frame` or roughly `~39 FPS`
- delta path total: `~27ms/frame` or roughly `~37 FPS`

After the next pass, which introduced real dirty-rect delta updates plus fast-path layout for text/spacer/newline leaves, two representative large-tree profiles now look roughly like this on the same machine:

- stable large frame:
  - frame assembly: `~7.5ms`
  - layout: `~4.3ms`
  - ANSI render: `~16.6ms`
  - delta render: `~1.1ms`
- large tree with one localized metric update per frame:
  - frame assembly: `~4.3ms`
  - ANSI render: `~8.3ms`
  - delta render: `~6.1ms`

That means the delta path now has a materially cheaper steady-state story for both:

- unchanged frames, where patch emission can short-circuit almost entirely
- localized updates, where delta rendering now stays cheaper than re-rendering the full ANSI output for the same large tree

The benchmark suite now includes an explicit localized-update workload and asserts that delta stays cheaper than ANSI for that case.

There is now a complementary microbenchmark pass for buffer hot paths as well:

- unchanged full-buffer `CellBuffer.diff(...)`
- localized `diffRects(...)` with overlapping dirty rects
- styled `patchesToAnsi(...)` serialization with adjacent same-style runs

Those microbenchmarks are excluded from the default test job and exist to catch regressions in the cell-buffer hot path before they show up as frame-budget failures.

After the conservative subtree-layout reuse pass, a repeated large frame on the same committed tree dropped again to roughly:

- stable large frame with reusable subtree identities:
  - frame assembly: `~1.8ms`
  - layout: `~0.04ms`
  - ANSI render: `~13.1ms`
  - delta render: `~1.0ms`
- large tree rebuilt around one localized metric update per frame:
  - frame assembly: `~34.2ms`
  - layout: `~30.7ms`
  - ANSI render: `~14.1ms`
  - delta render: `~9.6ms`

That split is important:

- if your app preserves stable subtree identity, layout cost can become almost negligible in steady state
- if your app rebuilds most of the tree every frame, layout is still the dominant cost and the scheduler/delta optimizations mainly protect painting and output pressure

The practical tuning rule is straightforward: hoist static branches, reuse stable widget trees when possible, and let the runtime spend layout time only where geometry actually changed.

The runtime now also records subtree invalidation diagnostics on committed frames:

- `layoutReuseCount` / `layoutFreshCount`
- `drawReuseCount` / `drawFreshCount`
- `invalidationEscalationCount`
- `absorbedLayoutDirtyCount`

If you see reuse counts staying near zero in a supposedly stable app, the most common causes are:

- rebuilding large subtrees unnecessarily
- mutating layout-affecting props in place
- triggering broad invalidation due to unstable subtree ownership

After the next pass, which added conservative draw-command subtree reuse on top of layout reuse, the same machine now measures roughly:

- stable large frame with reusable layout and draw-command identities:
  - frame assembly: `~0.08ms`
  - layout: `~0.02ms`
  - draw commands: `~0.003ms`
  - ANSI render: `~7.0ms`
  - delta render: `~0.6ms`
- large tree rebuilt around one localized metric update per frame:
  - frame assembly: `~15.0ms`
  - layout: `~11.5ms`
  - draw commands: `~2.5ms`
  - ANSI render: `~6.9ms`
  - delta render: `~5.4ms`

At this point the production path has a very clear split:

- truly stable frames are now dominated by terminal painting, not by frame assembly
- partially rebuilt frames still pay mostly for layout, with draw-command assembly materially cheaper than before

## Interactive Scheduler Notes

The production runtime now applies additional scheduling optimizations before painting:

- synchronous invalidation bursts collapse to one latest-state rerun
- fixed-step logical updates can run faster than presentation for game-like workloads
- output backpressure keeps only the newest pending frame instead of draining stale intermediate writes

That means representative runtime performance is no longer just a question of:

- layout cost
- frame assembly cost
- ANSI or delta paint cost

It also depends on whether the runtime is doing unnecessary **extra evaluations or flushes** during bursts.

The local performance suite now includes a burst benchmark that exercises a large tree through `render(...)` and asserts that the scheduler collapses the burst into one follow-up render.

The benchmark suite is intentionally skipped by normal push and pull-request
jobs because hosted-runner variance is too high for narrow absolute thresholds.
The manually dispatched performance workflow runs it on Linux, Windows, and
macOS so results can still be compared across controlled revisions. Local runs
use the strict test budgets (`1.0x`). The hosted workflow explicitly uses
`TUIUIU_PERF_BUDGET_SCALE=1.25` for absolute wall-clock limits only; relative
performance checks, render-count limits, and output-size checks remain unchanged.
Values outside the bounded `1.0`–`2.0` range are rejected so the escape hatch
cannot silently disable regression protection.

## Stress Suite Notes

The stress suite exists to catch the class of regressions that usually show up as:

- FPS collapse under sustained churn even though microbenchmarks still look fine
- localized updates silently degenerating into near-full repaint cost
- keyboard or mouse bursts causing runaway render counts
- scheduler collapse/backpressure handling regressing under heavier invalidation storms

The budgets in this suite are intentionally conservative. They are not meant
to certify absolute FPS across machines. Local runs use the documented limits,
while the manual cross-platform workflow applies the bounded hosted-runner
multiplier described above. Both modes are designed to catch material
regressions in representative interactive workloads.

## Cross-Framework Comparison

The private package in `benchmarks/framework-comparison` compares:

- the default Tuiuiu root entrypoint;
- the explicit `tuiuiu.js/app` lifecycle entrypoint;
- Ink using React state and `React.createElement`;
- a small handwritten ANSI reference.

No JSX source is required. JSX syntax is compiled away before runtime, so the
Ink fixture uses the runtime representation that JSX produces. This keeps the
comparison focused on the meaningful architectural costs: module loading,
signals versus React state/reconciliation, layout, incremental painting, and
terminal output.

The localized and full-tree scenarios run in isolated Node.js processes and
record module load, first paint, p50/p95/p99 updates, output bytes, burst
handling, memory growth, and median absolute deviation between samples.

Ink and React have a lockfile local to the benchmark package. A normal root
install does not install competitor dependencies, and the benchmark workspace
is excluded from the published npm package.

## Running The Suite

```bash
pnpm test:performance
```

For a quick cross-framework smoke run:

```bash
pnpm benchmark:frameworks:quick
```

For the seven-sample comparison:

```bash
pnpm benchmark:frameworks
```

If you only want the interactive stress workloads:

```bash
pnpm test:performance:stress
```

If you only want the cell-buffer hot paths:

```bash
pnpm vitest run tests/core/buffer-perf.test.ts
```
