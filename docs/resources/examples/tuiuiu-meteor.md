# Tuiuiu Meteor

`tuiuiu-meteor` is an Asteroids-style arcade showcase for `tuiuiu.js`.

It is intentionally more complex than the onboarding examples and exists to demonstrate a full gameplay loop built with exported simulation helpers plus a rich terminal HUD.

## Run

```bash
pnpm example tuiuiu-meteor
```

## What It Shows

- Wrap-around movement and momentum-based ship control
- Fragmenting meteors with large, medium, and small variants
- A responsive game HUD with score, telemetry, logs, overlays, and FPS
- A testable architecture where gameplay rules live in exported pure helpers

## Controls

| Keys | Action |
|------|--------|
| `Left` / `Right` | Rotate ship |
| `Up` | Thrust forward |
| `Down` | Brake drift |
| `Space` | Fire |
| `P` | Pause / resume |
| `F1` | Toggle help overlay |
| `R` | Restart |
| `Q` / `Esc` | Quit |

## Gameplay Loop

1. Survive the current meteor field.
2. Break large meteors into medium fragments.
3. Break medium fragments into shards.
4. Clear the sector to trigger the next wave and wave bonus.

The ship wraps around the arena edges, so movement pressure comes from momentum and positioning rather than walls.

## UI Notes

- The header includes live FPS via [`useFps`](/hooks/use-fps.md).
- The board is rendered with `createCanvas()` for direct ASCII drawing.
- Pause, help, and game-over states use [`Modal`](/components/organisms/modal.md).
- Telemetry panels use [`Digits`](/components/visual.md), [`Gauge`](/components/viz/gauges.md), [`ProgressBar`](/components/atoms/progress-bar.md), [`Sparkline`](/components/viz/sparkline.md), [`DataRow`](/components/atoms/data-row.md), and [`StatusIndicator`](/components/atoms/status-indicator.md).

## Exported Gameplay Helpers

These helpers are exported from `examples/games/tuiuiu-meteor.ts` so the example can be tested without driving the full TUI:

- `getArena()`
- `createNewGameState()`
- `rotateShip()`
- `thrustShip()`
- `stabilizeShip()`
- `fireBullet()`
- `togglePause()`
- `advanceGame()`
- `countMeteors()`
- `getAccuracy()`
- `getPlayerSpeedPercent()`
- `getThreatLevel()`

## Source And Tests

- Source: `examples/games/tuiuiu-meteor.ts`
- Focused tests: `tests/integration/tuiuiu-meteor.test.ts`

Run the focused test with:

```bash
pnpm exec vitest run tests/integration/tuiuiu-meteor.test.ts
```

## When To Read This Example

Read this one if you want to learn how to:

- Keep animation and game rules outside the render tree
- Build a richer responsive HUD around a canvas-driven playfield
- Export pure state transitions for reliable gameplay tests
