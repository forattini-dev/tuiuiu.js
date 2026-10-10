/**
 * Markdown - Terminal markdown renderer
 *
 * @layer Molecule
 * @description Rich markdown rendering with syntax highlighting
 *
 * Features:
 * - Headers (h1-h6)
 * - Bold, italic, strikethrough
 * - Code blocks with syntax highlighting
 * - Inline code
 * - Blockquotes
 * - Ordered and unordered lists
 * - Links and images (shows URL)
 * - Horizontal rules
 * - Tables
 * - Task lists
 * - Line wrapping
 */

import { Box, Text, Newline } from '../primitives/nodes.js';
import type { TextProps, VNode } from '../utils/types.js';
import { RichText } from '../primitives/rich-text.js';
import { parseInlineMarkdown } from '../utils/markdown-inline.js';
import { CodeBlock, type CodeBlockOptions } from './code-block.js';
import { normalizeCodeLanguage } from '../utils/code-highlight.js';
import { padTextToWidth, stringWidth } from '../utils/text-utils.js';
import { createMarkdownDocument, type MarkdownDocument, type MarkdownNode as ParsedNode } from '../utils/markdown-document.js';

export { createMarkdownDocument, type MarkdownDocument, type MarkdownNode, type MarkdownDocumentSnapshot } from '../utils/markdown-document.js';

type MarkdownCodeBlockOptions = Partial<Omit<CodeBlockOptions, 'code'>>;

export interface MarkdownOptions {
  /** Retain completed blocks across streaming updates; one document per message. */
  document?: MarkdownDocument;
  /** Max width for text wrapping */
  maxWidth?: number;
  /** Theme colors */
  theme?: {
    h1?: string;
    h2?: string;
    h3?: string;
    h4?: string;
    h5?: string;
    h6?: string;
    bold?: string;
    italic?: string;
    link?: string;
    code?: string;
    blockquote?: string;
    listMarker?: string;
    hr?: string;
  };
  /** Show code block line numbers */
  codeLineNumbers?: boolean;
  /** Default options passed to fenced CodeBlock renderers */
  codeBlock?: MarkdownCodeBlockOptions;
  /** Indent size for nested elements */
  indentSize?: number;
  /** Keep link destinations visible by default; false displays labels only. */
  showLinkUrls?: boolean;
  /** Custom semantic block renderer. null/undefined falls back to the default. */
  renderNode?: (node: ParsedNode, context: { defaultRender: () => VNode }) => VNode | null | undefined;
}

const DEFAULT_THEME = {
  h1: 'accent',
  h2: 'primary',
  h3: 'info',
  h4: 'success',
  h5: 'warning',
  h6: 'foreground',
  bold: 'foreground',
  italic: 'foreground',
  link: 'info',
  code: 'primary',
  blockquote: 'mutedForeground',
  listMarker: 'primary',
  hr: 'border',
};


/** Compose styles in data, then lay out one paragraph instead of flex children. */
function inlineText(text: string, theme: typeof DEFAULT_THEME, options: MarkdownOptions, props: TextProps = {}): VNode {
  return RichText(props, ...parseInlineMarkdown(text, theme, options.showLinkUrls));
}

/**
 * Render markdown node to VNode
 */
function renderNode(node: ParsedNode, options: MarkdownOptions): VNode {
  const theme = { ...DEFAULT_THEME, ...options.theme };

  switch (node.type) {
    case 'newline':
      return Newline();

    case 'header': {
      const level = node.level || 1;
      const colors = [theme.h1, theme.h2, theme.h3, theme.h4, theme.h5, theme.h6];
      const color = colors[level - 1] || theme.h6;
      const prefix = level === 1 ? '# ' : level === 2 ? '## ' : `${'#'.repeat(level)} `;
      return Box(
        { marginBottom: 1 },
        inlineText(prefix + (node.content ?? ''), theme, options, { color, bold: true })
      );
    }

    case 'paragraph': {
      return Box({ marginBottom: 1 }, inlineText(node.content || '', theme, options));
    }

    case 'codeblock': {
      const codeBlockOptions = options.codeBlock ?? {};
      return Box(
        { marginBottom: 1 },
        CodeBlock({
          ...codeBlockOptions,
          code: node.content || '',
          language: normalizeCodeLanguage(node.language),
          filename: node.filename ?? codeBlockOptions.filename,
          lineNumbers: options.codeLineNumbers ?? codeBlockOptions.lineNumbers ?? true,
          borderStyle: codeBlockOptions.borderStyle ?? 'round',
          maxWidth: codeBlockOptions.maxWidth ?? options.maxWidth,
        })
      );
    }

    case 'blockquote': {
      const quoteLines = (node.content || '').split('\n');
      return Box(
        { marginBottom: 1, flexDirection: 'column' },
        ...quoteLines.map((line) =>
          Box(
            { flexDirection: 'row' },
            Text({ color: theme.blockquote }, '│ '),
            Box({ flexGrow: 1 }, inlineText(line, theme, options, { color: theme.blockquote, italic: true }))
          )
        )
      );
    }

    case 'list': {
      const items = node.children || [];
      return Box(
        { marginBottom: 1, flexDirection: 'column' },
        ...items.map((item, i) => {
          const marker = node.ordered
            ? `${i + 1}. `
            : item.checked !== undefined
            ? item.checked ? '☑ ' : '☐ '
            : '• ';
          return Box(
            { flexDirection: 'row' },
            Text({ color: theme.listMarker }, marker),
            Box({ flexGrow: 1 }, inlineText(item.content || '', theme, options))
          );
        })
      );
    }

    case 'hr':
      return Box(
        { marginY: 1 },
        Text({ color: theme.hr }, '─'.repeat(options.maxWidth || 40))
      );

    case 'table': {
      const tableLines = (node.content || '').split('\n');
      if (tableLines.length < 2) return Box({});

      // Parse table
      const parseRow = (line: string) =>
        line.split('|').map((cell) => cell.trim()).filter(Boolean);

      const headers = parseRow(tableLines[0]);
      const rows = tableLines.slice(2).map(parseRow);

      // Calculate column widths
      const widths = headers.map((h, i) => {
        let max = stringWidth(h);
        for (const row of rows) {
          if (row[i]) max = Math.max(max, stringWidth(row[i]));
        }
        return max + 2;
      });

      // Render table
      const tableRows: VNode[] = [];

      // Header
      tableRows.push(
        Box(
          { flexDirection: 'row' },
          Text({ color: 'border' }, '│'),
          ...headers.map((h, i) => [
            Text(
              { color: 'foreground', bold: true },
              ` ${padTextToWidth(h, widths[i] - 1)}`,
            ),
            Text({ color: 'border' }, '│'),
          ]).flat()
        )
      );

      // Separator
      tableRows.push(
        Box(
          { flexDirection: 'row' },
          Text({ color: 'border' }, '├'),
          ...widths.map((w, i) => [
            Text({ color: 'border' }, '─'.repeat(w)),
            Text({ color: 'border' }, i < widths.length - 1 ? '┼' : '┤'),
          ]).flat()
        )
      );

      // Rows
      for (const row of rows) {
        tableRows.push(
          Box(
            { flexDirection: 'row' },
            Text({ color: 'border' }, '│'),
            ...headers.map((_, i) => [
              Text({}, ` ${padTextToWidth(row[i] || '', widths[i] - 1)}`),
              Text({ color: 'border' }, '│'),
            ]).flat()
          )
        );
      }

      return Box({ marginBottom: 1, flexDirection: 'column' }, ...tableRows);
    }

    default:
      return Box({});
  }
}

const documentRenderCaches = new WeakMap<MarkdownDocument, {
  signature: string;
  nodes: WeakMap<ParsedNode, VNode>;
}>();

/**
 * Markdown - Render markdown content
 *
 * @example
 * Markdown({
 *   content: '# Hello World\n\nThis is **bold** text.',
 *   maxWidth: 80,
 * })
 */
export function Markdown(options: MarkdownOptions & { content: string }): VNode {
  const { content, maxWidth, document, ...rest } = options;
  const nodes = (document ?? createMarkdownDocument(content)).update(content);
  const renderOptions = { ...rest, maxWidth };
  // User renderers may depend on external reactive state: never cache their VNodes.
  let cache = document && !rest.renderNode ? documentRenderCaches.get(document) : undefined;
  if (document && !rest.renderNode) {
    const signature = JSON.stringify(renderOptions);
    if (!cache || cache.signature !== signature) {
      cache = { signature, nodes: new WeakMap() };
      documentRenderCaches.set(document, cache);
    }
  }

  // Use maxWidth if provided, otherwise fill available space from parent
  // This enables flexWrap to work - without a width constraint, flexbox never wraps
  const width = maxWidth ?? '100%';

  return Box(
    {
      flexDirection: 'column',
      width,
    },
    ...nodes.map((node) => {
      const previous = cache?.nodes.get(node);
      if (previous) return previous;
      const defaultRender = () => renderNode(node, renderOptions);
      const rendered = renderOptions.renderNode?.(node, { defaultRender }) ?? defaultRender();
      cache?.nodes.set(node, rendered);
      return rendered;
    })
  );
}

/**
 * renderMarkdown - Render markdown string to VNode (alias)
 */
export function renderMarkdown(markdown: string, options: MarkdownOptions = {}): VNode {
  return Markdown({ content: markdown, ...options });
}
