import { describe, expect, it, vi } from 'vitest';
import * as codeTokenizer from '../../src/utils/code-tokenizer.js';
import { Markdown, createMarkdownDocument } from '../../src/molecules/markdown.js';
import { TerminalMessage } from '../../src/molecules/terminal-message.js';
import { renderToString } from '../../src/core/renderer.js';

const cases = [
  '# title\n\nHello **bold**\ncontinued\n\n#without-space\n',
  '> quote\nlazy\n\n- [x] done\n- [ ] todo\n\n1. first\n2. second\n',
  'before\n---\n\n| name | value |\n| --- | --- |\n| a | b |\n\nend',
  '````ts filename="my file.ts"\nconst a = 1;\n```\n````\n\nafter',
  '~~~python\nx = 1\n~~~\n\nnext\n',
  '```\nnot closed\n',
  '# ok\n#also-plain\n####### too many\n\n+++\n**\n',
];

describe('incremental Markdown', () => {
  it('owns incremental fence lexers and releases their slots when rendering mode or blocks change', () => {
    const factory = codeTokenizer.createCodeTokenDocument;
    const created: codeTokenizer.CodeTokenDocument[] = [];
    const spy = vi.spyOn(codeTokenizer, 'createCodeTokenDocument').mockImplementation(() => {
      const document = factory(); created.push(document); return document;
    });
    try {
      const document = createMarkdownDocument();
      let content = '```ts\nconst first = 1;\nconst second = "text";\n';
      Markdown({ content, document, maxWidth: 40 });
      expect(created).toHaveLength(1);
      content += 'return /a/g;\n```';
      const rendered = Markdown({ content, document, maxWidth: 40 });
      expect(created).toHaveLength(1);
      expect(created[0]!.snapshot().reparsedFrom).toBeGreaterThan(0);
      expect(renderToString(rendered, 40)).toBe(renderToString(Markdown({ content, maxWidth: 40 }), 40));
      const revision = created[0]!.snapshot().revision;
      const options = { maxWidth: 20, codeBlock: { theme: { keyword: 'red' } } };
      expect(renderToString(Markdown({ content, document, ...options }), 20))
        .toBe(renderToString(Markdown({ content, ...options }), 20));
      expect(created[0]!.snapshot().revision).toBe(revision);
      Markdown({ content, document, renderNode: () => undefined });
      Markdown({ content, document });
      expect(created).toHaveLength(2);
      Markdown({ content: 'no code', document });
      Markdown({ content, document });
      expect(created).toHaveLength(3);
      Markdown({ content, document: createMarkdownDocument() });
      expect(created).toHaveLength(4);
    } finally { spy.mockRestore(); }
  });
  it.each(cases)('matches fresh parsing at every append boundary: %s', source => {
    const document = createMarkdownDocument();
    for (let end = 0; end <= source.length; end++) {
      const content = source.slice(0, end);
      expect(document.update(content)).toEqual(createMarkdownDocument(content).update(content));
      expect(renderToString(Markdown({ content, document, maxWidth: 40 }), 40))
        .toBe(renderToString(Markdown({ content, maxWidth: 40 }), 40));
    }
  });
  it('retains stable block and VNode identities but reflows on option changes', () => {
    const document = createMarkdownDocument('first\n\n');
    const initial = document.update('first\n\n');
    const before = Markdown({ content: 'first\n\n', document, maxWidth: 40 });
    const after = Markdown({ content: 'first\n\nsecond', document, maxWidth: 40 });
    expect(after.children![0]).toBe(before.children![0]);
    expect(document.update('first\n\nsecond')[0]).toBe(initial[0]);
    expect(document.snapshot()).toMatchObject({ reparsedFrom: 7, reusedBlockCount: 2, revision: 1 });
    expect(Object.isFrozen(initial)).toBe(true);
    expect(Object.isFrozen(initial[0])).toBe(true);
    const narrow = Markdown({ content: 'first\n\nsecond', document, maxWidth: 10 });
    expect(narrow.children![0]).not.toBe(after.children![0]);
    const themed = Markdown({ content: 'first\n\nsecond', document, maxWidth: 10, theme: { bold: 'red' } });
    expect(themed.children![0]).not.toBe(narrow.children![0]);
  });
  it('does not commit ambiguous trailing newlines or unfinished fences', () => {
    const document = createMarkdownDocument('a | b\n');
    expect(document.update('a | b\n--- | ---')[0]!.type).toBe('table');
    expect(document.snapshot().reparsedFrom).toBe(0);
    document.update('```\na\n```');
    expect(document.update('```\na\n```oops')[0]!.content).toContain('```oops');
    expect(document.snapshot().reparsedFrom).toBe(0);
  });
  it('fully reparses replacements/truncation without keeping stale blocks', () => {
    const document = createMarkdownDocument('a\n\nb\n\nc');
    for (const content of ['changed\n\nb\n\nc', 'changed', '', '# header']) {
      expect(document.update(content)).toEqual(createMarkdownDocument(content).update(content));
      expect(document.snapshot().reparsedFrom).toBe(0);
    }
  });
  it('treats malformed headings as text and honors fences with quoted filenames', () => {
    expect(renderToString(Markdown({ content: '#without-space' }), 40)).toContain('#without-space');
    const document = createMarkdownDocument('```ts file="my file.ts"\nconst a = 1;\n```');
    expect(document.update(document.snapshot().content)[0]).toMatchObject({ language: 'ts', filename: 'my file.ts' });
    expect(renderToString(Markdown({ content: document.snapshot().content }), 60)).toContain('my file.ts');
  });
  it('keeps raw streaming as default and exposes explicit rich-streaming opt-in', () => {
    const content = '**hello**';
    const raw = renderToString(TerminalMessage({ content, streaming: true, showRole: false }), 40);
    expect(raw).toContain('**hello**');
    const document = createMarkdownDocument();
    const rich = renderToString(TerminalMessage({ content, streaming: true, streamingMarkdown: true, document, showRole: false }), 40);
    expect(rich).toContain('hello');
    expect(rich).not.toContain('**');
    expect(document.snapshot().content).toBe(content);
  });
});
