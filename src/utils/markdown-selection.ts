import { createMarkdownDocument, getMarkdownNodeSource, type MarkdownNode } from './markdown-document.js';
import { projectInlineMarkdown, type InlineMarkdownTheme } from './markdown-inline.js';
import { composeTextProjection, createTextProjectionBuilder, projectedSourceRange, type TextProjection } from './text-projection.js';
import type { TextSpan, TextSpanStyle } from './styled-text.js';
import { stripTerminalControls } from './terminal-sanitize.js';
import { clampToGraphemeBoundary } from './grapheme.js';
import { DEFAULT_CODE_THEME, highlightCodeSpans, normalizeCodeLanguage, type CodeTheme } from './code-highlight.js';
import { createTextDocument } from '../interaction/text-document.js';
import { createTextSelection, type TextSelection } from '../interaction/text-selection.js';

const DEFAULT_THEME = { bold: 'foreground', italic: 'foreground', link: 'info', code: 'primary',
  heading: 'accent', blockquote: 'mutedForeground', listMarker: 'primary' };

export interface MarkdownSelectionOptions {
  showLinkUrls?: boolean;
  theme?: Partial<InlineMarkdownTheme & { heading: string; blockquote: string; listMarker: string }>;
  /** Lexical fenced-code highlighting (default true); never changes display/source offsets. */
  highlightCode?: boolean;
  /** Token colors only: the compact reader has no code gutters or block background. */
  codeTheme?: Partial<Omit<CodeTheme, 'lineNumber' | 'background'>>;
}

export interface MarkdownSelection {
  /** Display-document selection. Never interpret these offsets as source offsets. */
  readonly selection: TextSelection;
  readonly disposed: boolean;
  snapshot(): { readonly source: string; readonly spans: readonly TextSpan[] };
  update(source: string, options?: MarkdownSelectionOptions): boolean;
  sourceRange(): { start: number; end: number } | null;
  copyText(mode?: 'display' | 'source'): string;
  subscribe(listener: () => void): () => void;
  dispose(): void;
}

/** Compact selectable reader projection, sharing the existing bounded Markdown parser. */
export function createMarkdownSelection(initialSource = '', initialOptions: MarkdownSelectionOptions = {}): MarkdownSelection {
  const markdown = createMarkdownDocument();
  const document = createTextDocument();
  const selection = createTextSelection(document);
  const listeners = new Set<() => void>();
  let source = '';
  let options = initialOptions;
  let signature = '';
  let initialized = false;
  let disposed = false;
  let projection: TextProjection = createTextProjectionBuilder().finish();
  const assertActive = () => { if (disposed) throw new Error('MarkdownSelection has been disposed'); };
  const assertProjection = () => {
    if (document.snapshot().value !== projection.text) {
      throw new Error('MarkdownSelection display document was modified directly; use controller.update()');
    }
  };
  const update = (nextSource: string, nextOptions = options): boolean => {
    assertActive();
    assertProjection();
    const theme = { ...DEFAULT_THEME, ...nextOptions.theme };
    const codeTheme = { ...DEFAULT_CODE_THEME, ...nextOptions.codeTheme };
    const nextSignature = JSON.stringify([theme, nextOptions.showLinkUrls ?? true, nextOptions.highlightCode ?? true, codeTheme]);
    if (initialized && nextSource === source && nextSignature === signature) return false;
    const builder = createTextProjectionBuilder();
    const text = (node: MarkdownNode, style?: TextSpanStyle, inline = true) => {
      const content = createTextProjectionBuilder();
      for (const part of getMarkdownNodeSource(node).parts) content.append(part.text, style, part.start, part.end);
      const raw = content.finish();
      if (!inline) {
        builder.appendProjection(node.type === 'codeblock' && nextOptions.highlightCode !== false
          && normalizeCodeLanguage(node.language) !== 'plain'
          ? { ...raw, spans: highlightCodeSpans(raw.text, normalizeCodeLanguage(node.language), codeTheme) } : raw);
        return;
      }
      const formatted = composeTextProjection(projectInlineMarkdown(raw.text, theme, nextOptions.showLinkUrls), raw);
      builder.appendProjection({ ...formatted, spans: formatted.spans.map(span => ({ text: span.text, style: { ...style, ...span.style } })) });
    };
    const nodes = markdown.update(nextSource);
    nodes.forEach((node, index) => {
      if (index > 0) builder.append('\n');
      switch (node.type) {
        case 'newline': break;
        case 'header':
          builder.append('#'.repeat(node.level ?? 1) + ' ', { color: theme.heading, bold: true });
          text(node, { color: theme.heading, bold: true }); break;
        case 'paragraph': text(node); break;
        case 'blockquote':
          builder.append('│ ', { color: theme.blockquote });
          text(node, { color: theme.blockquote, italic: true }); break;
        case 'list':
          node.children?.forEach((item, itemIndex) => {
            if (itemIndex > 0) builder.append('\n');
            const marker = node.ordered ? `${itemIndex + 1}. ` : item.checked === undefined ? '• ' : item.checked ? '☑ ' : '☐ ';
            builder.append(marker, { color: theme.listMarker });
            text(item);
          }); break;
        case 'codeblock': text(node, { color: theme.code }, false); break;
        case 'table': text(node, undefined, false); break;
        case 'hr': builder.append('───', { color: 'border' }); break;
      }
    });
    const nextProjection = builder.finish();
    const previous = document.snapshot().value;
    let prefix = 0;
    while (prefix < previous.length && prefix < nextProjection.text.length && previous[prefix] === nextProjection.text[prefix]) prefix++;
    prefix = Math.min(clampToGraphemeBoundary(previous, prefix, 'left'), clampToGraphemeBoundary(nextProjection.text, prefix, 'left'));
    let suffix = 0;
    while (suffix < previous.length - prefix && suffix < nextProjection.text.length - prefix
      && previous[previous.length - suffix - 1] === nextProjection.text[nextProjection.text.length - suffix - 1]) suffix++;
    suffix = Math.min(previous.length - clampToGraphemeBoundary(previous, previous.length - suffix, 'right'),
      nextProjection.text.length - clampToGraphemeBoundary(nextProjection.text, nextProjection.text.length - suffix, 'right'));
    // Regional-indicator parity can shift boundaries throughout a common suffix.
    // Prefer a larger replacement over retaining half a flag or repeatedly scanning.
    if (clampToGraphemeBoundary(previous, previous.length - suffix, 'right') !== previous.length - suffix
      || clampToGraphemeBoundary(nextProjection.text, nextProjection.text.length - suffix, 'right') !== nextProjection.text.length - suffix) suffix = 0;
    // Mapping and style data become current before document/selection subscribers run.
    source = nextSource;
    projection = nextProjection;
    options = { showLinkUrls: nextOptions.showLinkUrls, theme: { ...nextOptions.theme },
      highlightCode: nextOptions.highlightCode, codeTheme: { ...nextOptions.codeTheme } };
    signature = nextSignature;
    initialized = true;
    document.replace(prefix, previous.length - suffix, projection.text.slice(prefix, projection.text.length - suffix));
    for (const listener of [...listeners]) listener();
    return true;
  };
  const sourceRange = () => {
    assertProjection();
    const { start, end } = selection.snapshot();
    if (start === end) return null;
    // Full-document copy retains leading/trailing fences and concealed syntax.
    if (start === 0 && end === projection.text.length) return { start: 0, end: source.length };
    const range = projectedSourceRange(projection, start, end);
    return range && { start: clampToGraphemeBoundary(source, range.start, 'left'),
      end: clampToGraphemeBoundary(source, range.end, 'right') };
  };
  update(initialSource, initialOptions);
  return {
    selection,
    get disposed() { return disposed; },
    snapshot() { assertProjection(); return Object.freeze({ source, spans: projection.spans }); },
    update,
    sourceRange,
    copyText(mode = 'display') {
      assertProjection();
      if (mode !== 'display' && mode !== 'source') throw new RangeError('Markdown copy mode must be display or source');
      if (mode === 'display') return selection.copyText();
      const range = sourceRange();
      return range ? stripTerminalControls(source.slice(range.start, range.end)) : '';
    },
    subscribe(listener) { assertActive(); listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose() {
      if (disposed) return;
      disposed = true;
      selection.dispose();
      listeners.clear();
    },
  };
}
