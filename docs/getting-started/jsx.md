# Optional JSX Runtime

Tuiuiu's functional API remains the default:

```typescript
Box({ padding: 1 }, Text({ bold: true }, 'Hello'));
```

If your team prefers Ink-like composition, Tuiuiu also ships an optional,
zero-dependency automatic JSX runtime. It produces the same VNodes and uses the
same terminal renderer; there is no DOM or browser CSS layer.

## Create a JSX Project

```bash
npx tuiuiu.js@latest init my-tui --jsx
cd my-tui
pnpm install
pnpm dev
```

For an existing TypeScript project, configure:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "tuiuiu.js"
  }
}
```

Then use existing components directly:

```tsx
import {
  Box,
  Text,
  renderInline,
  useApp,
  useInput,
} from 'tuiuiu.js/minimal';

function App() {
  const app = useApp();
  useInput((input) => {
    if (input === 'q') app.exit();
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round">
      <Text bold color="cyan">Hello from Tuiuiu</Text>
      <Text dim>Press q to exit.</Text>
    </Box>
  );
}

const tui = renderInline(App);
await tui.waitUntilExit();
```

## Intrinsic Elements

Lowercase terminal intrinsics are also available:

```tsx
const view = (
  <box flexDirection="column">
    <text bold>Status</text>
    <spacer />
    <newline />
  </box>
);
```

Supported intrinsics are `box`, `text`, `spacer`, `newline`, and `fragment`.
Uppercase components such as `Box`, `Text`, `Button`, or your own component
functions work through the same runtime.

`<text>` accepts only string and number children. Nest layout elements inside a
`<box>` instead. This rule prevents accidental `[object Object]` output.

## Package Contract

TypeScript loads `tuiuiu.js/jsx-runtime` and
`tuiuiu.js/jsx-dev-runtime` automatically. Both are public package exports and
are compiled in CI through a real `.tsx` contract fixture.
