import type { TextSpan } from './styled-text.js';
import { getLanguageId, tokenizeCodeRanges, type Token, type TokenType, type CodeTokenRange } from './code-tokenizer.js';

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

/** Existing CodeBlock language surface over the canonical shared registry. */
export function normalizeCodeLanguage(language?: string): Language {
  const normalized = (language || '').trim().toLowerCase().replace(/^\./, '');
  const id = getLanguageId(normalized);
  if (id === 'bash') return normalized === 'bash' ? 'bash' : 'shell';
  return id && ['javascript', 'typescript', 'python', 'json', 'yaml', 'html', 'css', 'sql', 'go', 'rust', 'markdown', 'diff', 'plain'].includes(id)
    ? id as Language : 'plain';
}

/** Structured theme adapter; tokenization is shared with FilePreview. */
export function highlightCodeSpans(code: string, language: Language, theme: CodeTheme = DEFAULT_CODE_THEME,
  ranges: readonly CodeTokenRange[] = tokenizeCodeRanges(code, language)): readonly TextSpan[] {
  const colors = new Map<TokenType, string>();
  const resolveColor = (type: TokenType): string => {
    if (language === 'diff') {
      if (type === 'constant.builtin') return theme.added;
      if (type === 'invalid') return theme.removed;
    }
    const dot = type.indexOf('.');
    const parent = dot < 0 ? type : type.slice(0, dot);
    if (Object.hasOwn(theme, parent)) {
      return theme[parent as keyof CodeTheme];
    }
    return parent === 'decorator' || parent === 'meta' ? theme.keyword
      : parent === 'class' || parent === 'interface' || parent === 'namespace' ? theme.type
      : parent === 'tag' ? theme.function : parent === 'entity' ? theme.constant : 'foreground';
  };
  return codeRangesToSpans(code, ranges, token => {
    const cached = colors.get(token.type);
    if (cached !== undefined) return cached;
    const color = resolveColor(token.type);
    colors.set(token.type, color);
    return color;
  });
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

/**
 * Get color for token type from theme
 */
export function getTokenColor(type: TokenType, theme: HighlightTheme): string {
  // Check exact match first
  if (Object.hasOwn(theme.colors, type) && theme.colors[type]) {
    return theme.colors[type]!;
  }

  // Check parent type (e.g., 'keyword' for 'keyword.control')
  const dotIndex = type.indexOf('.');
  if (dotIndex !== -1) {
    const parent = type.slice(0, dotIndex) as TokenType;
    if (Object.hasOwn(theme.colors, parent) && theme.colors[parent]) {
      return theme.colors[parent]!;
    }
  }

  return theme.default || 'white';
}

/** Immutable raw-source spans. Adjacent equal colors share one text flow. */
export function mapCodeTokens(tokens: readonly Token[], colorFor: (token: Token) => string): readonly TextSpan[] {
  const runs: { parts: string[]; color: string }[] = [];
  for (const token of tokens) {
    if (!token.value) continue;
    const color = colorFor(token);
    const previous = runs.at(-1);
    if (previous?.color === color) previous.parts.push(token.value);
    else runs.push({ parts: [token.value], color });
  }
  return Object.freeze(runs.map(run => Object.freeze({ text: run.parts.join(''), style: Object.freeze({ color: run.color }) })));
}

/** Palette adapter for the legacy detailed token themes; no terminal escapes. */
export function tokensToSpans(tokens: readonly Token[], theme: HighlightTheme = themes.dark!): readonly TextSpan[] {
  return mapCodeTokens(tokens, token => getTokenColor(token.type, theme));
}

/** Style source ranges without allocating/copying intermediate token values. */
export function codeRangesToSpans(source: string, tokens: readonly CodeTokenRange[], colorFor: (token: CodeTokenRange) => string): readonly TextSpan[] {
  const runs: { start: number; end: number; color: string }[] = [];
  for (const token of tokens) {
    const color = colorFor(token);
    const previous = runs.at(-1);
    if (previous?.color === color && previous.end === token.start) previous.end = token.end;
    else runs.push({ start: token.start, end: token.end, color });
  }
  return Object.freeze(runs.map(run => Object.freeze({ text: source.slice(run.start, run.end), style: Object.freeze({ color: run.color }) })));
}
