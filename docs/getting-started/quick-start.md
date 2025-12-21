# Quick Start

Here's how to build your first Tuiuiu application.

## 1. Create a new file

Create a file named `index.ts` (or `.js`):

```typescript
import { render, Box, Text } from 'tuiuiu';
import { App } from './App'; // Your root component

render(App);
```

## 2. Create your App component

```typescript
import { Box, Text } from 'tuiuiu';

export function App() {
  return Box({},
    Text({ color: 'green' }, 'Hello, Tuiuiu!')
  );
}
```

## 3. Run it

Use `tsx` or `ts-node` to run your application:

```bash
npx tsx index.ts
```
