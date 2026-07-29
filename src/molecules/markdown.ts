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
import type { VNode } from '../utils/types.js';
import { CodeBlock, type CodeBlockOptions, type Language } from './code-block.js';
import { padTextToWidth, stringWidth } from '../utils/text-utils.js';

type MarkdownCodeBlockOptions = Partial<Omit<CodeBlockOptions, 'code'>>;

export interface MarkdownOptions {
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

interface ParsedNode {
  type: string;
  content?: string;
  children?: ParsedNode[];
  language?: string;
  level?: number;
  ordered?: boolean;
  checked?: boolean;
  url?: string;
  alt?: string;
  filename?: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  'javascript',
  'typescript',
  'python',
  'json',
  'yaml',
  'bash',
  'shell',
  'html',
  'css',
  'sql',
  'go',
  'rust',
  'markdown',
  'diff',
  'plain',
];

const LANGUAGE_ALIASES: Record<string, Language> = {
  cjs: 'javascript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  yml: 'yaml',
  sh: 'shell',
  zsh: 'shell',
  fish: 'shell',
  md: 'markdown',
  patch: 'diff',
  text: 'plain',
  plaintext: 'plain',
};

function normalizeLanguage(language?: string): Language {
  const normalized = (language || '').trim().toLowerCase().replace(/^\./, '');
  if (!normalized) return 'plain';
  if ((SUPPORTED_LANGUAGES as string[]).includes(normalized)) return normalized as Language;
  return LANGUAGE_ALIASES[normalized] ?? 'plain';
}

function tokenizeFenceInfo(info: string): string[] {
  const tokens: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(info)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? '');
  }

  return tokens.filter(Boolean);
}

function parseFenceInfo(info: string): { language: Language; filename?: string } {
  const tokens = tokenizeFenceInfo(info);
  let language: Language = 'plain';
  let filename: string | undefined;

  const first = tokens[0];
  if (first && !first.includes('=')) {
    language = normalizeLanguage(first);
    tokens.shift();
  }

  for (const token of tokens) {
    const keyValue = token.match(/^(?:file|filename|path|title)=(.+)$/i);
    if (keyValue) {
      filename = keyValue[1].replace(/^["']|["']$/g, '');
      continue;
    }

    if (!token.includes('=') && !filename) {
      filename = token;
    }
  }

  return { language, filename };
}

function getFenceStart(line: string): { char: '`' | '~'; length: number; info: string } | null {
  const match = line.match(/^(`{3,}|~{3,})(.*)$/);
  if (!match) return null;

  const fence = match[1];
  return {
    char: fence[0] as '`' | '~',
    length: fence.length,
    info: match[2].trim(),
  };
}

function isFenceClose(line: string, char: '`' | '~', minLength: number): boolean {
  const trimmed = line.trim();
  let length = 0;

  while (trimmed[length] === char) {
    length++;
  }

  return length >= minLength && trimmed.slice(length).trim() === '';
}

/**
 * Parse markdown into AST
 */
function parseMarkdown(markdown: string): ParsedNode[] {
  const lines = markdown.split('\n');
  const nodes: ParsedNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      nodes.push({ type: 'newline' });
      i++;
      continue;
    }

    // Code block (fenced)
    const fenceStart = getFenceStart(line);
    if (fenceStart) {
      const { language, filename } = parseFenceInfo(fenceStart.info);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !isFenceClose(lines[i], fenceStart.char, fenceStart.length)) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push({
        type: 'codeblock',
        content: codeLines.join('\n'),
        language,
        filename,
      });
      if (i < lines.length) i++; // Skip closing fence
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      nodes.push({
        type: 'header',
        level: headerMatch[1].length,
        content: headerMatch[2],
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      nodes.push({ type: 'hr' });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith('>') || (lines[i].trim() && !lines[i].match(/^[#\-*>]/)))) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      nodes.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
      });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const listItems: ParsedNode[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-*+]\s/, '');
        // Check for task list
        const taskMatch = itemText.match(/^\[([ xX])\]\s(.+)$/);
        if (taskMatch) {
          listItems.push({
            type: 'listitem',
            content: taskMatch[2],
            checked: taskMatch[1].toLowerCase() === 'x',
          });
        } else {
          listItems.push({
            type: 'listitem',
            content: itemText,
          });
        }
        i++;
      }
      nodes.push({
        type: 'list',
        ordered: false,
        children: listItems,
      });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const listItems: ParsedNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s/, '');
        listItems.push({
          type: 'listitem',
          content: itemText,
        });
        i++;
      }
      nodes.push({
        type: 'list',
        ordered: true,
        children: listItems,
      });
      continue;
    }

    // Table
    if (line.includes('|') && lines[i + 1]?.includes('|') && /^[\s|:-]+$/.test(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      nodes.push({
        type: 'table',
        content: tableLines.join('\n'),
      });
      continue;
    }

    // Paragraph (collect consecutive non-empty lines)
    const paragraphLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('>') && !/^[-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) && !getFenceStart(lines[i])) {
      paragraphLines.push(lines[i]);
      i++;
    }
    if (paragraphLines.length > 0) {
      nodes.push({
        type: 'paragraph',
        content: paragraphLines.join(' '),
      });
    }
  }

  return nodes;
}

/**
 * Parse inline markdown formatting
 */
function parseInline(text: string, theme: typeof DEFAULT_THEME): VNode[] {
  const parts: VNode[] = [];

  // Process inline elements
  const patterns: Array<{ regex: RegExp; render: (m: string, url?: string) => VNode }> = [
    // Bold + italic
    { regex: /\*\*\*(.+?)\*\*\*/g, render: (m: string) => Text({ color: theme.bold, bold: true, italic: true }, m) },
    // Bold
    { regex: /\*\*(.+?)\*\*/g, render: (m: string) => Text({ color: theme.bold, bold: true }, m) },
    { regex: /__(.+?)__/g, render: (m: string) => Text({ color: theme.bold, bold: true }, m) },
    // Italic
    { regex: /\*(.+?)\*/g, render: (m: string) => Text({ color: theme.italic, italic: true }, m) },
    { regex: /_(.+?)_/g, render: (m: string) => Text({ color: theme.italic, italic: true }, m) },
    // Strikethrough
    { regex: /~~(.+?)~~/g, render: (m: string) => Text({ strikethrough: true }, m) },
    // Inline code
    { regex: /`([^`]+)`/g, render: (m: string) => Text({ color: theme.code, backgroundColor: 'black' }, ` ${m} `) },
    // Links
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, render: (m: string, url?: string) => Box({ flexDirection: 'row' }, Text({ color: theme.link, underline: true }, m), Text({ color: 'mutedForeground', dim: true }, ` (${url})`)) },
    // Images
    { regex: /!\[([^\]]*)\]\(([^)]+)\)/g, render: (alt: string, url?: string) => Box({ flexDirection: 'row' }, Text({ color: 'warning' }, '🖼️ '), Text({ color: 'mutedForeground' }, alt || 'image'), Text({ color: 'mutedForeground', dim: true }, ` (${url})`)) },
  ];

  const matches: Array<{ index: number; length: number; vnode: VNode }> = [];

  // Find all matches
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, 'g');
    while ((match = regex.exec(text)) !== null) {
      const isLink = pattern.regex.source.includes('\\]\\(');
      const isImage = pattern.regex.source.includes('!\\[');
      let vnode: VNode;
      if (isLink || isImage) {
        vnode = pattern.render(match[1], match[2]);
      } else {
        vnode = pattern.render(match[1]);
      }
      matches.push({
        index: match.index,
        length: match[0].length,
        vnode,
      });
    }
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Build output, skipping overlapping matches
  let pos = 0;
  for (const match of matches) {
    if (match.index < pos) continue; // Skip overlapping

    // Add text before match
    if (match.index > pos) {
      parts.push(Text({}, text.slice(pos, match.index)));
    }

    // Add match
    parts.push(match.vnode);
    pos = match.index + match.length;
  }

  // Add remaining text
  if (pos < text.length) {
    parts.push(Text({}, text.slice(pos)));
  }

  return parts.length > 0 ? parts : [Text({}, text)];
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
        Text({ color, bold: true }, prefix + node.content)
      );
    }

    case 'paragraph': {
      const inline = parseInline(node.content || '', theme);
      return Box({ marginBottom: 1, flexDirection: 'row', flexWrap: 'wrap' }, ...inline);
    }

    case 'codeblock': {
      const codeBlockOptions = options.codeBlock ?? {};
      return Box(
        { marginBottom: 1 },
        CodeBlock({
          ...codeBlockOptions,
          code: node.content || '',
          language: normalizeLanguage(node.language),
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
            Text({ color: theme.blockquote, italic: true }, line)
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
          const inline = parseInline(item.content || '', theme);
          return Box(
            { flexDirection: 'row' },
            Text({ color: theme.listMarker }, marker),
            ...inline
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
  const { content, maxWidth, ...rest } = options;
  const nodes = parseMarkdown(content);

  // Use maxWidth if provided, otherwise fill available space from parent
  // This enables flexWrap to work - without a width constraint, flexbox never wraps
  const width = maxWidth ?? '100%';

  return Box(
    {
      flexDirection: 'column',
      width,
    },
    ...nodes.map((node) => renderNode(node, { ...rest, maxWidth }))
  );
}

/**
 * renderMarkdown - Render markdown string to VNode (alias)
 */
export function renderMarkdown(markdown: string, options: MarkdownOptions = {}): VNode {
  return Markdown({ content: markdown, ...options });
}
