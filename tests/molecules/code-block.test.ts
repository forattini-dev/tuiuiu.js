import { describe, expect, it } from 'vitest';
import { CodeBlock, InlineCode, renderHighlightedCodeBlock, type CodeBlockOptions } from '../../src/molecules/code-block.js';
import { execFileSync } from 'node:child_process';
import { createCodeTokenDocument } from '../../src/utils/code-tokenizer.js';
import { DEFAULT_CODE_THEME, highlightCodeSpans } from '../../src/utils/code-highlight.js';
import { stripTerminalControls } from '../../src/utils/terminal-sanitize.js';
import { createFrameSnapshot } from '../../src/core/frame.js';
import { renderFrameToCellBuffer } from '../../src/core/delta-render.js';
import { renderToString } from '../../src/core/renderer.js';
import { stringWidth, stripAnsi } from '../../src/utils/text-utils.js';

const codeNode = (code: string, extra: Partial<Parameters<typeof CodeBlock>[0]> = {}) =>
  CodeBlock({ code, language: 'typescript', lineNumbers: false, borderStyle: 'none', ...extra });

describe('structured CodeBlock', () => {
  it('retains equal fitted rows only for an explicit lexical owner', () => {
    const owner = createCodeTokenDocument();
    const options: CodeBlockOptions = { code: 'const first = 1;\nconst second = "界👩‍💻é";', language: 'typescript',
      maxWidth: 14, wrap: true, borderStyle: 'none' };
    const render = (value: CodeBlockOptions) => {
      const source = stripTerminalControls(value.code);
      return renderHighlightedCodeBlock(value, highlightCodeSpans(source, value.language!,
        { ...DEFAULT_CODE_THEME, ...value.theme }, owner.update(source, value.language!)), owner);
    };
    const before = render(options);
    const nextOptions = { ...options, code: options.code + '\nreturn /a/g;' };
    const next = render(nextOptions);
    expect(next.children[0]).toBe(before.children[0]);
    expect(renderToString(next, 30)).toBe(renderToString(CodeBlock(nextOptions), 30));
    expect(codeNode('const x = 1;').children[0]).not.toBe(codeNode('const x = 1;').children[0]);
    for (const changed of [
      { ...nextOptions, maxWidth: 8 }, { ...nextOptions, theme: { background: 'blue', keyword: 'red' } },
      { ...nextOptions, startLine: 99 }, { ...nextOptions, highlightLines: [1, 2] },
      { ...nextOptions, code: '/*\n' + nextOptions.code + '\n*/' },
    ]) {
      const actual = render(changed);
      expect(actual.children[0]).not.toBe(next.children[0]);
      expect(renderToString(actual, 30)).toBe(renderToString(CodeBlock(changed), 30));
    }
  });
  it('refits every retained row when growing line numbers change gutter width', () => {
    const owner = {};
    const source = 'words and a long line\n'.repeat(8) + 'last';
    const options: CodeBlockOptions = { code: source, language: 'plain', borderStyle: 'none', maxWidth: 12, wrap: true };
    const before = renderHighlightedCodeBlock(options, highlightCodeSpans(source, 'plain'), owner);
    const nextOptions = { ...options, code: source + '\nnext' };
    const after = renderHighlightedCodeBlock(nextOptions, highlightCodeSpans(nextOptions.code, 'plain'), owner);
    expect(after.children[0]).not.toBe(before.children[0]);
    expect(renderToString(after, 30)).toBe(renderToString(CodeBlock(nextOptions), 30));
  });
  it('does not pin old whole-source revisions through cached code rows', () => {
    const markdownUrl = new URL('../../src/molecules/markdown.ts', import.meta.url).href;
    const script = `
      import { Markdown, createMarkdownDocument } from ${JSON.stringify(markdownUrl)};
      const document = createMarkdownDocument();
      const lines = Array.from({ length: 120 }, (_, i) => '// row ' + i + ': ' + 'x'.repeat(480));
      const render = () => Markdown({ content: '~~~ts\\n' + lines.join('\\n') + '\\n~~~', document });
      render();
      for (let i = 0; i < 3; i++) global.gc();
      const before = process.memoryUsage().heapUsed;
      for (let i = 0; i < lines.length; i++) { lines[i] += 'y'; render(); }
      for (let i = 0; i < 3; i++) global.gc();
      console.log(JSON.stringify({ retained: process.memoryUsage().heapUsed - before }));
    `;
    const measured: { retained: number } = JSON.parse(execFileSync(process.execPath,
      ['--expose-gc', '--import', 'tsx', '--input-type=module', '-e', script], { encoding: 'utf8', timeout: 20_000 }));
    expect(measured.retained).toBeLessThan(4 * 1024 * 1024);
  });
  it('uses a single styled text node and draw command per logical line, independent of token count', () => {
    const node = codeNode('const value = 42; customCall(value);\n/* second\nconst fake = 1; */',
      { theme: { comment: 'red' } });
    expect(node.children).toHaveLength(3);
    for (const row of node.children) {
      expect(row.type).toBe('text');
      expect(row.children).toHaveLength(0);
      expect(row.props.__textSpans).toBeDefined();
    }
    const frame = createFrameSnapshot(node, { width: 80, height: 10 });
    expect(frame.drawCommands).toHaveLength(3);
    const buffer = renderFrameToCellBuffer(frame);
    expect(buffer.get(0, 2)).toMatchObject({ char: 'c', fg: 'red' });
  });
  it('highlights before fitting so cropped string/comment delimiters cannot change remaining colors', () => {
    const node = codeNode('"hello world"\n/* long\nconst fake = 42;\n*/',
      { maxWidth: 6, theme: { string: 'green', comment: 'red' } });
    const buffer = renderFrameToCellBuffer(createFrameSnapshot(node, { width: 20, height: 10 }));
    expect(buffer.get(1, 0)).toMatchObject({ char: 'h', fg: 'green' });
    expect(buffer.get(0, 2)).toMatchObject({ char: 'c', fg: 'red' });
    expect(node.children[0]!.props.children).toBe('"hell…');
    expect(node.children[0]!.props.__textSpans.at(-1).style?.color).toBeUndefined();
  });
  it('wraps code within an explicit row budget, preserving styled words and continuation gutters', () => {
    const node = codeNode('const value = 42;\nnext();', { lineNumbers: true, maxWidth: 14, wrap: true, startLine: 9,
      highlightLines: [9], theme: { keyword: 'magenta' } });
    expect(node.children.length).toBeGreaterThan(2);
    for (const row of node.children) expect(stringWidth(row.props.children)).toBeLessThanOrEqual(14);
    expect(node.children[0]!.props.children).toContain('9 │ ▶ ');
    expect(node.children[1]!.props.children.startsWith(' '.repeat(stringWidth(' 9 │ ▶ ')))).toBe(true);
    expect(node.children.at(-1)!.props.children).toContain('10 │ next();');
    const output = stripAnsi(renderToString(node, 80));
    expect(output).toContain('const');
    expect(output).toContain('42;');
  });
  it('handles zero-width and undersized gutters instead of leaking the full code line', () => {
    expect(codeNode('should disappear', { maxWidth: 0 }).children[0]!.props.children).toBe('');
    const node = codeNode('hidden', { lineNumbers: true, maxWidth: 2, highlightLines: [1] });
    expect(stringWidth(node.children[0]!.props.children)).toBeLessThanOrEqual(2);
    expect(node.children[0]!.props.children).not.toContain('hidden');
    for (const maxWidth of [NaN, Infinity, -1]) expect(() => codeNode('x', { maxWidth })).toThrow(RangeError);
  });
  it('keeps graphemes whole through fitting and strips terminal protocol payloads before lexing', () => {
    const node = codeNode('界👩‍💻é\x1b]52;c;secret\x07', { language: 'plain', maxWidth: 5 });
    expect(node.children[0]!.props.children).toBe('界👩‍💻é');
    expect(stripAnsi(renderToString(node, 20))).not.toContain('secret');
    const truncated = codeNode('界👩‍💻é', { language: 'plain', maxWidth: 4 });
    expect(truncated.children[0]!.props.children).toBe('界…');
  });
  it('resolves all theme slots and produces one InlineCode flow rather than independent token boxes', () => {
    const node = InlineCode({ code: 'call(42)', language: 'typescript' });
    expect(node.type).toBe('text');
    expect(node.children).toHaveLength(0);
    expect(node.props.children).toBe(' call(42) ');
    const frame = createFrameSnapshot(codeNode('x', { theme: { background: 'blue' } }), { width: 5, height: 2 });
    expect(renderFrameToCellBuffer(frame).get(0, 0)).toMatchObject({ char: 'x', bg: 'blue' });
  });
});
