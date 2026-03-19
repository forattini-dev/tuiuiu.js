import { describe, expect, it } from 'vitest';

import {
  advanceGame,
  countMeteors,
  createNewGameState,
  fireBullet,
  getPlayerSpeedPercent,
  togglePause,
  type Arena,
  type GameState,
  type Meteor,
} from '../../examples/games/tuiuiu-meteor.js';

const arena: Arena = {
  width: 60,
  height: 22,
  columns: 120,
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

describe('tuiuiu-meteor', () => {
  it('creates a playable opening wave', () => {
    const state = createNewGameState(arena);

    expect(state.lives).toBe(3);
    expect(state.phase).toBe('playing');
    expect(countMeteors(state)).toBeGreaterThan(0);
    expect(state.meteors.every((meteor) => meteor.size === 3)).toBe(true);
  });

  it('fires a plasma round and records telemetry', () => {
    const state = createNewGameState(arena);
    const fired = fireBullet(state, arena);

    expect(fired.bullets).toHaveLength(1);
    expect(fired.telemetry.shotsFired).toBe(1);
    expect(fired.ship.fireCooldown).toBeGreaterThan(0);
  });

  it('splits a large meteor into two medium fragments', () => {
    const state = createNewGameState(arena);
    const target: Meteor = {
      id: 900,
      x: 18,
      y: 10,
      vx: 0,
      vy: 0,
      size: 3,
    };

    const next = advanceGame(
      withState(state, {
        meteors: [target],
        bullets: [
          {
            id: 901,
            x: 18,
            y: 10,
            vx: 0,
            vy: 0,
            ttl: 10,
          },
        ],
        nextId: 902,
      }),
      arena
    );

    expect(next.score).toBe(20);
    expect(next.telemetry.meteorsDestroyed).toBe(1);
    expect(next.telemetry.fragmentsCreated).toBe(2);
    expect(next.meteors).toHaveLength(2);
    expect(next.meteors.every((meteor) => meteor.size === 2)).toBe(true);
  });

  it('removes a shard without splitting when another meteor remains', () => {
    const state = createNewGameState(arena);
    const shard: Meteor = {
      id: 910,
      x: 14,
      y: 8,
      vx: 0,
      vy: 0,
      size: 1,
    };
    const survivor: Meteor = {
      id: 911,
      x: 35,
      y: 12,
      vx: 0,
      vy: 0,
      size: 3,
    };

    const next = advanceGame(
      withState(state, {
        meteors: [shard, survivor],
        bullets: [
          {
            id: 912,
            x: 14,
            y: 8,
            vx: 0,
            vy: 0,
            ttl: 10,
          },
        ],
        nextId: 913,
      }),
      arena
    );

    expect(next.score).toBe(100);
    expect(next.telemetry.fragmentsCreated).toBe(0);
    expect(next.meteors).toHaveLength(1);
    expect(next.meteors[0]?.id).toBe(911);
  });

  it('consumes a life and respawns the ship after a collision', () => {
    const state = createNewGameState(arena);

    const next = advanceGame(
      withState(state, {
        meteors: [
          {
            id: 920,
            x: state.ship.x,
            y: state.ship.y,
            vx: 0,
            vy: 0,
            size: 2,
          },
        ],
      }),
      arena
    );

    expect(next.lives).toBe(2);
    expect(next.phase).toBe('playing');
    expect(next.ship.respawnTicks).toBeGreaterThan(0);
  });

  it('advances to the next wave when the field is cleared', () => {
    const state = createNewGameState(arena);
    const next = advanceGame(
      withState(state, {
        meteors: [],
      }),
      arena
    );

    expect(next.level).toBe(2);
    expect(next.score).toBe(50);
    expect(next.meteors.length).toBeGreaterThan(0);
    expect(next.telemetry.wavesCleared).toBe(1);
  });

  it('pauses without advancing the simulation', () => {
    const state = createNewGameState(arena);
    const drifting = withState(state, {
      ship: {
        ...state.ship,
        vx: 0.8,
        vy: 0.3,
      },
    });
    const paused = togglePause(drifting);
    const advanced = advanceGame(paused, arena);

    expect(getPlayerSpeedPercent(paused)).toBeGreaterThan(0);
    expect(paused.phase).toBe('paused');
    expect(advanced.tick).toBe(paused.tick);
    expect(advanced.ship.x).toBe(paused.ship.x);
    expect(advanced.ship.y).toBe(paused.ship.y);
  });
});
