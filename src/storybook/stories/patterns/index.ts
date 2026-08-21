/**
 * Patterns Stories
 *
 * Interactive examples of hooks, signals, reactive state, and performance.
 * These teach users HOW to use tuiuiu's reactive primitives.
 */

import {
  Box,
  Text,
} from '../../../index.js';
import { Panel } from '../../../templates/layout.js';
import { PreText } from '../../../primitives/computed-node.js';
import { story, defaultControls } from '../../core/registry.js';
import type { Story } from '../../types.js';

// =============================================================================
// Signals & State
// =============================================================================

const signalStories: Story[] = [
  story('Signal - Basic Counter')
    .category('Guides')
    .description('createSignal creates a reactive [getter, setter] pair. Click the controls to change the value and see the UI update.')
    .source(`const [count, setCount] = createSignal(0);

function App() {
  useShortcut('up', () => setCount(c => c + 1));
  return Text({}, \`Count: \${count()}\`);
}`)
    .controls({
      value: defaultControls.number('Value', 0, { min: -100, max: 100, step: 1 }),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'createSignal'),
        Box(
          { borderStyle: 'round', borderColor: 'border', padding: 1, width: 40 },
          Text({ color: 'warning', bold: true }, `Value: ${props.value}`),
        ),
        Text({ dim: true }, 'Signals are the core reactive primitive.'),
        Text({ dim: true }, 'const [count, setCount] = createSignal(0);'),
        Text({ dim: true }, 'count() reads, setCount(n) writes.'),
      )
    ),

  story('Signal - Derived (createMemo)')
    .category('Guides')
    .description('createMemo derives a value from other signals. Updates automatically when dependencies change.')
    .controls({
      price: defaultControls.number('Price', 100, { min: 0, max: 1000, step: 10 }),
      quantity: defaultControls.number('Quantity', 3, { min: 0, max: 50 }),
      taxRate: defaultControls.range('Tax %', 10, 0, 30, 1),
    })
    .render((props) => {
      const subtotal = props.price * props.quantity;
      const tax = subtotal * (props.taxRate / 100);
      const total = subtotal + tax;

      return Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'createMemo — Derived Values'),
        Panel(
          { title: 'Invoice', padding: 1, width: 35 },
          Text({}, `Price:    $${props.price}`),
          Text({}, `Quantity: ${props.quantity}`),
          Text({}, `Subtotal: $${subtotal}`),
          Text({ dim: true }, `Tax (${props.taxRate}%): $${tax.toFixed(2)}`),
          Text({ bold: true, color: 'success' }, `Total:    $${total.toFixed(2)}`),
        ),
        Text({ dim: true }, 'const total = createMemo(() => price() * qty());'),
      );
    }),

  story('Signal - Batch Updates')
    .category('Guides')
    .description('batch() groups multiple signal updates into one render. Without batch, each set triggers a re-render.')
    .controls({
      x: defaultControls.number('X', 10, { min: 0, max: 100 }),
      y: defaultControls.number('Y', 20, { min: 0, max: 100 }),
      z: defaultControls.number('Z', 30, { min: 0, max: 100 }),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'batch() — Group Updates'),
        Box(
          { flexDirection: 'row', gap: 2 },
          Panel({ title: 'Coords', padding: 1, width: 20 },
            Text({ color: 'error' }, `X: ${props.x}`),
            Text({ color: 'success' }, `Y: ${props.y}`),
            Text({ color: 'primary' }, `Z: ${props.z}`),
          ),
          Box(
            { flexDirection: 'column', gap: 1 },
            Text({ dim: true }, 'batch(() => {'),
            Text({ dim: true }, '  setX(10);'),
            Text({ dim: true }, '  setY(20);'),
            Text({ dim: true }, '  setZ(30);'),
            Text({ dim: true }, '}); // 1 render'),
          ),
        ),
      )
    ),
];

// =============================================================================
// Performance Primitives
// =============================================================================

const performanceStories: Story[] = [
  story('Computed - Reactive Isolation')
    .category('Guides')
    .description('Computed() wraps a VNode subtree. Only re-evaluates when signals it reads change — parent does NOT re-run.')
    .source(`// Only rebuilds when score() changes
Computed(() => Text({ bold: true }, \`Score: \${score()}\`))

// Only rebuilds when lives() changes
Computed(() => Text({}, \`Lives: \${lives()}\`))`)
    .controls({
      score: defaultControls.number('Score', 0, { min: 0, max: 9999, step: 100 }),
      lives: defaultControls.number('Lives', 3, { min: 0, max: 10 }),
      message: defaultControls.text('Message', 'Ready.'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'Computed() — Reactive Isolation'),
        Box(
          { flexDirection: 'column', borderStyle: 'round', borderColor: 'border', padding: 1, width: 50 },
          // Each section would be a Computed in a real app
          Box(
            { flexDirection: 'row', gap: 3, backgroundColor: 'muted', paddingX: 1 },
            Text({ color: 'warning', bold: true }, `Score: ${props.score}`),
            Text({}, `Lives: ${props.lives}`),
          ),
          Text({ dim: true }, '↑ Computed: only re-evals when score/lives change'),
          Box({ height: 1 }),
          Box(
            { height: 3, width: 'fill', backgroundColor: '#1a1a2e' },
            Text({ dim: true }, '  [map area — skipped when only score changes]'),
          ),
          Text({ dim: true }, '↑ Computed: only re-evals when game state changes'),
          Box({ height: 1 }),
          Text({ color: 'foreground' }, props.message),
          Text({ dim: true }, '↑ Computed: only re-evals when message changes'),
        ),
        Text({ dim: true }, 'Computed(() => Text({}, `Score: ${score()}`))'),
      )
    ),

  story('ComputedText - Reactive Labels')
    .category('Guides')
    .description('ComputedText is shorthand for Computed + Text. Each label updates independently.')
    .controls({
      fps: defaultControls.number('FPS', 30, { min: 0, max: 120 }),
      memory: defaultControls.number('Memory MB', 64, { min: 0, max: 512 }),
      connections: defaultControls.number('Connections', 42, { min: 0, max: 1000 }),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'ComputedText — Reactive Labels'),
        Box(
          { flexDirection: 'row', gap: 3 },
          Text({ color: props.fps < 15 ? 'error' : props.fps < 30 ? 'warning' : 'success', bold: true }, `${props.fps} fps`),
          Text({ color: props.memory > 256 ? 'error' : 'foreground' }, `${props.memory} MB`),
          Text({ color: 'primary' }, `${props.connections} conn`),
        ),
        Text({ dim: true }, 'ComputedText(() => `${fps()} fps`, { color: "green" })'),
      )
    ),

  story('Memo - Cached Subtree')
    .category('Guides')
    .description('Memo(deps, fn) caches a VNode subtree. Only rebuilds when deps change. Empty deps = never rebuild.')
    .source(`// Only rebuilds when gold or wave changes
Memo([gold(), wave()], () =>
  Box({}, Text({}, \`Gold: \${gold()}\`))
)

// Never rebuilds (static content)
Memo([], () =>
  Text({ dim: true }, 'WASD: move | Q: quit')
)`)
    .controls({
      goldChanged: defaultControls.boolean('Gold changed?', false),
      mapChanged: defaultControls.boolean('Map changed?', false),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'Memo() — Cached Subtrees'),
        Box(
          { flexDirection: 'column', borderStyle: 'round', borderColor: 'border', padding: 1, width: 50 },
          Box(
            { backgroundColor: props.goldChanged ? '#2a2a1a' : 'muted', paddingX: 1 },
            Text({ color: 'warning', bold: true }, `Gold: 500`),
            Text({ dim: true }, props.goldChanged ? ' ← REBUILT' : ' ← cached'),
          ),
          Box({ height: 1 }),
          Box(
            { height: 3, backgroundColor: props.mapChanged ? '#1a2a1a' : '#1a1a1a', paddingX: 1 },
            Text({ dim: !props.mapChanged }, props.mapChanged ? '  [map rebuilt]' : '  [map cached — 1200 cells skipped]'),
          ),
          Box({ height: 1 }),
          Box(
            { backgroundColor: 'muted', paddingX: 1 },
            Text({ dim: true }, 'Controls: WASD | B: build ← NEVER rebuilds'),
          ),
        ),
        Text({ dim: true }, 'Memo([gold()], () => TopBar())'),
        Text({ dim: true }, 'Memo([monsters()], () => MapView())'),
        Text({ dim: true }, 'Memo([], () => Footer()) // never rebuilds'),
      )
    ),

  story('PreText - Pre-styled SGR')
    .category('Guides')
    .description('PreText parses validated pre-built SGR colors into cells while discarding other terminal controls.')
    .controls({
      width: defaultControls.range('Width', 40, 10, 80),
    })
    .render((props) => {
      const ESC = '\u001B[';
      const RESET = `${ESC}0m`;

      // Build some example ANSI rows
      const rows: string[] = [];
      for (let y = 0; y < 5; y++) {
        let row = '';
        for (let x = 0; x < props.width; x++) {
          if ((x + y) % 7 === 0) {
            row += `${ESC}32mt${RESET}`;     // green tree
          } else if ((x + y) % 11 === 0) {
            row += `${ESC}34m~${RESET}`;     // blue water
          } else if (x === 10 && y === 2) {
            row += `${ESC}33;1m*${RESET}`;   // yellow star
          } else {
            row += `${ESC}2m.${RESET}`;      // dim ground
          }
        }
        rows.push(row);
      }

      return Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'PreText — Pre-styled SGR'),
        Box(
          { flexDirection: 'column', borderStyle: 'round', borderColor: 'border' },
          ...rows.map(row => PreText(row)),
        ),
        Text({ dim: true }, 'PreText(sgrString) — validated styles, structured cells'),
        Text({ dim: true }, 'Use for games that build their own SGR colors'),
      );
    }),
];

// =============================================================================
// Reactive Store
// =============================================================================

const storeStories: Story[] = [
  story('Reactive Store - Per-Property Tracking')
    .category('Guides')
    .description('createReactiveStore provides per-property signals. Each effect only re-runs when the properties it reads change.')
    .controls({
      name: defaultControls.text('Player Name', 'Alice'),
      score: defaultControls.number('Score', 0, { min: 0, max: 9999, step: 50 }),
      theme: defaultControls.select('Theme', ['dark', 'light', 'monokai'], 'dark'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'createReactiveStore — Fine-grained'),
        Panel(
          { title: 'Store State', padding: 1, width: 45 },
          Text({}, `player.name: "${props.name}"`),
          Text({}, `player.score: ${props.score}`),
          Text({}, `settings.theme: "${props.theme}"`),
        ),
        Box(
          { flexDirection: 'column' },
          Text({ dim: true }, 'Effect A reads store.player.score → only re-runs when score changes'),
          Text({ dim: true }, 'Effect B reads store.settings.theme → only re-runs when theme changes'),
          Text({ dim: true }, 'Changing name does NOT trigger A or B'),
        ),
        Text({ dim: true }, 'const store = createReactiveStore({ player: {...}, settings: {...} })'),
      )
    ),
];

// =============================================================================
// Hook Patterns
// =============================================================================

const hookStories: Story[] = [
  story('onCleanup - Effect Cleanup')
    .category('Guides')
    .description('onCleanup() registers cleanup functions inside effects. More ergonomic than returning a cleanup.')
    .controls({
      timerActive: defaultControls.boolean('Timer active', true),
      interval: defaultControls.range('Interval ms', 1000, 100, 5000, 100),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'onCleanup — Ergonomic Cleanup'),
        Panel(
          { title: 'Timer Effect', padding: 1, width: 50 },
          Text({}, `Active: ${props.timerActive ? 'yes' : 'no'}`),
          Text({}, `Interval: ${props.interval}ms`),
          Text({ dim: true }, props.timerActive ? 'Timer running...' : 'Timer stopped — cleanup ran!'),
        ),
        Box(
          { flexDirection: 'column' },
          Text({ dim: true }, 'createEffect(() => {'),
          Text({ dim: true }, '  const id = setInterval(tick, 1000);'),
          Text({ dim: true, color: 'success' }, '  onCleanup(() => clearInterval(id));'),
          Text({ dim: true }, '  const ws = connect(url());'),
          Text({ dim: true, color: 'success' }, '  onCleanup(() => ws.close());'),
          Text({ dim: true }, '});'),
        ),
      )
    ),

  story('useMemo - Cached Computation')
    .category('Guides')
    .description('useMemo(deps, fn) caches a value between re-renders. Only recomputes when deps change.')
    .controls({
      itemCount: defaultControls.range('Items', 100, 10, 1000, 10),
      sortBy: defaultControls.select('Sort by', ['name', 'price', 'date'], 'name'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'useMemo — Cached Computation'),
        Panel(
          { title: 'Sorted List', padding: 1, width: 45 },
          Text({}, `${props.itemCount} items sorted by ${props.sortBy}`),
          Text({ dim: true }, 'Sort only runs when itemCount or sortBy changes'),
          Text({ dim: true }, 'Other re-renders skip the sort entirely'),
        ),
        Text({ dim: true }, `const sorted = useMemo([items(), sortBy()], () => {`),
        Text({ dim: true }, `  return expensiveSort(items(), sortBy());`),
        Text({ dim: true }, `});`),
      )
    ),

  story('useComputed - Auto-Tracking VNode')
    .category('Guides')
    .description('useComputed(fn) auto-tracks signal dependencies. The VNode only rebuilds when tracked signals change.')
    .controls({
      score: defaultControls.number('Score', 0, { min: 0, max: 9999, step: 100 }),
      otherValue: defaultControls.number('Unrelated value', 42, { min: 0, max: 100 }),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'useComputed — Auto-Tracking'),
        Panel(
          { title: 'Score Display', padding: 1, width: 45 },
          Text({ color: 'warning', bold: true }, `Score: ${props.score}`),
          Text({ dim: true }, `Other value: ${props.otherValue} (not tracked)`),
        ),
        Box(
          { flexDirection: 'column' },
          Text({ dim: true }, 'const scoreNode = useComputed(() => {'),
          Text({ dim: true }, '  return Text({}, `Score: ${score()}`);'),
          Text({ dim: true }, '});'),
          Text({ dim: true }, '// Only rebuilds when score() changes'),
          Text({ dim: true }, '// Changing otherValue does NOT trigger rebuild'),
        ),
      )
    ),
];

// =============================================================================
// Error Handling
// =============================================================================

const errorStories: Story[] = [
  story('Error Boundary - withErrorBoundary')
    .category('Guides')
    .description('withErrorBoundary wraps a component to catch errors. Shows a formatted error screen instead of crashing.')
    .controls({
      shouldError: defaultControls.boolean('Trigger error', false),
    })
    .render((props) => {
      if (props.shouldError) {
        return Box(
          { flexDirection: 'column', padding: 1 },
          Box(
            { borderStyle: 'round', borderColor: 'error', padding: 1, width: 50 },
            Text({ color: 'error', bold: true }, 'Error: Something went wrong!'),
            Text({ dim: true }, 'at App (examples/my-app.ts:42:5)'),
            Text({ dim: true }, 'at render (src/app/render-loop.ts:400)'),
            Box({ height: 1 }),
            Text({ dim: true }, 'This is what withErrorBoundary displays.'),
            Text({ dim: true }, 'The app stays alive — no terminal corruption.'),
          ),
        );
      }

      return Box(
        { flexDirection: 'column', gap: 1, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'withErrorBoundary'),
        Text({ color: 'success' }, 'App running normally.'),
        Text({ dim: true }, 'Toggle "Trigger error" to see error display.'),
        Box({ height: 1 }),
        Text({ dim: true }, 'const SafeApp = withErrorBoundary(App);'),
        Text({ dim: true }, 'render(SafeApp);'),
      );
    }),
];

// =============================================================================
// Export
// =============================================================================

export const allGuideStories: Story[] = [
  ...signalStories,
  ...performanceStories,
  ...storeStories,
  ...hookStories,
  ...errorStories,
];
