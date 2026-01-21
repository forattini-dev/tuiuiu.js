/**
 * Tuiuiu Defence - Terminal Strategy Demo
 *
 * Features:
 * - Path-following monsters
 * - Full-width map with textured terrain
 * - Buildable tiles and tower placement
 * - Tower upgrades with scaling stats
 * - Waves, gold economy, and lives
 *
 * Run: pnpm tsx examples/app-tuiuiu-defence.ts
 */

import {
  render,
  Box,
  Text,
  Panel,
  createSignal,
  batch,
  useHotkeys,
  useApp,
  useMouse,
  useLayoutRef,
  getTerminalSize,
  setTheme,
  darkTheme,
  useInterval,
  useFps,
  resolveColor,
} from '../src/index.js';
import type { VNode } from '../src/utils/types.js';

// =============================================================================
// ANSI Helpers for fast map rendering
// =============================================================================

const ESC = '\u001B[';
const RESET = `${ESC}0m`;

/** Convert hex color to ANSI RGB escape code */
function hexToAnsi(hex: string, isBg: boolean): string {
  if (!hex || !hex.startsWith('#')) return '';
  const code = isBg ? 48 : 38;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${ESC}${code};2;${r};${g};${b}m`;
}

/** Build ANSI-styled character */
function styledChar(
  ch: string,
  color: string,
  backgroundColor: string | undefined,
  bold: boolean,
  dim: boolean
): string {
  const resolved = resolveColor(color);
  const fg = hexToAnsi(resolved, false);
  const bg = backgroundColor ? hexToAnsi(resolveColor(backgroundColor), true) : '';
  const boldCode = bold ? `${ESC}1m` : '';
  const dimCode = dim ? `${ESC}2m` : '';
  return `${boldCode}${dimCode}${fg}${bg}${ch}${RESET}`;
}

// Set theme BEFORE render (required for proper input handling)
setTheme(darkTheme);

// =============================================================================
// Types
// =============================================================================

type Point = { x: number; y: number };

type Monster = {
  id: number;
  hp: number;
  maxHp: number;
  pathIndex: number;
  speed: number;
  reward: number;
};

type Tower = {
  id: number;
  x: number;
  y: number;
  level: number;
  cooldown: number;
};

type Projectile = {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number; // 0 to 1
  damage: number;
  targetMonsterId: number;
};

// =============================================================================
// Map + Path
// =============================================================================

const MAP_MIN_WIDTH = 12;
const MAP_MIN_HEIGHT = 8;
const HEADER_HEIGHT = 0;
const OUTER_PADDING = 1;
const MAP_PANEL_PADDING = 0;
const PANEL_BORDER = 0;
const INFO_RESERVED_ROWS = 2; // Top + bottom compact bars
const MAP_INFO_GAP = 0;
const MENU_OPTIONS = ['New Game', 'Exit'] as const;

function getMapSize(columns: number, rows: number): { width: number; height: number } {
  const availableWidth = columns - OUTER_PADDING * 2 - MAP_PANEL_PADDING * 2 - PANEL_BORDER;
  const availableHeight = rows - HEADER_HEIGHT - OUTER_PADDING * 2 - MAP_PANEL_PADDING * 2 - PANEL_BORDER - INFO_RESERVED_ROWS - MAP_INFO_GAP;

  const width = Math.max(availableWidth, MAP_MIN_WIDTH);
  const height = Math.max(availableHeight, MAP_MIN_HEIGHT);

  return { width, height };
}

function clampCoord(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildWaypoints(width: number, height: number): Point[] {
  const maxX = Math.max(0, width - 1);
  const maxY = Math.max(0, height - 1);

  const y1 = clampCoord(1, 1, Math.max(1, maxY - 1));
  const x1 = clampCoord(Math.floor(width * 0.75), 3, Math.max(3, maxX - 1));
  const y2 = clampCoord(Math.floor(height * 0.35), 2, Math.max(2, maxY - 2));
  const x2 = clampCoord(Math.floor(width * 0.25), 2, Math.max(2, maxX - 3));
  const y3 = clampCoord(Math.floor(height * 0.65), 3, Math.max(3, maxY - 3));
  const x3 = clampCoord(width - 3, 3, Math.max(3, maxX - 1));
  const y4 = clampCoord(height - 2, 2, Math.max(2, maxY - 1));

  return [
    { x: 0, y: y1 },
    { x: x1, y: y1 },
    { x: x1, y: y2 },
    { x: x2, y: y2 },
    { x: x2, y: y3 },
    { x: x3, y: y3 },
    { x: x3, y: y4 },
    { x: maxX, y: y4 },
  ];
}

function buildPath(waypoints: Point[]): Point[] {
  const path: Point[] = [];
  let current = { ...waypoints[0] };
  path.push(current);

  for (let i = 1; i < waypoints.length; i++) {
    const target = waypoints[i];
    const stepX = Math.sign(target.x - current.x);
    const stepY = Math.sign(target.y - current.y);

    while (current.x !== target.x || current.y !== target.y) {
      current = { x: current.x + stepX, y: current.y + stepY };
      path.push(current);
    }
  }

  return path;
}

// Build path with width (horizontal segments 3 wide, vertical segments 5 wide)
function buildPathWithWidth(centerPath: Point[], width: number, height: number): Set<string> {
  const pathSet = new Set<string>();
  const halfWidthHorizontal = 1; // 3 wide = center + 1 on each side
  const halfWidthVertical = 2; // 5 wide = center + 2 on each side

  for (let i = 0; i < centerPath.length; i++) {
    const current = centerPath[i];
    const next = centerPath[i + 1];
    const prev = centerPath[i - 1];

    // Determine direction of travel
    let isHorizontal = false;
    let isVertical = false;

    if (next) {
      if (next.x !== current.x) isHorizontal = true;
      if (next.y !== current.y) isVertical = true;
    }
    if (prev) {
      if (prev.x !== current.x) isHorizontal = true;
      if (prev.y !== current.y) isVertical = true;
    }

    // Add center
    pathSet.add(`${current.x},${current.y}`);

    // Expand perpendicular to direction
    if (isHorizontal && !isVertical) {
      // Horizontal segment - expand vertically
      for (let dy = -halfWidthHorizontal; dy <= halfWidthHorizontal; dy++) {
        const ny = current.y + dy;
        if (ny >= 0 && ny < height) {
          pathSet.add(`${current.x},${ny}`);
        }
      }
    } else if (isVertical && !isHorizontal) {
      // Vertical segment - expand horizontally
      for (let dx = -halfWidthVertical; dx <= halfWidthVertical; dx++) {
        const nx = current.x + dx;
        if (nx >= 0 && nx < width) {
          pathSet.add(`${nx},${current.y}`);
        }
      }
    } else {
      // Corner or endpoint - expand both ways (keep vertical wider)
      for (let dx = -halfWidthVertical; dx <= halfWidthVertical; dx++) {
        for (let dy = -halfWidthHorizontal; dy <= halfWidthHorizontal; dy++) {
          const nx = current.x + dx;
          const ny = current.y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            pathSet.add(`${nx},${ny}`);
          }
        }
      }
    }
  }

  return pathSet;
}

function pseudoRandom(x: number, y: number, seed: number): number {
  const value = (x * 73 + y * 97 + seed * 151) % 100;
  return value < 0 ? value + 100 : value;
}

// Simplex-like noise for clustering terrain features
function noise2D(x: number, y: number, scale: number, seed: number): number {
  const nx = x / scale;
  const ny = y / scale;
  const ix = Math.floor(nx);
  const iy = Math.floor(ny);
  const fx = nx - ix;
  const fy = ny - iy;

  const v00 = pseudoRandom(ix, iy, seed) / 100;
  const v10 = pseudoRandom(ix + 1, iy, seed) / 100;
  const v01 = pseudoRandom(ix, iy + 1, seed) / 100;
  const v11 = pseudoRandom(ix + 1, iy + 1, seed) / 100;

  const tx = fx * fx * (3 - 2 * fx);
  const ty = fy * fy * (3 - 2 * fy);

  const v0 = v00 + (v10 - v00) * tx;
  const v1 = v01 + (v11 - v01) * tx;
  return v0 + (v1 - v0) * ty;
}

const TERRAIN_ASPECT_BIAS = 1.35;
const TERRAIN_ASPECT_MIN = 0.6;
const TERRAIN_ASPECT_MAX = 2.2;

function getTerrainStretch(width: number, height: number): { x: number; y: number } {
  const aspect = height / Math.max(1, width);
  const adjusted = Math.max(
    TERRAIN_ASPECT_MIN,
    Math.min(TERRAIN_ASPECT_MAX, aspect * TERRAIN_ASPECT_BIAS)
  );
  return { x: 1 / adjusted, y: adjusted };
}

function riverCenterY(x: number, width: number, height: number, stretchX: number): number {
  const baseY = Math.floor(height * 0.46);
  const amplitude = Math.max(2, Math.floor(height * 0.22));
  const waveLength = Math.max(6, Math.floor(width * 0.12));
  const noiseValue = noise2D(x * stretchX, 0, 16, 301);
  const sway = Math.sin((x / waveLength) * Math.PI * 2);
  return Math.round(baseY + (noiseValue - 0.5) * amplitude + sway * (amplitude * 0.35));
}

function buildRiver(width: number, height: number, stretchX: number): Set<string> {
  const river = new Set<string>();
  if (width < 10 || height < 6) return river;
  const halfWidth = Math.max(1, Math.floor(height * 0.06));

  for (let x = 0; x < width; x++) {
    const centerY = riverCenterY(x, width, height, stretchX);
    for (let dy = -halfWidth; dy <= halfWidth; dy++) {
      const y = centerY + dy;
      if (y >= 0 && y < height) {
        river.add(`${x},${y}`);
      }
    }
  }

  return river;
}

function buildLake(width: number, height: number, stretchX: number, stretchY: number): Set<string> {
  const lake = new Set<string>();
  if (width < 12 || height < 8) return lake;

  const centerX = Math.floor(width * 0.68);
  const riverY = riverCenterY(centerX, width, height, stretchX);
  const centerY = clampCoord(riverY - Math.floor(height * 0.18), 2, Math.max(2, height - 3));
  const radiusX = Math.max(3, Math.floor(width * 0.12));
  const radiusY = Math.max(2, Math.floor(height * 0.09));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const dist = dx * dx + dy * dy;
      const wobble = (noise2D(x * stretchX, y * stretchY, 6, 401) - 0.5) * 0.35;
      if (dist + wobble < 1) {
        lake.add(`${x},${y}`);
      }
    }
  }

  return lake;
}

// Separate noise layers for different biomes (regional clustering)
function getBiomeAt(x: number, y: number, width: number, height: number): 'mountain' | 'forest' | 'plains' | 'flowers' {
  // Compensate for terminal character aspect ratio (~2:1 height:width)
  // This makes regions appear more circular instead of vertically stretched
  const CHAR_ASPECT = 2.0;
  const nx = x;
  const ny = y * CHAR_ASPECT;

  // Each biome uses independent noise with different seeds
  // Larger scale = bigger regions, smaller scale = more fragmented

  // Mountain regions - use larger scale (10-12) for big mountain ranges
  // Octave noise: base + detail for natural-looking edges
  const mountainBase = noise2D(nx, ny, 12, 201);
  const mountainDetail = noise2D(nx, ny, 6, 202) * 0.3;
  const mountainNoise = mountainBase + mountainDetail;

  // Forest regions - use medium-large scale (14-16) for forest groves
  // Separate seed ensures forests appear independently of mountains
  const forestBase = noise2D(nx, ny, 14, 301);
  const forestDetail = noise2D(nx, ny, 7, 302) * 0.25;
  const forestNoise = forestBase + forestDetail;

  // Flower meadows - smaller scale (8) for scattered patches
  const flowerNoise = noise2D(nx, ny, 8, 401);

  // Priority: mountains > forests > flowers > plains
  // Thresholds tuned for ~15% mountains, ~20% forests, ~10% flowers
  if (mountainNoise > 0.72) return 'mountain';
  if (forestNoise > 0.68) return 'forest';
  if (flowerNoise > 0.72) return 'flowers';
  return 'plains';
}

function generateTerrainTile(x: number, y: number, width: number, height: number): string {
  const biome = getBiomeAt(x, y, width, height);
  const detailNoise = noise2D(x, y, 4, 102);
  const speck = pseudoRandom(x, y, 77) / 100;
  const groundSeed = pseudoRandom(x, y, 88);

  switch (biome) {
    case 'mountain': {
      // Rocky terrain with variation
      const intensity = noise2D(x, y, 3, 203);
      if (intensity > 0.6) return speck > 0.5 ? '^' : '░';
      if (intensity > 0.4) return '░';
      return '`';
    }

    case 'forest': {
      // Dense forest with variation
      const density = noise2D(x, y, 4, 303);
      if (density > 0.5) return speck > 0.4 ? 'T' : 't';
      if (density > 0.3) return 't';
      if (density > 0.2) return '\'';
      return '.';
    }

    case 'flowers': {
      // Flower patches
      if (detailNoise > 0.5) return '*';
      if (detailNoise > 0.3) return '\'';
      return '.';
    }

    case 'plains':
    default: {
      // Open ground with occasional grass
      if (detailNoise > 0.8) return '\'';
      if (groundSeed < 15) return ',';
      if (groundSeed < 30) return '`';
      return '.';
    }
  }
}

function createBaseMap(width: number, height: number, centerPath: Point[]): string[][] {
  // Generate terrain only - path is rendered via background color
  const { x: stretchX, y: stretchY } = getTerrainStretch(width, height);
  const riverCells = buildRiver(width, height, stretchX);
  const lakeCells = buildLake(width, height, stretchX, stretchY);
  const pathCells = buildPathWithWidth(centerPath, width, height);

  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const key = `${x},${y}`;
      // Path is always clear - no obstacles
      if (pathCells.has(key)) return '.';
      // Water features
      if (riverCells.has(key) || lakeCells.has(key)) return '~';
      // Generate biome-based terrain
      return generateTerrainTile(x, y, width, height);
    })
  );
}

// =============================================================================
// Game Constants
// =============================================================================

const BASE_TICK_MS = 16; // Base interval (~60Hz, reliable timer)
const SPEED_OPTIONS = [1, 2, 4, 8] as const; // Speed multipliers (1x, 2x, 4x, 8x)
type GameSpeed = (typeof SPEED_OPTIONS)[number];
const SPAWN_INTERVAL_TICKS = 10;
const WAVE_GAP_TICKS = 12;
const BASE_WAVE_SIZE = 12;
const BUILD_COST = 25;
const INITIAL_GOLD = 60;
const INITIAL_LIVES = 18;
const BUILDABLE_TILES = new Set(['.', ',', '`', '*', '\'']);

// =============================================================================
// Helpers
// =============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isBuildable(x: number, y: number, map: string[][]): boolean {
  const tile = map[y]?.[x];
  return tile ? BUILDABLE_TILES.has(tile) : false;
}

// Check if a 2x2 area is buildable (for towers)
function is2x2Buildable(x: number, y: number, map: string[][], pathSet: Set<string>, existingTowers: Tower[]): { ok: boolean; reason: string } {
  const width = map[0]?.length ?? 0;
  const height = map.length;

  // Check bounds
  if (x < 0 || y < 0 || x + 1 >= width || y + 1 >= height) {
    return { ok: false, reason: 'Too close to edge' };
  }

  // Check all 4 cells
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      const cx = x + dx;
      const cy = y + dy;
      const key = `${cx},${cy}`;

      // Check path
      if (pathSet.has(key)) {
        return { ok: false, reason: 'Cannot build on path' };
      }

      // Check terrain
      if (!isBuildable(cx, cy, map)) {
        return { ok: false, reason: 'Invalid terrain' };
      }

      // Check existing towers (2x2 collision)
      for (const tower of existingTowers) {
        if (cx >= tower.x && cx < tower.x + 2 && cy >= tower.y && cy < tower.y + 2) {
          return { ok: false, reason: 'Tower already here' };
        }
      }
    }
  }

  return { ok: true, reason: '' };
}

// Check if cursor is over a tower (2x2)
function towerAtPosition(x: number, y: number, towerList: Tower[]): Tower | undefined {
  return towerList.find(t => x >= t.x && x < t.x + 2 && y >= t.y && y < t.y + 2);
}

function getTowerStats(level: number): { range: number; damage: number; cooldown: number; upgradeCost: number } {
  const range = 4 + level * 2; // Base 4, +2 per level
  const damage = 2 + level;
  const cooldown = Math.max(1, 4 - Math.floor(level / 2));
  const upgradeCost = 15 + level * 10;
  return { range, damage, cooldown, upgradeCost };
}

function getMonsterStats(wave: number): { maxHp: number; speed: number; reward: number } {
  const safeWave = Math.max(1, wave);
  const maxHp = 6 + safeWave * 2 + Math.floor(safeWave * safeWave * 0.08);
  const speed = Math.min(1.0, 0.34 + safeWave * 0.012 + Math.floor((safeWave - 1) / 6) * 0.02);
  const reward = 4 + Math.floor(safeWave * 0.6);
  return { maxHp, speed, reward };
}

function getMonsterPosition(monster: Monster, path: Point[]): Point {
  const index = Math.min(path.length - 1, Math.floor(monster.pathIndex));
  return path[index] ?? { x: 0, y: 0 };
}

function findTargetIndex(tower: Tower, monsters: Monster[], path: Point[], range: number): number | null {
  let bestIndex = -1;
  let bestProgress = -Infinity;

  // Use tower center (2x2 tower, so center is at x+0.5, y+0.5)
  const towerCenterX = tower.x + 0.5;
  const towerCenterY = tower.y + 0.5;

  for (let i = 0; i < monsters.length; i++) {
    const monster = monsters[i];
    const pos = getMonsterPosition(monster, path);
    const distance = Math.abs(towerCenterX - pos.x) + Math.abs(towerCenterY - pos.y);

    if (distance <= range && monster.pathIndex > bestProgress) {
      bestIndex = i;
      bestProgress = monster.pathIndex;
    }
  }

  return bestIndex >= 0 ? bestIndex : null;
}

function describeTile(tile: string, isPath: boolean, isSpawn: boolean, isExit: boolean): string {
  if (isSpawn) return 'Spawn';
  if (isExit) return 'Base';
  if (isPath) return 'Path';

  switch (tile) {
    case '~':
      return 'Pond';
    case '^':
    case '░':
      return 'Rocks';
    case 't':
    case 'T':
      return 'Forest';
    case '*':
      return 'Flowers';
    case '\'':
      return 'Grass';
    default:
      return 'Ground';
  }
}

function truncateBarText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return text.slice(0, maxLength);
  return `${text.slice(0, maxLength - 3)}...`;
}

// =============================================================================
// Module-Level Game State (MUST be outside component for proper reactivity)
// =============================================================================

// Initial calculations (done once at module load)
const initialTerminal = getTerminalSize();
const initialSize = getMapSize(initialTerminal.columns, initialTerminal.rows);
const initialPath = buildPath(buildWaypoints(initialSize.width, initialSize.height));

// All signals at module level - this is critical for proper reactivity
const [terminalSize, setTerminalSize] = createSignal(initialTerminal);
const [screen, setScreen] = createSignal<'menu' | 'game'>('menu');
const [menuSelection, setMenuSelection] = createSignal(0);
const [towers, setTowers] = createSignal<Tower[]>([]);
const [monsters, setMonsters] = createSignal<Monster[]>([]);
const [gold, setGold] = createSignal(INITIAL_GOLD);
const [lives, setLives] = createSignal(INITIAL_LIVES);
const [wave, setWave] = createSignal(1);
const [spawnsRemaining, setSpawnsRemaining] = createSignal(BASE_WAVE_SIZE);
const [spawnTimer, setSpawnTimer] = createSignal(0);
const [waveCooldown, setWaveCooldown] = createSignal(0);
const [cursor, setCursor] = createSignal<Point>({
  x: Math.min(2, Math.max(0, initialSize.width - 1)),
  y: Math.min(2, Math.max(0, initialSize.height - 1)),
});
const [paused, setPaused] = createSignal(false);
const [gameOver, setGameOver] = createSignal(false);
const [message, setMessage] = createSignal('Build towers to stop the monsters.');
const [nextMonsterId, setNextMonsterId] = createSignal(1);
const [nextTowerId, setNextTowerId] = createSignal(1);
const [nextProjectileId, setNextProjectileId] = createSignal(1);
const [projectiles, setProjectiles] = createSignal<Projectile[]>([]);
const [mapWidth, setMapWidth] = createSignal(initialSize.width);
const [mapHeight, setMapHeight] = createSignal(initialSize.height);
const [path, setPath] = createSignal<Point[]>(initialPath);
const [widePath, setWidePath] = createSignal<Set<string>>(
  buildPathWithWidth(initialPath, initialSize.width, initialSize.height)
);
const [baseMap, setBaseMap] = createSignal<string[][]>(
  createBaseMap(initialSize.width, initialSize.height, initialPath)
);
const [gameSpeed, setGameSpeed] = createSignal<GameSpeed>(1);

// Mutable ref for speed - the interval callback reads this directly.
// This pattern ensures the callback always sees the latest speed value,
// bypassing any closure capture or callback-update timing issues.
let speedRef = { current: 1 as GameSpeed };

// =============================================================================
// Game Component
// =============================================================================

function TowerDefense(): VNode {
  const { exit } = useApp();
  const mapRef = useLayoutRef();
  const { fps, color: fpsColor } = useFps();

  function startGame(): void {
    resetGame();
    setScreen('game');
  }

  function moveMenuSelection(delta: number): void {
    const count = MENU_OPTIONS.length;
    setMenuSelection(index => (index + delta + count) % count);
  }

  function activateMenuSelection(): void {
    const current = MENU_OPTIONS[menuSelection()];
    if (current === 'New Game') {
      startGame();
      return;
    }
    exit();
  }

  function resetGame(
    nextWidth: number = mapWidth(),
    nextHeight: number = mapHeight(),
    note: string = 'Build towers to stop the monsters.'
  ): void {
    const safeWidth = Math.max(1, nextWidth);
    const safeHeight = Math.max(1, nextHeight);
    batch(() => {
      setTowers([]);
      setMonsters([]);
      setGold(INITIAL_GOLD);
      setLives(INITIAL_LIVES);
      setWave(1);
      setSpawnsRemaining(BASE_WAVE_SIZE);
      setSpawnTimer(0);
      setWaveCooldown(0);
      setCursor({ x: Math.min(2, safeWidth - 1), y: Math.min(2, safeHeight - 1) });
      setPaused(false);
      setGameOver(false);
      setMessage(note);
      setNextMonsterId(1);
      setNextTowerId(1);
      setNextProjectileId(1);
      setProjectiles([]);
      setGameSpeed(1);
      speedRef.current = 1;
    });
  }

  function spawnMonster(currentWave: number): Monster {
    const id = nextMonsterId();
    setNextMonsterId(id + 1);
    const stats = getMonsterStats(currentWave);
    return {
      id,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      pathIndex: 0,
      speed: stats.speed,
      reward: stats.reward,
    };
  }

  function towerAt(x: number, y: number): Tower | undefined {
    return towerAtPosition(x, y, towers());
  }

  function buildAt(x: number, y: number): void {
    const map = baseMap();
    const currentWidePath = widePath();
    const currentTowers = towers();

    // Check if we're over an existing tower - if so, upgrade instead
    const existingTower = towerAtPosition(x, y, currentTowers);
    if (existingTower) {
      upgradeAt(x, y);
      return;
    }

    // Check 2x2 buildability
    const check = is2x2Buildable(x, y, map, currentWidePath, currentTowers);
    if (!check.ok) {
      setMessage(check.reason);
      return;
    }

    if (gold() < BUILD_COST) {
      setMessage('Not enough gold to build.');
      return;
    }

    const id = nextTowerId();
    setNextTowerId(id + 1);
    setTowers([...currentTowers, { id, x, y, level: 1, cooldown: 0 }]);
    setGold(value => value - BUILD_COST);
    setMessage(`Built tower for ${BUILD_COST}g.`);
  }

  function upgradeAt(x: number, y: number): void {
    const existingTower = towerAtPosition(x, y, towers());
    if (!existingTower) {
      setMessage('Select a tower to upgrade.');
      return;
    }
    const stats = getTowerStats(existingTower.level);
    if (gold() < stats.upgradeCost) {
      setMessage('Not enough gold to upgrade.');
      return;
    }
    setTowers(list =>
      list.map(tower => {
        if (tower.id !== existingTower.id) return tower;
        const nextLevel = tower.level + 1;
        const nextCooldown = Math.min(tower.cooldown, getTowerStats(nextLevel).cooldown);
        return { ...tower, level: nextLevel, cooldown: nextCooldown };
      })
    );
    setGold(value => value - stats.upgradeCost);
    setMessage(`Upgraded Lv${existingTower.level + 1} for ${stats.upgradeCost}g.`);
  }

  function tickGame(): void {
    if (paused() || gameOver()) return;

    // Get speed multiplier from ref (always up-to-date)
    const speedMultiplier = speedRef.current;

    batch(() => {
      const currentPath = path();
      let currentWave = wave();
      let spawnTimerValue = spawnTimer();
      let waveCooldownValue = waveCooldown();
      let spawnsRemainingValue = spawnsRemaining();
      let goldValue = gold();
      let livesValue = lives();
      let activeMonsters = monsters();
      const currentTowers = towers();
      let activeProjectiles = projectiles();

      // Timers are multiplied by speed
      if (waveCooldownValue > 0) {
        waveCooldownValue -= speedMultiplier;
        spawnTimerValue = 0;
      } else {
        spawnTimerValue += speedMultiplier;
        if (spawnTimerValue >= SPAWN_INTERVAL_TICKS && spawnsRemainingValue > 0) {
          spawnTimerValue = 0;
          spawnsRemainingValue -= 1;
          activeMonsters = [...activeMonsters, spawnMonster(currentWave)];
        }
      }

      // Move monsters forward (speed multiplied)
      const movedMonsters: Monster[] = [];
      let escaped = 0;

      for (const monster of activeMonsters) {
        const nextIndex = monster.pathIndex + monster.speed * speedMultiplier;
        if (nextIndex >= currentPath.length - 1) {
          escaped += 1;
          continue;
        }
        movedMonsters.push({ ...monster, pathIndex: nextIndex });
      }

      livesValue -= escaped;

      // Move projectiles and apply damage on hit (speed multiplied)
      const PROJECTILE_SPEED = 0.4; // Progress per tick
      const remainingProjectiles: Projectile[] = [];
      const monstersAfterProjectiles = movedMonsters.map(m => ({ ...m }));

      for (const proj of activeProjectiles) {
        const newProgress = proj.progress + PROJECTILE_SPEED * speedMultiplier;

        if (newProgress >= 1) {
          // Projectile hit - apply damage to target monster
          const targetIdx = monstersAfterProjectiles.findIndex(m => m.id === proj.targetMonsterId);
          if (targetIdx !== -1) {
            monstersAfterProjectiles[targetIdx].hp -= proj.damage;
          }
        } else {
          // Projectile still in flight
          remainingProjectiles.push({ ...proj, progress: newProgress });
        }
      }

      // Towers fire new projectiles (cooldown reduced by speed multiplier)
      const newProjectiles: Projectile[] = [];
      const updatedTowers = currentTowers.map(tower => {
        const stats = getTowerStats(tower.level);
        let cooldown = Math.max(0, tower.cooldown - speedMultiplier);

        if (cooldown === 0) {
          const targetIndex = findTargetIndex(tower, monstersAfterProjectiles, currentPath, stats.range);
          if (targetIndex !== null) {
            const target = monstersAfterProjectiles[targetIndex];
            const targetPos = getMonsterPosition(target, currentPath);

            // Create projectile from tower center to monster
            const projId = nextProjectileId();
            setNextProjectileId(projId + 1);
            newProjectiles.push({
              id: projId,
              fromX: tower.x + 0.5,
              fromY: tower.y + 0.5,
              toX: targetPos.x,
              toY: targetPos.y,
              progress: 0,
              damage: stats.damage,
              targetMonsterId: target.id,
            });
            cooldown = stats.cooldown;
          }
        }

        return { ...tower, cooldown };
      });

      // Remove defeated monsters and grant gold
      const survivingMonsters: Monster[] = [];
      let goldEarned = 0;

      for (const monster of monstersAfterProjectiles) {
        if (monster.hp > 0) {
          survivingMonsters.push(monster);
        } else {
          goldEarned += monster.reward;
        }
      }

      goldValue += goldEarned;

      if (spawnsRemainingValue === 0 && survivingMonsters.length === 0 && activeProjectiles.length === 0) {
        currentWave += 1;
        spawnsRemainingValue = BASE_WAVE_SIZE + (currentWave - 1) * 4;
        waveCooldownValue = WAVE_GAP_TICKS;
        spawnTimerValue = 0;
        goldValue += 10 + currentWave * 2;
        setMessage(`Wave ${currentWave} incoming.`);
      }

      if (livesValue <= 0) {
        livesValue = 0;
        setGameOver(true);
        setMessage('Game Over. Press R to restart.');
      }

      setMonsters(survivingMonsters);
      setTowers(updatedTowers);
      setProjectiles([...remainingProjectiles, ...newProjectiles]);
      setGold(goldValue);
      setLives(livesValue);
      setWave(currentWave);
      setSpawnsRemaining(spawnsRemainingValue);
      setWaveCooldown(waveCooldownValue);
      setSpawnTimer(spawnTimerValue);
    });
  }

  // Game loop - single tick per frame, speed multiplier affects movement
  useInterval(
    () => {
      tickGame();
    },
    BASE_TICK_MS,
    { enabled: screen() === 'game' && !paused() && !gameOver() }
  );

  // Ensure component re-renders when speed changes (for UI updates)
  const _ = gameSpeed();

  // Manual tick for debugging - press T
  useHotkeys('t', () => {
    if (screen() !== 'game') return;
    tickGame();
  });

  // Speed control - 1=1x, 2=2x, 3=4x, 4=8x
  // Update both signal (for UI) and ref (for game loop)
  useHotkeys('1', () => {
    if (screen() !== 'game') return;
    speedRef.current = 1;
    setGameSpeed(1);
    setMessage(`Speed: 1x`);
  });
  useHotkeys('2', () => {
    if (screen() !== 'game') return;
    speedRef.current = 2;
    setGameSpeed(2);
    setMessage(`Speed: 2x`);
  });
  useHotkeys('3', () => {
    if (screen() !== 'game') return;
    speedRef.current = 4;
    setGameSpeed(4);
    setMessage(`Speed: 4x`);
  });
  useHotkeys('4', () => {
    if (screen() !== 'game') return;
    speedRef.current = 8;
    setGameSpeed(8);
    setMessage(`Speed: 8x`);
  });

  useMouse((event) => {
    if (screen() !== 'game') return;
    if (gameOver()) return;
    if (mapRef.width() === 0 || mapRef.height() === 0) return;

    // Account for 1-based terminal coordinates and panel structure
    const mapX = event.x - mapRef.x();
    const mapY = event.y - mapRef.y();
    const currentWidth = mapWidth();
    const currentHeight = mapHeight();

    // Debug: uncomment to debug mouse offset issues
    // setMessage(`raw(${event.x},${event.y}) ref(${mapRef.x()},${mapRef.y()}) map(${mapX},${mapY})`);

    if (mapX < 0 || mapY < 0 || mapX >= currentWidth || mapY >= currentHeight) {
      return;
    }

    // Move cursor on any mouse movement
    if (event.action === 'move' || event.action === 'drag') {
      const current = cursor();
      if (current.x !== mapX || current.y !== mapY) {
        setCursor({ x: mapX, y: mapY });
      }
      return;
    }

    // Single click: just select/move cursor (safe exploration)
    if (event.action === 'click' && event.button === 'left') {
      setCursor({ x: mapX, y: mapY });
      return;
    }

    // Double-click left: build tower
    if (event.action === 'double-click' && event.button === 'left') {
      setCursor({ x: mapX, y: mapY });
      buildAt(mapX, mapY);
      return;
    }

    // Right-click: upgrade tower
    if (event.button === 'right' && (event.action === 'click' || event.action === 'double-click')) {
      setCursor({ x: mapX, y: mapY });
      upgradeAt(mapX, mapY);
      return;
    }
  });

  // Keyboard controls using useHotkeys
  useHotkeys('escape', () => exit());
  useHotkeys('q', () => exit());
  useHotkeys('r', () => {
    if (screen() === 'game') resetGame();
  });
  useHotkeys('enter', () => {
    if (screen() === 'menu') activateMenuSelection();
  });
  useHotkeys('space', () => {
    if (screen() !== 'game') return;
    const nextPaused = !paused();
    setPaused(nextPaused);
    setMessage(nextPaused ? 'Paused.' : 'Resumed.');
  });

  // Movement (only when not game over)
  useHotkeys('up', () => {
    if (screen() === 'menu') {
      moveMenuSelection(-1);
      return;
    }
    if (!gameOver()) setCursor(pos => ({ x: pos.x, y: clamp(pos.y - 1, 0, mapHeight() - 1) }));
  });
  useHotkeys('w', () => {
    if (screen() !== 'game') return;
    if (!gameOver()) setCursor(pos => ({ x: pos.x, y: clamp(pos.y - 1, 0, mapHeight() - 1) }));
  });
  useHotkeys('down', () => {
    if (screen() === 'menu') {
      moveMenuSelection(1);
      return;
    }
    if (!gameOver()) setCursor(pos => ({ x: pos.x, y: clamp(pos.y + 1, 0, mapHeight() - 1) }));
  });
  useHotkeys('s', () => {
    if (screen() !== 'game') return;
    if (!gameOver()) setCursor(pos => ({ x: pos.x, y: clamp(pos.y + 1, 0, mapHeight() - 1) }));
  });
  useHotkeys('left', () => {
    if (screen() !== 'game') return;
    if (!gameOver()) setCursor(pos => ({ x: clamp(pos.x - 1, 0, mapWidth() - 1), y: pos.y }));
  });
  useHotkeys('a', () => {
    if (screen() !== 'game') return;
    if (!gameOver()) setCursor(pos => ({ x: clamp(pos.x - 1, 0, mapWidth() - 1), y: pos.y }));
  });
  useHotkeys('right', () => {
    if (screen() !== 'game') return;
    if (!gameOver()) setCursor(pos => ({ x: clamp(pos.x + 1, 0, mapWidth() - 1), y: pos.y }));
  });
  useHotkeys('d', () => {
    if (screen() !== 'game') return;
    if (!gameOver()) setCursor(pos => ({ x: clamp(pos.x + 1, 0, mapWidth() - 1), y: pos.y }));
  });

  // Actions
  useHotkeys('b', () => {
    if (screen() !== 'game') return;
    if (!gameOver()) {
      const { x, y } = cursor();
      buildAt(x, y);
    }
  });
  useHotkeys('u', () => {
    if (screen() !== 'game') return;
    if (!gameOver()) {
      const { x, y } = cursor();
      upgradeAt(x, y);
    }
  });

  const mapView = (): VNode => {
    const map = baseMap();
    const width = mapWidth();
    const height = mapHeight();
    const currentPath = path();
    const currentWidePath = widePath();
    const currentTowers = towers();
    const currentProjectiles = projectiles();
    const cursorPos = cursor();

    // Build tower lookup for 2x2 cells
    const towerCells = new Map<string, { tower: Tower; position: 'TL' | 'TR' | 'BL' | 'BR' }>();
    for (const tower of currentTowers) {
      towerCells.set(`${tower.x},${tower.y}`, { tower, position: 'TL' });
      towerCells.set(`${tower.x + 1},${tower.y}`, { tower, position: 'TR' });
      towerCells.set(`${tower.x},${tower.y + 1}`, { tower, position: 'BL' });
      towerCells.set(`${tower.x + 1},${tower.y + 1}`, { tower, position: 'BR' });
    }

    // Tower range visualization - show when cursor is over a tower
    const selectedTower = towerAtPosition(cursorPos.x, cursorPos.y, currentTowers);
    const rangeSet = new Set<string>();
    if (selectedTower) {
      const stats = getTowerStats(selectedTower.level);
      const centerX = selectedTower.x + 0.5;
      const centerY = selectedTower.y + 0.5;
      // Manhattan distance range visualization
      for (let dy = -stats.range; dy <= stats.range; dy++) {
        for (let dx = -stats.range; dx <= stats.range; dx++) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist <= stats.range) {
            const rx = Math.floor(centerX + dx);
            const ry = Math.floor(centerY + dy);
            if (rx >= 0 && rx < width && ry >= 0 && ry < height) {
              rangeSet.add(`${rx},${ry}`);
            }
          }
        }
      }
    }

    // Projectile positions (interpolated)
    const projectilePositions = new Map<string, Projectile>();
    for (const proj of currentProjectiles) {
      const px = Math.round(proj.fromX + (proj.toX - proj.fromX) * proj.progress);
      const py = Math.round(proj.fromY + (proj.toY - proj.fromY) * proj.progress);
      projectilePositions.set(`${px},${py}`, proj);
    }

    // Spawn/exit markers (from center path)
    const spawn = currentPath[0];
    const exit = currentPath[currentPath.length - 1];
    const spawnKey = spawn ? `${spawn.x},${spawn.y}` : '';
    const exitKey = exit ? `${exit.x},${exit.y}` : '';

    const monsterCounts = new Map<string, number>();
    const monsterHealth = new Map<string, { hp: number; maxHp: number }>();
    for (const monster of monsters()) {
      const pos = getMonsterPosition(monster, currentPath);
      const key = `${pos.x},${pos.y}`;
      monsterCounts.set(key, (monsterCounts.get(key) ?? 0) + 1);
      const currentHealth = monsterHealth.get(key) ?? { hp: 0, maxHp: 0 };
      monsterHealth.set(key, {
        hp: currentHealth.hp + monster.hp,
        maxHp: currentHealth.maxHp + monster.maxHp,
      });
    }

    const rows: VNode[] = [];

    function getHealthColor(ratio: number): string {
      if (ratio > 0.66) return 'success';
      if (ratio > 0.33) return 'warning';
      return 'error';
    }

    for (let y = 0; y < height; y++) {
      let rowStr = ''; // Build entire row as ANSI string for performance
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        const base = map[y]?.[x] ?? '.';
        const towerCell = towerCells.get(key);
        const monsterCount = monsterCounts.get(key) ?? 0;
        const projectile = projectilePositions.get(key);
        const isOnWidePath = currentWidePath.has(key);
        const isSpawn = key === spawnKey;
        const isExit = key === exitKey;
        const isInRange = rangeSet.has(key);

        let ch = base;
        let color: string = 'mutedForeground';
        let bold = false;
        let dim = false;
        let backgroundColor: string | undefined;

        // Terrain colors
        if (base === '~') {
          color = 'primary';
        } else if (base === '^' || base === '░') {
          color = 'mutedForeground';
        } else if (base === 't' || base === 'T') {
          color = 'success';
          if (base === 'T') bold = true;
        } else if (base === '*') {
          color = 'warning';
        } else if (base === '\'') {
          color = 'success';
          dim = true;
        } else {
          dim = true;
        }

        // Tower range highlight (subtle)
        if (isInRange && !towerCell) {
          backgroundColor = '#2a2a1a'; // Subtle yellow tint
        }

        // Wide path: colored background
        if (isOnWidePath && !towerCell) {
          backgroundColor = isInRange ? '#4d3a2a' : '#3d2a1a'; // Lighter if in range
          dim = false;
          if (isSpawn) {
            ch = 'S';
            color = 'success';
            bold = true;
            backgroundColor = '#1a3d1a';
          } else if (isExit) {
            ch = 'E';
            color = 'error';
            bold = true;
            backgroundColor = '#3d1a1a';
          }
        }

        // Tower 2x2 rendering
        if (towerCell) {
          const { tower, position } = towerCell;
          const levelChar = String(Math.min(tower.level, 9));
          switch (position) {
            case 'TL': ch = '╔'; break;
            case 'TR': ch = levelChar; break;
            case 'BL': ch = levelChar; break;
            case 'BR': ch = '╝'; break;
          }
          color = tower.cooldown === 0 ? 'accent' : 'warning';
          bold = true;
          dim = false;
          backgroundColor = '#1a2a3d';
        }

        // Projectile rendering (bullet character)
        if (projectile && !towerCell) {
          ch = 'o';
          color = 'accent';
          bold = true;
          dim = false;
        }

        // Monster overrides (highest priority after cursor)
        if (monsterCount > 0) {
          ch = monsterCount > 9 ? 'M' : String(monsterCount);
          const health = monsterHealth.get(key);
          const ratio = health ? health.hp / Math.max(1, health.maxHp) : 1;
          color = getHealthColor(ratio);
          bold = true;
          dim = false;
        }

        // Cursor highlight (highest priority)
        const isCursor = cursorPos.x === x && cursorPos.y === y;
        if (isCursor) {
          backgroundColor = 'secondary';
        }

        rowStr += styledChar(ch, color, backgroundColor, bold, dim);
      }
      // Single Text node per row instead of 80+ nodes - massive performance gain
      rows.push(Text({}, rowStr));
    }

    return Box({ flexDirection: 'column', width, height, layoutRef: mapRef }, ...rows);
  };

  const menuView = (): VNode => {
    const items = MENU_OPTIONS.map((label, index) => {
      const selected = menuSelection() === index;
      return Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: selected ? 'accent' : 'mutedForeground', bold: selected }, selected ? '>' : ' '),
        Text({ color: selected ? 'accent' : 'foreground', bold: selected }, label)
      );
    });

    return Box(
      { flexDirection: 'column', height: 'fill', width: 'fill', justifyContent: 'center', alignItems: 'center', gap: 1 },
      Text({ bold: true, color: 'primary' }, 'Tuiuiu Defence'),
      Panel(
        { title: 'Main Menu', padding: 1, width: 26 },
        Box({ flexDirection: 'column', gap: 1 }, ...items),
        Text({ dim: true }, 'Use Up/Down and Enter')
      ),
      Text({ dim: true }, 'Press Q to quit')
    );
  };

  if (screen() === 'menu') {
    return menuView();
  }

  const cursorPos = cursor();
  const map = baseMap();
  const currentPath = path();
  const currentWidePath = widePath();
  const tile = map[cursorPos.y]?.[cursorPos.x] ?? '.';
  const towerHere = towerAt(cursorPos.x, cursorPos.y);
  const cursorKey = `${cursorPos.x},${cursorPos.y}`;
  const spawnPoint = currentPath[0];
  const exitPoint = currentPath[currentPath.length - 1];
  const isOnPath = currentWidePath.has(cursorKey);
  const isSpawn = spawnPoint && cursorPos.x === spawnPoint.x && cursorPos.y === spawnPoint.y;
  const isExit = exitPoint && cursorPos.x === exitPoint.x && cursorPos.y === exitPoint.y;
  const tileLabel = describeTile(tile, isOnPath, !!isSpawn, !!isExit);

  // Check if 2x2 is buildable at cursor
  const buildCheck = is2x2Buildable(cursorPos.x, cursorPos.y, map, currentWidePath, towers());
  const tileInfoText = `Tile(${cursorPos.x},${cursorPos.y}): ${tileLabel}`;
  const spawnInfoText = waveCooldown() > 0
    ? `Spawns:0 Next:${waveCooldown()}t`
    : `Spawns:${spawnsRemaining()}`;

  let towerInfoText = '';
  let towerInfoColor: string = 'mutedForeground';
  let selectedTowerStats: { level: number; damage: number; range: number; cooldown: number; upgradeCost: number } | null = null;
  if (towerHere) {
    const stats = getTowerStats(towerHere.level);
    const ready = towerHere.cooldown === 0;
    towerInfoText = `Tower Lv${towerHere.level} Dmg:${stats.damage} Rng:${stats.range} ${ready ? 'Ready' : `CD:${towerHere.cooldown}`}`;
    towerInfoColor = 'accent';
    selectedTowerStats = {
      level: towerHere.level,
      damage: stats.damage,
      range: stats.range,
      cooldown: towerHere.cooldown,
      upgradeCost: stats.upgradeCost,
    };
  } else if (buildCheck.ok) {
    towerInfoText = `Build 2x2 (${BUILD_COST}g)`;
    towerInfoColor = 'success';
  } else {
    towerInfoText = buildCheck.reason;
  }

  const stateLabel = paused()
    ? 'PAUSED'
    : gameOver()
      ? 'GAME OVER'
      : `Defending (${monsters().length})`;
  const stateColor = paused() ? 'warning' : gameOver() ? 'error' : 'success';
  const barMessage = truncateBarText(message(), 40);
  const barTowerInfo = truncateBarText(towerInfoText, 36);

  return Box(
    { flexDirection: 'column', position: 'relative', width: 'fill', height: 'fill' },
    // Main content
    Box(
      { flexDirection: 'column', gap: MAP_INFO_GAP, padding: OUTER_PADDING },
      // Top bar
      Box(
        { flexDirection: 'row', gap: 2, width: 'fill', paddingX: 1, backgroundColor: 'muted' },
        Text({ color: 'primary', bold: true }, 'Tuiuiu Defence'),
        Text({ color: 'warning', bold: true }, `Gold:${gold()}`),
        Text({ color: 'foreground' }, `Lives:${lives()}`),
        Text({ color: 'foreground' }, `Wave:${wave()}`),
        Text({ color: 'foreground' }, spawnInfoText),
        Box({ flexGrow: 1 }), // Spacer
        Text({ color: gameSpeed() > 1 ? 'warning' : 'muted', bold: gameSpeed() > 1 }, `${gameSpeed()}x`),
        Text({ color: fpsColor, dim: true }, `${fps}fps`)
      ),
      // Map
      mapView(),
      // Bottom bar
      Box(
        { flexDirection: 'row', gap: 2, width: 'fill', paddingX: 1, backgroundColor: 'muted' },
        Text({ color: 'foreground' }, tileInfoText),
        Text({ color: towerInfoColor }, barTowerInfo),
        Text({ color: stateColor, bold: true }, stateLabel),
        Text({ dim: true }, barMessage)
      )
    ),
    // Floating tower details panel (absolute positioned at top-right)
    selectedTowerStats
      ? Panel(
          { position: 'absolute', top: 2, right: 2, title: 'Tower', padding: 1, width: 22, backgroundColor: 'background' },
          Text({ color: 'accent', bold: true }, `Lv ${selectedTowerStats.level}`),
          Text({}, `Dmg: ${selectedTowerStats.damage}`),
          Text({}, `Range: ${selectedTowerStats.range}`),
          Text({}, selectedTowerStats.cooldown === 0 ? 'Ready' : `CD: ${selectedTowerStats.cooldown}`),
          Text({ dim: true }, `Upgrade: ${selectedTowerStats.upgradeCost}g`)
        )
      : null
  );
}

const { waitUntilExit } = render(TowerDefense, {
  // useDeltaRenderer: true, // Disabled - adds overhead, bottleneck is elsewhere
});
await waitUntilExit();
