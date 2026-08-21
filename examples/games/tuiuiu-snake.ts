/**
 * tuiuiu-snake
 *
 * Grid-chase arcade showcase for tuiuiu.js.
 *
 * Features:
 * - Deterministic snake movement with queued turns
 * - Seeded food spawning, growth, scoring, and speed progression
 * - Wall/self collision with restart and pause flows
 * - Responsive HUD with score, telemetry, overlays, and FPS
 *
 * Run: pnpm example tuiuiu-snake
 */

import { pathToFileURL } from 'node:url';

import {
  render,
  Badge,
  Box,
  DataRow,
  Digits,
  Modal,
  Panel,
  Text,
  darkTheme,
  setTheme,
  useApp,
  useShortcut,
  useInterval,
  useState,
  useTerminalSize,
} from '../../src/index.js';
import { createCanvas } from '../../src/primitives/canvas.js';
import { useFps } from '../../src/hooks/use-fps.js';
import type { VNode } from '../../src/utils/types.js';

setTheme(darkTheme);

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Phase = 'playing' | 'paused' | 'game-over';

export interface Point {
  x: number;
  y: number;
}

export interface Arena {
  width: number;
  height: number;
  columns: number;
  rows: number;
  compact: boolean;
  playable: boolean;
}

interface Telemetry {
  foodsEaten: number;
  turnsQueued: number;
  longestLength: number;
  wallCrashes: number;
  selfCrashes: number;
}

export interface SnakeState {
  phase: Phase;
  snake: Point[];
  direction: Direction;
  turnQueue: Direction[];
  food: Point | null;
  score: number;
  hiScore: number;
  foodsEaten: number;
  level: number;
  tick: number;
  moves: number;
  seed: number;
  history: string[];
  telemetry: Telemetry;
}

const TICK_MS = 50;
const DEFAULT_SEED = 0x51a9e7;
const GRID_WIDTH = 18;
const GRID_HEIGHT = 16;
const CELL_RENDER_WIDTH = 3;
const BOARD_PIXEL_WIDTH = GRID_WIDTH * CELL_RENDER_WIDTH;
const MIN_COLUMNS = 74;
const MIN_ROWS = 28;
const COMPACT_COLUMNS = 100;
const COMPACT_ROWS = 34;
const HISTORY_LIMIT = 6;
const FOOD_SCORE = 10;
const LEVEL_STEP = 5;
const LEFT_RAIL_WIDTH = 22;
const RIGHT_RAIL_WIDTH = 26;
const COMPACT_STAGE_WIDTH = BOARD_PIXEL_WIDTH + 6;
const WIDE_STAGE_WIDTH = LEFT_RAIL_WIDTH + (BOARD_PIXEL_WIDTH + 2) + RIGHT_RAIL_WIDTH + 4;

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function pointsEqual(left: Point, right: Point): boolean {
  return left.x === right.x && left.y === right.y;
}

function pushHistory(history: string[], entry: string): string[] {
  return [entry, ...history].slice(0, HISTORY_LIMIT);
}

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function isOppositeDirection(left: Direction, right: Direction): boolean {
  return (
    (left === 'up' && right === 'down')
    || (left === 'down' && right === 'up')
    || (left === 'left' && right === 'right')
    || (left === 'right' && right === 'left')
  );
}

function movePoint(point: Point, direction: Direction): Point {
  const vector = DIRECTION_VECTORS[direction];
  return {
    x: point.x + vector.x,
    y: point.y + vector.y,
  };
}

function isInsideArena(point: Point): boolean {
  return point.x >= 0 && point.x < GRID_WIDTH && point.y >= 0 && point.y < GRID_HEIGHT;
}

export function getArena(columns: number, rows: number): Arena {
  return {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    columns,
    rows,
    compact: columns < COMPACT_COLUMNS || rows < COMPACT_ROWS,
    playable: columns >= MIN_COLUMNS && rows >= MIN_ROWS,
  };
}

export function countOccupiedCells(state: SnakeState): number {
  return state.snake.length;
}

export function createBodyFromPoints(points: Point[]): Point[] {
  return points.map(clonePoint);
}

export function getMoveFrames(level: number): number {
  return Math.max(1, Math.ceil((8 - Math.min(6, level - 1)) / 2));
}

function computeLevel(foodsEaten: number): number {
  return Math.floor(foodsEaten / LEVEL_STEP) + 1;
}

function createInitialSnake(): Point[] {
  const centerX = Math.floor(GRID_WIDTH / 2);
  const centerY = Math.floor(GRID_HEIGHT / 2);
  return [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
    { x: centerX - 3, y: centerY },
  ];
}

export function spawnFood(state: SnakeState): SnakeState {
  const occupied = new Set(state.snake.map((segment) => `${segment.x},${segment.y}`));
  const available: Point[] = [];

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) {
    return {
      ...state,
      food: null,
      phase: 'game-over',
      history: pushHistory(state.history, 'Arena cleared. Perfect run.'),
      hiScore: Math.max(state.hiScore, state.score),
    };
  }

  const seed = nextSeed(state.seed);
  const index = seed % available.length;
  return {
    ...state,
    food: available[index] ?? null,
    seed,
  };
}

export function createNewGameState(_arena: Arena, hiScore = 0, seed = DEFAULT_SEED): SnakeState {
  const initial: SnakeState = {
    phase: 'playing',
    snake: createInitialSnake(),
    direction: 'right',
    turnQueue: [],
    food: null,
    score: 0,
    hiScore,
    foodsEaten: 0,
    level: 1,
    tick: 0,
    moves: 0,
    seed,
    history: ['Collect food. Don’t bite yourself.'],
    telemetry: {
      foodsEaten: 0,
      turnsQueued: 0,
      longestLength: 4,
      wallCrashes: 0,
      selfCrashes: 0,
    },
  };

  return spawnFood(initial);
}

function withDirection(state: SnakeState, direction: Direction, turnQueue: Direction[]): SnakeState {
  return {
    ...state,
    direction,
    turnQueue,
  };
}

function resolveQueuedDirection(direction: Direction, turnQueue: Direction[]): { direction: Direction; turnQueue: Direction[] } {
  if (turnQueue.length === 0) {
    return { direction, turnQueue };
  }

  const [next, ...rest] = turnQueue;
  if (!next || isOppositeDirection(direction, next)) {
    return { direction, turnQueue: rest };
  }

  return {
    direction: next,
    turnQueue: rest,
  };
}

export function queueDirection(state: SnakeState, nextDirection: Direction): SnakeState {
  if (state.phase !== 'playing') {
    return state;
  }

  const anchor = state.turnQueue[state.turnQueue.length - 1] ?? state.direction;
  if (nextDirection === anchor || isOppositeDirection(anchor, nextDirection)) {
    return state;
  }

  if (state.turnQueue.length >= 2) {
    return state;
  }

  return {
    ...state,
    turnQueue: [...state.turnQueue, nextDirection],
    telemetry: {
      ...state.telemetry,
      turnsQueued: state.telemetry.turnsQueued + 1,
    },
  };
}

function crashState(state: SnakeState, reason: 'wall' | 'self', message: string): SnakeState {
  return {
    ...state,
    phase: 'game-over',
    hiScore: Math.max(state.hiScore, state.score),
    history: pushHistory(state.history, message),
    turnQueue: [],
    telemetry: {
      ...state.telemetry,
      wallCrashes: state.telemetry.wallCrashes + (reason === 'wall' ? 1 : 0),
      selfCrashes: state.telemetry.selfCrashes + (reason === 'self' ? 1 : 0),
    },
  };
}

export function stepSnake(state: SnakeState, _arena: Arena): SnakeState {
  if (state.phase !== 'playing') {
    return state;
  }

  const resolved = resolveQueuedDirection(state.direction, state.turnQueue);
  const head = state.snake[0];
  if (!head) {
    return crashState(state, 'self', 'Snake vanished unexpectedly.');
  }

  const nextHead = movePoint(head, resolved.direction);
  if (!isInsideArena(nextHead)) {
    return crashState(
      withDirection(state, resolved.direction, resolved.turnQueue),
      'wall',
      `Crashed into the wall on move ${state.moves + 1}.`,
    );
  }

  const willEat = state.food ? pointsEqual(nextHead, state.food) : false;
  const collisionBody = willEat ? state.snake : state.snake.slice(0, -1);
  if (collisionBody.some((segment) => pointsEqual(segment, nextHead))) {
    return crashState(
      withDirection(state, resolved.direction, resolved.turnQueue),
      'self',
      `Looped into yourself at length ${state.snake.length}.`,
    );
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willEat) {
    nextSnake.pop();
  }

  let nextState: SnakeState = {
    ...state,
    snake: nextSnake,
    direction: resolved.direction,
    turnQueue: resolved.turnQueue,
    moves: state.moves + 1,
    hiScore: Math.max(state.hiScore, state.score),
    telemetry: {
      ...state.telemetry,
      longestLength: Math.max(state.telemetry.longestLength, nextSnake.length),
    },
  };

  if (!willEat) {
    return nextState;
  }

  const foodsEaten = state.foodsEaten + 1;
  const level = computeLevel(foodsEaten);
  nextState = {
    ...nextState,
    foodsEaten,
    level,
    score: state.score + FOOD_SCORE * level,
    hiScore: Math.max(state.hiScore, state.score + FOOD_SCORE * level),
    history: pushHistory(
      state.history,
      level > state.level
        ? `Food ${foodsEaten}. Level up to ${level}.`
        : `Food ${foodsEaten}. Length ${nextSnake.length}.`,
    ),
    telemetry: {
      ...nextState.telemetry,
      foodsEaten,
      longestLength: Math.max(nextState.telemetry.longestLength, nextSnake.length),
    },
  };

  return spawnFood(nextState);
}

export function togglePause(state: SnakeState): SnakeState {
  if (state.phase === 'game-over') {
    return state;
  }

  return {
    ...state,
    phase: state.phase === 'paused' ? 'playing' : 'paused',
    history: pushHistory(state.history, state.phase === 'paused' ? 'Resumed run.' : 'Paused run.'),
  };
}

export function advanceGame(state: SnakeState, arena: Arena): SnakeState {
  if (state.phase !== 'playing') {
    return state;
  }

  const tick = state.tick + 1;
  const ticking = {
    ...state,
    tick,
  };

  if (tick % getMoveFrames(state.level) !== 0) {
    return ticking;
  }

  return stepSnake(ticking, arena);
}

function getPhaseBadge(state: SnakeState): VNode {
  if (state.phase === 'game-over') {
    return Badge({ label: 'CRASHED', variant: 'danger' });
  }
  if (state.phase === 'paused') {
    return Badge({ label: 'PAUSED', variant: 'warning' });
  }
  return Badge({ label: 'LIVE', variant: 'success' });
}

function renderArena(state: SnakeState): string[] {
  const canvas = createCanvas({ width: BOARD_PIXEL_WIDTH, height: GRID_HEIGHT });

  const setWidePixel = (x: number, y: number, char: string, color?: string) => {
    const left = x * CELL_RENDER_WIDTH;
    for (let dx = 0; dx < CELL_RENDER_WIDTH; dx++) {
      canvas.setPixel(left + dx, y, char, color);
    }
  };

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const isEven = (x + y) % 2 === 0;
      setWidePixel(x, y, isEven ? '·' : '•', isEven ? '#2b3247' : '#242a3d');
    }
  }

  if (state.food) {
    setWidePixel(state.food.x, state.food.y, '◆', 'yellowBright');
  }

  state.snake.forEach((segment, index) => {
    const isHead = index === 0;
    setWidePixel(segment.x, segment.y, isHead ? '█' : '▓', isHead ? 'greenBright' : 'cyanBright');
  });

  return canvas.render();
}

function ControlsPanel(): VNode {
  return Panel(
    { title: 'Controls', borderColor: 'blueBright', padding: 1, width: RIGHT_RAIL_WIDTH },
    Text({ color: 'gray' }, '↑ ↓ ← → move'),
    Text({ color: 'gray' }, 'WASD and HJKL also work'),
    Text({ color: 'gray' }, 'P pause • R restart'),
    Text({ color: 'gray', dim: true }, 'F1 help • Q quit'),
  );
}

function StatsPanel(state: SnakeState): VNode {
  return Panel(
    { title: 'Score', borderColor: 'greenBright', padding: 1, width: LEFT_RAIL_WIDTH },
    Digits({
      value: state.score,
      style: 'minimal',
      digits: 5,
      leadingZeros: true,
      color: 'greenBright',
    }),
    DataRow({ label: 'Level', value: state.level, valueColor: 'yellow' }),
    DataRow({ label: 'Foods', value: state.foodsEaten, valueColor: 'yellowBright' }),
    DataRow({ label: 'Length', value: state.snake.length, valueColor: 'cyanBright' }),
    DataRow({ label: 'Hi-score', value: state.hiScore, valueColor: 'magentaBright' }),
    DataRow({ label: 'Speed', value: `${getMoveFrames(state.level)} ticks`, valueColor: 'cyanBright' }),
  );
}

function TelemetryPanel(state: SnakeState): VNode {
  return Panel(
    { title: 'Telemetry', borderColor: 'magentaBright', padding: 1, width: LEFT_RAIL_WIDTH },
    DataRow({ label: 'Moves', value: state.moves, valueColor: 'cyanBright' }),
    DataRow({ label: 'Queued turns', value: state.telemetry.turnsQueued, valueColor: 'blueBright' }),
    DataRow({ label: 'Longest', value: state.telemetry.longestLength, valueColor: 'greenBright' }),
    DataRow({ label: 'Wall hits', value: state.telemetry.wallCrashes, valueColor: 'redBright' }),
    DataRow({ label: 'Self hits', value: state.telemetry.selfCrashes, valueColor: 'yellow' }),
  );
}

function EventLogPanel(state: SnakeState, width: number): VNode {
  return Panel(
    { title: 'Run Log', borderColor: 'yellow', padding: 1, width },
    ...state.history.map((entry) => Text({ color: 'gray', wrap: 'truncate-end' }, entry)),
    Text({ color: 'gray', dim: true }, 'Collect food, queue clean turns, avoid wall and self collisions.'),
  );
}

function ArenaPanel(state: SnakeState, boardLines: string[]): VNode {
  const borderColor = state.phase === 'game-over'
    ? 'redBright'
    : state.phase === 'paused'
      ? 'yellow'
      : 'cyanBright';

  const footerText = state.phase === 'game-over'
    ? 'Press R or Enter to restart'
    : state.phase === 'paused'
      ? 'Press P to resume'
      : `Food at ${state.food?.x ?? '-'},${state.food?.y ?? '-'}`;

  return Panel(
    { title: 'Arena', borderColor, padding: 0, width: BOARD_PIXEL_WIDTH + 2 },
    ...boardLines.map((line) => Box({ width: 'fill', justifyContent: 'center' }, Text({}, line))),
    Box(
      { width: 'fill', justifyContent: 'center', paddingX: 1 },
      Text({ color: state.phase === 'playing' ? 'gray' : borderColor, dim: state.phase === 'playing' }, footerText),
    ),
  );
}

function CompactHud(state: SnakeState): VNode {
  return Panel(
    { title: 'Run', borderColor: 'greenBright', padding: 1, width: COMPACT_STAGE_WIDTH },
    Box(
      { flexDirection: 'row', gap: 1, justifyContent: 'center' },
      getPhaseBadge(state),
      Badge({ label: `LEVEL ${state.level}`, variant: 'primary', style: 'subtle' }),
      Badge({ label: `LEN ${state.snake.length}`, variant: 'success', style: 'subtle' }),
      Badge({ label: `FOOD ${state.foodsEaten}`, variant: 'warning', style: 'subtle' }),
    ),
    Text({ color: 'gray' }, `Score ${state.score} • Hi-score ${state.hiScore} • Speed ${getMoveFrames(state.level)} ticks`),
  );
}

function HeaderBar(state: SnakeState, fps: number, fpsColor: string, width: number): VNode {
  return Box(
    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width, paddingX: 1 },
    Box(
      { flexDirection: 'row', gap: 1, alignItems: 'center' },
      Text({ color: 'greenBright', bold: true }, 'tuiuiu-snake'),
      getPhaseBadge(state),
      Badge({ label: `LEVEL ${state.level}`, variant: 'primary', style: 'subtle' }),
      Badge({ label: `LENGTH ${state.snake.length}`, variant: 'success', style: 'subtle' }),
    ),
    Box(
      { flexDirection: 'row', gap: 2, alignItems: 'center' },
      Text({ color: 'greenBright', bold: true }, String(state.score).padStart(5, '0')),
      Badge({ label: `HI ${state.hiScore}`, variant: 'secondary', style: 'subtle' }),
      Text({ color: fpsColor, dim: true }, `${fps}fps`),
    ),
  );
}

function HelpOverlay(): VNode {
  return Modal({
    title: 'Tuiuiu Snake Help',
    size: { width: 54, height: 18 },
    content: Box(
      { flexDirection: 'column', gap: 1 },
      Text({ color: 'greenBright', bold: true }, 'Grid-chase controls'),
      Text({}, 'Arrows / WASD / HJKL   Turn snake'),
      Text({}, 'P                       Pause / resume'),
      Text({}, 'R                       Restart'),
      Text({}, 'Enter                   Restart after crash'),
      Text({}, 'Q / Esc                 Quit'),
      Text({ color: 'gray' }, 'You can queue clean turns ahead of time, but reversals are ignored.'),
      Text({ color: 'gray', dim: true }, 'Press F1 or Enter to close'),
    ),
  });
}

function PauseOverlay(state: SnakeState): VNode {
  return Modal({
    title: 'Run Paused',
    size: { width: 42, height: 12 },
    content: Box(
      { flexDirection: 'column', gap: 1 },
      Badge({ label: `LEVEL ${state.level}`, variant: 'warning', style: 'outline' }),
      Text({}, `Score ${state.score} • Length ${state.snake.length}`),
      Text({ color: 'gray' }, 'Press P or Enter to resume.'),
      Text({ color: 'gray' }, 'Press F1 for controls or R to restart.'),
    ),
  });
}

function GameOverOverlay(state: SnakeState): VNode {
  return Modal({
    title: 'Run Over',
    size: { width: 46, height: 14 },
    content: Box(
      { flexDirection: 'column', gap: 1 },
      Badge({ label: `FINAL ${state.score}`, variant: 'danger', style: 'outline' }),
      Text({}, `Foods eaten: ${state.foodsEaten}`),
      Text({}, `Longest length: ${state.telemetry.longestLength}`),
      Text({}, `Level reached: ${state.level}`),
      Text({ color: 'gray' }, 'Press R or Enter to restart.'),
      Text({ color: 'gray' }, 'Press F1 for controls or Q to quit.'),
    ),
  });
}

function ActiveOverlay(state: SnakeState, helpOpen: boolean): VNode | null {
  if (helpOpen) {
    return HelpOverlay();
  }
  if (state.phase === 'paused') {
    return PauseOverlay(state);
  }
  if (state.phase === 'game-over') {
    return GameOverOverlay(state);
  }
  return null;
}

function ScreenTooSmall(arena: Arena): VNode {
  return Box(
    {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: 'fill',
      height: 'fill',
      gap: 1,
    },
    Text({ color: 'greenBright', bold: true }, 'tuiuiu-snake'),
    Panel(
      { title: 'Terminal Too Small', borderColor: 'yellow', width: 42 },
      Text({}, `Need at least ${MIN_COLUMNS} columns × ${MIN_ROWS} rows.`),
      Text({}, `Current terminal: ${arena.columns} × ${arena.rows}`),
      Text({ color: 'gray' }, 'Resize the terminal or run in a larger window.'),
    ),
    Text({ color: 'gray' }, 'Press Q or Esc to quit'),
  );
}

function TuiuiuSnake(): VNode {
  const { exit } = useApp();
  const { fps, color: fpsColor } = useFps();
  const terminal = useTerminalSize();
  const arena = getArena(terminal.columns, terminal.rows);
  const [game, setGame] = useState(createNewGameState(arena));
  const [helpOpen, setHelpOpen] = useState(false);
  const state = game();
  const isHelpOpen = helpOpen();
  const boardLines = renderArena(state);

  const onDirection = (direction: Direction) => {
    if (isHelpOpen) return;
    setGame((current) => queueDirection(current, direction));
  };

  useShortcut(['up', 'w', 'k'], () => onDirection('up'));
  useShortcut(['down', 's', 'j'], () => onDirection('down'));
  useShortcut(['left', 'a', 'h'], () => onDirection('left'));
  useShortcut(['right', 'd', 'l'], () => onDirection('right'));

  useShortcut('p', () => {
    if (isHelpOpen || state.phase === 'game-over') return;
    setGame((current) => togglePause(current));
  });

  useShortcut('r', () => {
    setHelpOpen(false);
    setGame((current) => createNewGameState(arena, current.hiScore));
  });

  useShortcut('f1', () => {
    setHelpOpen((open) => !open);
  });

  useShortcut('enter', () => {
    if (isHelpOpen) {
      setHelpOpen(false);
      return;
    }

    setGame((current) => current.phase === 'game-over'
      ? createNewGameState(arena, current.hiScore)
      : current.phase === 'paused'
        ? togglePause(current)
        : current);
  });

  useShortcut(['escape', 'q'], () => {
    if (isHelpOpen) {
      setHelpOpen(false);
      return;
    }
    exit();
  });

  useInterval(() => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => advanceGame(current, arena));
  }, TICK_MS);

  if (!arena.playable) {
    return ScreenTooSmall(arena);
  }

  const stageWidth = arena.compact
    ? Math.min(arena.columns - 2, COMPACT_STAGE_WIDTH)
    : Math.min(arena.columns - 2, WIDE_STAGE_WIDTH);

  return Box(
    { flexDirection: 'column', width: 'fill', height: 'fill', padding: 1, gap: 1, alignItems: 'center' },
    HeaderBar(state, fps, fpsColor, stageWidth),
    arena.compact
      ? Box(
          { flexDirection: 'column', gap: 1, width: stageWidth, alignItems: 'center' },
          CompactHud(state),
          ArenaPanel(state, boardLines),
          StatsPanel(state),
          ControlsPanel(),
          EventLogPanel(state, stageWidth),
        )
      : Box(
          { flexDirection: 'column', gap: 1, width: stageWidth, alignItems: 'center' },
          Box(
            { flexDirection: 'row', gap: 2, justifyContent: 'center', width: stageWidth, alignItems: 'flex-start' },
            Box({ flexDirection: 'column', gap: 1, width: LEFT_RAIL_WIDTH }, StatsPanel(state), TelemetryPanel(state)),
            ArenaPanel(state, boardLines),
            Box({ flexDirection: 'column', gap: 1, width: RIGHT_RAIL_WIDTH }, ControlsPanel()),
          ),
          EventLogPanel(state, stageWidth),
        ),
    ActiveOverlay(state, isHelpOpen),
  );
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  return import.meta.url === pathToFileURL(entry).href;
}

export async function runTuiuiuSnake(): Promise<void> {
  const { waitUntilExit } = render(TuiuiuSnake, {
    screen: 'fullscreen',
    autoTabNavigation: false,
    maxFps: 30,
  });
  await waitUntilExit();
}

if (isMainModule()) {
  await runTuiuiuSnake();
}
