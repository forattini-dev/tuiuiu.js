/**
 * Tower Defense - Terminal Strategy Demo
 *
 * Features:
 * - Path-following monsters
 * - Full-width map with textured terrain
 * - Buildable tiles and tower placement
 * - Tower upgrades with scaling stats
 * - Waves, gold economy, and lives
 *
 * Run: pnpm tsx examples/app-tower-defense.ts
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
} from '../src/index.js';
import type { VNode } from '../src/utils/types.js';

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
const HEADER_HEIGHT = 1;
const OUTER_PADDING = 1;
const MAP_PANEL_PADDING = 1;
const PANEL_BORDER = 2;
const INFO_RESERVED_ROWS = 8; // Compact controls take less space
const MAP_INFO_GAP = 1;

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

// Build path with width (expands path to 3 cells wide)
function buildPathWithWidth(centerPath: Point[], width: number, height: number): Set<string> {
  const pathSet = new Set<string>();
  const halfWidth = 1; // 3 wide = center + 1 on each side

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
      for (let dy = -halfWidth; dy <= halfWidth; dy++) {
        const ny = current.y + dy;
        if (ny >= 0 && ny < height) {
          pathSet.add(`${current.x},${ny}`);
        }
      }
    } else if (isVertical && !isHorizontal) {
      // Vertical segment - expand horizontally
      for (let dx = -halfWidth; dx <= halfWidth; dx++) {
        const nx = current.x + dx;
        if (nx >= 0 && nx < width) {
          pathSet.add(`${nx},${current.y}`);
        }
      }
    } else {
      // Corner or endpoint - expand both ways
      for (let dx = -halfWidth; dx <= halfWidth; dx++) {
        for (let dy = -halfWidth; dy <= halfWidth; dy++) {
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

function generateTerrainTile(x: number, y: number): string {
  const forestNoise = noise2D(x, y, 7, 33) * 0.6 + noise2D(x, y, 4, 44) * 0.4;
  const rockNoise = noise2D(x, y, 12, 55) * 0.7 + noise2D(x, y, 6, 66) * 0.3;
  const waterNoise = noise2D(x, y, 15, 11);
  const detailNoise = pseudoRandom(x, y, 77) / 100;

  // Small ponds (rare, only at noise peaks)
  if (waterNoise > 0.82) {
    return '~';
  }

  // Rocky outcrops (sparse)
  if (rockNoise > 0.78) {
    return detailNoise > 0.6 ? '^' : '░';
  }

  // Forest patches
  if (forestNoise > 0.70) {
    return detailNoise > 0.5 ? 'T' : 't';
  }

  // Clean ground with subtle variation
  const groundValue = pseudoRandom(x, y, 88);
  if (groundValue < 5) return '*';   // Rare flowers
  if (groundValue < 15) return '\''; // Grass tufts
  if (groundValue < 40) return ',';
  if (groundValue < 65) return '`';
  return '.';
}

function createBaseMap(width: number, height: number, _path: Point[]): string[][] {
  // Generate terrain only - path is rendered via background color
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => generateTerrainTile(x, y))
  );
}

// =============================================================================
// Game Constants
// =============================================================================

const TICK_MS = 200;
const SPAWN_INTERVAL_TICKS = 5;
const WAVE_GAP_TICKS = 12;
const BASE_WAVE_SIZE = 6;
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
  const range = 2 + level;
  const damage = 2 + level;
  const cooldown = Math.max(1, 4 - Math.floor(level / 2));
  const upgradeCost = 15 + level * 10;
  return { range, damage, cooldown, upgradeCost };
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

// =============================================================================
// Module-Level Game State (MUST be outside component for proper reactivity)
// =============================================================================

// Initial calculations (done once at module load)
const initialTerminal = getTerminalSize();
const initialSize = getMapSize(initialTerminal.columns, initialTerminal.rows);
const initialPath = buildPath(buildWaypoints(initialSize.width, initialSize.height));

// All signals at module level - this is critical for proper reactivity
const [terminalSize, setTerminalSize] = createSignal(initialTerminal);
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

// =============================================================================
// Game Component
// =============================================================================

function TowerDefense(): VNode {
  const { exit } = useApp();
  const mapRef = useLayoutRef();

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
    });
  }

  function spawnMonster(currentWave: number): Monster {
    const id = nextMonsterId();
    setNextMonsterId(id + 1);
    const maxHp = 6 + currentWave * 2;
    const speed = Math.min(0.8, 0.35 + currentWave * 0.02);
    return {
      id,
      hp: maxHp,
      maxHp,
      pathIndex: 0,
      speed,
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

      if (waveCooldownValue > 0) {
        waveCooldownValue -= 1;
        spawnTimerValue = 0;
      } else {
        spawnTimerValue += 1;
        if (spawnTimerValue >= SPAWN_INTERVAL_TICKS && spawnsRemainingValue > 0) {
          spawnTimerValue = 0;
          spawnsRemainingValue -= 1;
          activeMonsters = [...activeMonsters, spawnMonster(currentWave)];
        }
      }

      // Move monsters forward
      const movedMonsters: Monster[] = [];
      let escaped = 0;

      for (const monster of activeMonsters) {
        const nextIndex = monster.pathIndex + monster.speed;
        if (nextIndex >= currentPath.length - 1) {
          escaped += 1;
          continue;
        }
        movedMonsters.push({ ...monster, pathIndex: nextIndex });
      }

      livesValue -= escaped;

      // Move projectiles and apply damage on hit
      const PROJECTILE_SPEED = 0.4; // Progress per tick
      const remainingProjectiles: Projectile[] = [];
      const monstersAfterProjectiles = movedMonsters.map(m => ({ ...m }));

      for (const proj of activeProjectiles) {
        const newProgress = proj.progress + PROJECTILE_SPEED;

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

      // Towers fire new projectiles
      const newProjectiles: Projectile[] = [];
      const updatedTowers = currentTowers.map(tower => {
        const stats = getTowerStats(tower.level);
        let cooldown = Math.max(0, tower.cooldown - 1);

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
          goldEarned += 4 + Math.floor(currentWave / 2);
        }
      }

      goldValue += goldEarned;

      if (spawnsRemainingValue === 0 && survivingMonsters.length === 0 && activeProjectiles.length === 0) {
        currentWave += 1;
        spawnsRemainingValue = BASE_WAVE_SIZE + (currentWave - 1) * 2;
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

  // Game loop using useInterval (runs when not paused and not game over)
  useInterval(
    () => tickGame(),
    TICK_MS,
    { enabled: !paused() && !gameOver() }
  );

  // Manual tick for debugging - press T
  useHotkeys('t', () => tickGame());

  useMouse((event) => {
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
  useHotkeys('r', () => resetGame());
  useHotkeys('space', () => {
    const nextPaused = !paused();
    setPaused(nextPaused);
    setMessage(nextPaused ? 'Paused.' : 'Resumed.');
  });

  // Movement (only when not game over)
  useHotkeys('up', () => {
    if (!gameOver()) setCursor(pos => ({ x: pos.x, y: clamp(pos.y - 1, 0, mapHeight() - 1) }));
  });
  useHotkeys('w', () => {
    if (!gameOver()) setCursor(pos => ({ x: pos.x, y: clamp(pos.y - 1, 0, mapHeight() - 1) }));
  });
  useHotkeys('down', () => {
    if (!gameOver()) setCursor(pos => ({ x: pos.x, y: clamp(pos.y + 1, 0, mapHeight() - 1) }));
  });
  useHotkeys('s', () => {
    if (!gameOver()) setCursor(pos => ({ x: pos.x, y: clamp(pos.y + 1, 0, mapHeight() - 1) }));
  });
  useHotkeys('left', () => {
    if (!gameOver()) setCursor(pos => ({ x: clamp(pos.x - 1, 0, mapWidth() - 1), y: pos.y }));
  });
  useHotkeys('a', () => {
    if (!gameOver()) setCursor(pos => ({ x: clamp(pos.x - 1, 0, mapWidth() - 1), y: pos.y }));
  });
  useHotkeys('right', () => {
    if (!gameOver()) setCursor(pos => ({ x: clamp(pos.x + 1, 0, mapWidth() - 1), y: pos.y }));
  });
  useHotkeys('d', () => {
    if (!gameOver()) setCursor(pos => ({ x: clamp(pos.x + 1, 0, mapWidth() - 1), y: pos.y }));
  });

  // Actions
  useHotkeys('b', () => {
    if (!gameOver()) {
      const { x, y } = cursor();
      buildAt(x, y);
    }
  });
  useHotkeys('u', () => {
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
    for (const monster of monsters()) {
      const pos = getMonsterPosition(monster, currentPath);
      const key = `${pos.x},${pos.y}`;
      monsterCounts.set(key, (monsterCounts.get(key) ?? 0) + 1);
    }

    const rows: VNode[] = [];

    for (let y = 0; y < height; y++) {
      const cells: VNode[] = [];
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
          ch = '*';
          color = 'warning';
          bold = true;
          dim = false;
        }

        // Monster overrides (highest priority after cursor)
        if (monsterCount > 0) {
          ch = monsterCount > 9 ? 'M' : String(monsterCount);
          color = 'error';
          bold = true;
          dim = false;
        }

        // Cursor highlight (highest priority)
        const isCursor = cursorPos.x === x && cursorPos.y === y;
        if (isCursor) {
          backgroundColor = 'secondary';
        }

        cells.push(Text({ color, backgroundColor, bold, dim }, ch));
      }
      rows.push(Box({ flexDirection: 'row' }, ...cells));
    }

    return Box({ flexDirection: 'column', width, height, layoutRef: mapRef }, ...rows);
  };

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

  return Box(
    { flexDirection: 'column' },
    Text({ bold: true, color: 'primary' }, 'Tower Defense'),
    Box(
      { flexDirection: 'column', gap: MAP_INFO_GAP, padding: OUTER_PADDING },
      Panel(
        { title: 'Battlefield', padding: MAP_PANEL_PADDING, width: 'fill' },
        mapView()
      ),
      Box(
        { flexDirection: 'row', gap: 1, width: 'fill' },
        Panel(
          { title: 'Status', flexGrow: 1 },
          Text({}, `Gold:${gold()} Lives:${lives()} Wave:${wave()}`),
          waveCooldown() > 0
            ? Text({ color: 'mutedForeground' }, `Next: ${waveCooldown()}t`)
            : Text({ color: 'mutedForeground' }, `Spawns: ${spawnsRemaining()}`),
          paused()
            ? Text({ color: 'warning' }, 'PAUSED')
            : gameOver()
              ? Text({ color: 'error' }, 'GAME OVER')
              : Text({ color: 'success' }, `Defending (${monsters().length})`),
          Text({ dim: true }, message())
        ),
        Panel(
          { title: `Tile (${cursorPos.x},${cursorPos.y})`, flexGrow: 1 },
          Text({}, tileLabel),
          towerHere
            ? (() => {
                const stats = getTowerStats(towerHere.level);
                const ready = towerHere.cooldown === 0;
                return Box(
                  { flexDirection: 'column' },
                  Text({ color: 'accent', bold: true }, `Tower Lv${towerHere.level}`),
                  Text({}, `Dmg:${stats.damage} Rng:${stats.range} ${ready ? 'Ready' : `CD:${towerHere.cooldown}`}`),
                  Text({ dim: true }, `Upgrade: ${stats.upgradeCost}g`)
                );
              })()
            : buildCheck.ok
              ? Text({ color: 'success' }, `Build 2x2 (${BUILD_COST}g)`)
              : Text({ color: 'mutedForeground' }, buildCheck.reason)
        ),
        Panel(
          { title: 'Keys', flexGrow: 1 },
          Text({}, 'Arrows Move  B Build  U Upgrade'),
          Text({}, 'Space Pause  R Reset  Q Quit'),
          Text({ dim: true }, 'Mouse: 2xClick=build R=upgrade')
        )
      )
    )
  );
}

const { waitUntilExit } = render(TowerDefense);
await waitUntilExit();
