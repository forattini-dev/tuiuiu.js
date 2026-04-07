/**
 * Defence Game: Computed vs Full Re-eval Comparison
 *
 * Simulates the tuiuiu-defence rendering pipeline both ways:
 * 1. Original: entire TowerDefense() re-runs on every signal change
 * 2. Optimized: uses Computed() for independent UI regions
 *
 * Measures the actual VNode construction cost difference.
 */
import { describe, it, expect } from 'vitest';
import {
  createSignal,
  batch,
  Box,
  Text,
  Panel,
  createEffect,
} from '../../src/index.js';
import {
  Computed,
  ComputedText,
  refreshReactiveVNode,
  isReactiveVNode,
  type ReactiveVNode,
} from '../../src/primitives/computed-node.js';
import type { VNode } from '../../src/utils/types.js';

// =============================================================================
// Simulate Defence game state (simplified but realistic signal count)
// =============================================================================

function createDefenceState() {
  const [gold, setGold] = createSignal(60);
  const [lives, setLives] = createSignal(18);
  const [wave, setWave] = createSignal(1);
  const [spawnsRemaining, setSpawnsRemaining] = createSignal(12);
  const [waveCooldown, setWaveCooldown] = createSignal(0);
  const [cursor, setCursor] = createSignal({ x: 5, y: 5 });
  const [paused, setPaused] = createSignal(false);
  const [gameOver, setGameOver] = createSignal(false);
  const [message, setMessage] = createSignal('Build towers to stop the monsters.');
  const [monsters, setMonsters] = createSignal<{ id: number; hp: number; x: number; y: number }[]>([]);
  const [towers, setTowers] = createSignal<{ id: number; x: number; y: number; level: number }[]>([]);
  const [projectiles, setProjectiles] = createSignal<{ id: number; x: number; y: number }[]>([]);
  const [gameSpeed, setGameSpeed] = createSignal(1);
  const [screen, setScreen] = createSignal<'menu' | 'game'>('game');

  return {
    gold, setGold, lives, setLives, wave, setWave,
    spawnsRemaining, setSpawnsRemaining, waveCooldown, setWaveCooldown,
    cursor, setCursor, paused, setPaused, gameOver, setGameOver,
    message, setMessage, monsters, setMonsters, towers, setTowers,
    projectiles, setProjectiles, gameSpeed, setGameSpeed, screen, setScreen,
  };
}

// =============================================================================
// Simulate map rendering (the heavy part)
// =============================================================================

function renderMapRows(
  width: number,
  height: number,
  monsters: { id: number; hp: number; x: number; y: number }[],
  towers: { id: number; x: number; y: number; level: number }[],
  projectiles: { id: number; x: number; y: number }[],
  cursorPos: { x: number; y: number },
): VNode[] {
  const rows: VNode[] = [];
  for (let y = 0; y < height; y++) {
    let rowText = '';
    for (let x = 0; x < width; x++) {
      const monster = monsters.find(m => m.x === x && m.y === y);
      const tower = towers.find(t => t.x === x && t.y === y);
      const proj = projectiles.find(p => p.x === x && p.y === y);
      const isCursor = cursorPos.x === x && cursorPos.y === y;

      if (isCursor) rowText += 'X';
      else if (monster) rowText += String(Math.min(monster.hp, 9));
      else if (tower) rowText += String(tower.level);
      else if (proj) rowText += 'o';
      else rowText += '.';
    }
    rows.push(Text({}, rowText));
  }
  return rows;
}

// =============================================================================
// ORIGINAL approach: everything in one component function
// =============================================================================

function buildOriginalDefenceFrame(state: ReturnType<typeof createDefenceState>): VNode {
  const {
    gold, lives, wave, spawnsRemaining, waveCooldown,
    cursor, paused, gameOver, message, monsters, towers,
    projectiles, gameSpeed, screen,
  } = state;

  if (screen() === 'menu') {
    return Box({ flexDirection: 'column' },
      Text({ bold: true }, 'Tuiuiu Defence'),
      Text({}, 'New Game'),
      Text({}, 'Exit'),
    );
  }

  const width = 60;
  const height = 20;
  const cursorPos = cursor();
  const monsterList = monsters();
  const towerList = towers();
  const projectileList = projectiles();
  const spawnInfo = waveCooldown() > 0
    ? `Next:${waveCooldown()}t`
    : `Spawns:${spawnsRemaining()}`;
  const stateLabel = paused() ? 'PAUSED' : gameOver() ? 'GAME OVER' : `Defending (${monsterList.length})`;

  return Box(
    { flexDirection: 'column', width: 'fill', height: 'fill' },
    // Top bar (reads: gold, lives, wave, spawns, gameSpeed, fps)
    Box(
      { flexDirection: 'row', gap: 2, width: 'fill' },
      Text({ bold: true }, 'Tuiuiu Defence'),
      Text({ color: 'warning', bold: true }, `Gold:${gold()}`),
      Text({}, `Lives:${lives()}`),
      Text({}, `Wave:${wave()}`),
      Text({}, spawnInfo),
      Text({}, `${gameSpeed()}x`),
    ),
    // Map (reads: monsters, towers, projectiles, cursor — HEAVY)
    Box(
      { flexDirection: 'column', width, height },
      ...renderMapRows(width, height, monsterList, towerList, projectileList, cursorPos),
    ),
    // Bottom bar (reads: cursor, message, paused, gameOver)
    Box(
      { flexDirection: 'row', gap: 2, width: 'fill' },
      Text({}, `Tile(${cursorPos.x},${cursorPos.y})`),
      Text({ bold: true }, stateLabel),
      Text({ dim: true }, message()),
    ),
  );
}

// =============================================================================
// OPTIMIZED approach: Computed() for independent regions
// =============================================================================

function buildComputedDefenceFrame(state: ReturnType<typeof createDefenceState>) {
  const {
    gold, lives, wave, spawnsRemaining, waveCooldown,
    cursor, paused, gameOver, message, monsters, towers,
    projectiles, gameSpeed, screen,
  } = state;

  const width = 60;
  const height = 20;

  // Top bar — only re-evaluates when gold/lives/wave/spawns/speed change
  const topBar = Computed(() => {
    const spawnInfo = waveCooldown() > 0
      ? `Next:${waveCooldown()}t`
      : `Spawns:${spawnsRemaining()}`;
    return Box(
      { flexDirection: 'row', gap: 2, width: 'fill' },
      Text({ bold: true }, 'Tuiuiu Defence'),
      Text({ color: 'warning', bold: true }, `Gold:${gold()}`),
      Text({}, `Lives:${lives()}`),
      Text({}, `Wave:${wave()}`),
      Text({}, spawnInfo),
      Text({}, `${gameSpeed()}x`),
    );
  }) as ReactiveVNode;

  // Map — only re-evaluates when monsters/towers/projectiles/cursor change
  const mapNode = Computed(() => {
    const cursorPos = cursor();
    const monsterList = monsters();
    const towerList = towers();
    const projectileList = projectiles();
    return Box(
      { flexDirection: 'column', width, height },
      ...renderMapRows(width, height, monsterList, towerList, projectileList, cursorPos),
    );
  }) as ReactiveVNode;

  // Bottom bar — only re-evaluates when cursor/paused/gameOver/message change
  const bottomBar = Computed(() => {
    const cursorPos = cursor();
    const monsterList = monsters();
    const stateLabel = paused() ? 'PAUSED' : gameOver() ? 'GAME OVER' : `Defending (${monsterList.length})`;
    return Box(
      { flexDirection: 'row', gap: 2, width: 'fill' },
      Text({}, `Tile(${cursorPos.x},${cursorPos.y})`),
      Text({ bold: true }, stateLabel),
      Text({ dim: true }, message()),
    );
  }) as ReactiveVNode;

  return { topBar, mapNode, bottomBar };
}

// =============================================================================
// Benchmarks
// =============================================================================

function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

describe('Defence Game: Original vs Computed', () => {
  it('measures full frame rebuild cost (original)', () => {
    const state = createDefenceState();
    // Add some game entities
    state.setMonsters(Array.from({ length: 15 }, (_, i) => ({
      id: i, hp: 10 - (i % 5), x: 5 + (i % 10), y: 3 + Math.floor(i / 5),
    })));
    state.setTowers(Array.from({ length: 6 }, (_, i) => ({
      id: i, x: 10 + i * 8, y: 8, level: 1 + (i % 3),
    })));
    state.setProjectiles(Array.from({ length: 4 }, (_, i) => ({
      id: i, x: 15 + i * 5, y: 5,
    })));

    // Warmup
    for (let i = 0; i < 100; i++) buildOriginalDefenceFrame(state);

    const ITERATIONS = 5000;
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      buildOriginalDefenceFrame(state);
      times.push(performance.now() - start);
    }

    const avg = average(times);
    const p99 = times.sort((a, b) => a - b)[Math.floor(ITERATIONS * 0.99)];
    console.log(`  Original full rebuild: avg=${avg.toFixed(4)}ms, p99=${p99.toFixed(4)}ms`);
    console.log(`  Throughput: ${(1 / avg * 1000).toFixed(0)} frames/sec`);
  });

  it('measures cursor-only update cost (Computed approach)', () => {
    const state = createDefenceState();
    state.setMonsters(Array.from({ length: 15 }, (_, i) => ({
      id: i, hp: 10 - (i % 5), x: 5 + (i % 10), y: 3 + Math.floor(i / 5),
    })));
    state.setTowers(Array.from({ length: 6 }, (_, i) => ({
      id: i, x: 10 + i * 8, y: 8, level: 1 + (i % 3),
    })));
    state.setProjectiles(Array.from({ length: 4 }, (_, i) => ({
      id: i, x: 15 + i * 5, y: 5,
    })));

    const { topBar, mapNode, bottomBar } = buildComputedDefenceFrame(state);

    // Warmup
    for (let i = 0; i < 100; i++) {
      state.setCursor({ x: i % 60, y: i % 20 });
      refreshReactiveVNode(mapNode);
      refreshReactiveVNode(bottomBar);
    }

    const ITERATIONS = 5000;

    // Scenario: cursor moves (common user action)
    // Only mapNode and bottomBar need refresh, topBar stays the same
    const cursorTimes: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      state.setCursor({ x: i % 60, y: i % 20 });
      const start = performance.now();
      refreshReactiveVNode(mapNode);     // map changes (cursor moved)
      refreshReactiveVNode(bottomBar);   // bottom bar changes (cursor pos)
      // topBar NOT refreshed — cursor doesn't affect it
      cursorTimes.push(performance.now() - start);
    }

    const avgCursor = average(cursorTimes);
    const p99Cursor = cursorTimes.sort((a, b) => a - b)[Math.floor(ITERATIONS * 0.99)];
    console.log(`  Computed cursor-move: avg=${avgCursor.toFixed(4)}ms, p99=${p99Cursor.toFixed(4)}ms`);
    console.log(`  Throughput: ${(1 / avgCursor * 1000).toFixed(0)} frames/sec`);
  });

  it('measures gold-only update cost (Computed approach)', () => {
    const state = createDefenceState();
    state.setMonsters(Array.from({ length: 15 }, (_, i) => ({
      id: i, hp: 10 - (i % 5), x: 5 + (i % 10), y: 3 + Math.floor(i / 5),
    })));
    state.setTowers(Array.from({ length: 6 }, (_, i) => ({
      id: i, x: 10 + i * 8, y: 8, level: 1 + (i % 3),
    })));

    const { topBar, mapNode, bottomBar } = buildComputedDefenceFrame(state);

    // Warmup
    for (let i = 0; i < 100; i++) {
      state.setGold(g => g + 1);
      refreshReactiveVNode(topBar);
    }

    const ITERATIONS = 5000;

    // Scenario: gold changes (monster killed)
    // Only topBar needs refresh, map and bottomBar stay the same
    const goldTimes: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      state.setGold(g => g + 1);
      const start = performance.now();
      refreshReactiveVNode(topBar); // only top bar changes
      // mapNode and bottomBar NOT refreshed — gold doesn't affect them
      goldTimes.push(performance.now() - start);
    }

    const avgGold = average(goldTimes);
    const p99Gold = goldTimes.sort((a, b) => a - b)[Math.floor(ITERATIONS * 0.99)];
    console.log(`  Computed gold-change: avg=${avgGold.toFixed(4)}ms, p99=${p99Gold.toFixed(4)}ms`);
    console.log(`  Throughput: ${(1 / avgGold * 1000).toFixed(0)} frames/sec`);
  });

  it('compares tick simulation: original vs computed', () => {
    const ITERATIONS = 2000;

    // === ORIGINAL: full rebuild on every tick ===
    const origState = createDefenceState();
    origState.setMonsters(Array.from({ length: 15 }, (_, i) => ({
      id: i, hp: 10, x: 5 + i, y: 5,
    })));
    origState.setTowers(Array.from({ length: 6 }, (_, i) => ({
      id: i, x: 10 + i * 8, y: 8, level: 2,
    })));
    origState.setProjectiles(Array.from({ length: 4 }, (_, i) => ({
      id: i, x: 15 + i * 5, y: 5,
    })));

    // Warmup
    for (let i = 0; i < 100; i++) {
      origState.setMonsters(ms => ms.map(m => ({ ...m, x: m.x + 1 > 59 ? 5 : m.x + 1 })));
      buildOriginalDefenceFrame(origState);
    }

    const origTimes: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      // Simulate tick: move monsters
      origState.setMonsters(ms => ms.map(m => ({ ...m, x: (m.x + 1) % 60 })));
      const start = performance.now();
      buildOriginalDefenceFrame(origState);
      origTimes.push(performance.now() - start);
    }

    // === COMPUTED: selective refresh on tick ===
    const compState = createDefenceState();
    compState.setMonsters(Array.from({ length: 15 }, (_, i) => ({
      id: i, hp: 10, x: 5 + i, y: 5,
    })));
    compState.setTowers(Array.from({ length: 6 }, (_, i) => ({
      id: i, x: 10 + i * 8, y: 8, level: 2,
    })));
    compState.setProjectiles(Array.from({ length: 4 }, (_, i) => ({
      id: i, x: 15 + i * 5, y: 5,
    })));

    const { topBar, mapNode, bottomBar } = buildComputedDefenceFrame(compState);

    // Warmup
    for (let i = 0; i < 100; i++) {
      compState.setMonsters(ms => ms.map(m => ({ ...m, x: m.x + 1 > 59 ? 5 : m.x + 1 })));
      refreshReactiveVNode(mapNode);
    }

    const compTimes: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      // Simulate tick: move monsters
      compState.setMonsters(ms => ms.map(m => ({ ...m, x: (m.x + 1) % 60 })));
      const start = performance.now();
      // Only map changes during a tick (monsters moved)
      // Top bar might change too (monster count in stateLabel) but bottom bar does
      refreshReactiveVNode(mapNode);
      refreshReactiveVNode(bottomBar);
      // topBar NOT refreshed unless gold/lives/wave changed
      compTimes.push(performance.now() - start);
    }

    const origAvg = average(origTimes);
    const compAvg = average(compTimes);
    const origP99 = origTimes.sort((a, b) => a - b)[Math.floor(ITERATIONS * 0.99)];
    const compP99 = compTimes.sort((a, b) => a - b)[Math.floor(ITERATIONS * 0.99)];
    const speedup = origAvg / compAvg;

    console.log('');
    console.log('  ┌────────────────────────────────────────────────┐');
    console.log('  │  Defence Game: Tick Simulation Comparison       │');
    console.log('  ├────────────────────────────────────────────────┤');
    console.log(`  │  Original (full rebuild)                        │`);
    console.log(`  │    avg: ${origAvg.toFixed(4)}ms  p99: ${origP99.toFixed(4)}ms          │`);
    console.log(`  │    ${(1 / origAvg * 1000).toFixed(0)} frames/sec                            │`);
    console.log('  ├────────────────────────────────────────────────┤');
    console.log(`  │  Computed (selective refresh)                   │`);
    console.log(`  │    avg: ${compAvg.toFixed(4)}ms  p99: ${compP99.toFixed(4)}ms          │`);
    console.log(`  │    ${(1 / compAvg * 1000).toFixed(0)} frames/sec                            │`);
    console.log('  ├────────────────────────────────────────────────┤');
    console.log(`  │  Speedup: ${speedup.toFixed(1)}x faster with Computed          │`);
    console.log('  └────────────────────────────────────────────────┘');
    console.log('');

    // Computed should be competitive (skips topBar rebuild) — allow 20% tolerance for CI variance
    expect(compAvg).toBeLessThan(origAvg * 1.2);
    expect(speedup).toBeGreaterThan(0.8);
  });

  it('shows the isolation benefit: gold change skips map entirely', () => {
    const state = createDefenceState();
    state.setMonsters(Array.from({ length: 15 }, (_, i) => ({
      id: i, hp: 10, x: 5 + i, y: 5,
    })));

    // Build the original frame (baseline)
    const origTimes: number[] = [];
    for (let i = 0; i < 2000; i++) {
      state.setGold(g => g + 1);
      const start = performance.now();
      buildOriginalDefenceFrame(state); // rebuilds EVERYTHING including map
      origTimes.push(performance.now() - start);
    }

    // Build computed frame
    const { topBar } = buildComputedDefenceFrame(state);
    const compTimes: number[] = [];
    for (let i = 0; i < 2000; i++) {
      state.setGold(g => g + 1);
      const start = performance.now();
      refreshReactiveVNode(topBar); // ONLY rebuilds the top bar text
      compTimes.push(performance.now() - start);
    }

    const origAvg = average(origTimes);
    const compAvg = average(compTimes);
    const speedup = origAvg / compAvg;

    console.log(`  Gold-only update comparison:`);
    console.log(`    Original (full): ${origAvg.toFixed(4)}ms avg (rebuilds 60x20 map!)`);
    console.log(`    Computed (top bar only): ${compAvg.toFixed(4)}ms avg`);
    console.log(`    Speedup: ${speedup.toFixed(1)}x faster`);

    expect(speedup).toBeGreaterThan(3);
  });
});
