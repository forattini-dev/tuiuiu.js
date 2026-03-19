import { describe, expect, it } from 'vitest';

import {
  advanceGame,
  countOccupiedCells,
  createBodyFromPoints,
  createNewGameState,
  getArena,
  queueDirection,
  spawnFood,
  stepSnake,
  togglePause,
  type Direction,
  type SnakeState,
} from '../../examples/games/tuiuiu-snake.js';

const arena = getArena(120, 40);

function withState(state: SnakeState, overrides: Partial<SnakeState>): SnakeState {
  return {
    ...state,
    ...overrides,
  };
}

describe('tuiuiu-snake', () => {
  it('creates a playable opening run with food off the snake body', () => {
    const state = createNewGameState(arena);

    expect(state.phase).toBe('playing');
    expect(state.level).toBe(1);
    expect(state.score).toBe(0);
    expect(state.snake.length).toBe(4);
    expect(state.food).not.toBeNull();
    expect(state.snake.some((segment) => segment.x === state.food?.x && segment.y === state.food?.y)).toBe(false);
    expect(countOccupiedCells(state)).toBe(4);
  });

  it('applies queued turns in order across movement steps', () => {
    const state = createNewGameState(arena);
    const queued = queueDirection(queueDirection(state, 'up'), 'left');
    const first = stepSnake(queued, arena);
    const second = stepSnake(first, arena);

    expect(first.direction).toBe('up');
    expect(first.snake[0]).toEqual({ x: state.snake[0]!.x, y: state.snake[0]!.y - 1 });
    expect(second.direction).toBe('left');
    expect(second.snake[0]).toEqual({ x: first.snake[0]!.x - 1, y: first.snake[0]!.y });
  });

  it('ignores an immediate reverse turn', () => {
    const state = createNewGameState(arena);
    const reversed = queueDirection(state, 'left');

    expect(reversed.turnQueue).toEqual([]);
    expect(reversed.direction).toBe('right');
  });

  it('eats food, grows, scores, and respawns food deterministically off the body', () => {
    const state = createNewGameState(arena);
    const head = state.snake[0]!;
    const prepared = withState(state, {
      food: { x: head.x + 1, y: head.y },
      seed: 12345,
    });
    const eaten = stepSnake(prepared, arena);

    expect(eaten.score).toBe(10);
    expect(eaten.foodsEaten).toBe(1);
    expect(eaten.snake.length).toBe(prepared.snake.length + 1);
    expect(eaten.food).not.toBeNull();
    expect(eaten.snake.some((segment) => segment.x === eaten.food?.x && segment.y === eaten.food?.y)).toBe(false);
  });

  it('levels up on the fifth food and increases the score payout', () => {
    const state = createNewGameState(arena);
    const head = state.snake[0]!;
    const prepared = withState(state, {
      foodsEaten: 4,
      level: 1,
      score: 40,
      food: { x: head.x + 1, y: head.y },
    });
    const leveled = stepSnake(prepared, arena);

    expect(leveled.foodsEaten).toBe(5);
    expect(leveled.level).toBe(2);
    expect(leveled.score).toBe(60);
  });

  it('crashes on walls', () => {
    const state = createNewGameState(arena);
    const crashed = stepSnake(
      withState(state, {
        snake: createBodyFromPoints([
          { x: 0, y: 5 },
          { x: 1, y: 5 },
          { x: 2, y: 5 },
          { x: 3, y: 5 },
        ]),
        direction: 'left',
        turnQueue: [],
      }),
      arena,
    );

    expect(crashed.phase).toBe('game-over');
    expect(crashed.telemetry.wallCrashes).toBe(1);
  });

  it('crashes on self collision', () => {
    const state = createNewGameState(arena);
    const crashed = stepSnake(
      withState(state, {
        snake: createBodyFromPoints([
          { x: 6, y: 6 },
          { x: 5, y: 6 },
          { x: 5, y: 7 },
          { x: 6, y: 7 },
          { x: 7, y: 7 },
          { x: 7, y: 6 },
        ]),
        direction: 'down',
        turnQueue: [],
      }),
      arena,
    );

    expect(crashed.phase).toBe('game-over');
    expect(crashed.telemetry.selfCrashes).toBe(1);
  });

  it('pause freezes tick advancement and movement', () => {
    const state = createNewGameState(arena);
    const paused = togglePause(state);
    const advanced = advanceGame(paused, arena);

    expect(paused.phase).toBe('paused');
    expect(advanced.tick).toBe(paused.tick);
    expect(advanced.snake).toEqual(paused.snake);
  });

  it('spawns the same food location for the same seeded occupancy', () => {
    const base = createNewGameState(arena);
    const template = withState(base, {
      snake: createBodyFromPoints([
        { x: 8, y: 8 },
        { x: 7, y: 8 },
        { x: 6, y: 8 },
        { x: 5, y: 8 },
      ]),
      food: null,
      seed: 777,
    });

    const left = spawnFood(template);
    const right = spawnFood(template);

    expect(left.food).toEqual(right.food);
    expect(left.seed).toBe(right.seed);
  });
});
