/**
 * TCSS Tokenizer
 *
 * Lexer for Terminal CSS (TCSS) - a CSS-like styling language for TUI.
 * Tokenizes selectors, properties, values, variables, and special syntax.
 */

// ============================================================================
// Token Types
// ============================================================================

export enum TokenType {
  // Identifiers and keywords
  IDENT = 'IDENT', // e.g., Box, color, red
  HASH = 'HASH', // #id
  DOT = 'DOT', // .class
  COLON = 'COLON', // :pseudo or property:
  DOUBLE_COLON = 'DOUBLE_COLON', // ::pseudo-element
  SEMICOLON = 'SEMICOLON', // ;
  COMMA = 'COMMA', // ,
  STAR = 'STAR', // * (universal selector)

  // Brackets
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]

  // Values
  STRING = 'STRING', // "..." or '...'
  NUMBER = 'NUMBER', // 123, 1.5, .5
  PERCENTAGE = 'PERCENTAGE', // 50%
  DIMENSION = 'DIMENSION', // 10px, 2fr, 1em

  // Colors
  HEX_COLOR = 'HEX_COLOR', // #fff, #ffffff, #ffffffff

  // Operators
  PLUS = 'PLUS', // + (adjacent sibling)
  GREATER = 'GREATER', // > (child combinator)
  TILDE = 'TILDE', // ~ (general sibling)
  EQUALS = 'EQUALS', // = (attribute)
  PIPE = 'PIPE', // | (attribute)
  CARET = 'CARET', // ^ (attribute starts with)
  DOLLAR = 'DOLLAR', // $ (variable or attribute ends with)

  // At-rules
  AT_KEYWORD = 'AT_KEYWORD', // @import, @media, etc.

  // Special
  VARIABLE = 'VARIABLE', // $varname or --varname
  IMPORTANT = 'IMPORTANT', // !important
  FUNCTION = 'FUNCTION', // rgb(, url(, etc.
  WHITESPACE = 'WHITESPACE',
  COMMENT = 'COMMENT',
  NEWLINE = 'NEWLINE',

  // End of input
  EOF = 'EOF',

  // Error
  ERROR = 'ERROR',
}

// ============================================================================
// Token
// ============================================================================

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  start: number;
  end: number;
}

export interface TokenizerError {
  message: string;
  line: number;
  column: number;
  position: number;
}

// ============================================================================
// Tokenizer Options
// ============================================================================

export interface TokenizerOptions {
  /** Whether to include whitespace tokens (default: false) */
  includeWhitespace?: boolean;
  /** Whether to include comment tokens (default: false) */
  includeComments?: boolean;
  /** Whether to include newline tokens (default: false) */
  includeNewlines?: boolean;
}

// ============================================================================
// Character Helpers
// ============================================================================

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\t';
}

function isNewline(char: string): boolean {
  return char === '\n' || char === '\r';
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function isHexDigit(char: string): boolean {
  return (
    isDigit(char) ||
    (char >= 'a' && char <= 'f') ||
    (char >= 'A' && char <= 'F')
  );
}

function isNameStart(char: string): boolean {
  return (
    (char >= 'a' && char <= 'z') ||
    (char >= 'A' && char <= 'Z') ||
    char === '_' ||
    char === '-' ||
    char.charCodeAt(0) > 127 // Non-ASCII
  );
}

function isNameChar(char: string): boolean {
  return isNameStart(char) || isDigit(char);
}

// ============================================================================
// Tokenizer Class
// ============================================================================

export class Tokenizer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private options: Required<TokenizerOptions>;
  private errors: TokenizerError[] = [];

  constructor(input: string, options: TokenizerOptions = {}) {
    this.input = input;
    this.options = {
      includeWhitespace: options.includeWhitespace ?? false,
      includeComments: options.includeComments ?? false,
      includeNewlines: options.includeNewlines ?? false,
    };
  }

  /**
   * Get all errors encountered during tokenization
   */
  getErrors(): TokenizerError[] {
    return [...this.errors];
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Tokenize the entire input
   */
  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (true) {
      const token = this.nextToken();

      // Filter based on options
      if (
        token.type === TokenType.WHITESPACE &&
        !this.options.includeWhitespace
      ) {
        continue;
      }
      if (token.type === TokenType.COMMENT && !this.options.includeComments) {
        continue;
      }
      if (token.type === TokenType.NEWLINE && !this.options.includeNewlines) {
        continue;
      }

      tokens.push(token);

      if (token.type === TokenType.EOF) {
        break;
      }
    }

    return tokens;
  }

  /**
   * Get the next token
   */
  nextToken(): Token {
    if (this.isAtEnd()) {
      return this.makeToken(TokenType.EOF, '');
    }

    const char = this.peek();

    // Whitespace
    if (isWhitespace(char)) {
      return this.whitespace();
    }

    // Newline
    if (isNewline(char)) {
      return this.newline();
    }

    // Comments
    if (char === '/' && (this.peekNext() === '*' || this.peekNext() === '/')) {
      return this.comment();
    }

    // Strings
    if (char === '"' || char === "'") {
      return this.string(char);
    }

    // Numbers (including negative and decimal)
    if (isDigit(char) || (char === '.' && isDigit(this.peekNext()))) {
      return this.number();
    }

    // Negative numbers (must check before identifiers since - is a valid name start)
    if (char === '-' && isDigit(this.peekNext())) {
      return this.negativeNumber();
    }

    // Hash (ID selector or hex color)
    if (char === '#') {
      return this.hash();
    }

    // Variable ($var or --var)
    if (char === '$') {
      return this.variable();
    }
    if (char === '-' && this.peekNext() === '-') {
      return this.cssVariable();
    }

    // At-rules (@import, @media, etc.)
    if (char === '@') {
      return this.atKeyword();
    }

    // Important
    if (char === '!') {
      return this.important();
    }

    // Identifier or keyword
    if (isNameStart(char)) {
      return this.identifier();
    }

    // Single-character tokens
    return this.singleCharToken();
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private isAtEnd(): boolean {
    return this.pos >= this.input.length;
  }

  private peek(): string {
    return this.input[this.pos] || '';
  }

  private peekNext(): string {
    return this.input[this.pos + 1] || '';
  }

  private advance(): string {
    const char = this.input[this.pos];
    this.pos++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private makeToken(type: TokenType, value: string, start?: number): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column - value.length,
      start: start ?? this.pos - value.length,
      end: this.pos,
    };
  }

  private addError(message: string): void {
    this.errors.push({
      message,
      line: this.line,
      column: this.column,
      position: this.pos,
    });
  }

  // ==========================================================================
  // Token Scanners
  // ==========================================================================

  private whitespace(): Token {
    const start = this.pos;
    while (!this.isAtEnd() && isWhitespace(this.peek())) {
      this.advance();
    }
    return this.makeToken(
      TokenType.WHITESPACE,
      this.input.slice(start, this.pos),
      start
    );
  }

  private newline(): Token {
    const start = this.pos;
    const char = this.advance();
    // Handle \r\n
    if (char === '\r' && this.peek() === '\n') {
      this.advance();
    }
    return this.makeToken(
      TokenType.NEWLINE,
      this.input.slice(start, this.pos),
      start
    );
  }

  private comment(): Token {
    const start = this.pos;
    this.advance(); // /

    if (this.peek() === '*') {
      // Block comment /* */
      this.advance(); // *
      while (!this.isAtEnd()) {
        if (this.peek() === '*' && this.peekNext() === '/') {
          this.advance(); // *
          this.advance(); // /
          break;
        }
        this.advance();
      }
    } else if (this.peek() === '/') {
      // Line comment //
      this.advance(); // /
      while (!this.isAtEnd() && !isNewline(this.peek())) {
        this.advance();
      }
    }

    return this.makeToken(
      TokenType.COMMENT,
      this.input.slice(start, this.pos),
      start
    );
  }

  private string(quote: string): Token {
    const start = this.pos;
    this.advance(); // Opening quote

    let value = '';
    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance(); // Backslash
        if (!this.isAtEnd()) {
          const escaped = this.advance();
          switch (escaped) {
            case 'n':
              value += '\n';
              break;
            case 't':
              value += '\t';
              break;
            case 'r':
              value += '\r';
              break;
            case '\\':
              value += '\\';
              break;
            case "'":
              value += "'";
              break;
            case '"':
              value += '"';
              break;
            default:
              value += escaped;
          }
        }
      } else if (isNewline(this.peek())) {
        this.addError('Unterminated string');
        break;
      } else {
        value += this.advance();
      }
    }

    if (this.peek() === quote) {
      this.advance(); // Closing quote
    } else {
      this.addError('Unterminated string');
    }

    return this.makeToken(TokenType.STRING, value, start);
  }

  private number(): Token {
    const start = this.pos;

    // Integer part
    while (!this.isAtEnd() && isDigit(this.peek())) {
      this.advance();
    }

    // Decimal part
    if (this.peek() === '.' && isDigit(this.peekNext())) {
      this.advance(); // .
      while (!this.isAtEnd() && isDigit(this.peek())) {
        this.advance();
      }
    }

    const numValue = this.input.slice(start, this.pos);

    // Check for unit or percentage
    if (this.peek() === '%') {
      this.advance();
      return this.makeToken(
        TokenType.PERCENTAGE,
        this.input.slice(start, this.pos),
        start
      );
    }

    // Check for dimension (e.g., 10px, 2fr, 1em)
    if (isNameStart(this.peek())) {
      const unitStart = this.pos;
      while (!this.isAtEnd() && isNameChar(this.peek())) {
        this.advance();
      }
      return this.makeToken(
        TokenType.DIMENSION,
        this.input.slice(start, this.pos),
        start
      );
    }

    return this.makeToken(TokenType.NUMBER, numValue, start);
  }

  private hash(): Token {
    const start = this.pos;
    this.advance(); // #

    // Check if it's a hex color
    const colorStart = this.pos;
    while (!this.isAtEnd() && isHexDigit(this.peek())) {
      this.advance();
    }

    const hexPart = this.input.slice(colorStart, this.pos);

    // Valid hex color lengths: 3, 4, 6, 8
    if (
      hexPart.length === 3 ||
      hexPart.length === 4 ||
      hexPart.length === 6 ||
      hexPart.length === 8
    ) {
      // Check if there are more name characters (making it an ID instead)
      if (!this.isAtEnd() && isNameChar(this.peek()) && !isHexDigit(this.peek())) {
        // It's an ID selector
        while (!this.isAtEnd() && isNameChar(this.peek())) {
          this.advance();
        }
        return this.makeToken(
          TokenType.HASH,
          this.input.slice(start, this.pos),
          start
        );
      }
      return this.makeToken(TokenType.HEX_COLOR, hexPart, start);
    }

    // Must be an ID selector
    while (!this.isAtEnd() && isNameChar(this.peek())) {
      this.advance();
    }

    return this.makeToken(
      TokenType.HASH,
      this.input.slice(start, this.pos),
      start
    );
  }

  private variable(): Token {
    const start = this.pos;
    this.advance(); // $

    while (!this.isAtEnd() && isNameChar(this.peek())) {
      this.advance();
    }

    return this.makeToken(
      TokenType.VARIABLE,
      this.input.slice(start, this.pos),
      start
    );
  }

  private cssVariable(): Token {
    const start = this.pos;
    this.advance(); // -
    this.advance(); // -

    while (!this.isAtEnd() && isNameChar(this.peek())) {
      this.advance();
    }

    return this.makeToken(
      TokenType.VARIABLE,
      this.input.slice(start, this.pos),
      start
    );
  }

  private atKeyword(): Token {
    const start = this.pos;
    this.advance(); // @

    while (!this.isAtEnd() && isNameChar(this.peek())) {
      this.advance();
    }

    return this.makeToken(
      TokenType.AT_KEYWORD,
      this.input.slice(start, this.pos),
      start
    );
  }

  private important(): Token {
    const start = this.pos;
    this.advance(); // !

    // Skip whitespace
    while (!this.isAtEnd() && isWhitespace(this.peek())) {
      this.advance();
    }

    // Check for 'important'
    const word = this.input.slice(this.pos, this.pos + 9).toLowerCase();
    if (word === 'important') {
      for (let i = 0; i < 9; i++) {
        this.advance();
      }
      return this.makeToken(
        TokenType.IMPORTANT,
        this.input.slice(start, this.pos),
        start
      );
    }

    // Not !important, return as error
    this.addError('Expected "important" after "!"');
    return this.makeToken(
      TokenType.ERROR,
      this.input.slice(start, this.pos),
      start
    );
  }

  private identifier(): Token {
    const start = this.pos;

    while (!this.isAtEnd() && isNameChar(this.peek())) {
      this.advance();
    }

    const name = this.input.slice(start, this.pos);

    // Check if it's a function (followed by '(')
    if (this.peek() === '(') {
      this.advance(); // (
      return this.makeToken(TokenType.FUNCTION, name + '(', start);
    }

    return this.makeToken(TokenType.IDENT, name, start);
  }

  private singleCharToken(): Token {
    const start = this.pos;
    const char = this.advance();

    switch (char) {
      case '.':
        return this.makeToken(TokenType.DOT, char, start);
      case ':':
        if (this.peek() === ':') {
          this.advance();
          return this.makeToken(TokenType.DOUBLE_COLON, '::', start);
        }
        return this.makeToken(TokenType.COLON, char, start);
      case ';':
        return this.makeToken(TokenType.SEMICOLON, char, start);
      case ',':
        return this.makeToken(TokenType.COMMA, char, start);
      case '*':
        return this.makeToken(TokenType.STAR, char, start);
      case '{':
        return this.makeToken(TokenType.LBRACE, char, start);
      case '}':
        return this.makeToken(TokenType.RBRACE, char, start);
      case '(':
        return this.makeToken(TokenType.LPAREN, char, start);
      case ')':
        return this.makeToken(TokenType.RPAREN, char, start);
      case '[':
        return this.makeToken(TokenType.LBRACKET, char, start);
      case ']':
        return this.makeToken(TokenType.RBRACKET, char, start);
      case '+':
        return this.makeToken(TokenType.PLUS, char, start);
      case '>':
        return this.makeToken(TokenType.GREATER, char, start);
      case '~':
        return this.makeToken(TokenType.TILDE, char, start);
      case '=':
        return this.makeToken(TokenType.EQUALS, char, start);
      case '|':
        return this.makeToken(TokenType.PIPE, char, start);
      case '^':
        return this.makeToken(TokenType.CARET, char, start);
      case '-':
        // Negative number
        if (isDigit(this.peek())) {
          // Put back and let number() handle it
          this.pos--;
          this.column--;
          return this.negativeNumber();
        }
        // Otherwise treat as identifier start (for properties like margin-top)
        return this.identifier();
      default:
        this.addError(`Unexpected character: "${char}"`);
        return this.makeToken(TokenType.ERROR, char, start);
    }
  }

  private negativeNumber(): Token {
    const start = this.pos;
    this.advance(); // -

    // Integer part
    while (!this.isAtEnd() && isDigit(this.peek())) {
      this.advance();
    }

    // Decimal part
    if (this.peek() === '.' && isDigit(this.peekNext())) {
      this.advance(); // .
      while (!this.isAtEnd() && isDigit(this.peek())) {
        this.advance();
      }
    }

    const numValue = this.input.slice(start, this.pos);

    // Check for percentage
    if (this.peek() === '%') {
      this.advance();
      return this.makeToken(
        TokenType.PERCENTAGE,
        this.input.slice(start, this.pos),
        start
      );
    }

    // Check for dimension
    if (isNameStart(this.peek())) {
      while (!this.isAtEnd() && isNameChar(this.peek())) {
        this.advance();
      }
      return this.makeToken(
        TokenType.DIMENSION,
        this.input.slice(start, this.pos),
        start
      );
    }

    return this.makeToken(TokenType.NUMBER, numValue, start);
  }
}

// ============================================================================
// Convenience Function
// ============================================================================

/**
 * Tokenize a TCSS string
 */
export function tokenize(input: string, options?: TokenizerOptions): Token[] {
  const tokenizer = new Tokenizer(input, options);
  return tokenizer.tokenize();
}

/**
 * Tokenize and return tokens with any errors
 */
export function tokenizeWithErrors(
  input: string,
  options?: TokenizerOptions
): { tokens: Token[]; errors: TokenizerError[] } {
  const tokenizer = new Tokenizer(input, options);
  const tokens = tokenizer.tokenize();
  return { tokens, errors: tokenizer.getErrors() };
}
