# Tuiuiu Snake

`tuiuiu-snake` is a grid-chase arcade showcase for `tuiuiu.js`.

It demonstrates deterministic food spawning, queued turn handling, score ramps, collision rules, and a testable movement engine exported from the example module.

## Run

```bash
pnpm example tuiuiu-snake
```

## What It Shows

- A classic snake arena rendered directly in terminal cells
- Queued turns so fast input can be buffered cleanly between movement ticks
- Seeded food spawning for reproducible gameplay tests
- Growth, score progression, and level-based speed ramps
- Pause, restart, help, and game-over overlays around the same core state machine
- Pure gameplay helpers that can be validated without driving the full TUI

## Controls

| Keys | Action |
|------|--------|
| `Up` / `W` / `K` | Turn up |
| `Down` / `S` / `J` | Turn down |
| `Left` / `A` / `H` | Turn left |
| `Right` / `D` / `L` | Turn right |
| `P` | Pause / resume |
| `R` | Restart |
| `F1` | Toggle help overlay |
| `Q` / `Esc` | Quit |

## Gameplay Loop

1. Guide the snake into food without clipping the walls.
2. Queue turns cleanly so direction changes land on the next movement step.
3. Every food increases score and body length.
4. Every five foods raises the level and shortens the movement interval.

## UI Notes

- The header includes live FPS via [`useFps`](/hooks/use-fps.md).
- The arena uses `createCanvas()` for consistent colored cell output.
- Help, pause, and crash states use [`Modal`](/components/organisms/modal.md).
- The HUD combines [`Digits`](/components/visual.md), [`Badge`](/components/atoms/badge.md), [`DataRow`](/components/atoms/data-row.md), and [`Panel`](/components/layout.md).

## Exported Gameplay Helpers

These helpers are exported from `examples/games/tuiuiu-snake.ts`:

- `getArena()`
- `createNewGameState()`
- `queueDirection()`
- `stepSnake()`
- `advanceGame()`
- `spawnFood()`
- `togglePause()`
- `createBodyFromPoints()`
- `countOccupiedCells()`
- `getMoveFrames()`

## Source And Tests

- Source: `examples/games/tuiuiu-snake.ts`
- Focused tests: `tests/integration/tuiuiu-snake.test.ts`

Run the focused test with:

```bash
pnpm exec vitest run tests/integration/tuiuiu-snake.test.ts
```

## When To Read This Example

Read this one if you want to learn how to:

- Keep a deterministic arcade state machine outside the render tree
- Model queued input and collision outcomes with pure exported helpers
- Build a responsive game HUD around a compact terminal arena
