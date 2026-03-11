import { describe, expect, it } from 'vitest';

import {
  advanceGame,
  buildThreatHeatmap,
  countAlive,
  createNewGameState,
  firePlayerBullet,
  getAccuracy,
  getInvaderPosition,
  getPlayerY,
  getShieldIntegrity,
  getThreatLevel,
  togglePause,
  type Arena,
} from '../../examples/tuiuiu-invaders.js';

const arena: Arena = {
  width: 60,
  height: 20,
  columns: 120,
  rows: 40,
  compact: false,
  playable: true,
};

describe('tuiuiu-invaders', () => {
  it('creates a playable opening wave', () => {
    const state = createNewGameState(arena);

    expect(state.lives).toBe(3);
    expect(state.phase).toBe('playing');
    expect(countAlive(state.invaders)).toBeGreaterThan(0);
    expect(state.bullets).toHaveLength(0);
  });

  it('limits the player to a single active shot', () => {
    const state = createNewGameState(arena);
    const firstShot = firePlayerBullet(state, arena);
    const secondShot = firePlayerBullet(firstShot, arena);

    expect(secondShot.bullets.filter((bullet) => bullet.owner === 'player')).toHaveLength(1);
    expect(secondShot.telemetry.shotsFired).toBe(1);
  });

  it('awards score when a player bullet destroys an invader', () => {
    const state = createNewGameState(arena);
    const target = state.invaders.find((invader) => invader.alive)!;
    const position = getInvaderPosition(state, target);

    const next = advanceGame(
      {
        ...state,
        respawnTicks: 0,
        bullets: [
          {
            id: state.nextId,
            owner: 'player',
            x: position.x + 1,
            y: position.y + 1,
            dy: -1,
          },
        ],
        nextId: state.nextId + 1,
      },
      arena
    );

    expect(countAlive(next.invaders)).toBe(countAlive(state.invaders) - 1);
    expect(next.score).toBeGreaterThan(state.score);
  });

  it('consumes a life when an invader shot reaches the player', () => {
    const state = createNewGameState(arena);

    const next = advanceGame(
      {
        ...state,
        respawnTicks: 0,
        bullets: [
          {
            id: state.nextId,
            owner: 'invader',
            x: state.playerX + 1,
            y: getPlayerY(arena) - 1,
            dy: 1,
          },
        ],
        nextId: state.nextId + 1,
      },
      arena
    );

    expect(next.lives).toBe(2);
    expect(next.phase).toBe('playing');
    expect(next.respawnTicks).toBeGreaterThan(0);
  });

  it('pauses and resumes without advancing the simulation', () => {
    const state = createNewGameState(arena);
    const paused = togglePause(state);
    const advancedWhilePaused = advanceGame(paused, arena);
    const resumed = togglePause(paused);

    expect(paused.phase).toBe('paused');
    expect(advancedWhilePaused.tick).toBe(paused.tick);
    expect(resumed.phase).toBe('playing');
  });

  it('builds telemetry for the richer HUD widgets', () => {
    const state = createNewGameState(arena);
    const fired = firePlayerBullet(state, arena);
    const shields = getShieldIntegrity(fired);
    const threat = getThreatLevel(fired, arena);
    const heatmap = buildThreatHeatmap(fired, arena);

    expect(getAccuracy(fired)).toBe(0);
    expect(shields).toEqual([100, 100, 100, 100]);
    expect(threat).toBeGreaterThan(0);
    expect(heatmap).toHaveLength(5);
    expect(heatmap[0]).toHaveLength(8);
    expect(heatmap.flat().some((value) => value > 0)).toBe(true);
  });
});
