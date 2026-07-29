import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

function assertNoJsxRuntimeIsPublished(): void {
  const packageJson = JSON.parse(
    readFileSync(path.join(rootDir, 'package.json'), 'utf8')
  ) as { exports?: PackageExports };
  const forbiddenSubpaths = ['./jsx-runtime', './jsx-dev-runtime'];
  const packageExports = packageJson.exports ?? {};
  const exposed = forbiddenSubpaths.filter((subpath) =>
    Object.prototype.hasOwnProperty.call(packageExports, subpath)
  );
  if (exposed.length > 0) {
    fail(`Unsupported JSX runtime entry points are public: ${exposed.join(', ')}`);
  }

  const staleArtifacts = readdirSync(distDir)
    .filter((entry) => /^jsx(?:-dev)?-runtime\./.test(entry));
  if (staleArtifacts.length > 0) {
    fail(`Unsupported JSX runtime artifacts are present in dist: ${staleArtifacts.join(', ')}`);
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

  const duplicateNames = examplesManifest
    .map((example) => example.name)
    .filter((name, index, names) => names.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    fail(`Example manifest contains duplicate names: ${[...new Set(duplicateNames)].join(', ')}`);
  }

  const duplicateFiles = examplesManifest
    .map((example) => example.file)
    .filter((file, index, files) => files.indexOf(file) !== index);
  if (duplicateFiles.length > 0) {
    fail(`Example manifest contains duplicate files: ${[...new Set(duplicateFiles)].join(', ')}`);
  }

  const manifestFiles = new Set(
    examplesManifest.map((example) => example.file.replaceAll('\\', '/'))
  );
  const unlistedExamples = walkFiles(path.join(rootDir, 'examples'))
    .filter((file) => file.endsWith('.ts'))
    .map((file) => path.relative(path.join(rootDir, 'examples'), file).replaceAll('\\', '/'))
    .filter((file) =>
      file !== 'manifest.ts' &&
      file !== 'programmatic/index.ts' &&
      !file.startsWith('_') &&
      !file.startsWith('_shared/')
    )
    .filter((file) => !manifestFiles.has(file));

  if (unlistedExamples.length > 0) {
    fail(`Runnable examples are missing from the manifest:\n- ${unlistedExamples.join('\n- ')}`);
  }

  const examplesCatalog = readFileSync(
    path.join(rootDir, 'docs', 'resources', 'examples.md'),
    'utf8'
  );
  const undocumentedExamples = examplesManifest
    .filter((example) => !examplesCatalog.includes(`\`${example.name}\``))
    .map((example) => example.name);
  if (undocumentedExamples.length > 0) {
    fail(`Manifest examples are missing from the documentation catalog:\n- ${undocumentedExamples.join('\n- ')}`);
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
    {
      pattern: 'via.placeholder.com',
      message: 'Found a documentation color sample that depends on the retired placeholder service.',
    },
    {
      pattern: '--jsx',
      message: 'Found documentation advertising the unsupported JSX scaffold option.',
    },
    {
      pattern: 'jsxImportSource',
      message: 'Found documentation advertising a JSX import source.',
    },
    {
      pattern: 'tuiuiu.js/jsx-runtime',
      message: 'Found documentation advertising an unsupported JSX runtime.',
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

function assertLocalMarkdownLinksResolve(): void {
  const docsDir = path.join(rootDir, 'docs');
  const files = [
    path.join(rootDir, 'README.md'),
    ...walkFiles(docsDir).filter((file) => file.endsWith('.md')),
  ];
  const failures: string[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
    const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;

    for (const match of content.matchAll(linkPattern)) {
      const rawTarget = match[1]?.trim().replace(/^<|>$/g, '');
      if (
        !rawTarget ||
        /^['"]/.test(rawTarget) ||
        /^(?:https?:|mailto:|data:|#)/i.test(rawTarget)
      ) {
        continue;
      }

      const target = decodeURIComponent(
        rawTarget.split(/\s+["']/)[0]!.split(/[?#]/)[0]!
      );
      if (!target) continue;

      const candidate = target.startsWith('/')
        ? path.join(docsDir, target.slice(1))
        : path.resolve(path.dirname(file), target);
      const candidates = path.extname(candidate)
        ? [candidate]
        : [candidate, `${candidate}.md`, path.join(candidate, 'README.md')];

      if (!candidates.some((entry) => existsSync(entry))) {
        failures.push(
          `${path.relative(rootDir, file)} -> ${rawTarget}`
        );
      }
    }
  }

  if (failures.length > 0) {
    fail(`Broken local documentation links:\n- ${failures.join('\n- ')}`);
  }
}

function assertStorybookCoverageIsCurrent(): void {
  const result = buildStorybookCoverageDocument();
  const current = readFileSync(path.join(rootDir, 'docs', 'core', 'storybook-coverage.md'), 'utf8');
  const normalizeNewlines = (value: string): string => value.replace(/\r\n?/g, '\n');

  if (result.unresolved.length > 0) {
    fail(`Storybook coverage is incomplete:\n- ${result.unresolved.join('\n- ')}`);
  }

  if (normalizeNewlines(current) !== normalizeNewlines(result.content)) {
    fail('Storybook coverage checklist is out of date. Run `pnpm storybook:coverage`.');
  }
}

async function assertExperimentalValuesStayIsolated(): Promise<void> {
  const stable = await import(pathToFileURL(path.join(distDir, 'index.js')).href);
  const experimental = await import(
    pathToFileURL(path.join(distDir, 'experimental', 'index.js')).href
  );
  const leaked = Object.keys(experimental).filter((name) =>
    Object.prototype.hasOwnProperty.call(stable, name)
  );

  if (leaked.length > 0) {
    fail(
      `Experimental runtime exports leaked into the stable root entry point: ${leaked.join(', ')}`
    );
  }
}

async function assertMinimalEntryPointIsFocused(): Promise<void> {
  const minimal = await import(
    pathToFileURL(path.join(distDir, 'minimal.js')).href
  );
  const required = [
    'render',
    'Box',
    'Text',
    'useState',
    'useInput',
    'useApp',
    'setTheme',
  ];
  const missing = required.filter((name) =>
    !Object.prototype.hasOwnProperty.call(minimal, name)
  );
  if (missing.length > 0) {
    fail(`Minimal entry point is missing core APIs: ${missing.join(', ')}`);
  }

  const excluded = [
    'createStyleSheet',
    'VirtualDataTable',
    'startMcpServer',
    'createStorybook',
  ];
  const leaked = excluded.filter((name) =>
    Object.prototype.hasOwnProperty.call(minimal, name)
  );
  if (leaked.length > 0) {
    fail(`Minimal entry point includes optional or unstable APIs: ${leaked.join(', ')}`);
  }
}

function compileExamples(): void {
  runCommand(process.execPath, [
    path.join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--project',
    path.join(rootDir, 'tsconfig.examples.json'),
  ]);
}

assertPackageExports();
assertNoJsxRuntimeIsPublished();
assertExampleManifestAndScripts();
assertDocsDoNotReferenceKnownBadPatterns();
assertLocalMarkdownLinksResolve();
assertStorybookCoverageIsCurrent();
await assertExperimentalValuesStayIsolated();
await assertMinimalEntryPointIsFocused();
compileExamples();

console.log('[verify:contracts] OK');
