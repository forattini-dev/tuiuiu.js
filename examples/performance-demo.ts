/**
 * Performance APIs Demo
 *
 * Demonstrates the performance primitives:
 * - Computed: auto-tracking reactive isolation
 * - ComputedText: shorthand for reactive text
 * - Memo: cache subtrees by deps
 * - PreText: pre-built ANSI passthrough
 * - onCleanup: ergonomic effect cleanup
 * - createReactiveStore: per-property reactive store
 *
 * Run: pnpm tsx examples/performance-demo.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useHotkeys,
  useApp,
  useInterval,
  useFps,
  setTheme,
  darkTheme,
  Computed,
  ComputedText,
  Memo,
  PreText,
  onCleanup,
  createEffect,
  createReactiveStore,
  createSignal,
} from '../src/index.js';
import type { VNode } from '../src/utils/types.js';

setTheme(darkTheme);

// =============================================================================
// Reactive store with per-property tracking
// =============================================================================

const store = createReactiveStore({
  score: 0,
  combo: 1,
  playerName: 'Player 1',
  settings: { speed: 1, difficulty: 'normal' },
});

// =============================================================================
// Pre-built ANSI map (simulates a game board)
// =============================================================================

const ESC = '\u001B[';
const RESET = `${ESC}0m`;

function buildMapRow(y: number, width: number, highlights: number[]): string {
  let row = '';
  for (let x = 0; x < width; x++) {
    if (highlights.includes(x)) {
      row += `${ESC}33;1m*${RESET}`;  // yellow bold
    } else if ((x + y) % 7 === 0) {
      row += `${ESC}32mt${RESET}`;     // green tree
    } else if ((x + y) % 11 === 0) {
      row += `${ESC}34m~${RESET}`;     // blue water
    } else {
      row += `${ESC}2m.${RESET}`;      // dim ground
    }
  }
  return row;
}

// =============================================================================
// Main App
// =============================================================================

function PerformanceDemo(): VNode {
  const { exit } = useApp();
  const [tick, setTick] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const { fps, color: fpsColor } = useFps();

  // Track how many times each section evaluates
  const [headerEvals, setHeaderEvals] = useState(0);
  const [mapEvals, setMapEvals] = useState(0);
  const [statsEvals, setStatsEvals] = useState(0);

  // Game loop — only advances tick
  useInterval(() => {
    setTick(t => t + 1);
    store.score += 10 * store.combo;
  }, 500);

  // Hotkeys
  useHotkeys('q', () => exit());
  useHotkeys('1', () => setSelectedTab(0));
  useHotkeys('2', () => setSelectedTab(1));
  useHotkeys('up', () => { store.combo = Math.min(store.combo + 1, 10); });
  useHotkeys('down', () => { store.combo = Math.max(store.combo - 1, 1); });

  // onCleanup demo: log when component unmounts
  const dispose = createEffect(() => {
    const t = tick();
    onCleanup(() => {
      // This runs every time tick changes (cleanup previous)
    });
  });

  const mapWidth = 50;
  const mapHeight = 8;

  return Box(
    { flexDirection: 'column', padding: 1, width: 'fill', height: 'fill' },

    // ─── Header: uses Computed — only re-evals when fps changes ───
    Computed(() => {
      setHeaderEvals(n => n + 1);
      return Box(
        { flexDirection: 'row', gap: 2, width: 'fill', backgroundColor: 'muted', paddingX: 1 },
        Text({ bold: true, color: 'primary' }, 'Performance Demo'),
        Text({ color: fpsColor, dim: true }, `${fps}fps`),
        Text({ dim: true }, `Tab: ${selectedTab() + 1}`),
        Text({ dim: true }, `Header evals: ${headerEvals()}`),
      );
    }),

    Box({ height: 1 }),

    // ─── Stats panel: ComputedText items are independent hooks (not nested) ───
    Box(
      { flexDirection: 'row', gap: 3, paddingX: 1 },
      ComputedText(() => `Score: ${store.score}`, { color: 'warning', bold: true }),
      ComputedText(() => `Combo: x${store.combo}`, { color: 'success' }),
      ComputedText(() => `Player: ${store.playerName}`, { color: 'foreground' }),
      Text({ dim: true }, `Stats evals: ${statsEvals()}`),
    ),

    Box({ height: 1 }),

    // ─── Map: uses Memo — only rebuilds when tick changes (deps explicit) ───
    Memo([tick()], () => {
      setMapEvals(n => n + 1);
      const highlights = [tick() % mapWidth, (tick() * 3) % mapWidth, (tick() * 7) % mapWidth];
      return Box(
        { flexDirection: 'column', borderStyle: 'round', borderColor: 'muted' },
        // PreText: pre-built ANSI rows — renderer skips encoding
        ...Array.from({ length: mapHeight }, (_, y) =>
          PreText(buildMapRow(y, mapWidth, y === tick() % mapHeight ? highlights : []))
        ),
        Text({ dim: true }, `  Map evals: ${mapEvals()}  (rebuilds every tick)`),
      );
    }),

    Box({ height: 1 }),

    // ─── Static footer: Memo([], ...) — NEVER rebuilds ───
    Memo([], () =>
      Box(
        { flexDirection: 'column', paddingX: 1 },
        Text({ dim: true }, '1/2: switch tab  ↑/↓: combo  Q: quit'),
        Text({ dim: true }, 'Computed: auto-tracks signals | Memo: caches by deps | PreText: raw ANSI'),
      )
    ),
  );
}

const { waitUntilExit } = render(PerformanceDemo, { maxFps: 30 });
await waitUntilExit();
