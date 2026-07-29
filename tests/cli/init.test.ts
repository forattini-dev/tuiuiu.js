import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  parseInitArgs,
  scaffoldProject,
} from '../../src/cli/commands/init.js';

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'tuiuiu-init-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  for (const directory of temporaryDirectories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('tuiuiu init', () => {
  it('parses a target directory', () => {
    expect(parseInitArgs(['my-app'])).toEqual({
      directory: 'my-app',
      help: false,
    });
  });

  it('rejects unknown options and multiple targets', () => {
    expect(() => parseInitArgs(['--force'])).toThrow('Unknown init option');
    expect(() => parseInitArgs(['--jsx'])).toThrow('Unknown init option');
    expect(() => parseInitArgs(['one', 'two'])).toThrow('only one target');
  });

  it('creates a minimal functional TypeScript project', async () => {
    const cwd = await createTemporaryDirectory();
    const target = await scaffoldProject({
      ...parseInitArgs(['demo']),
      cwd,
      version: '1.2.3',
    });

    const packageJson = JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8'));
    const tsconfig = JSON.parse(await readFile(path.join(target, 'tsconfig.json'), 'utf8'));
    const entry = await readFile(path.join(target, 'src', 'index.ts'), 'utf8');
    expect(packageJson.dependencies['tuiuiu.js']).toBe('^1.2.3');
    expect(tsconfig.compilerOptions).not.toHaveProperty('jsx');
    expect(tsconfig.compilerOptions).not.toHaveProperty('jsxImportSource');
    expect(tsconfig.include).toEqual(['src/**/*.ts']);
    expect(entry).toContain('renderInline');
    expect(entry).not.toContain('<Box');
  });

  it('refuses to overwrite a non-empty target', async () => {
    const cwd = await createTemporaryDirectory();
    const target = path.join(cwd, 'existing');
    await mkdir(target);
    await writeFile(path.join(target, 'keep.txt'), 'user data');

    await expect(scaffoldProject({
      ...parseInitArgs(['existing']),
      cwd,
      version: '1.2.3',
    })).rejects.toThrow('Refusing to overwrite non-empty directory');
    expect(await readFile(path.join(target, 'keep.txt'), 'utf8')).toBe('user data');
  });
});
