/**
 * tuiuiu-tetris
 *
 * Falling-block puzzle showcase for tuiuiu.js.
 *
 * Features:
 * - Standard tetromino set with deterministic bag randomizer
 * - Rotation with simple wall kicks, hold slot, and next preview queue
 * - Soft drop, hard drop, line clears, scoring, and level progression
 * - Responsive HUD with score, stats, event log, overlays, and FPS
 *
 * Run: pnpm example tuiuiu-tetris
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
  createCanvas,
  darkTheme,
  setTheme,
  useApp,
  useFps,
  useHotkeys,
  useInterval,
  useState,
  useTerminalSize,
} from '../../src/index.js';
import type { VNode } from '../../src/utils/types.js';

setTheme(darkTheme);

export type TetrominoType = 'I' | 'O' | 'T' | 'J' | 'L' | 'S' | 'Z';
export type Phase = 'playing' | 'paused' | 'game-over';
type Rotation = 0 | 1 | 2 | 3;
type Cell = TetrominoType | null;

type Point = { x: number; y: number };

export interface ActivePiece {
  type: TetrominoType;
  rotation: Rotation;
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
  piecesLocked: number;
  lineClears: number;
  hardDrops: number;
  softDrops: number;
  holds: number;
  tetrises: number;
  maxCombo: number;
}

export interface GameState {
  phase: Phase;
  tick: number;
  score: number;
  hiScore: number;
  lines: number;
  level: number;
  combo: number;
  board: Cell[][];
  active: ActivePiece;
  queue: TetrominoType[];
  hold: TetrominoType | null;
  canHold: boolean;
  seed: number;
  telemetry: Telemetry;
  history: string[];
}

const TICK_MS = 50;
const DEFAULT_SEED = 0x7e7715;
const WELL_WIDTH = 10;
const WELL_HEIGHT = 20;
const PREVIEW_WIDTH = 6;
const PREVIEW_HEIGHT = 4;
const CELL_RENDER_WIDTH = 3;
const BOARD_PIXEL_WIDTH = WELL_WIDTH * CELL_RENDER_WIDTH;
const PREVIEW_PIXEL_WIDTH = PREVIEW_WIDTH * CELL_RENDER_WIDTH;
const MIN_COLUMNS = 56;
const MIN_ROWS = 26;
const COMPACT_COLUMNS = 92;
const COMPACT_ROWS = 32;
const HISTORY_LIMIT = 6;
const INITIAL_QUEUE_SIZE = 5;
const LEFT_RAIL_WIDTH = 18;
const RIGHT_RAIL_WIDTH = 26;
const COMPACT_STAGE_WIDTH = BOARD_PIXEL_WIDTH + 6;
const WIDE_STAGE_WIDTH = LEFT_RAIL_WIDTH + (BOARD_PIXEL_WIDTH + 2) + RIGHT_RAIL_WIDTH + 4;
const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'J', 'L', 'S', 'Z'];

const PIECE_COLORS: Record<TetrominoType, string> = {
  I: 'cyanBright',
  O: 'yellow',
  T: 'magentaBright',
  J: 'blueBright',
  L: 'yellowBright',
  S: 'greenBright',
  Z: 'redBright',
};

const PIECE_LABELS: Record<TetrominoType, string> = {
  I: 'I',
  O: 'O',
  T: 'T',
  J: 'J',
  L: 'L',
  S: 'S',
  Z: 'Z',
};

const TETROMINO_SHAPES: Record<TetrominoType, Point[][]> = {
  I: [
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }],
  ],
  O: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  ],
  T: [
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  J: [
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  ],
  L: [
    [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  S: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  Z: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }],
  ],
};

const KICK_TESTS: Point[] = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -2, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: -1 },
];

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: WELL_HEIGHT }, () => Array.from({ length: WELL_WIDTH }, () => null));
}

export function createBoardFromRows(rows: string[]): Cell[][] {
  const board = createEmptyBoard();
  const normalized = rows.slice(-WELL_HEIGHT);
  const offset = WELL_HEIGHT - normalized.length;

  for (let y = 0; y < normalized.length; y++) {
    const row = normalized[y] ?? '';
    for (let x = 0; x < Math.min(WELL_WIDTH, row.length); x++) {
      const token = row[x] as TetrominoType | '.';
      board[offset + y]![x] = token === '.' ? null : token;
    }
  }

  return board;
}

export function countFilledCells(board: Cell[][]): number {
  let total = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell) {
        total += 1;
      }
    }
  }
  return total;
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.slice());
}

function pushHistory(history: string[], entry: string): string[] {
  return [entry, ...history].slice(0, HISTORY_LIMIT);
}

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function shuffleBag(seed: number): { bag: TetrominoType[]; seed: number } {
  const bag = [...TETROMINO_TYPES];
  let currentSeed = seed >>> 0;

  for (let index = bag.length - 1; index > 0; index--) {
    currentSeed = nextSeed(currentSeed);
    const swapIndex = currentSeed % (index + 1);
    const current = bag[index]!;
    bag[index] = bag[swapIndex]!;
    bag[swapIndex] = current;
  }

  return { bag, seed: currentSeed };
}

function ensureQueue(queue: TetrominoType[], seed: number, size = INITIAL_QUEUE_SIZE + 1): { queue: TetrominoType[]; seed: number } {
  let nextQueue = [...queue];
  let next = seed;

  while (nextQueue.length < size) {
    const shuffled = shuffleBag(next);
    nextQueue = nextQueue.concat(shuffled.bag);
    next = shuffled.seed;
  }

  return { queue: nextQueue, seed: next };
}

function spawnPiece(type: TetrominoType): ActivePiece {
  return {
    type,
    rotation: 0,
    x: 3,
    y: 0,
  };
}

export function getArena(columns: number, rows: number): Arena {
  return {
    width: WELL_WIDTH,
    height: WELL_HEIGHT,
    columns,
    rows,
    compact: columns < COMPACT_COLUMNS || rows < COMPACT_ROWS,
    playable: columns >= MIN_COLUMNS && rows >= MIN_ROWS,
  };
}

function getPieceCells(piece: ActivePiece): Point[] {
  return TETROMINO_SHAPES[piece.type][piece.rotation].map((cell) => ({
    x: piece.x + cell.x,
    y: piece.y + cell.y,
  }));
}

function isInsideBoard(x: number, y: number): boolean {
  return x >= 0 && x < WELL_WIDTH && y >= 0 && y < WELL_HEIGHT;
}

function canPlacePiece(board: Cell[][], piece: ActivePiece): boolean {
  for (const cell of getPieceCells(piece)) {
    if (!isInsideBoard(cell.x, cell.y)) {
      return false;
    }

    if (board[cell.y]?.[cell.x]) {
      return false;
    }
  }

  return true;
}

function withActivePiece(state: GameState, active: ActivePiece): GameState {
  return {
    ...state,
    active,
  };
}

function recordScore(state: GameState, delta: number): GameState {
  const score = state.score + delta;
  return {
    ...state,
    score,
    hiScore: Math.max(state.hiScore, score),
  };
}

function computeLevel(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

export function getGravityFrames(level: number): number {
  return Math.max(1, 18 - (level - 1) * 2);
}

function scoreForLineClear(lines: number, level: number): number {
  if (lines === 1) return 100 * level;
  if (lines === 2) return 300 * level;
  if (lines === 3) return 500 * level;
  if (lines >= 4) return 800 * level;
  return 0;
}

function clearCompletedLines(board: Cell[][]): { board: Cell[][]; cleared: number } {
  const keptRows = board.filter((row) => row.some((cell) => cell === null));
  const cleared = WELL_HEIGHT - keptRows.length;
  const nextBoard: Cell[][] = Array.from({ length: cleared }, () => Array.from({ length: WELL_WIDTH }, () => null))
    .concat(keptRows.map((row) => row.slice()));

  return {
    board: nextBoard,
    cleared,
  };
}

function mergeActivePiece(board: Cell[][], active: ActivePiece): Cell[][] {
  const nextBoard = cloneBoard(board);
  for (const cell of getPieceCells(active)) {
    if (isInsideBoard(cell.x, cell.y)) {
      nextBoard[cell.y]![cell.x] = active.type;
    }
  }
  return nextBoard;
}

function popNextPiece(queue: TetrominoType[], seed: number): { type: TetrominoType; queue: TetrominoType[]; seed: number } {
  const refilled = ensureQueue(queue, seed);
  const [type, ...rest] = refilled.queue;
  return {
    type: type!,
    queue: rest,
    seed: refilled.seed,
  };
}

export function spawnNextPiece(state: GameState): GameState {
  const next = popNextPiece(state.queue, state.seed);
  const active = spawnPiece(next.type);

  if (!canPlacePiece(state.board, active)) {
    return {
      ...state,
      phase: 'game-over',
      queue: next.queue,
      seed: next.seed,
      history: pushHistory(state.history, 'Stack topped out.'),
      hiScore: Math.max(state.hiScore, state.score),
    };
  }

  return {
    ...state,
    active,
    queue: next.queue,
    seed: next.seed,
    canHold: true,
  };
}

function applyLock(state: GameState, dropBonus = 0, eventLabel = 'Piece locked'): GameState {
  const merged = mergeActivePiece(state.board, state.active);
  const cleared = clearCompletedLines(merged);
  const clearedCount = cleared.cleared;
  const nextLines = state.lines + clearedCount;
  const nextLevel = computeLevel(nextLines);
  const lineScore = scoreForLineClear(clearedCount, state.level);
  const combo = clearedCount > 0 ? state.combo + 1 : 0;
  const comboBonus = clearedCount > 0 && combo > 1 ? (combo - 1) * 50 * state.level : 0;
  const scored = state.score + dropBonus + lineScore + comboBonus;

  let nextState: GameState = {
    ...state,
    board: cleared.board,
    score: scored,
    hiScore: Math.max(state.hiScore, scored),
    lines: nextLines,
    level: nextLevel,
    combo,
    telemetry: {
      ...state.telemetry,
      piecesLocked: state.telemetry.piecesLocked + 1,
      lineClears: state.telemetry.lineClears + clearedCount,
      tetrises: state.telemetry.tetrises + (clearedCount === 4 ? 1 : 0),
      maxCombo: Math.max(state.telemetry.maxCombo, combo),
    },
    history: pushHistory(
      state.history,
      clearedCount > 0
        ? `${eventLabel}: cleared ${clearedCount} line${clearedCount === 1 ? '' : 's'}.`
        : eventLabel,
    ),
  };

  nextState = spawnNextPiece(nextState);
  return nextState;
}

export function createNewGameState(_arena: Arena, hiScore = 0, seed = DEFAULT_SEED): GameState {
  const initial = ensureQueue([], seed);
  const [type, ...queue] = initial.queue;

  return {
    phase: 'playing',
    tick: 0,
    score: 0,
    hiScore,
    lines: 0,
    level: 1,
    combo: 0,
    board: createEmptyBoard(),
    active: spawnPiece(type!),
    queue,
    hold: null,
    canHold: true,
    seed: initial.seed,
    telemetry: {
      piecesLocked: 0,
      lineClears: 0,
      hardDrops: 0,
      softDrops: 0,
      holds: 0,
      tetrises: 0,
      maxCombo: 0,
    },
    history: ['Stack stabilized.'],
  };
}

export function moveActivePiece(state: GameState, dx: number): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  const candidate: ActivePiece = {
    ...state.active,
    x: state.active.x + dx,
  };

  if (!canPlacePiece(state.board, candidate)) {
    return state;
  }

  return withActivePiece(state, candidate);
}

export function rotateActivePiece(state: GameState, direction: 1 | -1 = 1): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  const rotation = (((state.active.rotation + direction) % 4) + 4) % 4 as Rotation;

  for (const kick of KICK_TESTS) {
    const candidate: ActivePiece = {
      ...state.active,
      rotation,
      x: state.active.x + kick.x,
      y: state.active.y + kick.y,
    };

    if (canPlacePiece(state.board, candidate)) {
      return withActivePiece(state, candidate);
    }
  }

  return state;
}

export function getGhostY(state: GameState): number {
  let ghostY = state.active.y;
  let candidate = { ...state.active };

  while (canPlacePiece(state.board, { ...candidate, y: candidate.y + 1 })) {
    candidate = { ...candidate, y: candidate.y + 1 };
    ghostY = candidate.y;
  }

  return ghostY;
}

export function softDrop(state: GameState): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  const candidate: ActivePiece = {
    ...state.active,
    y: state.active.y + 1,
  };

  if (canPlacePiece(state.board, candidate)) {
    return recordScore(
      {
        ...state,
        active: candidate,
        telemetry: {
          ...state.telemetry,
          softDrops: state.telemetry.softDrops + 1,
        },
      },
      1,
    );
  }

  return applyLock(
    {
      ...state,
      telemetry: {
        ...state.telemetry,
        softDrops: state.telemetry.softDrops + 1,
      },
    },
    0,
    'Soft drop lock',
  );
}

export function hardDrop(state: GameState): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  const ghostY = getGhostY(state);
  const distance = ghostY - state.active.y;
  const dropped: GameState = {
    ...state,
    active: {
      ...state.active,
      y: ghostY,
    },
    telemetry: {
      ...state.telemetry,
      hardDrops: state.telemetry.hardDrops + 1,
    },
  };

  return applyLock(dropped, distance * 2, `Hard drop ${distance}`);
}

export function holdActivePiece(state: GameState): GameState {
  if (state.phase !== 'playing' || !state.canHold) {
    return state;
  }

  if (state.hold === null) {
    const next = popNextPiece(state.queue, state.seed);
    const active = spawnPiece(next.type);
    if (!canPlacePiece(state.board, active)) {
      return {
        ...state,
        phase: 'game-over',
        history: pushHistory(state.history, 'Hold swap topped out.'),
      };
    }

    return {
      ...state,
      hold: state.active.type,
      active,
      queue: next.queue,
      seed: next.seed,
      canHold: false,
      telemetry: {
        ...state.telemetry,
        holds: state.telemetry.holds + 1,
      },
      history: pushHistory(state.history, `Held ${state.active.type}.`),
    };
  }

  const swapped = spawnPiece(state.hold);
  if (!canPlacePiece(state.board, swapped)) {
    return {
      ...state,
      phase: 'game-over',
      history: pushHistory(state.history, 'Hold swap topped out.'),
    };
  }

  return {
    ...state,
    hold: state.active.type,
    active: swapped,
    canHold: false,
    telemetry: {
      ...state.telemetry,
      holds: state.telemetry.holds + 1,
    },
    history: pushHistory(state.history, `Swapped hold for ${swapped.type}.`),
  };
}

export function togglePause(state: GameState): GameState {
  if (state.phase === 'game-over') {
    return state;
  }

  return {
    ...state,
    phase: state.phase === 'paused' ? 'playing' : 'paused',
    history: pushHistory(state.history, state.phase === 'paused' ? 'Resumed stack.' : 'Paused stack.'),
  };
}

export function advanceGame(state: GameState, _arena: Arena): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  const tick = state.tick + 1;
  const frames = getGravityFrames(state.level);
  const ticking = {
    ...state,
    tick,
  };

  if (tick % frames !== 0) {
    return ticking;
  }

  const candidate: ActivePiece = {
    ...state.active,
    y: state.active.y + 1,
  };

  if (canPlacePiece(state.board, candidate)) {
    return {
      ...ticking,
      active: candidate,
    };
  }

  return applyLock(ticking);
}

function getPhaseBadge(state: GameState): VNode {
  if (state.phase === 'game-over') {
    return Badge({ label: 'GAME OVER', variant: 'danger' });
  }
  if (state.phase === 'paused') {
    return Badge({ label: 'PAUSED', variant: 'warning' });
  }
  return Badge({ label: 'LIVE', variant: 'success' });
}

function renderBoard(state: GameState): string[] {
  const canvas = createCanvas({ width: BOARD_PIXEL_WIDTH, height: WELL_HEIGHT });

  const setWidePixel = (x: number, y: number, char: string, color?: string) => {
    const left = x * CELL_RENDER_WIDTH;
    for (let dx = 0; dx < CELL_RENDER_WIDTH; dx++) {
      canvas.setPixel(left + dx, y, char, color);
    }
  };

  for (let y = 0; y < WELL_HEIGHT; y++) {
    for (let x = 0; x < WELL_WIDTH; x++) {
      setWidePixel(x, y, '·', 'gray');
    }
  }

  for (let y = 0; y < WELL_HEIGHT; y++) {
    for (let x = 0; x < WELL_WIDTH; x++) {
      const cell = state.board[y]?.[x];
      if (cell) {
        setWidePixel(x, y, '█', PIECE_COLORS[cell]);
      }
    }
  }

  if (state.phase === 'playing') {
    const ghostY = getGhostY(state);
    const ghostPiece: ActivePiece = {
      ...state.active,
      y: ghostY,
    };
    for (const cell of getPieceCells(ghostPiece)) {
      if (!state.board[cell.y]?.[cell.x]) {
        setWidePixel(cell.x, cell.y, '░', 'gray');
      }
    }
  }

  for (const cell of getPieceCells(state.active)) {
    if (isInsideBoard(cell.x, cell.y)) {
      setWidePixel(cell.x, cell.y, '█', PIECE_COLORS[state.active.type]);
    }
  }

  return canvas.render();
}

function renderPreview(type: TetrominoType | null): string[] {
  const canvas = createCanvas({ width: PREVIEW_PIXEL_WIDTH, height: PREVIEW_HEIGHT });
  if (!type) {
    return canvas.render();
  }

  const cells = TETROMINO_SHAPES[type][0];
  const minX = Math.min(...cells.map((cell) => cell.x));
  const maxX = Math.max(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const maxY = Math.max(...cells.map((cell) => cell.y));
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const offsetX = Math.floor((PREVIEW_WIDTH - width) / 2) - minX;
  const offsetY = Math.floor((PREVIEW_HEIGHT - height) / 2) - minY;

  const setWidePreviewPixel = (x: number, y: number, char: string, color?: string) => {
    const left = x * CELL_RENDER_WIDTH;
    for (let dx = 0; dx < CELL_RENDER_WIDTH; dx++) {
      canvas.setPixel(left + dx, y, char, color);
    }
  };

  for (const cell of cells) {
    setWidePreviewPixel(cell.x + offsetX, cell.y + offsetY, '█', PIECE_COLORS[type]);
  }

  return canvas.render();
}

function PreviewPanel(title: string, type: TetrominoType | null): VNode {
  return Panel(
    { title, padding: 0, borderColor: type ? PIECE_COLORS[type] : 'muted', width: LEFT_RAIL_WIDTH },
    ...renderPreview(type).map((line) => Text({}, line || ' '.repeat(PREVIEW_PIXEL_WIDTH))),
    Text({ color: type ? PIECE_COLORS[type] : 'gray', dim: !type }, type ? `${PIECE_LABELS[type]} piece` : 'Empty'),
  );
}

function QueuePanel(state: GameState): VNode {
  const queue = state.queue.slice(0, 3);
  return Panel(
    { title: 'Queue', borderColor: 'cyanBright', padding: 1, width: LEFT_RAIL_WIDTH },
    ...queue.map((type, index) =>
      Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: 'gray', dim: true }, `${index + 1}.`),
        Text({ color: PIECE_COLORS[type], bold: true }, PIECE_LABELS[type]),
        Text({ color: 'gray' }, type),
      )
    ),
  );
}

function StatsPanel(state: GameState): VNode {
  const linesToNextLevel = 10 - (state.lines % 10 || 10);
  return Panel(
    { title: 'Stats', borderColor: 'magentaBright', padding: 1, width: RIGHT_RAIL_WIDTH },
    Digits({
      value: state.score,
      style: 'minimal',
      digits: 6,
      leadingZeros: true,
      color: 'cyanBright',
    }),
    DataRow({ label: 'Level', value: state.level, valueColor: 'yellow' }),
    DataRow({ label: 'Lines', value: state.lines, valueColor: 'greenBright' }),
    DataRow({ label: 'Hi-score', value: state.hiScore, valueColor: 'magentaBright' }),
    DataRow({ label: 'Gravity', value: `${getGravityFrames(state.level)} ticks`, valueColor: 'cyanBright' }),
    DataRow({ label: 'Next level', value: linesToNextLevel, valueColor: 'yellow' }),
    DataRow({ label: 'Combo', value: state.combo, valueColor: state.combo > 1 ? 'greenBright' : 'gray' }),
  );
}

function TelemetryPanel(state: GameState): VNode {
  return Panel(
    { title: 'Telemetry', borderColor: 'greenBright', padding: 1, width: RIGHT_RAIL_WIDTH },
    DataRow({ label: 'Locks', value: state.telemetry.piecesLocked, valueColor: 'cyanBright' }),
    DataRow({ label: 'Clears', value: state.telemetry.lineClears, valueColor: 'greenBright' }),
    DataRow({ label: 'Tetrises', value: state.telemetry.tetrises, valueColor: 'magentaBright' }),
    DataRow({ label: 'Soft drops', value: state.telemetry.softDrops, valueColor: 'yellow' }),
    DataRow({ label: 'Hard drops', value: state.telemetry.hardDrops, valueColor: 'redBright' }),
    DataRow({ label: 'Holds', value: state.telemetry.holds, valueColor: 'blueBright' }),
    DataRow({ label: 'Max combo', value: state.telemetry.maxCombo, valueColor: 'greenBright' }),
  );
}

function EventLogPanel(state: GameState, width: number): VNode {
  return Panel(
    { title: 'Stack Log', borderColor: 'yellow', padding: 1, width },
    ...state.history.map((entry) => Text({ color: 'gray', wrap: 'truncate-end' }, entry)),
    Text({ color: 'gray', dim: true }, 'F1 help • P pause • R restart • Q quit'),
  );
}

function ControlsPanel(state: GameState): VNode {
  const statusText = state.phase === 'paused'
    ? 'Paused'
    : state.phase === 'game-over'
      ? 'Top out'
      : state.canHold
        ? 'Hold ready'
        : 'Lock to reuse hold';
  const statusColor = state.phase === 'game-over'
    ? 'redBright'
    : state.phase === 'paused'
      ? 'yellow'
      : state.canHold
        ? 'greenBright'
        : 'gray';

  return Panel(
    { title: 'Controls', borderColor: 'blueBright', padding: 1, width: LEFT_RAIL_WIDTH },
    Text({ color: statusColor, bold: true }, statusText),
    Text({ color: 'gray' }, '← → move'),
    Text({ color: 'gray' }, '↓ soft • Space hard'),
    Text({ color: 'gray' }, 'X / Z rotate • C hold'),
    Text({ color: 'gray', dim: true }, 'P pause • R restart'),
  );
}

function LeftRail(state: GameState): VNode {
  return Box(
    { flexDirection: 'column', gap: 1, width: LEFT_RAIL_WIDTH },
    PreviewPanel('Hold', state.hold),
    QueuePanel(state),
    ControlsPanel(state),
  );
}

function RightRail(state: GameState): VNode {
  return Box(
    { flexDirection: 'column', gap: 1, width: RIGHT_RAIL_WIDTH },
    Panel(
      { title: 'Next', padding: 0, borderColor: state.queue[0] ? PIECE_COLORS[state.queue[0]] : 'muted', width: RIGHT_RAIL_WIDTH },
      ...renderPreview(state.queue[0] ?? null).map((line) => Text({}, line || ' '.repeat(PREVIEW_WIDTH))),
      Text(
        { color: state.queue[0] ? PIECE_COLORS[state.queue[0]] : 'gray', dim: !state.queue[0] },
        state.queue[0] ? `${PIECE_LABELS[state.queue[0]]} piece` : 'Empty',
      ),
    ),
    StatsPanel(state),
    TelemetryPanel(state),
  );
}

function WellPanel(state: GameState, boardLines: string[]): VNode {
  const borderColor = state.phase === 'game-over'
    ? 'redBright'
    : state.phase === 'paused'
      ? 'yellow'
      : 'cyanBright';
  const footerText = state.phase === 'game-over'
    ? 'Press R or Space to relaunch'
    : state.phase === 'paused'
      ? 'Press P to resume'
      : 'Stack for doubles, triples, and tetrises';

  return Panel(
    { title: 'Matrix', borderColor, padding: 0, width: BOARD_PIXEL_WIDTH + 2 },
    ...boardLines.map((line) =>
      Box({ width: 'fill', justifyContent: 'center' }, Text({}, line))
    ),
    Box(
      { width: 'fill', justifyContent: 'center', paddingX: 1 },
      Text({ color: state.phase === 'playing' ? 'gray' : borderColor, dim: state.phase === 'playing' }, footerText),
    ),
  );
}

function CompactHud(state: GameState): VNode {
  return Panel(
    { title: 'Round', borderColor: 'magentaBright', padding: 1, width: COMPACT_STAGE_WIDTH },
    Box(
      { flexDirection: 'row', gap: 1, justifyContent: 'center' },
      getPhaseBadge(state),
      Badge({ label: `LV ${state.level}`, variant: 'primary', style: 'subtle' }),
      Badge({ label: `LINES ${state.lines}`, variant: 'success', style: 'subtle' }),
      Badge({ label: `HOLD ${state.hold ?? '-'}`, variant: 'secondary', style: 'subtle' }),
    ),
    Text({ color: 'gray' }, `Next: ${state.queue.slice(0, 3).join(' ')}`),
    Text({ color: 'gray' }, `Score ${state.score} • Hi-score ${state.hiScore} • Combo ${state.combo}`),
  );
}

function HeaderBar(state: GameState, fps: number, fpsColor: string, width: number): VNode {
  return Box(
    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width, paddingX: 1 },
    Box(
      { flexDirection: 'row', gap: 1, alignItems: 'center' },
      Text({ color: 'cyanBright', bold: true }, 'tuiuiu-tetris'),
      getPhaseBadge(state),
      Badge({ label: `LEVEL ${state.level}`, variant: 'primary', style: 'subtle' }),
      Badge({ label: `NEXT ${state.queue[0] ?? '-'}`, variant: 'secondary', style: 'subtle' }),
    ),
    Box(
      { flexDirection: 'row', gap: 2, alignItems: 'center' },
      Text({ color: 'cyanBright', bold: true }, String(state.score).padStart(6, '0')),
      Box(
        { flexDirection: 'row', gap: 1 },
        Badge({ label: `LINES ${state.lines}`, variant: 'success', style: 'subtle' }),
        Badge({ label: `HOLD ${state.hold ?? '-'}`, variant: 'secondary', style: 'subtle' }),
      ),
      Text({ color: fpsColor, dim: true }, `${fps}fps`),
    ),
  );
}

function HelpOverlay(): VNode {
  return Modal({
    title: 'Tuiuiu Tetris Help',
    size: { width: 54, height: 20 },
    content: Box(
      { flexDirection: 'column', gap: 1 },
      Text({ color: 'cyanBright', bold: true }, 'Falling-block puzzle controls'),
      Text({}, 'Left / A / H  Move piece left'),
      Text({}, 'Right / D / L Move piece right'),
      Text({}, 'Down / S / J  Soft drop'),
      Text({}, 'Up / X / K    Rotate clockwise'),
      Text({}, 'Z             Rotate counter-clockwise'),
      Text({}, 'C             Hold / swap piece'),
      Text({}, 'Space         Hard drop'),
      Text({}, 'P             Pause'),
      Text({}, 'R             Restart'),
      Text({}, 'Q / Esc       Quit'),
      Text({ color: 'gray' }, 'Score big by stacking for doubles, triples, and tetrises.'),
      Text({ color: 'gray', dim: true }, 'Press F1 or Enter to close'),
    ),
  });
}

function PauseOverlay(state: GameState): VNode {
  return Modal({
    title: 'Stack Paused',
    size: { width: 42, height: 12 },
    content: Box(
      { flexDirection: 'column', gap: 1 },
      Badge({ label: `LEVEL ${state.level}`, variant: 'warning', style: 'outline' }),
      Text({}, `Score ${state.score} • Lines ${state.lines}`),
      Text({ color: 'gray' }, 'Press P or Enter to resume.'),
      Text({ color: 'gray' }, 'Press F1 for controls or R to restart.'),
    ),
  });
}

function GameOverOverlay(state: GameState): VNode {
  return Modal({
    title: 'Top Out',
    size: { width: 46, height: 14 },
    content: Box(
      { flexDirection: 'column', gap: 1 },
      Badge({ label: `FINAL ${state.score}`, variant: 'danger', style: 'outline' }),
      Text({}, `Lines cleared: ${state.lines}`),
      Text({}, `Level reached: ${state.level}`),
      Text({}, `Tetrises: ${state.telemetry.tetrises}`),
      Text({ color: 'gray' }, 'Press R or Space to restart.'),
      Text({ color: 'gray' }, 'Press F1 for controls or Q to quit.'),
    ),
  });
}

function ActiveOverlay(state: GameState, helpOpen: boolean): VNode | null {
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

function TuiuiuTetris(): VNode {
  const { exit } = useApp();
  const { fps, color: fpsColor } = useFps();
  const terminal = useTerminalSize();
  const arena = getArena(terminal.columns, terminal.rows);
  const [game, setGame] = useState(createNewGameState(arena));
  const [helpOpen, setHelpOpen] = useState(false);
  const state = game();
  const isHelpOpen = helpOpen();
  const boardLines = renderBoard(state);

  useHotkeys(['left', 'a', 'h'], () => {
    if (isHelpOpen) return;
    setGame((current) => moveActivePiece(current, -1));
  });

  useHotkeys(['right', 'd', 'l'], () => {
    if (isHelpOpen) return;
    setGame((current) => moveActivePiece(current, 1));
  });

  useHotkeys(['down', 's', 'j'], () => {
    if (isHelpOpen) return;
    setGame((current) => softDrop(current));
  });

  useHotkeys(['up', 'x', 'k'], () => {
    if (isHelpOpen) return;
    setGame((current) => rotateActivePiece(current, 1));
  });

  useHotkeys('z', () => {
    if (isHelpOpen) return;
    setGame((current) => rotateActivePiece(current, -1));
  });

  useHotkeys('c', () => {
    if (isHelpOpen) return;
    setGame((current) => holdActivePiece(current));
  });

  useHotkeys('space', () => {
    if (isHelpOpen) return;
    setGame((current) => current.phase === 'game-over'
      ? createNewGameState(arena, current.hiScore)
      : hardDrop(current));
  });

  useHotkeys('p', () => {
    if (isHelpOpen || state.phase === 'game-over') return;
    setGame((current) => togglePause(current));
  });

  useHotkeys('r', () => {
    setHelpOpen(false);
    setGame((current) => createNewGameState(arena, current.hiScore));
  });

  useHotkeys('f1', () => {
    setHelpOpen((open) => !open);
  });

  useHotkeys('enter', () => {
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

  useHotkeys(['escape', 'q'], () => {
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
    return Box(
      { flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: 'fill', height: 'fill', gap: 1 },
      Text({ color: 'cyanBright', bold: true }, 'tuiuiu-tetris'),
      Panel(
        { title: 'Terminal Too Small', borderColor: 'yellow', width: 40 },
        Text({}, `Need at least ${MIN_COLUMNS} columns × ${MIN_ROWS} rows.`),
        Text({}, `Current terminal: ${arena.columns} × ${arena.rows}`),
        Text({ color: 'gray' }, 'Resize the terminal or run in a larger window.'),
      ),
      Text({ color: 'gray' }, 'Press Q or Esc to quit'),
    );
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
          WellPanel(state, boardLines),
          Box(
            { flexDirection: 'row', gap: 1, justifyContent: 'center', width: stageWidth },
            PreviewPanel('Hold', state.hold),
            Panel(
              { title: 'Next', padding: 0, borderColor: state.queue[0] ? PIECE_COLORS[state.queue[0]] : 'muted', width: LEFT_RAIL_WIDTH },
              ...renderPreview(state.queue[0] ?? null).map((line) => Text({}, line || ' '.repeat(PREVIEW_WIDTH))),
              Text(
                { color: state.queue[0] ? PIECE_COLORS[state.queue[0]] : 'gray', dim: !state.queue[0] },
                state.queue[0] ? `${PIECE_LABELS[state.queue[0]]} piece` : 'Empty',
              ),
            ),
          ),
          EventLogPanel(state, stageWidth),
        )
      : Box(
          { flexDirection: 'column', gap: 1, width: stageWidth, alignItems: 'center' },
          Box(
            { flexDirection: 'row', gap: 2, justifyContent: 'center', width: stageWidth, alignItems: 'flex-start' },
            LeftRail(state),
            WellPanel(state, boardLines),
            RightRail(state),
          ),
          EventLogPanel(state, stageWidth),
        ),
    ActiveOverlay(state, isHelpOpen),
  );
}

export { clearCompletedLines, mergeActivePiece };

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  return import.meta.url === pathToFileURL(entry).href;
}

export async function runTuiuiuTetris(): Promise<void> {
  const { waitUntilExit } = render(TuiuiuTetris, {
    fullHeight: true,
    autoTabNavigation: false,
    maxFps: 30,
  });
  await waitUntilExit();
}

if (isMainModule()) {
  await runTuiuiuTetris();
}
