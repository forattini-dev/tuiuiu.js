import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as app from '../src/app/index.js';
import * as core from '../src/core/index.js';
import * as interaction from '../src/interaction/index.js';
import * as testing from '../src/testing/index.js';
import * as tuiuiu from '../src/index.js';
import * as ui from '../src/ui/index.js';

const EXPECTED_SUBPATHS = [
  '.', './app', './colors', './core', './devtools', './interaction',
  './mcp', './package.json', './storybook', './testing', './ui',
];

describe('public package boundaries', () => {
  it('publishes only the v2 hierarchy', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { exports: Record<string, unknown> };
    expect(Object.keys(packageJson.exports).sort()).toEqual(EXPECTED_SUBPATHS.sort());
  });

  it('keeps ownership directional and removes v1 registries', () => {
    expect(core).toHaveProperty('calculateLayout');
    expect(core).not.toHaveProperty('render');
    expect(interaction).toHaveProperty('createInteractionRuntime');
    expect(interaction).toHaveProperty('createCompletionSession');
    expect(interaction).not.toHaveProperty('CommandRegistry');
    expect(ui).toHaveProperty('VirtualDataTable');
    expect(app).toHaveProperty('component');
    expect(app).not.toHaveProperty('initializeApp');
    expect(testing).toHaveProperty('dispatchTestKey');
    expect(tuiuiu).not.toHaveProperty('useInput');
    expect(tuiuiu).not.toHaveProperty('useHotkeys');
  });

  it('keeps the everyday root within its runtime budget', () => {
    expect(Object.keys(tuiuiu).length).toBeLessThanOrEqual(75);
  });
});
