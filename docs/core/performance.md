# Performance Optimization

Tuiuiu provides three components to optimize rendering performance: `Computed`, `Memo`, and `PreText`. Use them when your app has expensive rendering or you want to avoid unnecessary work.

## The Problem

By default, when any signal changes, the entire component function re-runs and rebuilds the full VNode tree:

```typescript
function Dashboard() {
  const [score, setScore] = useState(0);
  const [name, setName] = useState('Alice');

  return Box({ flexDirection: 'column' },
    Text({}, `Score: ${score()}`),     // Re-created every time
    Text({}, `Player: ${name()}`),     // Re-created every time
    renderExpensiveChart(),             // Re-created every time!
    Text({}, 'Press Q to quit'),       // Re-created every time
  );
}
```

When `score` changes, **everything** rebuilds — including the chart and static text that didn't change. For simple UIs this is fine. For games, dashboards, or large lists, it matters.

## `Computed` — Reactive Isolation

Wraps a function that reads signals and returns a VNode. Only re-evaluates when the signals it reads change.

```typescript
import { Computed, ComputedText } from 'tuiuiu.js';

function Dashboard() {
  const [score, setScore] = useState(0);
  const [name, setName] = useState('Alice');

  return Box({ flexDirection: 'column' },
    // Only rebuilds when score changes
    Computed(() => Text({ bold: true }, `Score: ${score()}`)),

    // Only rebuilds when name changes
    Computed(() => Text({}, `Player: ${name()}`)),

    // Never rebuilds (no signals read inside)
    Computed(() => renderExpensiveChart()),

    Text({}, 'Press Q to quit'),  // Static — always cheap anyway
  );
}
```

### `ComputedText` — Shorthand for reactive text

```typescript
// Instead of:
Computed(() => Text({ color: 'green' }, `Score: ${score()}`))

// Write:
ComputedText(() => `Score: ${score()}`, { color: 'green' })
```

### When to use Computed

- UI sections that read different signals (top bar vs map vs footer)
- Expensive subtrees that rarely change
- List items where only a few items update at a time

## `Memo` — Cache by Dependencies

Caches a VNode subtree and only rebuilds when explicit dependencies change. Like `useMemo` in React but for VNode trees.

```typescript
import { Memo } from 'tuiuiu.js';

function GameView() {
  const state = game();

  return Box({ flexDirection: 'column' },
    // Only rebuilds when gold, lives, or wave change
    Memo([state.gold, state.lives, state.wave], () =>
      Box({ flexDirection: 'row', gap: 2 },
        Text({ color: 'warning' }, `Gold: ${state.gold}`),
        Text({}, `Lives: ${state.lives}`),
        Text({}, `Wave: ${state.wave}`),
      )
    ),

    // Only rebuilds when monsters or cursor position change
    Memo([state.monsters, state.cursor.x, state.cursor.y], () =>
      renderMap(state)
    ),

    // Never rebuilds (empty deps)
    Memo([], () =>
      Text({ dim: true }, 'WASD: move | B: build | Q: quit')
    ),
  );
}
```

### Computed vs Memo

| | `Computed` | `Memo` |
|:---|:---|:---|
| Dependency tracking | **Automatic** (reads signals) | **Manual** (you list deps) |
| Best for | Signal-driven UI sections | Expensive subtrees with known deps |
| API | `Computed(() => ...)` | `Memo([dep1, dep2], () => ...)` |

**Rule of thumb:** Use `Computed` when your data comes from signals. Use `Memo` when you know exactly what values should trigger a rebuild (e.g., array reference, cursor position).

## `PreText` — Pre-styled SGR Content

For apps that build their own SGR-colored strings (common in games), `PreText`
ignores component text styles and parses those validated styles directly into
cells. Other terminal controls are discarded.

```typescript
import { PreText } from 'tuiuiu.js';

// Game builds ANSI strings directly for speed
const greenBlock = '\x1b[32m███\x1b[0m';
const redBlock = '\x1b[31m░░░\x1b[0m';

function MapRow(row: string) {
  return PreText(row);  // Renderer uses the row's validated SGR styles
}
```

### Real-world example: Game map

```typescript
function mapView() {
  const rows = buildMapAsAnsi(); // Returns pre-styled ANSI strings
  return Box({ flexDirection: 'column' },
    ...rows.map(row => PreText(row))
  );
}
```

### When to use PreText

- Games that render maps with per-cell ANSI styling
- CLI tools that construct colored output strings
- Any time you've already done the ANSI encoding yourself

## Combining Them

The real power comes from combining all three:

```typescript
function TowerDefense() {
  const [gold, setGold] = createSignal(60);
  const [monsters, setMonsters] = createSignal([]);
  const [cursor, setCursor] = createSignal({ x: 0, y: 0 });

  return Box({ flexDirection: 'column' },
    // Top bar: only rebuilds when economy changes
    Computed(() =>
      Box({ flexDirection: 'row', gap: 2 },
        Text({ color: 'warning' }, `Gold: ${gold()}`),
        Text({}, `Monsters: ${monsters().length}`),
      )
    ),

    // Map: caches when monsters/cursor unchanged, uses PreText for speed
    Memo([monsters(), cursor()], () =>
      Box({ flexDirection: 'column' },
        ...buildMapRows(monsters(), cursor()).map(row => PreText(row))
      )
    ),

    // Static footer: never rebuilds
    Memo([], () =>
      Text({ dim: true }, 'B: build | U: upgrade | Q: quit')
    ),
  );
}
```

## `onCleanup` — Ergonomic cleanup

Register cleanup functions anywhere inside an effect:

```typescript
import { createEffect, onCleanup } from 'tuiuiu.js';

createEffect(() => {
  const timer = setInterval(tick, 16);
  onCleanup(() => clearInterval(timer));

  const socket = connect(url());
  onCleanup(() => socket.close());
});
```

## Performance Tips

1. **Start simple.** Only optimize when you notice lag or high CPU usage.
2. **Wrap independent sections in `Computed`.** A dashboard with header/content/footer benefits immediately.
3. **Use `Memo([], ...)` for truly static content.** Controls help text, decorative borders, etc.
4. **Memoize pre-styled game rows.** `PreText` is useful when your renderer already produces SGR-colored rows; combine it with `Memo` when those rows are stable.
5. **Use `batch()` for multi-signal updates.** Prevents intermediate re-renders.
6. **Profile with `useFps()`.** It shows real-time frame rate so you can see the impact of changes.
