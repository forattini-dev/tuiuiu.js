import { describe, expect, it } from 'vitest';
import { DEFAULT_CODE_THEME, highlightCodeSpans, normalizeCodeLanguage, splitCodeSpanLines, type Language } from '../../src/utils/code-highlight.js';

function colorAt(source: string, needle: string, language: Language, offset = 0) {
  const position = source.indexOf(needle, offset);
  expect(position).toBeGreaterThanOrEqual(0);
  let end = 0;
  for (const span of highlightCodeSpans(source, language)) {
    end += span.text.length;
    if (end > position) return span.style?.color;
  }
  return undefined;
}

describe('renderer-independent lexical code highlighting', () => {
  it.each([
    ['typescript', '/* first\nconst fake = "not a string";\n*/ const real = 42;', 'const fake'],
    ['sql', '/* select\nfrom table\n*/ select count(*) from users;', 'from table'],
    ['html', '<!-- first\n"not a string"\n--> <div>hello</div>', '"not a string"'],
    ['markdown', '<!-- first\n# not a heading\n--> # real heading', '# not a heading'],
    ['python', 'value = """first\n# not a comment\nlast"""\nprint(value)', '# not a comment'],
    ['javascript', 'const value = `first\n// not a comment\nlast`;\nconsole.log(value)', '// not a comment'],
    ['go', 'value := `first\n// not a comment\nlast`\nfmt.Println(value)', '// not a comment'],
  ] as const)('preserves multiline lexical state in %s', (language, source, needle) => {
    expect(colorAt(source, needle, language)).toBe(language === 'typescript' || language === 'sql' || language === 'html' || language === 'markdown'
      ? DEFAULT_CODE_THEME.comment : DEFAULT_CODE_THEME.string);
    expect(highlightCodeSpans(source, language).map(span => span.text).join('')).toBe(source);
  });
  it('does not let comments inside strings or quotes inside comments consume later code', () => {
    const source = 'const url = "https://example.org/*"; // "unterminated quote\nconst next = 42;';
    expect(colorAt(source, 'https', 'javascript')).toBe(DEFAULT_CODE_THEME.string);
    expect(colorAt(source, '"unterminated', 'javascript')).toBe(DEFAULT_CODE_THEME.comment);
    expect(colorAt(source, 'const next', 'javascript')).toBe(DEFAULT_CODE_THEME.keyword);
  });
  it('handles escaped quotes, line recovery and unfinished streaming constructs', () => {
    const source = 'const text = "a\\" // still string";\n"unfinished\nconst next = 1;\n/* unfinished\nreturn 2;';
    expect(colorAt(source, '// still', 'typescript')).toBe(DEFAULT_CODE_THEME.string);
    expect(colorAt(source, 'const next', 'typescript')).toBe(DEFAULT_CODE_THEME.keyword);
    expect(colorAt(source, 'return 2', 'typescript')).toBe(DEFAULT_CODE_THEME.comment);
  });
  it('matches exact Rust raw-string delimiters and nested comments, not lifetimes', () => {
    const source = 'fn borrow<\'a>(x: &\'a str) { /* outer /* inner */ still outer */ let text = r##"line "#\n// raw"##; let next = 42; }';
    expect(colorAt(source, "'a", 'rust')).not.toBe(DEFAULT_CODE_THEME.string);
    expect(colorAt(source, 'still outer', 'rust')).toBe(DEFAULT_CODE_THEME.comment);
    expect(colorAt(source, '// raw', 'rust')).toBe(DEFAULT_CODE_THEME.string);
    expect(colorAt(source, 'let next', 'rust')).toBe(DEFAULT_CODE_THEME.keyword);
  });
  it('retains Go rune coloring alongside raw-string and ordinary-string handling', () => {
    const source = "var letter = '界'; var escaped = '\\n'; var next = 42;";
    expect(colorAt(source, "'界'", 'go')).toBe(DEFAULT_CODE_THEME.string);
    expect(colorAt(source, "'\\n'", 'go')).toBe(DEFAULT_CODE_THEME.string);
    expect(colorAt(source, 'var next', 'go')).toBe(DEFAULT_CODE_THEME.keyword);
  });
  it('recognizes lowercase SQL and escaped SQL/YAML quotes', () => {
    expect(colorAt('select count(*) from users', 'select', 'sql')).toBe(DEFAULT_CODE_THEME.keyword);
    expect(colorAt('select count(*) from users', 'count', 'sql')).toBe(DEFAULT_CODE_THEME.builtin);
    expect(colorAt("select 'it''s -- a string'", '-- a string', 'sql')).toBe(DEFAULT_CODE_THEME.string);
    expect(colorAt("key: 'it''s # a string'", '# a string', 'yaml')).toBe(DEFAULT_CODE_THEME.string);
    expect(colorAt('echo value#suffix # comment', '#suffix', 'bash')).not.toBe(DEFAULT_CODE_THEME.comment);
    expect(colorAt('echo value#suffix # comment', '# comment', 'bash')).toBe(DEFAULT_CODE_THEME.comment);
  });
  it('colors complete decimal/exponent tokens deterministically across repeated renders', () => {
    const source = 'const x = 42 + 42 + 3.14e-2 + 7E+3;';
    const expected = highlightCodeSpans(source, 'typescript');
    for (let render = 0; render < 10; render++) {
      expect(highlightCodeSpans(source, 'typescript')).toEqual(expected);
      const numbers = expected.filter(span => span.style?.color === DEFAULT_CODE_THEME.number).map(span => span.text);
      expect(numbers).toEqual(['42', '42', '3.14e-2', '7E+3']);
    }
    expect(colorAt('prefix42 = 1', 'prefix42', 'typescript')).not.toBe(DEFAULT_CODE_THEME.number);
  });
  it('uses function, operator and punctuation theme slots without guessing styles in plain text', () => {
    const source = 'customCall(value) + 1;';
    expect(colorAt(source, 'customCall', 'typescript')).toBe(DEFAULT_CODE_THEME.function);
    expect(colorAt(source, '+', 'typescript')).toBe(DEFAULT_CODE_THEME.operator);
    expect(colorAt(source, '(', 'typescript')).toBe(DEFAULT_CODE_THEME.punctuation);
    expect(highlightCodeSpans('Class camelCase 42 "literal"', 'plain')).toEqual([
      { text: 'Class camelCase 42 "literal"', style: { color: 'foreground' } },
    ]);
  });
  it('keeps diff line colors, blank lines, trailing newlines and immutable Unicode source', () => {
    const source = '+界👩‍💻\n\n-removed\n@@ range\n plain\n';
    const spans = highlightCodeSpans(source, 'diff');
    expect(spans.map(span => span.text).join('')).toBe(source);
    expect(splitCodeSpanLines(spans).map(line => line.map(span => span.text).join(''))).toEqual(source.split('\n'));
    expect(colorAt(source, '+', 'diff')).toBe(DEFAULT_CODE_THEME.added);
    expect(colorAt(source, '-', 'diff')).toBe(DEFAULT_CODE_THEME.removed);
    expect(Object.isFrozen(spans)).toBe(true);
    expect(Object.isFrozen(spans[0]!.style)).toBe(true);
  });
  it.each(['typescript', 'python', 'json', 'yaml', 'bash', 'shell', 'html', 'css', 'sql', 'go', 'rust', 'markdown', 'diff', 'plain'] as const)(
    'retains every raw source unit for %s, leaving sanitization to the adapter', language => {
      const source = '👩‍💻界é\r\n"text" /* incomplete\n\x1b]52;c;payload\x07';
      expect(highlightCodeSpans(source, language).map(span => span.text).join('')).toBe(source);
    });
  it('shares fence aliases and safely falls back on unknown names including prototype keys', () => {
    for (const [name, expected] of [[' .TS ', 'typescript'], ['js', 'javascript'], ['py', 'python'], ['sh', 'shell'], ['patch', 'diff'],
      ['unsupported', 'plain'], ['constructor', 'plain'], ['__proto__', 'plain']] as const) {
      expect(normalizeCodeLanguage(name)).toBe(expected);
    }
  });
  it('bounds long unfinished tokens and coalesces unstyled text rather than emitting character runs', () => {
    const source = '/*' + 'x'.repeat(100_000);
    expect(highlightCodeSpans(source, 'typescript')).toHaveLength(1);
    expect(highlightCodeSpans(' '.repeat(100_000), 'typescript')).toHaveLength(1);
  });
});
