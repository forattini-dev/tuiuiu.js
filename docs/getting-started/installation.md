# Installation

## Requirements

- Node.js 22.12 or newer
- an ANSI-capable terminal
- TypeScript recommended

```bash
pnpm add tuiuiu.js
```

Or generate a project:

```bash
npx tuiuiu.js@latest init my-tui-app
```

## Imports

```ts
import { Box, Text, component, render, useShortcut, useState } from 'tuiuiu.js';
import { DataTable, Modal, Tabs } from 'tuiuiu.js/ui';
import { createCollectionController, prompt } from 'tuiuiu.js/interaction';
import { renderToString } from 'tuiuiu.js/core';
```

Only documented package entrypoints are public. See the complete
[import map](/core/imports.md).
