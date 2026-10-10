/**
 * CodeBlock - Syntax highlighted code display
 *
 * @layer Molecule
 * @description Code display with syntax highlighting and line numbers
 *
 * Features:
 * - Multi-language syntax highlighting
 * - Line numbers
 * - Line highlighting
 * - Diff view (added/removed lines)
 * - Copy indicator
 * - Filename header
 * - Theme support
 * - Word wrapping option
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { RichText } from '../primitives/rich-text.js';
import { layoutTextSpans, textSpansEqual, type TextSpan } from '../utils/styled-text.js';
import { stripTerminalControls } from '../utils/terminal-sanitize.js';
import { stringWidth } from '../utils/text-utils.js';
import { DEFAULT_CODE_THEME, highlightCodeSpans, splitCodeSpanLines, type Language, type CodeTheme } from '../utils/code-highlight.js';
export type { Language, CodeTheme } from '../utils/code-highlight.js';

export interface CodeBlockOptions {
  /** Code content */
  code: string;
  /** Language for highlighting */
  language?: Language;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Starting line number */
  startLine?: number;
  /** Lines to highlight (1-indexed) */
  highlightLines?: number[];
  /** Highlight color */
  highlightColor?: string;
  /** Theme */
  theme?: Partial<CodeTheme>;
  /** Filename to display */
  filename?: string;
  /** Show filename header */
  showFilename?: boolean;
  /** Code-row columns including gutters, excluding border and padding. Must be finite and nonnegative. */
  maxWidth?: number;
  /** Word wrap long lines */
  wrap?: boolean;
  /** Show copy button indicator */
  showCopy?: boolean;
  /** Border style */
  borderStyle?: 'none' | 'single' | 'round';
  /** Border color */
  borderColor?: string;
}

/**
 * CodeBlock - Syntax highlighted code display
 *
 * @example
 * CodeBlock({
 *   code: 'const x = 1;',
 *   language: 'typescript',
 *   lineNumbers: true,
 * })
 */
export function CodeBlock(options: CodeBlockOptions): VNode {
  if (options.maxWidth !== undefined && (!Number.isFinite(options.maxWidth) || options.maxWidth < 0)) {
    throw new RangeError('CodeBlock maxWidth must be finite and nonnegative');
  }
  const theme = { ...DEFAULT_CODE_THEME, ...options.theme };
  return renderHighlightedCodeBlock(options, highlightCodeSpans(stripTerminalControls(options.code), options.language ?? 'plain', theme));
}

interface CodeRow { spans: readonly TextSpan[]; nodes: readonly VNode[] }
// Only explicit lexical owners retain rows; standalone CodeBlock remains pure.
const codeRowCaches = new WeakMap<object, { signature: string; rows: readonly CodeRow[] }>();

/** Internal presentation adapter; owned readers can retain fitted visual rows. */
export function renderHighlightedCodeBlock(options: CodeBlockOptions, spans: readonly TextSpan[], owner?: object): VNode {
  const {
    lineNumbers = true,
    startLine = 1,
    highlightLines = [],
    highlightColor = 'warning',
    theme: customTheme = {},
    filename,
    showFilename = true,
    maxWidth,
    wrap = false,
    showCopy = true,
    borderStyle = 'round',
    borderColor = 'border',
  } = options;

  if (maxWidth !== undefined && (!Number.isFinite(maxWidth) || maxWidth < 0)) {
    throw new RangeError('CodeBlock maxWidth must be finite and nonnegative');
  }
  const theme: CodeTheme = { ...DEFAULT_CODE_THEME, ...customTheme };
  const lines = splitCodeSpanLines(spans);
  const lineCount = lines.length;
  const lineNumWidth = String(startLine + lineCount - 1).length;
  const signature = owner ? JSON.stringify([lineNumWidth, { ...options, code: undefined }, theme]) : '';
  const previous = owner ? codeRowCaches.get(owner) : undefined;
  const cached = previous?.signature === signature ? previous.rows : undefined;
  const nextRows: CodeRow[] = [];

  const rows: VNode[] = [];

  // Filename header
  if (filename && showFilename) {
    rows.push(
      Box(
        { flexDirection: 'row', marginBottom: 1 },
        Text({ color: 'primary' }, '📄 '),
        Text({ color: 'foreground', bold: true }, filename),
        showCopy ? Text({ color: 'mutedForeground', dim: true }, '  [copy]') : Text({}, '')
      )
    );
  }

  // Code lines
  for (let i = 0; i < lines.length; i++) {
    const previous = cached?.[i];
    if (previous && textSpansEqual(lines[i], previous.spans)) {
      rows.push(...previous.nodes);
      nextRows.push(previous);
      continue;
    }
    // Do not let one retained row pin an entire old source revision through slices.
    const sourceSpans = owner ? Object.freeze(lines[i]!.map(span => Object.freeze({
      text: span.text.split('').join(''), style: span.style && Object.freeze({ ...span.style }),
    }))) : lines[i]!;
    const nodes: VNode[] = [];
    const lineNum = startLine + i;
    const isHighlighted = highlightLines.includes(lineNum);
    const gutter = (lineNumbers ? `${String(lineNum).padStart(lineNumWidth, ' ')} │ ` : '')
      + (isHighlighted ? '▶ ' : '');
    const gutterWidth = stringWidth(gutter);
    const available = maxWidth === undefined ? undefined : Math.max(0, Math.trunc(maxWidth) - gutterWidth);
    const fitted = available === undefined ? [sourceSpans]
      : available === 0 ? [[]] : layoutTextSpans(sourceSpans, available, wrap ? undefined : 'truncate-end');
    fitted.forEach((spans, continuation) => {
      const prefix = continuation === 0 ? gutter : ' '.repeat(gutterWidth);
      const prefixSpans = [{ text: prefix, style: { color: isHighlighted ? highlightColor : theme.lineNumber, dim: !isHighlighted } }];
      const fittedPrefix = maxWidth !== undefined && gutterWidth > Math.trunc(maxWidth)
        ? Math.trunc(maxWidth) === 0 ? [] : layoutTextSpans(prefixSpans, Math.trunc(maxWidth), 'truncate-end')[0]!
        : prefixSpans;
      // One text flow per visual row: token boundaries never become flex items.
      nodes.push(RichText({ color: 'foreground', backgroundColor: theme.background }, ...fittedPrefix, ...spans));
    });
    rows.push(...nodes);
    if (owner) nextRows.push({ spans: sourceSpans, nodes: Object.freeze(nodes) });
  }
  if (owner) codeRowCaches.set(owner, { signature, rows: Object.freeze(nextRows) });

  // Apply border
  if (borderStyle !== 'none') {
    return Box(
      {
        flexDirection: 'column',
        borderStyle,
        borderColor,
        paddingX: 1,
        paddingY: 0,
      },
      ...rows
    );
  }

  return Box({ flexDirection: 'column' }, ...rows);
}

/**
 * InlineCode - Single line code without line numbers
 *
 * @example
 * InlineCode({ code: 'npm install', language: 'bash' })
 */
export function InlineCode(options: { code: string; language?: Language; color?: string }): VNode {
  const { code, language = 'plain', color = 'primary' } = options;

  if (language === 'plain') {
    return Text({ color, backgroundColor: 'black' }, ` ${code} `);
  }

  return RichText({ color, backgroundColor: 'black' }, ' ',
    ...highlightCodeSpans(stripTerminalControls(code), language), ' ');
}
