import { describe, expect, it } from 'vitest';

import {
  advanceGame,
  createBoardFromRows,
  createNewGameState,
  getArena,
  hardDrop,
  holdActivePiece,
  moveActivePiece,
  rotateActivePiece,
  softDrop,
  spawnNextPiece,
  togglePause,
  countFilledCells,
  type ActivePiece,
  type GameState,
} from '../../examples/games/tuiuiu-tetris.js';

const arena = getArena(120, 40);

function withState(state: GameState, overrides: Partial<GameState>): GameState {
  return {
    ...state,
    ...overrides,
  };
}

function withActive(state: GameState, active: ActivePiece): GameState {
  return {
    ...state,
    active,
  };
}

describe('tuiuiu-tetris', () => {
  it('creates a playable opening stack state', () => {
    const state = createNewGameState(arena);

    expect(state.phase).toBe('playing');
    expect(state.level).toBe(1);
    expect(state.lines).toBe(0);
    expect(state.hold).toBeNull();
    expect(state.queue.length).toBeGreaterThanOrEqual(5);
    expect(countFilledCells(state.board)).toBe(0);
  });

  it('moves pieces inside the well and stops at the wall', () => {
    const state = createNewGameState(arena);
    const shiftedLeft = moveActivePiece(withActive(state, { ...state.active, x: 1 }), -1);
    const blockedLeft = moveActivePiece(withActive(state, { ...state.active, x: 0 }), -1);

    expect(shiftedLeft.active.x).toBe(0);
    expect(blockedLeft.active.x).toBe(0);
  });

  it('rotates with a wall kick when an I piece would overflow', () => {
    const state = createNewGameState(arena);
    const rotated = rotateActivePiece(
      withActive(state, {
        type: 'I',
        rotation: 1,
        x: 8,
        y: 0,
      }),
      1,
    );

    expect(rotated.active.rotation).toBe(2);
    expect(rotated.active.x).toBe(6);
  });

  it('hard-drops a piece, locks it, and restores hold availability', () => {
    const state = createNewGameState(arena);
    const held = holdActivePiece(
      withState(state, {
        active: { type: 'T', rotation: 0, x: 3, y: 0 },
        queue: ['O', 'L', 'S', 'Z', 'J'],
        hold: null,
        canHold: true,
      }),
    );
    const dropped = hardDrop(held);

    expect(dropped.telemetry.hardDrops).toBe(1);
    expect(dropped.telemetry.piecesLocked).toBe(1);
    expect(dropped.canHold).toBe(true);
    expect(countFilledCells(dropped.board)).toBe(4);
  });

  it('scores a tetris when a vertical I clears four rows', () => {
    const state = createNewGameState(arena);
    const preparedRows = [
      ...Array.from({ length: 16 }, () => '..........'),
      'JJJJ.JJJJJ',
      'JJJJ.JJJJJ',
      'JJJJ.JJJJJ',
      'JJJJ.JJJJJ',
    ];
    const prepared = withState(
      withActive(state, {
        type: 'I',
        rotation: 1,
        x: 2,
        y: 0,
      }),
      {
        board: createBoardFromRows(preparedRows),
      },
    );
    const cleared = hardDrop(prepared);

    expect(cleared.lines).toBe(4);
    expect(cleared.telemetry.lineClears).toBe(4);
    expect(cleared.telemetry.tetrises).toBe(1);
    expect(cleared.score).toBeGreaterThanOrEqual(800);
    expect(countFilledCells(cleared.board)).toBe(0);
  });

  it('allows one hold per lock cycle', () => {
    const state = createNewGameState(arena);
    const firstHold = holdActivePiece(
      withState(state, {
        active: { type: 'I', rotation: 0, x: 3, y: 0 },
        queue: ['O', 'T', 'L', 'S', 'Z'],
        hold: null,
        canHold: true,
      }),
    );
    const secondHold = holdActivePiece(firstHold);

    expect(firstHold.hold).toBe('I');
    expect(firstHold.active.type).toBe('O');
    expect(firstHold.canHold).toBe(false);
    expect(secondHold.active.type).toBe('O');
    expect(secondHold.hold).toBe('I');
  });

  it('top-outs when the spawn zone is blocked', () => {
    const state = createNewGameState(arena);
    const blocked = withState(state, {
      board: createBoardFromRows([
        'JJJJJJJJJJ',
        'JJJJJJJJJJ',
        'JJJJJJJJJJ',
        'JJJJJJJJJJ',
        ...Array.from({ length: 16 }, () => '..........'),
      ]),
    });
    const next = spawnNextPiece(blocked);

    expect(next.phase).toBe('game-over');
  });

  it('soft-drops score incrementally and pause freezes gravity', () => {
    const state = createNewGameState(arena);
    const dropped = softDrop(state);
    const paused = togglePause(dropped);
    const advanced = advanceGame(paused, arena);

    expect(dropped.score).toBe(1);
    expect(dropped.active.y).toBeGreaterThan(state.active.y);
    expect(paused.phase).toBe('paused');
    expect(advanced.tick).toBe(paused.tick);
    expect(advanced.active.y).toBe(paused.active.y);
  });
});
