/**
 * tuiuiu-invaders
 *
 * Literal ASCII Space Invaders for tuiuiu.js.
 *
 * Features:
 * - Moving invader formation with progressive speed
 * - Destructible shields
 * - Enemy fire, player lives, score, and bonus saucer
 * - Responsive HUD for narrow and wide terminals
 * - Tabs, gauges, sparklines, heatmaps, overlays, tables, and battle logs
 *
 * Run: pnpm example tuiuiu-invaders
 */

import { pathToFileURL } from 'node:url';

import {
  render,
  Badge,
  Box,
  Text,
  Panel,
  DataRow,
  Digits,
  Gauge,
  ListItem,
  Modal,
  ProgressBar,
  Sparkline,
  StatusIndicator,
  Table,
  Tabs,
  darkTheme,
  setTheme,
  useApp,
  useConst,
  useShortcut,
  useInterval,
  useState,
  useTerminalSize,
} from '../../src/index.js';
import { BigText } from '../../src/atoms/big-text.js';
import { Canvas, createCanvas } from '../../src/primitives/canvas.js';
import { Heatmap } from '../../src/molecules/data-viz/heatmap.js';
import { SplitView, createSplitView } from '../../src/molecules/split-view.js';
import { createTabs } from '../../src/molecules/tabs.js';
import { useFps } from '../../src/hooks/use-fps.js';
import type { VNode } from '../../src/utils/types.js';

setTheme(darkTheme);

const TICK_MS = 80;
const INITIAL_SEED = 0x1badb002;
const MIN_COLUMNS = 56;
const MIN_ROWS = 24;
const MAX_GAME_WIDTH = 76;
const MAX_GAME_HEIGHT = 24;
const HUD_SIDEBAR_BREAKPOINT = 112;
const HUD_MIN_ROWS_FOR_SIDEBAR = 28;
const HUD_SIDEBAR_WIDTH = 30;
const PLAYER_MOVE_STEP = 2;
const MAX_SHIELD_DAMAGE = 3;
const HISTORY_LIMIT = 28;
const EVENT_LOG_LIMIT = 6;
const THREAT_HEATMAP_ROWS = 5;
const THREAT_HEATMAP_COLUMNS = 8;
const SAUCER_VALUES = [50, 100, 150, 200] as const;
const PLAYER_SPRITE = ['/^\\'] as const;
const SAUCER_SPRITE = ['<###>'] as const;
const ENEMY_SPRITES = [
  ['<M>'],
  ['{W}'],
  ['[A]'],
] as const;
const SHIELD_SPRITE = [
  ' /#\\ ',
  '/###\\',
] as const;
const ENEMY_COLORS = ['magentaBright', 'yellowBright', 'greenBright'] as const;
const INVADER_SCORES = [30, 20, 10] as const;
const MENU_OPTIONS = [
  {
    label: 'Start Mission',
    detail: 'Launch a fresh run from wave one.',
    action: 'start',
  },
  {
    label: 'Quit',
    detail: 'Leave the cockpit.',
    action: 'quit',
  },
] as const;

type BulletOwner = 'player' | 'invader';
type GamePhase = 'playing' | 'paused' | 'game-over';
type HudTabKey = 'intel' | 'defense' | 'log';
type DebriefSectionKey = 'summary' | 'telemetry' | 'arsenal';
type EventSeverity = 'success' | 'warning' | 'error' | 'info';
type ScreenState = 'menu' | 'game';

export type Arena = {
  width: number;
  height: number;
  columns: number;
  rows: number;
  compact: boolean;
  playable: boolean;
};

type Invader = {
  id: number;
  row: number;
  col: number;
  type: number;
  alive: boolean;
};

type Bullet = {
  id: number;
  x: number;
  y: number;
  dy: -1 | 1;
  owner: BulletOwner;
};

type Explosion = {
  x: number;
  y: number;
  ttl: number;
  glyph: string;
  color: string;
};

type Saucer = {
  active: boolean;
  x: number;
  direction: 1 | -1;
  cooldown: number;
  value: number;
};

type ShieldCell = {
  x: number;
  y: number;
  char: string;
};

type CombatEvent = {
  title: string;
  detail: string;
  status: EventSeverity;
};

type Telemetry = {
  shotsFired: number;
  enemyShotsFired: number;
  invadersDestroyed: number;
  saucersDestroyed: number;
  scoreHistory: number[];
  threatHistory: number[];
  shieldHistory: number[];
  eventLog: CombatEvent[];
};

export type GameState = {
  level: number;
  score: number;
  hiScore: number;
  lives: number;
  playerX: number;
  phase: GamePhase;
  tick: number;
  nextId: number;
  seed: number;
  invaders: Invader[];
  formationX: number;
  formationY: number;
  formationDirection: 1 | -1;
  formationCooldown: number;
  bullets: Bullet[];
  shieldDamage: number[][];
  explosions: Explosion[];
  saucer: Saucer;
  status: string;
  statusTicks: number;
  respawnTicks: number;
  telemetry: Telemetry;
};

const PLAYER_WIDTH = spriteWidth(PLAYER_SPRITE);
const SAUCER_WIDTH = spriteWidth(SAUCER_SPRITE);
const ENEMY_WIDTH = spriteWidth(ENEMY_SPRITES[0]);
const SHIELD_WIDTH = spriteWidth(SHIELD_SPRITE);
const SHIELD_CELLS = collectSpriteCells(SHIELD_SPRITE);

function spriteWidth(sprite: readonly string[]): number {
  return Math.max(...sprite.map((row) => row.length));
}

function collectSpriteCells(sprite: readonly string[]): ShieldCell[] {
  const cells: ShieldCell[] = [];

  for (let y = 0; y < sprite.length; y++) {
    const row = sprite[y] ?? '';
    for (let x = 0; x < row.length; x++) {
      const char = row[x] ?? ' ';
      if (char !== ' ') {
        cells.push({ x, y, char });
      }
    }
  }

  return cells;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pushHistory(history: number[], value: number, limit = HISTORY_LIMIT): number[] {
  const next = [...history, value];
  return next.length > limit ? next.slice(next.length - limit) : next;
}

function appendEvent(telemetry: Telemetry, event: CombatEvent): Telemetry {
  return {
    ...telemetry,
    eventLog: [event, ...telemetry.eventLog].slice(0, EVENT_LOG_LIMIT),
  };
}

function createTelemetry(score: number, bootMessage: string): Telemetry {
  return {
    shotsFired: 0,
    enemyShotsFired: 0,
    invadersDestroyed: 0,
    saucersDestroyed: 0,
    scoreHistory: [score],
    threatHistory: [0],
    shieldHistory: [100],
    eventLog: [
      {
        title: 'Boot',
        detail: bootMessage,
        status: 'info',
      },
    ],
  };
}

function getArena(columns: number, rows: number): Arena {
  const compact = columns < HUD_SIDEBAR_BREAKPOINT || rows < HUD_MIN_ROWS_FOR_SIDEBAR;
  const widthBudget = compact ? columns - 4 : columns - HUD_SIDEBAR_WIDTH - 6;
  const heightBudget = rows - (compact ? 8 : 6);

  return {
    width: Math.max(34, Math.min(MAX_GAME_WIDTH, widthBudget)),
    height: Math.max(14, Math.min(MAX_GAME_HEIGHT, heightBudget)),
    columns,
    rows,
    compact,
    playable: columns >= MIN_COLUMNS && rows >= MIN_ROWS,
  };
}

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function randomRange(seed: number, min: number, maxExclusive: number): [number, number] {
  const next = nextSeed(seed);
  const span = Math.max(1, maxExclusive - min);
  const value = min + Math.floor((next / 0x100000000) * span);
  return [value, next];
}

export function getPlayerY(arena: Arena): number {
  return arena.height - 2;
}

function centerPlayerX(arena: Arena): number {
  return Math.floor((arena.width - PLAYER_WIDTH) / 2);
}

function getShieldAnchors(arena: Arena): Array<{ x: number; y: number }> {
  const count = 4;
  const y = Math.max(5, getPlayerY(arena) - 4);
  const spacing = arena.width / (count + 1);

  return Array.from({ length: count }, (_, index) => ({
    x: clamp(Math.round(spacing * (index + 1) - SHIELD_WIDTH / 2), 1, arena.width - SHIELD_WIDTH - 1),
    y,
  }));
}

function getInvaderColumns(arena: Arena): number {
  return clamp(Math.floor((arena.width - 8) / (ENEMY_WIDTH + 2)), 6, 10);
}

function getInvaderRows(): number {
  return 4;
}

function getFormationStepDelay(level: number, alive: number, total: number): number {
  const defeated = total - alive;
  return Math.max(1, 7 - Math.floor(defeated / 5) - Math.floor((level - 1) / 2));
}

function createShieldDamage(): number[][] {
  return Array.from({ length: 4 }, () => Array.from({ length: SHIELD_CELLS.length }, () => 0));
}

function createInvaders(columns: number): Invader[] {
  const invaders: Invader[] = [];
  let id = 1;

  for (let row = 0; row < getInvaderRows(); row++) {
    for (let col = 0; col < columns; col++) {
      invaders.push({
        id,
        row,
        col,
        type: row === 0 ? 0 : row === 1 ? 1 : 2,
        alive: true,
      });
      id += 1;
    }
  }

  return invaders;
}

function createSaucer(seed: number): [Saucer, number] {
  let cooldown: number;
  [cooldown, seed] = randomRange(seed, 42, 96);

  return [
    {
      active: false,
      x: -SAUCER_WIDTH,
      direction: 1,
      cooldown,
      value: SAUCER_VALUES[0],
    },
    seed,
  ];
}

function createWaveState(
  level: number,
  score: number,
  lives: number,
  hiScore: number,
  seed: number,
  arena: Arena,
  telemetry?: Telemetry
): GameState {
  const columns = getInvaderColumns(arena);
  const invaders = createInvaders(columns);
  const formationWidth = columns * ENEMY_WIDTH + (columns - 1) * 2;
  const formationX = Math.max(1, Math.floor((arena.width - formationWidth) / 2));
  const formationY = 2;
  const [saucer, next] = createSaucer(seed);
  const openingStatus = level === 1 && score === 0
    ? 'Hold the line. Space fires. P pauses. F1 opens help.'
    : `Wave ${level} incoming.`;
  const nextTelemetry = telemetry
    ? appendEvent(
        {
          ...telemetry,
          scoreHistory: pushHistory(telemetry.scoreHistory, score),
          threatHistory: pushHistory(telemetry.threatHistory, 0),
          shieldHistory: pushHistory(telemetry.shieldHistory, 100),
        },
        {
          title: `Wave ${level}`,
          detail: 'Formation reset and shields reformed.',
          status: 'info',
        }
      )
    : createTelemetry(score, openingStatus);

  return {
    level,
    score,
    hiScore: Math.max(hiScore, score),
    lives,
    playerX: centerPlayerX(arena),
    phase: 'playing',
    tick: 0,
    nextId: invaders.length + 1,
    seed: next,
    invaders,
    formationX,
    formationY,
    formationDirection: 1,
    formationCooldown: getFormationStepDelay(level, invaders.length, invaders.length),
    bullets: [],
    shieldDamage: createShieldDamage(),
    explosions: [],
    saucer,
    status: openingStatus,
    statusTicks: 24,
    respawnTicks: 10,
    telemetry: nextTelemetry,
  };
}

export function createNewGameState(arena: Arena, hiScore = 0): GameState {
  return createWaveState(1, 0, 3, hiScore, INITIAL_SEED, arena);
}

function createNextWave(state: GameState, arena: Arena): GameState {
  return createWaveState(
    state.level + 1,
    state.score,
    state.lives,
    Math.max(state.hiScore, state.score),
    state.seed,
    arena,
    state.telemetry
  );
}

export function getInvaderPosition(state: GameState, invader: Invader): { x: number; y: number } {
  return {
    x: state.formationX + invader.col * (ENEMY_WIDTH + 2),
    y: state.formationY + invader.row * 2,
  };
}

function pointHitsSprite(
  px: number,
  py: number,
  x: number,
  y: number,
  sprite: readonly string[]
): boolean {
  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row] ?? '';
    for (let col = 0; col < line.length; col++) {
      if (line[col] !== ' ' && px === x + col && py === y + row) {
        return true;
      }
    }
  }

  return false;
}

export function countAlive(invaders: Invader[]): number {
  return invaders.reduce((count, invader) => count + (invader.alive ? 1 : 0), 0);
}

function getLiveFormationBounds(state: GameState): { left: number; right: number; bottom: number } | null {
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const invader of state.invaders) {
    if (!invader.alive) {
      continue;
    }

    const { x, y } = getInvaderPosition(state, invader);
    left = Math.min(left, x);
    right = Math.max(right, x + ENEMY_WIDTH - 1);
    bottom = Math.max(bottom, y);
  }

  if (!Number.isFinite(left)) {
    return null;
  }

  return { left, right, bottom };
}

export function getShieldIntegrity(state: GameState): number[] {
  const maxDamage = SHIELD_CELLS.length * MAX_SHIELD_DAMAGE;

  return state.shieldDamage.map((shield) => {
    const damage = shield.reduce((total, cell) => total + cell, 0);
    return clamp(Math.round(((maxDamage - damage) / maxDamage) * 100), 0, 100);
  });
}

function getAverageShieldIntegrity(state: GameState): number {
  const shields = getShieldIntegrity(state);
  if (shields.length === 0) {
    return 0;
  }

  return Math.round(shields.reduce((sum, value) => sum + value, 0) / shields.length);
}

export function getAccuracy(state: GameState): number {
  if (state.telemetry.shotsFired === 0) {
    return 0;
  }

  const hits = state.telemetry.invadersDestroyed + state.telemetry.saucersDestroyed;
  return clamp(Math.round((hits / state.telemetry.shotsFired) * 100), 0, 100);
}

export function getThreatLevel(state: GameState, arena: Arena): number {
  const bounds = getLiveFormationBounds(state);
  const alive = countAlive(state.invaders);
  const total = Math.max(1, state.invaders.length);
  const enemyBullets = state.bullets.filter((bullet) => bullet.owner === 'invader').length;
  const liveRatio = alive / total;
  const descentRatio = bounds ? bounds.bottom / Math.max(1, getPlayerY(arena) - 1) : 0;
  const shieldPressure = (100 - getAverageShieldIntegrity(state)) * 0.18;
  const bulletPressure = enemyBullets * 12;
  const formationPressure = descentRatio * 42;
  const fleetPressure = liveRatio * 26;
  const saucerPressure = state.saucer.active ? 8 : 0;
  const respawnRelief = state.respawnTicks > 0 ? 12 : 0;

  return clamp(
    Math.round(formationPressure + bulletPressure + fleetPressure + shieldPressure + saucerPressure - respawnRelief),
    0,
    100
  );
}

export function buildThreatHeatmap(state: GameState, arena: Arena): number[][] {
  const data = Array.from(
    { length: THREAT_HEATMAP_ROWS },
    () => Array.from({ length: THREAT_HEATMAP_COLUMNS }, () => 0)
  );
  const push = (x: number, y: number, weight: number) => {
    const row = clamp(Math.floor((y / Math.max(1, arena.height)) * THREAT_HEATMAP_ROWS), 0, THREAT_HEATMAP_ROWS - 1);
    const col = clamp(Math.floor((x / Math.max(1, arena.width)) * THREAT_HEATMAP_COLUMNS), 0, THREAT_HEATMAP_COLUMNS - 1);
    data[row]![col] = Math.min(9, data[row]![col]! + weight);
  };

  for (const invader of state.invaders) {
    if (!invader.alive) {
      continue;
    }

    const position = getInvaderPosition(state, invader);
    push(position.x + 1, position.y, invader.type === 0 ? 3 : 2);
  }

  for (const bullet of state.bullets) {
    if (bullet.owner !== 'invader') {
      continue;
    }

    push(bullet.x, bullet.y, 2);
  }

  if (state.saucer.active) {
    push(state.saucer.x + Math.floor(SAUCER_WIDTH / 2), 0, 3);
  }

  return data;
}

function recordTelemetry(state: GameState, arena: Arena): GameState {
  const threat = getThreatLevel(state, arena);
  const shield = getAverageShieldIntegrity(state);

  return {
    ...state,
    telemetry: {
      ...state.telemetry,
      scoreHistory: pushHistory(state.telemetry.scoreHistory, state.score),
      threatHistory: pushHistory(state.telemetry.threatHistory, threat),
      shieldHistory: pushHistory(state.telemetry.shieldHistory, shield),
    },
  };
}

function getBottomShooters(state: GameState): Invader[] {
  const shooters = new Map<number, Invader>();

  for (const invader of state.invaders) {
    if (!invader.alive) {
      continue;
    }

    const current = shooters.get(invader.col);
    if (!current || invader.row > current.row) {
      shooters.set(invader.col, invader);
    }
  }

  return [...shooters.values()];
}

function getShieldGlyph(baseChar: string, damage: number): { char: string; color: string } {
  if (damage <= 0) {
    return { char: baseChar, color: 'greenBright' };
  }
  if (damage === 1) {
    return { char: baseChar === '#' ? '=' : ':', color: 'yellow' };
  }
  if (damage === 2) {
    return { char: '.', color: 'redBright' };
  }

  return { char: ' ', color: 'black' };
}

function drawSprite(canvas: Canvas, x: number, y: number, sprite: readonly string[], color: string): void {
  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row] ?? '';
    for (let col = 0; col < line.length; col++) {
      const char = line[col] ?? ' ';
      if (char !== ' ') {
        canvas.setPixel(x + col, y + row, char, color);
      }
    }
  }
}

function drawLabel(canvas: Canvas, x: number, y: number, text: string, color: string): void {
  for (let i = 0; i < text.length; i++) {
    canvas.setPixel(x + i, y, text[i] ?? ' ', color);
  }
}

function drawCenteredLabel(canvas: Canvas, arena: Arena, y: number, text: string, color: string): void {
  const x = Math.max(0, Math.floor((arena.width - text.length) / 2));
  drawLabel(canvas, x, y, text, color);
}

function drawCenteredCallout(canvas: Canvas, arena: Arena, y: number, text: string, color: string): void {
  drawCenteredLabel(canvas, arena, y, ` ${text} `, color);
}

function drawStarfield(canvas: Canvas, arena: Arena, tick: number, level: number): void {
  for (let y = 0; y < arena.height; y++) {
    for (let x = 0; x < arena.width; x++) {
      const value = (x * 17 + y * 29 + tick * 3 + level * 19) % 97;
      if (value === 0) {
        canvas.setPixel(x, y, '.', 'gray');
      } else if (value === 1) {
        canvas.setPixel(x, y, '+', 'cyanBright');
      } else if (value === 2 && (x + tick + y) % 4 === 0) {
        canvas.setPixel(x, y, '*', 'yellow');
      }
    }
  }
}

function drawShields(canvas: Canvas, shieldDamage: number[][], arena: Arena): void {
  const anchors = getShieldAnchors(arena);

  anchors.forEach((anchor, shieldIndex) => {
    SHIELD_CELLS.forEach((cell, cellIndex) => {
      const damage = shieldDamage[shieldIndex]?.[cellIndex] ?? 0;
      if (damage >= MAX_SHIELD_DAMAGE) {
        return;
      }

      const glyph = getShieldGlyph(cell.char, damage);
      canvas.setPixel(anchor.x + cell.x, anchor.y + cell.y, glyph.char, glyph.color);
    });
  });
}

function findShieldHit(
  x: number,
  y: number,
  arena: Arena,
  shieldDamage: number[][]
): { shieldIndex: number; cellIndex: number } | null {
  const anchors = getShieldAnchors(arena);

  for (let shieldIndex = 0; shieldIndex < anchors.length; shieldIndex++) {
    const anchor = anchors[shieldIndex]!;

    for (let cellIndex = 0; cellIndex < SHIELD_CELLS.length; cellIndex++) {
      const cell = SHIELD_CELLS[cellIndex]!;
      const damage = shieldDamage[shieldIndex]?.[cellIndex] ?? 0;

      if (damage >= MAX_SHIELD_DAMAGE) {
        continue;
      }

      if (anchor.x + cell.x === x && anchor.y + cell.y === y) {
        return { shieldIndex, cellIndex };
      }
    }
  }

  return null;
}

function decrementCounters(state: GameState): GameState {
  return {
    ...state,
    tick: state.tick + 1,
    statusTicks: Math.max(0, state.statusTicks - 1),
    respawnTicks: Math.max(0, state.respawnTicks - 1),
    explosions: state.explosions
      .map((explosion) => ({ ...explosion, ttl: explosion.ttl - 1 }))
      .filter((explosion) => explosion.ttl > 0),
  };
}

function rescheduleSaucer(saucer: Saucer, seed: number): [Saucer, number] {
  let cooldown: number;
  [cooldown, seed] = randomRange(seed, 60, 140);

  return [
    {
      ...saucer,
      active: false,
      cooldown,
      x: -SAUCER_WIDTH,
    },
    seed,
  ];
}

function stepSaucer(saucer: Saucer, seed: number, arena: Arena): [Saucer, number] {
  let next = { ...saucer };

  if (next.active) {
    next.x += next.direction;

    const leftGone = next.direction === -1 && next.x + SAUCER_WIDTH < 0;
    const rightGone = next.direction === 1 && next.x > arena.width;

    if (leftGone || rightGone) {
      [next, seed] = rescheduleSaucer(next, seed);
    }

    return [next, seed];
  }

  next.cooldown -= 1;
  if (next.cooldown > 0) {
    return [next, seed];
  }

  let directionIndex: number;
  [directionIndex, seed] = randomRange(seed, 0, 2);
  let valueIndex: number;
  [valueIndex, seed] = randomRange(seed, 0, SAUCER_VALUES.length);

  next = {
    active: true,
    direction: directionIndex === 0 ? 1 : -1,
    x: directionIndex === 0 ? -SAUCER_WIDTH : arena.width,
    cooldown: 0,
    value: SAUCER_VALUES[valueIndex]!,
  };

  return [next, seed];
}

function findInvaderHitIndex(state: GameState, x: number, y: number): number {
  for (let index = 0; index < state.invaders.length; index++) {
    const invader = state.invaders[index]!;
    if (!invader.alive) {
      continue;
    }

    const position = getInvaderPosition(state, invader);
    if (pointHitsSprite(x, y, position.x, position.y, ENEMY_SPRITES[invader.type]!)) {
      return index;
    }
  }

  return -1;
}

function movePlayer(state: GameState, direction: -1 | 1, arena: Arena): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  return {
    ...state,
    playerX: clamp(
      state.playerX + direction * PLAYER_MOVE_STEP,
      0,
      Math.max(0, arena.width - PLAYER_WIDTH)
    ),
  };
}

export function togglePause(state: GameState): GameState {
  if (state.phase === 'game-over') {
    return state;
  }

  if (state.phase === 'paused') {
    return {
      ...state,
      phase: 'playing',
      status: 'Back in the fight.',
      statusTicks: 12,
      telemetry: appendEvent(state.telemetry, {
        title: 'Resume',
        detail: 'Weapons hot and the scroll resumes.',
        status: 'info',
      }),
    };
  }

  return {
    ...state,
    phase: 'paused',
    status: 'Paused. Inspect the battlefield.',
    statusTicks: 9999,
    telemetry: appendEvent(state.telemetry, {
      title: 'Pause',
      detail: 'Mission control froze the simulation.',
      status: 'warning',
    }),
  };
}

export function firePlayerBullet(state: GameState, arena: Arena): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  const hasPlayerBullet = state.bullets.some((bullet) => bullet.owner === 'player');
  if (hasPlayerBullet) {
    return state;
  }

  return {
    ...state,
    nextId: state.nextId + 1,
    telemetry: {
      ...state.telemetry,
      shotsFired: state.telemetry.shotsFired + 1,
    },
    bullets: [
      ...state.bullets,
      {
        id: state.nextId,
        owner: 'player',
        x: clamp(state.playerX + 1, 0, arena.width - 1),
        y: getPlayerY(arena) - 1,
        dy: -1,
      },
    ],
  };
}

function maybeSpawnEnemyBullet(state: GameState, seed: number): [GameState, number] {
  const enemyBulletCount = state.bullets.filter((bullet) => bullet.owner === 'invader').length;
  const maxEnemyBullets = Math.min(4, 1 + Math.floor(state.level / 2));
  const cadence = Math.max(4, 12 - state.level);

  if (enemyBulletCount >= maxEnemyBullets || state.tick % cadence !== 0) {
    return [state, seed];
  }

  const shooters = getBottomShooters(state);
  if (shooters.length === 0) {
    return [state, seed];
  }

  let shooterIndex: number;
  [shooterIndex, seed] = randomRange(seed, 0, shooters.length);
  const shooter = shooters[shooterIndex]!;
  const position = getInvaderPosition(state, shooter);

  return [
    {
      ...state,
      nextId: state.nextId + 1,
      telemetry: {
        ...state.telemetry,
        enemyShotsFired: state.telemetry.enemyShotsFired + 1,
      },
      bullets: [
        ...state.bullets,
        {
          id: state.nextId,
          owner: 'invader',
          x: position.x + 1,
          y: position.y + 1,
          dy: 1,
        },
      ],
    },
    seed,
  ];
}

function resolveBulletStep(state: GameState, seed: number, arena: Arena): [GameState, number] {
  const movedBullets = state.bullets
    .map((bullet) => ({ ...bullet, y: bullet.y + bullet.dy }))
    .filter((bullet) => bullet.y >= 0 && bullet.y < arena.height);

  const removed = new Set<number>();
  const nextInvaders = state.invaders.slice();
  const nextShieldDamage = state.shieldDamage.map((row) => row.slice());
  const nextExplosions = state.explosions.slice();
  const survivingBullets: Bullet[] = [];
  let nextSaucer = { ...state.saucer };
  let score = state.score;
  let lives = state.lives;
  let phase = state.phase;
  let respawnTicks = state.respawnTicks;
  let status = state.status;
  let statusTicks = state.statusTicks;
  let playerX = state.playerX;
  let playerHit = false;
  let telemetry = state.telemetry;

  for (let i = 0; i < movedBullets.length; i++) {
    for (let j = i + 1; j < movedBullets.length; j++) {
      const first = movedBullets[i]!;
      const second = movedBullets[j]!;

      if (first.owner !== second.owner && first.x === second.x && first.y === second.y) {
        removed.add(first.id);
        removed.add(second.id);
        nextExplosions.push({
          x: first.x,
          y: first.y,
          ttl: 2,
          glyph: '*',
          color: 'whiteBright',
        });
      }
    }
  }

  for (const bullet of movedBullets) {
    if (removed.has(bullet.id)) {
      continue;
    }

    const shieldHit = findShieldHit(bullet.x, bullet.y, arena, nextShieldDamage);
    if (shieldHit) {
      nextShieldDamage[shieldHit.shieldIndex]![shieldHit.cellIndex] = Math.min(
        MAX_SHIELD_DAMAGE,
        (nextShieldDamage[shieldHit.shieldIndex]![shieldHit.cellIndex] ?? 0) + 1
      );
      nextExplosions.push({
        x: bullet.x,
        y: bullet.y,
        ttl: 2,
        glyph: '*',
        color: bullet.owner === 'player' ? 'cyanBright' : 'redBright',
      });
      continue;
    }

    if (bullet.owner === 'player') {
      if (nextSaucer.active && pointHitsSprite(bullet.x, bullet.y, nextSaucer.x, 0, SAUCER_SPRITE)) {
        const bonus = nextSaucer.value;
        score += bonus;
        [nextSaucer, seed] = rescheduleSaucer(nextSaucer, seed);
        telemetry = appendEvent(
          {
            ...telemetry,
            saucersDestroyed: telemetry.saucersDestroyed + 1,
          },
          {
            title: 'Saucer clipped',
            detail: `Bonus haul +${bonus}.`,
            status: 'warning',
          }
        );
        nextExplosions.push({
          x: bullet.x,
          y: bullet.y,
          ttl: 4,
          glyph: '@',
          color: 'yellowBright',
        });
        status = `Bonus saucer +${bonus}`;
        statusTicks = 18;
        continue;
      }

      const invaderIndex = findInvaderHitIndex(
        {
          ...state,
          invaders: nextInvaders,
          formationX: state.formationX,
          formationY: state.formationY,
        },
        bullet.x,
        bullet.y
      );

      if (invaderIndex >= 0) {
        const invader = nextInvaders[invaderIndex]!;
        const points = INVADER_SCORES[invader.type] ?? 10;
        nextInvaders[invaderIndex] = { ...invader, alive: false };
        telemetry = appendEvent(
          {
            ...telemetry,
            invadersDestroyed: telemetry.invadersDestroyed + 1,
          },
          {
            title: 'Invader down',
            detail: `Row ${invader.row + 1} vaporized for +${points}.`,
            status: 'success',
          }
        );
        score += points;
        nextExplosions.push({
          x: bullet.x,
          y: bullet.y,
          ttl: 3,
          glyph: 'x',
          color: ENEMY_COLORS[invader.type] ?? 'greenBright',
        });
        continue;
      }
    } else if (
      phase === 'playing' &&
      respawnTicks === 0 &&
      pointHitsSprite(
        bullet.x,
        bullet.y,
        clamp(playerX, 0, arena.width - PLAYER_WIDTH),
        getPlayerY(arena),
        PLAYER_SPRITE
      )
    ) {
      playerHit = true;
      nextExplosions.push({
        x: bullet.x,
        y: bullet.y,
        ttl: 4,
        glyph: '*',
        color: 'redBright',
      });
      continue;
    }

    survivingBullets.push(bullet);
  }

  let bullets = survivingBullets;
  if (playerHit) {
    lives -= 1;
    bullets = bullets.filter((bullet) => bullet.owner === 'player');
    playerX = centerPlayerX(arena);

    if (lives <= 0) {
      phase = 'game-over';
      lives = 0;
      bullets = [];
      status = 'The invaders broke through.';
      statusTicks = 9999;
      telemetry = appendEvent(telemetry, {
        title: 'Ship down',
        detail: 'The hangar is empty and the flock got through.',
        status: 'error',
      });
    } else {
      respawnTicks = 12;
      status = `Ship hit. ${lives} lives left.`;
      statusTicks = 18;
      telemetry = appendEvent(telemetry, {
        title: 'Hull breach',
        detail: `${lives} life${lives === 1 ? '' : 's'} remaining.`,
        status: 'warning',
      });
    }
  }

  return [
    {
      ...state,
      invaders: nextInvaders,
      shieldDamage: nextShieldDamage,
      explosions: nextExplosions,
      bullets,
      saucer: nextSaucer,
      score,
      hiScore: Math.max(state.hiScore, score),
      lives,
      phase,
      respawnTicks,
      status,
      statusTicks,
      playerX,
      telemetry,
    },
    seed,
  ];
}

function stepFormation(state: GameState, arena: Arena): GameState {
  if (state.formationCooldown > 1) {
    return {
      ...state,
      formationCooldown: state.formationCooldown - 1,
    };
  }

  const bounds = getLiveFormationBounds(state);
  if (!bounds) {
    return state;
  }

  let formationX = state.formationX;
  let formationY = state.formationY;
  let formationDirection = state.formationDirection;
  const wouldHitLeft = bounds.left + formationDirection <= 0;
  const wouldHitRight = bounds.right + formationDirection >= arena.width - 1;

  if (wouldHitLeft || wouldHitRight) {
    formationDirection = (formationDirection * -1) as 1 | -1;
    formationY += 1;
  } else {
    formationX += formationDirection;
  }

  const nextState = {
    ...state,
    formationX,
    formationY,
    formationDirection,
    formationCooldown: getFormationStepDelay(state.level, countAlive(state.invaders), state.invaders.length),
  };

  const nextBounds = getLiveFormationBounds(nextState);
  if (nextBounds && nextBounds.bottom >= getPlayerY(arena) - 1) {
    return {
      ...nextState,
      phase: 'game-over',
      lives: 0,
      bullets: [],
      status: 'The flock reached the roost.',
      statusTicks: 9999,
      telemetry: appendEvent(nextState.telemetry, {
        title: 'Breach',
        detail: 'The formation descended into the hangar line.',
        status: 'error',
      }),
    };
  }

  return nextState;
}

export function advanceGame(state: GameState, arena: Arena): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  let next = decrementCounters(state);
  let seed = next.seed;

  [next.saucer, seed] = stepSaucer(next.saucer, seed, arena);
  [next, seed] = resolveBulletStep(next, seed, arena);

  if (next.phase === 'game-over') {
    return recordTelemetry(
      {
        ...next,
        seed,
        hiScore: Math.max(next.hiScore, next.score),
      },
      arena
    );
  }

  if (countAlive(next.invaders) === 0) {
    const cleared = {
      ...next,
      seed,
      hiScore: Math.max(next.hiScore, next.score),
      telemetry: appendEvent(next.telemetry, {
        title: 'Wave clear',
        detail: `Wave ${next.level} secured. New flock inbound.`,
        status: 'success',
      }),
    };
    const wave = createNextWave(cleared, arena);

    return {
      ...wave,
      status: `Wave ${wave.level} incoming.`,
      statusTicks: 24,
    };
  }

  next = stepFormation(next, arena);
  if (next.phase === 'game-over') {
    return recordTelemetry(
      {
        ...next,
        seed,
        hiScore: Math.max(next.hiScore, next.score),
      },
      arena
    );
  }

  [next, seed] = maybeSpawnEnemyBullet(next, seed);

  return recordTelemetry(
    {
      ...next,
      seed,
      hiScore: Math.max(next.hiScore, next.score),
    },
    arena
  );
}

function renderBoard(state: GameState, arena: Arena): string[] {
  const canvas = createCanvas({ width: arena.width, height: arena.height });
  const playerX = clamp(state.playerX, 0, Math.max(0, arena.width - PLAYER_WIDTH));
  const playerY = getPlayerY(arena);

  drawStarfield(canvas, arena, state.tick, state.level);

  if (state.saucer.active) {
    drawSprite(canvas, state.saucer.x, 0, SAUCER_SPRITE, 'redBright');
  }

  drawShields(canvas, state.shieldDamage, arena);

  for (const invader of state.invaders) {
    if (!invader.alive) {
      continue;
    }

    const { x, y } = getInvaderPosition(state, invader);
    drawSprite(canvas, x, y, ENEMY_SPRITES[invader.type]!, ENEMY_COLORS[invader.type] ?? 'greenBright');
  }

  for (const bullet of state.bullets) {
    canvas.setPixel(
      bullet.x,
      bullet.y,
      bullet.owner === 'player' ? '|' : '!',
      bullet.owner === 'player' ? 'cyanBright' : 'redBright'
    );
  }

  if (state.phase !== 'game-over' && (state.phase === 'paused' || state.respawnTicks === 0 || state.respawnTicks % 2 === 0)) {
    drawSprite(canvas, playerX, playerY, PLAYER_SPRITE, 'cyanBright');
  }

  for (const explosion of state.explosions) {
    canvas.setPixel(explosion.x, explosion.y, explosion.glyph, explosion.color);
  }

  if (state.respawnTicks > 0 && state.phase === 'playing') {
    drawCenteredCallout(canvas, arena, Math.floor(arena.height / 2), 'READY', 'greenBright');
  }

  if (state.phase === 'paused') {
    drawCenteredCallout(canvas, arena, Math.floor(arena.height / 2), 'PAUSED', 'yellow');
  }

  if (state.phase === 'game-over') {
    drawCenteredCallout(canvas, arena, Math.floor(arena.height / 2) - 1, 'GAME OVER', 'redBright');
    drawCenteredCallout(canvas, arena, Math.floor(arena.height / 2) + 1, 'ENTER OR R TO RESTART', 'yellow');
  }

  return canvas.render();
}

function statusColor(state: GameState): string {
  if (state.phase === 'game-over') {
    return 'redBright';
  }
  if (state.phase === 'paused') {
    return 'yellow';
  }
  if (state.respawnTicks > 0) {
    return 'greenBright';
  }
  if (state.statusTicks > 0) {
    return 'yellow';
  }
  return 'gray';
}

function statusText(state: GameState): string {
  if (state.phase === 'game-over') {
    return 'Fleet won this round. Press Enter or R to restart.';
  }
  if (state.phase === 'paused') {
    return 'Mission paused. Press P or Enter to resume, F1 for help.';
  }
  if (state.statusTicks > 0) {
    return state.status;
  }
  return 'Arrows/A/D move. Space fires. P pauses. F1 opens help.';
}

type HudMetrics = {
  aliveCount: number;
  threat: number;
  accuracy: number;
  formationDelay: number;
};

function deriveHudMetrics(state: GameState, arena: Arena): HudMetrics {
  const aliveCount = countAlive(state.invaders);

  return {
    aliveCount,
    threat: getThreatLevel(state, arena),
    accuracy: getAccuracy(state),
    formationDelay: getFormationStepDelay(state.level, aliveCount, state.invaders.length),
  };
}

function Metric(label: string, value: string, color: string): VNode {
  return Box(
    { flexDirection: 'row', gap: 1 },
    Text({ color: 'gray', dim: true }, label),
    Text({ color, bold: true }, value)
  );
}

function getThreatColor(value: number): string {
  if (value >= 76) {
    return 'redBright';
  }
  if (value >= 46) {
    return 'yellow';
  }
  if (value >= 20) {
    return 'cyan';
  }
  return 'greenBright';
}

function getThreatVariant(value: number): 'success' | 'warning' | 'danger' | 'primary' {
  if (value >= 76) {
    return 'danger';
  }
  if (value >= 46) {
    return 'warning';
  }
  if (value >= 20) {
    return 'primary';
  }
  return 'success';
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

function getPhaseStatus(state: GameState): 'running' | 'warning' | 'error' {
  if (state.phase === 'game-over') {
    return 'error';
  }
  if (state.phase === 'paused') {
    return 'warning';
  }
  return 'running';
}

function getStatusForPercent(value: number): 'success' | 'warning' | 'error' {
  if (value >= 65) {
    return 'success';
  }
  if (value >= 35) {
    return 'warning';
  }
  return 'error';
}

function getEventIcon(status: EventSeverity): string {
  switch (status) {
    case 'success':
      return '+';
    case 'warning':
      return '!';
    case 'error':
      return 'x';
    case 'info':
    default:
      return 'i';
  }
}

function HeaderBar(state: GameState, arena: Arena, fps: number, fpsColor: string, metrics: HudMetrics): VNode {
  const { threat } = metrics;
  const saucerLabel = state.saucer.active
    ? 'Saucer live'
    : arena.compact
      ? `${state.saucer.cooldown}t`
      : `Saucer ${state.saucer.cooldown}t`;
  const phaseLabel = state.phase === 'game-over'
    ? 'OVER'
    : state.phase === 'paused'
      ? 'PAUSE'
      : 'LIVE';

  return Box(
    {
      flexDirection: 'row',
      width: 'fill',
      backgroundColor: '#081018',
      paddingX: 1,
      alignItems: 'center',
      gap: 2,
    },
    Box(
      { flexDirection: 'row', gap: 1, alignItems: 'center' },
      Text({ color: 'greenBright', bold: true }, arena.compact ? ' INVADERS ' : ' TUIIUIU-INVADERS '),
      arena.compact
        ? Text({ color: statusColor(state), bold: true }, phaseLabel)
        : getPhaseBadge(state)
    ),
    Box({ flexGrow: 1 }),
    arena.compact
      ? Box(
          { flexDirection: 'row', gap: 2, alignItems: 'center' },
          Metric('S', String(state.score).padStart(4, '0'), 'cyanBright'),
          Metric('L', String(state.lives), 'greenBright'),
          Metric('W', String(state.level), 'yellow'),
          Text({ color: fpsColor, dim: true }, `${fps}fps`)
        )
      : Box(
          { flexDirection: 'row', gap: 2, alignItems: 'center' },
          Metric('Score', String(state.score).padStart(4, '0'), 'cyanBright'),
          Metric('HI', String(state.hiScore).padStart(4, '0'), 'whiteBright'),
          Metric('Lives', String(state.lives), 'greenBright'),
          Metric('Wave', String(state.level), 'yellow'),
          Text({ color: getThreatColor(threat), bold: true }, `Threat ${String(threat).padStart(2, '0')}`),
          Text(
            {
              color: state.saucer.active ? 'yellow' : 'gray',
              bold: state.saucer.active,
              dim: !state.saucer.active,
            },
            saucerLabel
          ),
          Text({ color: fpsColor, dim: true }, `${fps}fps`)
        )
  );
}

function IntelTab(state: GameState, arena: Arena, metrics: HudMetrics): VNode {
  const { threat, aliveCount, formationDelay } = metrics;
  const threatHeatmap = buildThreatHeatmap(state, arena);
  return Box(
    { flexDirection: 'column', gap: 1 },
    Box(
      { flexDirection: 'row', gap: 1 },
      Badge({ label: `WAVE ${state.level}`, variant: 'primary', style: 'subtle' }),
      Badge({ label: `${aliveCount} LEFT`, variant: 'secondary', style: 'subtle' })
    ),
    Digits({
      value: String(state.score).padStart(4, '0'),
      style: 'minimal',
      color: 'cyanBright',
      digits: 4,
      leadingZeros: true,
    }),
    DataRow({ label: 'Hi score', value: String(state.hiScore).padStart(4, '0'), valueColor: 'whiteBright' }),
    DataRow({ label: 'Formation', value: `${formationDelay}t`, valueColor: 'yellow' }),
    Gauge({
      value: threat,
      max: 100,
      label: 'Threat',
      style: 'linear',
      width: 18,
      zones: true,
      valuePosition: 'right',
    }),
    Sparkline({
      data: state.telemetry.threatHistory,
      width: 22,
      color: 'yellow',
      label: 'Trend',
    }),
    Text({ color: 'gray', dim: true }, 'Threat corridor'),
    Heatmap({
      data: threatHeatmap,
      colorScale: 'heat',
      columnHeaders: ['1', '2', '3', '4', '5', '6', '7', '8'],
      cellWidth: 2,
    })
  );
}

function DefenseTab(state: GameState, metrics: HudMetrics): VNode {
  const { accuracy } = metrics;
  const shields = getShieldIntegrity(state);
  return Box(
    { flexDirection: 'column', gap: 1 },
    Box(
      { flexDirection: 'row', gap: 1, alignItems: 'center' },
      StatusIndicator({ status: getPhaseStatus(state), label: 'Hull status', size: 'sm' }),
      Badge({ label: `LIVES ${state.lives}`, variant: state.lives > 1 ? 'success' : 'danger', style: 'outline' })
    ),
    ...shields.map((value, index) =>
      Box(
        { flexDirection: 'column' },
        DataRow({
          label: `Shield ${index + 1}`,
          value: `${value}%`,
          status: getStatusForPercent(value),
        }),
        ProgressBar({
          value,
          max: 100,
          width: 20,
          color: value >= 65 ? 'greenBright' : value >= 35 ? 'yellow' : 'redBright',
          style: 'smooth',
          borderStyle: 'pipes',
        })
      )
    ),
    Gauge({
      value: accuracy,
      max: 100,
      label: 'Accuracy',
      style: 'meter',
      width: 18,
      zones: true,
      showValue: true,
    }),
    Sparkline({
      data: state.telemetry.shieldHistory,
      width: 22,
      color: 'greenBright',
      label: 'Shield',
    }),
    DataRow({ label: 'Shots', value: state.telemetry.shotsFired, valueColor: 'cyanBright' }),
    DataRow({ label: 'Enemy fire', value: state.telemetry.enemyShotsFired, valueColor: 'redBright' })
  );
}

function LogTab(state: GameState, metrics: HudMetrics): VNode {
  const events = state.telemetry.eventLog.length > 0
    ? state.telemetry.eventLog
    : [{ title: 'Quiet', detail: 'No combat events recorded yet.', status: 'info' as const }];

  return Box(
    { flexDirection: 'column', gap: 1 },
    Box(
      { flexDirection: 'row', gap: 1 },
      Badge({ label: `KILLS ${state.telemetry.invadersDestroyed}`, variant: 'success', style: 'subtle' }),
      Badge({ label: `SAUCERS ${state.telemetry.saucersDestroyed}`, variant: 'warning', style: 'subtle' })
    ),
    DataRow({ label: 'Accuracy', value: `${metrics.accuracy}%`, status: getStatusForPercent(metrics.accuracy) }),
    DataRow({ label: 'Telemetry', value: `${state.telemetry.scoreHistory.length} frames`, valueColor: 'gray' }),
    ...events.map((event, index) =>
      ListItem({
        icon: getEventIcon(event.status),
        primary: event.title,
        secondary: event.detail,
        status: event.status,
        selected: index === 0,
      })
    )
  );
}

function Sidebar(
  state: GameState,
  arena: Arena,
  hudTabs: ReturnType<typeof createTabs<HudTabKey>>,
  metrics: HudMetrics,
): VNode {
  const { threat } = metrics;

  return Panel(
    {
      title: 'mission control',
      width: HUD_SIDEBAR_WIDTH,
      borderColor: state.phase === 'game-over' ? 'redBright' : state.phase === 'paused' ? 'yellow' : 'cyan',
      padding: 1,
    },
    Box(
      { flexDirection: 'row', gap: 1, alignItems: 'center' },
      getPhaseBadge(state),
      Badge({ label: `THREAT ${threat}`, variant: getThreatVariant(threat), style: 'subtle' })
    ),
    Tabs({
      tabs: hudTabs.tabs(),
      state: hudTabs,
      isActive: false,
      style: 'pills',
      variant: 'primary',
      width: HUD_SIDEBAR_WIDTH - 4,
    }),
    Text({ color: 'gray', dim: true }, `Grid ${arena.width}x${arena.height} | Terminal ${arena.columns}x${arena.rows}`),
    Text({ color: 'gray', dim: true }, 'Tab / 1 / 2 / 3 switches panels')
  );
}

function FooterBar(state: GameState, arena: Arena, metrics: HudMetrics): VNode {
  const { threat, aliveCount, accuracy } = metrics;
  const compactTelemetry = `W${state.level} | ${aliveCount} left | T${threat} | A${accuracy}%`;
  const controls = arena.compact
    ? compactTelemetry
    : 'Arrows/A/D move | Space fire | Tab panels | P pause | F1 help | Q quit';

  return Box(
    {
      flexDirection: 'row',
      width: 'fill',
      backgroundColor: '#081018',
      paddingX: 1,
      alignItems: 'center',
      gap: 2,
    },
    Text(
      {
        color: statusColor(state),
        bold: state.phase === 'game-over' || state.phase === 'paused',
        wrap: 'truncate-end',
      },
      statusText(state)
    ),
    Box({ flexGrow: 1 }),
    Text(
      {
        color: arena.compact ? getThreatColor(threat) : 'gray',
        dim: !arena.compact,
        wrap: 'truncate-end',
      },
      controls
    )
  );
}

function PauseOverlay(state: GameState, arena: Arena): VNode {
  const threat = getThreatLevel(state, arena);

  return Modal({
    title: 'simulation paused',
    size: {
      width: Math.min(62, Math.max(44, arena.columns - 4)),
      height: Math.min(18, Math.max(14, arena.rows - 4)),
    },
    borderStyle: 'round',
    borderColor: 'yellow',
    titleColor: 'yellow',
    backdrop: true,
    showCloseHint: true,
    closeHint: 'P or Enter resumes',
    content: Box(
      { flexDirection: 'column', gap: 1 },
      BigText({ text: 'PAUSE', font: arena.columns >= 110 ? 'small' : 'mini', color: 'yellow' }),
      StatusIndicator({ status: 'warning', label: 'Combat simulation halted' }),
      Box(
        { flexDirection: 'row', gap: 2, alignItems: 'center' },
        Gauge({
          value: threat,
          max: 100,
          label: 'Threat',
          style: 'arc',
          width: 15,
          zones: true,
        }),
        Box(
          { flexDirection: 'column', gap: 1 },
          DataRow({ label: 'Score', value: state.score, valueColor: 'cyanBright' }),
          DataRow({ label: 'Wave', value: state.level, valueColor: 'yellow' }),
          DataRow({ label: 'Accuracy', value: `${getAccuracy(state)}%`, status: getStatusForPercent(getAccuracy(state)) }),
          Sparkline({
            data: state.telemetry.threatHistory,
            width: 22,
            color: 'yellow',
            label: 'Threat',
          })
        )
      )
    ),
    footer: Box(
      { flexDirection: 'row', gap: 1 },
      Badge({ label: 'P RESUME', variant: 'success', style: 'outline' }),
      Badge({ label: 'F1 HELP', variant: 'primary', style: 'subtle' })
    ),
  });
}

function HelpOverlay(arena: Arena): VNode {
  const width = Math.min(74, Math.max(50, arena.columns - 4));
  const controls = [
    { key: 'Arrows / A / D / H / L', action: 'Strafe the ship', note: 'H and L are vim alternates' },
    { key: 'Space', action: 'Fire one shot', note: 'Only one player bullet can stay active' },
    { key: 'P / Enter', action: 'Pause or resume', note: 'Enter also restarts after defeat' },
    { key: 'Tab / 1 / 2 / 3', action: 'Switch HUD panels', note: 'Wide layout only' },
    { key: 'F1', action: 'Toggle this overlay', note: 'Freezes the simulation while open' },
    { key: 'R / Q', action: 'Restart or quit', note: 'Esc closes help before quitting' },
  ];

  return Modal({
    title: 'mission control',
    size: {
      width,
      height: Math.min(22, Math.max(16, arena.rows - 2)),
    },
    borderStyle: 'round',
    borderColor: 'cyan',
    titleColor: 'cyanBright',
    backdrop: true,
    showCloseHint: true,
    closeHint: 'F1 closes',
    content: Box(
      { flexDirection: 'column', gap: 1 },
      BigText({ text: 'HELP', font: width >= 64 ? 'small' : 'mini', color: 'cyanBright' }),
      StatusIndicator({ status: 'info', label: 'This example stresses more of the tuiuiu.js surface area.' }),
      Table({
        columns: [
          { key: 'key', header: 'Key', width: 20, color: 'cyanBright' },
          { key: 'action', header: 'Action', width: 18 },
          { key: 'note', header: 'Note', flex: 1, minWidth: 18, color: 'gray' },
        ],
        data: controls,
        compact: true,
        borderStyle: 'round',
        availableWidth: width - 8,
      }),
      Box(
        { flexDirection: 'row', gap: 1 },
        Badge({ label: 'Canvas', variant: 'primary', style: 'subtle' }),
        Badge({ label: 'Tabs', variant: 'primary', style: 'subtle' }),
        Badge({ label: 'Heatmap', variant: 'warning', style: 'subtle' }),
        Badge({ label: 'Modal', variant: 'info', style: 'subtle' })
      ),
      Text({ color: 'gray', dim: true }, 'Wide terminals unlock the full mission control sidebar.')
    ),
  });
}

function debriefPrimaryLabel(section: DebriefSectionKey): string {
  switch (section) {
    case 'summary':
      return 'Summary';
    case 'telemetry':
      return 'Telemetry';
    case 'arsenal':
    default:
      return 'Arsenal';
  }
}

function debriefSecondaryLabel(section: DebriefSectionKey): string {
  switch (section) {
    case 'summary':
      return 'Match outcome and totals';
    case 'telemetry':
      return 'Threat curves and radar';
    case 'arsenal':
    default:
      return 'Shields, lives and event feed';
  }
}

function DebriefDetail(section: DebriefSectionKey, state: GameState, arena: Arena): VNode {
  if (section === 'summary') {
    const summary = [
      { metric: 'Score', value: String(state.score) },
      { metric: 'Hi score', value: String(state.hiScore) },
      { metric: 'Wave', value: String(state.level) },
      { metric: 'Invaders destroyed', value: String(state.telemetry.invadersDestroyed) },
      { metric: 'Saucer hits', value: String(state.telemetry.saucersDestroyed) },
      { metric: 'Accuracy', value: `${getAccuracy(state)}%` },
    ];

    return Box(
      { flexDirection: 'column', gap: 1, paddingLeft: 1 },
      Badge({ label: 'DEBRIEF', variant: 'danger', style: 'subtle' }),
      Table({
        columns: [
          { key: 'metric', header: 'Metric', width: 18, color: 'gray' },
          { key: 'value', header: 'Value', flex: 1, minWidth: 10, color: 'whiteBright' },
        ],
        data: summary,
        compact: true,
        borderStyle: 'round',
        availableWidth: Math.min(30, arena.columns - 28),
      })
    );
  }

  if (section === 'telemetry') {
    const threat = getThreatLevel(state, arena);

    return Box(
      { flexDirection: 'column', gap: 1, paddingLeft: 1 },
      Gauge({
        value: threat,
        max: 100,
        label: 'Threat',
        style: 'linear',
        width: 18,
        zones: true,
      }),
      Sparkline({
        data: state.telemetry.threatHistory,
        width: 20,
        color: 'yellow',
        label: 'Threat',
      }),
      Sparkline({
        data: state.telemetry.scoreHistory,
        width: 20,
        color: 'cyanBright',
        label: 'Score',
      }),
      Heatmap({
        data: buildThreatHeatmap(state, arena),
        colorScale: 'heat',
        columnHeaders: ['1', '2', '3', '4', '5', '6', '7', '8'],
        cellWidth: 2,
      })
    );
  }

  return Box(
    { flexDirection: 'column', gap: 1, paddingLeft: 1 },
    ...getShieldIntegrity(state).map((value, index) =>
      Box(
        { flexDirection: 'column' },
        DataRow({
          label: `Shield ${index + 1}`,
          value: `${value}%`,
          status: getStatusForPercent(value),
        }),
        ProgressBar({
          value,
          max: 100,
          width: 18,
          color: value >= 65 ? 'greenBright' : value >= 35 ? 'yellow' : 'redBright',
          style: 'smooth',
          borderStyle: 'pipes',
        })
      )
    ),
    ...state.telemetry.eventLog.slice(0, 2).map((event, index) =>
      ListItem({
        icon: getEventIcon(event.status),
        primary: event.title,
        secondary: event.detail,
        status: event.status,
        selected: index === 0,
      })
    )
  );
}

function GameOverOverlay(
  state: GameState,
  arena: Arena,
  debriefView: ReturnType<typeof createSplitView<DebriefSectionKey>>
): VNode {
  const sections: DebriefSectionKey[] = ['summary', 'telemetry', 'arsenal'];

  return Modal({
    title: 'debrief',
    size: {
      width: Math.min(68, Math.max(48, arena.columns - 4)),
      height: Math.min(20, Math.max(15, arena.rows - 4)),
    },
    borderStyle: 'round',
    borderColor: 'redBright',
    titleColor: 'redBright',
    backdrop: true,
    showCloseHint: true,
    closeHint: 'Up/Down changes section',
    content: Box(
      { flexDirection: 'column', gap: 1 },
      BigText({ text: 'OVER', font: 'mini', color: 'redBright' }),
      StatusIndicator({ status: 'error', label: 'Fleet broke through the last line.' }),
      Box(
        { flexDirection: 'row', gap: 1 },
        Badge({ label: `SCORE ${state.score}`, variant: 'primary', style: 'outline' }),
        Badge({ label: `HI ${state.hiScore}`, variant: 'warning', style: 'subtle' })
      ),
      SplitView<DebriefSectionKey>({
        state: debriefView,
        keysEnabled: false,
        ratio: 0.34,
        renderItem: (section, _index, selected) =>
          ListItem({
            primary: debriefPrimaryLabel(section),
            secondary: debriefSecondaryLabel(section),
            selected,
            status: section === 'summary' ? 'error' : section === 'telemetry' ? 'warning' : 'success',
          }),
        renderDetail: (section) => DebriefDetail(section ?? 'summary', state, arena),
        items: sections,
      })
    ),
  });
}

function ActiveOverlay(
  state: GameState,
  arena: Arena,
  helpOpen: boolean,
  debriefView: ReturnType<typeof createSplitView<DebriefSectionKey>>
): VNode | null {
  if (helpOpen) {
    return HelpOverlay(arena);
  }
  if (state.phase === 'paused') {
    return PauseOverlay(state, arena);
  }
  if (state.phase === 'game-over') {
    return GameOverOverlay(state, arena, debriefView);
  }
  return null;
}

function ScreenTooSmall(arena: Arena): VNode {
  return Box(
    {
      flexDirection: 'column',
      height: 'fill',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 1,
      gap: 1,
    },
    Text({ color: 'greenBright', bold: true }, 'tuiuiu-invaders'),
    Text({ color: 'yellow', bold: true }, `Need at least ${MIN_COLUMNS}x${MIN_ROWS}`),
    Text({ color: 'gray' }, `Current terminal: ${arena.columns}x${arena.rows}`),
    Text({ color: 'gray', dim: true }, 'Resize the terminal for the full mission-control layout or press Q / Esc to leave.')
  );
}

function MenuView(state: GameState, arena: Arena, menuSelection: number): VNode {
  const width = Math.min(52, Math.max(38, arena.columns - 20));

  return Box(
    {
      flexDirection: 'column',
      height: 'fill',
      width: 'fill',
      justifyContent: 'center',
      alignItems: 'center',
      paddingX: 1,
      gap: 1,
    },
    BigText({ text: 'INVADERS', font: arena.columns >= 110 ? 'small' : 'mini', color: 'greenBright' }),
    Box(
      { flexDirection: 'row', gap: 1, alignItems: 'center' },
      Text({ color: 'cyanBright', bold: true }, 'ASCII DEFENSE'),
      Text({ color: 'gray', dim: true }, 'HI'),
      Text({ color: 'yellow', bold: true }, String(state.hiScore).padStart(4, '0'))
    ),
    Panel(
      { title: 'main menu', padding: 1, width, borderColor: 'cyan' },
      Box(
        { flexDirection: 'column', gap: 1 },
        ...MENU_OPTIONS.map((option, index) =>
          Box(
            {
              flexDirection: 'column',
              backgroundColor: menuSelection === index ? '#1d4ed8' : undefined,
              paddingX: 1,
              paddingY: 0,
            },
            Box(
              { flexDirection: 'row', gap: 1 },
              Text({ color: menuSelection === index ? 'whiteBright' : 'cyanBright', bold: true }, menuSelection === index ? '>' : ' '),
              Text({ color: menuSelection === index ? 'whiteBright' : 'whiteBright', bold: true }, option.label)
            ),
            Text(
              { color: menuSelection === index ? 'whiteBright' : 'gray', dim: menuSelection !== index },
              option.detail
            )
          )
        )
      ),
      Text({ color: 'gray', dim: true }, 'Use Up/Down and Enter')
    ),
    Text({ color: 'gray', dim: true }, 'Press Q or Esc to quit')
  );
}

function TuiuiuInvaders(): VNode {
  const { exit } = useApp();
  const { fps, color: fpsColor } = useFps();
  const terminal = useTerminalSize();
  const arena = getArena(terminal.columns, terminal.rows);
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [game, setGame] = useState(createNewGameState(arena));
  const [menuSelection, setMenuSelection] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const hudTabs = useConst(() => createTabs<HudTabKey>({
    tabs: [
      {
        key: 'intel',
        label: 'intel',
        content: () => {
          const currentState = game();
          const currentArena = getArena(terminal.columns, terminal.rows);
          return IntelTab(currentState, currentArena, deriveHudMetrics(currentState, currentArena));
        },
      },
      {
        key: 'defense',
        label: 'defense',
        content: () => {
          const currentState = game();
          const currentArena = getArena(terminal.columns, terminal.rows);
          return DefenseTab(currentState, deriveHudMetrics(currentState, currentArena));
        },
      },
      {
        key: 'log',
        label: 'log',
        content: () => {
          const currentState = game();
          const currentArena = getArena(terminal.columns, terminal.rows);
          return LogTab(currentState, deriveHudMetrics(currentState, currentArena));
        },
      },
    ],
    initialTab: 'intel',
  }));
  const debriefView = useConst(() => createSplitView<DebriefSectionKey>({
    items: ['summary', 'telemetry', 'arsenal'],
    initialIndex: 0,
    keysEnabled: false,
  }));
  const currentScreen = screen();
  const state = game();
  const isHelpOpen = helpOpen();
  const hudMetrics = deriveHudMetrics(state, arena);

  function startGame(): void {
    setHelpOpen(false);
    setMenuSelection(0);
    debriefView.select(0);
    hudTabs.setActiveTab('intel');
    setGame((current) => createNewGameState(arena, current.hiScore));
    setScreen('game');
  }

  function moveMenuSelection(delta: number): void {
    const count = MENU_OPTIONS.length;
    setMenuSelection((current) => (current + delta + count) % count);
  }

  function activateMenuSelection(): void {
    const current = MENU_OPTIONS[menuSelection()];
    if (current?.action === 'start') {
      startGame();
      return;
    }
    exit();
  }

  useShortcut(['left', 'a', 'h'], () => {
    if (currentScreen !== 'game' || isHelpOpen) {
      return;
    }
    setGame((current) => movePlayer(current, -1, arena));
  });

  useShortcut(['right', 'd', 'l'], () => {
    if (currentScreen !== 'game' || isHelpOpen) {
      return;
    }
    setGame((current) => movePlayer(current, 1, arena));
  });

  useShortcut('space', () => {
    if (currentScreen !== 'game' || isHelpOpen) {
      return;
    }
    setGame((current) => current.phase === 'game-over'
      ? createNewGameState(arena, current.hiScore)
      : firePlayerBullet(current, arena));
  });

  useShortcut('p', () => {
    if (currentScreen !== 'game' || isHelpOpen) {
      return;
    }
    setGame((current) => togglePause(current));
  });

  useShortcut('r', () => {
    if (currentScreen !== 'game') {
      return;
    }
    setHelpOpen(false);
    debriefView.select(0);
    setGame((current) => createNewGameState(arena, current.hiScore));
  });

  useShortcut('enter', () => {
    if (currentScreen === 'menu') {
      activateMenuSelection();
      return;
    }
    if (isHelpOpen) {
      setHelpOpen(false);
      return;
    }
    setGame((current) => current.phase === 'game-over'
      ? (debriefView.select(0), createNewGameState(arena, current.hiScore))
      : current.phase === 'paused'
        ? togglePause(current)
        : current);
  });

  useShortcut(['up', 'k'], () => {
    if (currentScreen === 'menu') {
      moveMenuSelection(-1);
      return;
    }
    if (isHelpOpen || state.phase !== 'game-over') {
      return;
    }
    debriefView.selectPrevious();
  });

  useShortcut(['down', 'j'], () => {
    if (currentScreen === 'menu') {
      moveMenuSelection(1);
      return;
    }
    if (isHelpOpen || state.phase !== 'game-over') {
      return;
    }
    debriefView.selectNext();
  });

  useShortcut('tab', () => {
    if (currentScreen !== 'game' || isHelpOpen || arena.compact) {
      return;
    }
    hudTabs.moveNext();
    hudTabs.selectFocused();
  });

  useShortcut('1', () => {
    if (currentScreen !== 'game' || isHelpOpen || arena.compact) {
      return;
    }
    hudTabs.setActiveTab('intel');
  });

  useShortcut('2', () => {
    if (currentScreen !== 'game' || isHelpOpen || arena.compact) {
      return;
    }
    hudTabs.setActiveTab('defense');
  });

  useShortcut('3', () => {
    if (currentScreen !== 'game' || isHelpOpen || arena.compact) {
      return;
    }
    hudTabs.setActiveTab('log');
  });

  useShortcut('f1', () => {
    if (currentScreen !== 'game') {
      return;
    }
    setHelpOpen((current) => !current);
  });

  useShortcut('escape', () => {
    if (currentScreen === 'menu') {
      exit();
      return;
    }
    if (isHelpOpen) {
      setHelpOpen(false);
      return;
    }
    if (state.phase === 'paused') {
      setGame((current) => togglePause(current));
      return;
    }
    exit();
  });

  useShortcut(['q', 'ctrl+c'], () => {
    exit();
  });

  useInterval(
    () => {
      setGame((current) => advanceGame(current, arena));
    },
    TICK_MS,
    { enabled: arena.playable && currentScreen === 'game' && state.phase === 'playing' && !isHelpOpen }
  );

  if (!arena.playable) {
    return ScreenTooSmall(arena);
  }

  if (currentScreen === 'menu') {
    return MenuView(state, arena, menuSelection());
  }

  const boardLines = renderBoard(state, arena);
  const overlay = ActiveOverlay(state, arena, isHelpOpen, debriefView);

  return Box(
    {
      flexDirection: 'column',
      height: 'fill',
      width: 'fill',
      position: 'relative',
    },
    HeaderBar(state, arena, fps, fpsColor, hudMetrics),
    Box(
      {
        flexDirection: arena.compact ? 'column' : 'row',
        justifyContent: arena.compact ? 'flex-start' : 'center',
        alignItems: arena.compact ? 'center' : 'flex-start',
        gap: 1,
        flexGrow: 1,
        paddingX: 1,
      },
      Box(
        { flexDirection: 'column', width: arena.width },
        Box(
          {
            flexDirection: 'column',
            borderStyle: 'round',
            borderColor: state.phase === 'game-over' ? 'redBright' : state.phase === 'paused' ? 'yellow' : 'greenBright',
            padding: 0,
            width: arena.width,
          },
          ...boardLines.map((line) => Text({}, line))
        )
      ),
      arena.compact ? null : Sidebar(state, arena, hudTabs, hudMetrics)
    ),
    FooterBar(state, arena, hudMetrics),
    overlay
  );
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  return import.meta.url === pathToFileURL(entry).href;
}

export async function runTuiuiuInvaders(): Promise<void> {
  const { waitUntilExit } = render(TuiuiuInvaders, {
    screen: 'fullscreen',
    autoTabNavigation: false,
    maxFps: 40,
  });
  await waitUntilExit();
}

if (isMainModule()) {
  await runTuiuiuInvaders();
}
