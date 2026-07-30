import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

import { examplesManifest } from '../examples/manifest.ts';
import { buildStorybookCoverageDocument } from './storybook-coverage.ts';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');

type PackageExports = Record<string, string | { types?: string; import?: string; default?: string }>;

/**
 * Runtime export names are a semver contract. Keep this compact fingerprint in
 * source control so adding a barrel re-export cannot silently expand a stable
 * entry point. Update a baseline only when the API change is intentional and
 * documented.
 */
const PUBLIC_RUNTIME_EXPORT_BASELINE = {
  '.': { count: 1020, sha256: '9118edb5c7730329a6b5b0be111524e29e2414917baa2e0b71ab74b4067e722d' },
  './minimal': { count: 36, sha256: '9c653257273b130f722cf994390fc692802c13837006b47a4239efdecb7b3573' },
  './core': { count: 561, sha256: 'e787e78d442e287ac884f28ee8f164735a1f855b12f50dc28f06de237306b601' },
  './hooks': { count: 110, sha256: '2dbc170cc93a2694cc5c013dc25ab15ae003cb42864a9792ca2c30eb5d9af801' },
  './utils': { count: 62, sha256: '3325c6fe176f78eed3407d091bc27b8acb3a7ae6aad94954d39431d2a3a6e8d2' },
  './storybook': { count: 29, sha256: '179e7e8000ee02fb9bb37f1e8a2714067c6f6a63b5ece1153eea82cb97c30552' },
  './mcp': { count: 18, sha256: 'e2a3f373802073dd340f9659b977a00d99cce62282cae80847f6aca1f30d02dc' },
  './prompts': { count: 14, sha256: 'a6505e138bca2584255d7f8c5048dd04eb91520b3fd3fca3a0b0cf58985c03c8' },
  './themes': { count: 23, sha256: '29e0118cc4d5dfe1cefe2d3fd1b4358911c01ee56736f661f4e33136a11d5a42' },
  './dev-tools': { count: 49, sha256: 'b180c9d39546737c5929714eb5274d0e711456003d252a9e2cacdf4ad3736718' },
  './app': { count: 10, sha256: '82221dd310c191d79a1024cf41dad4a0d14162f9ac033137ece71948fb06b6fb' },
  './primitives': { count: 81, sha256: '79b8a343b269793239a49640cea3ed536e072ac92f08ca99f6f8a86f07ecb07c' },
  './atoms': { count: 120, sha256: 'd00d9a29839eabb43729e692537fe7223f833bc799d5a63fce69e68f5be1df92' },
  './molecules': { count: 136, sha256: 'f12ad0e874dffc9de2edd2717ff32f15e41e987ec5fc02836e8adc2d5493f886' },
  './organisms': { count: 73, sha256: 'feb77c87797bb7aa59f1ca21ad4b263d5bb8b08ee61f0d307d5fe3d10396cb26' },
  './experimental': { count: 4, sha256: 'c84bee0520dc69a459d9c7f334013f4512c8dd02809a05f9026f7616391d7026' },
  './templates': { count: 21, sha256: '90605ff273d6a66e7e2ef92736408645c3731f40269f3aa5b3c4997f47b140c5' },
  './design-system': { count: 367, sha256: '8fc83b8d7aaf6183b072acb34dd70b8624dc46671817607b2a7a705f2ec1accf' },
  './colors': { count: 72, sha256: 'c9ceb73af03412b2071453c24d5af717dbac1d290ca213dc111a9065313176b6' },
  './styling': { count: 22, sha256: '693a33546d97d98e88362cb6344150853d460329e5b1fd2d0205d49e16b8a453' },
} as const;

const PUBLIC_TYPE_EXPORT_BASELINE = {
  '.': { count: 1752, sha256: '93e884a8f67e37a8db3a3045473d50d6281bccc44dc82951983abd9733730499' },
  './minimal': { count: 73, sha256: '666fbb8e8100812e8417df6fa09688545a743fd80b03fe1c262c97aa9aef8486' },
  './core': { count: 811, sha256: 'daab951ea348ef231789af1fa68603d78244337dbaa0efa2206eb3c3dd5b11b9' },
  './hooks': { count: 178, sha256: 'b1a43689061b568fb0da078cc3f4b40086300b4e9031dcc038e6ef4d03d68243' },
  './utils': { count: 118, sha256: '91f8c6f4f7e791dbc56c912d6d9d6af37530daf0c0c1e42e0db3e8e9931a095f' },
  './storybook': { count: 53, sha256: '6bf91cdc208541dc2a38088ca8334b4cb9ab2d65751a932e1e1dfa970d63ac2a' },
  './mcp': { count: 40, sha256: '47e4dc4b5bb46ce6efeec12f40d975a26e72f872de331920321c18911c746d5c' },
  './prompts': { count: 24, sha256: '021f7d874a2d93cc386af85356b9265986d43fc327dc4defca81fbcb227e0082' },
  './themes': { count: 37, sha256: '20b0bc6f23fa0ac09b03eb4b9832bf1018ee654ea5abbf7476164a7e514044a5' },
  './dev-tools': { count: 77, sha256: '7e1ca88fb61615aa946095e57c7890c7fef45e70ce8f57b5b21991703fc6af3e' },
  './app': { count: 17, sha256: '62574094a90a3d11b81a427f33b4ac3396084af0d863a3c8162a89c1acca1c4d' },
  './primitives': { count: 125, sha256: 'b71780640655ff61320a4f15673e1da74daa8a6af0c56383ae623109a8a862c1' },
  './atoms': { count: 248, sha256: '3f7e964fa63f1184aac896222896efb29c3c4f03c3e7cadd6dd309d8a74716c8' },
  './molecules': { count: 304, sha256: '96a6da5e3acf842a596688174d78b5b2b642602275b0bafe7b06f5b02834ceba' },
  './organisms': { count: 146, sha256: '520706fe89f8ba0d326c505de358bb758ae9eb90d4fcb9c5bf734748aed08b06' },
  './experimental': { count: 11, sha256: 'a38a43a1429be4150d0319a97769d3a216e688c51fcef32e461c015b65ce43d8' },
  './templates': { count: 38, sha256: '8bb1962666074165c53b3e0c50b29bea80d6e1db0dd828bf5090bf69fb8307ed' },
  './design-system': { count: 762, sha256: 'c8612d2a359de385ebd620a2ed4e61f95734dafac564c18d7c170a644bc7ab6f' },
  './colors': { count: 74, sha256: '37e4e8b8998c7086a67d16e4295315093a8b3708392cb9b5e9f987ed37d3159a' },
  './styling': { count: 54, sha256: 'b665ba3ae64883b220eb1ddf7fe63b6cbb7709ea4de615a3b91f1ea31de3ce3c' },
} as const;

const ALLOWED_ROOT_RUNTIME_ALIAS_GROUPS = [
  ['ConstraintSolver', 'Solver'],
  ['ansiBlue', 'ansiPrimary'],
  ['ansiCyan', 'ansiInfo'],
  ['ansiError', 'ansiRed'],
  ['ansiGray', 'ansiGrey', 'ansiMuted'],
  ['ansiGreen', 'ansiSuccess'],
  ['ansiMagenta', 'ansiSecondary'],
  ['ansiStrike', 'ansiStrikethrough'],
  ['ansiWarning', 'ansiYellow'],
  ['bgGray', 'bgGrey'],
] as const;

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

function runtimeExportTarget(
  target: PackageExports[string]
): string | undefined {
  return typeof target === 'string' ? target : target.import ?? target.default;
}

async function assertPublicRuntimeSurface(): Promise<void> {
  const packageJson = JSON.parse(
    readFileSync(path.join(rootDir, 'package.json'), 'utf8')
  ) as { exports?: PackageExports };
  const packageExports = packageJson.exports ?? {};
  const runtimeSubpaths = Object.entries(packageExports)
    .filter(([subpath, target]) =>
      subpath !== './package.json' && runtimeExportTarget(target) !== undefined
    )
    .map(([subpath]) => subpath)
    .sort();
  const baselineSubpaths = Object.keys(PUBLIC_RUNTIME_EXPORT_BASELINE).sort();

  if (runtimeSubpaths.join('\n') !== baselineSubpaths.join('\n')) {
    fail(
      'Public runtime entry points changed. Update the runtime export baseline ' +
      'only after documenting the package boundary change.\n' +
      `Expected: ${baselineSubpaths.join(', ')}\n` +
      `Received: ${runtimeSubpaths.join(', ')}`
    );
  }

  let rootModule: Record<string, unknown> | undefined;
  for (const subpath of runtimeSubpaths) {
    const target = runtimeExportTarget(packageExports[subpath]!);
    if (!target) continue;

    const module = await import(
      pathToFileURL(path.join(rootDir, target.replace(/^\.\//, ''))).href
    ) as Record<string, unknown>;
    const names = Object.keys(module).sort();
    const sha256 = createHash('sha256')
      .update(names.join('\n'))
      .digest('hex');
    const expected = PUBLIC_RUNTIME_EXPORT_BASELINE[
      subpath as keyof typeof PUBLIC_RUNTIME_EXPORT_BASELINE
    ];

    if (names.length !== expected.count || sha256 !== expected.sha256) {
      fail(
        `Runtime exports changed for ${subpath}: ` +
        `expected ${expected.count}/${expected.sha256}, ` +
        `received ${names.length}/${sha256}. ` +
        'Update the baseline only for an intentional, documented API change.'
      );
    }

    if (subpath === '.') {
      rootModule = module;
    }
  }

  if (!rootModule) {
    fail('The stable root runtime entry point could not be loaded.');
  }

  const rootNames = Object.keys(rootModule).sort();
  const aliases: string[][] = [];
  const consumed = new Set<string>();
  for (let index = 0; index < rootNames.length; index++) {
    const name = rootNames[index]!;
    if (consumed.has(name)) continue;
    const value = rootModule[name];
    if (
      value === null ||
      (typeof value !== 'function' && typeof value !== 'object')
    ) {
      continue;
    }

    const group = [name];
    for (let candidateIndex = index + 1; candidateIndex < rootNames.length; candidateIndex++) {
      const candidate = rootNames[candidateIndex]!;
      if (Object.is(value, rootModule[candidate])) {
        group.push(candidate);
      }
    }
    if (group.length > 1) {
      group.forEach((alias) => consumed.add(alias));
      aliases.push(group);
    }
  }

  const normalizeGroups = (groups: readonly (readonly string[])[]) =>
    groups
      .map((group) => [...group].sort().join(' = '))
      .sort()
      .join('\n');
  const expectedAliases = normalizeGroups(ALLOWED_ROOT_RUNTIME_ALIAS_GROUPS);
  const receivedAliases = normalizeGroups(aliases);
  if (receivedAliases !== expectedAliases) {
    fail(
      'Root runtime aliases changed. Prefer one canonical name and a dedicated ' +
      'subpath; add compatibility aliases only through an intentional API review.\n' +
      `Expected:\n${expectedAliases}\nReceived:\n${receivedAliases}`
    );
  }
}

function assertPublicTypeSurface(): void {
  const packageJson = JSON.parse(
    readFileSync(path.join(rootDir, 'package.json'), 'utf8')
  ) as { exports?: PackageExports };
  const packageExports = packageJson.exports ?? {};
  const declarationFiles = walkFiles(distDir)
    .filter((file) => file.endsWith('.d.ts'));
  const program = ts.createProgram({
    rootNames: declarationFiles,
    options: {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      skipLibCheck: true,
    },
  });
  const checker = program.getTypeChecker();

  for (const [subpath, expected] of Object.entries(PUBLIC_TYPE_EXPORT_BASELINE)) {
    const target = packageExports[subpath];
    const typeTarget = typeof target === 'object' ? target.types : undefined;
    if (!typeTarget) {
      fail(`Missing declaration target for public entry point ${subpath}.`);
    }

    const sourceFile = program.getSourceFile(
      path.join(rootDir, typeTarget.replace(/^\.\//, ''))
    );
    const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) {
      fail(`Could not resolve declaration exports for ${subpath}: ${typeTarget}`);
    }

    const names = checker.getExportsOfModule(moduleSymbol)
      .map((symbol) => symbol.getName())
      .sort();
    const sha256 = createHash('sha256')
      .update(names.join('\n'))
      .digest('hex');
    if (names.length !== expected.count || sha256 !== expected.sha256) {
      fail(
        `Type exports changed for ${subpath}: ` +
        `expected ${expected.count}/${expected.sha256}, ` +
        `received ${names.length}/${sha256}. ` +
        'Update the baseline only for an intentional, documented API change.'
      );
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
await assertPublicRuntimeSurface();
assertPublicTypeSurface();
assertNoJsxRuntimeIsPublished();
assertExampleManifestAndScripts();
assertDocsDoNotReferenceKnownBadPatterns();
assertLocalMarkdownLinksResolve();
assertStorybookCoverageIsCurrent();
await assertExperimentalValuesStayIsolated();
await assertMinimalEntryPointIsFocused();
compileExamples();

console.log('[verify:contracts] OK');
