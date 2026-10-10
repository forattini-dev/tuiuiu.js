import { describe, expect, it } from 'vitest';
import { getLanguage, listLanguages } from '../../src/utils/code-tokenizer.js';
import { tokenize, tokenizeLines, tokenizeCodeRanges } from '../../src/utils/code-tokenizer.js';
import { tokensToSpans, themes, codeRangesToSpans, getTokenColor } from '../../src/utils/code-highlight.js';
import { highlightCodeSpans, type Language } from '../../src/utils/code-highlight.js';

describe('canonical code lexer and adapters', () => {
  it('shares one registry for extension aliases and retains the extended language catalog', () => {
    expect(listLanguages()).toHaveLength(20);
    expect(getLanguage(' .TSX ')).toBe(getLanguage('typescript'));
    expect(getLanguage('mjs')).toBe(getLanguage('javascript'));
    expect(getLanguage('fish')).toBe(getLanguage('bash'));
    for (const name of ['constructor', '__proto__', 'toString', 'unknown']) expect(getLanguage(name)).toBeUndefined();
  });
  it.each(listLanguages())('partitions every raw source unit, even incomplete prefixes, for %s', language => {
    const source = '/* "\n*/ const A = 7E+3;\r\n# raw\n\'a 👩‍💻界é\x1b]52;c;hidden\x07\n"unfinished';
    for (let length = 0; length <= source.length; length++) {
      const prefix = source.slice(0, length);
      const tokens = tokenize(prefix, language);
      expect(tokens.map(token => token.value).join('')).toBe(prefix);
      let offset = 0;
      for (const token of tokens) {
        expect(token.start).toBe(offset);
        expect(token.end).toBeGreaterThan(token.start);
        expect(token.value).toBe(prefix.slice(token.start, token.end));
        offset = token.end;
      }
      expect(offset).toBe(prefix.length);
      expect(tokensToSpans(tokens).map(span => span.text).join('')).toBe(prefix);
      expect(codeRangesToSpans(prefix, tokenizeCodeRanges(prefix, language), token => getTokenColor(token.type, themes.dark!)))
        .toEqual(tokensToSpans(tokens));
    }
  });
  it.each([
    ['c', '#include <stdio.h>\nint n = 0xff;', 'meta'],
    ['cpp', 'class Example { };', 'keyword.declaration'],
    ['java', '@Override public class Example {}', 'decorator'],
    ['ruby', '@name = :symbol', 'variable'],
    ['php', '$name = "value";', 'variable'],
    ['lua', 'local text = [[first\nsecond]]', 'string'],
  ])('retains the extended preview language catalog: %s', (language, source, type) => {
    expect(tokenize(source, language).some(token => token.type === type)).toBe(true);
    expect(tokensToSpans(tokenize(source, language)).map(span => span.text).join('')).toBe(source);
  });
  it('preserves multiline tokens in relative rows, including empty rows and a trailing newline', () => {
    const source = '/* first\n\nconst fake = 1;\n*/ const real = 2;\n';
    const lines = tokenizeLines(source, 'ts');
    expect(lines.map(line => line.raw)).toEqual(source.split('\n'));
    expect(lines[2]!.tokens).toEqual([{ type: 'comment.block', value: 'const fake = 1;', start: 0, end: 15 }]);
    expect(lines[3]!.tokens.find(token => token.value === 'const')?.type).toBe('keyword.declaration');
    expect(lines[1]!.tokens).toEqual([]);
    expect(lines.at(-1)!.tokens).toEqual([]);
  });
  it('does not apply JS regex rules to division or swallow a newline in an unfinished regex', () => {
    const source = 'const ratio = a / b / c; const re = /[a/b]+/gi;\n/unfinished\nconst next = 1;';
    const tokens = tokenize(source, 'javascript');
    expect(tokens.filter(token => token.type === 'string.regex').map(token => token.value)).toEqual(['/[a/b]+/gi']);
    expect(tokens.filter(token => token.value === 'const')).toHaveLength(3);
  });
  it('keeps Rust documentation line comments separate from following blocks and code', () => {
    const source = '/// docs\nfn next() {}\n/* block */';
    expect(tokenize(source, 'rust')[0]).toMatchObject({ type: 'comment.doc', value: '/// docs' });
    expect(tokenize(source, 'rust').find(token => token.value === 'fn')?.type).toBe('keyword.declaration');
  });
  it('consumes generic keywords, integer exponents and multi-character delimiters', () => {
    expect(tokenize('select count(*) from users', 'sql').find(token => token.value === 'select')?.type.startsWith('keyword')).toBe(true);
    expect(tokenize('-7e+3', 'json')).toMatchObject([{ type: 'number.float', value: '-7e+3' }]);
    const definition = getLanguage('python')!;
    const previous = definition.stringDelimiters;
    const keywords = definition.keywords;
    try {
      definition.stringDelimiters = ['"""'];
      definition.keywords = ['generic'];
      expect(tokenize('"""first""" next', 'python')[0]?.value).toBe('"""first"""');
      expect(tokenize('generic', 'python')[0]?.type).toBe('keyword');
    } finally { definition.stringDelimiters = previous; definition.keywords = keywords; }
  });
  it('requires nonempty custom matches at the current offset, preserving regex flags without shared cursors', () => {
    const definition = getLanguage('python')!;
    const previous = definition.customPatterns;
    try {
      definition.customPatterns = [{ pattern: /(?=a)/g, type: 'invalid' }, { pattern: /MATCH/gi, type: 'meta' }];
      for (let render = 0; render < 3; render++) {
        const tokens = tokenize('abc match next', 'python');
        expect(tokens.map(token => token.value)).toEqual(['abc', ' ', 'match', ' ', 'next']);
        expect(tokens.find(token => token.type === 'meta')?.value).toBe('match');
      }
    } finally { definition.customPatterns = previous; }
  });
  it('keeps theme adaptation independent of tokenization and snapshots immutable spans', () => {
    const source = 'const value = "text"; // comment';
    const tokens = tokenize(source, 'ts');
    expect(tokensToSpans(tokens, themes.dark)).not.toEqual(tokensToSpans(tokens, themes.light));
    for (const language of ['javascript', 'typescript', 'python', 'json', 'shell', 'sql', 'rust'] as Language[]) {
      expect(highlightCodeSpans(source, language).map(span => span.text).join('')).toBe(source);
    }
    const spans = tokensToSpans(tokens);
    expect(Object.isFrozen(spans)).toBe(true);
    expect(Object.isFrozen(spans[0])).toBe(true);
    expect(Object.isFrozen(spans[0]!.style)).toBe(true);
  });
});
