import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCommonMistakeReference } from './common-mistakes.js';
import { getRenderPhaseMode, isRenderingHooks } from '../hooks/context.js';

type StackSite = {
  filePath: string;
  line?: number;
  column?: number;
};

const warnedKeys = new Set<string>();
const currentFilePath = path.normalize(fileURLToPath(import.meta.url));
const srcRoot = path.dirname(path.dirname(currentFilePath));
const packageRoot = path.dirname(srcRoot);

let signalCreationSuppressionDepth = 0;

function isDevWarningEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function normalizeMaybeFileUrl(value: string): string {
  if (value.startsWith('file://')) {
    return path.normalize(fileURLToPath(value));
  }
  return path.normalize(value);
}

function isInternalLibraryPath(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(packageRoot)) {
    return false;
  }

  return normalized.includes(`${path.sep}src${path.sep}`) || normalized.includes(`${path.sep}dist${path.sep}`);
}

function formatDisplayPath(site: StackSite): string {
  const relative = path.relative(process.cwd(), site.filePath);
  const displayPath = relative && !relative.startsWith('..') ? relative : site.filePath;

  if (site.line === undefined) {
    return displayPath;
  }

  return `${displayPath}:${site.line}`;
}

function extractStackSites(stack: string | undefined, excludedModuleUrls: readonly string[] = []): StackSite[] {
  if (!stack) {
    return [];
  }

  const excludedPaths = new Set<string>([
    currentFilePath,
    ...excludedModuleUrls.map(normalizeMaybeFileUrl),
  ]);

  const lines = stack.split('\n').slice(1);
  const sites: StackSite[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/\(?((?:file:\/\/)?[^():]+):(\d+):(\d+)\)?$/);
    if (!match) {
      continue;
    }

    const filePath = normalizeMaybeFileUrl(match[1]!);
    if (excludedPaths.has(filePath)) {
      continue;
    }

    sites.push({
      filePath,
      line: Number.parseInt(match[2]!, 10),
      column: Number.parseInt(match[3]!, 10),
    });
  }

  return sites;
}

export function warnOnce(key: string, message: string): void {
  if (!isDevWarningEnabled() || warnedKeys.has(key)) {
    return;
  }

  warnedKeys.add(key);
  console.warn(`[tuiuiu] ${message}`);
}

export function allowInternalSignalCreationDuringRender<T>(fn: () => T): T {
  signalCreationSuppressionDepth++;
  try {
    return fn();
  } finally {
    signalCreationSuppressionDepth = Math.max(0, signalCreationSuppressionDepth - 1);
  }
}

export function warnIfCreateSignalDuringComponentRender(stack: string | undefined, callerModuleUrl: string): void {
  if (!isDevWarningEnabled() || signalCreationSuppressionDepth > 0) {
    return;
  }

  if (!isRenderingHooks() || getRenderPhaseMode() !== 'component') {
    return;
  }

  const site = extractStackSites(stack, [callerModuleUrl])[0];
  if (!site || isInternalLibraryPath(site.filePath)) {
    return;
  }

  const location = formatDisplayPath(site);
  warnOnce(
    `create-signal-in-render:${location}`,
    `createSignal() was called during component render at ${location}. This recreates state every render. Move it to module scope or use useState(). ${getCommonMistakeReference('signals-inside-component-render')}`,
  );
}

export function warnIfPropsPatternUsedVariadically(
  componentName: string,
  argumentCount: number,
  example: string,
): void {
  if (argumentCount <= 1) {
    return;
  }

  warnOnce(
    `api-pattern:${componentName}:variadic`,
    `${componentName} does not accept variadic children. Use ${example} instead. ${getCommonMistakeReference('api-pattern-mismatch')}`,
  );
}

export function warnIfRenderFunctionPatternMisused(
  componentName: string,
  propName: string,
  value: unknown,
  example: string,
): void {
  if (value === undefined || typeof value === 'function') {
    return;
  }

  warnOnce(
    `api-pattern:${componentName}:${propName}`,
    `${componentName} expects \`${propName}\` to be a render function. Use ${example} instead. ${getCommonMistakeReference('api-pattern-mismatch')}`,
  );
}

export function warnIfDataDrivenPatternMisused(
  componentName: string,
  condition: boolean,
  message: string,
  issueKey = 'data',
): void {
  if (!condition) {
    return;
  }

  warnOnce(
    `api-pattern:${componentName}:${issueKey}`,
    `${message} ${getCommonMistakeReference('api-pattern-mismatch')}`,
  );
}

export function warnIfUnexpectedPropProvided(
  componentName: string,
  propName: string,
  value: unknown,
  message: string,
): void {
  if (value === undefined) {
    return;
  }

  warnOnce(
    `api-pattern:${componentName}:unexpected-prop:${propName}`,
    `${message} ${getCommonMistakeReference('api-pattern-mismatch')}`,
  );
}

export function __resetDevWarningsForTesting(): void {
  warnedKeys.clear();
  signalCreationSuppressionDepth = 0;
}
