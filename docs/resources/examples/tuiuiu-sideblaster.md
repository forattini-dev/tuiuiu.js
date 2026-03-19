# Tuiuiu Sideblaster

`tuiuiu-sideblaster` is a horizontal shoot'em up showcase for `tuiuiu.js`.

It demonstrates a scrolling combat lane, larger sprites, faster forward lasers, enemy waves, and a responsive heads-up display backed by exported gameplay helpers.

## Run

```bash
pnpm example tuiuiu-sideblaster
```

## What It Shows

- A side-scrolling shmup loop in a terminal-friendly lane
- Larger player and enemy sprites rendered directly on the board
- Fast forward lasers that visually stretch across the corridor
- Enemy formations, enemy fire, breaches, score pressure, overlays, and FPS
- Pure simulation helpers that can be covered with focused integration tests

## Controls

| Keys | Action |
|------|--------|
| `Arrows` / `WASD` | Move ship |
| `Space` | Fire forward laser |
| `P` | Pause / resume |
| `F1` | Toggle help overlay |
| `R` | Restart |
| `Q` / `Esc` | Quit |

## Gameplay Loop

1. Hold the left side of the lane.
2. Destroy incoming enemy formations before they breach.
3. Survive enemy fire and direct collisions.
4. Clear all active enemies plus the queued wave budget to advance.

Unlike `tuiuiu-meteor`, this example does not wrap. Pressure builds from right-to-left wave progression and breach risk.

## UI Notes

- The header includes live FPS via [`useFps`](/hooks/use-fps.md).
- The board uses `createCanvas()` for the lane, enemies, lasers, and explosions.
- Help, pause, and game-over screens use [`Modal`](/components/organisms/modal.md).
- The telemetry sidebar combines [`Gauge`](/components/viz/gauges.md), [`ProgressBar`](/components/atoms/progress-bar.md), [`Sparkline`](/components/viz/sparkline.md), [`Digits`](/components/visual.md), [`DataRow`](/components/atoms/data-row.md), and [`StatusIndicator`](/components/atoms/status-indicator.md).

## Exported Gameplay Helpers

These helpers are exported from `examples/games/tuiuiu-sideblaster.ts`:

- `getArena()`
- `createNewGameState()`
- `movePlayer()`
- `firePlayerShot()`
- `togglePause()`
- `advanceGame()`
- `countEnemies()`
- `getAccuracy()`
- `getThreatLevel()`

## Source And Tests

- Source: `examples/games/tuiuiu-sideblaster.ts`
- Focused tests: `tests/integration/tuiuiu-sideblaster.test.ts`

Run the focused test with:

```bash
pnpm exec vitest run tests/integration/tuiuiu-sideblaster.test.ts
```

## When To Read This Example

Read this one if you want to learn how to:

- Model a scrolling shooter without leaving a fixed terminal grid
- Handle larger sprites and longer lasers in collision logic
- Track wave pressure and breach risk in a HUD-friendly way
