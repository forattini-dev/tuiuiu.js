import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as experimental from '../src/experimental/index.js';
import * as organisms from '../src/organisms/index.js';

describe('public package boundaries', () => {
  it('keeps unfinished data-table facades out of the stable organism barrel', () => {
    expect(organisms).toHaveProperty('DataTable');
    expect(organisms).not.toHaveProperty('VirtualDataTable');
    expect(organisms).not.toHaveProperty('EditableDataTable');
    expect(experimental).toHaveProperty('VirtualDataTable');
    expect(experimental).toHaveProperty('EditableDataTable');
  });

  it('publishes every documented programmatic subpath', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { exports: Record<string, unknown> };

    expect(Object.keys(packageJson.exports)).toEqual(expect.arrayContaining([
      './mcp',
      './experimental',
      './prompts',
      './themes',
      './dev-tools',
    ]));
  });
});
