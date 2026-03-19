/**
 * tuiuiu-meteor
 *
 * Asteroids-style terminal showcase for tuiuiu.js.
 *
 * Features:
 * - Rotating ship with thrust, drag, and wrap-around movement
 * - Fragmenting meteors with large/medium/small sizes
 * - Score chase, lives, wave progression, pause, help, and restart
 * - Responsive HUD with telemetry and event log
 *
 * Run: pnpm example tuiuiu-meteor
 */

import { pathToFileURL } from 'node:url';

import {
  render,
  Badge,
  BigText,
  Box,
  DataRow,
  Digits,
  Gauge,
  Modal,
  ProgressBar,
  Sparkline,
  StatusIndicator,
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

const TICK_MS = 75;
const INITIAL_SEED = 0x51ce0bad;
const MIN_COLUMNS = 64;
const MIN_ROWS = 24;
const MAX_GAME_WIDTH = 72;
const MAX_GAME_HEIGHT = 28;
const HUD_SIDEBAR_BREAKPOINT = 118;
const HUD_MIN_ROWS_FOR_SIDEBAR = 30;
const HUD_SIDEBAR_WIDTH = 34;
const SHIP_ACCELERATION = 0.18;
const SHIP_DRAG = 0.985;
const SHIP_BRAKE = 0.8;
const SHIP_MAX_SPEED = 1.35;
const BULLET_SPEED = 1.8;
const BULLET_TTL = 26;
const FIRE_COOLDOWN = 3;
const RESPAWN_TICKS = 20;
const STATUS_TICKS = 18;
const HISTORY_LIMIT = 28;
const EVENT_LOG_LIMIT = 6;
const INITIAL_LIVES = 3;
const SHIP_RADIUS = 0.85;
const SCORE_WIDTH = 5;

const DIRECTION_VECTORS = [
  { x: 0, y: -1 },
  { x: 0.7, y: -0.7 },
  { x: 1, y: 0 },
  { x: 0.7, y: 0.7 },
  { x: 0, y: 1 },
  { x: -0.7, y: 0.7 },
  { x: -1, y: 0 },
  { x: -0.7, y: -0.7 },
] as const;

const HEADING_LABELS = ['N ', 'NE', 'E ', 'SE', 'S ', 'SW', 'W ', 'NW'] as const;
const SHIP_GLYPHS = ['^', '/', '>', '\\', 'v', '\\', '<', '/'] as const;

const METEOR_SPRITES: Record<MeteorSize, readonly string[]> = {
  3: [
    ' O ',
    'OOO',
    ' O ',
  ],
  2: [
    'OO',
    'OO',
  ],
  1: ['o'],
};

type EventSeverity = 'success' | 'warning' | 'error' | 'info';
export type MeteorSize = 1 | 2 | 3;
export type GamePhase = 'playing' | 'paused' | 'game-over';

export type Arena = {
  width: number;
  height: number;
  columns: number;
  rows: number;
  compact: boolean;
  playable: boolean;
};

export type Ship = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  respawnTicks: number;
  fireCooldown: number;
  thrustTicks: number;
};

export type Bullet = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
};

export type Meteor = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: MeteorSize;
};

type Explosion = {
  id: number;
  x: number;
  y: number;
  ttl: number;
  glyph: string;
  color: string;
};

type CombatEvent = {
  title: string;
  detail: string;
  status: EventSeverity;
};

type Telemetry = {
  shotsFired: number;
  meteorsDestroyed: number;
  fragmentsCreated: number;
  wavesCleared: number;
  scoreHistory: number[];
  meteorHistory: number[];
  speedHistory: number[];
  eventLog: CombatEvent[];
};

export type GameState = {
  score: number;
  hiScore: number;
  lives: number;
  level: number;
  phase: GamePhase;
  tick: number;
  nextId: number;
  seed: number;
  ship: Ship;
  bullets: Bullet[];
  meteors: Meteor[];
  explosions: Explosion[];
  status: string;
  statusTicks: number;
  telemetry: Telemetry;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function wrap(value: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }

  if (value < 0) {
    return value + limit;
  }
  if (value >= limit) {
    return value - limit;
  }
  return value;
}

function normalizeNearZero(value: number): number {
  return Math.abs(value) < 0.01 ? 0 : value;
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

function createTelemetry(score: number, meteorCount: number, bootMessage: string): Telemetry {
  return {
    shotsFired: 0,
    meteorsDestroyed: 0,
    fragmentsCreated: 0,
    wavesCleared: 0,
    scoreHistory: [score],
    meteorHistory: [meteorCount],
    speedHistory: [0],
    eventLog: [
      {
        title: 'Launch',
        detail: bootMessage,
        status: 'info',
      },
    ],
  };
}

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function randomUnit(seed: number): [number, number] {
  const next = nextSeed(seed);
  return [next / 0xffffffff, next];
}

function randomFloat(seed: number, min: number, max: number): [number, number] {
  const [unit, next] = randomUnit(seed);
  return [min + unit * (max - min), next];
}

function randomInt(seed: number, min: number, maxExclusive: number): [number, number] {
  const [unit, next] = randomUnit(seed);
  return [Math.floor(min + unit * (maxExclusive - min)), next];
}

function getShipSpawn(arena: Arena): Ship {
  return {
    x: Math.floor(arena.width / 2),
    y: Math.floor(arena.height / 2),
    vx: 0,
    vy: 0,
    facing: 0,
    respawnTicks: 0,
    fireCooldown: 0,
    thrustTicks: 0,
  };
}

export function getArena(columns: number, rows: number): Arena {
  const compact = columns < HUD_SIDEBAR_BREAKPOINT || rows < HUD_MIN_ROWS_FOR_SIDEBAR;
  const widthBudget = compact ? columns - 6 : columns - HUD_SIDEBAR_WIDTH - 8;
  const heightBudget = rows - (compact ? 12 : 7);

  return {
    width: Math.max(40, Math.min(MAX_GAME_WIDTH, widthBudget)),
    height: Math.max(18, Math.min(MAX_GAME_HEIGHT, heightBudget)),
    columns,
    rows,
    compact,
    playable: columns >= MIN_COLUMNS && rows >= MIN_ROWS,
  };
}

function wrappedDelta(from: number, to: number, limit: number): number {
  let delta = from - to;

  if (Math.abs(delta) > limit / 2) {
    delta = delta > 0 ? delta - limit : delta + limit;
  }

  return delta;
}

function wrappedDistance(ax: number, ay: number, bx: number, by: number, arena: Arena): number {
  const dx = wrappedDelta(ax, bx, arena.width);
  const dy = wrappedDelta(ay, by, arena.height);
  return Math.hypot(dx, dy);
}

function getMeteorRadius(size: MeteorSize): number {
  switch (size) {
    case 3:
      return 1.7;
    case 2:
      return 1.15;
    case 1:
    default:
      return 0.7;
  }
}

function getMeteorColor(size: MeteorSize): string {
  switch (size) {
    case 3:
      return 'yellowBright';
    case 2:
      return 'magentaBright';
    case 1:
    default:
      return 'cyanBright';
  }
}

function getMeteorScore(size: MeteorSize): number {
  switch (size) {
    case 3:
      return 20;
    case 2:
      return 50;
    case 1:
    default:
      return 100;
  }
}

function getMeteorLabel(size: MeteorSize): string {
  switch (size) {
    case 3:
      return 'macro';
    case 2:
      return 'split';
    case 1:
    default:
      return 'shard';
  }
}

function moveEntityWithWrap<T extends { x: number; y: number; vx: number; vy: number }>(
  entity: T,
  arena: Arena
): T {
  return {
    ...entity,
    x: wrap(entity.x + entity.vx, arena.width),
    y: wrap(entity.y + entity.vy, arena.height),
  };
}

function spawnWave(level: number, arena: Arena, seed: number, nextId: number): [Meteor[], number, number] {
  const meteors: Meteor[] = [];
  let currentSeed = seed;
  let currentId = nextId;
  const meteorCount = Math.min(4 + level, 10);

  for (let index = 0; index < meteorCount; index++) {
    let side: number;
    let position: number;
    let lane: number;
    let angleJitter: number;
    let speedRoll: number;

    [side, currentSeed] = randomInt(currentSeed, 0, 4);
    [position, currentSeed] = randomFloat(currentSeed, 0, side % 2 === 0 ? arena.width - 1 : arena.height - 1);
    [lane, currentSeed] = randomFloat(currentSeed, 0, 1.5);
    [angleJitter, currentSeed] = randomFloat(currentSeed, -0.65, 0.65);
    [speedRoll, currentSeed] = randomFloat(currentSeed, 0.16, 0.32);

    let x = 0;
    let y = 0;
    let baseAngle = 0;

    if (side === 0) {
      x = position;
      y = lane;
      baseAngle = Math.PI / 2;
    } else if (side === 1) {
      x = arena.width - 1 - lane;
      y = position;
      baseAngle = Math.PI;
    } else if (side === 2) {
      x = position;
      y = arena.height - 1 - lane;
      baseAngle = -Math.PI / 2;
    } else {
      x = lane;
      y = position;
      baseAngle = 0;
    }

    const angle = baseAngle + angleJitter;
    const speed = speedRoll + Math.min(0.12, level * 0.015);

    meteors.push({
      id: currentId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3,
    });
  }

  return [meteors, currentSeed, currentId];
}

function createFragments(
  meteor: Meteor,
  bullet: Bullet,
  nextId: number,
  arena: Arena
): [Meteor[], number] {
  if (meteor.size === 1) {
    return [[], nextId];
  }

  const nextSize = (meteor.size - 1) as MeteorSize;
  const bulletAngle = Math.atan2(bullet.vy || meteor.vy || 0.2, bullet.vx || meteor.vx || 0.2);
  const splitAngles = [bulletAngle + Math.PI / 3, bulletAngle - Math.PI / 3];
  const fragments: Meteor[] = [];
  let currentId = nextId;

  for (const angle of splitAngles) {
    const speed = Math.min(1.15, Math.hypot(meteor.vx, meteor.vy) + (nextSize === 2 ? 0.28 : 0.36));
    fragments.push({
      id: currentId++,
      x: wrap(meteor.x + Math.cos(angle) * 0.6, arena.width),
      y: wrap(meteor.y + Math.sin(angle) * 0.6, arena.height),
      vx: meteor.vx * 0.35 + Math.cos(angle) * speed,
      vy: meteor.vy * 0.35 + Math.sin(angle) * speed,
      size: nextSize,
    });
  }

  return [fragments, currentId];
}

export function countMeteors(state: GameState): number {
  return state.meteors.length;
}

export function getAccuracy(state: GameState): number {
  if (state.telemetry.shotsFired === 0) {
    return 0;
  }

  return Math.round((state.telemetry.meteorsDestroyed / state.telemetry.shotsFired) * 100);
}

export function getPlayerSpeedPercent(state: GameState): number {
  return Math.round((Math.hypot(state.ship.vx, state.ship.vy) / SHIP_MAX_SPEED) * 100);
}

function getShipHeadingLabel(facing: number): string {
  return HEADING_LABELS[((facing % HEADING_LABELS.length) + HEADING_LABELS.length) % HEADING_LABELS.length]!;
}

export function getThreatLevel(state: GameState, arena: Arena): number {
  if (state.meteors.length === 0) {
    return 0;
  }

  let nearest = Number.POSITIVE_INFINITY;
  let weight = 0;

  for (const meteor of state.meteors) {
    nearest = Math.min(nearest, wrappedDistance(meteor.x, meteor.y, state.ship.x, state.ship.y, arena));
    weight += meteor.size === 3 ? 18 : meteor.size === 2 ? 14 : 9;
  }

  const maxDistance = Math.hypot(arena.width / 2, arena.height / 2);
  const proximity = clamp(100 - Math.round((nearest / maxDistance) * 100), 0, 100);
  const density = clamp(weight + state.level * 5, 0, 100);

  return clamp(Math.round(proximity * 0.6 + density * 0.4), 0, 100);
}

function withTelemetrySample(state: GameState): GameState {
  return {
    ...state,
    telemetry: {
      ...state.telemetry,
      scoreHistory: pushHistory(state.telemetry.scoreHistory, state.score),
      meteorHistory: pushHistory(state.telemetry.meteorHistory, state.meteors.length),
      speedHistory: pushHistory(state.telemetry.speedHistory, getPlayerSpeedPercent(state)),
    },
  };
}

export function createNewGameState(arena: Arena, hiScore = 0): GameState {
  let seed = INITIAL_SEED;
  let nextId = 1;
  const [meteors, nextSeedValue, nextIdValue] = spawnWave(1, arena, seed, nextId);

  seed = nextSeedValue;
  nextId = nextIdValue;

  return {
    score: 0,
    hiScore,
    lives: INITIAL_LIVES,
    level: 1,
    phase: 'playing',
    tick: 0,
    nextId,
    seed,
    ship: getShipSpawn(arena),
    bullets: [],
    meteors,
    explosions: [],
    status: 'Sector hot. Break the meteor field.',
    statusTicks: STATUS_TICKS,
    telemetry: createTelemetry(0, meteors.length, 'Initial meteor cloud detected.'),
  };
}

export function rotateShip(state: GameState, direction: -1 | 1): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  return {
    ...state,
    ship: {
      ...state.ship,
      facing: (state.ship.facing + direction + DIRECTION_VECTORS.length) % DIRECTION_VECTORS.length,
    },
  };
}

export function thrustShip(state: GameState): GameState {
  if (state.phase !== 'playing' || state.ship.respawnTicks > 0) {
    return state;
  }

  const heading = DIRECTION_VECTORS[state.ship.facing]!;
  const vx = clamp(state.ship.vx + heading.x * SHIP_ACCELERATION, -SHIP_MAX_SPEED, SHIP_MAX_SPEED);
  const vy = clamp(state.ship.vy + heading.y * SHIP_ACCELERATION, -SHIP_MAX_SPEED, SHIP_MAX_SPEED);

  return {
    ...state,
    ship: {
      ...state.ship,
      vx,
      vy,
      thrustTicks: 2,
    },
  };
}

export function stabilizeShip(state: GameState): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  return {
    ...state,
    ship: {
      ...state.ship,
      vx: normalizeNearZero(state.ship.vx * SHIP_BRAKE),
      vy: normalizeNearZero(state.ship.vy * SHIP_BRAKE),
    },
  };
}

export function fireBullet(state: GameState, arena?: Arena): GameState {
  if (state.phase !== 'playing' || state.ship.respawnTicks > 0 || state.ship.fireCooldown > 0) {
    return state;
  }

  const heading = DIRECTION_VECTORS[state.ship.facing]!;
  const bullet: Bullet = {
    id: state.nextId,
    x: arena ? wrap(state.ship.x + heading.x * 1.2, arena.width) : state.ship.x + heading.x * 1.2,
    y: arena ? wrap(state.ship.y + heading.y * 1.2, arena.height) : state.ship.y + heading.y * 1.2,
    vx: state.ship.vx + heading.x * BULLET_SPEED,
    vy: state.ship.vy + heading.y * BULLET_SPEED,
    ttl: BULLET_TTL,
  };

  return {
    ...state,
    nextId: state.nextId + 1,
    ship: {
      ...state.ship,
      fireCooldown: FIRE_COOLDOWN,
    },
    bullets: [...state.bullets, bullet],
    telemetry: {
      ...state.telemetry,
      shotsFired: state.telemetry.shotsFired + 1,
    },
  };
}

export function togglePause(state: GameState): GameState {
  if (state.phase === 'game-over') {
    return state;
  }

  return {
    ...state,
    phase: state.phase === 'paused' ? 'playing' : 'paused',
  };
}

function advanceShip(ship: Ship, arena: Arena): Ship {
  return {
    ...moveEntityWithWrap(ship, arena),
    vx: normalizeNearZero(ship.vx * SHIP_DRAG),
    vy: normalizeNearZero(ship.vy * SHIP_DRAG),
    respawnTicks: Math.max(0, ship.respawnTicks - 1),
    fireCooldown: Math.max(0, ship.fireCooldown - 1),
    thrustTicks: Math.max(0, ship.thrustTicks - 1),
  };
}

function advanceBullets(bullets: Bullet[], arena: Arena): Bullet[] {
  return bullets
    .map((bullet) => ({
      ...moveEntityWithWrap(bullet, arena),
      ttl: bullet.ttl - 1,
    }))
    .filter((bullet) => bullet.ttl > 0);
}

function advanceMeteors(meteors: Meteor[], arena: Arena): Meteor[] {
  return meteors.map((meteor) => moveEntityWithWrap(meteor, arena));
}

function advanceExplosions(explosions: Explosion[]): Explosion[] {
  return explosions
    .map((explosion) => ({
      ...explosion,
      ttl: explosion.ttl - 1,
    }))
    .filter((explosion) => explosion.ttl > 0);
}

function resolveBulletMeteorCollisions(state: GameState, arena: Arena): GameState {
  const removedMeteors = new Set<number>();
  const remainingBullets: Bullet[] = [];
  const nextMeteors: Meteor[] = [];
  const spawnedFragments: Meteor[] = [];
  const nextExplosions = state.explosions.slice();
  let telemetry = state.telemetry;
  let score = state.score;
  let hiScore = state.hiScore;
  let status = state.status;
  let statusTicks = state.statusTicks;
  let nextId = state.nextId;

  for (const bullet of state.bullets) {
    let hitMeteor: Meteor | null = null;

    for (const meteor of state.meteors) {
      if (removedMeteors.has(meteor.id)) {
        continue;
      }

      if (wrappedDistance(bullet.x, bullet.y, meteor.x, meteor.y, arena) <= getMeteorRadius(meteor.size)) {
        hitMeteor = meteor;
        break;
      }
    }

    if (!hitMeteor) {
      remainingBullets.push(bullet);
      continue;
    }

    removedMeteors.add(hitMeteor.id);
    const points = getMeteorScore(hitMeteor.size);
    score += points;
    hiScore = Math.max(hiScore, score);
    nextExplosions.push({
      id: nextId++,
      x: hitMeteor.x,
      y: hitMeteor.y,
      ttl: hitMeteor.size === 1 ? 3 : 5,
      glyph: hitMeteor.size === 1 ? '*' : '@',
      color: getMeteorColor(hitMeteor.size),
    });

    const [fragments, nextIdValue] = createFragments(hitMeteor, bullet, nextId, arena);
    nextId = nextIdValue;
    spawnedFragments.push(...fragments);

    telemetry = appendEvent(
      {
        ...telemetry,
        meteorsDestroyed: telemetry.meteorsDestroyed + 1,
        fragmentsCreated: telemetry.fragmentsCreated + fragments.length,
      },
      {
        title: hitMeteor.size === 1 ? 'Shard vaporized' : 'Meteor fractured',
        detail: hitMeteor.size === 1
          ? `Dust cloud cleared for +${points}.`
          : `${getMeteorLabel(hitMeteor.size)} rock split into ${fragments.length} fragments for +${points}.`,
        status: 'success',
      }
    );
    status = hitMeteor.size === 1 ? `Shard cleared +${points}` : `Meteor split +${points}`;
    statusTicks = STATUS_TICKS;
  }

  for (const meteor of state.meteors) {
    if (!removedMeteors.has(meteor.id)) {
      nextMeteors.push(meteor);
    }
  }

  nextMeteors.push(...spawnedFragments);

  return {
    ...state,
    score,
    hiScore,
    nextId,
    bullets: remainingBullets,
    meteors: nextMeteors,
    explosions: nextExplosions,
    telemetry,
    status,
    statusTicks,
  };
}

function resolveShipCollision(state: GameState, arena: Arena): GameState {
  if (state.phase !== 'playing' || state.ship.respawnTicks > 0) {
    return state;
  }

  const collision = state.meteors.find((meteor) =>
    wrappedDistance(state.ship.x, state.ship.y, meteor.x, meteor.y, arena) <= SHIP_RADIUS + getMeteorRadius(meteor.size)
  );

  if (!collision) {
    return state;
  }

  const lives = state.lives - 1;
  const nextExplosions = [
    ...state.explosions,
    {
      id: state.nextId,
      x: state.ship.x,
      y: state.ship.y,
      ttl: 6,
      glyph: '*',
      color: 'redBright',
    },
  ];

  if (lives <= 0) {
    return {
      ...state,
      lives: 0,
      hiScore: Math.max(state.hiScore, state.score),
      nextId: state.nextId + 1,
      explosions: nextExplosions,
      phase: 'game-over',
      status: 'Hull integrity lost. Press Enter or R to relaunch.',
      statusTicks: 9999,
      telemetry: appendEvent(state.telemetry, {
        title: 'Ship lost',
        detail: 'Final hull breach. Flight recorder sealed.',
        status: 'error',
      }),
    };
  }

  return {
    ...state,
    lives,
    nextId: state.nextId + 1,
    ship: {
      ...getShipSpawn(arena),
      respawnTicks: RESPAWN_TICKS,
    },
    bullets: [],
    explosions: nextExplosions,
    status: `Hull breach. ${lives} life${lives === 1 ? '' : 's'} left.`,
    statusTicks: STATUS_TICKS,
    telemetry: appendEvent(state.telemetry, {
      title: 'Hull breach',
      detail: `${lives} life${lives === 1 ? '' : 's'} remaining after collision.`,
      status: 'warning',
    }),
  };
}

function maybeAdvanceWave(state: GameState, arena: Arena): GameState {
  if (state.phase !== 'playing' || state.meteors.length > 0) {
    return state;
  }

  const nextLevel = state.level + 1;
  const clearBonus = nextLevel * 25;
  const [meteors, seed, nextId] = spawnWave(nextLevel, arena, state.seed, state.nextId);
  const score = state.score + clearBonus;

  return {
    ...state,
    level: nextLevel,
    score,
    hiScore: Math.max(state.hiScore, score),
    seed,
    nextId,
    meteors,
    status: `Sector clear. Wave ${nextLevel} incoming. Bonus +${clearBonus}.`,
    statusTicks: STATUS_TICKS,
    telemetry: appendEvent(
      {
        ...state.telemetry,
        wavesCleared: state.telemetry.wavesCleared + 1,
      },
      {
        title: 'Sector clear',
        detail: `Wave ${nextLevel} started with ${meteors.length} macro rocks.`,
        status: 'info',
      }
    ),
  };
}

export function advanceGame(state: GameState, arena: Arena): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  let next = {
    ...state,
    tick: state.tick + 1,
    statusTicks: Math.max(0, state.statusTicks - 1),
    ship: advanceShip(state.ship, arena),
    bullets: advanceBullets(state.bullets, arena),
    meteors: advanceMeteors(state.meteors, arena),
    explosions: advanceExplosions(state.explosions),
  };

  next = resolveBulletMeteorCollisions(next, arena);
  next = resolveShipCollision(next, arena);
  next = maybeAdvanceWave(next, arena);

  return withTelemetrySample(next);
}

function drawWrappedPixel(
  canvas: ReturnType<typeof createCanvas>,
  arena: Arena,
  x: number,
  y: number,
  char: string,
  color: string
): void {
  const wrappedX = ((Math.round(x) % arena.width) + arena.width) % arena.width;
  const wrappedY = ((Math.round(y) % arena.height) + arena.height) % arena.height;
  canvas.setPixel(wrappedX, wrappedY, char, color);
}

function drawWrappedSprite(
  canvas: ReturnType<typeof createCanvas>,
  arena: Arena,
  x: number,
  y: number,
  sprite: readonly string[],
  color: string
): void {
  const offsetX = Math.floor(sprite[0]!.length / 2);
  const offsetY = Math.floor(sprite.length / 2);

  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row]!;
    for (let col = 0; col < line.length; col++) {
      const char = line[col]!;
      if (char === ' ') {
        continue;
      }
      drawWrappedPixel(canvas, arena, x + col - offsetX, y + row - offsetY, char, color);
    }
  }
}

function drawCenteredLabel(
  canvas: ReturnType<typeof createCanvas>,
  arena: Arena,
  y: number,
  label: string,
  color: string
): void {
  const start = Math.max(0, Math.floor((arena.width - label.length) / 2));

  for (let index = 0; index < label.length; index++) {
    canvas.setPixel(start + index, clamp(y, 0, arena.height - 1), label[index]!, color);
  }
}

function drawStarfield(canvas: ReturnType<typeof createCanvas>, arena: Arena, tick: number): void {
  for (let y = 0; y < arena.height; y++) {
    for (let x = 0; x < arena.width; x++) {
      const roll = (x * 17 + y * 29 + 11) % 19;
      if (roll !== 0 && roll !== 3) {
        continue;
      }

      const blink = (tick + x + y) % (roll === 0 ? 6 : 9);
      const char = roll === 0 ? (blink < 3 ? '.' : '`') : (blink < 2 ? '+' : '.');
      const color = roll === 0 ? 'gray' : 'whiteBright';
      canvas.setPixel(x, y, char, color);
    }
  }
}

function drawShip(canvas: ReturnType<typeof createCanvas>, arena: Arena, state: GameState): void {
  if (state.phase === 'game-over') {
    return;
  }

  if (state.ship.respawnTicks > 0 && state.ship.respawnTicks % 2 === 1) {
    return;
  }

  const heading = DIRECTION_VECTORS[state.ship.facing]!;
  const glyph = SHIP_GLYPHS[state.ship.facing]!;
  drawWrappedPixel(canvas, arena, state.ship.x, state.ship.y, 'O', 'whiteBright');
  drawWrappedPixel(canvas, arena, state.ship.x + heading.x, state.ship.y + heading.y, glyph, 'cyanBright');

  if (state.ship.thrustTicks > 0) {
    drawWrappedPixel(canvas, arena, state.ship.x - heading.x, state.ship.y - heading.y, ':', 'yellow');
  }
}

function drawMeteors(canvas: ReturnType<typeof createCanvas>, arena: Arena, meteors: Meteor[]): void {
  for (const meteor of meteors) {
    drawWrappedSprite(canvas, arena, meteor.x, meteor.y, METEOR_SPRITES[meteor.size], getMeteorColor(meteor.size));
  }
}

function drawBullets(canvas: ReturnType<typeof createCanvas>, arena: Arena, bullets: Bullet[]): void {
  for (const bullet of bullets) {
    drawWrappedPixel(canvas, arena, bullet.x, bullet.y, '*', 'whiteBright');
  }
}

function drawExplosions(canvas: ReturnType<typeof createCanvas>, arena: Arena, explosions: Explosion[]): void {
  for (const explosion of explosions) {
    drawWrappedPixel(canvas, arena, explosion.x, explosion.y, explosion.glyph, explosion.color);
  }
}

function renderBoard(state: GameState, arena: Arena): string[] {
  const canvas = createCanvas({ width: arena.width, height: arena.height });

  drawStarfield(canvas, arena, state.tick);
  drawMeteors(canvas, arena, state.meteors);
  drawBullets(canvas, arena, state.bullets);
  drawShip(canvas, arena, state);
  drawExplosions(canvas, arena, state.explosions);

  if (state.ship.respawnTicks > 0 && state.phase === 'playing') {
    drawCenteredLabel(canvas, arena, Math.floor(arena.height / 2), 'RESPAWNING', 'greenBright');
  }

  if (state.phase === 'paused') {
    drawCenteredLabel(canvas, arena, Math.floor(arena.height / 2), 'PAUSED', 'yellow');
  }

  if (state.phase === 'game-over') {
    drawCenteredLabel(canvas, arena, Math.floor(arena.height / 2) - 1, 'GAME OVER', 'redBright');
    drawCenteredLabel(canvas, arena, Math.floor(arena.height / 2) + 1, 'ENTER OR R TO RELAUNCH', 'yellow');
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
  if (state.ship.respawnTicks > 0) {
    return 'greenBright';
  }
  if (state.statusTicks > 0) {
    return 'yellow';
  }
  return 'gray';
}

function statusText(state: GameState): string {
  if (state.phase === 'game-over') {
    return 'Flight lost. Press Enter or R to relaunch the sim.';
  }
  if (state.phase === 'paused') {
    return 'Simulation paused. Press P or Enter to resume, F1 for controls.';
  }
  if (state.statusTicks > 0) {
    return state.status;
  }
  return 'Left/Right rotate, Up thrust, Down brake, Space fire, P pause, F1 help, Q quit.';
}

function Metric(label: string, value: string, color: string): VNode {
  return Box(
    { flexDirection: 'row', gap: 1 },
    Text({ color: 'gray', dim: true }, label),
    Text({ color, bold: true }, value)
  );
}

function getPhaseBadge(state: GameState): VNode {
  if (state.phase === 'game-over') {
    return Badge({ label: 'LOST', variant: 'danger' });
  }
  if (state.phase === 'paused') {
    return Badge({ label: 'PAUSED', variant: 'warning' });
  }
  return Badge({ label: 'LIVE', variant: 'success' });
}

function getThreatVariant(threat: number): 'success' | 'warning' | 'danger' | 'primary' {
  if (threat >= 76) {
    return 'danger';
  }
  if (threat >= 46) {
    return 'warning';
  }
  if (threat >= 20) {
    return 'primary';
  }
  return 'success';
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

function HeaderBar(state: GameState, arena: Arena, fps: number, fpsColor: string): VNode {
  const threat = getThreatLevel(state, arena);
  const phaseLabel = state.phase === 'game-over'
    ? 'LOST'
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
      Text({ color: 'cyanBright', bold: true }, arena.compact ? ' METEOR ' : ' TUIIUIU-METEOR '),
      arena.compact
        ? Text({ color: statusColor(state), bold: true }, phaseLabel)
        : getPhaseBadge(state)
    ),
    Box({ flexGrow: 1 }),
    arena.compact
      ? Box(
          { flexDirection: 'row', gap: 2, alignItems: 'center' },
          Metric('S', String(state.score).padStart(SCORE_WIDTH, '0'), 'cyanBright'),
          Metric('L', String(state.lives), 'greenBright'),
          Metric('W', String(state.level), 'yellow'),
          Text({ color: fpsColor, dim: true }, `${fps}fps`)
        )
      : Box(
          { flexDirection: 'row', gap: 2, alignItems: 'center' },
          Badge({ label: `THREAT ${String(threat).padStart(2, '0')}`, variant: getThreatVariant(threat), style: 'outline' }),
          StatusIndicator({
            status: state.phase === 'game-over' ? 'error' : state.phase === 'paused' ? 'warning' : 'running',
            label: state.phase === 'game-over' ? 'Flight recorder sealed' : state.phase === 'paused' ? 'Orbit hold' : 'Combat drift',
            size: 'sm',
          }),
          Text({ color: 'gray', dim: true, wrap: 'truncate-end' }, 'arcade meteor breaker'),
          Text({ color: fpsColor, dim: true }, `${fps}fps`)
        )
  );
}

function ScorePanel(state: GameState): VNode {
  return Box(
    {
      flexDirection: 'column',
      gap: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      padding: 1,
    },
    Box(
      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      Text({ color: 'cyanBright', bold: true }, 'Score'),
      Badge({ label: `WAVE ${state.level}`, variant: 'primary', style: 'subtle' })
    ),
    Digits({
      value: String(state.score).padStart(SCORE_WIDTH, '0'),
      digits: SCORE_WIDTH,
      leadingZeros: true,
      style: 'minimal',
      color: 'cyanBright',
    }),
    DataRow({ label: 'Hi score', value: String(state.hiScore).padStart(SCORE_WIDTH, '0'), valueColor: 'whiteBright' }),
    DataRow({ label: 'Lives', value: state.lives, valueColor: 'greenBright' }),
    DataRow({ label: 'Accuracy', value: `${getAccuracy(state)}%`, status: getStatusForPercent(getAccuracy(state)) })
  );
}

function TelemetryPanel(state: GameState, arena: Arena): VNode {
  const threat = getThreatLevel(state, arena);
  const speed = getPlayerSpeedPercent(state);

  return Box(
    {
      flexDirection: 'column',
      gap: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
      padding: 1,
    },
    Text({ color: 'yellow', bold: true }, 'Telemetry'),
    Gauge({
      value: threat,
      max: 100,
      label: 'Threat',
      style: 'linear',
      width: 18,
      zones: true,
      valuePosition: 'right',
    }),
    DataRow({ label: 'Heading', value: getShipHeadingLabel(state.ship.facing), valueColor: 'cyanBright' }),
    DataRow({ label: 'Meteors', value: state.meteors.length, valueColor: 'yellow' }),
    DataRow({ label: 'Shots', value: state.telemetry.shotsFired, valueColor: 'whiteBright' }),
    DataRow({ label: 'Splits', value: state.telemetry.fragmentsCreated, valueColor: 'magentaBright' }),
    ProgressBar({
      value: speed,
      max: 100,
      width: 20,
      label: 'Speed',
      style: 'line',
      borderStyle: 'pipes',
      color: speed >= 76 ? 'redBright' : speed >= 46 ? 'yellow' : 'greenBright',
    }),
    Sparkline({
      data: state.telemetry.meteorHistory,
      width: 22,
      color: 'yellow',
      label: 'Field',
    }),
    Sparkline({
      data: state.telemetry.speedHistory,
      width: 22,
      color: 'cyanBright',
      label: 'Drift',
    })
  );
}

function EventLogPanel(state: GameState): VNode {
  return Box(
    {
      flexDirection: 'column',
      gap: 1,
      borderStyle: 'round',
      borderColor: 'greenBright',
      padding: 1,
    },
    Text({ color: 'greenBright', bold: true }, 'Flight Log'),
    ...state.telemetry.eventLog.slice(0, 4).map((event) =>
      Box(
        { flexDirection: 'column' },
        Text({ color: event.status === 'error' ? 'redBright' : event.status === 'warning' ? 'yellow' : event.status === 'success' ? 'greenBright' : 'cyanBright', bold: true }, `${getEventIcon(event.status)} ${event.title}`),
        Text({ color: 'gray', dim: true, wrap: 'truncate-end' }, event.detail)
      )
    ),
    Text({ color: 'gray', dim: true }, 'F1 help • P pause • R restart')
  );
}

function Sidebar(state: GameState, arena: Arena): VNode {
  return Box(
    { flexDirection: 'column', gap: 1, width: HUD_SIDEBAR_WIDTH },
    ScorePanel(state),
    TelemetryPanel(state, arena),
    EventLogPanel(state)
  );
}

function CompactTelemetry(state: GameState, arena: Arena): VNode {
  const threat = getThreatLevel(state, arena);
  const speed = getPlayerSpeedPercent(state);
  const lastEvent = state.telemetry.eventLog[0];

  return Box(
    {
      flexDirection: 'column',
      gap: 1,
      width: arena.width,
      borderStyle: 'round',
      borderColor: 'gray',
      paddingX: 1,
      paddingY: 0,
    },
    Box(
      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      Box(
        { flexDirection: 'row', gap: 1 },
        getPhaseBadge(state),
        Badge({ label: `${state.meteors.length} ROCKS`, variant: getThreatVariant(threat), style: 'subtle' }),
        Badge({ label: `DIR ${getShipHeadingLabel(state.ship.facing)}`, variant: 'primary', style: 'subtle' })
      ),
      Text({ color: 'gray', dim: true }, `Speed ${speed}%`)
    ),
    ProgressBar({
      value: threat,
      max: 100,
      width: Math.max(18, Math.min(arena.width - 4, 40)),
      label: 'Threat',
      style: 'line',
      borderStyle: 'pipes',
      color: threat >= 76 ? 'redBright' : threat >= 46 ? 'yellow' : 'greenBright',
    }),
    lastEvent
      ? Text({ color: 'gray', dim: true, wrap: 'truncate-end' }, `${getEventIcon(lastEvent.status)} ${lastEvent.title}: ${lastEvent.detail}`)
      : Text({ color: 'gray', dim: true }, 'No flight events yet.')
  );
}

function PauseOverlay(state: GameState, arena: Arena): VNode {
  const threat = getThreatLevel(state, arena);

  return Modal({
    title: 'orbit hold',
    size: {
      width: Math.min(58, Math.max(44, arena.columns - 4)),
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
      BigText({ text: 'PAUSE', font: arena.columns >= 108 ? 'small' : 'mini', color: 'yellow' }),
      StatusIndicator({ status: 'warning', label: 'Simulation halted while you read telemetry.' }),
      DataRow({ label: 'Threat', value: `${threat}%`, status: getStatusForPercent(100 - threat) }),
      DataRow({ label: 'Wave', value: state.level, valueColor: 'yellow' }),
      DataRow({ label: 'Meteors', value: state.meteors.length, valueColor: 'magentaBright' }),
      Sparkline({
        data: state.telemetry.scoreHistory,
        width: 24,
        color: 'cyanBright',
        label: 'Score',
      })
    ),
    footer: Box(
      { flexDirection: 'row', gap: 1 },
      Badge({ label: 'P RESUME', variant: 'success', style: 'outline' }),
      Badge({ label: 'F1 HELP', variant: 'primary', style: 'subtle' })
    ),
  });
}

function HelpOverlay(arena: Arena): VNode {
  const width = Math.min(70, Math.max(50, arena.columns - 4));

  return Modal({
    title: 'flight manual',
    size: {
      width,
      height: Math.min(20, Math.max(16, arena.rows - 2)),
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
      StatusIndicator({ status: 'info', label: 'Asteroids controls, adapted for a terminal cockpit.' }),
      DataRow({ label: 'Left / Right', value: 'Rotate ship', valueColor: 'whiteBright' }),
      DataRow({ label: 'Up', value: 'Thrust forward', valueColor: 'greenBright' }),
      DataRow({ label: 'Down', value: 'Brake drift', valueColor: 'yellow' }),
      DataRow({ label: 'Space', value: 'Fire plasma round', valueColor: 'cyanBright' }),
      DataRow({ label: 'P / Enter', value: 'Pause or resume', valueColor: 'whiteBright' }),
      DataRow({ label: 'R / Q', value: 'Restart or quit', valueColor: 'whiteBright' }),
      Text({ color: 'gray', dim: true }, 'The simulation freezes while this overlay is open.')
    ),
  });
}

function GameOverOverlay(state: GameState, arena: Arena): VNode {
  return Modal({
    title: 'black box',
    size: {
      width: Math.min(62, Math.max(48, arena.columns - 4)),
      height: Math.min(20, Math.max(15, arena.rows - 4)),
    },
    borderStyle: 'round',
    borderColor: 'redBright',
    titleColor: 'redBright',
    backdrop: true,
    showCloseHint: true,
    closeHint: 'Enter relaunches',
    content: Box(
      { flexDirection: 'column', gap: 1 },
      BigText({ text: 'OVER', font: 'mini', color: 'redBright' }),
      StatusIndicator({ status: 'error', label: 'The meteor field overwhelmed the ship.' }),
      Digits({
        value: String(state.score).padStart(SCORE_WIDTH, '0'),
        digits: SCORE_WIDTH,
        leadingZeros: true,
        style: 'minimal',
        color: 'redBright',
      }),
      DataRow({ label: 'Hi score', value: String(state.hiScore).padStart(SCORE_WIDTH, '0'), valueColor: 'whiteBright' }),
      DataRow({ label: 'Waves cleared', value: state.telemetry.wavesCleared, valueColor: 'yellow' }),
      DataRow({ label: 'Meteors broken', value: state.telemetry.meteorsDestroyed, valueColor: 'greenBright' }),
      Sparkline({
        data: state.telemetry.meteorHistory,
        width: 24,
        color: 'yellow',
        label: 'Field',
      })
    ),
    footer: Box(
      { flexDirection: 'row', gap: 1 },
      Badge({ label: 'ENTER RELAUNCH', variant: 'success', style: 'outline' }),
      Badge({ label: 'Q QUIT', variant: 'danger', style: 'subtle' })
    ),
  });
}

function ActiveOverlay(state: GameState, arena: Arena, helpOpen: boolean): VNode | null {
  if (helpOpen) {
    return HelpOverlay(arena);
  }
  if (state.phase === 'paused') {
    return PauseOverlay(state, arena);
  }
  if (state.phase === 'game-over') {
    return GameOverOverlay(state, arena);
  }
  return null;
}

function ScreenTooSmall(arena: Arena): VNode {
  return Box(
    {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 'fill',
      gap: 1,
    },
    Text({ color: 'cyanBright', bold: true }, 'tuiuiu-meteor'),
    Text({ color: 'yellow', bold: true }, `Need at least ${MIN_COLUMNS}x${MIN_ROWS}`),
    Text({ color: 'gray' }, `Current terminal: ${arena.columns}x${arena.rows}`),
    Text({ color: 'gray', dim: true }, 'Resize for the flight board or press Q / Esc to leave.')
  );
}

function TuiuiuMeteor(): VNode {
  const { exit } = useApp();
  const { fps, color: fpsColor } = useFps();
  const terminal = useTerminalSize();
  const arena = getArena(terminal.columns, terminal.rows);
  const [game, setGame] = useState(createNewGameState(arena));
  const [helpOpen, setHelpOpen] = useState(false);
  const state = game();
  const isHelpOpen = helpOpen();
  const boardLines = renderBoard(state, arena);

  useHotkeys(['left', 'a', 'h'], () => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => rotateShip(current, -1));
  });

  useHotkeys(['right', 'd', 'l'], () => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => rotateShip(current, 1));
  });

  useHotkeys(['up', 'w', 'k'], () => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => thrustShip(current));
  });

  useHotkeys(['down', 's', 'j'], () => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => stabilizeShip(current));
  });

  useHotkeys('space', () => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => current.phase === 'game-over'
      ? createNewGameState(arena, current.hiScore)
      : fireBullet(current, arena));
  });

  useHotkeys('p', () => {
    if (isHelpOpen || state.phase === 'game-over') {
      return;
    }
    setGame((current) => togglePause(current));
  });

  useHotkeys('r', () => {
    setHelpOpen(false);
    setGame((current) => createNewGameState(arena, current.hiScore));
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

  useHotkeys('f1', () => {
    setHelpOpen((current) => !current);
  });

  useHotkeys('escape', () => {
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

  useHotkeys(['q', 'ctrl+c'], () => {
    exit();
  });

  useInterval(
    () => {
      setGame((current) => advanceGame(current, arena));
    },
    TICK_MS,
    { enabled: arena.playable && state.phase === 'playing' && !isHelpOpen }
  );

  if (!arena.playable) {
    return ScreenTooSmall(arena);
  }

  return Box(
    {
      flexDirection: 'column',
      height: 'fill',
      width: 'fill',
      padding: 1,
      gap: 1,
      position: 'relative',
    },
    HeaderBar(state, arena, fps, fpsColor),
    Box(
      {
        flexDirection: arena.compact ? 'column' : 'row',
        alignItems: 'flex-start',
        gap: 1,
      },
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          {
            flexDirection: 'row',
            gap: 2,
            width: arena.width,
            justifyContent: 'space-between',
          },
          Metric('Score', String(state.score).padStart(SCORE_WIDTH, '0'), 'cyanBright'),
          Metric('Hi', String(state.hiScore).padStart(SCORE_WIDTH, '0'), 'whiteBright'),
          Metric('Lives', String(state.lives), 'greenBright'),
          Metric('Wave', String(state.level), 'yellow'),
          Metric('Dir', getShipHeadingLabel(state.ship.facing), 'magentaBright')
        ),
        Box(
          {
            flexDirection: 'column',
            borderStyle: 'round',
            borderColor: state.phase === 'game-over' ? 'redBright' : state.phase === 'paused' ? 'yellow' : 'cyanBright',
            padding: 0,
            width: arena.width,
          },
          ...boardLines.map((line) => Text({}, line))
        ),
        Text({ color: statusColor(state), bold: state.phase !== 'playing' || state.ship.respawnTicks > 0 }, statusText(state)),
        arena.compact
          ? CompactTelemetry(state, arena)
          : Text({ color: 'gray', dim: true }, 'Controls: arrows rotate/thrust, Down brakes, Space fires, P pause, F1 help, Q quit.')
      ),
      arena.compact ? null : Sidebar(state, arena)
    ),
    ActiveOverlay(state, arena, isHelpOpen)
  );
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  return import.meta.url === pathToFileURL(entry).href;
}

export async function runTuiuiuMeteor(): Promise<void> {
  const { waitUntilExit } = render(TuiuiuMeteor, { fullHeight: true, autoTabNavigation: false });
  await waitUntilExit();
}

if (isMainModule()) {
  await runTuiuiuMeteor();
}
