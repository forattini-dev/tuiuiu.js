import {
  getCommonMistake,
  getCommonMistakeDocsPath,
  type CommonMistakeEntry,
} from '../core/common-mistakes.js';
import type { CodeValidationIssue, CodeValidationResult } from './types.js';

export type ValidationSeverity = CodeValidationIssue['severity'];

interface ComponentFunctionBlock {
  name: string;
  start: number;
  openBrace: number;
  end: number;
}

interface ParsedCall {
  name: string;
  start: number;
  line: number;
  args: string[];
}

function lineNumberAt(text: string, index: number): number {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor++) {
    if (text[cursor] === '\n') {
      line++;
    }
  }
  return line;
}

function skipString(text: string, index: number, quote: string): number {
  let cursor = index + 1;
  while (cursor < text.length) {
    const char = text[cursor]!;
    if (char === '\\') {
      cursor += 2;
      continue;
    }
    if (char === quote) {
      return cursor;
    }
    cursor++;
  }
  return text.length - 1;
}

function findMatchingBrace(text: string, openIndex: number, openChar: string, closeChar: string): number {
  let depth = 0;

  for (let index = openIndex; index < text.length; index++) {
    const char = text[index]!;
    const next = text[index + 1];

    if (char === '"' || char === '\'' || char === '`') {
      index = skipString(text, index, char);
      continue;
    }

    if (char === '/' && next === '/') {
      while (index < text.length && text[index] !== '\n') {
        index++;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < text.length && !(text[index] === '*' && text[index + 1] === '/')) {
        index++;
      }
      index++;
      continue;
    }

    if (char === openChar) {
      depth++;
      continue;
    }

    if (char === closeChar) {
      depth--;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (let index = 0; index < text.length; index++) {
    const char = text[index]!;
    const next = text[index + 1];

    if (char === '"' || char === '\'' || char === '`') {
      const end = skipString(text, index, char);
      current += text.slice(index, end + 1);
      index = end;
      continue;
    }

    if (char === '/' && next === '/') {
      const start = index;
      while (index < text.length && text[index] !== '\n') {
        index++;
      }
      current += text.slice(start, index);
      continue;
    }

    if (char === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < text.length && !(text[index] === '*' && text[index + 1] === '/')) {
        index++;
      }
      current += text.slice(start, Math.min(text.length, index + 2));
      index++;
      continue;
    }

    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
    if (char === '[') bracketDepth++;
    if (char === ']') bracketDepth--;

    if (char === ',' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function parseObjectLiteral(text: string): Record<string, string> {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return {};
  }

  const body = trimmed.slice(1, -1);
  const entries = splitTopLevel(body);
  const result: Record<string, string> = {};

  for (const entry of entries) {
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;

    for (let index = 0; index < entry.length; index++) {
      const char = entry[index]!;
      if (char === '(') parenDepth++;
      if (char === ')') parenDepth--;
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
      if (char === '[') bracketDepth++;
      if (char === ']') bracketDepth--;

      if (char === ':' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
        const key = entry.slice(0, index).trim().replace(/^['"]|['"]$/g, '');
        const value = entry.slice(index + 1).trim();
        result[key] = value;
        break;
      }
    }
  }

  return result;
}

function findComponentFunctions(code: string): ComponentFunctionBlock[] {
  const patterns = [
    /function\s+([A-Z][A-Za-z0-9_]*)\s*\([^)]*\)\s*\{/g,
    /(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>\s*\{/g,
  ];

  const blocks: ComponentFunctionBlock[] = [];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(code)) !== null) {
      const openBrace = match.index + match[0].length - 1;
      const end = findMatchingBrace(code, openBrace, '{', '}');
      if (end === -1) {
        continue;
      }

      blocks.push({
        name: match[1]!,
        start: match.index,
        openBrace,
        end,
      });
    }
  }

  return blocks.sort((left, right) => left.start - right.start);
}

function findTopLevelCalls(code: string, callee: string): number[] {
  const positions: number[] = [];
  let braceDepth = 0;

  for (let index = 0; index < code.length; index++) {
    const char = code[index]!;
    const next = code[index + 1];

    if (char === '"' || char === '\'' || char === '`') {
      index = skipString(code, index, char);
      continue;
    }

    if (char === '/' && next === '/') {
      while (index < code.length && code[index] !== '\n') {
        index++;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < code.length && !(code[index] === '*' && code[index + 1] === '/')) {
        index++;
      }
      index++;
      continue;
    }

    if (char === '{') {
      braceDepth++;
      continue;
    }

    if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (braceDepth !== 0) {
      continue;
    }

    if (code.startsWith(callee, index)) {
      const before = code[index - 1];
      const after = code[index + callee.length];
      if ((!before || !/[A-Za-z0-9_$]/.test(before)) && after?.match(/\s|\(/)) {
        let cursor = index + callee.length;
        while (cursor < code.length && /\s/.test(code[cursor]!)) {
          cursor++;
        }
        if (code[cursor] === '(') {
          positions.push(index);
        }
      }
    }
  }

  return positions;
}

function findComponentCalls(code: string, names: readonly string[]): ParsedCall[] {
  const calls: ParsedCall[] = [];

  for (const name of names) {
    const pattern = new RegExp(`\\b${name}\\s*\\(`, 'g');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(code)) !== null) {
      const openParen = code.indexOf('(', match.index);
      const closeParen = findMatchingBrace(code, openParen, '(', ')');
      if (closeParen === -1) {
        continue;
      }

      const argsText = code.slice(openParen + 1, closeParen);
      calls.push({
        name,
        start: match.index,
        line: lineNumberAt(code, match.index),
        args: splitTopLevel(argsText),
      });
    }
  }

  return calls.sort((left, right) => left.start - right.start);
}

function makeIssue(
  code: CommonMistakeEntry['code'],
  severity: ValidationSeverity,
  line: number | undefined,
  evidence: string | undefined,
): CodeValidationIssue {
  const mistake = getCommonMistake(code);
  return {
    code,
    title: mistake.title,
    severity,
    summary: mistake.summary,
    fix: mistake.rightExample,
    reference: `${getCommonMistakeDocsPath(code)} | tuiuiu://guide/common-mistakes`,
    line,
    evidence,
  };
}

function validateSignalsInsideRender(code: string): CodeValidationIssue[] {
  const issues: CodeValidationIssue[] = [];
  const blocks = findComponentFunctions(code);

  for (const block of blocks) {
    const body = code.slice(block.openBrace + 1, block.end);
    const match = /\bcreateSignal\s*\(/.exec(body);
    if (!match) {
      continue;
    }

    const absoluteIndex = block.openBrace + 1 + match.index;
    issues.push(
      makeIssue(
        'signals-inside-component-render',
        'error',
        lineNumberAt(code, absoluteIndex),
        `${block.name} contains createSignal() inside component render.`,
      ),
    );
  }

  return issues;
}

function validateThemeTiming(code: string): CodeValidationIssue[] {
  const renderCalls = findTopLevelCalls(code, 'render');
  const setThemeCalls = findTopLevelCalls(code, 'setTheme');

  if (renderCalls.length === 0 || setThemeCalls.length === 0) {
    return [];
  }

  const firstRender = renderCalls[0]!;
  const hasThemeBeforeRender = setThemeCalls.some((position) => position < firstRender);
  const lateTheme = setThemeCalls.find((position) => position > firstRender);

  if (hasThemeBeforeRender || lateTheme === undefined) {
    return [];
  }

  return [
    makeIssue(
      'theme-after-render',
      'warning',
      lineNumberAt(code, lateTheme),
      'Top-level setTheme() appears after the first render() call.',
    ),
  ];
}

function validateApiPatterns(code: string): CodeValidationIssue[] {
  const issues: CodeValidationIssue[] = [];
  const calls = findComponentCalls(code, ['Page', 'AppShell', 'Modal', 'ScrollList', 'Static', 'Tabs', 'Accordion']);

  for (const call of calls) {
    if ((call.name === 'Page' || call.name === 'AppShell' || call.name === 'Modal') && call.args.length > 1) {
      issues.push(
        makeIssue(
          'api-pattern-mismatch',
          'warning',
          call.line,
          `${call.name} looks like a props-pattern component being called with variadic children.`,
        ),
      );
      continue;
    }

    if (call.args.length === 0) {
      continue;
    }

    const props = parseObjectLiteral(call.args[0]!);

    if ((call.name === 'Tabs' || call.name === 'Accordion') && 'children' in props) {
      issues.push(
        makeIssue(
          'api-pattern-mismatch',
          'warning',
          call.line,
          `${call.name} is data-driven but the snippet passes top-level children.`,
        ),
      );
      continue;
    }

    if (call.name === 'Modal' && 'children' in props) {
      issues.push(
        makeIssue(
          'api-pattern-mismatch',
          'warning',
          call.line,
          'Modal expects `content`, not `children`.',
        ),
      );
      continue;
    }

    if ((call.name === 'ScrollList' || call.name === 'Static') && 'children' in props) {
      const childrenValue = props.children!;
      const isRenderFn = /=>/.test(childrenValue) || /^function\b/.test(childrenValue);
      if (!isRenderFn) {
        issues.push(
          makeIssue(
            'api-pattern-mismatch',
            'warning',
            call.line,
            `${call.name} expects children to be a render function.`,
          ),
        );
      }
    }
  }

  return issues;
}

function dedupeIssues(issues: CodeValidationIssue[]): CodeValidationIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}:${issue.line ?? 0}:${issue.evidence ?? ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function validateTuiuiuCode(code: string): CodeValidationResult {
  const issues = dedupeIssues([
    ...validateSignalsInsideRender(code),
    ...validateThemeTiming(code),
    ...validateApiPatterns(code),
  ]).sort((left, right) => (left.line ?? 0) - (right.line ?? 0));

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function formatValidationResult(result: CodeValidationResult): string {
  if (result.ok) {
    return [
      '# Validation Result',
      '',
      'No known Tuiuiu runtime anti-patterns were detected in this snippet.',
      '',
      'This is heuristic, not a parser. For component child/content rules, also check `tuiuiu_api_patterns` and `tuiuiu://guide/common-mistakes`.',
    ].join('\n');
  }

  const lines = [
    '# Validation Result',
    '',
    `${result.issues.length} issue${result.issues.length === 1 ? '' : 's'} found.`,
    '',
  ];

  for (const issue of result.issues) {
    lines.push(`## ${issue.title}`);
    lines.push('');
    lines.push(`- Severity: ${issue.severity}`);
    if (issue.line !== undefined) {
      lines.push(`- Line: ${issue.line}`);
    }
    if (issue.evidence) {
      lines.push(`- Detected: ${issue.evidence}`);
    }
    lines.push(`- Why it matters: ${issue.summary}`);
    lines.push(`- Reference: ${issue.reference}`);
    lines.push('');
    lines.push('Suggested fix:');
    lines.push('```typescript');
    lines.push(issue.fix);
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}
