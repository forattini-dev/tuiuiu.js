/**
 * Canonical lexical language registry (renderer-independent).
 *
 * Definitions are shared by code components, Markdown and file previews.
 * This is lightweight lexical coloring, not a grammar/semantic parser.
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
    aliases: ['js', 'jsx', 'mjs', 'cjs'],
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
      { pattern: /^\/(?![/*])(?:\[(?:[^\]\\\r\n]|\\.)*\]|[^/\\[\r\n]|\\.)+\/[dgimsuvy]*/, type: 'string.regex' },
    ],
  },

  typescript: {
    name: 'TypeScript',
    aliases: ['ts', 'tsx'],
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
      { pattern: /^\/(?![/*])(?:\[(?:[^\]\\\r\n]|\\.)*\]|[^/\\[\r\n]|\\.)+\/[dgimsuvy]*/, type: 'string.regex' },
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
    stringDelimiters: ['"', "'"],
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
    aliases: ['sh', 'shell', 'zsh', 'fish'],
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
    blockCommentStart: '<!--',
    blockCommentEnd: '-->',
    operators: [],
    customPatterns: [
      { pattern: /^#{1,6}\s+.*/, type: 'keyword' },
      { pattern: /^\*{3,}|^-{3,}|^_{3,}/, type: 'punctuation' },
      { pattern: /^\*\*[^*]+\*\*/, type: 'keyword' },
      { pattern: /^__[^_]+__/, type: 'keyword' },
      { pattern: /^\*[^*]+\*/, type: 'string' },
      { pattern: /^_[^_]+_/, type: 'string' },
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
  },

  plain: {
    name: 'Plain Text',
    aliases: ['text', 'txt', 'plaintext'],
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

/** Normalize extension/fence aliases without accepting Object.prototype keys. */
export function getLanguageId(name: string): string | undefined {
  const normalized = name.trim().toLowerCase().replace(/^\./, '');
  if (Object.hasOwn(languages, normalized)) return normalized;
  return Object.keys(languages).find(key => languages[key]!.aliases?.includes(normalized));
}

export function getLanguage(name: string): LanguageDefinition | undefined {
  const id = getLanguageId(name);
  return id === undefined ? undefined : languages[id];
}

export function listLanguages(): string[] {
  return Object.keys(languages);
}

/** Catalog expressions use token-relative anchors. Match at one source offset. */
function sticky(pattern: RegExp): RegExp {
  return new RegExp(pattern.source.replace(/(^|\|)\^/g, '$1'), pattern.flags.replace(/[gy]/g, '') + 'y');
}

function matchAt(pattern: RegExp, source: string, offset: number): string | undefined {
  pattern.lastIndex = offset;
  const match = pattern.exec(source);
  return match?.index === offset && match[0].length > 0 ? match[0] : undefined;
}

/**
 * One full-source lexical pass. Tokens partition the raw UTF-16 source exactly;
 * adapters own sanitation, themes and terminal geometry. No shared regex cursor.
 */
export type CodeTokenRange = Pick<Token, 'type' | 'start' | 'end'>;

export function tokenizeCodeRanges(source: string, languageName: string): CodeTokenRange[] {
  return scanCodeRanges(source, languageName);
}

interface CodeCheckpoint {
  offset: number;
  /** A newline must remain intact, including prior token lookahead. */
  validThrough: number;
  count: number;
  previous?: CodeTokenRange;
}

function scanCodeRanges(source: string, languageName: string, startOffset = 0,
  ranges: CodeTokenRange[] = [], previous?: CodeTokenRange, checkpoints?: CodeCheckpoint[]): CodeTokenRange[] {
  const id = getLanguageId(languageName) ?? 'plain';
  if (!source) return [];
  if (id === 'plain') return [{ type: 'plain', start: 0, end: source.length }];
  const language = getLanguage(id)!;
  const emit = (type: TokenType, start: number, end: number) => {
    const previous = ranges.at(-1);
    if (type === 'plain' && previous?.type === type && previous.end === start) {
      previous.end = end;
      return previous;
    }
    const range = { type, start, end };
    ranges.push(range);
    return range;
  };
  if (id === 'diff') {
    let start = startOffset;
    while (start < source.length) {
      checkpoints?.push({ offset: start, validThrough: start, count: ranges.length });
      const newline = source.indexOf('\n', start);
      const end = newline < 0 ? source.length : newline + 1;
      const header = source.startsWith('+++', start) || source.startsWith('---', start);
      emit(header ? 'meta' : source[start] === '+' ? 'constant.builtin' : source[start] === '-' ? 'invalid'
        : source[start] === '@' ? 'keyword' : source[start] === '\\' ? 'comment' : 'plain', start, end);
      start = end;
    }
    return ranges;
  }
  const fold = (word: string) => language.caseInsensitive ? word.toLowerCase() : word;
  const wordDefinitions: [string[] | undefined, TokenType][] = [
    [language.controlKeywords, 'keyword.control'], [language.declarationKeywords, 'keyword.declaration'],
    [language.operatorKeywords, 'keyword.operator'], [language.keywords, 'keyword'],
    [language.booleans, 'constant.boolean'], [language.nulls, 'constant.null'],
    [language.constants, 'constant'], [language.types, 'type.builtin'], [language.builtins, 'builtin'],
  ];
  const wordRules = new Map<string, TokenType>();
  for (const [words, type] of wordDefinitions) {
    for (const word of words ?? []) { const key = fold(word); if (!wordRules.has(key)) wordRules.set(key, type); }
  }
  const custom = (language.customPatterns ?? []).map(rule => ({ ...rule, pattern: sticky(rule.pattern) }));
  const numbers = Object.entries(language.numberPatterns ?? {}).map(([type, pattern]) => ({
    type: (type === 'decimal' ? 'number' : `number.${type}`) as TokenType, pattern: sticky(pattern),
  }));
  if (['javascript', 'typescript', 'python', 'go', 'rust', 'sql', 'json', 'yaml'].includes(id)) {
    numbers.push({ type: 'number.float', pattern: sticky(id === 'rust'
      ? /^(?:\d+(?:_\d+)*(?:\.\d*)?|\.\d+)e[+-]?\d+(?:f32|f64)?/i
      : id === 'json' || id === 'yaml' ? /^-?(?:\d+(?:\.\d*)?|\.\d+)e[+-]?\d+/i
      : /^(?:\d+(?:\.\d*)?|\.\d+)e[+-]?\d+/i) });
  }
  const operators = [...(language.operators ?? [])].filter(Boolean).sort((a, b) => b.length - a.length);
  const candidatesByFirst = (values: string[]) => {
    const candidates = new Map<string, string[]>();
    for (const value of values) {
      const key = value[0];
      if (!key) continue;
      const existing = candidates.get(key);
      if (existing) existing.push(value);
      else candidates.set(key, [value]);
    }
    return candidates;
  };
  const operatorCandidates = candidatesByFirst(operators);
  const quoteCandidates = candidatesByFirst([...(language.stringDelimiters ?? [])].sort((a, b) => b.length - a.length));
  const whitespace = /\s+/y;
  const identifier = /[A-Za-z_$][\w$]*/y;
  const lifetime = /'[A-Za-z_]\w*/y;
  const closed = (start: number, opening: string, ending: string, nested = false): number => {
    let depth = 1;
    let index = start + opening.length;
    while (index < source.length) {
      if (nested && source.startsWith(opening, index)) { depth++; index += opening.length; }
      else if (source.startsWith(ending, index)) {
        index += ending.length;
        if (--depth === 0) return index;
      } else index++;
    }
    return source.length;
  };
  const quoted = (start: number, delimiter: string, multiline: boolean, escapes = true): number => {
    let index = start + delimiter.length;
    while (index < source.length) {
      if (source.startsWith(delimiter, index)) {
        if ((id === 'sql' || id === 'yaml') && source.startsWith(delimiter + delimiter, index)) {
          index += delimiter.length * 2; continue;
        }
        return index + delimiter.length;
      }
      if (escapes && source[index] === '\\') { index = Math.min(source.length, index + 2); continue; }
      if (!multiline && (source[index] === '\n' || source[index] === '\r')) return index;
      index++;
    }
    return source.length;
  };
  let index = startOffset;
  const consume = (type: TokenType, end: number) => {
    const range = emit(type, index, end);
    if (type !== 'plain' && !type.startsWith('comment')) previous = range;
    index = end;
  };
  while (index < source.length) {
    const unit = source.charCodeAt(index);
    // Avoid failed regex matches for the common ASCII identifier/punctuation
    // path; non-ASCII whitespace still follows JavaScript's canonical \s rule.
    const space = unit <= 0x20 || unit >= 0x80 ? matchAt(whitespace, source, index) : undefined;
    if (space) {
      const newline = checkpoints ? space.indexOf('\n') : -1;
      if (newline >= 0) checkpoints!.push({ offset: index, validThrough: index + newline + 1, count: ranges.length, previous });
      consume('plain', index + space.length); continue;
    }
    const char = source[index]!;
    const blockStart = language.blockCommentStart;
    const blockEnd = language.blockCommentEnd;
    if (blockStart && blockEnd && source.startsWith(blockStart, index)) {
      consume(language.docCommentStart && source.startsWith(language.docCommentStart, index) ? 'comment.doc' : 'comment.block',
        closed(index, blockStart, blockEnd, id === 'rust')); continue;
    }
    const lineComment = language.lineComment;
    if (lineComment && source.startsWith(lineComment, index)
      && !(lineComment === '#' && ['bash', 'yaml'].includes(id) && index > 0 && !/[\s;|&()]/.test(source[index - 1]!))) {
      const newline = source.indexOf('\n', index);
      consume(language.docCommentStart && source.startsWith(language.docCommentStart, index) ? 'comment.doc' : 'comment.line',
        newline < 0 ? source.length : newline); continue;
    }
    if (id === 'rust' && char === 'r' && (index === 0 || !/[\w$]/.test(source[index - 1]!))) {
      let quote = index + 1;
      while (source[quote] === '#') quote++;
      if (source[quote] === '"') {
        const ending = '"' + '#'.repeat(quote - index - 1);
        const end = source.indexOf(ending, quote + 1);
        consume('string', end < 0 ? source.length : end + ending.length); continue;
      }
    }
    if (id === 'rust' && char === "'") {
      const word = matchAt(lifetime, source, index);
      if (word && source[index + word.length] !== "'") { consume('type.parameter', index + word.length); continue; }
    }
    const backtick = char === language.templateDelimiter || (char === '`' && ['go', 'markdown', 'bash'].includes(id));
    const quote = quoteCandidates.get(char)?.find(delimiter => source.startsWith(delimiter, index));
    if (backtick || quote || (id === 'rust' && char === "'")) {
      const triple = (id === 'python' && source.startsWith(char.repeat(3), index))
        || (id === 'markdown' && source.startsWith('```', index));
      const delimiter = triple ? char.repeat(3) : quote ?? char;
      const multiline = triple || backtick || ['bash', 'sql', 'rust', 'ruby'].includes(id);
      const escapes = !(id === 'go' && backtick) && !(id === 'sql' || (['yaml', 'bash'].includes(id) && char === "'"));
      consume(backtick && ['javascript', 'typescript'].includes(id) ? 'string.template' : 'string',
        quoted(index, delimiter, multiline, escapes)); continue;
    }
    let matched = false;
    for (const rule of custom) {
      // A slash after an expression is division, not a regex literal. Comments
      // and strings already consumed above, so patterns cannot override them.
      if (rule.type === 'string.regex' && char === '/' && ['javascript', 'typescript'].includes(id) && previous
        && !(previous.type.startsWith('operator') || previous.type.startsWith('keyword')
          || (previous.end - previous.start === 1 && ['(', '[', '{', ',', ';', ':'].includes(source[previous.start]!)))) continue;
      const value = matchAt(rule.pattern, source, index);
      if (value) { consume(rule.type, index + value.length); matched = true; break; }
    }
    if (matched) continue;
    if (/[\d.+-]/.test(char) && (index === 0 || !/[\w$]/.test(source[index - 1]!))) {
      let number: { value: string; type: TokenType } | undefined;
      for (const rule of numbers) {
        const value = matchAt(rule.pattern, source, index);
        if (value && (!number || value.length > number.value.length)) number = { value, type: rule.type };
      }
      if (number) { consume(number.type, index + number.value.length); continue; }
    }
    const word = (unit >= 65 && unit <= 90) || (unit >= 97 && unit <= 122) || char === '_' || char === '$'
      ? matchAt(identifier, source, index) : undefined;
    if (word) {
      let next = index + word.length;
      while (source[next] === ' ' || source[next] === '\t') next++;
      const type = wordRules.get(fold(word))
        ?? (source[next] === '(' ? 'function.call' : /^[A-Z][a-zA-Z0-9]*$/.test(word) ? 'type' : 'variable');
      consume(type, index + word.length); continue;
    }
    const operator = operatorCandidates.get(char)?.find(value => source.startsWith(value, index));
    if (operator) { consume('operator', index + operator.length); continue; }
    consume(/[\[\]{}()]/.test(char) ? 'punctuation.bracket' : /[,;]/.test(char) ? 'punctuation.separator'
      : char === '.' ? 'punctuation.accessor' : /[+\-*/%=!<>|&^~?:]/.test(char) ? 'operator' : 'plain', index + 1);
  }
  return ranges;
}

function definitionSignature(id: string): string {
  return JSON.stringify(getLanguage(id), (_key, value: unknown) => value instanceof RegExp
    ? { source: value.source, flags: value.flags } : value);
}

// These shipped definitions have line-bounded custom lookahead. Other languages
// (e.g. heredocs, CDATA, Markdown links) conservatively use the same full scanner.
// Mutable/custom definitions are never assumed safe based only on their name.
const resumableDefinitions = new Map(['javascript', 'typescript', 'go', 'sql', 'json', 'yaml', 'java', 'diff']
  .map(id => [id, definitionSignature(id)]));

export interface CodeTokenDocumentSnapshot {
  readonly source: string;
  readonly language: string;
  readonly revision: number;
  readonly reparsedFrom: number;
  readonly reusedTokenCount: number;
}

/** Internal owned lexical cache. One source revision, no listeners or global history. */
export interface CodeTokenDocument {
  update(source: string, language: string): readonly CodeTokenRange[];
  snapshot(): CodeTokenDocumentSnapshot;
}

export function createCodeTokenDocument(): CodeTokenDocument {
  let source = '';
  let language = 'plain';
  let signature = definitionSignature(language);
  let revision = 0;
  let reparsedFrom = 0;
  let reusedTokenCount = 0;
  let tokens: readonly CodeTokenRange[] = Object.freeze([]);
  let checkpoints: CodeCheckpoint[] = [];
  return {
    snapshot: () => Object.freeze({ source, language, revision, reparsedFrom, reusedTokenCount }),
    update(nextSource, nextLanguage) {
      const id = getLanguageId(nextLanguage) ?? 'plain';
      const nextSignature = definitionSignature(id);
      if (nextSource === source && id === language && nextSignature === signature) return tokens;
      const resumable = resumableDefinitions.get(id) === nextSignature;
      let common = 0;
      if (resumable && id === language && nextSignature === signature) {
        if (nextSource.length >= source.length && nextSource.startsWith(source)) common = source.length;
        else if (source.startsWith(nextSource)) common = nextSource.length;
        else while (common < Math.min(source.length, nextSource.length) && source[common] === nextSource[common]) common++;
      }
      let low = 0;
      let high = common > 0 ? checkpoints.length : 0;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (checkpoints[middle]!.validThrough <= common) low = middle + 1;
        else high = middle;
      }
      const checkpoint = low > 0 ? checkpoints[low - 1] : undefined;
      // Native slice on frozen arrays takes a slow generic path in V8. Copy the
      // immutable references explicitly, then detach a mergeable final plain run.
      const prefix: CodeTokenRange[] = [];
      if (checkpoint) for (let index = 0; index < checkpoint.count; index++) prefix.push(tokens[index]!);
      const last = prefix.at(-1);
      if (checkpoint && last?.type === 'plain') prefix[prefix.length - 1] = { ...last, end: Math.min(last.end, checkpoint.offset) };
      const nextCheckpoints = checkpoint ? checkpoints.slice(0, low - 1) : [];
      const nextTokens = scanCodeRanges(nextSource, id, checkpoint?.offset ?? 0, prefix,
        checkpoint?.previous, resumable ? nextCheckpoints : undefined);
      reusedTokenCount = checkpoint?.count ?? 0;
      if (reusedTokenCount && nextTokens[reusedTokenCount - 1] !== tokens[reusedTokenCount - 1]) reusedTokenCount--;
      for (let index = Math.max(0, (checkpoint?.count ?? 0) - 1); index < nextTokens.length; index++) Object.freeze(nextTokens[index]);
      tokens = Object.freeze(nextTokens);
      checkpoints = nextCheckpoints;
      source = nextSource;
      language = id;
      signature = nextSignature;
      revision++;
      reparsedFrom = checkpoint?.offset ?? 0;
      return tokens;
    },
  };
}

/** Materialize token values only for callers that need them. */
export function tokenize(source: string, languageName: string): Token[] {
  return tokenizeCodeRanges(source, languageName).map(range => ({
    type: range.type, value: source.slice(range.start, range.end), start: range.start, end: range.end,
  }));
}

/** Split one lexical pass into line-relative tokens, retaining blank rows. */
export function tokenizeLines(source: string, languageName: string): HighlightedLine[] {
  const tokens = tokenize(source, languageName);
  let tokenIndex = 0;
  let offset = 0;
  return source.split('\n').map((raw, index) => {
    const end = offset + raw.length;
    const lineTokens: Token[] = [];
    while (tokenIndex < tokens.length && tokens[tokenIndex]!.start < end) {
      const token = tokens[tokenIndex]!;
      if (token.end <= offset) { tokenIndex++; continue; }
      const start = Math.max(offset, token.start);
      const stop = Math.min(end, token.end);
      if (stop > start) lineTokens.push({ ...token, value: source.slice(start, stop), start: start - offset, end: stop - offset });
      if (token.end <= end) tokenIndex++;
      else break;
    }
    offset = end + 1;
    return { lineNumber: index + 1, tokens: lineTokens, raw };
  });
}
