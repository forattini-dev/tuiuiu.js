import { describe, expect, it } from 'vitest';

import {
  advanceGame,
  countEnemies,
  createNewGameState,
  firePlayerShot,
  getAccuracy,
  movePlayer,
  togglePause,
  type Arena,
  type Enemy,
  type GameState,
} from '../../examples/games/tuiuiu-sideblaster.js';

const arena: Arena = {
  width: 64,
  height: 22,
  columns: 128,
  rows: 40,
  compact: false,
  playable: true,
};

function withState(state: GameState, overrides: Partial<GameState>): GameState {
  return {
    ...state,
    ...overrides,
  };
}

describe('tuiuiu-sideblaster', () => {
  it('creates a playable opening wave', () => {
    const state = createNewGameState(arena);

    expect(state.lives).toBe(3);
    expect(state.phase).toBe('playing');
    expect(countEnemies(state)).toBeGreaterThan(0);
    expect(state.waveRemaining).toBeGreaterThanOrEqual(0);
  });

  it('fires a forward shot and records telemetry', () => {
    const state = createNewGameState(arena);
    const fired = firePlayerShot(state);

    expect(fired.bullets).toHaveLength(1);
    expect(fired.telemetry.shotsFired).toBe(1);
    expect(fired.player.fireCooldown).toBeGreaterThan(0);
  });

  it('destroys a drone and awards score', () => {
    const state = createNewGameState(arena);
    const target: Enemy = {
      id: 900,
      type: 'drone',
      x: 14,
      y: 9,
      vx: 0,
      vy: 0,
      hp: 1,
      maxHp: 1,
      fireCooldown: 9,
    };

    const next = advanceGame(
      withState(state, {
        enemies: [target],
        waveRemaining: 1,
        bullets: [
          {
            id: 901,
            owner: 'player',
            x: 14,
            y: 9,
            vx: 0,
            vy: 0,
            ttl: 10,
          },
        ],
        nextId: 902,
      }),
      arena
    );

    expect(next.score).toBe(25);
    expect(next.telemetry.enemiesDestroyed).toBe(1);
    expect(countEnemies(next)).toBe(0);
    expect(getAccuracy(next)).toBe(0);
  });

  it('consumes a life when an enemy shot reaches the player', () => {
    const state = createNewGameState(arena);

    const next = advanceGame(
      withState(state, {
        enemies: [],
        waveRemaining: 1,
        bullets: [
          {
            id: 910,
            owner: 'enemy',
            x: state.player.x,
            y: state.player.y,
            vx: 0,
            vy: 0,
            ttl: 10,
          },
        ],
      }),
      arena
    );

    expect(next.lives).toBe(2);
    expect(next.phase).toBe('playing');
    expect(next.player.respawnTicks).toBeGreaterThan(0);
  });

  it('counts a left-edge breach as damage', () => {
    const state = createNewGameState(arena);

    const next = advanceGame(
      withState(state, {
        enemies: [
          {
            id: 920,
            type: 'drone',
            x: -5,
            y: 8,
            vx: -0.5,
            vy: 0,
            hp: 1,
            maxHp: 1,
            fireCooldown: 10,
          },
        ],
        waveRemaining: 1,
      }),
      arena
    );

    expect(next.lives).toBe(2);
    expect(next.player.respawnTicks).toBeGreaterThan(0);
  });

  it('advances to the next wave when the lane is cleared', () => {
    const state = createNewGameState(arena);
    const next = advanceGame(
      withState(state, {
        enemies: [],
        bullets: [],
        waveRemaining: 0,
      }),
      arena
    );

    expect(next.level).toBe(2);
    expect(next.score).toBe(80);
    expect(next.telemetry.wavesCleared).toBe(1);
    expect(countEnemies(next)).toBeGreaterThan(0);
  });

  it('pauses without advancing the simulation', () => {
    const state = createNewGameState(arena);
    const moved = movePlayer(state, 1, 1, arena);
    const paused = togglePause(moved);
    const advanced = advanceGame(paused, arena);

    expect(paused.phase).toBe('paused');
    expect(advanced.tick).toBe(paused.tick);
    expect(advanced.player.x).toBe(paused.player.x);
    expect(advanced.player.y).toBe(paused.player.y);
  });
});
