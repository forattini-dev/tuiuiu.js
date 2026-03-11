# Quick Start

Build a simple interactive counter in 5 minutes.

## 1. Create a New Project

```bash
mkdir my-tui-app
cd my-tui-app
npm init -y
npm install tuiuiu.js
```

Add `"type": "module"` to `package.json`:

```json
{
  "type": "module"
}
```

## 2. Create Your First App

Create `index.ts`:

```typescript
import { render, Box, Text, useState, useInput, useApp, setTheme, darkTheme } from 'tuiuiu.js';

// ⚠️ IMPORTANT: Set theme BEFORE render()
setTheme(darkTheme);

function Counter() {
  // useState persists state across re-renders (it's a hook!)
  const [count, setCount] = useState(0);
  const { exit } = useApp();

  useInput((char, key) => {
    if (key.upArrow || char === 'k') setCount(c => c + 1);
    if (key.downArrow || char === 'j') setCount(c => c - 1);
    if (char === 'r') setCount(0);
    if (key.escape) exit();
  });

  return Box({ flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '🐦 Tuiuiu Counter'),
    Box({ borderStyle: 'round', borderColor: 'blue', padding: 1, marginTop: 1 },
      Text({ color: 'yellow', bold: true }, `Count: ${count()}`)
    ),
    Text({ color: 'gray', dim: true, marginTop: 1 },
      '↑/k: up  ↓/j: down  r: reset  Esc: quit'
    )
  );
}

const { waitUntilExit } = render(Counter);
await waitUntilExit();
```

> ⚠️ **Important**: Always call `setTheme()` before `render()` for proper input handling!

## 3. Run It

```bash
npx tsx index.ts
```

Use arrow keys to increment/decrement, `r` to reset, `Esc` to exit.

## Understanding the Code

### Imports

```typescript
import { render, Box, Text, useState, useInput, useApp } from 'tuiuiu.js';
```

- `render` — Starts the app and takes over the terminal
- `Box` — Layout container (like `<div>`)
- `Text` — Text content (like `<span>`)
- `useState` — Reactive state hook
- `useInput` — Keyboard input handler
- `useApp` — App control (exit, etc.)

### State with `useState`

```typescript
const [count, setCount] = useState(0);
```

- `count()` — Read current value (it's a function!)
- `setCount(newValue)` — Set new value
- `setCount(c => c + 1)` — Update based on current value

### Input Handling

```typescript
useInput((char, key) => {
  if (key.upArrow) setCount(c => c + 1);
  if (char === 'r') setCount(0);
  if (key.escape) exit();
});
```

- `char` — The character typed (if printable)
- `key` — Special keys object (`upArrow`, `escape`, `ctrl`, etc.)

### Layout with `Box`

```typescript
Box({ flexDirection: 'column', padding: 1 },
  // children...
)
```

Uses CSS Flexbox model. Common props:
- `flexDirection`: `'row'` | `'column'`
- `justifyContent`: `'flex-start'` | `'center'` | `'space-between'`
- `alignItems`: `'flex-start'` | `'center'` | `'stretch'`
- `padding`, `margin`: spacing
- `borderStyle`: `'single'` | `'round'` | `'double'`

### Styled Text

```typescript
Text({ color: 'cyan', bold: true }, 'Hello')
Text({ color: 'gray', dim: true }, 'Hint text')
```

## Next: Add More Features

### Mouse Support

```typescript
const [hover, setHover] = useState(false);

Box({
  borderStyle: hover() ? 'double' : 'single',
  borderColor: hover() ? 'cyan' : 'gray',
  onMouseEnter: () => setHover(true),
  onMouseLeave: () => setHover(false),
  onClick: () => setCount(c => c + 1),
},
  Text({}, 'Click me!')
)
```

### Multiple Components

```typescript
function Header() {
  return Box({ borderStyle: 'single', padding: 1 },
    Text({ bold: true }, 'My App')
  );
}

function Footer() {
  return Text({ color: 'gray', dim: true }, 'Press q to quit');
}

function App() {
  return Box({ flexDirection: 'column' },
    Header(),
    Box({ flexGrow: 1, padding: 1 },
      Text({}, 'Main content')
    ),
    Footer()
  );
}
```

### Async Data

```typescript
function AsyncData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setLoading(false);
    });
  });

  if (loading()) {
    return Spinner({ label: 'Loading...' });
  }

  return Text({}, `Data: ${data()}`);
}
```

## More Examples

```bash
# Clone the repo
git clone https://github.com/forattini-dev/tuiuiu.js
cd tuiuiu.js
pnpm install

# Run examples
pnpm example:list
pnpm example app-counter
pnpm example app-forms
pnpm example app-dashboard
pnpm example app-chat
pnpm example tuiuiu-meteor
pnpm example tuiuiu-sideblaster
```

## Next Steps

- [Signals](/core/signals.md) — Deep dive into reactivity
- [Layout](/core/layout.md) — Master Flexbox in terminal
- [Components](/components/overview.md) — Explore all 50+ components
