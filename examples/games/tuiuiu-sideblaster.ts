/**
 * tuiuiu-sideblaster
 *
 * Horizontal shoot'em up terminal showcase for tuiuiu.js.
 *
 * Features:
 * - Side-scrolling starfield with player ship movement
 * - Enemy waves with drone, ace, and turret ships
 * - Player fire, enemy fire, breaches, score, pause, and restart
 * - Responsive HUD with telemetry, event log, overlays, and FPS
 *
 * Run: pnpm example tuiuiu-sideblaster
 */

import { pathToFileURL } from 'node:url';

import {
  render,
  Badge,
  Box,
  DataRow,
  Digits,
  Gauge,
  Modal,
  ProgressBar,
  Sparkline,
  StatusIndicator,
  Text,
  darkTheme,
  setTheme,
  useApp,
  useShortcut,
  useInterval,
  useState,
  useTerminalSize,
} from '../../src/index.js';
import { BigText } from '../../src/atoms/big-text.js';
import { createCanvas } from '../../src/primitives/canvas.js';
import { useFps } from '../../src/hooks/use-fps.js';
import type { VNode } from '../../src/utils/types.js';

setTheme(darkTheme);

const TICK_MS = 80;
const INITIAL_SEED = 0x71deca7e;
const MIN_COLUMNS = 68;
const MIN_ROWS = 24;
const MAX_GAME_WIDTH = 76;
const MAX_GAME_HEIGHT = 26;
const HUD_SIDEBAR_BREAKPOINT = 120;
const HUD_MIN_ROWS_FOR_SIDEBAR = 30;
const HUD_SIDEBAR_WIDTH = 34;
const PLAYER_STEP = 1;
const PLAYER_FIRE_COOLDOWN = 2;
const PLAYER_RESPAWN_TICKS = 20;
const PLAYER_LASER_SPEED = 3.8;
const PLAYER_LASER_TTL = 40;
const PLAYER_LASER_LENGTH = 6;
const STATUS_TICKS = 18;
const HISTORY_LIMIT = 28;
const EVENT_LOG_LIMIT = 6;
const INITIAL_LIVES = 3;
const SCORE_WIDTH = 5;

const PLAYER_SPRITE = '<=|====>';
const ENEMY_SPRITES = {
  drone: '<-o->',
  ace: '<=#=>',
  turret: '[=##=<',
} as const;

type EventSeverity = 'success' | 'warning' | 'error' | 'info';
export type EnemyType = keyof typeof ENEMY_SPRITES;
export type BulletOwner = 'player' | 'enemy';
export type GamePhase = 'playing' | 'paused' | 'game-over';

export type Arena = {
  width: number;
  height: number;
  columns: number;
  rows: number;
  compact: boolean;
  playable: boolean;
};

export type Player = {
  x: number;
  y: number;
  fireCooldown: number;
  respawnTicks: number;
};

export type Bullet = {
  id: number;
  owner: BulletOwner;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  length?: number;
};

export type Enemy = {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  fireCooldown: number;
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
  enemyShotsFired: number;
  enemiesDestroyed: number;
  wavesCleared: number;
  scoreHistory: number[];
  pressureHistory: number[];
  hullHistory: number[];
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
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  explosions: Explosion[];
  waveRemaining: number;
  spawnCooldown: number;
  status: string;
  statusTicks: number;
  telemetry: Telemetry;
};

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

function createTelemetry(score: number, pressure: number, bootMessage: string): Telemetry {
  return {
    shotsFired: 0,
    enemyShotsFired: 0,
    enemiesDestroyed: 0,
    wavesCleared: 0,
    scoreHistory: [score],
    pressureHistory: [pressure],
    hullHistory: [100],
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

function getWaveQuota(level: number): number {
  return 6 + level * 2;
}

function getSpawnCooldown(level: number): number {
  return Math.max(4, 14 - level);
}

function getEnemyBulletCap(level: number): number {
  return Math.min(5, 2 + Math.floor(level / 2));
}

function getEnemyType(level: number, roll: number): EnemyType {
  if (level >= 4 && roll > 0.76) {
    return 'turret';
  }
  if (level >= 2 && roll > 0.42) {
    return 'ace';
  }
  return 'drone';
}

function getEnemyHp(type: EnemyType): number {
  switch (type) {
    case 'ace':
      return 2;
    case 'turret':
      return 3;
    case 'drone':
    default:
      return 1;
  }
}

function getEnemySpeed(type: EnemyType, level: number): number {
  switch (type) {
    case 'ace':
      return 0.74 + level * 0.03;
    case 'turret':
      return 0.46 + level * 0.025;
    case 'drone':
    default:
      return 0.58 + level * 0.03;
  }
}

function getEnemyScore(type: EnemyType): number {
  switch (type) {
    case 'ace':
      return 60;
    case 'turret':
      return 90;
    case 'drone':
    default:
      return 25;
  }
}

function getEnemyCadence(type: EnemyType, level: number): number {
  switch (type) {
    case 'ace':
      return Math.max(7, 14 - level);
    case 'turret':
      return Math.max(5, 11 - level);
    case 'drone':
    default:
      return Math.max(9, 18 - level);
  }
}

function getEnemyColor(type: EnemyType): string {
  switch (type) {
    case 'ace':
      return 'magentaBright';
    case 'turret':
      return 'yellow';
    case 'drone':
    default:
      return 'greenBright';
  }
}

function getEnemyLabel(type: EnemyType): string {
  switch (type) {
    case 'ace':
      return 'ace';
    case 'turret':
      return 'turret';
    case 'drone':
    default:
      return 'drone';
  }
}

function getPlayerSpawn(arena: Arena): Player {
  return {
    x: 3,
    y: Math.floor(arena.height / 2),
    fireCooldown: 0,
    respawnTicks: 0,
  };
}

function getPlayerBounds(arena: Arena): { minX: number; maxX: number; minY: number; maxY: number } {
  return {
    minX: 2,
    maxX: Math.max(2, Math.floor(arena.width * 0.42) - PLAYER_SPRITE.length),
    minY: 1,
    maxY: arena.height - 2,
  };
}

function pointHitsSprite(px: number, py: number, x: number, y: number, sprite: string): boolean {
  const bulletX = Math.round(px);
  const bulletY = Math.round(py);
  const left = Math.round(x);
  const right = left + sprite.length - 1;
  const row = Math.round(y);

  return bulletY === row && bulletX >= left && bulletX <= right;
}

function horizontalSpanHitsSprite(
  startX: number,
  endX: number,
  y: number,
  spriteX: number,
  spriteY: number,
  sprite: string
): boolean {
  const row = Math.round(spriteY);
  if (Math.round(y) !== row) {
    return false;
  }

  const left = Math.round(spriteX);
  const right = left + sprite.length - 1;
  const spanLeft = Math.min(Math.round(startX), Math.round(endX));
  const spanRight = Math.max(Math.round(startX), Math.round(endX));

  return spanLeft <= right && left <= spanRight;
}

function spritesOverlap(ax: number, ay: number, aSprite: string, bx: number, by: number, bSprite: string): boolean {
  const rowA = Math.round(ay);
  const rowB = Math.round(by);

  if (rowA !== rowB) {
    return false;
  }

  const leftA = Math.round(ax);
  const rightA = leftA + aSprite.length - 1;
  const leftB = Math.round(bx);
  const rightB = leftB + bSprite.length - 1;

  return leftA <= rightB && leftB <= rightA;
}

export function getArena(columns: number, rows: number): Arena {
  const compact = columns < HUD_SIDEBAR_BREAKPOINT || rows < HUD_MIN_ROWS_FOR_SIDEBAR;
  const widthBudget = compact ? columns - 6 : columns - HUD_SIDEBAR_WIDTH - 8;
  const heightBudget = rows - (compact ? 12 : 7);

  return {
    width: Math.max(42, Math.min(MAX_GAME_WIDTH, widthBudget)),
    height: Math.max(18, Math.min(MAX_GAME_HEIGHT, heightBudget)),
    columns,
    rows,
    compact,
    playable: columns >= MIN_COLUMNS && rows >= MIN_ROWS,
  };
}

function spawnEnemyFormation(
  level: number,
  arena: Arena,
  seed: number,
  nextId: number,
  remainingQuota: number
): [Enemy[], number, number, number] {
  let currentSeed = seed;
  let currentId = nextId;
  let formationRoll: number;
  let typeRoll: number;
  let baseYRoll: number;
  let driftRoll: number;

  [formationRoll, currentSeed] = randomFloat(currentSeed, 0, 1);
  [typeRoll, currentSeed] = randomFloat(currentSeed, 0, 1);
  [baseYRoll, currentSeed] = randomFloat(currentSeed, 1, arena.height - 1);
  [driftRoll, currentSeed] = randomFloat(currentSeed, -0.2, 0.2);

  const count = remainingQuota === 1
    ? 1
    : formationRoll > 0.78 && remainingQuota >= 3
      ? 3
      : formationRoll > 0.38 && remainingQuota >= 2
        ? 2
        : 1;
  const type = getEnemyType(level, typeRoll);
  const speed = getEnemySpeed(type, level);
  const hp = getEnemyHp(type);
  const sprite = ENEMY_SPRITES[type];
  const formation: Enemy[] = [];

  for (let index = 0; index < count; index++) {
    const y = clamp(baseYRoll + (index - Math.floor((count - 1) / 2)) * 2, 1, arena.height - 2);
    formation.push({
      id: currentId++,
      type,
      x: arena.width - sprite.length - 1 + index * 2,
      y,
      vx: -speed,
      vy: driftRoll === 0 ? 0.1 : driftRoll * (index % 2 === 0 ? 1 : -1),
      hp,
      maxHp: hp,
      fireCooldown: getEnemyCadence(type, level) + index * 2,
    });
  }

  return [formation, currentSeed, currentId, count];
}

function primeWave(level: number, arena: Arena, seed: number, nextId: number): [Enemy[], number, number, number, number] {
  let currentSeed = seed;
  let currentId = nextId;
  let remaining = getWaveQuota(level);
  const enemies: Enemy[] = [];

  while (enemies.length < Math.min(3, getWaveQuota(level)) && remaining > 0) {
    const [formation, nextSeedValue, nextIdValue, spawned] = spawnEnemyFormation(
      level,
      arena,
      currentSeed,
      currentId,
      remaining
    );
    enemies.push(...formation);
    currentSeed = nextSeedValue;
    currentId = nextIdValue;
    remaining -= spawned;
  }

  return [enemies, remaining, getSpawnCooldown(level), currentSeed, currentId];
}

export function countEnemies(state: GameState): number {
  return state.enemies.length;
}

function getHullPercent(state: GameState): number {
  return Math.round((state.lives / INITIAL_LIVES) * 100);
}

export function getAccuracy(state: GameState): number {
  if (state.telemetry.shotsFired === 0) {
    return 0;
  }

  return Math.round((state.telemetry.enemiesDestroyed / state.telemetry.shotsFired) * 100);
}

export function getThreatLevel(state: GameState, arena: Arena): number {
  if (state.enemies.length === 0 && state.waveRemaining === 0 && !state.bullets.some((bullet) => bullet.owner === 'enemy')) {
    return 0;
  }

  const nearestEnemy = state.enemies.length === 0
    ? arena.width
    : Math.min(...state.enemies.map((enemy) => enemy.x));
  const hostileBullets = state.bullets.filter((bullet) => bullet.owner === 'enemy').length;
  const frontPressure = clamp(100 - Math.round((nearestEnemy / arena.width) * 100), 0, 100);
  const density = clamp(state.enemies.length * 12 + hostileBullets * 10 + state.waveRemaining * 3, 0, 100);

  return clamp(Math.round(frontPressure * 0.55 + density * 0.45), 0, 100);
}

function withTelemetrySample(state: GameState, arena: Arena): GameState {
  return {
    ...state,
    telemetry: {
      ...state.telemetry,
      scoreHistory: pushHistory(state.telemetry.scoreHistory, state.score),
      pressureHistory: pushHistory(state.telemetry.pressureHistory, getThreatLevel(state, arena)),
      hullHistory: pushHistory(state.telemetry.hullHistory, getHullPercent(state)),
    },
  };
}

export function createNewGameState(arena: Arena, hiScore = 0): GameState {
  const [enemies, waveRemaining, spawnCooldown, seed, nextId] = primeWave(1, arena, INITIAL_SEED, 1);
  const bootMessage = 'Enemy wave detected on the right horizon.';
  const baseState: GameState = {
    score: 0,
    hiScore,
    lives: INITIAL_LIVES,
    level: 1,
    phase: 'playing',
    tick: 0,
    nextId,
    seed,
    player: getPlayerSpawn(arena),
    bullets: [],
    enemies,
    explosions: [],
    waveRemaining,
    spawnCooldown,
    status: 'Convoy inbound. Clear the lane.',
    statusTicks: STATUS_TICKS,
    telemetry: createTelemetry(0, enemies.length * 12 + waveRemaining * 3, bootMessage),
  };

  return withTelemetrySample(baseState, arena);
}

export function movePlayer(state: GameState, dx: number, dy: number, arena: Arena): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  const bounds = getPlayerBounds(arena);

  return {
    ...state,
    player: {
      ...state.player,
      x: clamp(state.player.x + dx * PLAYER_STEP, bounds.minX, bounds.maxX),
      y: clamp(state.player.y + dy * PLAYER_STEP, bounds.minY, bounds.maxY),
    },
  };
}

export function firePlayerShot(state: GameState): GameState {
  if (state.phase !== 'playing' || state.player.respawnTicks > 0 || state.player.fireCooldown > 0) {
    return state;
  }

  return {
    ...state,
    nextId: state.nextId + 1,
    player: {
      ...state.player,
      fireCooldown: PLAYER_FIRE_COOLDOWN,
    },
    bullets: [
      ...state.bullets,
      {
        id: state.nextId,
        owner: 'player',
        x: state.player.x + PLAYER_SPRITE.length,
        y: state.player.y,
        vx: PLAYER_LASER_SPEED,
        vy: 0,
        ttl: PLAYER_LASER_TTL,
        length: PLAYER_LASER_LENGTH,
      },
    ],
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

function advancePlayer(player: Player): Player {
  return {
    ...player,
    fireCooldown: Math.max(0, player.fireCooldown - 1),
    respawnTicks: Math.max(0, player.respawnTicks - 1),
  };
}

function advanceBullets(bullets: Bullet[], arena: Arena): Bullet[] {
  return bullets
    .map((bullet) => ({
      ...bullet,
      x: bullet.x + bullet.vx,
      y: bullet.y + bullet.vy,
      ttl: bullet.ttl - 1,
    }))
    .filter((bullet) =>
      bullet.ttl > 0 &&
      bullet.x >= -2 &&
      bullet.x < arena.width + 2 &&
      bullet.y >= 0 &&
      bullet.y < arena.height
    );
}

function advanceEnemies(enemies: Enemy[], arena: Arena): Enemy[] {
  return enemies.map((enemy) => {
    let nextY = enemy.y + enemy.vy;
    let nextVy = enemy.vy;

    if (nextY < 1 || nextY > arena.height - 2) {
      nextY = clamp(nextY, 1, arena.height - 2);
      nextVy = enemy.vy === 0 ? 0.12 : -enemy.vy;
    }

    return {
      ...enemy,
      x: enemy.x + enemy.vx,
      y: nextY,
      vy: nextVy,
      fireCooldown: Math.max(0, enemy.fireCooldown - 1),
    };
  });
}

function advanceExplosions(explosions: Explosion[]): Explosion[] {
  return explosions
    .map((explosion) => ({
      ...explosion,
      ttl: explosion.ttl - 1,
    }))
    .filter((explosion) => explosion.ttl > 0);
}

function maybeSpawnEnemyFormation(state: GameState, arena: Arena): GameState {
  if (state.waveRemaining <= 0 || state.spawnCooldown > 0) {
    return state;
  }

  const [formation, seed, nextId, spawned] = spawnEnemyFormation(
    state.level,
    arena,
    state.seed,
    state.nextId,
    state.waveRemaining
  );

  return {
    ...state,
    seed,
    nextId,
    waveRemaining: state.waveRemaining - spawned,
    spawnCooldown: getSpawnCooldown(state.level),
    enemies: [...state.enemies, ...formation],
  };
}

function maybeSpawnEnemyBullets(state: GameState): GameState {
  const enemyBulletCount = state.bullets.filter((bullet) => bullet.owner === 'enemy').length;
  const cap = getEnemyBulletCap(state.level);

  if (enemyBulletCount >= cap) {
    return state;
  }

  const enemies = state.enemies.slice();
  const bullets = state.bullets.slice();
  let nextId = state.nextId;
  let spawned = 0;
  let telemetry = state.telemetry;

  for (let index = 0; index < enemies.length; index++) {
    const enemy = enemies[index]!;

    if (spawned + enemyBulletCount >= cap || enemy.fireCooldown > 0 || enemy.x <= state.player.x + PLAYER_SPRITE.length + 6) {
      continue;
    }

    bullets.push({
      id: nextId++,
      owner: 'enemy',
      x: Math.round(enemy.x) - 1,
      y: Math.round(enemy.y),
      vx: -1.15,
      vy: enemy.type === 'ace' ? 0.2 : 0,
      ttl: 32,
    });
    enemies[index] = {
      ...enemy,
      fireCooldown: getEnemyCadence(enemy.type, state.level),
    };
    telemetry = {
      ...telemetry,
      enemyShotsFired: telemetry.enemyShotsFired + 1,
    };
    spawned += 1;
  }

  return {
    ...state,
    nextId,
    bullets,
    enemies,
    telemetry,
  };
}

function resolvePlayerShots(state: GameState): GameState {
  const enemies = state.enemies.slice();
  const nextBullets: Bullet[] = [];
  const nextExplosions = state.explosions.slice();
  let telemetry = state.telemetry;
  let score = state.score;
  let hiScore = state.hiScore;
  let nextId = state.nextId;
  let status = state.status;
  let statusTicks = state.statusTicks;

  for (const bullet of state.bullets) {
    if (bullet.owner !== 'player') {
      nextBullets.push(bullet);
      continue;
    }

    const hitIndex = enemies.findIndex((enemy) => {
      if ((bullet.length ?? 1) > 1) {
        return horizontalSpanHitsSprite(
          bullet.x,
          bullet.x + (bullet.length ?? 1) - 1,
          bullet.y,
          enemy.x,
          enemy.y,
          ENEMY_SPRITES[enemy.type]
        );
      }

      return pointHitsSprite(bullet.x, bullet.y, enemy.x, enemy.y, ENEMY_SPRITES[enemy.type]);
    });

    if (hitIndex < 0) {
      nextBullets.push(bullet);
      continue;
    }

    const enemy = enemies[hitIndex]!;
    if (enemy.hp <= 1) {
      enemies.splice(hitIndex, 1);
      const points = getEnemyScore(enemy.type);
      score += points;
      hiScore = Math.max(hiScore, score);
      telemetry = appendEvent(
        {
          ...telemetry,
          enemiesDestroyed: telemetry.enemiesDestroyed + 1,
        },
        {
          title: 'Target down',
          detail: `${getEnemyLabel(enemy.type)} destroyed for +${points}.`,
          status: 'success',
        }
      );
      status = `${getEnemyLabel(enemy.type)} down +${points}`;
      statusTicks = STATUS_TICKS;
      nextExplosions.push({
        id: nextId++,
        x: enemy.x,
        y: enemy.y,
        ttl: 4,
        glyph: '*',
        color: getEnemyColor(enemy.type),
      });
    } else {
      enemies[hitIndex] = {
        ...enemy,
        hp: enemy.hp - 1,
      };
      status = `${getEnemyLabel(enemy.type)} armor hit`;
      statusTicks = Math.max(statusTicks, 8);
      nextExplosions.push({
        id: nextId++,
        x: bullet.x,
        y: bullet.y,
        ttl: 2,
        glyph: '+',
        color: 'yellow',
      });
    }
  }

  return {
    ...state,
    score,
    hiScore,
    nextId,
    enemies,
    bullets: nextBullets,
    explosions: nextExplosions,
    telemetry,
    status,
    statusTicks,
  };
}

function applyPlayerDamage(
  state: GameState,
  arena: Arena,
  title: string,
  detail: string
): GameState {
  const lives = state.lives - 1;
  const nextExplosions = [
    ...state.explosions,
    {
      id: state.nextId,
      x: state.player.x,
      y: state.player.y,
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
      phase: 'game-over',
      explosions: nextExplosions,
      bullets: state.bullets.filter((bullet) => bullet.owner === 'player'),
      status: 'Wing lost. Press Enter or R to relaunch.',
      statusTicks: 9999,
      telemetry: appendEvent(state.telemetry, {
        title,
        detail,
        status: 'error',
      }),
    };
  }

  return {
    ...state,
    lives,
    nextId: state.nextId + 1,
    player: {
      ...getPlayerSpawn(arena),
      respawnTicks: PLAYER_RESPAWN_TICKS,
      fireCooldown: PLAYER_FIRE_COOLDOWN,
    },
    explosions: nextExplosions,
    bullets: state.bullets.filter((bullet) => bullet.owner === 'player'),
    status: `${title}. ${lives} life${lives === 1 ? '' : 's'} left.`,
    statusTicks: STATUS_TICKS,
    telemetry: appendEvent(state.telemetry, {
      title,
      detail,
      status: 'warning',
    }),
  };
}

function resolveThreats(state: GameState, arena: Arena): GameState {
  if (state.player.respawnTicks > 0) {
    return state;
  }

  const nextBullets: Bullet[] = [];
  let nextEnemies = state.enemies.slice();
  let damage:
    | {
        title: string;
        detail: string;
      }
    | null = null;

  for (const bullet of state.bullets) {
    if (bullet.owner !== 'enemy') {
      nextBullets.push(bullet);
      continue;
    }

    if (!damage && pointHitsSprite(bullet.x, bullet.y, state.player.x, state.player.y, PLAYER_SPRITE)) {
      damage = {
        title: 'Hull breach',
        detail: 'Enemy fire punched through the canopy.',
      };
      continue;
    }

    nextBullets.push(bullet);
  }

  nextEnemies = nextEnemies.filter((enemy) => {
    const sprite = ENEMY_SPRITES[enemy.type];
    const rightEdge = Math.round(enemy.x) + sprite.length - 1;

    if (rightEdge < 0) {
      if (!damage) {
        damage = {
          title: 'Line breached',
          detail: `${getEnemyLabel(enemy.type)} slipped through the left edge.`,
        };
      }
      return false;
    }

    if (!damage && spritesOverlap(enemy.x, enemy.y, sprite, state.player.x, state.player.y, PLAYER_SPRITE)) {
      damage = {
        title: 'Direct collision',
        detail: `${getEnemyLabel(enemy.type)} rammed the player ship.`,
      };
      return false;
    }

    return true;
  });

  const nextState = {
    ...state,
    bullets: nextBullets,
    enemies: nextEnemies,
  };

  return damage ? applyPlayerDamage(nextState, arena, damage.title, damage.detail) : nextState;
}

function maybeAdvanceWave(state: GameState, arena: Arena): GameState {
  if (
    state.phase !== 'playing' ||
    state.waveRemaining > 0 ||
    state.enemies.length > 0 ||
    state.bullets.some((bullet) => bullet.owner === 'enemy')
  ) {
    return state;
  }

  const nextLevel = state.level + 1;
  const bonus = nextLevel * 40;
  const [enemies, waveRemaining, spawnCooldown, seed, nextId] = primeWave(nextLevel, arena, state.seed, state.nextId);
  const score = state.score + bonus;

  return {
    ...state,
    score,
    hiScore: Math.max(state.hiScore, score),
    level: nextLevel,
    seed,
    nextId,
    enemies,
    waveRemaining,
    spawnCooldown,
    status: `Sector clear. Wave ${nextLevel} rolling in. Bonus +${bonus}.`,
    statusTicks: STATUS_TICKS,
    telemetry: appendEvent(
      {
        ...state.telemetry,
        wavesCleared: state.telemetry.wavesCleared + 1,
      },
      {
        title: 'Wave clear',
        detail: `Wave ${nextLevel} deployed with ${enemies.length + waveRemaining} targets.`,
        status: 'info',
      }
    ),
  };
}

export function advanceGame(state: GameState, arena: Arena): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  let next: GameState = {
    ...state,
    tick: state.tick + 1,
    statusTicks: Math.max(0, state.statusTicks - 1),
    player: advancePlayer(state.player),
    bullets: advanceBullets(state.bullets, arena),
    enemies: advanceEnemies(state.enemies, arena),
    explosions: advanceExplosions(state.explosions),
    spawnCooldown: Math.max(0, state.spawnCooldown - 1),
  };

  next = maybeSpawnEnemyFormation(next, arena);
  next = maybeSpawnEnemyBullets(next);
  next = resolvePlayerShots(next);
  next = resolveThreats(next, arena);
  next = maybeAdvanceWave(next, arena);

  return withTelemetrySample(next, arena);
}

function drawStarfield(canvas: ReturnType<typeof createCanvas>, arena: Arena, tick: number): void {
  for (let y = 0; y < arena.height; y++) {
    for (let x = 0; x < arena.width; x++) {
      const scrollX = x + tick * 2;
      const farRoll = (scrollX * 13 + y * 17 + 9) % 31;
      const nearRoll = (scrollX * 7 + y * 29 + 3) % 47;

      if (farRoll === 0) {
        canvas.setPixel(x, y, '.', 'gray');
      } else if (nearRoll === 0 || nearRoll === 1) {
        canvas.setPixel(x, y, '-', 'whiteBright');
      }
    }
  }
}

function drawSprite(
  canvas: ReturnType<typeof createCanvas>,
  x: number,
  y: number,
  sprite: string,
  color: string
): void {
  const left = Math.round(x);
  const row = Math.round(y);
  const { width, height } = canvas.dimensions;

  for (let index = 0; index < sprite.length; index++) {
    const px = left + index;
    if (px < 0 || px >= width || row < 0 || row >= height) {
      continue;
    }
    canvas.setPixel(px, row, sprite[index]!, color);
  }
}

function drawBullets(canvas: ReturnType<typeof createCanvas>, bullets: Bullet[]): void {
  const { width, height } = canvas.dimensions;

  for (const bullet of bullets) {
    const x = Math.round(bullet.x);
    const y = Math.round(bullet.y);
    if (y < 0 || y >= height) {
      continue;
    }

    if (bullet.owner === 'player') {
      const length = Math.max(1, bullet.length ?? 1);
      for (let offset = 0; offset < length; offset++) {
        const px = x + offset;
        if (px < 0 || px >= width) {
          continue;
        }
        canvas.setPixel(px, y, offset === length - 1 ? '>' : '=', 'cyanBright');
      }
      continue;
    }

    if (x < 0 || x >= width) {
      continue;
    }
    canvas.setPixel(x, y, '!', 'redBright');
  }
}

function drawEnemies(canvas: ReturnType<typeof createCanvas>, enemies: Enemy[]): void {
  const { width, height } = canvas.dimensions;

  for (const enemy of enemies) {
    drawSprite(canvas, enemy.x, enemy.y, ENEMY_SPRITES[enemy.type], getEnemyColor(enemy.type));

    if (enemy.hp > 1) {
      const hpX = Math.round(enemy.x) + ENEMY_SPRITES[enemy.type].length - 1;
      const hpY = Math.round(enemy.y) - 1;
      if (hpY >= 0 && hpY < height && hpX >= 0 && hpX < width) {
        canvas.setPixel(hpX, hpY, String(enemy.hp), 'yellow');
      }
    }
  }
}

function drawPlayer(canvas: ReturnType<typeof createCanvas>, state: GameState): void {
  if (state.phase === 'game-over') {
    return;
  }
  if (state.player.respawnTicks > 0 && state.player.respawnTicks % 2 === 1) {
    return;
  }

  drawSprite(canvas, state.player.x, state.player.y, PLAYER_SPRITE, 'cyanBright');
}

function drawExplosions(canvas: ReturnType<typeof createCanvas>, explosions: Explosion[]): void {
  const { width, height } = canvas.dimensions;

  for (const explosion of explosions) {
    const x = Math.round(explosion.x);
    const y = Math.round(explosion.y);
    if (x < 0 || x >= width || y < 0 || y >= height) {
      continue;
    }
    canvas.setPixel(x, y, explosion.glyph, explosion.color);
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

function renderBoard(state: GameState, arena: Arena): string[] {
  const canvas = createCanvas({ width: arena.width, height: arena.height });

  drawStarfield(canvas, arena, state.tick);
  drawEnemies(canvas, state.enemies);
  drawBullets(canvas, state.bullets);
  drawPlayer(canvas, state);
  drawExplosions(canvas, state.explosions);

  if (state.player.respawnTicks > 0 && state.phase === 'playing') {
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
  if (state.player.respawnTicks > 0) {
    return 'greenBright';
  }
  if (state.statusTicks > 0) {
    return 'yellow';
  }
  return 'gray';
}

function statusText(state: GameState): string {
  if (state.phase === 'game-over') {
    return 'Wing lost. Press Enter or R to relaunch the run.';
  }
  if (state.phase === 'paused') {
    return 'Formation paused. Press P or Enter to resume, F1 for controls.';
  }
  if (state.statusTicks > 0) {
    return state.status;
  }
  return 'Arrows / WASD move. Space fires. P pauses. F1 opens help. Q quits.';
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
      Text({ color: 'cyanBright', bold: true }, arena.compact ? ' SIDEBLASTER ' : ' TUIIUIU-SIDEBLASTER '),
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
            label: state.phase === 'game-over' ? 'Convoy lost' : state.phase === 'paused' ? 'Formation hold' : 'Lane hot',
            size: 'sm',
          }),
          Text({ color: 'gray', dim: true, wrap: 'truncate-end' }, 'horizontal shmup showcase'),
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
  const hull = getHullPercent(state);

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
    DataRow({ label: 'Active', value: state.enemies.length, valueColor: 'yellow' }),
    DataRow({ label: 'Queued', value: state.waveRemaining, valueColor: 'magentaBright' }),
    DataRow({ label: 'Enemy shots', value: state.telemetry.enemyShotsFired, valueColor: 'redBright' }),
    ProgressBar({
      value: hull,
      max: 100,
      width: 20,
      label: 'Hull',
      style: 'line',
      borderStyle: 'pipes',
      color: hull >= 66 ? 'greenBright' : hull >= 34 ? 'yellow' : 'redBright',
    }),
    Sparkline({
      data: state.telemetry.pressureHistory,
      width: 22,
      color: 'yellow',
      label: 'Pressure',
    }),
    Sparkline({
      data: state.telemetry.hullHistory,
      width: 22,
      color: 'greenBright',
      label: 'Hull',
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
        Text(
          {
            color: event.status === 'error'
              ? 'redBright'
              : event.status === 'warning'
                ? 'yellow'
                : event.status === 'success'
                  ? 'greenBright'
                  : 'cyanBright',
            bold: true,
          },
          `${getEventIcon(event.status)} ${event.title}`
        ),
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
  const hull = getHullPercent(state);
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
        Badge({ label: `${state.enemies.length + state.waveRemaining} HOSTILES`, variant: getThreatVariant(threat), style: 'subtle' })
      ),
      Text({ color: 'gray', dim: true }, `Hull ${hull}%`)
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
    title: 'formation hold',
    size: {
      width: Math.min(60, Math.max(44, arena.columns - 4)),
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
      StatusIndicator({ status: 'warning', label: 'Wing holding position while you read telemetry.' }),
      DataRow({ label: 'Threat', value: `${threat}%`, status: getStatusForPercent(100 - threat) }),
      DataRow({ label: 'Wave', value: state.level, valueColor: 'yellow' }),
      DataRow({ label: 'Hostiles', value: state.enemies.length + state.waveRemaining, valueColor: 'magentaBright' }),
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
      StatusIndicator({ status: 'info', label: 'Horizontal shmup controls adapted for the terminal.' }),
      DataRow({ label: 'Arrows / WASD', value: 'Move the ship', valueColor: 'whiteBright' }),
      DataRow({ label: 'Space', value: 'Fire forward', valueColor: 'cyanBright' }),
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
      StatusIndicator({ status: 'error', label: 'The squadron broke through the corridor.' }),
      Digits({
        value: String(state.score).padStart(SCORE_WIDTH, '0'),
        digits: SCORE_WIDTH,
        leadingZeros: true,
        style: 'minimal',
        color: 'redBright',
      }),
      DataRow({ label: 'Hi score', value: String(state.hiScore).padStart(SCORE_WIDTH, '0'), valueColor: 'whiteBright' }),
      DataRow({ label: 'Waves cleared', value: state.telemetry.wavesCleared, valueColor: 'yellow' }),
      DataRow({ label: 'Targets down', value: state.telemetry.enemiesDestroyed, valueColor: 'greenBright' }),
      Sparkline({
        data: state.telemetry.pressureHistory,
        width: 24,
        color: 'yellow',
        label: 'Pressure',
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
    Text({ color: 'cyanBright', bold: true }, 'tuiuiu-sideblaster'),
    Text({ color: 'yellow', bold: true }, `Need at least ${MIN_COLUMNS}x${MIN_ROWS}`),
    Text({ color: 'gray' }, `Current terminal: ${arena.columns}x${arena.rows}`),
    Text({ color: 'gray', dim: true }, 'Resize for the combat lane or press Q / Esc to leave.')
  );
}

function TuiuiuSideblaster(): VNode {
  const { exit } = useApp();
  const { fps, color: fpsColor } = useFps();
  const terminal = useTerminalSize();
  const arena = getArena(terminal.columns, terminal.rows);
  const [game, setGame] = useState(createNewGameState(arena));
  const [helpOpen, setHelpOpen] = useState(false);
  const state = game();
  const isHelpOpen = helpOpen();
  const boardLines = renderBoard(state, arena);

  useShortcut(['up', 'w', 'k'], () => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => movePlayer(current, 0, -1, arena));
  });

  useShortcut(['down', 's', 'j'], () => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => movePlayer(current, 0, 1, arena));
  });

  useShortcut(['left', 'a', 'h'], () => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => movePlayer(current, -1, 0, arena));
  });

  useShortcut(['right', 'd', 'l'], () => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => movePlayer(current, 1, 0, arena));
  });

  useShortcut('space', () => {
    if (isHelpOpen) {
      return;
    }
    setGame((current) => current.phase === 'game-over'
      ? createNewGameState(arena, current.hiScore)
      : firePlayerShot(current));
  });

  useShortcut('p', () => {
    if (isHelpOpen || state.phase === 'game-over') {
      return;
    }
    setGame((current) => togglePause(current));
  });

  useShortcut('r', () => {
    setHelpOpen(false);
    setGame((current) => createNewGameState(arena, current.hiScore));
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

  useShortcut('f1', () => {
    setHelpOpen((current) => !current);
  });

  useShortcut('escape', () => {
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
          Metric('Wave', String(state.level), 'yellow')
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
        Text({ color: statusColor(state), bold: state.phase !== 'playing' || state.player.respawnTicks > 0 }, statusText(state)),
        arena.compact
          ? CompactTelemetry(state, arena)
          : Text({ color: 'gray', dim: true }, 'Controls: arrows/WASD move, Space fires, P pause, F1 help, Q quit.')
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

export async function runTuiuiuSideblaster(): Promise<void> {
  const { waitUntilExit } = render(TuiuiuSideblaster, { screen: 'fullscreen', autoTabNavigation: false });
  await waitUntilExit();
}

if (isMainModule()) {
  await runTuiuiuSideblaster();
}
