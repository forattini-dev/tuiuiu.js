/**
 * Real Render Pipeline Comparison
 *
 * Runs actual render() with mock stdin/stdout, simulates game-like
 * signal updates, and measures real frame times through the full pipeline:
 * VNode eval → layout → draw commands → delta render → stdout.write
 *
 * Compares:
 * - Original: everything in one component, no Computed/Memo
 * - Optimized: uses Computed/Memo to skip unchanged subtrees
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  render,
  Box,
  Text,
  createSignal,
  batch,
  setTheme,
  darkTheme,
} from '../../src/index.js';
import { Computed, ComputedText, Memo, PreText } from '../../src/primitives/computed-node.js';
import {
  createBenchmarkStdin,
  createBenchmarkStdout,
  waitForMacrotask,
} from './_shared/runtime-benchmark.js';

setTheme(darkTheme);

// =============================================================================
// Simulated game state (like defence: many signals, big map)
// =============================================================================

function createGameSignals() {
  const [gold, setGold] = createSignal(60);
  const [lives, setLives] = createSignal(18);
  const [wave, setWave] = createSignal(1);
  const [message, setMessage] = createSignal('Ready.');
  const [cursor, setCursor] = createSignal({ x: 5, y: 5 });
  const [paused, setPaused] = createSignal(false);
  const [gameSpeed, setGameSpeed] = createSignal(1);
  const [monsters, setMonsters] = createSignal(
    Array.from({ length: 20 }, (_, i) => ({
      id: i, hp: 10, x: 3 + (i % 15), y: 2 + Math.floor(i / 5),
    }))
  );
  const [towers, setTowers] = createSignal(
    Array.from({ length: 8 }, (_, i) => ({
      id: i, x: 10 + i * 6, y: 8, level: 1 + (i % 3),
    }))
  );

  return {
    gold, setGold, lives, setLives, wave, setWave,
    message, setMessage, cursor, setCursor, paused, setPaused,
    gameSpeed, setGameSpeed, monsters, setMonsters, towers, setTowers,
  };
}

// Build a map-like grid (60x20 = 1200 cells)
function buildMapRows(
  width: number,
  height: number,
  monsters: { x: number; y: number; hp: number }[],
  towers: { x: number; y: number; level: number }[],
  cursorPos: { x: number; y: number },
): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const m = monsters.find(m => m.x === x && m.y === y);
      const t = towers.find(t => t.x === x && t.y === y);
      if (cursorPos.x === x && cursorPos.y === y) row += 'X';
      else if (m) row += String(Math.min(m.hp, 9));
      else if (t) row += String(t.level);
      else row += '.';
    }
    rows.push(row);
  }
  return rows;
}

// =============================================================================
// Test helpers
// =============================================================================

const WIDTH = 120;
const HEIGHT = 40;

function createTestIO() {
  const stdin = createBenchmarkStdin();
  const stdout = createBenchmarkStdout(WIDTH, HEIGHT);
  return { stdin, stdout };
}

// =============================================================================
// Tests
// =============================================================================

describe('Real Render Pipeline: Original vs Optimized', () => {
  it('Original: full component re-eval on cursor move', async () => {
    const state = createGameSignals();
    const { stdin, stdout } = createTestIO();
    const mapW = 60, mapH = 20;
    let renderCount = 0;

    function GameOriginal() {
      renderCount++;
      const g = state.gold();
      const l = state.lives();
      const w = state.wave();
      const spd = state.gameSpeed();
      const msg = state.message();
      const cur = state.cursor();
      const mons = state.monsters();
      const tows = state.towers();
      const p = state.paused();
      const stateLabel = p ? 'PAUSED' : `Defending (${mons.length})`;

      const mapRows = buildMapRows(mapW, mapH, mons, tows, cur);

      return Box(
        { flexDirection: 'column', width: 'fill', height: 'fill' },
        Box({ flexDirection: 'row', gap: 2, width: 'fill' },
          Text({ bold: true }, 'Defence'),
          Text({}, `Gold:${g}`),
          Text({}, `Lives:${l}`),
          Text({}, `Wave:${w}`),
          Text({}, `${spd}x`),
        ),
        Box({ flexDirection: 'column' },
          ...mapRows.map(row => Text({}, row)),
        ),
        Box({ flexDirection: 'row', gap: 2, width: 'fill' },
          Text({}, `Tile(${cur.x},${cur.y})`),
          Text({ bold: true }, stateLabel),
          Text({ dim: true }, msg),
        ),
      );
    }

    const instance = render(GameOriginal, {
      stdin, stdout, screen: 'inline', showHardwareCursor: true, maxFps: 0,
    });

    await waitForMacrotask();
    const initialRenders = renderCount;

    // Simulate 50 cursor moves
    const start = performance.now();
    for (let i = 0; i < 50; i++) {
      state.setCursor({ x: i % mapW, y: i % mapH });
      await waitForMacrotask();
    }
    const elapsed = performance.now() - start;
    const totalRenders = renderCount - initialRenders;

    instance.unmount();

    console.log(`  Original: ${totalRenders} renders in ${elapsed.toFixed(1)}ms (${(elapsed / totalRenders).toFixed(2)}ms/render)`);
    expect(totalRenders).toBeGreaterThanOrEqual(40);
  });

  it('Optimized: Computed isolates top bar, map, bottom bar', async () => {
    const state = createGameSignals();
    const { stdin, stdout } = createTestIO();
    const mapW = 60, mapH = 20;
    let renderCount = 0;
    let topBarEvals = 0;
    let mapEvals = 0;
    let bottomBarEvals = 0;

    function GameOptimized() {
      renderCount++;

      return Box(
        { flexDirection: 'column', width: 'fill', height: 'fill' },
        // Top bar: only re-evals when gold/lives/wave/speed change
        Computed(() => {
          topBarEvals++;
          const g = state.gold();
          const l = state.lives();
          const w = state.wave();
          const spd = state.gameSpeed();
          return Box({ flexDirection: 'row', gap: 2, width: 'fill' },
            Text({ bold: true }, 'Defence'),
            Text({}, `Gold:${g}`),
            Text({}, `Lives:${l}`),
            Text({}, `Wave:${w}`),
            Text({}, `${spd}x`),
          );
        }),
        // Map: only re-evals when monsters/towers/cursor change
        Computed(() => {
          mapEvals++;
          const cur = state.cursor();
          const mons = state.monsters();
          const tows = state.towers();
          const mapRows = buildMapRows(mapW, mapH, mons, tows, cur);
          return Box({ flexDirection: 'column' },
            ...mapRows.map(row => Text({}, row)),
          );
        }),
        // Bottom bar: only re-evals when cursor/paused/message change
        Computed(() => {
          bottomBarEvals++;
          const cur = state.cursor();
          const mons = state.monsters();
          const p = state.paused();
          const msg = state.message();
          const stateLabel = p ? 'PAUSED' : `Defending (${mons.length})`;
          return Box({ flexDirection: 'row', gap: 2, width: 'fill' },
            Text({}, `Tile(${cur.x},${cur.y})`),
            Text({ bold: true }, stateLabel),
            Text({ dim: true }, msg),
          );
        }),
      );
    }

    const instance = render(GameOptimized, {
      stdin, stdout, screen: 'inline', showHardwareCursor: true, maxFps: 0,
    });

    await waitForMacrotask();
    const initTop = topBarEvals;
    const initMap = mapEvals;
    const initBottom = bottomBarEvals;
    const initialRenders = renderCount;

    // Simulate 50 cursor moves
    const start = performance.now();
    for (let i = 0; i < 50; i++) {
      state.setCursor({ x: i % mapW, y: i % mapH });
      await waitForMacrotask();
    }
    const elapsed = performance.now() - start;
    const totalRenders = renderCount - initialRenders;
    const topBarReEvals = topBarEvals - initTop;
    const mapReEvals = mapEvals - initMap;
    const bottomBarReEvals = bottomBarEvals - initBottom;

    instance.unmount();

    console.log(`  Optimized: ${totalRenders} renders in ${elapsed.toFixed(1)}ms (${(elapsed / Math.max(1, totalRenders)).toFixed(2)}ms/render)`);
    console.log(`    Top bar evals: ${topBarReEvals} (should be 0 — gold/lives/wave didn't change)`);
    console.log(`    Map evals: ${mapReEvals} (cursor moved → map rebuilds)`);
    console.log(`    Bottom bar evals: ${bottomBarReEvals} (cursor moved → bottom bar rebuilds)`);

    // KEY ASSERTION: top bar should NOT re-evaluate during cursor moves
    expect(topBarReEvals).toBe(0);
    // Map and bottom bar should re-evaluate (cursor changed)
    expect(mapReEvals).toBeGreaterThan(0);
    expect(bottomBarReEvals).toBeGreaterThan(0);
  });

  it('Optimized: gold change only triggers top bar', async () => {
    const state = createGameSignals();
    const { stdin, stdout } = createTestIO();
    let topBarEvals = 0;
    let mapEvals = 0;
    let bottomBarEvals = 0;

    function GameOptimized() {
      return Box(
        { flexDirection: 'column', width: 'fill', height: 'fill' },
        Computed(() => {
          topBarEvals++;
          return Text({}, `Gold:${state.gold()} Lives:${state.lives()} Wave:${state.wave()}`);
        }),
        Computed(() => {
          mapEvals++;
          const mapRows = buildMapRows(60, 20, state.monsters(), state.towers(), state.cursor());
          return Box({ flexDirection: 'column' },
            ...mapRows.map(row => Text({}, row)),
          );
        }),
        Computed(() => {
          bottomBarEvals++;
          return Text({}, `Tile(${state.cursor().x},${state.cursor().y}) ${state.message()}`);
        }),
      );
    }

    const instance = render(GameOptimized, {
      stdin, stdout, screen: 'inline', showHardwareCursor: true, maxFps: 0,
    });

    await waitForMacrotask();
    const initTop = topBarEvals;
    const initMap = mapEvals;
    const initBottom = bottomBarEvals;

    // 20 gold changes
    for (let i = 0; i < 20; i++) {
      state.setGold(g => g + 5);
      await waitForMacrotask();
    }

    const topReEvals = topBarEvals - initTop;
    const mapReEvals = mapEvals - initMap;
    const bottomReEvals = bottomBarEvals - initBottom;

    instance.unmount();

    console.log(`  Gold-only changes (20 updates):`);
    console.log(`    Top bar evals: ${topReEvals} (gold changed → should re-eval)`);
    console.log(`    Map evals: ${mapReEvals} (should be 0 — monsters/cursor unchanged)`);
    console.log(`    Bottom bar evals: ${bottomReEvals} (should be 0 — cursor/message unchanged)`);

    // KEY: map and bottom bar should NOT re-evaluate
    expect(topReEvals).toBeGreaterThan(0);
    expect(mapReEvals).toBe(0);
    expect(bottomReEvals).toBe(0);
  });

  it('Memo: static footer never rebuilds', async () => {
    const state = createGameSignals();
    const { stdin, stdout } = createTestIO();
    let footerEvals = 0;

    function GameWithMemo() {
      return Box(
        { flexDirection: 'column', width: 'fill', height: 'fill' },
        Text({}, `Gold: ${state.gold()}`),
        // Static footer — empty deps, never rebuilds
        Memo([], () => {
          footerEvals++;
          return Text({ dim: true }, 'WASD: move | B: build | U: upgrade | Q: quit');
        }),
      );
    }

    const instance = render(GameWithMemo, {
      stdin, stdout, screen: 'inline', showHardwareCursor: true, maxFps: 0,
    });

    await waitForMacrotask();
    const initFooter = footerEvals;

    // 30 gold changes → component re-renders 30 times
    for (let i = 0; i < 30; i++) {
      state.setGold(g => g + 1);
      await waitForMacrotask();
    }

    const footerRebuilds = footerEvals - initFooter;
    instance.unmount();

    console.log(`  Memo([], ...): ${footerRebuilds} footer rebuilds after 30 re-renders (should be 0)`);
    expect(footerRebuilds).toBe(0);
  });
});
