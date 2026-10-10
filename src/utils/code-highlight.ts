import type { TextSpan } from './styled-text.js';

export type Language =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'json'
  | 'yaml'
  | 'bash'
  | 'shell'
  | 'html'
  | 'css'
  | 'sql'
  | 'go'
  | 'rust'
  | 'markdown'
  | 'diff'
  | 'plain';

export interface CodeTheme {
  keyword: string;
  string: string;
  number: string;
  comment: string;
  function: string;
  variable: string;
  operator: string;
  punctuation: string;
  type: string;
  constant: string;
  builtin: string;
  added: string;
  removed: string;
  lineNumber: string;
  background: string;
}

/** Default theme (similar to VSCode Dark+) */
export const DEFAULT_CODE_THEME: CodeTheme = {
  keyword: 'accent',
  string: 'success',
  number: 'warning',
  comment: 'mutedForeground',
  function: 'info',
  variable: 'primary',
  operator: 'foreground',
  punctuation: 'mutedForeground',
  type: 'primary',
  constant: 'warning',
  builtin: 'accent',
  added: 'success',
  removed: 'destructive',
  lineNumber: 'mutedForeground',
  background: 'background',
};

/** Language-specific keywords and patterns */
const LANGUAGE_RULES: Record<string, {
  keywords: string[];
  builtins?: string[];
  types?: string[];
  constants?: string[];
  numberPattern?: RegExp;
}> = {
  javascript: {
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'class', 'extends', 'import', 'export', 'from', 'default', 'async', 'await', 'yield', 'static', 'get', 'set', 'of', 'in', 'typeof', 'instanceof', 'delete', 'void'],
    builtins: ['console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'Promise', 'Map', 'Set', 'RegExp', 'Error', 'Symbol', 'BigInt', 'window', 'document', 'fetch', 'setTimeout', 'setInterval', 'require', 'module', 'exports', 'process'],
    constants: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'this'],
    numberPattern: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/gi,
  },
  typescript: {
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'class', 'extends', 'import', 'export', 'from', 'default', 'async', 'await', 'yield', 'static', 'get', 'set', 'of', 'in', 'typeof', 'instanceof', 'delete', 'void', 'type', 'interface', 'enum', 'implements', 'namespace', 'abstract', 'private', 'protected', 'public', 'readonly', 'as', 'is', 'keyof', 'infer', 'declare'],
    types: ['string', 'number', 'boolean', 'void', 'never', 'any', 'unknown', 'object', 'symbol', 'bigint', 'null', 'undefined'],
    builtins: ['console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'Promise', 'Map', 'Set', 'RegExp', 'Error', 'Symbol', 'BigInt', 'Partial', 'Required', 'Readonly', 'Record', 'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable', 'ReturnType', 'Parameters'],
    constants: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'this'],
    numberPattern: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/gi,
  },
  python: {
    keywords: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'try', 'except', 'finally', 'raise', 'import', 'from', 'as', 'with', 'async', 'await', 'yield', 'lambda', 'pass', 'del', 'global', 'nonlocal', 'assert', 'and', 'or', 'not', 'in', 'is'],
    builtins: ['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'bool', 'type', 'isinstance', 'hasattr', 'getattr', 'setattr', 'open', 'input', 'map', 'filter', 'zip', 'enumerate', 'sorted', 'reversed', 'sum', 'min', 'max', 'abs', 'round', 'any', 'all'],
    constants: ['True', 'False', 'None', 'self', 'cls'],
    numberPattern: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/gi,
  },
  json: {
    keywords: [],
    constants: ['true', 'false', 'null'],
    numberPattern: /-?\d+\.?\d*(?:e[+-]?\d+)?/gi,
  },
  yaml: {
    keywords: [],
    constants: ['true', 'false', 'null', 'yes', 'no', 'on', 'off'],
    numberPattern: /\b\d+\.?\d*\b/g,
  },
  bash: {
    keywords: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'in', 'function', 'return', 'exit', 'local', 'export', 'source', 'alias', 'unalias', 'set', 'unset', 'shift', 'trap', 'break', 'continue'],
    builtins: ['echo', 'cd', 'pwd', 'ls', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'cat', 'grep', 'sed', 'awk', 'find', 'xargs', 'sort', 'uniq', 'wc', 'head', 'tail', 'cut', 'tr', 'tee', 'chmod', 'chown', 'sudo', 'apt', 'yum', 'brew', 'npm', 'pnpm', 'yarn', 'node', 'python', 'git', 'docker', 'kubectl', 'curl', 'wget'],
  },
  shell: {
    keywords: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'in', 'function', 'return', 'exit', 'local', 'export', 'source', 'alias', 'unalias', 'set', 'unset', 'shift', 'trap', 'break', 'continue'],
    builtins: ['echo', 'cd', 'pwd', 'ls', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'cat', 'grep', 'sed', 'awk', 'find', 'xargs', 'sort', 'uniq', 'wc', 'head', 'tail', 'cut', 'tr', 'tee', 'chmod', 'chown', 'sudo', 'apt', 'yum', 'brew', 'npm', 'pnpm', 'yarn', 'node', 'python', 'git', 'docker', 'kubectl', 'curl', 'wget'],
  },
  go: {
    keywords: ['func', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue', 'go', 'select', 'chan', 'defer', 'fallthrough', 'goto', 'package', 'import', 'const', 'var', 'type', 'struct', 'interface', 'map', 'make', 'new', 'append', 'len', 'cap', 'close', 'delete', 'copy', 'panic', 'recover'],
    types: ['string', 'int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 'float64', 'complex64', 'complex128', 'bool', 'byte', 'rune', 'error', 'uintptr'],
    builtins: ['fmt', 'os', 'io', 'net', 'http', 'json', 'time', 'context', 'sync', 'errors'],
    constants: ['true', 'false', 'nil', 'iota'],
    numberPattern: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/gi,
  },
  rust: {
    keywords: ['fn', 'let', 'mut', 'const', 'static', 'return', 'if', 'else', 'for', 'while', 'loop', 'match', 'break', 'continue', 'struct', 'enum', 'impl', 'trait', 'type', 'where', 'pub', 'mod', 'use', 'crate', 'self', 'super', 'as', 'in', 'ref', 'move', 'async', 'await', 'dyn', 'unsafe', 'extern'],
    types: ['i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize', 'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc', 'Cell', 'RefCell', 'HashMap', 'HashSet'],
    builtins: ['Some', 'None', 'Ok', 'Err', 'println', 'print', 'format', 'panic', 'assert', 'vec', 'todo', 'unimplemented'],
    constants: ['true', 'false', 'Self'],
    numberPattern: /\b\d+(?:_\d+)*\.?\d*(?:e[+-]?\d+)?(?:[iu](?:8|16|32|64|128|size)|f(?:32|64))?\b/gi,
  },
  sql: {
    keywords: ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'ORDER', 'BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'GROUP', 'HAVING', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON', 'AS', 'DISTINCT', 'ALL', 'UNION', 'INTERSECT', 'EXCEPT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'DEFAULT', 'AUTO_INCREMENT', 'NOT', 'NULL', 'UNIQUE', 'CHECK', 'CASCADE', 'TRUNCATE', 'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK', 'BEGIN', 'TRANSACTION', 'WITH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'EXISTS'],
    builtins: ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF', 'CAST', 'CONVERT', 'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER', 'LENGTH', 'NOW', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DATE', 'TIME', 'YEAR', 'MONTH', 'DAY'],
    types: ['INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'VARCHAR', 'CHAR', 'TEXT', 'BLOB', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'BOOLEAN', 'BOOL', 'JSON', 'UUID'],
    constants: ['TRUE', 'FALSE', 'NULL'],
    numberPattern: /\b\d+\.?\d*\b/g,
  },
  html: {
    keywords: [],
  },
  css: {
    keywords: [],
    numberPattern: /\b\d+\.?\d*(?:px|em|rem|%|vh|vw|deg|s|ms)?\b/g,
  },
  markdown: {
    keywords: [],
  },
  diff: {
    keywords: [],
  },
  plain: {
    keywords: [],
  },
};

const SUPPORTED_LANGUAGES: Language[] = [
  'javascript',
  'typescript',
  'python',
  'json',
  'yaml',
  'bash',
  'shell',
  'html',
  'css',
  'sql',
  'go',
  'rust',
  'markdown',
  'diff',
  'plain',
];

const LANGUAGE_ALIASES: Record<string, Language> = {
  cjs: 'javascript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  yml: 'yaml',
  sh: 'shell',
  zsh: 'shell',
  fish: 'shell',
  md: 'markdown',
  patch: 'diff',
  text: 'plain',
  plaintext: 'plain',
};

export function normalizeCodeLanguage(language?: string): Language {
  const normalized = (language || '').trim().toLowerCase().replace(/^\./, '');
  if (!normalized) return 'plain';
  if ((SUPPORTED_LANGUAGES as string[]).includes(normalized)) return normalized as Language;
  return Object.hasOwn(LANGUAGE_ALIASES, normalized) ? LANGUAGE_ALIASES[normalized]! : 'plain';
}

/**
 * Lightweight lexical highlighting, not a grammar parser. Scan the whole source
 * once, consuming comments/strings before looking for identifiers or numbers.
 * Output retains every UTF-16 unit, including controls: presentation adapters
 * sanitize text without confusing raw-source selection offsets.
 */
export function highlightCodeSpans(code: string, language: Language, theme: CodeTheme = DEFAULT_CODE_THEME): readonly TextSpan[] {
  const runs: { start: number; end: number; color: string }[] = [];
  const emit = (start: number, end: number, color = 'foreground') => {
    if (end <= start) return;
    const previous = runs.at(-1);
    if (previous?.color === color && previous.end === start) previous.end = end;
    else runs.push({ start, end, color });
  };
  const finish = () => Object.freeze(runs.map(run => Object.freeze({ text: code.slice(run.start, run.end),
    style: Object.freeze({ color: run.color }) })));
  if (language === 'plain' || !Object.hasOwn(LANGUAGE_RULES, language)) {
    emit(0, code.length);
    return finish();
  }
  if (language === 'diff') {
    let start = 0;
    while (start < code.length) {
      const newline = code.indexOf('\n', start);
      const end = newline < 0 ? code.length : newline + 1;
      emit(start, end, code[start] === '+' ? theme.added : code[start] === '-' ? theme.removed
        : code[start] === '@' ? theme.keyword : 'foreground');
      start = end;
    }
    return finish();
  }
  const rules = LANGUAGE_RULES[language]!;
  const keywords = new Set(rules.keywords);
  const builtins = new Set(rules.builtins);
  const types = new Set(rules.types);
  const constants = new Set(rules.constants);
  // Sticky matching uses the original source and flags, never a shared /g .test.
  const numbers = rules.numberPattern && new RegExp(rules.numberPattern.source,
    rules.numberPattern.flags.replace(/[gy]/g, '') + 'y');
  const cStyle = ['javascript', 'typescript', 'go', 'rust'].includes(language);
  const hashStyle = ['python', 'yaml', 'bash', 'shell'].includes(language);
  const closed = (start: number, opening: string, ending: string, nested = false): number => {
    let depth = 1;
    let index = start + opening.length;
    while (index < code.length) {
      if (nested && code.startsWith(opening, index)) { depth++; index += opening.length; }
      else if (code.startsWith(ending, index)) {
        index += ending.length;
        if (--depth === 0) return index;
      } else index++;
    }
    return code.length;
  };
  const quoted = (start: number, delimiter: string, multiline: boolean, escapes = true): number => {
    let index = start + delimiter.length;
    while (index < code.length) {
      if (code.startsWith(delimiter, index)) {
        // SQL/YAML escape quotes by doubling them.
        if ((language === 'sql' || language === 'yaml') && code.startsWith(delimiter + delimiter, index)) {
          index += delimiter.length * 2; continue;
        }
        return index + delimiter.length;
      }
      if (escapes && code[index] === '\\') { index = Math.min(code.length, index + 2); continue; }
      if (!multiline && (code[index] === '\n' || code[index] === '\r')) return index;
      index++;
    }
    return code.length;
  };
  let index = 0;
  while (index < code.length) {
    const start = index;
    const char = code[index]!;
    if (((cStyle || language === 'css' || language === 'sql') && code.startsWith('/*', index))
      || ((language === 'html' || language === 'markdown') && code.startsWith('<!--', index))) {
      const html = code.startsWith('<!--', index);
      index = closed(index, html ? '<!--' : '/*', html ? '-->' : '*/', language === 'rust');
      emit(start, index, theme.comment); continue;
    }
    if ((cStyle && code.startsWith('//', index)) || (language === 'sql' && code.startsWith('--', index))
      || (hashStyle && char === '#' && (language === 'python' || index === 0 || /[\s;|&()]/.test(code[index - 1]!)))) {
      const newline = code.indexOf('\n', index);
      index = newline < 0 ? code.length : newline;
      emit(start, index, theme.comment); continue;
    }
    // Rust raw strings require matching the exact number of opening hashes.
    if (language === 'rust' && char === 'r' && (index === 0 || !/[\w$]/.test(code[index - 1]!))) {
      let quote = index + 1;
      while (code[quote] === '#') quote++;
      if (code[quote] === '"') {
        const ending = '"' + '#'.repeat(quote - index - 1);
        const end = code.indexOf(ending, quote + 1);
        index = end < 0 ? code.length : end + ending.length;
        emit(start, index, theme.string); continue;
      }
    }
    const backtick = char === '`' && ['javascript', 'typescript', 'go', 'markdown'].includes(language);
    const ordinaryQuote = (char === '"' || char === "'") && language !== 'markdown'
      && !(language === 'json' && char === "'");
    // A Rust lifetime ('a) is not an unterminated character literal.
    const lifetime = language === 'rust' && char === "'" && /^'[A-Za-z_]\w*(?![\w'])/.test(code.slice(index, index + 128))
      && !/^'[A-Za-z_]\w*'/.test(code.slice(index, index + 128));
    if (backtick || (ordinaryQuote && !lifetime)) {
      const triple = language === 'python' && code.startsWith(char.repeat(3), index);
      const fence = language === 'markdown' && code.startsWith('```', index);
      const delimiter = triple || fence ? char.repeat(3) : char;
      const multiline = triple || backtick || ['bash', 'shell', 'sql', 'rust'].includes(language);
      index = quoted(index, delimiter, multiline, !(language === 'go' && backtick)
        && !(language === 'sql' || ((language === 'yaml' || language === 'bash' || language === 'shell') && char === "'")));
      emit(start, index, theme.string); continue;
    }
    if (numbers && /[\d.-]/.test(char) && (index === 0 || !/[\w$]/.test(code[index - 1]!))) {
      numbers.lastIndex = index;
      const match = numbers.exec(code);
      if (match) { index += match[0].length; emit(start, index, theme.number); continue; }
    }
    if (/[A-Za-z_$]/.test(char)) {
      index++;
      while (index < code.length && /[\w$]/.test(code[index]!)) index++;
      const word = code.slice(start, index);
      const name = language === 'sql' ? word.toUpperCase() : word;
      let next = index;
      while (next < code.length && /[ \t]/.test(code[next]!)) next++;
      const color = keywords.has(name) ? theme.keyword : builtins.has(name) ? theme.builtin
        : types.has(name) ? theme.type : constants.has(name) ? theme.constant
        : code[next] === '(' ? theme.function : /^[A-Z][a-z]/.test(word) ? theme.type
        : /^[a-z]+[A-Z]/.test(word) ? theme.variable : 'foreground';
      emit(start, index, color); continue;
    }
    index++;
    emit(start, index, /[+\-*/%=!<>|&^~?:]/.test(char) ? theme.operator
      : /[()[\]{},.;]/.test(char) ? theme.punctuation : 'foreground');
  }
  return finish();
}

/** Split styled source lines without rerunning the lexer or changing offsets. */
export function splitCodeSpanLines(spans: readonly TextSpan[]): TextSpan[][] {
  const lines: TextSpan[][] = [[]];
  for (const span of spans) {
    const parts = span.text.split('\n');
    parts.forEach((text, index) => {
      if (index > 0) lines.push([]);
      if (text) lines.at(-1)!.push({ text, style: span.style });
    });
  }
  return lines;
}
