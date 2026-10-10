import { describe, expect, it } from 'vitest';
import { Markdown, createMarkdownDocument } from '../../src/molecules/markdown.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { TerminalMessage } from '../../src/molecules/terminal-message.js';
import { createFrameSnapshot } from '../../src/core/frame.js';
import { renderFrameToCellBuffer } from '../../src/core/delta-render.js';
import { renderToString } from '../../src/core/renderer.js';
import { stripTerminalControls } from '../../src/utils/terminal-sanitize.js';

describe('Markdown inline text flow', () => {
  const plain = (content: string, width = 40) => stripTerminalControls(renderToString(Markdown({ content, maxWidth: width }), width));
  it('wraps words across style boundaries as a single paragraph', () => {
    expect(plain('hello **world** again', 12).split('\n').map(line => line.trimEnd()).slice(0, 2))
      .toEqual(['hello world', 'again']);
  });
  it('composes nested emphasis without leaking its delimiters', () => {
    expect(plain('**bold and *italic* together**')).toContain('bold and italic together');
    const buffer = renderFrameToCellBuffer(createFrameSnapshot(Markdown({ content: '**bold and *italic* together**', maxWidth: 40 }), { width: 40, height: 4 }));
    expect(buffer.get(9, 0)!.attrs).toMatchObject({ bold: true, italic: true });
    expect(buffer.get(0, 0)!.attrs.bold).toBe(true);
    expect(buffer.get(25, 0)!.attrs.italic).not.toBe(true);
  });
  it('honors escaped delimiters, literal code and intraword underscores', () => {
    expect(plain('\\*literal\\* snake_case `**literal**`')).toContain('*literal* snake_case  **literal** ');
  });
  it('keeps formatted labels and balanced link destinations', () => {
    expect(plain('[**docs**](https://example.org/a_(b))', 80)).toContain('docs (https://example.org/a_(b))');
  });
  it.each(['**bold *italic***', '*italic **bold***', '***bold italic***'])('handles nested delimiters sharing a closing run: %s', content => {
    expect(plain(content)).not.toContain('*');
  });
  it('flows formatted headings, list items and quotes through the same text path', () => {
    expect(plain('# **Title**')).toContain('# Title');
    expect(plain('- **hello** *world* again', 12)).not.toContain('*');
    expect(plain('> **hello** *world*')).not.toContain('*');
  });
  it('makes link URLs optional and keeps code spans with embedded single backticks literal', () => {
    const result = stripTerminalControls(renderToString(Markdown({ content: '[docs](https://example.org)', showLinkUrls: false }), 40));
    expect(result).toBe('docs');
    expect(plain('``a `b` c``')).toContain(' a `b` c ');
  });
  it('allows semantic block overrides and default fallback without caching caller state', () => {
    const document = createMarkdownDocument('body\n\n# title');
    let label = 'first';
    const renderNode: NonNullable<Parameters<typeof Markdown>[0]['renderNode']> = (node, context) =>
      node.type === 'paragraph' ? Box({ id: 'custom', onClick: () => {} }, Text({}, label)) : context.defaultRender();
    const options = { content: document.snapshot().content, document, renderNode };
    expect(stripTerminalControls(renderToString(Markdown(options), 40))).toContain('first');
    label = 'second';
    const next = Markdown(options);
    expect(stripTerminalControls(renderToString(next, 40))).toContain('second');
    expect(createFrameSnapshot(next, { width: 40, height: 8 }).hitTargets.some(target => target.node.props.id === 'custom')).toBe(true);
    expect(stripTerminalControls(renderToString(Markdown({ ...options, renderNode: () => null }), 40))).toContain('body');
  });
  it('preserves malformed text rather than recursing or repeatedly searching without a bound', () => {
    const source = ('[ * _ ` `` ``` \\* unmatched '.repeat(200));
    expect(plain(source, 80).length).toBeGreaterThan(0);
  });
  it.each([false, true])('forwards inline and block options through TerminalMessage (streaming=%s)', streaming => {
    const message = TerminalMessage({
      content: '[docs](https://example.org)', streaming, streamingMarkdown: true, showRole: false,
      showLinkUrls: false,
      renderNode: (_node, { defaultRender }) => Box({}, Text({}, 'custom'), defaultRender()),
    });
    const result = stripTerminalControls(renderToString(message, 40));
    expect(result).toContain('custom');
    expect(result).toContain('docs');
    expect(result).not.toContain('https');
  });
});
