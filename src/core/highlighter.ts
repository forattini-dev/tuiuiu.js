/**
 * Syntax Highlighter
 *
 * Zero-dependency syntax highlighting with support for 20+ languages.
 * Features:
 * - Token-based highlighting
 * - Multiple themes (dark, light, high-contrast, monokai, etc.)
 * - ANSI escape sequence output
 * - VNode output for rendering
 * - Line-by-line API
 * - Bracket matching
 * - Indentation guides
 *
 * @example
 * ```typescript
 * const tokens = tokenize('const x = 42;', 'typescript');
 * const ansi = tokensToAnsi(tokens, themes.monokai);
 * console.log(ansi);
 * ```
 */

// =============================================================================
// Types
// =============================================================================

/** Token types for syntax highlighting */
export type TokenType =
  | 'keyword'
  | 'keyword.control' // if, for, while, etc.
  | 'keyword.declaration' // const, let, var, function, class
  | 'keyword.operator' // typeof, instanceof, new
  | 'string'
  | 'string.template'
  | 'string.regex'
  | 'string.escape'
  | 'number'
  | 'number.float'
  | 'number.hex'
  | 'number.binary'
  | 'number.octal'
  | 'comment'
  | 'comment.line'
  | 'comment.block'
  | 'comment.doc'
  | 'function'
  | 'function.call'
  | 'function.definition'
  | 'variable'
  | 'variable.parameter'
  | 'variable.property'
  | 'operator'
  | 'operator.comparison'
  | 'operator.assignment'
  | 'operator.arithmetic'
  | 'operator.logical'
  | 'punctuation'
  | 'punctuation.bracket'
  | 'punctuation.separator'
  | 'punctuation.accessor'
  | 'type'
  | 'type.builtin'
  | 'type.parameter'
  | 'constant'
  | 'constant.boolean'
  | 'constant.null'
  | 'constant.builtin'
  | 'builtin'
  | 'class'
  | 'interface'
  | 'namespace'
  | 'decorator'
  | 'tag' // HTML/XML tags
  | 'tag.name'
  | 'tag.attribute'
  | 'entity' // HTML entities
  | 'meta' // Preprocessor, etc.
  | 'invalid'
  | 'plain';

/** A single token */
export interface Token {
  type: TokenType;
  value: string;
  /** Starting position (character offset) */
  start: number;
  /** Ending position (character offset) */
  end: number;
  /** Optional scope for nested highlighting */
  scope?: string;
}

/** Highlighted line */
export interface HighlightedLine {
  lineNumber: number;
  tokens: Token[];
  raw: string;
}

/** Theme color mapping */
export interface HighlightTheme {
  name: string;
  colors: Partial<Record<TokenType, string>>;
  /** Background color */
  background?: string;
  /** Line number color */
  lineNumber?: string;
  /** Selection color */
  selection?: string;
  /** Current line highlight */
  currentLine?: string;
  /** Bracket match color */
  bracketMatch?: string;
  /** Default text color */
  default?: string;
}

/** Language definition */
export interface LanguageDefinition {
  name: string;
  aliases?: string[];
  /** Keywords */
  keywords?: string[];
  /** Control flow keywords */
  controlKeywords?: string[];
  /** Declaration keywords */
  declarationKeywords?: string[];
  /** Operator keywords */
  operatorKeywords?: string[];
  /** Built-in functions */
  builtins?: string[];
  /** Type names */
  types?: string[];
  /** Constants */
  constants?: string[];
  /** Boolean literals */
  booleans?: string[];
  /** Null literal(s) */
  nulls?: string[];
  /** String delimiters */
  stringDelimiters?: string[];
  /** Template string delimiter */
  templateDelimiter?: string;
  /** Regex for string patterns */
  stringPattern?: RegExp;
  /** Single-line comment prefix */
  lineComment?: string;
  /** Block comment start */
  blockCommentStart?: string;
  /** Block comment end */
  blockCommentEnd?: string;
  /** Doc comment pattern */
  docCommentStart?: string;
  /** Number patterns */
  numberPatterns?: {
    decimal?: RegExp;
    hex?: RegExp;
    binary?: RegExp;
    octal?: RegExp;
    float?: RegExp;
  };
  /** Operators */
  operators?: string[];
  /** Case insensitive keywords */
  caseInsensitive?: boolean;
  /** Custom token patterns */
  customPatterns?: Array<{
    pattern: RegExp;
    type: TokenType;
  }>;
}

// =============================================================================
// Language Definitions
// =============================================================================

const languages: Record<string, LanguageDefinition> = {
  javascript: {
    name: 'JavaScript',
    aliases: ['js'],
    controlKeywords: [
      'if',
      'else',
      'for',
      'while',
      'do',
      'switch',
      'case',
      'default',
      'break',
      'continue',
      'return',
      'throw',
      'try',
      'catch',
      'finally',
    ],
    declarationKeywords: [
      'const',
      'let',
      'var',
      'function',
      'class',
      'async',
      'await',
      'static',
      'get',
      'set',
      'export',
      'import',
      'from',
      'extends',
    ],
    operatorKeywords: ['typeof', 'instanceof', 'new', 'delete', 'void', 'in', 'of', 'yield'],
    builtins: [
      'console',
      'Math',
      'JSON',
      'Object',
      'Array',
      'String',
      'Number',
      'Boolean',
      'Date',
      'Promise',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Symbol',
      'BigInt',
      'RegExp',
      'Error',
      'fetch',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
      'require',
      'module',
      'exports',
      'process',
    ],
    constants: ['Infinity', 'NaN'],
    booleans: ['true', 'false'],
    nulls: ['null', 'undefined'],
    stringDelimiters: ["'", '"'],
    templateDelimiter: '`',
    lineComment: '//',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    docCommentStart: '/**',
    numberPatterns: {
      hex: /^0x[0-9a-f]+n?/i,
      binary: /^0b[01]+n?/i,
      octal: /^0o[0-7]+n?/i,
      float: /^\d+\.\d*(?:e[+-]?\d+)?/i,
      decimal: /^\d+n?/,
    },
    operators: [
      '===',
      '!==',
      '==',
      '!=',
      '>=',
      '<=',
      '=>',
      '&&',
      '||',
      '??',
      '++',
      '--',
      '**',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '&=',
      '|=',
      '^=',
      '>>=',
      '<<=',
      '>>>=',
      '...',
      '?.',
      '+',
      '-',
      '*',
      '/',
      '%',
      '&',
      '|',
      '^',
      '~',
      '!',
      '<',
      '>',
      '=',
      '?',
      ':',
    ],
    customPatterns: [
      { pattern: /^@\w+/, type: 'decorator' },
      { pattern: /^\/(?![/*])(?:[^/\\]|\\.)+\/[gimsuy]*/, type: 'string.regex' },
    ],
  },

  typescript: {
    name: 'TypeScript',
    aliases: ['ts'],
    controlKeywords: [
      'if',
      'else',
      'for',
      'while',
      'do',
      'switch',
      'case',
      'default',
      'break',
      'continue',
      'return',
      'throw',
      'try',
      'catch',
      'finally',
    ],
    declarationKeywords: [
      'const',
      'let',
      'var',
      'function',
      'class',
      'async',
      'await',
      'static',
      'get',
      'set',
      'export',
      'import',
      'from',
      'extends',
      'implements',
      'interface',
      'type',
      'enum',
      'namespace',
      'abstract',
      'declare',
      'readonly',
      'private',
      'protected',
      'public',
    ],
    operatorKeywords: [
      'typeof',
      'instanceof',
      'new',
      'delete',
      'void',
      'in',
      'of',
      'yield',
      'as',
      'is',
      'keyof',
      'infer',
    ],
    builtins: [
      'console',
      'Math',
      'JSON',
      'Object',
      'Array',
      'String',
      'Number',
      'Boolean',
      'Date',
      'Promise',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Symbol',
      'BigInt',
      'RegExp',
      'Error',
      'Partial',
      'Required',
      'Readonly',
      'Record',
      'Pick',
      'Omit',
      'Exclude',
      'Extract',
      'NonNullable',
      'ReturnType',
      'Parameters',
      'InstanceType',
      'ThisType',
      'Awaited',
    ],
    types: [
      'string',
      'number',
      'boolean',
      'void',
      'never',
      'any',
      'unknown',
      'object',
      'symbol',
      'bigint',
    ],
    constants: ['Infinity', 'NaN'],
    booleans: ['true', 'false'],
    nulls: ['null', 'undefined'],
    stringDelimiters: ["'", '"'],
    templateDelimiter: '`',
    lineComment: '//',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    docCommentStart: '/**',
    numberPatterns: {
      hex: /^0x[0-9a-f]+n?/i,
      binary: /^0b[01]+n?/i,
      octal: /^0o[0-7]+n?/i,
      float: /^\d+\.\d*(?:e[+-]?\d+)?/i,
      decimal: /^\d+n?/,
    },
    operators: [
      '===',
      '!==',
      '==',
      '!=',
      '>=',
      '<=',
      '=>',
      '&&',
      '||',
      '??',
      '++',
      '--',
      '**',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '&=',
      '|=',
      '^=',
      '>>=',
      '<<=',
      '>>>=',
      '...',
      '?.',
      '+',
      '-',
      '*',
      '/',
      '%',
      '&',
      '|',
      '^',
      '~',
      '!',
      '<',
      '>',
      '=',
      '?',
      ':',
    ],
    customPatterns: [
      { pattern: /^@\w+/, type: 'decorator' },
      { pattern: /^\/(?![/*])(?:[^/\\]|\\.)+\/[gimsuy]*/, type: 'string.regex' },
    ],
  },

  python: {
    name: 'Python',
    aliases: ['py'],
    controlKeywords: [
      'if',
      'elif',
      'else',
      'for',
      'while',
      'break',
      'continue',
      'return',
      'raise',
      'try',
      'except',
      'finally',
      'with',
      'as',
      'pass',
      'yield',
      'assert',
      'match',
      'case',
    ],
    declarationKeywords: [
      'def',
      'class',
      'import',
      'from',
      'async',
      'await',
      'lambda',
      'global',
      'nonlocal',
    ],
    operatorKeywords: ['and', 'or', 'not', 'in', 'is', 'del'],
    builtins: [
      'print',
      'len',
      'range',
      'str',
      'int',
      'float',
      'list',
      'dict',
      'set',
      'tuple',
      'bool',
      'type',
      'isinstance',
      'issubclass',
      'hasattr',
      'getattr',
      'setattr',
      'delattr',
      'open',
      'input',
      'map',
      'filter',
      'zip',
      'enumerate',
      'sorted',
      'reversed',
      'sum',
      'min',
      'max',
      'abs',
      'round',
      'any',
      'all',
      'iter',
      'next',
      'super',
      'object',
      'repr',
      'vars',
      'dir',
      'id',
      'hex',
      'oct',
      'bin',
      'chr',
      'ord',
      'format',
      'staticmethod',
      'classmethod',
      'property',
    ],
    constants: ['self', 'cls', '__name__', '__main__', '__file__', '__doc__'],
    booleans: ['True', 'False'],
    nulls: ['None'],
    stringDelimiters: ["'", '"'],
    lineComment: '#',
    numberPatterns: {
      hex: /^0x[0-9a-f]+/i,
      binary: /^0b[01]+/i,
      octal: /^0o[0-7]+/i,
      float: /^\d+\.\d*(?:e[+-]?\d+)?/i,
      decimal: /^\d+/,
    },
    operators: [
      '**',
      '//',
      '==',
      '!=',
      '>=',
      '<=',
      '+=',
      '-=',
      '*=',
      '/=',
      '//=',
      '%=',
      '**=',
      '&=',
      '|=',
      '^=',
      '>>=',
      '<<=',
      ':=',
      '->',
      '+',
      '-',
      '*',
      '/',
      '%',
      '&',
      '|',
      '^',
      '~',
      '<',
      '>',
      '=',
      '@',
    ],
    customPatterns: [
      { pattern: /^@\w+/, type: 'decorator' },
      { pattern: /^f"[^"]*"/, type: 'string.template' },
      { pattern: /^f'[^']*'/, type: 'string.template' },
      { pattern: /^r"[^"]*"/, type: 'string.regex' },
      { pattern: /^r'[^']*'/, type: 'string.regex' },
      { pattern: /^"""[\s\S]*?"""/, type: 'string' },
      { pattern: /^'''[\s\S]*?'''/, type: 'string' },
    ],
  },

  go: {
    name: 'Go',
    aliases: ['golang'],
    controlKeywords: [
      'if',
      'else',
      'for',
      'range',
      'switch',
      'case',
      'default',
      'break',
      'continue',
      'return',
      'goto',
      'fallthrough',
      'defer',
      'go',
      'select',
    ],
    declarationKeywords: [
      'func',
      'var',
      'const',
      'type',
      'struct',
      'interface',
      'map',
      'chan',
      'package',
      'import',
    ],
    operatorKeywords: [],
    builtins: [
      'make',
      'new',
      'append',
      'len',
      'cap',
      'close',
      'delete',
      'copy',
      'panic',
      'recover',
      'print',
      'println',
      'complex',
      'real',
      'imag',
    ],
    types: [
      'string',
      'int',
      'int8',
      'int16',
      'int32',
      'int64',
      'uint',
      'uint8',
      'uint16',
      'uint32',
      'uint64',
      'uintptr',
      'float32',
      'float64',
      'complex64',
      'complex128',
      'bool',
      'byte',
      'rune',
      'error',
      'any',
    ],
    constants: ['iota'],
    booleans: ['true', 'false'],
    nulls: ['nil'],
    stringDelimiters: ['"'],
    lineComment: '//',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    numberPatterns: {
      hex: /^0x[0-9a-f]+/i,
      binary: /^0b[01]+/i,
      octal: /^0o[0-7]+/i,
      float: /^\d+\.\d*(?:e[+-]?\d+)?/i,
      decimal: /^\d+/,
    },
    operators: [
      ':=',
      '==',
      '!=',
      '>=',
      '<=',
      '&&',
      '||',
      '++',
      '--',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '&=',
      '|=',
      '^=',
      '>>=',
      '<<=',
      '&^=',
      '<-',
      '...',
      '+',
      '-',
      '*',
      '/',
      '%',
      '&',
      '|',
      '^',
      '!',
      '<',
      '>',
      '=',
    ],
    customPatterns: [{ pattern: /^`[^`]*`/, type: 'string' }],
  },

  rust: {
    name: 'Rust',
    aliases: ['rs'],
    controlKeywords: [
      'if',
      'else',
      'for',
      'while',
      'loop',
      'match',
      'break',
      'continue',
      'return',
      'yield',
    ],
    declarationKeywords: [
      'fn',
      'let',
      'mut',
      'const',
      'static',
      'struct',
      'enum',
      'impl',
      'trait',
      'type',
      'where',
      'pub',
      'mod',
      'use',
      'crate',
      'extern',
      'async',
      'await',
      'dyn',
      'unsafe',
      'ref',
      'move',
    ],
    operatorKeywords: ['as', 'in'],
    builtins: [
      'Some',
      'None',
      'Ok',
      'Err',
      'println',
      'print',
      'format',
      'panic',
      'assert',
      'assert_eq',
      'assert_ne',
      'vec',
      'todo',
      'unimplemented',
      'unreachable',
    ],
    types: [
      'i8',
      'i16',
      'i32',
      'i64',
      'i128',
      'isize',
      'u8',
      'u16',
      'u32',
      'u64',
      'u128',
      'usize',
      'f32',
      'f64',
      'bool',
      'char',
      'str',
      'String',
      'Vec',
      'Option',
      'Result',
      'Box',
      'Rc',
      'Arc',
      'Cell',
      'RefCell',
      'HashMap',
      'HashSet',
      'BTreeMap',
      'BTreeSet',
    ],
    constants: ['self', 'Self'],
    booleans: ['true', 'false'],
    nulls: [],
    stringDelimiters: ['"'],
    lineComment: '//',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    docCommentStart: '///',
    numberPatterns: {
      hex: /^0x[0-9a-f_]+(?:i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize)?/i,
      binary: /^0b[01_]+(?:i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize)?/i,
      octal: /^0o[0-7_]+(?:i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize)?/i,
      float: /^\d+(?:_\d+)*\.\d*(?:_\d+)*(?:e[+-]?\d+)?(?:f32|f64)?/i,
      decimal: /^\d+(?:_\d+)*(?:i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize)?/,
    },
    operators: [
      '..=',
      '..',
      '=>',
      '->',
      '::',
      '==',
      '!=',
      '>=',
      '<=',
      '&&',
      '||',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '&=',
      '|=',
      '^=',
      '>>=',
      '<<=',
      '+',
      '-',
      '*',
      '/',
      '%',
      '&',
      '|',
      '^',
      '!',
      '<',
      '>',
      '=',
      '?',
    ],
    customPatterns: [
      { pattern: /^#!\[[\s\S]*?\]/, type: 'meta' },
      { pattern: /^#\[[\s\S]*?\]/, type: 'decorator' },
      { pattern: /^r#*"[^"]*"#*/, type: 'string' },
      { pattern: /^b"[^"]*"/, type: 'string' },
      { pattern: /^'[^'\\]'/, type: 'string' },
      { pattern: /^'\\.'/, type: 'string.escape' },
      { pattern: /^'\w+/, type: 'type.parameter' },
    ],
  },

  java: {
    name: 'Java',
    aliases: [],
    controlKeywords: [
      'if',
      'else',
      'for',
      'while',
      'do',
      'switch',
      'case',
      'default',
      'break',
      'continue',
      'return',
      'throw',
      'try',
      'catch',
      'finally',
    ],
    declarationKeywords: [
      'class',
      'interface',
      'enum',
      'extends',
      'implements',
      'import',
      'package',
      'new',
      'public',
      'private',
      'protected',
      'static',
      'final',
      'abstract',
      'synchronized',
      'volatile',
      'transient',
      'native',
      'strictfp',
      'throws',
      'record',
      'sealed',
      'permits',
      'var',
    ],
    operatorKeywords: ['instanceof'],
    builtins: ['System', 'String', 'Integer', 'Double', 'Float', 'Boolean', 'Character', 'Object'],
    types: ['int', 'long', 'short', 'byte', 'float', 'double', 'char', 'boolean', 'void'],
    constants: ['this', 'super'],
    booleans: ['true', 'false'],
    nulls: ['null'],
    stringDelimiters: ['"'],
    lineComment: '//',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    docCommentStart: '/**',
    numberPatterns: {
      hex: /^0x[0-9a-f_]+[lL]?/i,
      binary: /^0b[01_]+[lL]?/i,
      float: /^\d+(?:_\d+)*\.?\d*(?:_\d+)*(?:e[+-]?\d+)?[fFdD]?/i,
      decimal: /^\d+(?:_\d+)*[lL]?/,
    },
    operators: [
      '==',
      '!=',
      '>=',
      '<=',
      '&&',
      '||',
      '++',
      '--',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '&=',
      '|=',
      '^=',
      '>>=',
      '<<=',
      '>>>=',
      '->',
      '::',
      '+',
      '-',
      '*',
      '/',
      '%',
      '&',
      '|',
      '^',
      '~',
      '!',
      '<',
      '>',
      '=',
      '?',
      ':',
    ],
    customPatterns: [{ pattern: /^@\w+/, type: 'decorator' }],
  },

  c: {
    name: 'C',
    aliases: ['h'],
    controlKeywords: [
      'if',
      'else',
      'for',
      'while',
      'do',
      'switch',
      'case',
      'default',
      'break',
      'continue',
      'return',
      'goto',
    ],
    declarationKeywords: [
      'struct',
      'union',
      'enum',
      'typedef',
      'extern',
      'static',
      'const',
      'volatile',
      'register',
      'inline',
      'restrict',
      'auto',
      'signed',
      'unsigned',
    ],
    operatorKeywords: ['sizeof'],
    builtins: ['printf', 'scanf', 'malloc', 'free', 'calloc', 'realloc', 'sizeof', 'NULL'],
    types: ['int', 'long', 'short', 'char', 'float', 'double', 'void', 'size_t', 'ptrdiff_t'],
    constants: ['NULL', 'EOF', 'stdin', 'stdout', 'stderr'],
    booleans: [],
    nulls: ['NULL'],
    stringDelimiters: ['"'],
    lineComment: '//',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    numberPatterns: {
      hex: /^0x[0-9a-f]+[uUlL]*/i,
      octal: /^0[0-7]+[uUlL]*/,
      float: /^\d+\.\d*(?:e[+-]?\d+)?[fFlL]?/i,
      decimal: /^\d+[uUlL]*/,
    },
    operators: [
      '->',
      '++',
      '--',
      '==',
      '!=',
      '>=',
      '<=',
      '&&',
      '||',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '&=',
      '|=',
      '^=',
      '>>=',
      '<<=',
      '+',
      '-',
      '*',
      '/',
      '%',
      '&',
      '|',
      '^',
      '~',
      '!',
      '<',
      '>',
      '=',
      '?',
      ':',
    ],
    customPatterns: [
      { pattern: /^#\s*\w+.*/, type: 'meta' },
      { pattern: /^'(?:[^'\\]|\\.)+'/, type: 'string' },
    ],
  },

  cpp: {
    name: 'C++',
    aliases: ['cxx', 'cc', 'hpp', 'hxx'],
    controlKeywords: [
      'if',
      'else',
      'for',
      'while',
      'do',
      'switch',
      'case',
      'default',
      'break',
      'continue',
      'return',
      'goto',
      'throw',
      'try',
      'catch',
    ],
    declarationKeywords: [
      'class',
      'struct',
      'union',
      'enum',
      'typedef',
      'extern',
      'static',
      'const',
      'constexpr',
      'consteval',
      'constinit',
      'volatile',
      'mutable',
      'register',
      'inline',
      'virtual',
      'override',
      'final',
      'explicit',
      'friend',
      'public',
      'private',
      'protected',
      'namespace',
      'using',
      'template',
      'typename',
      'concept',
      'requires',
      'co_await',
      'co_return',
      'co_yield',
    ],
    operatorKeywords: ['sizeof', 'alignof', 'typeid', 'new', 'delete', 'noexcept', 'decltype'],
    builtins: [
      'std',
      'cout',
      'cin',
      'endl',
      'string',
      'vector',
      'map',
      'set',
      'unique_ptr',
      'shared_ptr',
    ],
    types: [
      'int',
      'long',
      'short',
      'char',
      'float',
      'double',
      'void',
      'bool',
      'wchar_t',
      'char8_t',
      'char16_t',
      'char32_t',
      'auto',
      'size_t',
    ],
    constants: ['this', 'nullptr'],
    booleans: ['true', 'false'],
    nulls: ['nullptr', 'NULL'],
    stringDelimiters: ['"'],
    lineComment: '//',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    numberPatterns: {
      hex: /^0x[0-9a-f']+[uUlL]*/i,
      binary: /^0b[01']+[uUlL]*/i,
      octal: /^0[0-7']+[uUlL]*/,
      float: /^\d+(?:'\d+)*\.\d*(?:'\d+)*(?:e[+-]?\d+)?[fFlL]?/i,
      decimal: /^\d+(?:'\d+)*[uUlL]*/,
    },
    operators: [
      '::',
      '->',
      '.*',
      '->*',
      '++',
      '--',
      '==',
      '!=',
      '>=',
      '<=',
      '<=>',
      '&&',
      '||',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '&=',
      '|=',
      '^=',
      '>>=',
      '<<=',
      '+',
      '-',
      '*',
      '/',
      '%',
      '&',
      '|',
      '^',
      '~',
      '!',
      '<',
      '>',
      '=',
      '?',
      ':',
    ],
    customPatterns: [
      { pattern: /^#\s*\w+.*/, type: 'meta' },
      { pattern: /^R"[^(]*\([^)]*\)[^"]*"/, type: 'string' },
      { pattern: /^'(?:[^'\\]|\\.)+'/, type: 'string' },
    ],
  },

  ruby: {
    name: 'Ruby',
    aliases: ['rb'],
    controlKeywords: [
      'if',
      'elsif',
      'else',
      'unless',
      'case',
      'when',
      'while',
      'until',
      'for',
      'break',
      'next',
      'redo',
      'retry',
      'return',
      'raise',
      'rescue',
      'ensure',
      'begin',
      'end',
      'then',
      'do',
      'yield',
    ],
    declarationKeywords: [
      'def',
      'class',
      'module',
      'attr_reader',
      'attr_writer',
      'attr_accessor',
      'include',
      'extend',
      'require',
      'require_relative',
      'load',
      'alias',
      'private',
      'protected',
      'public',
      'lambda',
      'proc',
    ],
    operatorKeywords: ['and', 'or', 'not', 'in', 'defined?'],
    builtins: [
      'puts',
      'print',
      'p',
      'gets',
      'Array',
      'Hash',
      'String',
      'Integer',
      'Float',
      'Symbol',
      'Range',
      'Regexp',
      'Time',
      'File',
      'IO',
      'Dir',
      'Proc',
      'Method',
      'Binding',
      'Object',
      'Class',
      'Module',
    ],
    constants: ['self', '__FILE__', '__LINE__', '__ENCODING__', 'ARGV', 'ENV'],
    booleans: ['true', 'false'],
    nulls: ['nil'],
    stringDelimiters: ["'", '"'],
    lineComment: '#',
    blockCommentStart: '=begin',
    blockCommentEnd: '=end',
    numberPatterns: {
      hex: /^0x[0-9a-f_]+/i,
      binary: /^0b[01_]+/i,
      octal: /^0o?[0-7_]+/i,
      float: /^\d+(?:_\d+)*\.\d*(?:_\d+)*(?:e[+-]?\d+)?/i,
      decimal: /^\d+(?:_\d+)*/,
    },
    operators: [
      '**',
      '==',
      '===',
      '!=',
      '>=',
      '<=',
      '<=>',
      '=~',
      '!~',
      '&&',
      '||',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '**=',
      '&=',
      '|=',
      '^=',
      '>>=',
      '<<=',
      '||=',
      '&&=',
      '<<',
      '>>',
      '..',
      '...',
      '&.',
      '+',
      '-',
      '*',
      '/',
      '%',
      '&',
      '|',
      '^',
      '~',
      '!',
      '<',
      '>',
      '=',
      '?',
      ':',
    ],
    customPatterns: [
      { pattern: /^:[a-zA-Z_]\w*/, type: 'constant' },
      { pattern: /^@{1,2}\w+/, type: 'variable' },
      { pattern: /^\$\w+/, type: 'variable' },
      { pattern: /^%[qQwWiIxrs]?./, type: 'string' },
      { pattern: /^\/(?:[^/\\]|\\.)+\/[imxo]*/, type: 'string.regex' },
    ],
  },

  php: {
    name: 'PHP',
    aliases: [],
    controlKeywords: [
      'if',
      'else',
      'elseif',
      'endif',
      'for',
      'endfor',
      'foreach',
      'endforeach',
      'while',
      'endwhile',
      'do',
      'switch',
      'case',
      'default',
      'endswitch',
      'break',
      'continue',
      'return',
      'throw',
      'try',
      'catch',
      'finally',
      'goto',
    ],
    declarationKeywords: [
      'function',
      'class',
      'interface',
      'trait',
      'extends',
      'implements',
      'abstract',
      'final',
      'public',
      'private',
      'protected',
      'static',
      'const',
      'var',
      'global',
      'namespace',
      'use',
      'new',
      'clone',
      'fn',
      'match',
      'enum',
      'readonly',
    ],
    operatorKeywords: ['instanceof', 'and', 'or', 'xor', 'as'],
    builtins: [
      'echo',
      'print',
      'array',
      'isset',
      'empty',
      'unset',
      'include',
      'include_once',
      'require',
      'require_once',
      'die',
      'exit',
    ],
    types: [
      'int',
      'float',
      'bool',
      'string',
      'array',
      'object',
      'callable',
      'iterable',
      'void',
      'null',
      'mixed',
      'never',
    ],
    constants: ['__CLASS__', '__DIR__', '__FILE__', '__FUNCTION__', '__LINE__', '__METHOD__', '__NAMESPACE__', '__TRAIT__'],
    booleans: ['true', 'false', 'TRUE', 'FALSE'],
    nulls: ['null', 'NULL'],
    stringDelimiters: ["'", '"'],
    lineComment: '//',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    docCommentStart: '/**',
    numberPatterns: {
      hex: /^0x[0-9a-f_]+/i,
      binary: /^0b[01_]+/i,
      octal: /^0[0-7_]+/,
      float: /^\d+(?:_\d+)*\.\d*(?:_\d+)*(?:e[+-]?\d+)?/i,
      decimal: /^\d+(?:_\d+)*/,
    },
    operators: [
      '===',
      '!==',
      '==',
      '!=',
      '<>',
      '>=',
      '<=',
      '<=>',
      '&&',
      '||',
      '??',
      '?:',
      '++',
      '--',
      '**',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '**=',
      '.=',
      '&=',
      '|=',
      '^=',
      '>>=',
      '<<=',
      '??=',
      '=>',
      '->',
      '::',
      '?->',
      '...',
      '@',
      '+',
      '-',
      '*',
      '/',
      '%',
      '.',
      '&',
      '|',
      '^',
      '~',
      '!',
      '<',
      '>',
      '=',
      '?',
      ':',
    ],
    customPatterns: [
      { pattern: /^\$\w+/, type: 'variable' },
      { pattern: /^#\[[\s\S]*?\]/, type: 'decorator' },
      { pattern: /^<<<['"]?\w+['"]?\n[\s\S]*?\n\w+;?/, type: 'string' },
    ],
  },

  lua: {
    name: 'Lua',
    aliases: [],
    controlKeywords: [
      'if',
      'then',
      'else',
      'elseif',
      'for',
      'while',
      'repeat',
      'until',
      'do',
      'end',
      'break',
      'return',
      'goto',
      'in',
    ],
    declarationKeywords: ['function', 'local'],
    operatorKeywords: ['and', 'or', 'not'],
    builtins: [
      'print',
      'type',
      'pairs',
      'ipairs',
      'next',
      'setmetatable',
      'getmetatable',
      'rawget',
      'rawset',
      'rawequal',
      'rawlen',
      'tonumber',
      'tostring',
      'pcall',
      'xpcall',
      'error',
      'assert',
      'require',
      'dofile',
      'loadfile',
      'load',
      'select',
      'collectgarbage',
    ],
    types: [],
    constants: ['_G', '_VERSION'],
    booleans: ['true', 'false'],
    nulls: ['nil'],
    stringDelimiters: ["'", '"'],
    lineComment: '--',
    blockCommentStart: '--[[',
    blockCommentEnd: ']]',
    numberPatterns: {
      hex: /^0x[0-9a-f]+(?:\.[0-9a-f]+)?(?:p[+-]?\d+)?/i,
      float: /^\d+\.\d*(?:e[+-]?\d+)?/i,
      decimal: /^\d+/,
    },
    operators: [
      '...',
      '..',
      '==',
      '~=',
      '>=',
      '<=',
      '<<',
      '>>',
      '//',
      '+',
      '-',
      '*',
      '/',
      '%',
      '^',
      '#',
      '&',
      '|',
      '~',
      '<',
      '>',
      '=',
    ],
    customPatterns: [
      { pattern: /^\[\[[\s\S]*?\]\]/, type: 'string' },
      { pattern: /^\[=+\[[\s\S]*?\]=+\]/, type: 'string' },
    ],
  },

  sql: {
    name: 'SQL',
    aliases: ['mysql', 'postgresql', 'pgsql', 'sqlite'],
    controlKeywords: [
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'IF',
      'BEGIN',
      'COMMIT',
      'ROLLBACK',
      'WITH',
    ],
    declarationKeywords: [
      'SELECT',
      'FROM',
      'WHERE',
      'AND',
      'OR',
      'NOT',
      'IN',
      'LIKE',
      'BETWEEN',
      'IS',
      'NULL',
      'ORDER',
      'BY',
      'ASC',
      'DESC',
      'LIMIT',
      'OFFSET',
      'GROUP',
      'HAVING',
      'JOIN',
      'LEFT',
      'RIGHT',
      'INNER',
      'OUTER',
      'FULL',
      'CROSS',
      'ON',
      'AS',
      'DISTINCT',
      'ALL',
      'UNION',
      'INTERSECT',
      'EXCEPT',
      'INSERT',
      'INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE',
      'CREATE',
      'DROP',
      'ALTER',
      'TABLE',
      'INDEX',
      'VIEW',
      'DATABASE',
      'SCHEMA',
      'PRIMARY',
      'KEY',
      'FOREIGN',
      'REFERENCES',
      'CONSTRAINT',
      'DEFAULT',
      'UNIQUE',
      'CHECK',
      'CASCADE',
      'TRUNCATE',
      'GRANT',
      'REVOKE',
      'TRANSACTION',
      'EXISTS',
    ],
    operatorKeywords: [],
    builtins: [
      'COUNT',
      'SUM',
      'AVG',
      'MIN',
      'MAX',
      'COALESCE',
      'NULLIF',
      'CAST',
      'CONVERT',
      'CONCAT',
      'SUBSTRING',
      'TRIM',
      'UPPER',
      'LOWER',
      'LENGTH',
      'NOW',
      'CURRENT_DATE',
      'CURRENT_TIME',
      'CURRENT_TIMESTAMP',
      'DATE',
      'TIME',
      'YEAR',
      'MONTH',
      'DAY',
    ],
    types: [
      'INT',
      'INTEGER',
      'BIGINT',
      'SMALLINT',
      'TINYINT',
      'FLOAT',
      'DOUBLE',
      'DECIMAL',
      'NUMERIC',
      'VARCHAR',
      'CHAR',
      'TEXT',
      'BLOB',
      'DATE',
      'DATETIME',
      'TIMESTAMP',
      'BOOLEAN',
      'BOOL',
      'JSON',
      'UUID',
    ],
    constants: [],
    booleans: ['TRUE', 'FALSE'],
    nulls: ['NULL'],
    stringDelimiters: ["'"],
    lineComment: '--',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    caseInsensitive: true,
    numberPatterns: {
      float: /^\d+\.\d*/i,
      decimal: /^\d+/,
    },
    operators: ['<>', '>=', '<=', '!=', '=', '<', '>', '+', '-', '*', '/', '%', '||'],
  },

  json: {
    name: 'JSON',
    aliases: ['jsonc'],
    controlKeywords: [],
    declarationKeywords: [],
    operatorKeywords: [],
    builtins: [],
    types: [],
    constants: [],
    booleans: ['true', 'false'],
    nulls: ['null'],
    stringDelimiters: ['"'],
    lineComment: undefined,
    numberPatterns: {
      float: /^-?\d+\.\d*(?:e[+-]?\d+)?/i,
      decimal: /^-?\d+/,
    },
    operators: [':', ','],
  },

  yaml: {
    name: 'YAML',
    aliases: ['yml'],
    controlKeywords: [],
    declarationKeywords: [],
    operatorKeywords: [],
    builtins: [],
    types: [],
    constants: [],
    booleans: ['true', 'false', 'yes', 'no', 'on', 'off'],
    nulls: ['null', '~'],
    stringDelimiters: ["'", '"'],
    lineComment: '#',
    numberPatterns: {
      hex: /^0x[0-9a-f]+/i,
      octal: /^0o[0-7]+/i,
      float: /^[+-]?(?:\d+\.\d*|\.\d+)(?:e[+-]?\d+)?/i,
      decimal: /^[+-]?\d+/,
    },
    operators: [':', '-', '>-', '>', '|', '|-'],
    customPatterns: [
      { pattern: /^&\w+/, type: 'variable' },
      { pattern: /^\*\w+/, type: 'variable' },
      { pattern: /^<<:/, type: 'keyword' },
    ],
  },

  bash: {
    name: 'Bash',
    aliases: ['sh', 'shell', 'zsh'],
    controlKeywords: [
      'if',
      'then',
      'else',
      'elif',
      'fi',
      'for',
      'while',
      'until',
      'do',
      'done',
      'case',
      'esac',
      'in',
      'select',
    ],
    declarationKeywords: [
      'function',
      'local',
      'export',
      'declare',
      'typeset',
      'readonly',
      'alias',
      'unalias',
      'set',
      'unset',
      'source',
    ],
    operatorKeywords: [],
    builtins: [
      'echo',
      'printf',
      'read',
      'cd',
      'pwd',
      'ls',
      'cp',
      'mv',
      'rm',
      'mkdir',
      'rmdir',
      'cat',
      'grep',
      'sed',
      'awk',
      'find',
      'xargs',
      'sort',
      'uniq',
      'wc',
      'head',
      'tail',
      'cut',
      'tr',
      'tee',
      'chmod',
      'chown',
      'sudo',
      'apt',
      'yum',
      'brew',
      'npm',
      'pnpm',
      'yarn',
      'node',
      'python',
      'git',
      'docker',
      'kubectl',
      'curl',
      'wget',
      'tar',
      'zip',
      'unzip',
      'ssh',
      'scp',
      'rsync',
      'kill',
      'ps',
      'top',
      'htop',
      'df',
      'du',
      'free',
      'mount',
      'umount',
      'test',
      'exit',
      'return',
      'shift',
      'trap',
      'wait',
      'exec',
      'eval',
    ],
    types: [],
    constants: [
      'HOME',
      'PATH',
      'USER',
      'PWD',
      'SHELL',
      'TERM',
      'LANG',
      'EDITOR',
      'HOSTNAME',
      'RANDOM',
      'LINENO',
      'FUNCNAME',
      'BASH_SOURCE',
    ],
    booleans: [],
    nulls: [],
    stringDelimiters: ["'", '"'],
    lineComment: '#',
    numberPatterns: {
      decimal: /^\d+/,
    },
    operators: [
      '||',
      '&&',
      ';;',
      ';&',
      ';;&',
      '|&',
      '>>',
      '<<',
      '>|',
      '<>',
      '<<<',
      '&>',
      '&>>',
      '2>&1',
      '1>&2',
      '-eq',
      '-ne',
      '-lt',
      '-le',
      '-gt',
      '-ge',
      '-z',
      '-n',
      '-e',
      '-f',
      '-d',
      '-r',
      '-w',
      '-x',
      '-s',
      '=~',
      '==',
      '!=',
      '=',
      '|',
      '&',
      '<',
      '>',
      '+',
      '-',
      '*',
      '/',
      '%',
    ],
    customPatterns: [
      { pattern: /^\$\{[^}]+\}/, type: 'variable' },
      { pattern: /^\$\([^)]+\)/, type: 'variable' },
      { pattern: /^\$[a-zA-Z_]\w*/, type: 'variable' },
      { pattern: /^\$[0-9#?@*!$-]/, type: 'variable' },
      { pattern: /^`[^`]+`/, type: 'variable' },
    ],
  },

  markdown: {
    name: 'Markdown',
    aliases: ['md'],
    controlKeywords: [],
    declarationKeywords: [],
    operatorKeywords: [],
    builtins: [],
    types: [],
    constants: [],
    booleans: [],
    nulls: [],
    stringDelimiters: [],
    lineComment: undefined,
    operators: [],
    customPatterns: [
      { pattern: /^#{1,6}\s+.*/, type: 'keyword' },
      { pattern: /^\*{3,}|^-{3,}|^_{3,}/, type: 'punctuation' },
      { pattern: /^\*\*[^*]+\*\*/, type: 'keyword' },
      { pattern: /^__[^_]+__/, type: 'keyword' },
      { pattern: /^\*[^*]+\*/, type: 'string' },
      { pattern: /^_[^_]+_/, type: 'string' },
      { pattern: /^`[^`]+`/, type: 'string' },
      { pattern: /^```[\s\S]*?```/, type: 'string' },
      { pattern: /^>\s+.*/, type: 'comment' },
      { pattern: /^[-*+]\s+.*/, type: 'punctuation' },
      { pattern: /^\d+\.\s+.*/, type: 'punctuation' },
      { pattern: /^\[([^\]]+)\]\([^)]+\)/, type: 'string' },
      { pattern: /^!\[([^\]]*)\]\([^)]+\)/, type: 'string' },
    ],
  },

  html: {
    name: 'HTML',
    aliases: ['htm', 'xml', 'xhtml'],
    controlKeywords: [],
    declarationKeywords: [],
    operatorKeywords: [],
    builtins: [],
    types: [],
    constants: [],
    booleans: [],
    nulls: [],
    stringDelimiters: ['"', "'"],
    blockCommentStart: '<!--',
    blockCommentEnd: '-->',
    operators: ['='],
    customPatterns: [
      { pattern: /^<!DOCTYPE[^>]*>/, type: 'meta' },
      { pattern: /^<!\[CDATA\[[\s\S]*?\]\]>/, type: 'string' },
      { pattern: /^<!--[\s\S]*?-->/, type: 'comment' },
      { pattern: /^<\/?\w+/, type: 'tag' },
      { pattern: /^\/>|^>/, type: 'tag' },
      { pattern: /^&\w+;/, type: 'entity' },
      { pattern: /^&#\d+;/, type: 'entity' },
      { pattern: /^&#x[0-9a-f]+;/i, type: 'entity' },
    ],
  },

  css: {
    name: 'CSS',
    aliases: ['scss', 'sass', 'less'],
    controlKeywords: [],
    declarationKeywords: [
      '@import',
      '@media',
      '@keyframes',
      '@font-face',
      '@supports',
      '@page',
      '@charset',
      '@namespace',
      '@document',
      '@layer',
      '@container',
      '@property',
    ],
    operatorKeywords: [],
    builtins: [
      'inherit',
      'initial',
      'unset',
      'revert',
      'auto',
      'none',
      'block',
      'inline',
      'flex',
      'grid',
      'absolute',
      'relative',
      'fixed',
      'sticky',
      'hidden',
      'visible',
      'scroll',
      'solid',
      'dashed',
      'dotted',
      'double',
      'normal',
      'bold',
      'italic',
      'underline',
      'center',
      'left',
      'right',
      'top',
      'bottom',
      'start',
      'end',
      'stretch',
      'baseline',
      'space-between',
      'space-around',
      'space-evenly',
      'nowrap',
      'wrap',
      'row',
      'column',
      'pointer',
      'default',
      'not-allowed',
      'transparent',
      'currentColor',
    ],
    types: [],
    constants: [],
    booleans: [],
    nulls: [],
    stringDelimiters: ['"', "'"],
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    numberPatterns: {
      float: /^\d+\.\d*(?:px|em|rem|%|vh|vw|vmin|vmax|ch|ex|deg|rad|grad|turn|s|ms|hz|khz|fr)?/i,
      decimal: /^\d+(?:px|em|rem|%|vh|vw|vmin|vmax|ch|ex|deg|rad|grad|turn|s|ms|hz|khz|fr)?/i,
    },
    operators: [':', ';', ',', '+', '~', '>', '*', '/', '-', '='],
    customPatterns: [
      { pattern: /^--[\w-]+/, type: 'variable' },
      { pattern: /^\$[\w-]+/, type: 'variable' },
      { pattern: /^@[\w-]+/, type: 'keyword' },
      { pattern: /^#[0-9a-f]{3,8}\b/i, type: 'number' },
      { pattern: /^\.[\w-]+/, type: 'class' },
      { pattern: /^#[\w-]+/, type: 'constant' },
      { pattern: /^:+[\w-]+/, type: 'builtin' },
      { pattern: /^\[[\w-]+(?:=[^\]]+)?\]/, type: 'tag.attribute' },
      { pattern: /^url\([^)]+\)/, type: 'string' },
      { pattern: /^rgba?\([^)]+\)/, type: 'builtin' },
      { pattern: /^hsla?\([^)]+\)/, type: 'builtin' },
      { pattern: /^calc\([^)]+\)/, type: 'builtin' },
      { pattern: /^var\([^)]+\)/, type: 'builtin' },
    ],
  },

  diff: {
    name: 'Diff',
    aliases: ['patch'],
    controlKeywords: [],
    declarationKeywords: [],
    operatorKeywords: [],
    builtins: [],
    types: [],
    constants: [],
    booleans: [],
    nulls: [],
    stringDelimiters: [],
    lineComment: undefined,
    operators: [],
    customPatterns: [
      { pattern: /^\+\+\+.*/, type: 'meta' },
      { pattern: /^---.*/, type: 'meta' },
      { pattern: /^@@.*@@/, type: 'keyword' },
      { pattern: /^\+.*/, type: 'constant.builtin' },
      { pattern: /^-.*/, type: 'invalid' },
      { pattern: /^\\.*/, type: 'comment' },
    ],
  },

  plain: {
    name: 'Plain Text',
    aliases: ['text', 'txt'],
    controlKeywords: [],
    declarationKeywords: [],
    operatorKeywords: [],
    builtins: [],
    types: [],
    constants: [],
    booleans: [],
    nulls: [],
    stringDelimiters: [],
    lineComment: undefined,
    operators: [],
  },
};

// =============================================================================
// Themes
// =============================================================================

export const themes: Record<string, HighlightTheme> = {
  dark: {
    name: 'Dark',
    colors: {
      keyword: 'magenta',
      'keyword.control': 'magenta',
      'keyword.declaration': 'magenta',
      'keyword.operator': 'magenta',
      string: 'green',
      'string.template': 'green',
      'string.regex': 'yellow',
      'string.escape': 'cyan',
      number: 'yellow',
      'number.float': 'yellow',
      'number.hex': 'yellow',
      'number.binary': 'yellow',
      'number.octal': 'yellow',
      comment: 'gray',
      'comment.line': 'gray',
      'comment.block': 'gray',
      'comment.doc': 'gray',
      function: 'blue',
      'function.call': 'blue',
      'function.definition': 'blue',
      variable: 'cyan',
      'variable.parameter': 'cyan',
      'variable.property': 'cyan',
      operator: 'white',
      'operator.comparison': 'white',
      'operator.assignment': 'white',
      'operator.arithmetic': 'white',
      'operator.logical': 'white',
      punctuation: 'gray',
      'punctuation.bracket': 'gray',
      'punctuation.separator': 'gray',
      'punctuation.accessor': 'gray',
      type: 'cyan',
      'type.builtin': 'cyan',
      'type.parameter': 'cyan',
      constant: 'yellow',
      'constant.boolean': 'yellow',
      'constant.null': 'yellow',
      'constant.builtin': 'green',
      builtin: 'magenta',
      class: 'cyan',
      interface: 'cyan',
      namespace: 'cyan',
      decorator: 'yellow',
      tag: 'blue',
      'tag.name': 'blue',
      'tag.attribute': 'cyan',
      entity: 'yellow',
      meta: 'magenta',
      invalid: 'red',
      plain: 'white',
    },
    background: 'black',
    lineNumber: 'gray',
    selection: 'blue',
    currentLine: '#1a1a2e',
    bracketMatch: 'yellow',
    default: 'white',
  },

  light: {
    name: 'Light',
    colors: {
      keyword: '#d73a49',
      'keyword.control': '#d73a49',
      'keyword.declaration': '#d73a49',
      'keyword.operator': '#d73a49',
      string: '#22863a',
      'string.template': '#22863a',
      'string.regex': '#e36209',
      'string.escape': '#005cc5',
      number: '#005cc5',
      'number.float': '#005cc5',
      'number.hex': '#005cc5',
      'number.binary': '#005cc5',
      'number.octal': '#005cc5',
      comment: '#6a737d',
      'comment.line': '#6a737d',
      'comment.block': '#6a737d',
      'comment.doc': '#6a737d',
      function: '#6f42c1',
      'function.call': '#6f42c1',
      'function.definition': '#6f42c1',
      variable: '#24292e',
      'variable.parameter': '#e36209',
      'variable.property': '#005cc5',
      operator: '#24292e',
      punctuation: '#24292e',
      type: '#005cc5',
      'type.builtin': '#005cc5',
      constant: '#005cc5',
      'constant.boolean': '#005cc5',
      'constant.null': '#005cc5',
      'constant.builtin': '#22863a',
      builtin: '#d73a49',
      class: '#6f42c1',
      decorator: '#e36209',
      tag: '#22863a',
      'tag.name': '#22863a',
      'tag.attribute': '#6f42c1',
      entity: '#005cc5',
      meta: '#d73a49',
      invalid: '#cb2431',
      plain: '#24292e',
    },
    background: '#ffffff',
    lineNumber: '#6a737d',
    default: '#24292e',
  },

  monokai: {
    name: 'Monokai',
    colors: {
      keyword: '#f92672',
      'keyword.control': '#f92672',
      'keyword.declaration': '#66d9ef',
      string: '#e6db74',
      'string.regex': '#e6db74',
      number: '#ae81ff',
      comment: '#75715e',
      function: '#a6e22e',
      'function.call': '#66d9ef',
      variable: '#f8f8f2',
      'variable.parameter': '#fd971f',
      operator: '#f92672',
      punctuation: '#f8f8f2',
      type: '#66d9ef',
      constant: '#ae81ff',
      'constant.boolean': '#ae81ff',
      'constant.null': '#ae81ff',
      builtin: '#66d9ef',
      class: '#a6e22e',
      decorator: '#e6db74',
      tag: '#f92672',
      'tag.attribute': '#a6e22e',
      meta: '#75715e',
      invalid: '#f92672',
      plain: '#f8f8f2',
    },
    background: '#272822',
    lineNumber: '#75715e',
    default: '#f8f8f2',
  },

  dracula: {
    name: 'Dracula',
    colors: {
      keyword: '#ff79c6',
      string: '#f1fa8c',
      number: '#bd93f9',
      comment: '#6272a4',
      function: '#50fa7b',
      variable: '#f8f8f2',
      operator: '#ff79c6',
      punctuation: '#f8f8f2',
      type: '#8be9fd',
      constant: '#bd93f9',
      builtin: '#8be9fd',
      class: '#50fa7b',
      decorator: '#ffb86c',
      tag: '#ff79c6',
      meta: '#6272a4',
      invalid: '#ff5555',
      plain: '#f8f8f2',
    },
    background: '#282a36',
    lineNumber: '#6272a4',
    default: '#f8f8f2',
  },

  github: {
    name: 'GitHub',
    colors: {
      keyword: '#cf222e',
      string: '#0a3069',
      number: '#0550ae',
      comment: '#6e7781',
      function: '#8250df',
      variable: '#24292f',
      operator: '#24292f',
      punctuation: '#24292f',
      type: '#0550ae',
      constant: '#0550ae',
      builtin: '#cf222e',
      class: '#953800',
      decorator: '#953800',
      tag: '#116329',
      meta: '#cf222e',
      invalid: '#cf222e',
      plain: '#24292f',
    },
    background: '#ffffff',
    lineNumber: '#8c959f',
    default: '#24292f',
  },

  nord: {
    name: 'Nord',
    colors: {
      keyword: '#81a1c1',
      string: '#a3be8c',
      number: '#b48ead',
      comment: '#616e88',
      function: '#88c0d0',
      variable: '#d8dee9',
      operator: '#81a1c1',
      punctuation: '#eceff4',
      type: '#8fbcbb',
      constant: '#b48ead',
      builtin: '#5e81ac',
      class: '#8fbcbb',
      decorator: '#d08770',
      tag: '#81a1c1',
      meta: '#5e81ac',
      invalid: '#bf616a',
      plain: '#d8dee9',
    },
    background: '#2e3440',
    lineNumber: '#4c566a',
    default: '#d8dee9',
  },

  highContrast: {
    name: 'High Contrast',
    colors: {
      keyword: '#ff00ff',
      string: '#00ff00',
      number: '#00ffff',
      comment: '#808080',
      function: '#ffff00',
      variable: '#ffffff',
      operator: '#ffffff',
      punctuation: '#ffffff',
      type: '#00ffff',
      constant: '#ff8000',
      builtin: '#ff00ff',
      class: '#00ffff',
      decorator: '#ff8000',
      tag: '#00ff00',
      meta: '#ff00ff',
      invalid: '#ff0000',
      plain: '#ffffff',
    },
    background: '#000000',
    lineNumber: '#808080',
    default: '#ffffff',
  },
};

// =============================================================================
// Tokenizer
// =============================================================================

/**
 * Get language definition by name or alias
 */
export function getLanguage(name: string): LanguageDefinition | undefined {
  const lower = name.toLowerCase();
  if (languages[lower]) {
    return languages[lower];
  }

  // Check aliases
  for (const lang of Object.values(languages)) {
    if (lang.aliases?.includes(lower)) {
      return lang;
    }
  }

  return undefined;
}

/**
 * List all supported languages
 */
export function listLanguages(): string[] {
  return Object.keys(languages);
}

/**
 * Tokenize source code
 */
export function tokenize(source: string, languageName: string): Token[] {
  const lang = getLanguage(languageName) || languages.plain!;
  const tokens: Token[] = [];
  let pos = 0;

  // Build keyword sets for fast lookup
  const allKeywords = new Set([
    ...(lang.controlKeywords || []),
    ...(lang.declarationKeywords || []),
    ...(lang.operatorKeywords || []),
  ]);
  const controlKeywords = new Set(lang.controlKeywords || []);
  const declarationKeywords = new Set(lang.declarationKeywords || []);
  const operatorKeywords = new Set(lang.operatorKeywords || []);
  const builtins = new Set(lang.builtins || []);
  const types = new Set(lang.types || []);
  const constants = new Set(lang.constants || []);
  const booleans = new Set(lang.booleans || []);
  const nulls = new Set(lang.nulls || []);

  // Case insensitive matching
  const matchWord = (word: string, set: Set<string>): boolean => {
    if (lang.caseInsensitive) {
      return set.has(word.toUpperCase()) || set.has(word.toLowerCase());
    }
    return set.has(word);
  };

  // Sort operators by length (longest first) for greedy matching
  const sortedOperators = [...(lang.operators || [])].sort((a, b) => b.length - a.length);

  while (pos < source.length) {
    const remaining = source.slice(pos);
    let matched = false;

    // Skip whitespace
    const wsMatch = remaining.match(/^(\s+)/);
    if (wsMatch) {
      tokens.push({
        type: 'plain',
        value: wsMatch[1]!,
        start: pos,
        end: pos + wsMatch[1]!.length,
      });
      pos += wsMatch[1]!.length;
      continue;
    }

    // Check custom patterns first
    if (lang.customPatterns) {
      for (const { pattern, type } of lang.customPatterns) {
        const match = remaining.match(pattern);
        if (match) {
          tokens.push({
            type,
            value: match[0],
            start: pos,
            end: pos + match[0].length,
          });
          pos += match[0].length;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }

    // Check for doc comments
    if (lang.docCommentStart && remaining.startsWith(lang.docCommentStart)) {
      // Doc comment (usually /** ... */)
      if (lang.blockCommentEnd) {
        const endIndex = remaining.indexOf(lang.blockCommentEnd, lang.docCommentStart.length);
        if (endIndex !== -1) {
          const comment = remaining.slice(0, endIndex + lang.blockCommentEnd.length);
          tokens.push({
            type: 'comment.doc',
            value: comment,
            start: pos,
            end: pos + comment.length,
          });
          pos += comment.length;
          continue;
        }
      }
    }

    // Check for block comments
    if (lang.blockCommentStart && remaining.startsWith(lang.blockCommentStart)) {
      const endIndex = remaining.indexOf(lang.blockCommentEnd!, lang.blockCommentStart.length);
      if (endIndex !== -1) {
        const comment = remaining.slice(0, endIndex + lang.blockCommentEnd!.length);
        tokens.push({
          type: 'comment.block',
          value: comment,
          start: pos,
          end: pos + comment.length,
        });
        pos += comment.length;
        continue;
      } else {
        // Unterminated block comment - take rest of source
        tokens.push({
          type: 'comment.block',
          value: remaining,
          start: pos,
          end: source.length,
        });
        pos = source.length;
        continue;
      }
    }

    // Check for line comments
    if (lang.lineComment && remaining.startsWith(lang.lineComment)) {
      const endIndex = remaining.indexOf('\n');
      const comment = endIndex !== -1 ? remaining.slice(0, endIndex) : remaining;
      tokens.push({
        type: 'comment.line',
        value: comment,
        start: pos,
        end: pos + comment.length,
      });
      pos += comment.length;
      continue;
    }

    // Check for strings
    for (const delim of lang.stringDelimiters || []) {
      if (remaining.startsWith(delim)) {
        let end = 1;
        while (end < remaining.length) {
          if (remaining[end] === '\\' && end + 1 < remaining.length) {
            end += 2;
          } else if (remaining[end] === delim) {
            end++;
            break;
          } else {
            end++;
          }
        }
        tokens.push({
          type: 'string',
          value: remaining.slice(0, end),
          start: pos,
          end: pos + end,
        });
        pos += end;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Check for template strings
    if (lang.templateDelimiter && remaining.startsWith(lang.templateDelimiter)) {
      let end = 1;
      while (end < remaining.length) {
        if (remaining[end] === '\\' && end + 1 < remaining.length) {
          end += 2;
        } else if (remaining[end] === lang.templateDelimiter) {
          end++;
          break;
        } else {
          end++;
        }
      }
      tokens.push({
        type: 'string.template',
        value: remaining.slice(0, end),
        start: pos,
        end: pos + end,
      });
      pos += end;
      continue;
    }

    // Check for numbers
    if (lang.numberPatterns) {
      for (const [type, pattern] of Object.entries(lang.numberPatterns)) {
        const match = remaining.match(pattern);
        if (match) {
          tokens.push({
            type: `number.${type}` as TokenType,
            value: match[0],
            start: pos,
            end: pos + match[0].length,
          });
          pos += match[0].length;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }

    // Check for operators
    for (const op of sortedOperators) {
      if (remaining.startsWith(op)) {
        tokens.push({
          type: 'operator',
          value: op,
          start: pos,
          end: pos + op.length,
        });
        pos += op.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Check for identifiers and keywords
    const identMatch = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (identMatch) {
      const word = identMatch[0];
      let type: TokenType = 'variable';

      if (matchWord(word, controlKeywords)) {
        type = 'keyword.control';
      } else if (matchWord(word, declarationKeywords)) {
        type = 'keyword.declaration';
      } else if (matchWord(word, operatorKeywords)) {
        type = 'keyword.operator';
      } else if (matchWord(word, booleans)) {
        type = 'constant.boolean';
      } else if (matchWord(word, nulls)) {
        type = 'constant.null';
      } else if (matchWord(word, constants)) {
        type = 'constant';
      } else if (matchWord(word, types)) {
        type = 'type.builtin';
      } else if (matchWord(word, builtins)) {
        type = 'builtin';
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(word)) {
        type = 'type';
      } else if (remaining[word.length] === '(') {
        type = 'function.call';
      }

      tokens.push({
        type,
        value: word,
        start: pos,
        end: pos + word.length,
      });
      pos += word.length;
      continue;
    }

    // Punctuation
    const char = source[pos]!;
    if (/[\[\]{}()]/.test(char)) {
      tokens.push({
        type: 'punctuation.bracket',
        value: char,
        start: pos,
        end: pos + 1,
      });
    } else if (/[,;]/.test(char)) {
      tokens.push({
        type: 'punctuation.separator',
        value: char,
        start: pos,
        end: pos + 1,
      });
    } else if (char === '.') {
      tokens.push({
        type: 'punctuation.accessor',
        value: char,
        start: pos,
        end: pos + 1,
      });
    } else {
      tokens.push({
        type: 'plain',
        value: char,
        start: pos,
        end: pos + 1,
      });
    }
    pos++;
  }

  return tokens;
}

/**
 * Tokenize line by line
 */
export function tokenizeLines(source: string, languageName: string): HighlightedLine[] {
  const lines = source.split('\n');
  const allTokens = tokenize(source, languageName);
  const result: HighlightedLine[] = [];

  let tokenIndex = 0;
  let charOffset = 0;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum]!;
    const lineEnd = charOffset + line.length;
    const lineTokens: Token[] = [];

    while (tokenIndex < allTokens.length && allTokens[tokenIndex]!.start < lineEnd) {
      const token = allTokens[tokenIndex]!;

      if (token.end <= charOffset) {
        tokenIndex++;
        continue;
      }

      if (token.start >= lineEnd) {
        break;
      }

      // Token spans this line (possibly partially)
      const tokenStart = Math.max(token.start, charOffset);
      const tokenEnd = Math.min(token.end, lineEnd);
      const value = source.slice(tokenStart, tokenEnd);

      if (value) {
        lineTokens.push({
          type: token.type,
          value,
          start: tokenStart - charOffset,
          end: tokenEnd - charOffset,
        });
      }

      if (token.end <= lineEnd) {
        tokenIndex++;
      } else {
        break;
      }
    }

    result.push({
      lineNumber: lineNum + 1,
      tokens: lineTokens,
      raw: line,
    });

    charOffset = lineEnd + 1; // +1 for newline
  }

  return result;
}

// =============================================================================
// Output Formatters
// =============================================================================

/**
 * Get color for token type from theme
 */
export function getTokenColor(type: TokenType, theme: HighlightTheme): string {
  // Check exact match first
  if (theme.colors[type]) {
    return theme.colors[type]!;
  }

  // Check parent type (e.g., 'keyword' for 'keyword.control')
  const dotIndex = type.indexOf('.');
  if (dotIndex !== -1) {
    const parent = type.slice(0, dotIndex) as TokenType;
    if (theme.colors[parent]) {
      return theme.colors[parent]!;
    }
  }

  return theme.default || 'white';
}

/**
 * Convert color name to ANSI escape code
 */
function colorToAnsiCode(color: string): string {
  const colors: Record<string, string> = {
    black: '30',
    red: '31',
    green: '32',
    yellow: '33',
    blue: '34',
    magenta: '35',
    cyan: '36',
    white: '37',
    gray: '90',
    grey: '90',
  };

  if (colors[color]) {
    return `\x1b[${colors[color]}m`;
  }

  // Hex color -> 256 color approximation
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Use 24-bit true color
    return `\x1b[38;2;${r};${g};${b}m`;
  }

  return '';
}

/**
 * Convert tokens to ANSI-escaped string
 */
export function tokensToAnsi(tokens: Token[], theme: HighlightTheme = themes.dark!): string {
  let result = '';
  const reset = '\x1b[0m';

  for (const token of tokens) {
    const color = getTokenColor(token.type, theme);
    const ansi = colorToAnsiCode(color);
    result += ansi + token.value + reset;
  }

  return result;
}

/**
 * Highlight code and return ANSI string
 */
export function highlight(source: string, languageName: string, themeName?: string): string {
  const tokens = tokenize(source, languageName);
  const theme = themeName ? themes[themeName] || themes.dark! : themes.dark!;
  return tokensToAnsi(tokens, theme);
}

/**
 * Highlight code with line numbers
 */
export function highlightWithLineNumbers(
  source: string,
  languageName: string,
  options: {
    theme?: string;
    startLine?: number;
    highlightLines?: number[];
  } = {}
): string {
  const { theme: themeName, startLine = 1, highlightLines = [] } = options;
  const theme = themeName ? themes[themeName] || themes.dark! : themes.dark!;
  const lines = tokenizeLines(source, languageName);
  const lineNumWidth = String(startLine + lines.length - 1).length;
  const reset = '\x1b[0m';

  return lines
    .map((line) => {
      const lineNum = line.lineNumber + startLine - 1;
      const isHighlighted = highlightLines.includes(lineNum);
      const lineNumColor = colorToAnsiCode(isHighlighted ? 'yellow' : theme.lineNumber || 'gray');
      const numStr = String(lineNum).padStart(lineNumWidth, ' ');

      let result = `${lineNumColor}${numStr} │${reset} `;
      if (isHighlighted) {
        result += colorToAnsiCode('yellow') + '▶ ' + reset;
      }

      result += tokensToAnsi(line.tokens, theme);
      return result;
    })
    .join('\n');
}
