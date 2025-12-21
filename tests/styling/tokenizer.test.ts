/**
 * Tests for TCSS Tokenizer
 */

import { describe, it, expect } from 'vitest';
import {
  Tokenizer,
  TokenType,
  tokenize,
  tokenizeWithErrors,
  type Token,
} from '../../src/styling/tokenizer.js';

describe('TCSS Tokenizer', () => {
  describe('Basic tokens', () => {
    it('should tokenize identifiers', () => {
      const tokens = tokenize('Box color red');
      expect(tokens.map(t => t.type)).toEqual([
        TokenType.IDENT,
        TokenType.IDENT,
        TokenType.IDENT,
        TokenType.EOF,
      ]);
      expect(tokens[0].value).toBe('Box');
      expect(tokens[1].value).toBe('color');
      expect(tokens[2].value).toBe('red');
    });

    it('should tokenize identifiers with hyphens', () => {
      const tokens = tokenize('margin-top border-color');
      expect(tokens.map(t => t.type)).toEqual([
        TokenType.IDENT,
        TokenType.IDENT,
        TokenType.EOF,
      ]);
      expect(tokens[0].value).toBe('margin-top');
      expect(tokens[1].value).toBe('border-color');
    });

    it('should tokenize identifiers with underscores', () => {
      const tokens = tokenize('my_class _private');
      expect(tokens.map(t => t.type)).toEqual([
        TokenType.IDENT,
        TokenType.IDENT,
        TokenType.EOF,
      ]);
    });
  });

  describe('Selectors', () => {
    it('should tokenize class selectors', () => {
      const tokens = tokenize('.primary .button-large');
      expect(tokens.map(t => t.type)).toEqual([
        TokenType.DOT,
        TokenType.IDENT,
        TokenType.DOT,
        TokenType.IDENT,
        TokenType.EOF,
      ]);
    });

    it('should tokenize ID selectors', () => {
      const tokens = tokenize('#header #main-content');
      expect(tokens.map(t => t.type)).toEqual([
        TokenType.HASH,
        TokenType.HASH,
        TokenType.EOF,
      ]);
      expect(tokens[0].value).toBe('#header');
      expect(tokens[1].value).toBe('#main-content');
    });

    it('should tokenize universal selector', () => {
      const tokens = tokenize('* Box');
      expect(tokens[0].type).toBe(TokenType.STAR);
      expect(tokens[0].value).toBe('*');
    });

    it('should tokenize pseudo-classes', () => {
      const tokens = tokenize(':focus :hover :disabled');
      expect(tokens.map(t => t.type)).toEqual([
        TokenType.COLON,
        TokenType.IDENT,
        TokenType.COLON,
        TokenType.IDENT,
        TokenType.COLON,
        TokenType.IDENT,
        TokenType.EOF,
      ]);
    });

    it('should tokenize pseudo-elements', () => {
      const tokens = tokenize('::before ::after');
      expect(tokens.map(t => t.type)).toEqual([
        TokenType.DOUBLE_COLON,
        TokenType.IDENT,
        TokenType.DOUBLE_COLON,
        TokenType.IDENT,
        TokenType.EOF,
      ]);
    });

    it('should tokenize combinators', () => {
      const tokens = tokenize('Box > Text + Spacer ~ Button');
      const types = tokens.map(t => t.type);
      expect(types).toContain(TokenType.GREATER);
      expect(types).toContain(TokenType.PLUS);
      expect(types).toContain(TokenType.TILDE);
    });
  });

  describe('Numbers', () => {
    it('should tokenize integers', () => {
      const tokens = tokenize('0 42 100');
      expect(tokens.filter(t => t.type === TokenType.NUMBER)).toHaveLength(3);
      expect(tokens[0].value).toBe('0');
      expect(tokens[1].value).toBe('42');
      expect(tokens[2].value).toBe('100');
    });

    it('should tokenize decimals', () => {
      const tokens = tokenize('1.5 0.25 .5');
      const nums = tokens.filter(t => t.type === TokenType.NUMBER);
      expect(nums).toHaveLength(3);
      expect(nums[0].value).toBe('1.5');
      expect(nums[1].value).toBe('0.25');
      expect(nums[2].value).toBe('.5');
    });

    it('should tokenize negative numbers', () => {
      const tokens = tokenize('-10 -3.5');
      const nums = tokens.filter(t => t.type === TokenType.NUMBER);
      expect(nums).toHaveLength(2);
      expect(nums[0].value).toBe('-10');
      expect(nums[1].value).toBe('-3.5');
    });

    it('should tokenize percentages', () => {
      const tokens = tokenize('50% 100% 33.3%');
      expect(tokens.filter(t => t.type === TokenType.PERCENTAGE)).toHaveLength(3);
      expect(tokens[0].value).toBe('50%');
    });

    it('should tokenize dimensions', () => {
      const tokens = tokenize('10px 2fr 1em 100vh');
      const dims = tokens.filter(t => t.type === TokenType.DIMENSION);
      expect(dims).toHaveLength(4);
      expect(dims[0].value).toBe('10px');
      expect(dims[1].value).toBe('2fr');
      expect(dims[2].value).toBe('1em');
      expect(dims[3].value).toBe('100vh');
    });
  });

  describe('Colors', () => {
    it('should tokenize 3-digit hex colors', () => {
      const tokens = tokenize('#fff #abc #123');
      const colors = tokens.filter(t => t.type === TokenType.HEX_COLOR);
      expect(colors).toHaveLength(3);
      expect(colors[0].value).toBe('fff');
      expect(colors[1].value).toBe('abc');
    });

    it('should tokenize 6-digit hex colors', () => {
      const tokens = tokenize('#ffffff #abcdef #123456');
      const colors = tokens.filter(t => t.type === TokenType.HEX_COLOR);
      expect(colors).toHaveLength(3);
      expect(colors[0].value).toBe('ffffff');
    });

    it('should tokenize 8-digit hex colors (with alpha)', () => {
      const tokens = tokenize('#ffffffff #00000080');
      const colors = tokens.filter(t => t.type === TokenType.HEX_COLOR);
      expect(colors).toHaveLength(2);
    });

    it('should distinguish hex colors from ID selectors', () => {
      const tokens = tokenize('#fff #header');
      expect(tokens[0].type).toBe(TokenType.HEX_COLOR);
      expect(tokens[1].type).toBe(TokenType.HASH);
    });
  });

  describe('Strings', () => {
    it('should tokenize double-quoted strings', () => {
      const tokens = tokenize('"hello world"');
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('hello world');
    });

    it('should tokenize single-quoted strings', () => {
      const tokens = tokenize("'hello world'");
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('hello world');
    });

    it('should handle escape sequences', () => {
      const tokens = tokenize('"line1\\nline2\\ttab"');
      expect(tokens[0].value).toBe('line1\nline2\ttab');
    });

    it('should handle escaped quotes', () => {
      const tokens = tokenize('"say \\"hello\\""');
      expect(tokens[0].value).toBe('say "hello"');
    });

    it('should handle escaped backslashes', () => {
      const tokens = tokenize('"path\\\\file"');
      expect(tokens[0].value).toBe('path\\file');
    });
  });

  describe('Variables', () => {
    it('should tokenize $-style variables', () => {
      const tokens = tokenize('$primary $color-bg $_private');
      const vars = tokens.filter(t => t.type === TokenType.VARIABLE);
      expect(vars).toHaveLength(3);
      expect(vars[0].value).toBe('$primary');
      expect(vars[1].value).toBe('$color-bg');
    });

    it('should tokenize --style CSS variables', () => {
      const tokens = tokenize('--primary --color-bg');
      const vars = tokens.filter(t => t.type === TokenType.VARIABLE);
      expect(vars).toHaveLength(2);
      expect(vars[0].value).toBe('--primary');
    });
  });

  describe('At-rules', () => {
    it('should tokenize @import', () => {
      const tokens = tokenize('@import "theme.tcss"');
      expect(tokens[0].type).toBe(TokenType.AT_KEYWORD);
      expect(tokens[0].value).toBe('@import');
    });

    it('should tokenize @media', () => {
      const tokens = tokenize('@media (min-width: 80)');
      expect(tokens[0].type).toBe(TokenType.AT_KEYWORD);
      expect(tokens[0].value).toBe('@media');
    });
  });

  describe('Functions', () => {
    it('should tokenize function calls', () => {
      const tokens = tokenize('rgb( url( linear-gradient(');
      const funcs = tokens.filter(t => t.type === TokenType.FUNCTION);
      expect(funcs).toHaveLength(3);
      expect(funcs[0].value).toBe('rgb(');
      expect(funcs[1].value).toBe('url(');
      expect(funcs[2].value).toBe('linear-gradient(');
    });
  });

  describe('Important', () => {
    it('should tokenize !important', () => {
      const tokens = tokenize('color: red !important');
      const imp = tokens.find(t => t.type === TokenType.IMPORTANT);
      expect(imp).toBeDefined();
    });

    it('should tokenize !important with whitespace', () => {
      const tokens = tokenize('!  important');
      expect(tokens[0].type).toBe(TokenType.IMPORTANT);
    });
  });

  describe('Comments', () => {
    it('should skip block comments by default', () => {
      const tokens = tokenize('color /* comment */ red');
      expect(tokens.map(t => t.type)).toEqual([
        TokenType.IDENT,
        TokenType.IDENT,
        TokenType.EOF,
      ]);
    });

    it('should include block comments when option set', () => {
      const tokens = tokenize('color /* comment */ red', { includeComments: true });
      expect(tokens.find(t => t.type === TokenType.COMMENT)).toBeDefined();
    });

    it('should skip line comments by default', () => {
      const tokens = tokenize('color // comment\nred');
      expect(tokens.map(t => t.type)).toEqual([
        TokenType.IDENT,
        TokenType.IDENT,
        TokenType.EOF,
      ]);
    });

    it('should include line comments when option set', () => {
      const tokens = tokenize('color // comment\nred', { includeComments: true });
      const comment = tokens.find(t => t.type === TokenType.COMMENT);
      expect(comment).toBeDefined();
      expect(comment?.value).toBe('// comment');
    });
  });

  describe('Whitespace', () => {
    it('should skip whitespace by default', () => {
      const tokens = tokenize('a   b    c');
      expect(tokens.map(t => t.type)).toEqual([
        TokenType.IDENT,
        TokenType.IDENT,
        TokenType.IDENT,
        TokenType.EOF,
      ]);
    });

    it('should include whitespace when option set', () => {
      const tokens = tokenize('a b', { includeWhitespace: true });
      expect(tokens.find(t => t.type === TokenType.WHITESPACE)).toBeDefined();
    });
  });

  describe('Brackets and punctuation', () => {
    it('should tokenize braces', () => {
      const tokens = tokenize('{ }');
      expect(tokens[0].type).toBe(TokenType.LBRACE);
      expect(tokens[1].type).toBe(TokenType.RBRACE);
    });

    it('should tokenize parentheses', () => {
      const tokens = tokenize('( )');
      expect(tokens[0].type).toBe(TokenType.LPAREN);
      expect(tokens[1].type).toBe(TokenType.RPAREN);
    });

    it('should tokenize brackets', () => {
      const tokens = tokenize('[ ]');
      expect(tokens[0].type).toBe(TokenType.LBRACKET);
      expect(tokens[1].type).toBe(TokenType.RBRACKET);
    });

    it('should tokenize semicolons', () => {
      const tokens = tokenize('a; b;');
      const semis = tokens.filter(t => t.type === TokenType.SEMICOLON);
      expect(semis).toHaveLength(2);
    });

    it('should tokenize commas', () => {
      const tokens = tokenize('a, b, c');
      const commas = tokens.filter(t => t.type === TokenType.COMMA);
      expect(commas).toHaveLength(2);
    });

    it('should tokenize colons', () => {
      const tokens = tokenize('color: red');
      expect(tokens[1].type).toBe(TokenType.COLON);
    });
  });

  describe('Complex examples', () => {
    it('should tokenize a complete rule', () => {
      const input = `Box.primary {
        color: #fff;
        padding: 10px;
      }`;
      const tokens = tokenize(input);

      // Box.primary { ... }
      expect(tokens[0]).toMatchObject({ type: TokenType.IDENT, value: 'Box' });
      expect(tokens[1]).toMatchObject({ type: TokenType.DOT });
      expect(tokens[2]).toMatchObject({ type: TokenType.IDENT, value: 'primary' });
      expect(tokens[3]).toMatchObject({ type: TokenType.LBRACE });
    });

    it('should tokenize selector with pseudo-class', () => {
      const tokens = tokenize('Button:focus { border-color: cyan }');
      expect(tokens.map(t => t.type)).toContain(TokenType.COLON);
      expect(tokens.map(t => t.value)).toContain('focus');
    });

    it('should tokenize variable definition', () => {
      const tokens = tokenize('$primary: #007bff;');
      expect(tokens[0].type).toBe(TokenType.VARIABLE);
      expect(tokens[0].value).toBe('$primary');
      expect(tokens[1].type).toBe(TokenType.COLON);
      expect(tokens[2].type).toBe(TokenType.HEX_COLOR);
    });

    it('should tokenize @media query', () => {
      const tokens = tokenize('@media (min-width: 80) { Box { padding: 2 } }');
      expect(tokens[0].type).toBe(TokenType.AT_KEYWORD);
      expect(tokens[0].value).toBe('@media');
    });

    it('should tokenize descendant selector', () => {
      const tokens = tokenize('Form Input { color: gray }');
      expect(tokens[0]).toMatchObject({ type: TokenType.IDENT, value: 'Form' });
      expect(tokens[1]).toMatchObject({ type: TokenType.IDENT, value: 'Input' });
    });

    it('should tokenize child combinator', () => {
      const tokens = tokenize('Box > Text { bold: true }');
      expect(tokens[1].type).toBe(TokenType.GREATER);
    });
  });

  describe('Error handling', () => {
    it('should handle unterminated string', () => {
      const { tokens, errors } = tokenizeWithErrors('"unterminated');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Unterminated string');
    });

    it('should handle unexpected characters', () => {
      const { tokens, errors } = tokenizeWithErrors('a ` b');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should continue after errors', () => {
      const { tokens, errors } = tokenizeWithErrors('a ` b c');
      // Should still get tokens for a, b, c
      const idents = tokens.filter(t => t.type === TokenType.IDENT);
      expect(idents.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Line and column tracking', () => {
    it('should track line numbers', () => {
      const tokens = tokenize('a\nb\nc');
      expect(tokens[0].line).toBe(1);
      expect(tokens[1].line).toBe(2);
      expect(tokens[2].line).toBe(3);
    });

    it('should track column numbers', () => {
      const tokens = tokenize('abc def');
      expect(tokens[0].column).toBe(1);
      expect(tokens[1].column).toBe(5);
    });

    it('should reset column on newline', () => {
      const tokens = tokenize('abc\ndef');
      expect(tokens[0].column).toBe(1);
      expect(tokens[1].column).toBe(1);
    });
  });
});
