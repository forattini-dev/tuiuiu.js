# Installation

## Requirements

- Node.js 18+
- npm, pnpm, or yarn

## Package Manager

```bash
# npm
npm install tuiuiu.js

# pnpm (recommended)
pnpm add tuiuiu.js

# yarn
yarn add tuiuiu.js
```

## TypeScript

Tuiuiu is written in TypeScript and includes type definitions out of the box. No additional `@types` packages needed.

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022"
  }
}
```

## ESM Only

Tuiuiu is an ESM-only package. Make sure your project supports ES modules:

```json
// package.json
{
  "type": "module"
}
```

Or use `.mjs` file extensions.

## Tree Shaking & Subpath Imports

Tuiuiu is fully tree-shakeable (`sideEffects: false`). Import only what you need — unused code is automatically removed from your bundle.

```typescript
// Main entry (everything - convenient for dev)
import { Box, Text, render } from 'tuiuiu.js';

// By atomic layer (optimized bundles)
import { Box, Text } from 'tuiuiu.js/primitives';
import { Button, Spinner } from 'tuiuiu.js/atoms';
import { Select, Table } from 'tuiuiu.js/molecules';
import { Modal, DataTable } from 'tuiuiu.js/organisms';
import { AppShell } from 'tuiuiu.js/templates';

// Core systems
import { createSignal, createEffect, batch } from 'tuiuiu.js/core';
import { useState, useInput, useMouse } from 'tuiuiu.js/hooks';
import { render, renderOnce } from 'tuiuiu.js/app';

// Utilities
import { measureText, getVisibleWidth } from 'tuiuiu.js/utils';

// Full design system (charts, forms, navigation)
import { BarChart, Gauge, FileManager } from 'tuiuiu.js/design-system';
```

### All Available Imports

| Import | Description |
|:-------|:------------|
| `tuiuiu.js` | Everything (main entry) |
| `tuiuiu.js/primitives` | Box, Text, Spacer, Fragment, Divider, Canvas |
| `tuiuiu.js/atoms` | Button, TextInput, Switch, Slider, Spinner, ProgressBar |
| `tuiuiu.js/molecules` | Select, MultiSelect, Table, Tabs, Tree, Calendar |
| `tuiuiu.js/organisms` | Modal, CommandPalette, DataTable, FileManager, SplitPanel |
| `tuiuiu.js/templates` | AppShell, Page, VStack, HStack, StatusBar |
| `tuiuiu.js/core` | Signals, layout engine, renderer |
| `tuiuiu.js/hooks` | useState, useEffect, useInput, useMouse, useFocus |
| `tuiuiu.js/app` | render, renderOnce, useApp |
| `tuiuiu.js/utils` | Text measurement, ANSI utilities |
| `tuiuiu.js/design-system` | Complete design system |
| `tuiuiu.js/storybook` | Storybook utilities |

## Verify Installation

Create a test file:

```typescript
// test.ts
import { render, Box, Text } from 'tuiuiu.js';

render(() => Box({ padding: 1, borderStyle: 'round' },
  Text({ color: 'green' }, '✓ Tuiuiu is working!')
));
```

Run it:

```bash
npx tsx test.ts
```

You should see a green bordered box in your terminal.

## Development Setup

For the best development experience:

```bash
# Clone the repo
git clone https://github.com/forattini-dev/tuiuiu.js
cd tuiuiu.js

# Install dependencies
pnpm install

# Run storybook
pnpm storybook

# Run examples
pnpm example:01
```

## Next Steps

- [Quick Start](/getting-started/quick-start.md) — Build your first app
- [Signals](/core/signals.md) — Learn the reactivity system
- [Components](/components/primitives/box.md) — Explore available components
