# Tuiuiu Tetris

`tuiuiu-tetris` is a falling-block puzzle showcase for `tuiuiu.js`.

It demonstrates a deterministic tetromino bag, hold/next preview UX, line-clear scoring, level-based gravity, and a testable rule engine exported from the example module.

## Run

```bash
pnpm example tuiuiu-tetris
```

## What It Shows

- A classic 10×20 falling-block well rendered directly in terminal cells
- Deterministic bag randomization for reproducible puzzle tests
- Rotation with wall kicks plus hold and next preview routing
- Soft drop, hard drop, line clear scoring, combo tracking, and level progression
- A responsive HUD with score, queue, hold, telemetry, overlays, and FPS
- Pure gameplay helpers that can be validated without driving the full TUI

## Controls

| Keys | Action |
|------|--------|
| `Left` / `A` / `H` | Move piece left |
| `Right` / `D` / `L` | Move piece right |
| `Down` / `S` / `J` | Soft drop |
| `Up` / `X` / `K` | Rotate clockwise |
| `Z` | Rotate counter-clockwise |
| `C` | Hold / swap piece |
| `Space` | Hard drop |
| `P` | Pause / resume |
| `F1` | Toggle help overlay |
| `R` | Restart |
| `Q` / `Esc` | Quit |

## Gameplay Loop

1. Stack pieces to complete horizontal rows.
2. Clear singles, doubles, triples, or tetrises for larger score spikes.
3. Every 10 cleared lines raises the level and speeds up gravity.
4. Use hold and hard drop intentionally to survive tighter stacks.

## UI Notes

- The header includes live FPS via [`useFps`](/hooks/use-fps.md).
- The well and previews are rendered with `createCanvas()` for predictable per-cell color output.
- Help, pause, and game-over states use [`Modal`](/components/organisms/modal.md).
- The HUD combines [`Digits`](/components/visual.md), [`Badge`](/components/atoms/badge.md), [`DataRow`](/components/atoms/data-row.md), and [`Panel`](/templates/layout.md).

## Exported Gameplay Helpers

These helpers are exported from `examples/games/tuiuiu-tetris.ts`:

- `getArena()`
- `createNewGameState()`
- `createBoardFromRows()`
- `moveActivePiece()`
- `rotateActivePiece()`
- `softDrop()`
- `hardDrop()`
- `holdActivePiece()`
- `togglePause()`
- `advanceGame()`
- `spawnNextPiece()`
- `countFilledCells()`
- `getGhostY()`
- `getGravityFrames()`

## Source And Tests

- Source: `examples/games/tuiuiu-tetris.ts`
- Focused tests: `tests/integration/tuiuiu-tetris.test.ts`

Run the focused test with:

```bash
pnpm exec vitest run tests/integration/tuiuiu-tetris.test.ts
```

## When To Read This Example

Read this one if you want to learn how to:

- Keep a deterministic puzzle state machine outside the render tree
- Model hold/queue/rotation rules with pure exported helpers
- Drive a full game HUD around a compact terminal board
