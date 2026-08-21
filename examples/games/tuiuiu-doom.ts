/**
 * tuiuiu-doom
 *
 * Doom-inspired terminal raycaster for tuiuiu.js.
 *
 * Features:
 * - Half-block pseudo-3D renderer with denser wall and floor detail
 * - Mouse-driven aim, click-to-fire, drag-to-track, and keyboard fallback
 * - Enemy projectiles, pickups, minimap HUD, and combat state overlays
 *
 * Run: pnpm example tuiuiu-doom
 */

import { pathToFileURL } from 'node:url';

import {
  render,
  Box,
  Panel,
  Text,
  darkTheme,
  setTheme,
  useApp,
  useShortcut,
  useInteraction,
  useInterval,
  useLayoutRef,
  useState,
  useTerminalSize,
} from '../../src/index.js';
import { useFps } from '../../src/app/index.js';
import { createCanvas } from '../../src/ui/index.js';
import { useLocalMouse } from '../../src/hooks/use-local-mouse.js';
import type { VNode } from '../../src/utils/types.js';

setTheme(darkTheme);

type Phase = 'playing' | 'paused' | 'dead' | 'victory';
type EnemyKind = 'imp' | 'guard';
type PickupKind = 'medkit' | 'ammo';

interface Arena {
  columns: number;
  rows: number;
  compact: boolean;
  playable: boolean;
  viewportWidth: number;
  viewportHeight: number;
  sidebarWidth: number;
}

interface PlayerState {
  x: number;
  y: number;
  angle: number;
  hp: number;
  ammo: number;
}

interface EnemyState {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  cooldown: number;
  alerted: boolean;
  hurtTicks: number;
}

interface ProjectileState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
}

interface PickupState {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  active: boolean;
}

interface DoorState {
  x: number;
  y: number;
  open: number;
  targetOpen: boolean;
}

interface GameState {
  phase: Phase;
  tick: number;
  hiScore: number;
  player: PlayerState;
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  pickups: PickupState[];
  doors: DoorState[];
  kills: number;
  shotsFired: number;
  shotsHit: number;
  damageFlash: number;
  muzzleFlash: number;
  smokeTicks: number;
  weaponCooldown: number;
  history: string[];
}

interface AimState {
  x: number;
  y: number;
  lastLocalX: number | null;
  inside: boolean;
  lastAction: string;
  hoverX: number;
  hoverY: number;
}

interface MovementState {
  forward: -1 | 0 | 1;
  strafe: -1 | 0 | 1;
  turn: -1 | 0 | 1;
}

interface HeldKeyState {
  forwardUntil: number;
  backwardUntil: number;
  leftUntil: number;
  rightUntil: number;
  turnLeftUntil: number;
  turnRightUntil: number;
}

interface RayHit {
  distance: number;
  tile: string;
  vertical: boolean;
  sample: number;
}

interface PixelCell {
  filled: boolean;
  color: string | null;
  priority: number;
}

const TICK_MS = 50;
const FOV = Math.PI / 3;
const MAX_DEPTH = 16;
const RAY_STEP = 0.035;
const MOVE_STEP = 0.22;
const STRAFE_STEP = 0.18;
const TURN_STEP = Math.PI / 13;
const PLAYER_RADIUS = 0.2;
const ENEMY_SPEED = 0.05;
const PROJECTILE_SPEED = 0.16;
const PROJECTILE_TTL = 96;
const DEFAULT_MOUSE_SENSITIVITY = 0.055;
const FIRE_COOLDOWN = 4;
const KEY_HELD_MS = 280;
const EDGE_TURN_MARGIN = 6;
const EDGE_TURN_MAX_STEP = 0.18;
const DOOR_USE_DISTANCE = 1.6;
const DOOR_OPEN_SPEED = 0.18;
const PROJECTILE_RADIUS = 0.16;
const MIN_COLUMNS = 84;
const MIN_ROWS = 28;
const COMPACT_COLUMNS = 108;
const SIDEBAR_WIDTH = 26;
const HISTORY_LIMIT = 6;

const LEVEL_MAP = [
  '########################',
  '#....T....#....T.......#',
  '#.........#............#',
  '#..####...#...#####....#',
  '#..#..#...#...#...#....#',
  '#..#..#...T...T...#....#',
  '#..#..#####...#####....#',
  '#..#...............#...#',
  '#..######..######..#...#',
  '#......................#',
  '#..######..####..###...#',
  '#..#....#..#..#..#.....#',
  '#..#.T..#..#..#..#..T..#',
  '#..#....#..#..#..#.....#',
  '#..######..#..#..####..#',
  '#......................#',
  '#.....T..........T.....#',
  '########################',
] as const;

const INITIAL_ENEMIES: Array<Omit<EnemyState, 'cooldown' | 'alerted' | 'hurtTicks'>> = [
  { id: 1, kind: 'imp', x: 7.5, y: 2.5, hp: 1 },
  { id: 2, kind: 'guard', x: 14.5, y: 2.5, hp: 2 },
  { id: 3, kind: 'imp', x: 19.5, y: 2.5, hp: 1 },
  { id: 4, kind: 'imp', x: 7.5, y: 7.5, hp: 1 },
  { id: 5, kind: 'guard', x: 13.5, y: 7.5, hp: 2 },
  { id: 6, kind: 'imp', x: 18.5, y: 9.5, hp: 1 },
  { id: 7, kind: 'guard', x: 5.5, y: 12.5, hp: 2 },
  { id: 8, kind: 'imp', x: 19.5, y: 12.5, hp: 1 },
  { id: 9, kind: 'guard', x: 9.5, y: 15.5, hp: 2 },
  { id: 10, kind: 'imp', x: 16.5, y: 15.5, hp: 1 },
] as const;

const INITIAL_PICKUPS: Array<Omit<PickupState, 'active'>> = [
  { id: 1, kind: 'medkit', x: 3.5, y: 2.5 },
  { id: 2, kind: 'ammo', x: 10.5, y: 5.5 },
  { id: 3, kind: 'medkit', x: 16.5, y: 5.5 },
  { id: 4, kind: 'ammo', x: 20.5, y: 9.5 },
  { id: 5, kind: 'medkit', x: 6.5, y: 15.5 },
  { id: 6, kind: 'ammo', x: 18.5, y: 15.5 },
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function wrapAngle(angle: number): number {
  while (angle <= -Math.PI) {
    angle += Math.PI * 2;
  }
  while (angle > Math.PI) {
    angle -= Math.PI * 2;
  }
  return angle;
}

function angleDelta(target: number, current: number): number {
  return wrapAngle(target - current);
}

function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function pushHistory(history: string[], entry: string): string[] {
  return [entry, ...history].slice(0, HISTORY_LIMIT);
}

function getArena(columns: number, rows: number): Arena {
  const compact = columns < COMPACT_COLUMNS;
  const sidebarWidth = 0;
  const viewportWidth = clamp(columns, 48, 160);
  const viewportHeight = clamp(rows - 2, 18, 60);

  return {
    columns,
    rows,
    compact,
    playable: columns >= MIN_COLUMNS && rows >= MIN_ROWS && viewportWidth >= 48 && viewportHeight >= 18,
    viewportWidth,
    viewportHeight,
    sidebarWidth,
  };
}

function createDoorStates(): DoorState[] {
  const doors: DoorState[] = [];

  for (let y = 0; y < LEVEL_MAP.length; y++) {
    const row = LEVEL_MAP[y] ?? '';
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'T') {
        doors.push({ x, y, open: 0, targetOpen: false });
      }
    }
  }

  return doors;
}

function isSolidTile(tile: string): boolean {
  return tile !== '.';
}

function tileAt(x: number, y: number): string {
  const row = LEVEL_MAP[Math.floor(y)];
  if (!row) {
    return '#';
  }
  return row[Math.floor(x)] ?? '#';
}

function getDoorAt(state: GameState, cellX: number, cellY: number): DoorState | null {
  return state.doors.find((door) => door.x === cellX && door.y === cellY) ?? null;
}

function tileAtState(state: GameState, x: number, y: number): string {
  const tile = tileAt(x, y);
  if (tile !== 'T') {
    return tile;
  }

  const door = getDoorAt(state, Math.floor(x), Math.floor(y));
  return door && door.open >= 0.92 ? '.' : 'T';
}

function canOccupy(state: GameState, x: number, y: number): boolean {
  return !isSolidTile(tileAtState(state, x - PLAYER_RADIUS, y - PLAYER_RADIUS))
    && !isSolidTile(tileAtState(state, x + PLAYER_RADIUS, y - PLAYER_RADIUS))
    && !isSolidTile(tileAtState(state, x - PLAYER_RADIUS, y + PLAYER_RADIUS))
    && !isSolidTile(tileAtState(state, x + PLAYER_RADIUS, y + PLAYER_RADIUS));
}

function hasLineOfSight(state: GameState, x0: number, y0: number, x1: number, y1: number): boolean {
  const distance = distanceBetween(x0, y0, x1, y1);
  const steps = Math.max(1, Math.floor(distance / 0.04));

  for (let index = 1; index < steps; index++) {
    const t = index / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    if (
      isSolidTile(tileAtState(state, x, y))
      || isSolidTile(tileAtState(state, x - PROJECTILE_RADIUS, y))
      || isSolidTile(tileAtState(state, x + PROJECTILE_RADIUS, y))
      || isSolidTile(tileAtState(state, x, y - PROJECTILE_RADIUS))
      || isSolidTile(tileAtState(state, x, y + PROJECTILE_RADIUS))
    ) {
      return false;
    }
  }

  return true;
}

function canProjectileOccupy(state: GameState, x: number, y: number): boolean {
  return !isSolidTile(tileAtState(state, x, y))
    && !isSolidTile(tileAtState(state, x - PROJECTILE_RADIUS, y))
    && !isSolidTile(tileAtState(state, x + PROJECTILE_RADIUS, y))
    && !isSolidTile(tileAtState(state, x, y - PROJECTILE_RADIUS))
    && !isSolidTile(tileAtState(state, x, y + PROJECTILE_RADIUS));
}

function createNewGameState(hiScore = 0): GameState {
  return {
    phase: 'playing',
    tick: 0,
    hiScore,
    player: {
      x: 1.75,
      y: 1.75,
      angle: 0.35,
      hp: 100,
      ammo: 18,
    },
    enemies: INITIAL_ENEMIES.map((enemy) => ({ ...enemy, cooldown: 0, alerted: false, hurtTicks: 0 })),
    projectiles: [],
    pickups: INITIAL_PICKUPS.map((pickup) => ({ ...pickup, active: true })),
    doors: createDoorStates(),
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
    damageFlash: 0,
    muzzleFlash: 0,
    smokeTicks: 0,
    weaponCooldown: 0,
    history: [
      'Crosshair locked center. Mouse look active.',
      'Hold WASD to move. Press E to use doors.',
    ],
  };
}

function createHeldKeyState(): HeldKeyState {
  return {
    forwardUntil: 0,
    backwardUntil: 0,
    leftUntil: 0,
    rightUntil: 0,
    turnLeftUntil: 0,
    turnRightUntil: 0,
  };
}

function deriveMovementState(held: HeldKeyState, now: number): MovementState {
  const forward = held.forwardUntil > now ? 1 : 0;
  const backward = held.backwardUntil > now ? -1 : 0;
  const left = held.leftUntil > now ? -1 : 0;
  const right = held.rightUntil > now ? 1 : 0;
  const turnLeft = held.turnLeftUntil > now ? -1 : 0;
  const turnRight = held.turnRightUntil > now ? 1 : 0;

  return {
    forward: clamp(forward + backward, -1, 1) as -1 | 0 | 1,
    strafe: clamp(left + right, -1, 1) as -1 | 0 | 1,
    turn: clamp(turnLeft + turnRight, -1, 1) as -1 | 0 | 1,
  };
}

function getEdgeTurnDelta(aim: AimState, viewportWidth: number): number {
  if (!aim.inside || viewportWidth <= EDGE_TURN_MARGIN * 2) {
    return 0;
  }

  if (aim.hoverX <= EDGE_TURN_MARGIN) {
    const pressure = 1 - (clamp(aim.hoverX, 0, EDGE_TURN_MARGIN) / EDGE_TURN_MARGIN);
    return -EDGE_TURN_MAX_STEP * pressure;
  }

  const rightThreshold = viewportWidth - 1 - EDGE_TURN_MARGIN;
  if (aim.hoverX >= rightThreshold) {
    const pressure = clamp((aim.hoverX - rightThreshold) / EDGE_TURN_MARGIN, 0, 1);
    return EDGE_TURN_MAX_STEP * pressure;
  }

  return 0;
}

function scoreGame(state: GameState): number {
  const livingEnemies = state.enemies.filter((enemy) => enemy.hp > 0).length;
  return (state.kills * 200) + (state.player.hp * 4) + (state.player.ammo * 3) - (livingEnemies * 25);
}

function finalizeState(state: GameState, phase: Phase, entry: string): GameState {
  const hiScore = Math.max(state.hiScore, scoreGame(state));
  return {
    ...state,
    phase,
    hiScore,
    history: pushHistory(state.history, entry),
  };
}

function movePlayer(state: GameState, forward: number, strafe: number): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  const dx = (Math.cos(state.player.angle) * forward) + (Math.cos(state.player.angle + Math.PI / 2) * strafe);
  const dy = (Math.sin(state.player.angle) * forward) + (Math.sin(state.player.angle + Math.PI / 2) * strafe);

  let nextX = state.player.x;
  let nextY = state.player.y;

  if (canOccupy(state, nextX + dx, nextY)) {
    nextX += dx;
  }
  if (canOccupy(state, nextX, nextY + dy)) {
    nextY += dy;
  }

  return {
    ...state,
    player: {
      ...state.player,
      x: nextX,
      y: nextY,
    },
  };
}

function turnPlayer(state: GameState, delta: number): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  return {
    ...state,
    player: {
      ...state.player,
      angle: wrapAngle(state.player.angle + delta),
    },
  };
}

function castRay(state: GameState, originX: number, originY: number, angle: number): RayHit {
  for (let distance = 0; distance <= MAX_DEPTH; distance += RAY_STEP) {
    const x = originX + Math.cos(angle) * distance;
    const y = originY + Math.sin(angle) * distance;
    const tile = tileAtState(state, x, y);

    if (isSolidTile(tile)) {
      const fx = x - Math.floor(x);
      const fy = y - Math.floor(y);
      const vertical = Math.min(fx, 1 - fx) < Math.min(fy, 1 - fy);
      return {
        distance,
        tile,
        vertical,
        sample: vertical ? fy : fx,
      };
    }
  }

  return {
    distance: MAX_DEPTH,
    tile: '.',
    vertical: false,
    sample: 0,
  };
}

function applyDamage(state: GameState, damage: number, message: string): GameState {
  const hp = clamp(state.player.hp - damage, 0, 100);
  const next = {
    ...state,
    player: {
      ...state.player,
      hp,
    },
    damageFlash: 4,
    history: pushHistory(state.history, message),
  };

  if (hp === 0) {
    return finalizeState(next, 'dead', 'Marine down. Press Enter or R.');
  }

  return next;
}

function collectPickups(state: GameState): GameState {
  let hp = state.player.hp;
  let ammo = state.player.ammo;
  let history = state.history;
  let changed = false;

  const pickups = state.pickups.map((pickup) => {
    if (!pickup.active) {
      return pickup;
    }

    if (distanceBetween(pickup.x, pickup.y, state.player.x, state.player.y) > 0.55) {
      return pickup;
    }

    changed = true;
    if (pickup.kind === 'medkit') {
      hp = clamp(hp + 25, 0, 100);
      history = pushHistory(history, 'Medkit collected. Patch yourself up.');
    } else {
      ammo += 8;
      history = pushHistory(history, 'Ammo cache found. Keep firing.');
    }

    return {
      ...pickup,
      active: false,
    };
  });

  if (!changed) {
    return state;
  }

  return {
    ...state,
    pickups,
    player: {
      ...state.player,
      hp,
      ammo,
    },
    history,
  };
}

function useDoor(state: GameState): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  let bestDoor: DoorState | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let distance = 0.45; distance <= DOOR_USE_DISTANCE; distance += 0.1) {
    const x = state.player.x + Math.cos(state.player.angle) * distance;
    const y = state.player.y + Math.sin(state.player.angle) * distance;
    const door = getDoorAt(state, Math.floor(x), Math.floor(y));
    if (!door) {
      continue;
    }

    if (distance < bestDistance) {
      bestDoor = door;
      bestDistance = distance;
    }
  }

  return bestDoor ? {
    ...state,
    doors: state.doors.map((door) => door === bestDoor ? { ...door, targetOpen: true } : door),
    history: pushHistory(state.history, bestDoor.targetOpen || bestDoor.open >= 0.98 ? 'Door already opening.' : 'Door engaged.'),
  } : {
    ...state,
    history: pushHistory(state.history, 'No door in front of you.'),
  };
}

function findDoorAhead(state: GameState): DoorState | null {
  let bestDoor: DoorState | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let distance = 0.45; distance <= DOOR_USE_DISTANCE; distance += 0.1) {
    const x = state.player.x + Math.cos(state.player.angle) * distance;
    const y = state.player.y + Math.sin(state.player.angle) * distance;
    const door = getDoorAt(state, Math.floor(x), Math.floor(y));
    if (!door) {
      continue;
    }

    if (distance < bestDistance) {
      bestDoor = door;
      bestDistance = distance;
    }
  }

  return bestDoor;
}

function getAimOffset(aim: AimState): number {
  return 0;
}

function fireWeapon(state: GameState, aimOffset: number): GameState {
  if (state.phase !== 'playing' || state.weaponCooldown > 0) {
    return state;
  }

  if (state.player.ammo <= 0) {
    return {
      ...state,
      muzzleFlash: 1,
      weaponCooldown: 2,
      history: pushHistory(state.history, 'Click. Out of shells.'),
    };
  }

  const shotAngle = wrapAngle(state.player.angle + aimOffset);
  let targetIndex = -1;
  let targetDistance = Number.POSITIVE_INFINITY;

  state.enemies.forEach((enemy, index) => {
    if (enemy.hp <= 0) {
      return;
    }

    const distance = distanceBetween(state.player.x, state.player.y, enemy.x, enemy.y);
    if (distance > MAX_DEPTH) {
      return;
    }

    const angle = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x);
    const delta = angleDelta(angle, shotAngle);
    const laneOffset = Math.abs(Math.sin(delta) * distance);

    if (Math.abs(delta) > 0.16 || laneOffset > 0.55 || !hasLineOfSight(state, state.player.x, state.player.y, enemy.x, enemy.y)) {
      return;
    }

    if (distance < targetDistance) {
      targetDistance = distance;
      targetIndex = index;
    }
  });

  const enemies = state.enemies.map((enemy, index) => {
    if (index !== targetIndex) {
      return enemy;
    }

    return {
      ...enemy,
      hp: Math.max(0, enemy.hp - 1),
      alerted: true,
      hurtTicks: 7,
    };
  });

  const updatedTarget = targetIndex >= 0 ? enemies[targetIndex] : null;
  const killed = !!updatedTarget && updatedTarget.hp === 0;
  const history = targetIndex >= 0
    ? pushHistory(
      state.history,
      killed
        ? `${state.enemies[targetIndex]!.kind.toUpperCase()} neutralized.`
        : `${state.enemies[targetIndex]!.kind.toUpperCase()} staggered.`
    )
    : pushHistory(state.history, 'Shot missed. Walk the reticle onto target.');

  const next = {
    ...state,
    enemies,
    shotsFired: state.shotsFired + 1,
    shotsHit: state.shotsHit + (targetIndex >= 0 ? 1 : 0),
    kills: state.kills + (killed ? 1 : 0),
    muzzleFlash: 3,
    smokeTicks: 8,
    weaponCooldown: FIRE_COOLDOWN,
    player: {
      ...state.player,
      ammo: state.player.ammo - 1,
    },
    history,
  };

  if (next.enemies.every((enemy) => enemy.hp <= 0)) {
    return finalizeState(next, 'victory', 'Sector clear. Exfil complete.');
  }

  return next;
}

function moveEnemy(state: GameState, enemy: EnemyState, player: PlayerState, speed: number): EnemyState {
  const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  const dx = Math.cos(angle) * speed;
  const dy = Math.sin(angle) * speed;

  let nextX = enemy.x;
  let nextY = enemy.y;

  if (canOccupy(state, nextX + dx, nextY)) {
    nextX += dx;
  }
  if (canOccupy(state, nextX, nextY + dy)) {
    nextY += dy;
  }

  return {
    ...enemy,
    x: nextX,
    y: nextY,
  };
}

function advanceProjectiles(state: GameState): GameState {
  let nextState = state;
  const remaining: ProjectileState[] = [];

  for (const projectile of state.projectiles) {
    if (projectile.ttl <= 0) {
      continue;
    }

    const nextX = projectile.x + projectile.vx;
    const nextY = projectile.y + projectile.vy;

    if (!canProjectileOccupy(nextState, nextX, nextY)) {
      continue;
    }

    if (distanceBetween(nextX, nextY, nextState.player.x, nextState.player.y) < 0.35) {
      nextState = applyDamage(nextState, 8, 'Hellshot impact. Keep moving.');
      continue;
    }

    remaining.push({
      ...projectile,
      x: nextX,
      y: nextY,
      ttl: projectile.ttl - 1,
    });
  }

  return {
    ...nextState,
    projectiles: remaining,
  };
}

function advanceEnemies(state: GameState): GameState {
  let nextState = state;
  const spawnedProjectiles: ProjectileState[] = [];

  const enemies = state.enemies.map((enemy) => {
    if (enemy.hp <= 0) {
      return enemy;
    }

    const distance = distanceBetween(enemy.x, enemy.y, nextState.player.x, nextState.player.y);
    const canSeePlayer = hasLineOfSight(nextState, enemy.x, enemy.y, nextState.player.x, nextState.player.y);
    let next = {
      ...enemy,
      cooldown: Math.max(0, enemy.cooldown - 1),
      alerted: enemy.alerted || canSeePlayer || distance < 4,
    };

    if (distance < 0.85 && next.cooldown === 0) {
      nextState = applyDamage(nextState, 10, `${enemy.kind.toUpperCase()} claws through your armor.`);
      next.cooldown = 18;
      return next;
    }

    if (next.alerted && distance > 1.5) {
      const speed = enemy.kind === 'guard' ? ENEMY_SPEED * 0.9 : ENEMY_SPEED;
      next = moveEnemy(nextState, next, nextState.player, speed);
    }

    if (canSeePlayer && distance >= 1.4 && distance < 8 && next.cooldown === 0) {
      const angle = Math.atan2(nextState.player.y - next.y, nextState.player.x - next.x);
      const spawnX = next.x + Math.cos(angle) * 0.45;
      const spawnY = next.y + Math.sin(angle) * 0.45;
      if (!canProjectileOccupy(nextState, spawnX, spawnY) || !hasLineOfSight(nextState, spawnX, spawnY, nextState.player.x, nextState.player.y)) {
        return next;
      }
      spawnedProjectiles.push({
        x: spawnX,
        y: spawnY,
        vx: Math.cos(angle) * PROJECTILE_SPEED,
        vy: Math.sin(angle) * PROJECTILE_SPEED,
        ttl: PROJECTILE_TTL,
      });
      next.cooldown = enemy.kind === 'guard' ? 22 : 30;
    }

    return next;
  });

  return {
    ...nextState,
    enemies,
    projectiles: [...nextState.projectiles, ...spawnedProjectiles],
  };
}

function advanceGame(state: GameState): GameState {
  if (state.phase !== 'playing') {
    return state;
  }

  let next = {
    ...state,
    tick: state.tick + 1,
    damageFlash: Math.max(0, state.damageFlash - 1),
    muzzleFlash: Math.max(0, state.muzzleFlash - 1),
    smokeTicks: Math.max(0, state.smokeTicks - 1),
    weaponCooldown: Math.max(0, state.weaponCooldown - 1),
    doors: state.doors.map((door) => ({
      ...door,
      open: door.targetOpen ? clamp(door.open + DOOR_OPEN_SPEED, 0, 1) : door.open,
    })),
    enemies: state.enemies.map((enemy) => ({
      ...enemy,
      hurtTicks: Math.max(0, enemy.hurtTicks - 1),
    })),
  };

  next = collectPickups(next);
  next = advanceEnemies(next);

  if (next.phase === 'dead') {
    return next;
  }

  next = advanceProjectiles(next);

  if (next.phase === 'dead') {
    return next;
  }

  if (next.enemies.every((enemy) => enemy.hp <= 0)) {
    return finalizeState(next, 'victory', 'Sector clear. Exfil complete.');
  }

  return next;
}

function phaseColor(phase: Phase): string {
  if (phase === 'dead') {
    return 'redBright';
  }
  if (phase === 'victory') {
    return 'greenBright';
  }
  if (phase === 'paused') {
    return 'yellowBright';
  }
  return 'cyanBright';
}

function createPixelBuffer(width: number, height: number): PixelCell[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => ({
    filled: false,
    color: null,
    priority: -1,
  })));
}

function setPixel(buffer: PixelCell[][], x: number, y: number, color: string, priority: number): void {
  const row = buffer[y];
  const cell = row?.[x];
  if (!cell) {
    return;
  }

  if (!cell.filled || priority >= cell.priority) {
    row[x] = {
      filled: true,
      color,
      priority,
    };
  }
}

function patternValue(x: number, y: number): number {
  return (x * 17 + y * 31 + x * y * 3) % 16;
}

function wallColor(tile: string, distance: number, vertical: boolean, sample: number, y: number): string {
  if (tile === 'T') {
    if ((Math.floor(sample * 10) + y) % 6 === 0) {
      return 'whiteBright';
    }
    if (distance < 1.8) {
      return vertical ? 'yellowBright' : 'cyanBright';
    }
    if ((Math.floor(sample * 8) + y) % 5 === 0) {
      return 'yellow';
    }
    return distance < 4 ? 'yellowBright' : 'cyan';
  }

  if (distance < 1.8) {
    return vertical ? 'redBright' : 'yellowBright';
  }
  if ((Math.floor(sample * 10) + y) % 6 === 0) {
    return 'yellow';
  }
  return distance < 4 ? 'red' : 'gray';
}

function compressHalfBlocks(buffer: PixelCell[][], width: number, logicalHeight: number): string[] {
  const canvas = createCanvas({ width, height: logicalHeight / 2 });

  for (let y = 0; y < logicalHeight; y += 2) {
    for (let x = 0; x < width; x++) {
      const top = buffer[y]?.[x];
      const bottom = buffer[y + 1]?.[x];

      if (top?.filled && bottom?.filled) {
        if (top.color === bottom.color) {
          canvas.setPixel(x, y / 2, '█', top.color ?? 'white');
        } else if ((top.priority ?? 0) >= (bottom.priority ?? 0)) {
          canvas.setPixel(x, y / 2, '▀', top.color ?? 'white');
        } else {
          canvas.setPixel(x, y / 2, '▄', bottom.color ?? 'white');
        }
      } else if (top?.filled) {
        canvas.setPixel(x, y / 2, '▀', top.color ?? 'white');
      } else if (bottom?.filled) {
        canvas.setPixel(x, y / 2, '▄', bottom.color ?? 'white');
      } else {
        canvas.setPixel(x, y / 2, ' ');
      }
    }
  }

  return canvas.render();
}

function drawCentered(buffer: PixelCell[][], width: number, y: number, text: string, color: string, priority: number): void {
  const startX = Math.max(0, Math.floor((width - text.length) / 2));
  for (let index = 0; index < text.length; index++) {
    setPixel(buffer, startX + index, y, color, priority);
  }
}

function drawViewport(state: GameState, arena: Arena, aim: AimState, movement: MovementState): string[] {
  const logicalHeight = arena.viewportHeight * 2;
  const horizon = Math.floor(logicalHeight / 2);
  const depthBuffer = new Array(arena.viewportWidth).fill(MAX_DEPTH);
  const buffer = createPixelBuffer(arena.viewportWidth, logicalHeight);
  const damageShake = state.damageFlash > 0 ? ((state.tick % 3) - 1) * state.damageFlash : 0;
  const doorAhead = findDoorAhead(state);
  const isMoving = movement.forward !== 0 || movement.strafe !== 0;
  const actionPulse = state.muzzleFlash > 0 || state.damageFlash > 0;

  for (let y = 0; y < logicalHeight; y++) {
    const isCeiling = y < horizon;
    const distanceFactor = isCeiling
      ? 1 - (y / Math.max(1, horizon))
      : (y - horizon) / Math.max(1, logicalHeight - horizon - 1);

    for (let x = 0; x < arena.viewportWidth; x++) {
      const noise = patternValue(x, y);
      if (isCeiling) {
        const density = clamp((distanceFactor * 10) - 4, 0, 7);
        if (noise < density) {
          setPixel(buffer, x, y, y < horizon / 2 ? 'blueBright' : 'blue', 0);
        }
      } else {
        const rowDistance = logicalHeight / Math.max(1, y - horizon + 1);
        const viewScale = ((x - (arena.viewportWidth / 2)) / arena.viewportWidth) * rowDistance * 2.4;
        const worldX = state.player.x + (Math.cos(state.player.angle) * rowDistance) + (Math.cos(state.player.angle + Math.PI / 2) * viewScale);
        const worldY = state.player.y + (Math.sin(state.player.angle) * rowDistance) + (Math.sin(state.player.angle + Math.PI / 2) * viewScale);
        const fracX = worldX - Math.floor(worldX);
        const fracY = worldY - Math.floor(worldY);
        const cellX = Math.floor(worldX);
        const cellY = Math.floor(worldY);
        const lane = Math.abs(fracX - 0.5) < 0.045 || Math.abs(fracY - 0.5) < 0.045;
        const seam = fracX < 0.06 || fracY < 0.06;
        const checker = (Math.abs(cellX + cellY) % 2) === 0;
        const stride = isMoving && ((cellX * 7) + (cellY * 13) + state.tick) % 19 === 0;
        const actionGlow = actionPulse && ((cellX * 11) + (cellY * 17) + state.tick) % 23 === 0;
        const textured = ((noise + cellX + cellY) % 12 < clamp(distanceFactor * 8, 1, 8));
        const baseFloor = y > logicalHeight * 0.84
          ? 'gray'
          : y > logicalHeight * 0.72
            ? 'blue'
            : 'blackBright';

        let color = baseFloor;
        if (checker && textured) {
          color = y > logicalHeight * 0.8 ? 'yellow' : 'gray';
        }
        if (seam) {
          color = 'gray';
        }
        if (lane) {
          color = 'yellow';
        }
        if (stride) {
          color = 'whiteBright';
        }
        if (actionGlow) {
          color = state.damageFlash > 0 ? 'yellowBright' : 'whiteBright';
        }

        setPixel(buffer, x, y, color, 0);
      }
    }
  }

  for (let x = 0; x < arena.viewportWidth; x++) {
    const rayAngle = state.player.angle - (FOV / 2) + (x / arena.viewportWidth) * FOV;
    const hit = castRay(state, state.player.x, state.player.y, rayAngle);
    const correctedDistance = Math.max(0.0001, hit.distance * Math.cos(rayAngle - state.player.angle));
    const wallHeight = Math.min(logicalHeight, Math.floor((logicalHeight / correctedDistance) * 0.9));
    const top = Math.max(0, Math.floor((logicalHeight - wallHeight) / 2));
    const bottom = Math.min(logicalHeight - 1, top + wallHeight);

    depthBuffer[x] = correctedDistance;

    for (let y = top; y <= bottom; y++) {
      if ((Math.floor(hit.sample * 8) + y + x) % 7 === 0 && correctedDistance > 1.3) {
        continue;
      }

      setPixel(
        buffer,
        x,
        y,
        wallColor(hit.tile, correctedDistance, hit.vertical, hit.sample, y),
        4
      );
    }
  }

  const sprites = [
    ...state.enemies
      .filter((enemy) => enemy.hp > 0)
      .map((enemy) => ({ type: 'enemy' as const, x: enemy.x, y: enemy.y, kind: enemy.kind, hp: enemy.hp })),
    ...state.projectiles.map((projectile) => ({
      type: 'projectile' as const,
      x: projectile.x,
      y: projectile.y,
      kind: 'projectile' as const,
      hp: 1,
    })),
  ].sort((left, right) => distanceBetween(right.x, right.y, state.player.x, state.player.y) - distanceBetween(left.x, left.y, state.player.x, state.player.y));

  for (const sprite of sprites) {
    const dx = sprite.x - state.player.x;
    const dy = sprite.y - state.player.y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const delta = angleDelta(angle, state.player.angle);

    if (distance <= 0.35 || Math.abs(delta) > FOV / 2 + 0.25) {
      continue;
    }

    const screenX = Math.floor(((delta + FOV / 2) / FOV) * arena.viewportWidth);
    const scale = logicalHeight / distance;
    const spriteHeight = sprite.type === 'enemy'
      ? clamp(Math.floor(scale * 1.35), 6, logicalHeight)
      : clamp(Math.floor(scale * 0.25), 1, 4);
    const spriteWidth = sprite.type === 'enemy'
      ? clamp(Math.floor(spriteHeight * 1.02), 6, Math.max(6, arena.viewportWidth - 4))
      : 1;
    const top = Math.floor((logicalHeight - spriteHeight) / 2);
    const left = Math.floor(screenX - (spriteWidth / 2));

    for (let sx = 0; sx < spriteWidth; sx++) {
      const screenColumn = left + sx;
      if (screenColumn < 0 || screenColumn >= arena.viewportWidth || distance >= depthBuffer[screenColumn]) {
        continue;
      }

      for (let sy = 0; sy < spriteHeight; sy++) {
        const screenRow = top + sy;
        if (screenRow < 0 || screenRow >= logicalHeight) {
          continue;
        }

        if (sprite.type === 'projectile') {
          setPixel(buffer, screenColumn, screenRow, 'redBright', 7);
          continue;
        }

        const nx = spriteWidth === 1 ? 0 : (sx / (spriteWidth - 1)) * 2 - 1;
        const ny = spriteHeight === 1 ? 0 : sy / (spriteHeight - 1);
        const nyCentered = (ny * 2) - 1;
        const enemy = state.enemies.find((candidate) =>
          candidate.hp > 0
          && Math.abs(candidate.x - sprite.x) < 0.01
          && Math.abs(candidate.y - sprite.y) < 0.01
        );
        const bodyRadius = 0.98;
        const bodyDistance = Math.hypot(nx * 0.94, nyCentered * 0.9);
        if (bodyDistance > bodyRadius) {
          continue;
        }

        let color = sprite.kind === 'guard' ? 'magentaBright' : 'yellowBright';

        if (enemy?.hurtTicks && (sx + sy + state.tick) % 2 === 0) {
          color = 'redBright';
        }

        // Floating eye stalks around the crown.
        if (ny < 0.2) {
          const stalks = [-0.72, -0.38, 0, 0.38, 0.72];
          const isStalk = stalks.some((center) => Math.abs(nx - center) < 0.11 && ny > 0.05);
          const isStalkEye = stalks.some((center) => Math.abs(nx - center) < 0.16 && ny <= 0.08);
          if (isStalk) {
            color = 'white';
          }
          if (isStalkEye) {
            color = enemy?.hurtTicks ? 'redBright' : 'cyanBright';
          }
        }

        // Giant central eye.
        const eyeDistance = Math.hypot(nx * 0.95, (ny - 0.44) * 1.7);
        if (eyeDistance < 0.4) {
          color = 'white';
        }
        if (eyeDistance < 0.26) {
          color = enemy?.hurtTicks ? 'redBright' : 'blueBright';
        }
        if (eyeDistance < 0.12) {
          color = 'black';
        }

        // Mouth / underside.
        if (ny > 0.7 && Math.abs(nx) < 0.3 && ny < 0.88) {
          color = enemy?.hurtTicks ? 'redBright' : 'greenBright';
        }

        setPixel(buffer, screenColumn, screenRow, color, 6);
      }
    }

    if (sprite.type === 'enemy') {
      const enemy = state.enemies.find((candidate) =>
        candidate.hp > 0
        && Math.abs(candidate.x - sprite.x) < 0.01
        && Math.abs(candidate.y - sprite.y) < 0.01
      );

      if (enemy?.hurtTicks) {
        const burstY = Math.max(0, top - 1);
        const burstXs = [left - 1, left + Math.floor(spriteWidth / 2), left + spriteWidth];
        burstXs.forEach((burstX, index) => {
          if (burstX < 0 || burstX >= arena.viewportWidth || distance >= depthBuffer[clamp(burstX, 0, arena.viewportWidth - 1)]) {
            return;
          }
          const sparkY = burstY + ((state.tick + index) % 3);
          if (sparkY >= 0 && sparkY < logicalHeight) {
            setPixel(buffer, burstX, sparkY, index === 1 ? 'yellowBright' : 'redBright', 8);
          }
        });
      }
    }
  }

  const crosshairX = Math.floor(arena.viewportWidth / 2);
  const crosshairY = Math.floor(logicalHeight / 2);
  for (let dx = -2; dx <= 2; dx++) {
    if (dx !== 0) {
      setPixel(buffer, crosshairX + dx, crosshairY, state.muzzleFlash > 0 ? 'yellowBright' : 'white', 9);
    }
  }
  for (let dy = -2; dy <= 2; dy++) {
    if (dy !== 0) {
      setPixel(buffer, crosshairX, crosshairY + dy, state.muzzleFlash > 0 ? 'yellowBright' : 'white', 9);
    }
  }
  setPixel(buffer, crosshairX, crosshairY, state.muzzleFlash > 0 ? 'yellowBright' : 'white', 10);

  const weaponCenter = Math.floor(arena.viewportWidth / 2) + damageShake;
  const weaponTop = logicalHeight - 8;
  for (let y = 0; y < 8; y++) {
    const halfWidth = 6 - Math.abs(3 - Math.floor(y / 2));
    for (let x = -halfWidth; x <= halfWidth; x++) {
      const px = weaponCenter + x + (state.tick % 6 < 3 ? 0 : 1);
      const py = weaponTop + y;
      if (py < logicalHeight) {
        const absX = Math.abs(x);
        const edge = absX >= halfWidth - 1;
        const color = y < 2
          ? (edge ? 'blackBright' : 'gray')
          : y < 5
            ? (edge ? 'gray' : 'whiteBright')
            : (edge ? 'blackBright' : 'yellow');
        setPixel(buffer, px, py, color, 5);
        if (edge && py + 1 < logicalHeight) {
          setPixel(buffer, px, py + 1, 'black', 4);
        }
      }
    }
  }

  if (state.muzzleFlash > 0) {
    for (let y = 0; y < 4; y++) {
      for (let x = -1; x <= 1; x++) {
        setPixel(buffer, weaponCenter + x, weaponTop - y, 'yellowBright', 8);
      }
    }
  }

  if (state.smokeTicks > 0) {
    const smokeRows = Math.min(5, state.smokeTicks);
    for (let puff = 0; puff < smokeRows; puff++) {
      const baseY = weaponTop - 3 - puff;
      const drift = ((state.tick + puff) % 5) - 2;
      const width = 1 + Math.max(0, Math.floor((state.smokeTicks - puff) / 3));
      for (let sx = -width; sx <= width; sx++) {
        const px = weaponCenter + drift + sx;
        const py = baseY - Math.floor(Math.abs(sx) / 2);
        if (px >= 0 && px < arena.viewportWidth && py >= 0 && py < logicalHeight) {
          setPixel(buffer, px, py, puff < 2 ? 'white' : 'gray', 7);
        }
      }
    }
  }

  if (state.damageFlash > 0) {
    const thickness = Math.min(4, state.damageFlash);
    for (let x = 0; x < arena.viewportWidth; x++) {
      for (let offset = 0; offset < thickness; offset++) {
        setPixel(buffer, x, offset, 'redBright', 10);
        setPixel(buffer, x, logicalHeight - 1 - offset, 'redBright', 10);
      }
    }

    for (let y = 0; y < logicalHeight; y++) {
      for (let offset = 0; offset < thickness; offset++) {
        setPixel(buffer, offset, y, 'redBright', 10);
        setPixel(buffer, arena.viewportWidth - 1 - offset, y, 'redBright', 10);
      }
    }

    const impactXs = [
      Math.floor(arena.viewportWidth * 0.22),
      Math.floor(arena.viewportWidth * 0.78),
      Math.floor(arena.viewportWidth * 0.5),
    ];
    impactXs.forEach((centerX, index) => {
      for (let sy = -3; sy <= 3; sy++) {
        for (let sx = -4; sx <= 4; sx++) {
          const px = centerX + sx + (index === 2 ? damageShake : 0);
          const py = crosshairY + sy + (index - 1) * 4;
          const dist = Math.hypot(sx / 2.4, sy / 1.8);
          if (dist < 1.8 && px >= 0 && px < arena.viewportWidth && py >= 0 && py < logicalHeight) {
            setPixel(buffer, px, py, dist < 1.0 ? 'redBright' : 'yellowBright', 9);
          }
        }
      }
    });
  }

  if (state.phase === 'paused') {
    drawCentered(buffer, arena.viewportWidth, horizon - 2, 'PAUSED', 'yellowBright', 10);
    drawCentered(buffer, arena.viewportWidth, horizon + 2, 'Press Enter or P to resume', 'white', 10);
  } else if (state.phase === 'dead') {
    const accuracy = state.shotsFired === 0 ? 0 : Math.round((state.shotsHit / state.shotsFired) * 100);
    const title = [
      'YY   YY  OOOOO  U   U',
      ' YY YY  OO   OO U   U',
      '  YYY   OO   OO U   U',
      '  YYY   OO   OO U   U',
      '  YYY    OOOOO   UUU ',
      '',
      'DDDD    IIIII  EEEEE  DDDD ',
      'D   D     I    E      D   D',
      'D   D     I    EEEE   D   D',
      'D   D     I    E      D   D',
      'DDDD    IIIII  EEEEE  DDDD ',
    ];
    const titleTop = Math.max(1, Math.floor((logicalHeight - 20) / 2) - 4);

    for (let y = 0; y < logicalHeight; y++) {
      for (let x = 0; x < arena.viewportWidth; x++) {
        const edgeX = Math.min(x, arena.viewportWidth - 1 - x);
        const edgeY = Math.min(y, logicalHeight - 1 - y);
        const edge = Math.min(edgeX, edgeY);
        if (edge > 2) {
          continue;
        }

        const pulse = (x + (y * 3) + state.tick) % 4;
        const color = edge === 0
          ? 'redBright'
          : pulse === 0
            ? 'red'
            : 'blackBright';
        setPixel(buffer, x, y, color, 10);
      }
    }

    title.forEach((line, index) => {
      if (!line) {
        return;
      }
      drawCentered(
        buffer,
        arena.viewportWidth,
        titleTop + index,
        line,
        index < 5 ? 'redBright' : 'white',
        11
      );
    });

    drawCentered(buffer, arena.viewportWidth, titleTop + 12, 'SECTOR LOST', 'redBright', 11);
    drawCentered(
      buffer,
      arena.viewportWidth,
      titleTop + 14,
      `KILLS ${state.kills}/${state.enemies.length}   SCORE ${scoreGame(state)}   ACC ${accuracy}%`,
      'white',
      11
    );
    drawCentered(
      buffer,
      arena.viewportWidth,
      titleTop + 16,
      `HI-SCORE ${Math.max(state.hiScore, scoreGame(state))}`,
      'yellowBright',
      11
    );
    drawCentered(buffer, arena.viewportWidth, titleTop + 18, 'PRESS ENTER OR R TO RESTART', 'white', 11);
  } else if (state.phase === 'victory') {
    drawCentered(buffer, arena.viewportWidth, horizon - 2, 'SECTOR CLEAR', 'greenBright', 10);
    drawCentered(buffer, arena.viewportWidth, horizon + 2, 'Press Enter or R to run again', 'white', 10);
  } else if (state.damageFlash > 0) {
    drawCentered(buffer, arena.viewportWidth, Math.max(1, horizon - 10), 'UNDER ATTACK', 'redBright', 10);
  } else if (doorAhead && state.phase === 'playing') {
    drawCentered(
      buffer,
      arena.viewportWidth,
      Math.min(logicalHeight - 3, horizon + 10),
      doorAhead.open >= 0.92 || doorAhead.targetOpen ? 'DOOR OPENING' : 'PRESS E TO OPEN',
      'yellowBright',
      10
    );
  }

  return compressHalfBlocks(buffer, arena.viewportWidth, logicalHeight);
}

function renderMiniMap(state: GameState): string[] {
  const width = LEVEL_MAP[0].length;
  const height = LEVEL_MAP.length;
  const canvas = createCanvas({ width, height });

  for (let y = 0; y < height; y++) {
    const row = LEVEL_MAP[y] ?? '';
    for (let x = 0; x < width; x++) {
      const tile = row[x] ?? '#';
      if (tile === '.') {
        canvas.setPixel(x, y, '.', 'gray');
      } else if (tile === 'T') {
        const door = getDoorAt(state, x, y);
        canvas.setPixel(x, y, door && door.open >= 0.92 ? '/' : '+', 'cyanBright');
      } else {
        canvas.setPixel(x, y, '#', 'redBright');
      }
    }
  }

  for (const pickup of state.pickups) {
    if (!pickup.active) {
      continue;
    }
    canvas.setPixel(Math.floor(pickup.x), Math.floor(pickup.y), pickup.kind === 'ammo' ? 'a' : '+', 'yellowBright');
  }

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      continue;
    }
    canvas.setPixel(Math.floor(enemy.x), Math.floor(enemy.y), enemy.kind === 'guard' ? 'G' : 'i', 'greenBright');
  }

  const facing = Math.abs(Math.cos(state.player.angle)) > Math.abs(Math.sin(state.player.angle))
    ? (Math.cos(state.player.angle) >= 0 ? '>' : '<')
    : (Math.sin(state.player.angle) >= 0 ? 'v' : '^');
  canvas.setPixel(Math.floor(state.player.x), Math.floor(state.player.y), facing, 'white');

  return canvas.render();
}

function MinimapOverlay(state: GameState): VNode {
  const lines = renderMiniMap(state);
  const width = (lines[0]?.length ?? 22) + 2;

  return Panel(
    {
      title: 'sector map',
      borderColor: 'cyanBright',
      position: 'absolute',
      top: 1,
      right: 1,
      width,
      padding: 0,
      backgroundColor: 'background',
    },
    ...lines.map((line) => Text({}, line)),
    Text({}, ''),
    Text({ color: 'gray' }, '+ closed door   / open door'),
    Text({ color: 'gray' }, '> ^ < v player'),
    Text({ color: 'gray' }, 'TAB toggles map'),
  );
}

function HealthOverlay(state: GameState): VNode {
  const critical = state.player.hp <= 35;
  const segments = 28;
  const filled = Math.round((clamp(state.player.hp, 0, 100) / 100) * segments);
  const empty = segments - filled;
  const barColor = critical ? 'redBright' : 'greenBright';

  return Box(
    {
      position: 'absolute',
      top: 0,
      left: 1,
      width: segments,
    },
    Text({ color: barColor }, '█'.repeat(filled)),
    Text({ color: 'blackBright' }, '█'.repeat(empty))
  );
}

function FpsOverlay(fps: number, fpsColor: string): VNode {
  return Box(
    {
      position: 'absolute',
      top: 0,
      right: 1,
    },
    Text({ color: fpsColor, bold: true }, `${fps.toFixed(0)} FPS`)
  );
}

function WeaponOverlay(state: GameState): VNode {
  return Box(
    {
      position: 'absolute',
      bottom: 1,
      right: 1,
      flexDirection: 'column',
      alignItems: 'flex-end',
    },
    Text({ color: 'gray' }, 'BEHOLDER BUSTER'),
    Text({ color: 'yellowBright', bold: true }, `${String(state.player.ammo).padStart(3, '0')} AMMO`)
  );
}

function InputRibbonOverlay(events: string[], viewportWidth: number): VNode {
  const ribbon = events.length > 0
    ? events.join('  ')
    : 'MOUSE  WASD  LMB  E  TAB';

  return Box(
    {
      position: 'absolute',
      bottom: 0,
      left: 1,
      width: Math.max(16, viewportWidth - 24),
    },
    Text({ color: 'cyanBright' }, `INPUT  ${ribbon}`)
  );
}

function healthBar(value: number): string {
  const filled = Math.round((clamp(value, 0, 100) / 100) * 10);
  return `[${'#'.repeat(filled)}${'.'.repeat(10 - filled)}]`;
}

function StatusPanel(state: GameState, arena: Arena, fps: number, fpsColor: string, helpOpen: boolean, aim: AimState): VNode {
  const accuracy = state.shotsFired === 0 ? 0 : Math.round((state.shotsHit / state.shotsFired) * 100);
  const aliveEnemies = state.enemies.filter((enemy) => enemy.hp > 0).length;
  const miniMap = renderMiniMap(state);
  const lines: VNode[] = [];

  if (helpOpen) {
    const helpLines = [
      'Mouse move   look',
      'Mouse left   fire',
      'TAB          minimap overlay',
      '',
      'W / S        forward/back',
      'A / D        strafe',
      'E            use/open door',
      'Q            turn left',
      'Left/Right   turn',
      'Up/Down      forward/back',
      'Space        fire',
      'P            pause',
      'Enter        resume/restart',
      'R            restart',
      'F1           toggle help',
      'Esc          quit',
      '',
      'doom-over-dns is a desktop',
      'PowerShell/.NET build.',
      'This example is a native',
      'tuiuiu raycaster instead.',
    ];

    for (const line of helpLines) {
      lines.push(Text({ color: line ? 'gray' : undefined }, line));
    }

    return Panel(
      {
        title: 'controls',
        borderColor: 'yellowBright',
        padding: 0,
        width: arena.sidebarWidth,
      },
      ...lines
    );
  }

  const score = scoreGame(state);

  lines.push(Text({ color: phaseColor(state.phase) }, `PHASE   ${state.phase.toUpperCase()}`));
  lines.push(Text({ color: 'redBright' }, `HP      ${String(state.player.hp).padStart(3, '0')} ${healthBar(state.player.hp)}`));
  lines.push(Text({ color: 'yellowBright' }, `AMMO    ${String(state.player.ammo).padStart(3, '0')}`));
  lines.push(Text({ color: 'greenBright' }, `KILLS   ${state.kills}/${state.enemies.length}`));
  lines.push(Text({ color: 'cyanBright' }, `ENEMY   ${aliveEnemies} active`));
  lines.push(Text({ color: 'white' }, `SCORE   ${score}`));
  lines.push(Text({ color: 'gray' }, `HI      ${Math.max(state.hiScore, score)}`));
  lines.push(Text({ color: fpsColor }, `FPS     ${fps.toFixed(0)}`));
  lines.push(Text({ color: 'gray' }, `ACC     ${accuracy}%`));
  lines.push(Text({ color: aim.inside ? 'greenBright' : 'gray' }, `HOVER   ${aim.inside ? 'LIVE' : 'OUTSIDE'}`));
  lines.push(Text({ color: 'gray' }, `MOUSE   ${Math.round(aim.x * 100)}:${Math.round(aim.y * 100)} ${aim.lastAction}`));
  lines.push(Text({ color: 'gray' }, `CELL    ${aim.hoverX}:${aim.hoverY}`));
  lines.push(Text({}, ''));
  lines.push(Text({ color: 'cyanBright' }, 'MINIMAP'));
  for (const line of miniMap) {
    lines.push(Text({}, line));
  }
  lines.push(Text({}, ''));
  lines.push(Text({ color: 'yellowBright' }, 'LOG'));
  for (const entry of state.history) {
    lines.push(Text({ color: 'gray' }, `- ${entry}`));
  }

  return Panel(
    {
      title: 'status',
      borderColor: phaseColor(state.phase),
      padding: 0,
      width: arena.sidebarWidth,
    },
    ...lines
  );
}

function ScreenTooSmall(arena: Arena): VNode {
  return Panel(
    {
      title: 'tuiuiu-doom',
      borderColor: 'redBright',
      padding: 1,
      width: Math.max(32, arena.columns - 2),
    },
    Text({ color: 'redBright' }, 'Terminal too small for the viewport.'),
    Text({ color: 'gray' }, `Need at least ${MIN_COLUMNS}x${MIN_ROWS}.`),
    Text({ color: 'gray' }, `Current size: ${arena.columns}x${arena.rows}.`)
  );
}

function buildFooterLine(state: GameState, helpOpen: boolean, aim: AimState, movement: MovementState, sensitivity: number, viewportWidth: number): string {
  if (helpOpen) {
    return 'HELP  Mouse move looks | TAB toggles minimap without pausing | Hold WASD to move | E uses doors | arrows turn';
  }

  const latest = state.history[0] ?? 'Sector hot.';
  const hover = aim.inside ? `hover ${aim.hoverX}:${aim.hoverY}` : 'hover outside';
  const motion = `move f${movement.forward} s${movement.strafe} t${movement.turn}`;
  const edge = aim.inside ? `edge ${getEdgeTurnDelta(aim, viewportWidth).toFixed(2)}` : 'edge off';
  return `${latest}  |  ${hover}  |  ${motion}  |  sens ${sensitivity.toFixed(3)}  |  ${edge}`;
}

function TuiuiuDoom(): VNode {
  const { exit } = useApp();
  const { fps, color: fpsColor } = useFps();
  const terminal = useTerminalSize();
  const arena = getArena(terminal.columns, terminal.rows);
  const viewportRef = useLayoutRef();
  const [game, setGame] = useState(createNewGameState());
  const [helpOpen, setHelpOpen] = useState(false);
  const [minimapOpen, setMinimapOpen] = useState(false);
  const [heldKeys, setHeldKeys] = useState<HeldKeyState>(createHeldKeyState());
  const [mouseSensitivity, setMouseSensitivity] = useState(DEFAULT_MOUSE_SENSITIVITY);
  const [mouseLookDelta, setMouseLookDelta] = useState(0);
  const [recentEvents, setRecentEvents] = useState<string[]>([]);
  const [aim, setAim] = useState<AimState>({
    x: 0.5,
    y: 0.5,
    lastLocalX: null,
    inside: false,
    lastAction: 'idle',
    hoverX: -1,
    hoverY: -1,
  });

  const state = game();
  const isHelpOpen = helpOpen();
  const isMinimapOpen = minimapOpen();
  const moveState = deriveMovementState(heldKeys(), Date.now());
  const sensitivity = mouseSensitivity();
  const inputTrace = recentEvents();
  const mouseAim = aim();
  const viewport = drawViewport(state, arena, mouseAim, moveState);
  const pushRecentEvent = (entry: string) => {
    setRecentEvents((current) => [entry, ...current].slice(0, 15));
  };

  useLocalMouse(
    () => ({
      x: viewportRef.x(),
      y: viewportRef.y(),
      width: viewportRef.width(),
      height: viewportRef.height(),
    }),
    (event) => {
      if (!arena.playable || viewportRef.width() === 0 || viewportRef.height() === 0) {
        return;
      }

      const currentAim = aim();
      const previousX = currentAim.lastLocalX ?? event.x;
      const turnDelta = clamp((event.x - previousX) * sensitivity, -0.24, 0.24);
      const movedEnough = Math.abs(event.x - currentAim.hoverX) >= 2 || Math.abs(event.y - currentAim.hoverY) >= 1;
      if (event.action !== 'move' || movedEnough || event.isInside !== currentAim.inside) {
        const mouseIcon = event.action === 'move'
          ? (event.x > previousX ? 'M→' : event.x < previousX ? 'M←' : event.y > currentAim.hoverY ? 'M↓' : 'M↑')
          : event.button === 'left'
            ? 'LMB'
            : event.button === 'right'
              ? 'RMB'
              : event.button === 'middle'
                ? 'MMB'
                : 'M';
        const suffix = event.isInside ? '' : ' OUT';
        pushRecentEvent(`${mouseIcon}${suffix}`);
      }

      setAim({
        x: 0.5,
        y: 0.5,
        lastLocalX: event.isInside ? event.x : null,
        inside: event.isInside,
        lastAction: event.isInside ? event.action : 'leave',
        hoverX: event.x,
        hoverY: event.y,
      });

      if (isHelpOpen || !event.isInside) {
        return;
      }

      if (Math.abs(turnDelta) > 0.0001 && (event.action === 'move' || event.action === 'drag' || event.action === 'click' || event.action === 'double-click')) {
        setMouseLookDelta((current) => clamp(current + turnDelta, -0.45, 0.45));
      }

      if (event.button === 'left' && (event.action === 'click' || event.action === 'double-click' || event.action === 'drag')) {
        setGame((current) => fireWeapon(current, 0));
      }
    },
    { onlyInside: false },
  );

  useInteraction((event) => {
    if (event.type !== 'key') return;
    const input = event.key.text;
    const key = event.key.native;
    if (isHelpOpen) {
      return;
    }

    const normalized = input.toLowerCase();
    const until = Date.now() + KEY_HELD_MS;

    if (normalized === 'w' || key.upArrow) {
      pushRecentEvent(key.upArrow ? 'UP' : 'W');
      setHeldKeys((current) => ({ ...current, forwardUntil: until }));
      return;
    }

    if (normalized === 's' || key.downArrow) {
      pushRecentEvent(key.downArrow ? 'DOWN' : 'S');
      setHeldKeys((current) => ({ ...current, backwardUntil: until }));
      return;
    }

    if (normalized === 'a') {
      pushRecentEvent('A');
      setHeldKeys((current) => ({ ...current, leftUntil: until }));
      return;
    }

    if (normalized === 'd') {
      pushRecentEvent('D');
      setHeldKeys((current) => ({ ...current, rightUntil: until }));
      return;
    }

    if (normalized === 'q' || key.leftArrow) {
      pushRecentEvent(key.leftArrow ? 'LEFT' : 'Q');
      setHeldKeys((current) => ({ ...current, turnLeftUntil: until }));
      return;
    }

    if (key.rightArrow) {
      pushRecentEvent('RIGHT');
      setHeldKeys((current) => ({ ...current, turnRightUntil: until }));
      return;
    }

    if (normalized === 'e') {
      pushRecentEvent('E');
      setGame((current) => useDoor(current));
    }
  });

  useShortcut('-', () => {
    if (isHelpOpen) {
      return;
    }
    pushRecentEvent('-');
    setMouseSensitivity((current) => clamp(Number((current - 0.005).toFixed(3)), 0.02, 0.12));
  });

  useShortcut(['=', '+'], () => {
    if (isHelpOpen) {
      return;
    }
    pushRecentEvent('+');
    setMouseSensitivity((current) => clamp(Number((current + 0.005).toFixed(3)), 0.02, 0.12));
  });

  useShortcut('space', () => {
    if (isHelpOpen) {
      return;
    }
    pushRecentEvent('SPACE');
    setGame((current) => fireWeapon(current, 0));
  });

  useShortcut('p', () => {
    if (isHelpOpen || state.phase === 'dead' || state.phase === 'victory') {
      return;
    }
    pushRecentEvent('P');
    setGame((current) => ({
      ...current,
      phase: current.phase === 'paused' ? 'playing' : 'paused',
      history: pushHistory(current.history, current.phase === 'paused' ? 'Combat resumed.' : 'Combat paused.'),
    }));
  });

  useShortcut('r', () => {
    pushRecentEvent('R');
    setHelpOpen(false);
    setMinimapOpen(false);
    setHeldKeys(createHeldKeyState());
    setMouseLookDelta(0);
    setAim({ x: 0.5, y: 0.5, lastLocalX: null, inside: false, lastAction: 'reset', hoverX: -1, hoverY: -1 });
    setGame((current) => createNewGameState(Math.max(current.hiScore, scoreGame(current))));
  });

  useShortcut('f1', () => {
    pushRecentEvent('F1');
    setMinimapOpen(false);
    setHelpOpen((open) => !open);
  });

  useShortcut('tab', () => {
    if (isHelpOpen) {
      return;
    }
    pushRecentEvent('TAB');
    setMinimapOpen((open) => !open);
  });

  useShortcut('enter', () => {
    if (isHelpOpen) {
      pushRecentEvent('ENTER');
      setHelpOpen(false);
      return;
    }

    pushRecentEvent('ENTER');
    setGame((current) => {
      if (current.phase === 'playing') {
        return current;
      }
      if (current.phase === 'paused') {
        return {
          ...current,
          phase: 'playing',
          history: pushHistory(current.history, 'Combat resumed.'),
        };
      }
      return createNewGameState(Math.max(current.hiScore, scoreGame(current)));
    });
  });

  useShortcut(['escape', 'ctrl+c'], () => {
    if (isHelpOpen) {
      pushRecentEvent('ESC');
      setHelpOpen(false);
      return;
    }
    if (isMinimapOpen) {
      pushRecentEvent('ESC');
      setMinimapOpen(false);
      return;
    }
    pushRecentEvent('ESC');
    exit();
  });

  useInterval(() => {
    if (isHelpOpen) {
      return;
    }

    const activeMovement = deriveMovementState(heldKeys(), Date.now());
    const lookDelta = mouseLookDelta();
    const edgeTurnDelta = (activeMovement.forward === 0 && activeMovement.strafe === 0)
      ? getEdgeTurnDelta(aim(), arena.viewportWidth)
      : 0;
    if (lookDelta !== 0) {
      setMouseLookDelta(0);
    }
    setGame((current) => {
      let next = current;

      if (activeMovement.turn !== 0 || edgeTurnDelta !== 0 || lookDelta !== 0) {
        next = turnPlayer(next, (TURN_STEP * activeMovement.turn) + edgeTurnDelta + lookDelta);
      }

      if (activeMovement.forward !== 0 || activeMovement.strafe !== 0) {
        next = movePlayer(next, MOVE_STEP * activeMovement.forward, STRAFE_STEP * activeMovement.strafe);
      }

      return advanceGame(next);
    });
  }, TICK_MS);

  if (!arena.playable) {
    return ScreenTooSmall(arena);
  }

  const footerLine = buildFooterLine(state, isHelpOpen, mouseAim, moveState, sensitivity, arena.viewportWidth);
  const overlay = isMinimapOpen ? MinimapOverlay(state) : null;

  return Box(
    {
      flexDirection: 'column',
      width: arena.columns,
      height: arena.rows,
    },
    Box(
      {
        position: 'relative',
        flexDirection: 'column',
        width: arena.viewportWidth,
        height: arena.viewportHeight,
        layoutRef: viewportRef,
      },
      ...viewport.map((line) => Text({}, line)),
      HealthOverlay(state),
      FpsOverlay(fps, fpsColor),
      InputRibbonOverlay(inputTrace, arena.viewportWidth),
      WeaponOverlay(state),
      overlay
    ),
    Text({ color: isHelpOpen || isMinimapOpen ? 'yellowBright' : fpsColor }, footerLine)
  );
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  return import.meta.url === pathToFileURL(entry).href;
}

export async function runTuiuiuDoom(): Promise<void> {
  const { waitUntilExit } = render(TuiuiuDoom, {
    screen: 'fullscreen',
    autoTabNavigation: false,
    maxFps: 30,
  });
  await waitUntilExit();
}

if (isMainModule()) {
  await runTuiuiuDoom();
}
