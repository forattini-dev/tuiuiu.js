import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { examplesManifest } from '../examples/manifest.ts';
import { buildStorybookCoverageDocument } from './storybook-coverage.ts';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');

type PackageExports = Record<string, string | { types?: string; import?: string; default?: string }>;

function fail(message: string): never {
  console.error(`\n[verify:contracts] ${message}`);
  process.exit(1);
}

function runCommand(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function walkFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      files.push(...walkFiles(absolute));
    } else {
      files.push(absolute);
    }
  }

  return files;
}

function assertPackageExports(): void {
  if (!existsSync(distDir)) {
    fail('Build output not found. Run `pnpm build` before `pnpm verify:contracts`.');
  }

  const packageJson = JSON.parse(
    readFileSync(path.join(rootDir, 'package.json'), 'utf8')
  ) as { exports?: PackageExports; scripts?: Record<string, string> };

  for (const [subpath, target] of Object.entries(packageJson.exports ?? {})) {
    if (typeof target === 'string') {
      if (target === './package.json') {
        continue;
      }

      const absolute = path.join(rootDir, target.replace(/^\.\//, ''));
      if (!existsSync(absolute)) {
        fail(`Missing export target for ${subpath}: ${target}`);
      }
      continue;
    }

    for (const [condition, relativeTarget] of Object.entries(target)) {
      if (!relativeTarget) {
        continue;
      }

      const absolute = path.join(rootDir, relativeTarget.replace(/^\.\//, ''));
      if (!existsSync(absolute)) {
        fail(`Missing export target for ${subpath} (${condition}): ${relativeTarget}`);
      }
    }
  }
}

function assertExampleManifestAndScripts(): void {
  const packageJson = JSON.parse(
    readFileSync(path.join(rootDir, 'package.json'), 'utf8')
  ) as { scripts?: Record<string, string> };

  for (const example of examplesManifest) {
    const absolute = path.join(rootDir, 'examples', example.file);
    if (!existsSync(absolute)) {
      fail(`Example manifest points to a missing file: ${example.file}`);
    }
  }

  for (const [scriptName, scriptValue] of Object.entries(packageJson.scripts ?? {})) {
    if (!scriptName.startsWith('example')) {
      continue;
    }

    const match = scriptValue.match(/examples\/([^\s'"]+)/);
    if (!match) {
      continue;
    }

    const absolute = path.join(rootDir, 'examples', match[1]);
    if (!existsSync(absolute)) {
      fail(`Script ${scriptName} points to a missing example file: ${match[1]}`);
    }
  }
}

function assertDocsDoNotReferenceKnownBadPatterns(): void {
  const targets = [
    path.join(rootDir, 'README.md'),
    path.join(rootDir, 'docs'),
    path.join(rootDir, 'src', 'mcp', 'docs'),
  ];

  const rules = [
    {
      pattern: 'tuiuiu/design-system/primitives',
      message: 'Found stale deep import for `design-system`.',
    },
    {
      pattern: 'combineReducers',
      message: 'Found undocumented store API that is not implemented.',
    },
    {
      pattern: 'store.getState().items',
      message: 'Found non-reactive store example presented as reactive.',
    },
  ];

  for (const target of targets) {
    const files = statSync(target).isDirectory() ? walkFiles(target) : [target];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const rule of rules) {
        if (content.includes(rule.pattern)) {
          fail(`${rule.message} Offending file: ${path.relative(rootDir, file)}`);
        }
      }
    }
  }
}

function assertStorybookCoverageIsCurrent(): void {
  const result = buildStorybookCoverageDocument();
  const current = readFileSync(path.join(rootDir, 'docs', 'core', 'storybook-coverage.md'), 'utf8');

  if (result.unresolved.length > 0) {
    fail(`Storybook coverage is incomplete:\n- ${result.unresolved.join('\n- ')}`);
  }

  if (current !== result.content) {
    fail('Storybook coverage checklist is out of date. Run `pnpm storybook:coverage`.');
  }
}

function compileCuratedExamples(): void {
  const curated = examplesManifest
    .filter((example) => example.validate)
    .map((example) => path.join('examples', example.file));

  if (curated.length === 0) {
    fail('No curated examples are marked for validation.');
  }

  runCommand(process.execPath, [
    path.join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--noEmit',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--target',
    'ES2022',
    '--lib',
    'ES2022',
    '--types',
    'node',
    ...curated,
  ]);
}

assertPackageExports();
assertExampleManifestAndScripts();
assertDocsDoNotReferenceKnownBadPatterns();
assertStorybookCoverageIsCurrent();
compileCuratedExamples();

console.log('[verify:contracts] OK');
