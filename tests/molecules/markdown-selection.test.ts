import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMarkdownSelection } from '../../src/utils/markdown-selection.js';
import { projectInlineMarkdown } from '../../src/utils/markdown-inline.js';
import { createMarkdownDocument, getMarkdownNodeSource } from '../../src/utils/markdown-document.js';
import { stripTerminalControls } from '../../src/utils/terminal-sanitize.js';

const controllers: ReturnType<typeof createMarkdownSelection>[] = [];
afterEach(() => { for (const controller of controllers.splice(0)) controller.dispose(); });
function setup(source: string, options?: Parameters<typeof createMarkdownSelection>[1]) {
  const controller = createMarkdownSelection(source, options);
  controllers.push(controller);
  return controller;
}
function select(controller: ReturnType<typeof setup>, text: string) {
  const value = controller.selection.document.snapshot().value;
  const start = value.indexOf(text);
  expect(start).toBeGreaterThanOrEqual(0);
  controller.selection.set(start, start + text.length);
}

describe('Markdown source projection', () => {
  it('highlights aliased fenced code without changing CRLF/Unicode source mapping or copy', () => {
    const source = '```ts\r\n/* first\r\nconst 👩‍💻 = "界";\r\n*/\r\nconst real = 42;\r\n```\r\n\r\nend';
    const controller = setup(source, { codeTheme: { comment: 'red', keyword: 'magenta' } });
    const spans = controller.snapshot().spans;
    expect(spans.find(span => span.text.includes('const 👩‍💻'))!.style?.color).toBe('red');
    expect(spans.find(span => span.text === 'const')!.style?.color).toBe('magenta');
    select(controller, 'const 👩‍💻 = "界";');
    expect(controller.copyText('source')).toBe('const 👩‍💻 = "界";');
    const range = controller.sourceRange();
    controller.update(source, { highlightCode: false });
    expect(controller.sourceRange()).toEqual(range);
    expect(controller.copyText()).toBe('const 👩‍💻 = "界";');
    expect(controller.snapshot().spans.find(span => span.text.includes('const 👩‍💻'))!.style?.color).toBe('primary');
    controller.selection.selectAll();
    expect(controller.copyText('source')).toBe(stripTerminalControls(source));
  });
  it('snapshots code theme changes, preserves them on append, and notifies style-only subscribers', () => {
    const source = '```js\nconst value = 42;\n```';
    const options = { codeTheme: { keyword: 'red' } };
    const controller = setup(source, options);
    options.codeTheme.keyword = 'blue';
    const changed = vi.fn();
    controller.subscribe(changed);
    controller.update(source + '\n\nnext');
    expect(controller.snapshot().spans.find(span => span.text === 'const')!.style?.color).toBe('red');
    select(controller, 'value');
    const selection = controller.selection.snapshot();
    controller.update(source + '\n\nnext', { codeTheme: { keyword: 'green' } });
    expect(changed).toHaveBeenCalledTimes(2);
    expect(controller.selection.snapshot()).toEqual(selection);
    expect(controller.snapshot().spans.find(span => span.text === 'const')!.style?.color).toBe('green');
    expect(controller.update(source + '\n\nnext')).toBe(false);
  });
  it('fails closed when callers bypass projection updates instead of copying unrelated source', () => {
    const controller = setup('**original**');
    controller.selection.document.setValue('unrelated');
    controller.selection.selectAll();
    expect(() => controller.copyText('source')).toThrow('use controller.update()');
    expect(() => controller.copyText()).toThrow('use controller.update()');
    expect(() => controller.sourceRange()).toThrow('use controller.update()');
    expect(() => controller.snapshot()).toThrow('use controller.update()');
    expect(() => controller.update('**original**')).toThrow('use controller.update()');
  });
  it.each([
    ['**hello** world', 'hello', 'hello'],
    ['\\*literal\\* then', '*literal*', '*literal\\*'],
    ['**bold and *italic* together**', 'and italic together', 'and *italic* together'],
    ['[**docs**](https://example.org/a_(b))', 'docs', 'docs'],
    ['`**literal**` then', '**literal**', '**literal**'],
    ['first\nsecond\n\nlast', 'first second', 'first\nsecond'],
    ['first\r\nsecond\r\n\r\nlast', 'first second', 'first\r\nsecond'],
    ['> first\n> second\n\nlast', 'first\nsecond', 'first\n> second'],
    ['- [x] **done**\n- todo', 'done', 'done'],
    ['```ts\nconst x = 1;\n```\n\nlast', 'const x', 'const x'],
    ['![alt](image.png)', 'alt', 'alt'],
  ])('maps %s selected ink %s to source %s', (source, displayed, raw) => {
    const controller = setup(source);
    select(controller, displayed);
    expect(controller.copyText()).toBe(displayed);
    expect(controller.copyText('source')).toBe(stripTerminalControls(raw));
    const range = controller.sourceRange()!;
    expect(source.slice(range.start, range.end)).toBe(raw);
  });
  it('distinguishes generated decorations, empty selection and full source copy', () => {
    const source = '# Title\n\n- item\n\n```ts\nx\n```';
    const controller = setup(source);
    expect(controller.sourceRange()).toBeNull();
    select(controller, '# ');
    expect(controller.copyText()).toBe('# ');
    expect(controller.copyText('source')).toBe('');
    controller.selection.selectAll();
    expect(controller.copyText('source')).toBe(source);
    expect(controller.copyText()).toBe('# Title\n\n• item\n\nx');
    controller.selection.clear();
    expect(controller.copyText('source')).toBe('');
    expect(() => controller.copyText('invalid' as 'source')).toThrow(RangeError);
  });
  it('maps visible link destinations while excluding generated parentheses', () => {
    const controller = setup('[docs](https://example.org/a_(b)) more');
    select(controller, 'https://example.org/a_(b)');
    expect(controller.copyText('source')).toBe('https://example.org/a_(b)');
    controller.update('[docs](https://example.org/a_(b)) more', { showLinkUrls: false });
    expect(controller.selection.document.snapshot().value).toBe('docs more');
    select(controller, 'docs');
    expect(controller.sourceRange()).toEqual({ start: 1, end: 5 });
  });
  it('does not split Unicode source ranges or interpret terminal protocols', () => {
    const controller = setup('before **👩‍💻界é** \x1b]52;c;payload\x07 after');
    select(controller, '👩‍💻界é');
    expect(controller.copyText('source')).toBe('👩‍💻界é');
    controller.selection.selectAll();
    expect(controller.copyText()).not.toContain('\x1b');
    expect(controller.copyText('source')).not.toContain('payload');
  });
  it('keeps mappings for every streaming append consistent with fresh parsing', () => {
    const sources = [
      '# title\n\n**first\nline**\n\n> quote\n> more\n\n- [x] done\n- two\n\n```ts\nx\n```',
      'first\r\nsecond\r\n\r\n[docs](https://example.org)\r\n',
      '| h | x |\n| --- | --- |\n| a | b |\n\nend',
      '👩‍💻é **tail**',
      '```ts\n/* first\nconst inside = 42;\n*/\nconst text = `界\n👩‍💻`;\n```\n\nlast',
    ];
    for (const source of sources) {
      const streamed = setup('');
      for (let end = 0; end <= source.length; end++) {
        const content = source.slice(0, end);
        streamed.update(content);
        const fresh = createMarkdownSelection(content);
        try {
          expect(streamed.snapshot()).toEqual(fresh.snapshot());
          expect(streamed.selection.document.snapshot().value).toBe(fresh.selection.document.snapshot().value);
          const value = fresh.selection.document.snapshot().value;
          for (let offset = 0; offset < value.length; offset++) {
            streamed.selection.set(offset, offset + 1);
            fresh.selection.set(offset, offset + 1);
            expect(streamed.sourceRange()).toEqual(fresh.sourceRange());
          }
        } finally { fresh.dispose(); }
      }
    }
  });
  it('preserves selection in an unchanged prefix across append and reflows, and remaps replacement', () => {
    const controller = setup('**first**\n\n');
    select(controller, 'first');
    controller.update('**first**\n\nsecond');
    expect(controller.copyText()).toBe('first');
    expect(controller.copyText('source')).toBe('first');
    controller.update('__first__\n\nsecond');
    expect(controller.copyText()).toBe('first');
    expect(controller.sourceRange()).toEqual({ start: 2, end: 7 });
    controller.update('short');
    expect(controller.selection.document.snapshot().value).toBe('short');
    controller.update('');
    expect(controller.selection.snapshot().head).toBe(0);
  });
  it('keeps display documents exact across replacements at combining and ZWJ boundaries', () => {
    const controller = setup('');
    const changes = ['e', 'é', '**é**', '👩', '👩‍💻', 'x👩‍💻é', 'x👩‍🔬é', 'xé', 'x🇧🇷é', 'x🇧🇷e', 'x',
      '🇦🇧🇨', '🇽🇦🇧🇨', '🇦🇧🇨', ''];
    for (const source of changes) {
      controller.update(source);
      expect(controller.selection.document.snapshot().value).toBe(controller.snapshot().spans.map(span => span.text).join(''));
    }
  });
  it('notifies style-only or source-only updates atomically and snapshots options', () => {
    const options = { theme: { bold: 'red' } };
    const controller = setup('**x**', options);
    options.theme.bold = 'blue';
    const listener = vi.fn(() => {
      expect(controller.snapshot().spans.map(span => span.text).join('')).toBe(controller.selection.document.snapshot().value);
    });
    const release = controller.subscribe(listener);
    expect(controller.update('**x**')).toBe(false);
    controller.update('__x__');
    expect(controller.snapshot().spans[0]!.style!.color).toBe('red');
    controller.update('__x__', { theme: { bold: 'blue' } });
    expect(controller.snapshot().spans[0]!.style!.color).toBe('blue');
    expect(listener).toHaveBeenCalledTimes(2);
    release();
    controller.update('next');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(Object.isFrozen(controller.snapshot().spans[0])).toBe(true);
    controller.dispose(); controller.dispose();
    expect(controller.selection.disposed).toBe(true);
    expect(() => controller.update('late')).toThrow('disposed');
    expect(() => controller.subscribe(() => {})).toThrow('disposed');
  });
  it('keeps incomplete and adversarial inline input bounded and falls back literally', () => {
    const source = '[ * _ ` `` ``` \\* unmatched '.repeat(200);
    const controller = setup(source);
    controller.selection.selectAll();
    expect(controller.copyText('source')).toBe(source);
    expect(controller.copyText().length).toBeGreaterThan(0);
  });
  it('keeps provenance private without changing AST equality or stable identities', () => {
    const document = createMarkdownDocument('a\r\n\r\n');
    const first = document.update('a\r\n\r\n')[0]!;
    expect(first).toEqual({ type: 'paragraph', content: 'a' });
    document.update('a\r\n\r\nb');
    expect(document.update('a\r\n\r\nb')[0]).toBe(first);
    expect(getMarkdownNodeSource(first)).toMatchObject({ start: 0, end: 3, parts: [{ text: 'a', start: 0, end: 1 }] });
    expect(() => getMarkdownNodeSource({ type: 'paragraph' })).toThrow('provenance');
  });
  it('records escapes and generated inline-code padding as distinct mappings', () => {
    const projection = projectInlineMarkdown('a \\* `界`', { bold: 'red', italic: 'green', link: 'blue', code: 'yellow' });
    expect(projection.text).toBe('a *  界 ');
    expect(projection.ranges).toEqual([
      { start: 0, end: 2, sourceStart: 0, sourceEnd: 2 },
      { start: 2, end: 4, sourceStart: 3, sourceEnd: 5 },
      { start: 5, end: 6, sourceStart: 6, sourceEnd: 7 },
    ]);
  });
});
