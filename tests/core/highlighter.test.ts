/**
 * Syntax Highlighter Tests
 */

import { describe, it, expect } from 'vitest';
import {
  tokenize,
  tokenizeLines,
  getLanguage,
  listLanguages,
  themes,
  getTokenColor,
  tokensToAnsi,
  highlight,
  highlightWithLineNumbers,
} from '../../src/core/highlighter.js';

// =============================================================================
// Language Registry Tests
// =============================================================================

describe('Language Registry', () => {
  it('should list all languages', () => {
    const langs = listLanguages();
    expect(langs).toContain('javascript');
    expect(langs).toContain('typescript');
    expect(langs).toContain('python');
    expect(langs).toContain('go');
    expect(langs).toContain('rust');
    expect(langs.length).toBeGreaterThan(10);
  });

  it('should get language by name', () => {
    const js = getLanguage('javascript');
    expect(js?.name).toBe('JavaScript');
  });

  it('should get language by alias', () => {
    const js = getLanguage('js');
    expect(js?.name).toBe('JavaScript');

    const ts = getLanguage('ts');
    expect(ts?.name).toBe('TypeScript');

    const py = getLanguage('py');
    expect(py?.name).toBe('Python');
  });

  it('should return undefined for unknown language', () => {
    const unknown = getLanguage('nonexistent');
    expect(unknown).toBeUndefined();
  });
});

// =============================================================================
// JavaScript/TypeScript Tokenization Tests
// =============================================================================

describe('JavaScript Tokenization', () => {
  it('should tokenize keywords', () => {
    const tokens = tokenize('const let var', 'javascript');
    const types = tokens.filter((t) => t.type !== 'plain').map((t) => t.type);
    expect(types).toContain('keyword.declaration');
  });

  it('should tokenize control flow keywords', () => {
    const tokens = tokenize('if else for while return', 'javascript');
    const controlTokens = tokens.filter((t) => t.type === 'keyword.control');
    expect(controlTokens.length).toBe(5);
  });

  it('should tokenize strings', () => {
    const tokens = tokenize('"hello" \'world\'', 'javascript');
    const stringTokens = tokens.filter((t) => t.type === 'string');
    expect(stringTokens.length).toBe(2);
    expect(stringTokens[0]?.value).toBe('"hello"');
    expect(stringTokens[1]?.value).toBe("'world'");
  });

  it('should tokenize template strings', () => {
    const tokens = tokenize('`hello ${name}`', 'javascript');
    const templateTokens = tokens.filter((t) => t.type === 'string.template');
    expect(templateTokens.length).toBeGreaterThan(0);
  });

  it('should tokenize numbers', () => {
    const tokens = tokenize('42 3.14 0xff 0b1010 0o777', 'javascript');
    const numberTokens = tokens.filter((t) => t.type.startsWith('number'));
    expect(numberTokens.length).toBe(5);
  });

  it('should tokenize line comments', () => {
    const tokens = tokenize('x = 1; // comment', 'javascript');
    const commentTokens = tokens.filter((t) => t.type === 'comment.line');
    expect(commentTokens.length).toBe(1);
    expect(commentTokens[0]?.value).toBe('// comment');
  });

  it('should tokenize block comments', () => {
    const tokens = tokenize('/* block comment */', 'javascript');
    const commentTokens = tokens.filter((t) => t.type === 'comment.block');
    expect(commentTokens.length).toBe(1);
  });

  it('should tokenize operators', () => {
    const tokens = tokenize('a === b && c !== d', 'javascript');
    const opTokens = tokens.filter((t) => t.type === 'operator');
    expect(opTokens.map((t) => t.value)).toContain('===');
    expect(opTokens.map((t) => t.value)).toContain('&&');
    expect(opTokens.map((t) => t.value)).toContain('!==');
  });

  it('should tokenize function calls', () => {
    const tokens = tokenize('console.log("test")', 'javascript');
    const funcTokens = tokens.filter((t) => t.type === 'function.call');
    expect(funcTokens.length).toBeGreaterThan(0);
  });

  it('should tokenize decorators', () => {
    const tokens = tokenize('@decorator class Foo {}', 'typescript');
    const decoratorTokens = tokens.filter((t) => t.type === 'decorator');
    expect(decoratorTokens.length).toBe(1);
  });

  it('should tokenize regex literals', () => {
    const tokens = tokenize('const re = /test/gi;', 'javascript');
    const regexTokens = tokens.filter((t) => t.type === 'string.regex');
    expect(regexTokens.length).toBe(1);
  });

  it('should tokenize builtins', () => {
    const tokens = tokenize('console Math JSON', 'javascript');
    const builtinTokens = tokens.filter((t) => t.type === 'builtin');
    expect(builtinTokens.length).toBe(3);
  });

  it('should tokenize constants', () => {
    const tokens = tokenize('true false null undefined', 'javascript');
    const boolTokens = tokens.filter((t) => t.type === 'constant.boolean');
    const nullTokens = tokens.filter((t) => t.type === 'constant.null');
    expect(boolTokens.length).toBe(2);
    expect(nullTokens.length).toBe(2);
  });
});

describe('TypeScript Tokenization', () => {
  it('should tokenize type keywords', () => {
    const tokens = tokenize('interface type enum', 'typescript');
    const declTokens = tokens.filter((t) => t.type === 'keyword.declaration');
    expect(declTokens.length).toBe(3);
  });

  it('should tokenize builtin types', () => {
    const tokens = tokenize('string number boolean any unknown', 'typescript');
    const typeTokens = tokens.filter((t) => t.type === 'type.builtin');
    expect(typeTokens.length).toBe(5);
  });

  it('should tokenize type utilities', () => {
    const tokens = tokenize('Partial Required Pick Omit', 'typescript');
    const builtinTokens = tokens.filter((t) => t.type === 'builtin');
    expect(builtinTokens.length).toBe(4);
  });

  it('should tokenize access modifiers', () => {
    const tokens = tokenize('private protected public readonly', 'typescript');
    const declTokens = tokens.filter((t) => t.type === 'keyword.declaration');
    expect(declTokens.length).toBe(4);
  });
});

// =============================================================================
// Python Tokenization Tests
// =============================================================================

describe('Python Tokenization', () => {
  it('should tokenize keywords', () => {
    const tokens = tokenize('def class import from', 'python');
    const declTokens = tokens.filter((t) => t.type === 'keyword.declaration');
    expect(declTokens.length).toBe(4);
  });

  it('should tokenize control flow', () => {
    const tokens = tokenize('if elif else for while', 'python');
    const controlTokens = tokens.filter((t) => t.type === 'keyword.control');
    expect(controlTokens.length).toBe(5);
  });

  it('should tokenize logical operators', () => {
    const tokens = tokenize('and or not', 'python');
    const opTokens = tokens.filter((t) => t.type === 'keyword.operator');
    expect(opTokens.length).toBe(3);
  });

  it('should tokenize builtins', () => {
    const tokens = tokenize('print len range str int', 'python');
    const builtinTokens = tokens.filter((t) => t.type === 'builtin');
    expect(builtinTokens.length).toBe(5);
  });

  it('should tokenize comments', () => {
    const tokens = tokenize('x = 1 # comment', 'python');
    const commentTokens = tokens.filter((t) => t.type === 'comment.line');
    expect(commentTokens.length).toBe(1);
  });

  it('should tokenize decorators', () => {
    const tokens = tokenize('@property\ndef foo(): pass', 'python');
    const decoratorTokens = tokens.filter((t) => t.type === 'decorator');
    expect(decoratorTokens.length).toBe(1);
  });

  it('should tokenize Python booleans', () => {
    const tokens = tokenize('True False None', 'python');
    const boolTokens = tokens.filter((t) => t.type === 'constant.boolean');
    const nullTokens = tokens.filter((t) => t.type === 'constant.null');
    expect(boolTokens.length).toBe(2);
    expect(nullTokens.length).toBe(1);
  });
});

// =============================================================================
// Go Tokenization Tests
// =============================================================================

describe('Go Tokenization', () => {
  it('should tokenize keywords', () => {
    const tokens = tokenize('func var const type struct', 'go');
    const declTokens = tokens.filter((t) => t.type === 'keyword.declaration');
    expect(declTokens.length).toBe(5);
  });

  it('should tokenize control flow', () => {
    const tokens = tokenize('if else for range switch case', 'go');
    const controlTokens = tokens.filter((t) => t.type === 'keyword.control');
    expect(controlTokens.length).toBe(6);
  });

  it('should tokenize builtin types', () => {
    const tokens = tokenize('string int bool error', 'go');
    const typeTokens = tokens.filter((t) => t.type === 'type.builtin');
    expect(typeTokens.length).toBe(4);
  });

  it('should tokenize nil', () => {
    const tokens = tokenize('nil', 'go');
    const nullTokens = tokens.filter((t) => t.type === 'constant.null');
    expect(nullTokens.length).toBe(1);
  });
});

// =============================================================================
// Rust Tokenization Tests
// =============================================================================

describe('Rust Tokenization', () => {
  it('should tokenize keywords', () => {
    const tokens = tokenize('fn let mut struct impl trait', 'rust');
    const declTokens = tokens.filter((t) => t.type === 'keyword.declaration');
    expect(declTokens.length).toBe(6);
  });

  it('should tokenize control flow', () => {
    const tokens = tokenize('if else for while loop match', 'rust');
    const controlTokens = tokens.filter((t) => t.type === 'keyword.control');
    expect(controlTokens.length).toBe(6);
  });

  it('should tokenize types', () => {
    const tokens = tokenize('i32 u64 String Vec Option', 'rust');
    const typeTokens = tokens.filter((t) => t.type === 'type.builtin');
    expect(typeTokens.length).toBe(5);
  });

  it('should tokenize attributes', () => {
    const tokens = tokenize('#[derive(Debug)]', 'rust');
    const attrTokens = tokens.filter((t) => t.type === 'decorator');
    expect(attrTokens.length).toBe(1);
  });

  it('should tokenize lifetime annotations', () => {
    const tokens = tokenize("'a 'static", 'rust');
    const lifetimeTokens = tokens.filter((t) => t.type === 'type.parameter');
    expect(lifetimeTokens.length).toBe(2);
  });
});

// =============================================================================
// SQL Tokenization Tests
// =============================================================================

describe('SQL Tokenization', () => {
  it('should tokenize keywords case-insensitively', () => {
    const tokens1 = tokenize('SELECT FROM WHERE', 'sql');
    const tokens2 = tokenize('select from where', 'sql');

    const declTokens1 = tokens1.filter((t) => t.type === 'keyword.declaration');
    const declTokens2 = tokens2.filter((t) => t.type === 'keyword.declaration');

    expect(declTokens1.length).toBe(3);
    expect(declTokens2.length).toBe(3);
  });

  it('should tokenize functions', () => {
    const tokens = tokenize('COUNT SUM AVG MIN MAX', 'sql');
    const builtinTokens = tokens.filter((t) => t.type === 'builtin');
    expect(builtinTokens.length).toBe(5);
  });

  it('should tokenize strings', () => {
    const tokens = tokenize("SELECT 'hello'", 'sql');
    const stringTokens = tokens.filter((t) => t.type === 'string');
    expect(stringTokens.length).toBe(1);
  });
});

// =============================================================================
// Other Languages Tests
// =============================================================================

describe('Other Languages', () => {
  it('should tokenize Java', () => {
    const tokens = tokenize('public class Main { }', 'java');
    expect(tokens.some((t) => t.type === 'keyword.declaration')).toBe(true);
  });

  it('should tokenize C', () => {
    const tokens = tokenize('#include <stdio.h>', 'c');
    expect(tokens.some((t) => t.type === 'meta')).toBe(true);
  });

  it('should tokenize C++', () => {
    const tokens = tokenize('template<typename T>', 'cpp');
    expect(tokens.some((t) => t.type === 'keyword.declaration')).toBe(true);
  });

  it('should tokenize Ruby', () => {
    const tokens = tokenize('def hello; puts "hi"; end', 'ruby');
    expect(tokens.some((t) => t.type === 'keyword.declaration')).toBe(true);
    expect(tokens.some((t) => t.type === 'builtin')).toBe(true);
  });

  it('should tokenize PHP', () => {
    const tokens = tokenize('<?php echo "hello"; ?>', 'php');
    expect(tokens.some((t) => t.type === 'builtin')).toBe(true);
  });

  it('should tokenize Lua', () => {
    const tokens = tokenize('function hello() print("hi") end', 'lua');
    expect(tokens.some((t) => t.type === 'keyword.declaration')).toBe(true);
  });

  it('should tokenize Bash', () => {
    const tokens = tokenize('#!/bin/bash\necho "hello"', 'bash');
    expect(tokens.some((t) => t.type === 'builtin')).toBe(true);
  });

  it('should tokenize YAML', () => {
    const tokens = tokenize('key: value', 'yaml');
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should tokenize JSON', () => {
    const tokens = tokenize('{"key": "value"}', 'json');
    expect(tokens.some((t) => t.type === 'string')).toBe(true);
  });

  it('should tokenize HTML', () => {
    const tokens = tokenize('<div class="test">content</div>', 'html');
    expect(tokens.some((t) => t.type === 'tag')).toBe(true);
  });

  it('should tokenize CSS', () => {
    const tokens = tokenize('.class { color: red; }', 'css');
    expect(tokens.some((t) => t.type === 'class')).toBe(true);
  });

  it('should tokenize Markdown', () => {
    const tokens = tokenize('# Heading\n**bold**', 'markdown');
    expect(tokens.some((t) => t.type === 'keyword')).toBe(true);
  });

  it('should tokenize Diff', () => {
    const tokens = tokenize('+added\n-removed', 'diff');
    expect(tokens.some((t) => t.type === 'constant.builtin')).toBe(true);
    expect(tokens.some((t) => t.type === 'invalid')).toBe(true);
  });
});

// =============================================================================
// Line Tokenization Tests
// =============================================================================

describe('Line Tokenization', () => {
  it('should tokenize by lines', () => {
    const lines = tokenizeLines('const x = 1;\nconst y = 2;', 'javascript');
    expect(lines.length).toBe(2);
    expect(lines[0]?.lineNumber).toBe(1);
    expect(lines[1]?.lineNumber).toBe(2);
  });

  it('should preserve raw line content', () => {
    const source = 'function foo() {\n  return 42;\n}';
    const lines = tokenizeLines(source, 'javascript');
    expect(lines[0]?.raw).toBe('function foo() {');
    expect(lines[1]?.raw).toBe('  return 42;');
    expect(lines[2]?.raw).toBe('}');
  });

  it('should handle empty lines', () => {
    const lines = tokenizeLines('a\n\nb', 'plain');
    expect(lines.length).toBe(3);
    expect(lines[1]?.raw).toBe('');
  });

  it('should handle single line', () => {
    const lines = tokenizeLines('hello', 'plain');
    expect(lines.length).toBe(1);
    expect(lines[0]?.raw).toBe('hello');
  });
});

// =============================================================================
// Theme Tests
// =============================================================================

describe('Themes', () => {
  it('should have multiple themes', () => {
    expect(Object.keys(themes).length).toBeGreaterThan(5);
  });

  it('should have dark theme', () => {
    expect(themes.dark).toBeDefined();
    expect(themes.dark?.name).toBe('Dark');
  });

  it('should have light theme', () => {
    expect(themes.light).toBeDefined();
    expect(themes.light?.name).toBe('Light');
  });

  it('should have monokai theme', () => {
    expect(themes.monokai).toBeDefined();
    expect(themes.monokai?.name).toBe('Monokai');
  });

  it('should have dracula theme', () => {
    expect(themes.dracula).toBeDefined();
    expect(themes.dracula?.name).toBe('Dracula');
  });

  it('should have nord theme', () => {
    expect(themes.nord).toBeDefined();
    expect(themes.nord?.name).toBe('Nord');
  });

  it('should have high contrast theme', () => {
    expect(themes.highContrast).toBeDefined();
    expect(themes.highContrast?.name).toBe('High Contrast');
  });
});

describe('Token Color Resolution', () => {
  it('should get exact color', () => {
    const color = getTokenColor('keyword', themes.dark!);
    expect(color).toBe('magenta');
  });

  it('should get parent color for sub-types', () => {
    const color = getTokenColor('keyword.control', themes.dark!);
    expect(color).toBe('magenta');
  });

  it('should fall back to default', () => {
    const color = getTokenColor('plain', themes.dark!);
    expect(color).toBe('white');
  });
});

// =============================================================================
// ANSI Output Tests
// =============================================================================

describe('ANSI Output', () => {
  it('should generate ANSI output', () => {
    const tokens = tokenize('const x = 1;', 'javascript');
    const ansi = tokensToAnsi(tokens);
    expect(ansi).toContain('\x1b['); // ANSI escape
    expect(ansi).toContain('\x1b[0m'); // Reset
  });

  it('should use theme colors', () => {
    const tokens = tokenize('const x', 'javascript');
    const ansi = tokensToAnsi(tokens, themes.dark!);
    expect(ansi).toContain('\x1b[35m'); // Magenta for keyword
  });

  it('should highlight with default theme', () => {
    const result = highlight('const x = 1;', 'javascript');
    expect(result).toContain('\x1b[');
  });

  it('should highlight with specified theme', () => {
    const result = highlight('const x = 1;', 'javascript', 'monokai');
    expect(result).toContain('\x1b[');
  });

  it('should add line numbers', () => {
    const result = highlightWithLineNumbers('const x = 1;\nconst y = 2;', 'javascript');
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('│');
  });

  it('should highlight specified lines', () => {
    const result = highlightWithLineNumbers('a\nb\nc', 'plain', {
      highlightLines: [2],
    });
    expect(result).toContain('▶');
  });

  it('should respect start line option', () => {
    const result = highlightWithLineNumbers('a\nb', 'plain', { startLine: 10 });
    expect(result).toContain('10');
    expect(result).toContain('11');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty input', () => {
    const tokens = tokenize('', 'javascript');
    expect(tokens).toEqual([]);
  });

  it('should handle whitespace only', () => {
    const tokens = tokenize('   \n\t  ', 'javascript');
    const nonPlain = tokens.filter((t) => t.type !== 'plain');
    expect(nonPlain.length).toBe(0);
  });

  it('should handle unknown language', () => {
    const tokens = tokenize('hello world', 'unknown');
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should handle unterminated string', () => {
    const tokens = tokenize('"unterminated', 'javascript');
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should handle unterminated comment', () => {
    const tokens = tokenize('/* unterminated', 'javascript');
    const commentTokens = tokens.filter((t) => t.type === 'comment.block');
    expect(commentTokens.length).toBe(1);
  });

  it('should handle nested brackets', () => {
    const tokens = tokenize('a[b[c[d]]]', 'javascript');
    const bracketTokens = tokens.filter((t) => t.type === 'punctuation.bracket');
    expect(bracketTokens.length).toBe(6); // 3 open + 3 close
  });

  it('should handle escaped characters in strings', () => {
    const tokens = tokenize('"hello\\nworld\\t"', 'javascript');
    const stringTokens = tokens.filter((t) => t.type === 'string');
    expect(stringTokens.length).toBe(1);
    expect(stringTokens[0]?.value).toBe('"hello\\nworld\\t"');
  });

  it('should handle unicode identifiers', () => {
    const tokens = tokenize('const café = 1;', 'javascript');
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should preserve token positions', () => {
    const source = 'const x = 1;';
    const tokens = tokenize(source, 'javascript');

    for (const token of tokens) {
      expect(source.slice(token.start, token.end)).toBe(token.value);
    }
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration', () => {
  it('should tokenize complex JavaScript', () => {
    const code = `
import { foo } from 'bar';

async function* generator() {
  const result = await fetch('/api');
  yield* result.json();
}

class MyClass extends BaseClass {
  #privateField = 42;

  static async create() {
    return new MyClass();
  }
}
`;
    const tokens = tokenize(code, 'javascript');
    expect(tokens.length).toBeGreaterThan(50);
  });

  it('should tokenize complex TypeScript', () => {
    const code = `
interface Config<T extends Record<string, unknown>> {
  readonly value: T;
  optional?: string;
}

type Result<T> = T extends Promise<infer U> ? U : T;

const fn: <T>(x: T) => T = (x) => x;

@decorator
class Service implements IService {
  constructor(private readonly config: Config<{}>) {}
}
`;
    const tokens = tokenize(code, 'typescript');
    expect(tokens.length).toBeGreaterThan(50);
  });

  it('should tokenize complex Python', () => {
    const code = `
import asyncio
from typing import Dict, List, Optional

@dataclass
class Config:
    name: str
    value: int = 0

async def fetch_data(url: str) -> Optional[Dict]:
    """Fetch data from URL."""
    async with aiohttp.ClientSession() as session:
        response = await session.get(url)
        return await response.json()

if __name__ == "__main__":
    result = asyncio.run(fetch_data("https://api.example.com"))
`;
    const tokens = tokenize(code, 'python');
    expect(tokens.length).toBeGreaterThan(50);
  });

  it('should tokenize complex Rust', () => {
    const code = `
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Config<'a> {
    name: &'a str,
    values: HashMap<String, i32>,
}

impl<'a> Config<'a> {
    pub fn new(name: &'a str) -> Self {
        Self {
            name,
            values: HashMap::new(),
        }
    }

    pub fn get(&self, key: &str) -> Option<&i32> {
        self.values.get(key)
    }
}
`;
    const tokens = tokenize(code, 'rust');
    expect(tokens.length).toBeGreaterThan(50);
  });

  it('should produce valid ANSI for all themes', () => {
    const code = 'const x = 42;';
    for (const themeName of Object.keys(themes)) {
      const result = highlight(code, 'javascript', themeName);
      expect(result).toContain('\x1b[');
      expect(result).toContain('const');
    }
  });
});
