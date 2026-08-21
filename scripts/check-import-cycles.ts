import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(rootDir, 'src');

function walkTypeScriptFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) {
      files.push(...walkTypeScriptFiles(absolute));
    } else if (absolute.endsWith('.ts') && !absolute.endsWith('.d.ts')) {
      files.push(path.normalize(absolute));
    }
  }

  return files;
}

function hasRuntimeImport(statement: ts.ImportDeclaration): boolean {
  const clause = statement.importClause;
  if (!clause) return true;
  if (clause.isTypeOnly) return false;
  if (clause.name) return true;

  const bindings = clause.namedBindings;
  if (bindings && ts.isNamedImports(bindings)) {
    return bindings.elements.some((element) => !element.isTypeOnly);
  }

  return true;
}

function hasRuntimeExport(statement: ts.ExportDeclaration): boolean {
  if (statement.isTypeOnly) return false;
  if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) {
    return true;
  }
  return statement.exportClause.elements.some((element) => !element.isTypeOnly);
}

function getRuntimeSpecifiers(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const specifiers: string[] = [];

  for (const statement of source.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      hasRuntimeImport(statement)
    ) {
      specifiers.push(statement.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      hasRuntimeExport(statement)
    ) {
      specifiers.push(statement.moduleSpecifier.text);
    }
  }

  return specifiers;
}

function hasRuntimeSurface(file: string): boolean {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  return source.statements.some((statement) => {
    if (ts.isImportDeclaration(statement)) {
      return false;
    }
    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
      return false;
    }
    if (ts.isExportDeclaration(statement)) {
      return hasRuntimeExport(statement);
    }
    if (
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement))
      && statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword)
    ) {
      return false;
    }
    return true;
  });
}

function resolveRelativeImport(importer: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;

  const unresolved = path.resolve(path.dirname(importer), specifier);
  const extension = path.extname(unresolved);
  const candidates = extension
    ? [
        unresolved,
        unresolved.slice(0, -extension.length) + '.ts',
        unresolved.slice(0, -extension.length) + '.mts',
        unresolved.slice(0, -extension.length) + '.cts',
      ]
    : [
        `${unresolved}.ts`,
        `${unresolved}.mts`,
        `${unresolved}.cts`,
        path.join(unresolved, 'index.ts'),
      ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

const files = walkTypeScriptFiles(sourceDir);
const fileSet = new Set(files);
const graph = new Map<string, string[]>();

for (const file of files) {
  const dependencies = getRuntimeSpecifiers(file)
    .map((specifier) => resolveRelativeImport(file, specifier))
    .filter((dependency): dependency is string => dependency !== null)
    .map(path.normalize)
    .filter((dependency) => fileSet.has(dependency));
  graph.set(file, [...new Set(dependencies)]);
}

let nextIndex = 0;
const indexes = new Map<string, number>();
const lowLinks = new Map<string, number>();
const stack: string[] = [];
const onStack = new Set<string>();
const cycles: string[][] = [];

function visit(file: string): void {
  const index = nextIndex++;
  indexes.set(file, index);
  lowLinks.set(file, index);
  stack.push(file);
  onStack.add(file);

  for (const dependency of graph.get(file) ?? []) {
    if (!indexes.has(dependency)) {
      visit(dependency);
      lowLinks.set(file, Math.min(lowLinks.get(file)!, lowLinks.get(dependency)!));
    } else if (onStack.has(dependency)) {
      lowLinks.set(file, Math.min(lowLinks.get(file)!, indexes.get(dependency)!));
    }
  }

  if (lowLinks.get(file) !== indexes.get(file)) return;

  const component: string[] = [];
  let member: string | undefined;
  do {
    member = stack.pop();
    if (!member) break;
    onStack.delete(member);
    component.push(member);
  } while (member !== file);

  const hasSelfCycle =
    component.length === 1 && (graph.get(component[0]!) ?? []).includes(component[0]!);
  if (component.length > 1 || hasSelfCycle) {
    cycles.push(component);
  }
}

for (const file of files) {
  if (!indexes.has(file)) visit(file);
}

if (cycles.length > 0) {
  console.error(`[check:cycles] Found ${cycles.length} runtime import cycle(s):`);
  for (const component of cycles) {
    const display = component
      .map((file) => path.relative(rootDir, file).replaceAll(path.sep, '/'))
      .sort();
    console.error(`\n- ${display.join('\n  ↔ ')}`);
  }
  process.exitCode = 1;
} else {
  console.log(`[check:cycles] No runtime import cycles across ${files.length} source files.`);
}

const componentLayerOrder = new Map([
  ['primitives', 0],
  ['atoms', 1],
  ['molecules', 2],
  ['organisms', 3],
  ['templates', 4],
]);

function sourceLayer(file: string): string | null {
  const relative = path.relative(sourceDir, file).replaceAll(path.sep, '/');
  const segment = relative.split('/')[0]!;
  return componentLayerOrder.has(segment) ? segment : null;
}

const layerViolations: string[] = [];
for (const [file, dependencies] of graph) {
  const ownerLayer = sourceLayer(file);
  if (!ownerLayer) continue;
  const ownerRank = componentLayerOrder.get(ownerLayer)!;
  for (const dependency of dependencies) {
    const dependencyLayer = sourceLayer(dependency);
    if (!dependencyLayer) continue;
    const dependencyRank = componentLayerOrder.get(dependencyLayer)!;
    if (dependencyRank <= ownerRank) continue;
    layerViolations.push(
      `${path.relative(rootDir, file).replaceAll(path.sep, '/')} -> ` +
      `${path.relative(rootDir, dependency).replaceAll(path.sep, '/')}`,
    );
  }
}

if (layerViolations.length > 0) {
  console.error('[check:cycles] Found component layer inversion(s):');
  for (const violation of layerViolations.sort()) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log('[check:cycles] Component dependency direction is valid.');
}

const directHookContextConsumers = files
  .filter((file) => {
    const layer = sourceLayer(file);
    return layer === 'atoms' || layer === 'molecules' || layer === 'organisms' || layer === 'templates';
  })
  .filter((file) =>
    getRuntimeSpecifiers(file).some((specifier) =>
      /(?:^|\/)hooks\/context(?:\.js)?$/u.test(specifier)
    )
  )
  .map((file) => path.relative(rootDir, file).replaceAll(path.sep, '/'))
  .sort();

if (directHookContextConsumers.length > 0) {
  console.error(
    '[check:cycles] UI components must use lifecycle hosts instead of hooks/context directly:',
  );
  for (const file of directHookContextConsumers) {
    console.error(`- ${file}`);
  }
  process.exitCode = 1;
} else {
  console.log('[check:cycles] UI components use the canonical lifecycle boundary.');
}

interface LocalFunctionInfo {
  exportedComponent: boolean;
  directLifecycleCall: boolean;
  localCalls: Set<string>;
}

function hasExportModifier(node: ts.Node): boolean {
  return ts.canHaveModifiers(node)
    && ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true;
}

function collectLifecycleOwnershipViolations(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const lifecycleCalls = new Set<string>();
  const functions = new Map<string, LocalFunctionInfo>();

  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement)
      || !ts.isStringLiteral(statement.moduleSpecifier)
      || !/(?:^|\/)hooks\//u.test(statement.moduleSpecifier.text)
    ) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      const imported = element.propertyName?.text ?? element.name.text;
      if (/^use[A-Z]/u.test(imported)) lifecycleCalls.add(element.name.text);
    }
  }

  const inspectFunction = (
    name: string,
    node: ts.FunctionLikeDeclaration,
    exportedComponent: boolean,
  ): void => {
    const info: LocalFunctionInfo = {
      exportedComponent,
      directLifecycleCall: false,
      localCalls: new Set(),
    };
    const visit = (child: ts.Node): void => {
      if (child !== node && ts.isFunctionLike(child)) return;
      if (ts.isCallExpression(child) && ts.isIdentifier(child.expression)) {
        const called = child.expression.text;
        if (lifecycleCalls.has(called)) info.directLifecycleCall = true;
        info.localCalls.add(called);
      }
      ts.forEachChild(child, visit);
    };
    if (node.body) visit(node.body);
    functions.set(name, info);
  };

  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && statement.body) {
      inspectFunction(
        statement.name.text,
        statement,
        hasExportModifier(statement) && /^[A-Z]/u.test(statement.name.text),
      );
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    const exported = hasExportModifier(statement);
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      const initializer = declaration.initializer;
      if (
        (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
        && initializer.body
      ) {
        inspectFunction(
          declaration.name.text,
          initializer,
          exported && /^[A-Z]/u.test(declaration.name.text),
        );
      }
    }
  }

  const lifecycleMemo = new Map<string, boolean>();
  const ownsLifecycleTransitively = (name: string, visiting = new Set<string>()): boolean => {
    const memoized = lifecycleMemo.get(name);
    if (memoized !== undefined) return memoized;
    const info = functions.get(name);
    if (!info || visiting.has(name)) return false;
    if (info.directLifecycleCall) {
      lifecycleMemo.set(name, true);
      return true;
    }
    const nextVisiting = new Set(visiting).add(name);
    const result = [...info.localCalls].some((called) =>
      ownsLifecycleTransitively(called, nextVisiting)
    );
    lifecycleMemo.set(name, result);
    return result;
  };

  return [...functions.entries()]
    .filter(([name, info]) => info.exportedComponent && ownsLifecycleTransitively(name))
    .map(([name]) => name)
    .sort();
}

const unownedStatefulComponents = files
  .filter((file) => sourceLayer(file) !== null)
  .flatMap((file) => collectLifecycleOwnershipViolations(file).map((componentName) =>
    `${path.relative(rootDir, file).replaceAll(path.sep, '/')}: ${componentName}`
  ))
  .sort();

if (unownedStatefulComponents.length > 0) {
  console.error('[check:cycles] Stateful UI exports must be defined through component():');
  for (const violation of unownedStatefulComponents) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log('[check:cycles] Every stateful UI export has an explicit ComponentOwner.');
}

const forbiddenV2Symbols = [
  'createFocusAdapter',
  'FocusContext',
  'themeColor',
  'themeSpacing',
  'hasComponentRenderLifecycle',
  'createInputState',
  'applyInputAction',
  'parseInput',
  'KeyboardProtocol',
] as const;
const freeFormProps = new Set([
  'BoxProps',
  'TextProps',
  'TransformProps',
  'VStackProps',
  'HStackProps',
  'CenterProps',
  'FullScreenProps',
  'GridOptions',
  'ScreenProps',
  'MainProps',
  'FooterProps',
  'SidebarProps',
  'PanelProps',
]);
const compatibilityViolations: string[] = [];

for (const file of files) {
  const sourceText = readFileSync(file, 'utf8');
  const relative = path.relative(rootDir, file).replaceAll(path.sep, '/');
  for (const symbol of forbiddenV2Symbols) {
    if (new RegExp(`\\b${symbol}\\b`, 'u').test(sourceText)) {
      compatibilityViolations.push(`${relative}: forbidden v1 symbol ${symbol}`);
    }
  }
  if (/@deprecated\b/u.test(sourceText)) {
    compatibilityViolations.push(`${relative}: @deprecated API in clean v2 source`);
  }

  const source = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  for (const statement of source.statements) {
    if (!ts.isInterfaceDeclaration(statement) || !freeFormProps.has(statement.name.text)) {
      continue;
    }
    const children = statement.members.find((member) =>
      ts.isPropertySignature(member)
      && member.name !== undefined
      && ts.isIdentifier(member.name)
      && member.name.text === 'children'
    );
    if (children) {
      compatibilityViolations.push(
        `${relative}: ${statement.name.text}.children duplicates variadic composition`,
      );
    }
  }
}

if (compatibilityViolations.length > 0) {
  console.error('[check:cycles] Found v1 source-compatibility shims:');
  for (const violation of compatibilityViolations.sort()) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log('[check:cycles] Clean-v2 API invariants are valid.');
}

type PackageExportTarget =
  | string
  | { import?: string; default?: string; types?: string };

const packageJson = JSON.parse(
  readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
) as {
  exports?: Record<string, PackageExportTarget>;
  bin?: Record<string, string>;
};

function sourceFileForBuildTarget(target: string | undefined): string | null {
  if (!target?.startsWith('./dist/') || !target.endsWith('.js')) {
    return null;
  }
  const relative = target
    .slice('./dist/'.length)
    .replace(/\.js$/u, '.ts');
  const sourceFile = path.normalize(path.join(sourceDir, relative));
  return fileSet.has(sourceFile) ? sourceFile : null;
}

const entryFiles = new Set<string>();
for (const target of Object.values(packageJson.exports ?? {})) {
  const runtimeTarget = typeof target === 'string'
    ? target
    : target.import ?? target.default;
  const sourceFile = sourceFileForBuildTarget(runtimeTarget);
  if (sourceFile) entryFiles.add(sourceFile);
}
for (const target of Object.values(packageJson.bin ?? {})) {
  const sourceFile = sourceFileForBuildTarget(
    target.startsWith('./') ? target : `./${target}`,
  );
  if (sourceFile) entryFiles.add(sourceFile);
}

const reachable = new Set<string>();
function visitReachable(file: string): void {
  if (reachable.has(file)) return;
  reachable.add(file);
  for (const dependency of graph.get(file) ?? []) {
    visitReachable(dependency);
  }
}
for (const entryFile of entryFiles) {
  visitReachable(entryFile);
}

const unreachableRuntimeFiles = files
  .filter((file) => !reachable.has(file) && hasRuntimeSurface(file))
  .map((file) => path.relative(rootDir, file).replaceAll(path.sep, '/'))
  .sort();

if (unreachableRuntimeFiles.length > 0) {
  console.error(
    `[check:cycles] Found ${unreachableRuntimeFiles.length} runtime source file(s) ` +
    'that are unreachable from package entry points:',
  );
  for (const file of unreachableRuntimeFiles) {
    console.error(`- ${file}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `[check:cycles] All runtime source files are reachable from ${entryFiles.size} package entry points.`,
  );
}
