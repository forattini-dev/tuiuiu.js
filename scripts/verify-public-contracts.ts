import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

import { examplesManifest } from '../examples/manifest.ts';
import { allComponents } from '../src/mcp/docs-data.ts';
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
  '.': { count: 75, sha256: 'cdf3f47b85db365e8057665f0cc55a447c29921f7b0c916142a1d9c24168ac0d' },
  './app': { count: 32, sha256: 'd08b02c74c80ad1febacee383efc71802924d009978b1978b5020d8f8f61ee13' },
  './colors': { count: 72, sha256: 'c9ceb73af03412b2071453c24d5af717dbac1d290ca213dc111a9065313176b6' },
  './core': { count: 54, sha256: '0db99838957036fa4e12ee1682f5c1bb0f4e6198c874953c7979b0c62131c6d1' },
  './devtools': { count: 49, sha256: 'b180c9d39546737c5929714eb5274d0e711456003d252a9e2cacdf4ad3736718' },
  './interaction': { count: 38, sha256: '52558859c57573434f6de20d7764963c0f1d1a776e92796da863ffcaa6a2e0a0' },
  './mcp': { count: 18, sha256: 'e2a3f373802073dd340f9659b977a00d99cce62282cae80847f6aca1f30d02dc' },
  './storybook': { count: 29, sha256: '179e7e8000ee02fb9bb37f1e8a2714067c6f6a63b5ece1153eea82cb97c30552' },
  './testing': { count: 19, sha256: '6438cfb01cad7867eff8e9d34bf1dfd31d5b9c5e3477c28794ccd05fd0be6522' },
  './ui': { count: 460, sha256: 'eb767c42fd1066a0d5f1d9f4f8c7faac3d44080670b269460b39748a3e995d89' },
} as const;

const PUBLIC_TYPE_EXPORT_BASELINE = {
  '.': { count: 108, sha256: 'e4a3d3c517e5860ac847e5e9f6a92fe97146066a22c9581e7b6bb022ee600813' },
  './app': { count: 61, sha256: 'c8cabd7bfa5da5b75b063aa0868c208d9015460881337b252aa8c062314ff49b' },
  './colors': { count: 74, sha256: '37e4e8b8998c7086a67d16e4295315093a8b3708392cb9b5e9f987ed37d3159a' },
  './core': { count: 94, sha256: '5ee19ef951a1094294782127028c8edd72119069747c6152edb218b020ee7f0b' },
  './devtools': { count: 77, sha256: '7e1ca88fb61615aa946095e57c7890c7fef45e70ce8f57b5b21991703fc6af3e' },
  './interaction': { count: 132, sha256: '80017877669472113c3227698a793e48b3d53a7c1deee6cc24d6e711d6eb1416' },
  './mcp': { count: 40, sha256: '47e4dc4b5bb46ce6efeec12f40d975a26e72f872de331920321c18911c746d5c' },
  './storybook': { count: 53, sha256: '6bf91cdc208541dc2a38088ca8334b4cb9ab2d65751a932e1e1dfa970d63ac2a' },
  './testing': { count: 33, sha256: '0f509db270b221b359ba31c052d41e6265d06828fd2631a6701b71bd4c700410' },
  './ui': { count: 909, sha256: '70b1a50bd7117ffcbeff2f39e1d1bc3a876951cecff77d9b5830fe0e6bf46260' },
} as const;

const ALLOWED_ROOT_RUNTIME_ALIAS_GROUPS = [] as const;

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

function assertMcpPropsMatchPublicTypes(): void {
  const componentNames = allComponents.map((component) => component.name);
  const duplicateComponentNames = componentNames.filter(
    (name, index) => componentNames.indexOf(name) !== index,
  );
  if (duplicateComponentNames.length > 0) {
    fail(
      'MCP component names are ambiguous across documentation catalogs:\n- ' +
      [...new Set(duplicateComponentNames)].sort().join('\n- '),
    );
  }

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
  const uiSource = program.getSourceFile(path.join(distDir, 'ui', 'index.d.ts'));
  if (!uiSource) {
    fail('UI declaration file is unavailable for MCP contract validation.');
  }
  const uiSymbol = checker.getSymbolAtLocation(uiSource);
  if (!uiSymbol) {
    fail('UI declaration module has no symbol for MCP contract validation.');
  }
  const publicSymbols = new Map(
    checker.getExportsOfModule(uiSymbol).map((symbol) => [symbol.name, symbol]),
  );
  const missingProps: string[] = [];
  const requirednessMismatches: string[] = [];
  const missingComponents: string[] = [];
  const componentCategories = new Set([
    'primitives',
    'atoms',
    'molecules',
    'organisms',
    'templates',
  ]);

  for (const component of allComponents) {
    if (!componentCategories.has(component.category)) continue;
    const exported = publicSymbols.get(component.name);
    if (!exported) {
      missingComponents.push(component.name);
      continue;
    }
    if (component.props.length === 0) continue;
    const symbol = exported.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(exported)
      : exported;
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!declaration) continue;
    const signatures = checker.getSignaturesOfType(
      checker.getTypeOfSymbolAtLocation(symbol, declaration),
      ts.SignatureKind.Call,
    );
    if (signatures.length === 0) continue;
    const publicProps = new Map<string, boolean>();
    const firstParameterProps: Array<Map<string, boolean>> = [];
    const recordProp = (name: string, required: boolean): void => {
      const existing = publicProps.get(name);
      publicProps.set(name, existing === undefined ? required : existing && required);
    };
    const collectTypePaths = (
      type: ts.Type,
      prefix: string,
      depth: number,
    ): void => {
      if (depth < 0) return;
      for (const property of checker.getPropertiesOfType(type)) {
        const pathName = prefix ? `${prefix}.${property.name}` : property.name;
        recordProp(pathName, (property.flags & ts.SymbolFlags.Optional) === 0);
        if (depth === 0) continue;
        const propertyDeclaration =
          property.valueDeclaration ?? property.declarations?.[0] ?? declaration;
        collectTypePaths(
          checker.getTypeOfSymbolAtLocation(property, propertyDeclaration),
          pathName,
          depth - 1,
        );
      }
    };

    for (const signature of signatures) {
      signature.parameters.forEach((parameter, index) => {
        const parameterName = parameter.name;
        recordProp(parameterName, index < signature.minArgumentCount);
        const parameterDeclaration =
          parameter.valueDeclaration ?? parameter.declarations?.[0] ?? declaration;
        const parameterType = checker.getTypeOfSymbolAtLocation(
          parameter,
          parameterDeclaration,
        );
        collectTypePaths(parameterType, parameterName, 2);
        if (index === 0) {
          collectTypePaths(parameterType, '', 2);
          firstParameterProps.push(new Map(
            checker.getPropertiesOfType(parameterType).map((property) => [
              property.name,
              (property.flags & ts.SymbolFlags.Optional) === 0,
            ]),
          ));
        }
      });
    }

    const topLevelNames = new Set(
      firstParameterProps.flatMap((props) => [...props.keys()]),
    );
    for (const name of topLevelNames) {
      publicProps.set(
        name,
        firstParameterProps.every((props) => props.get(name) === true),
      );
    }

    for (const prop of component.props) {
      const publicRequired = publicProps.get(prop.name);
      if (publicRequired === undefined) {
        missingProps.push(`${component.name}.${prop.name}`);
      } else if (!prop.name.includes('.') && publicRequired !== prop.required) {
        requirednessMismatches.push(
          `${component.name}.${prop.name}: docs=${prop.required ? 'required' : 'optional'}, ` +
          `types=${publicRequired ? 'required' : 'optional'}`,
        );
      }
    }
  }

  if (
    missingComponents.length > 0
    || missingProps.length > 0
    || requirednessMismatches.length > 0
  ) {
    const sections = [
      missingComponents.length > 0
        ? 'Components absent from their documented public contract:\n- ' +
          [...new Set(missingComponents)].sort().join('\n- ')
        : '',
      missingProps.length > 0
        ? 'Props absent from the public TypeScript contract:\n- ' +
          missingProps.sort().join('\n- ')
        : '',
      requirednessMismatches.length > 0
        ? 'Required/optional mismatches:\n- ' +
          requirednessMismatches.sort().join('\n- ')
        : '',
    ].filter(Boolean);
    fail(
      'MCP component contracts diverge from public TypeScript declarations:\n' +
      sections.join('\n'),
    );
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
assertMcpPropsMatchPublicTypes();
assertNoJsxRuntimeIsPublished();
assertExampleManifestAndScripts();
assertDocsDoNotReferenceKnownBadPatterns();
assertLocalMarkdownLinksResolve();
assertStorybookCoverageIsCurrent();
compileExamples();

console.log('[verify:contracts] OK');
