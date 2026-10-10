import { describe, expect, it } from 'vitest';
import { FilePreview } from '../../src/organisms/file-browser.js';
import { createFrameSnapshot } from '../../src/core/frame.js';
import { renderFrameToCellBuffer } from '../../src/core/delta-render.js';
import { renderToString } from '../../src/core/renderer.js';
import { stripAnsi } from '../../src/utils/text-utils.js';
import { tokenizeLines } from '../../src/utils/code-tokenizer.js';
import { tokensToSpans } from '../../src/utils/code-highlight.js';

function preview(content: string, extension = 'ts', extra: Partial<Parameters<typeof FilePreview>[0]> = {}) {
  return FilePreview({ item: { name: `file.${extension}`, path: `/file.${extension}`, type: 'file', extension },
    content, syntaxHighlight: true, lineNumbers: false, ...extra });
}

describe('FilePreview shared structured highlighting', () => {
  it.each([
    ['ts', '/* first\nconst fake = 42;\n*/ const real = 1;', 'gray'],
    ['rs', '/* outer /* nested */\nstill outer\n*/ fn real() {}', 'gray'],
    ['sql', "select 'first\n-- still a string\nlast'", 'green'],
    ['py', 'text = """first\n# still a string\nlast"""', 'green'],
    ['go', 'text := `first\n// still a string\nlast`', 'green'],
  ])('carries lexical state across %s rows without embedding ANSI', (extension, source, color) => {
    const node = preview(source, extension);
    const expected = tokenizeLines(source, extension);
    node.children.forEach((row, index) => {
      const text = row.children[0]!;
      expect(text.type).toBe('text');
      expect(text.children).toHaveLength(0);
      expect(text.props.children).toBe(expected[index]!.raw);
      expect(text.props.children).not.toContain('\x1b');
      expect(text.props.__textSpans).toEqual(tokensToSpans(expected[index]!.tokens));
    });
    const frame = createFrameSnapshot(node, { width: 80, height: 10 });
    expect(frame.drawCommands).toHaveLength(3);
    expect(renderFrameToCellBuffer(frame).get(0, 1)?.fg).toBe(color);
    expect(stripAnsi(renderToString(node, 80))).toContain(source.split('\n')[1]);
  });
  it('keeps the visible prefix correctly colored when the closing delimiter is beyond maxLines', () => {
    const node = preview('/* first\nconst fake = 42;\n*/ const real = 1;', 'ts', { maxLines: 2, lineNumbers: true });
    expect(node.children).toHaveLength(2);
    const row = node.children[1]!;
    const gutter = row.children[0]!.children[0]!;
    expect(gutter.props).toMatchObject({ width: 3, flexShrink: 0 });
    expect(gutter.children[0]!.props.children).toBe('2 │');
    expect(row.children[1]!.props.__textSpans).toEqual([{ text: 'const fake = 42;', style: { color: 'gray' } }]);
    expect(stripAnsi(renderToString(node, 80))).not.toContain('const real');
  });
  it('preserves blank and trailing rows, extended language support, and unknown-language text', () => {
    expect(preview('a\n\nb\n').children).toHaveLength(4);
    for (const extension of ['c', 'cpp', 'java', 'rb', 'php', 'lua']) {
      expect(preview('/* first\nnext */', extension).children).toHaveLength(2);
    }
    expect(preview('Class camelCase 42 "literal"', 'unknown').children[0]!.children[0]!.props.__textSpans)
      .toEqual([{ text: 'Class camelCase 42 "literal"', style: { color: 'white' } }]);
  });
  it('strips full terminal protocols before tokens can split them and retains visible Unicode', () => {
    const node = preview('界👩‍💻\x1b]52;c;secret\x07\nconst n = 1;\x1b[2J\x1b[31m');
    const texts = node.children.map(row => row.children[0]!.props.children);
    expect(texts).toEqual(['界👩‍💻', 'const n = 1;']);
    const output = renderToString(node, 80);
    expect(output).not.toContain('secret');
    expect(output).not.toContain('\x1b[2J');
    expect(stripAnsi(output)).toContain('界👩‍💻');
  });
});
