/**
 * CodeBlock - Syntax highlighted code display
 *
 * Features:
 * - Multi-language syntax highlighting
 * - Line numbers
 * - Line highlighting
 * - Diff view (added/removed lines)
 * - Copy indicator
 * - Filename header
 * - Theme support
 * - Word wrapping option
 */

import { Box, Text } from './components.js';
import type { VNode } from '../utils/types.js';
import { stringWidth } from '../utils/text-utils.js';

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
const DEFAULT_THEME: CodeTheme = {
  keyword: 'magenta',
  string: 'green',
  number: 'yellow',
  comment: 'gray',
  function: 'blue',
  variable: 'cyan',
  operator: 'white',
  punctuation: 'gray',
  type: 'cyan',
  constant: 'yellow',
  builtin: 'magenta',
  added: 'green',
  removed: 'red',
  lineNumber: 'gray',
  background: 'black',
};

/** Language-specific keywords and patterns */
const LANGUAGE_RULES: Record<string, {
  keywords: string[];
  builtins?: string[];
  types?: string[];
  constants?: string[];
  stringPattern?: RegExp;
  commentPattern?: RegExp;
  numberPattern?: RegExp;
}> = {
  javascript: {
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'class', 'extends', 'import', 'export', 'from', 'default', 'async', 'await', 'yield', 'static', 'get', 'set', 'of', 'in', 'typeof', 'instanceof', 'delete', 'void'],
    builtins: ['console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'Promise', 'Map', 'Set', 'RegExp', 'Error', 'Symbol', 'BigInt', 'window', 'document', 'fetch', 'setTimeout', 'setInterval', 'require', 'module', 'exports', 'process'],
    constants: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'this'],
    stringPattern: /(['"`])(?:(?!\1|\\).|\\.)*\1/g,
    commentPattern: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    numberPattern: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/gi,
  },
  typescript: {
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'class', 'extends', 'import', 'export', 'from', 'default', 'async', 'await', 'yield', 'static', 'get', 'set', 'of', 'in', 'typeof', 'instanceof', 'delete', 'void', 'type', 'interface', 'enum', 'implements', 'namespace', 'abstract', 'private', 'protected', 'public', 'readonly', 'as', 'is', 'keyof', 'infer', 'declare'],
    types: ['string', 'number', 'boolean', 'void', 'never', 'any', 'unknown', 'object', 'symbol', 'bigint', 'null', 'undefined'],
    builtins: ['console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'Promise', 'Map', 'Set', 'RegExp', 'Error', 'Symbol', 'BigInt', 'Partial', 'Required', 'Readonly', 'Record', 'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable', 'ReturnType', 'Parameters'],
    constants: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'this'],
    stringPattern: /(['"`])(?:(?!\1|\\).|\\.)*\1/g,
    commentPattern: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    numberPattern: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/gi,
  },
  python: {
    keywords: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'try', 'except', 'finally', 'raise', 'import', 'from', 'as', 'with', 'async', 'await', 'yield', 'lambda', 'pass', 'del', 'global', 'nonlocal', 'assert', 'and', 'or', 'not', 'in', 'is'],
    builtins: ['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'bool', 'type', 'isinstance', 'hasattr', 'getattr', 'setattr', 'open', 'input', 'map', 'filter', 'zip', 'enumerate', 'sorted', 'reversed', 'sum', 'min', 'max', 'abs', 'round', 'any', 'all'],
    constants: ['True', 'False', 'None', 'self', 'cls'],
    stringPattern: /('''[\s\S]*?'''|"""[\s\S]*?"""|'[^']*'|"[^"]*")/g,
    commentPattern: /#.*/g,
    numberPattern: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/gi,
  },
  json: {
    keywords: [],
    constants: ['true', 'false', 'null'],
    stringPattern: /"(?:[^"\\]|\\.)*"/g,
    numberPattern: /-?\d+\.?\d*(?:e[+-]?\d+)?/gi,
  },
  yaml: {
    keywords: [],
    constants: ['true', 'false', 'null', 'yes', 'no', 'on', 'off'],
    stringPattern: /(["'])(?:(?!\1|\\).|\\.)*\1/g,
    commentPattern: /#.*/g,
    numberPattern: /\b\d+\.?\d*\b/g,
  },
  bash: {
    keywords: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'in', 'function', 'return', 'exit', 'local', 'export', 'source', 'alias', 'unalias', 'set', 'unset', 'shift', 'trap', 'break', 'continue'],
    builtins: ['echo', 'cd', 'pwd', 'ls', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'cat', 'grep', 'sed', 'awk', 'find', 'xargs', 'sort', 'uniq', 'wc', 'head', 'tail', 'cut', 'tr', 'tee', 'chmod', 'chown', 'sudo', 'apt', 'yum', 'brew', 'npm', 'pnpm', 'yarn', 'node', 'python', 'git', 'docker', 'kubectl', 'curl', 'wget'],
    stringPattern: /(["'])(?:(?!\1|\\).|\\.)*\1/g,
    commentPattern: /#.*/g,
  },
  shell: {
    keywords: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'in', 'function', 'return', 'exit', 'local', 'export', 'source', 'alias', 'unalias', 'set', 'unset', 'shift', 'trap', 'break', 'continue'],
    builtins: ['echo', 'cd', 'pwd', 'ls', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'cat', 'grep', 'sed', 'awk', 'find', 'xargs', 'sort', 'uniq', 'wc', 'head', 'tail', 'cut', 'tr', 'tee', 'chmod', 'chown', 'sudo', 'apt', 'yum', 'brew', 'npm', 'pnpm', 'yarn', 'node', 'python', 'git', 'docker', 'kubectl', 'curl', 'wget'],
    stringPattern: /(["'])(?:(?!\1|\\).|\\.)*\1/g,
    commentPattern: /#.*/g,
  },
  go: {
    keywords: ['func', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue', 'go', 'select', 'chan', 'defer', 'fallthrough', 'goto', 'package', 'import', 'const', 'var', 'type', 'struct', 'interface', 'map', 'make', 'new', 'append', 'len', 'cap', 'close', 'delete', 'copy', 'panic', 'recover'],
    types: ['string', 'int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 'float64', 'complex64', 'complex128', 'bool', 'byte', 'rune', 'error', 'uintptr'],
    builtins: ['fmt', 'os', 'io', 'net', 'http', 'json', 'time', 'context', 'sync', 'errors'],
    constants: ['true', 'false', 'nil', 'iota'],
    stringPattern: /(["'`])(?:(?!\1|\\).|\\.)*\1/g,
    commentPattern: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    numberPattern: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/gi,
  },
  rust: {
    keywords: ['fn', 'let', 'mut', 'const', 'static', 'return', 'if', 'else', 'for', 'while', 'loop', 'match', 'break', 'continue', 'struct', 'enum', 'impl', 'trait', 'type', 'where', 'pub', 'mod', 'use', 'crate', 'self', 'super', 'as', 'in', 'ref', 'move', 'async', 'await', 'dyn', 'unsafe', 'extern'],
    types: ['i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize', 'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc', 'Cell', 'RefCell', 'HashMap', 'HashSet'],
    builtins: ['Some', 'None', 'Ok', 'Err', 'println', 'print', 'format', 'panic', 'assert', 'vec', 'todo', 'unimplemented'],
    constants: ['true', 'false', 'Self'],
    stringPattern: /(["'])(?:(?!\1|\\).|\\.)*\1|r#*"[^"]*"#*/g,
    commentPattern: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    numberPattern: /\b\d+(?:_\d+)*\.?\d*(?:e[+-]?\d+)?(?:[iu](?:8|16|32|64|128|size)|f(?:32|64))?\b/gi,
  },
  sql: {
    keywords: ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'ORDER', 'BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'GROUP', 'HAVING', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON', 'AS', 'DISTINCT', 'ALL', 'UNION', 'INTERSECT', 'EXCEPT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'DEFAULT', 'AUTO_INCREMENT', 'NOT', 'NULL', 'UNIQUE', 'CHECK', 'CASCADE', 'TRUNCATE', 'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK', 'BEGIN', 'TRANSACTION', 'WITH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'EXISTS'],
    builtins: ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF', 'CAST', 'CONVERT', 'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER', 'LENGTH', 'NOW', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DATE', 'TIME', 'YEAR', 'MONTH', 'DAY'],
    types: ['INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'VARCHAR', 'CHAR', 'TEXT', 'BLOB', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'BOOLEAN', 'BOOL', 'JSON', 'UUID'],
    constants: ['TRUE', 'FALSE', 'NULL'],
    stringPattern: /'[^']*'/g,
    commentPattern: /--.*$|\/\*[\s\S]*?\*\//gm,
    numberPattern: /\b\d+\.?\d*\b/g,
  },
  html: {
    keywords: [],
    stringPattern: /(["'])(?:(?!\1|\\).|\\.)*\1/g,
    commentPattern: /<!--[\s\S]*?-->/g,
  },
  css: {
    keywords: [],
    stringPattern: /(["'])(?:(?!\1|\\).|\\.)*\1/g,
    commentPattern: /\/\*[\s\S]*?\*\//g,
    numberPattern: /\b\d+\.?\d*(?:px|em|rem|%|vh|vw|deg|s|ms)?\b/g,
  },
  markdown: {
    keywords: [],
    stringPattern: /`[^`]+`|```[\s\S]*?```/g,
    commentPattern: /<!--[\s\S]*?-->/g,
  },
  diff: {
    keywords: [],
  },
  plain: {
    keywords: [],
  },
};

export interface CodeBlockOptions {
  /** Code content */
  code: string;
  /** Language for highlighting */
  language?: Language;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Starting line number */
  startLine?: number;
  /** Lines to highlight (1-indexed) */
  highlightLines?: number[];
  /** Highlight color */
  highlightColor?: string;
  /** Theme */
  theme?: Partial<CodeTheme>;
  /** Filename to display */
  filename?: string;
  /** Show filename header */
  showFilename?: boolean;
  /** Max width (wraps or truncates) */
  maxWidth?: number;
  /** Word wrap long lines */
  wrap?: boolean;
  /** Show copy button indicator */
  showCopy?: boolean;
  /** Border style */
  borderStyle?: 'none' | 'single' | 'round';
  /** Border color */
  borderColor?: string;
}

/**
 * Tokenize and highlight code
 */
function highlightCode(code: string, language: Language, theme: CodeTheme): VNode[] {
  const rules = LANGUAGE_RULES[language] || LANGUAGE_RULES.plain;
  const tokens: Array<{ text: string; color: string }> = [];

  // Special handling for diff
  if (language === 'diff') {
    const lines = code.split('\n');
    return lines.map((line, i) => {
      let color = 'white';
      if (line.startsWith('+')) color = theme.added;
      else if (line.startsWith('-')) color = theme.removed;
      else if (line.startsWith('@')) color = theme.keyword;
      return Text({ color }, line + (i < lines.length - 1 ? '\n' : ''));
    });
  }

  // Simple tokenization (not a full parser, but good enough for display)
  let remaining = code;
  let lastIndex = 0;

  // Helper to add plain text
  const addPlain = (text: string) => {
    if (text) tokens.push({ text, color: 'white' });
  };

  // Process string literals first (they can contain keywords)
  const stringMatches: Array<{ index: number; text: string; color: string }> = [];
  if (rules.stringPattern) {
    let match;
    const regex = new RegExp(rules.stringPattern.source, 'gm');
    while ((match = regex.exec(code)) !== null) {
      stringMatches.push({ index: match.index, text: match[0], color: theme.string });
    }
  }

  // Process comments
  const commentMatches: Array<{ index: number; text: string; color: string }> = [];
  if (rules.commentPattern) {
    let match;
    const regex = new RegExp(rules.commentPattern.source, 'gm');
    while ((match = regex.exec(code)) !== null) {
      commentMatches.push({ index: match.index, text: match[0], color: theme.comment });
    }
  }

  // Merge and sort all matches
  const allMatches = [...stringMatches, ...commentMatches].sort((a, b) => a.index - b.index);

  // Apply highlighting
  let pos = 0;
  for (const match of allMatches) {
    if (match.index < pos) continue; // Skip overlapping matches

    // Add text before match
    const before = code.slice(pos, match.index);
    if (before) {
      // Highlight keywords in the before text
      const highlighted = highlightKeywords(before, rules, theme);
      tokens.push(...highlighted);
    }

    // Add match
    tokens.push({ text: match.text, color: match.color });
    pos = match.index + match.text.length;
  }

  // Add remaining text
  if (pos < code.length) {
    const remaining = code.slice(pos);
    const highlighted = highlightKeywords(remaining, rules, theme);
    tokens.push(...highlighted);
  }

  return tokens.map((t) => Text({ color: t.color }, t.text));
}

/**
 * Highlight keywords in text
 */
function highlightKeywords(
  text: string,
  rules: typeof LANGUAGE_RULES[string],
  theme: CodeTheme
): Array<{ text: string; color: string }> {
  const tokens: Array<{ text: string; color: string }> = [];

  // Split by word boundaries while preserving everything
  const parts = text.split(/(\b\w+\b)/);

  for (const part of parts) {
    if (!part) continue;

    let color = 'white';

    if (rules.keywords?.includes(part)) {
      color = theme.keyword;
    } else if (rules.builtins?.includes(part)) {
      color = theme.builtin;
    } else if (rules.types?.includes(part)) {
      color = theme.type;
    } else if (rules.constants?.includes(part)) {
      color = theme.constant;
    } else if (rules.numberPattern && rules.numberPattern.test(part)) {
      color = theme.number;
    } else if (/^[A-Z][a-z]/.test(part)) {
      // Likely a type/class name
      color = theme.type;
    } else if (/^[a-z]+[A-Z]/.test(part)) {
      // camelCase - likely a variable
      color = theme.variable;
    }

    tokens.push({ text: part, color });
  }

  return tokens;
}

/**
 * Render a code block
 */
export function CodeBlock(options: CodeBlockOptions): VNode {
  const {
    code,
    language = 'plain',
    lineNumbers = true,
    startLine = 1,
    highlightLines = [],
    highlightColor = 'yellow',
    theme: customTheme = {},
    filename,
    showFilename = true,
    maxWidth,
    wrap = false,
    showCopy = true,
    borderStyle = 'round',
    borderColor = 'gray',
  } = options;

  const theme: CodeTheme = { ...DEFAULT_THEME, ...customTheme };
  const lines = code.split('\n');
  const lineCount = lines.length;
  const lineNumWidth = String(startLine + lineCount - 1).length;

  const rows: VNode[] = [];

  // Filename header
  if (filename && showFilename) {
    rows.push(
      Box(
        { flexDirection: 'row', marginBottom: 1 },
        Text({ color: 'cyan' }, '📄 '),
        Text({ color: 'white', bold: true }, filename),
        showCopy ? Text({ color: 'gray', dim: true }, '  [copy]') : Text({}, '')
      )
    );
  }

  // Code lines
  for (let i = 0; i < lines.length; i++) {
    const lineNum = startLine + i;
    const line = lines[i];
    const isHighlighted = highlightLines.includes(lineNum);

    const lineParts: VNode[] = [];

    // Line number
    if (lineNumbers) {
      const numStr = String(lineNum).padStart(lineNumWidth, ' ');
      lineParts.push(
        Text(
          { color: isHighlighted ? highlightColor : theme.lineNumber, dim: !isHighlighted },
          `${numStr} │ `
        )
      );
    }

    // Highlighted line indicator
    if (isHighlighted) {
      lineParts.push(Text({ color: highlightColor }, '▶ '));
    }

    // Code content
    let displayLine = line;
    if (maxWidth && !wrap) {
      const availableWidth = maxWidth - (lineNumbers ? lineNumWidth + 3 : 0) - (isHighlighted ? 2 : 0);
      if (stringWidth(displayLine) > availableWidth) {
        // Truncate to visual width
        let truncated = '';
        let width = 0;
        for (const char of displayLine) {
          const charWidth = stringWidth(char);
          if (width + charWidth > availableWidth - 1) break;
          truncated += char;
          width += charWidth;
        }
        displayLine = truncated + '…';
      }
    }

    // Apply syntax highlighting
    const highlightedCode = highlightCode(displayLine, language, theme);
    lineParts.push(...highlightedCode);

    rows.push(
      Box(
        { flexDirection: 'row' },
        ...lineParts
      )
    );
  }

  // Apply border
  if (borderStyle !== 'none') {
    return Box(
      {
        flexDirection: 'column',
        borderStyle: borderStyle as any,
        borderColor,
        paddingX: 1,
        paddingY: 0,
      },
      ...rows
    );
  }

  return Box({ flexDirection: 'column' }, ...rows);
}

/**
 * Inline code (single line, no line numbers)
 */
export function InlineCode(options: { code: string; language?: Language; color?: string }): VNode {
  const { code, language = 'plain', color = 'cyan' } = options;

  if (language === 'plain') {
    return Text({ color, backgroundColor: 'black' }, ` ${code} `);
  }

  const theme: CodeTheme = { ...DEFAULT_THEME };
  const highlighted = highlightCode(code, language, theme);

  return Box(
    { flexDirection: 'row' },
    Text({ backgroundColor: 'black' }, ' '),
    ...highlighted,
    Text({ backgroundColor: 'black' }, ' ')
  );
}
