import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { examplesManifest } from '../examples/manifest.ts';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = path.join(rootDir, 'examples');
const tsxCli = fileURLToPath(import.meta.resolve('tsx/cli'));

function usage(): never {
  console.error('Usage: pnpm example <name> [args...]');
  console.error('Run `pnpm example:list` to see the curated examples.');
  process.exit(1);
}

function listExamples(): void {
  for (const example of examplesManifest) {
    const tags = [example.category, example.difficulty];
    if (example.validate) {
      tags.push('validated');
    }

    console.log(`${example.name.padEnd(32)} ${tags.join(' · ')}  ${example.description}`);
  }
}

function resolveExample(target: string): string | null {
  const manifestEntry = examplesManifest.find((example) => example.name === target);
  if (manifestEntry) {
    return path.join(examplesDir, manifestEntry.file);
  }

  const directTarget = path.isAbsolute(target) ? target : path.join(rootDir, target);
  if (existsSync(directTarget)) {
    return directTarget;
  }

  const examplePath = path.join(examplesDir, target.endsWith('.ts') ? target : `${target}.ts`);
  if (existsSync(examplePath)) {
    return examplePath;
  }

  return null;
}

function runExample(target: string, args: string[]): void {
  const resolved = resolveExample(target);
  if (!resolved) {
    console.error(`Unknown example: ${target}`);
    usage();
  }

  const child = spawn(process.execPath, [tsxCli, resolved, ...args], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

const [command, ...rest] = process.argv.slice(2);

switch (command) {
  case 'list':
    listExamples();
    break;
  case 'run': {
    const [target, ...args] = rest;
    if (!target) {
      usage();
    }
    runExample(target, args);
    break;
  }
  default:
    usage();
}
