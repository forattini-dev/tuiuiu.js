import { describe, expect, it } from 'vitest';
import { createCodeTokenDocument, getLanguage, listLanguages, tokenizeCodeRanges } from '../../src/utils/code-tokenizer.js';
import { DEFAULT_CODE_THEME, highlightCodeSpans, type Language } from '../../src/utils/code-highlight.js';

const examples = [
  'const fn = (x) => x / 2;\r\nreturn /[a/b]+/gi;\nconst text = `first\n👩‍💻é`;\n/* doc\nend */\nnext(',
  '/* first\n\n*/\nlet a = "unfinished\\\nnext";\n// last\nvalue \t (',
  '"""first\nsecond"""\nf"raw\ninside"\n#[first\nsecond]\nr##"raw\ninside"##\n',
  '<![CDATA[\nraw\n]]>\n<<<CODE\ninside\nCODE;\n[[lua\ninside]]\n[link\ntext](dest)\n',
  '--- file\n+++ file\n@@ header\n+added\n-removed\nplain\n',
  ' \'a\'\r\n\t\n\n \n é界\ud800x\udc00\n7e+3\n@deco\nfunction_name\t(',
];

describe('owned incremental lexical documents', () => {
  it.each(listLanguages())('matches full lexing at every streaming boundary (%s)', language => {
    for (const source of examples) {
      const document = createCodeTokenDocument();
      for (let end = 0; end <= source.length; end++) {
        const content = source.slice(0, end);
        expect(document.update(content, language)).toEqual(tokenizeCodeRanges(content, language));
      }
    }
  });
  it.each(listLanguages())('matches full lexing through edits, truncation and skipped updates (%s)', language => {
    let seed = 0x13579bdf;
    const random = (max: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max; };
    const document = createCodeTokenDocument();
    let content = examples.join('\n');
    document.update(content, language);
    const pieces = ['', '\n', '\r\n', '/*', '*/', '"', '```', '\\', '/', '(', 'é', '👩‍💻', 'x\n\nnext', '#[', ']]'];
    for (let step = 0; step < 200; step++) {
      const start = random(content.length + 1);
      const end = start + random(content.length - start + 1);
      content = content.slice(0, start) + pieces[random(pieces.length)]! + content.slice(end);
      if (step % 17 === 0) content += examples[random(examples.length)]!;
      expect(document.update(content, language)).toEqual(tokenizeCodeRanges(content, language));
    }
  });
  it('reuses a safe prefix without mutating previous readers or losing slash context', () => {
    const document = createCodeTokenDocument();
    const source = 'const first = 1;\nconst ratio = value\n / 2;\n';
    const before = document.update(source, 'js');
    const copy = structuredClone(before);
    const after = document.update(source + 'return /a/g;', 'javascript');
    expect(after).toEqual(tokenizeCodeRanges(source + 'return /a/g;', 'js'));
    expect(after[0]).toBe(before[0]);
    expect(before).toEqual(copy);
    expect(Object.isFrozen(before)).toBe(true);
    expect(before.every(Object.isFrozen)).toBe(true);
    expect(document.snapshot().reparsedFrom).toBeGreaterThan(0);
    expect(document.snapshot().reusedTokenCount).toBeGreaterThan(0);
    expect(document.update(source + 'return /a/g;', ' .JS ')).toBe(after);
    expect(document.snapshot().revision).toBe(2);
  });
  it.each(['javascript', 'typescript', 'go', 'sql', 'json', 'yaml', 'java', 'diff'])('keeps long-prefix edits exact (%s)', language => {
    const document = createCodeTokenDocument();
    let content = 'const value = 1;\n'.repeat(100) + examples[0]!;
    document.update(content, language);
    for (let step = 0; step < 30; step++) {
      const start = Math.floor(content.length * (step % 5 === 0 ? 0.1 : 0.9));
      content = content.slice(0, start) + ['\n/*', '*/', '\"', 'return /a/', '\r\n', '', '`', ' \\'][step % 8]! + content.slice(start + 2);
      expect(document.update(content, language)).toEqual(tokenizeCodeRanges(content, language));
    }
  });
  it('rewinds lookahead when a newline changes function or regex classification', () => {
    const document = createCodeTokenDocument();
    for (const value of ['name\n', 'name(', 'name \n /a/', 'name \t(', 'return\n /a/', 'value\n /a/',
      '/* open\nnext\n', '/* open\nnext\n*/ return /a/', 'const s = `open\nnext', 'const s = `open\nnext`;\nnext']) {
      expect(document.update(value, 'ts')).toEqual(tokenizeCodeRanges(value, 'ts'));
    }
  });
  it('invalidates mutable rules, including in-place edits and custom cross-line patterns', () => {
    const definition = getLanguage('javascript')!;
    const custom = definition.customPatterns;
    const keywords = definition.keywords;
    const document = createCodeTokenDocument();
    const content = 'START\nconst other = 1;\nEND';
    document.update(content, 'js');
    try {
      definition.customPatterns = [{ pattern: /^START[\s\S]*END/, type: 'meta' }];
      expect(document.update(content, 'js')).toEqual(tokenizeCodeRanges(content, 'js'));
      expect(document.snapshot().reparsedFrom).toBe(0);
      definition.keywords = ['START'];
      definition.keywords.push('END');
      expect(document.update(content + '\nEND', 'js')).toEqual(tokenizeCodeRanges(content + '\nEND', 'js'));
      definition.customPatterns[0]!.pattern = /END/gi;
      expect(document.update(content, 'js')).toEqual(tokenizeCodeRanges(content, 'js'));
    } finally { definition.customPatterns = custom; definition.keywords = keywords; }
    expect(document.update(content + '\nconst restored = 1;', 'js')).toEqual(tokenizeCodeRanges(content + '\nconst restored = 1;', 'js'));
  });
  it('falls back for cross-line catalog patterns, source reset and language changes', () => {
    const document = createCodeTokenDocument();
    for (const language of ['html', 'markdown', 'python', 'rust', 'php', 'lua', 'css', 'ruby', 'bash', 'c', 'cpp']) {
      const source = 'const prefix = 1;\n\n' + examples.join('\n');
      document.update(source, language);
      expect(document.update(source + 'END', language)).toEqual(tokenizeCodeRanges(source + 'END', language));
      expect(document.snapshot().reparsedFrom).toBe(0);
    }
    expect(document.update('const n = 1;', 'constructor')).toEqual([{ type: 'plain', start: 0, end: 12 }]);
    expect(document.update('', 'ts')).toEqual([]);
  });
  it('keeps theming separate from retained lexical ranges', () => {
    const document = createCodeTokenDocument();
    const source = 'const value = 42;\n/* comment */\nreturn /a/g;';
    const ranges = document.update(source, 'ts');
    for (const language of ['typescript', 'javascript'] as Language[]) {
      const theme = { ...DEFAULT_CODE_THEME, keyword: 'red', comment: 'green' };
      expect(highlightCodeSpans(source, language, theme, ranges)).toEqual(highlightCodeSpans(source, language, theme));
    }
    expect(document.update(source, 'ts')).toBe(ranges);
  });
});
