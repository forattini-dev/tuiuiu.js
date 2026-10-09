/**
 * Renderer-independent Markdown blocks. Only a grammar-stable prefix is retained:
 * an unfinished line, paragraph, table or fence can still change its meaning.
 */
export interface MarkdownNode {
  readonly type: string;
  readonly content?: string;
  readonly children?: readonly MarkdownNode[];
  readonly language?: string;
  readonly level?: number;
  readonly ordered?: boolean;
  readonly checked?: boolean;
  readonly filename?: string;
}

export interface MarkdownDocumentSnapshot {
  content: string;
  revision: number;
  blockCount: number;
  /** UTF-16 offset where the most recent update began parsing. */
  reparsedFrom: number;
  reusedBlockCount: number;
}

export interface MarkdownDocument {
  update(content: string): readonly MarkdownNode[];
  snapshot(): MarkdownDocumentSnapshot;
}

interface Block { node: MarkdownNode; end: number; stable: boolean }

function fenceStart(line: string) {
  const match = line.match(/^(`{3,}|~{3,})(.*)$/);
  return match ? { char: match[1]![0]!, length: match[1]!.length, info: match[2]!.trim() } : null;
}

function fenceClose(line: string, char: string, length: number) {
  const trimmed = line.trim();
  let count = 0;
  while (trimmed[count] === char) count++;
  return count >= length && trimmed.slice(count).trim() === '';
}

function fenceInfo(info: string): { language: string; filename?: string } {
  // Keep quoted key/value pairs intact, including filenames containing spaces.
  const tokens = info.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  const first = tokens[0];
  const language = first && !first.includes('=') ? tokens.shift()! : 'plain';
  let filename: string | undefined;
  for (const token of tokens) {
    const named = token.match(/^(?:file|filename|path|title)=(.+)$/i);
    if (named) filename = named[1]!.replace(/^["']|["']$/g, '');
    else if (!token.includes('=') && !filename) filename = token.replace(/^["']|["']$/g, '');
  }
  return { language, filename };
}

const heading = /^(#{1,6})\s+(.+)$/;
const rule = /^(-{3,}|\*{3,}|_{3,})$/;
const unordered = /^[-*+]\s/;
const ordered = /^\d+\.\s/;

function parse(content: string, base: number): Block[] {
  const lines = content.split('\n');
  const offsets = [0];
  for (const line of lines) offsets.push(offsets[offsets.length - 1]! + line.length + 1);
  const blocks: Block[] = [];
  let i = 0;
  const blankDelimiter = () => i < lines.length - 1 && !lines[i]!.trim();
  const emit = (node: MarkdownNode, stable: boolean) => {
    if (node.children) Object.freeze(node.children);
    blocks.push({ node: Object.freeze(node), stable,
      end: base + Math.min(content.length, offsets[i]!) });
  };
  const tableStart = (index: number) => lines[index]!.includes('|')
    && lines[index + 1]?.includes('|') && /^[\s|:-]+$/.test(lines[index + 1]!);
  const blockStart = (index: number): boolean => {
    const line = lines[index]!;
    return heading.test(line) || rule.test(line.trim()) || line.startsWith('>')
      || unordered.test(line) || ordered.test(line) || !!fenceStart(line) || !!tableStart(index);
  };

  while (i < lines.length) {
    const line = lines[i]!;
    const fence = fenceStart(line);
    const header = line.match(heading);
    if (!line.trim()) {
      i++;
      emit({ type: 'newline' }, i < lines.length);
    } else if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !fenceClose(lines[i]!, fence.char, fence.length)) code.push(lines[i++]!);
      const closed = i < lines.length;
      if (closed) i++;
      emit({ type: 'codeblock', content: code.join('\n'), ...fenceInfo(fence.info) }, closed && i < lines.length);
    } else if (header) {
      i++;
      emit({ type: 'header', level: header[1]!.length, content: header[2] }, i < lines.length);
    } else if (rule.test(line.trim())) {
      i++;
      emit({ type: 'hr' }, i < lines.length);
    } else if (line.startsWith('>')) {
      const quote: string[] = [];
      do { quote.push(lines[i++]!.replace(/^>\s?/, '')); }
      while (i < lines.length && (lines[i]!.startsWith('>') || (lines[i]!.trim() && !blockStart(i))));
      emit({ type: 'blockquote', content: quote.join('\n') }, blankDelimiter());
    } else if (unordered.test(line) || ordered.test(line)) {
      const isOrdered = ordered.test(line);
      const pattern = isOrdered ? ordered : unordered;
      const children: MarkdownNode[] = [];
      while (i < lines.length && pattern.test(lines[i]!)) {
        const text = lines[i++]!.replace(pattern, '');
        const task = !isOrdered && text.match(/^\[([ xX])\]\s(.+)$/);
        children.push(Object.freeze(task
          ? { type: 'listitem', content: task[2], checked: task[1]!.toLowerCase() === 'x' }
          : { type: 'listitem', content: text }));
      }
      emit({ type: 'list', ordered: isOrdered, children }, blankDelimiter());
    } else if (tableStart(i)) {
      const table: string[] = [];
      while (i < lines.length && lines[i]!.includes('|')) table.push(lines[i++]!);
      emit({ type: 'table', content: table.join('\n') }, blankDelimiter());
    } else {
      // Always consume the first line: #without-space is an ordinary paragraph.
      const paragraph = [lines[i++]!];
      while (i < lines.length && lines[i]!.trim() && !blockStart(i)) paragraph.push(lines[i++]!);
      emit({ type: 'paragraph', content: paragraph.join(' ') }, blankDelimiter());
    }
  }
  return blocks;
}

/** Append updates reuse stable AST identities; other edits safely reparse all blocks. */
export function createMarkdownDocument(initialContent = ''): MarkdownDocument {
  let content = '';
  let revision = 0;
  let initialized = false;
  let blocks: Block[] = [];
  let nodes: readonly MarkdownNode[] = [];
  let reparsedFrom = 0;
  let reusedBlockCount = 0;
  const update = (next: string) => {
    if (initialized && next === content) return nodes;
    const prefix: Block[] = [];
    if (initialized && next.startsWith(content)) {
      for (const block of blocks) {
        if (!block.stable) break;
        prefix.push(block);
      }
    }
    reparsedFrom = prefix[prefix.length - 1]?.end ?? 0;
    reusedBlockCount = prefix.length;
    blocks = [...prefix, ...parse(next.slice(reparsedFrom), reparsedFrom)];
    nodes = Object.freeze(blocks.map(block => block.node));
    content = next;
    if (initialized) revision++;
    initialized = true;
    return nodes;
  };
  update(initialContent);
  return { update, snapshot: () => ({ content, revision, blockCount: nodes.length, reparsedFrom, reusedBlockCount }) };
}

