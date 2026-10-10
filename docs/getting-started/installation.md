# Installation

## Requirements

- Node.js 22.12 or newer
- an ANSI-capable terminal
- TypeScript recommended

```bash
pnpm add tuiuiu.js@next
```

These docs describe the v2 prerelease. `@next` opts into its breaking APIs;
`@latest` remains the stable v1 channel until v2 is promoted. Existing users
should read [the migration guide](/migration/2.0.md) first.

Or generate a project:

```bash
npx tuiuiu.js@next init my-tui-app
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
