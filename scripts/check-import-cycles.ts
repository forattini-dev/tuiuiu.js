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
