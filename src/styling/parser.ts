/**
 * TCSS Parser
 *
 * Recursive descent parser for TCSS (Terminal CSS).
 * Converts tokens from the tokenizer into an Abstract Syntax Tree (AST).
 */

import { Token, TokenType, Tokenizer, tokenize } from './tokenizer.js';

// =============================================================================
// AST Node Types
// =============================================================================

/**
 * Base AST node interface
 */
export interface ASTNode {
  type: string;
  line: number;
  column: number;
}

/**
 * Selector types
 */
export type SelectorType =
  | 'type' // Box, Text
  | 'class' // .primary
  | 'id' // #header
  | 'universal' // *
  | 'pseudo-class' // :focus
  | 'pseudo-element' // ::before
  | 'attribute'; // [attr=value]

/**
 * Combinator types
 */
export type CombinatorType =
  | 'descendant' // space
  | 'child' // >
  | 'adjacent' // +
  | 'sibling'; // ~

/**
 * Simple selector (single element without combinators)
 */
export interface SimpleSelector extends ASTNode {
  type: 'simple-selector';
  selectorType: SelectorType;
  name: string;
  argument?: string; // For :not(), :nth-child(), etc.
}

/**
 * Compound selector (multiple simple selectors without combinator)
 * e.g., Box.primary#main
 */
export interface CompoundSelector extends ASTNode {
  type: 'compound-selector';
  selectors: SimpleSelector[];
}

/**
 * Complex selector (compound selectors with combinators)
 * e.g., Box > Text.primary
 */
export interface ComplexSelector extends ASTNode {
  type: 'complex-selector';
  left: CompoundSelector | ComplexSelector;
  combinator: CombinatorType;
  right: CompoundSelector;
}

/**
 * Selector list (comma-separated selectors)
 * e.g., Box, Text, .primary
 */
export interface SelectorList extends ASTNode {
  type: 'selector-list';
  selectors: (CompoundSelector | ComplexSelector)[];
}

/**
 * CSS value (can be various types)
 */
export interface Value extends ASTNode {
  type: 'value';
  valueType:
    | 'keyword'
    | 'number'
    | 'dimension'
    | 'percentage'
    | 'color'
    | 'string'
    | 'variable'
    | 'function';
  value: string;
  unit?: string;
  arguments?: Value[]; // For function values
}

/**
 * Property declaration
 * e.g., color: red
 */
export interface Declaration extends ASTNode {
  type: 'declaration';
  property: string;
  values: Value[];
  important: boolean;
}

/**
 * Rule (selector + declarations)
 */
export interface Rule extends ASTNode {
  type: 'rule';
  selectors: SelectorList;
  declarations: Declaration[];
}

/**
 * Variable definition
 * e.g., $primary: #007bff
 */
export interface VariableDefinition extends ASTNode {
  type: 'variable-definition';
  name: string;
  values: Value[];
}

/**
 * @import rule
 */
export interface ImportRule extends ASTNode {
  type: 'import';
  path: string;
}

/**
 * @media query condition
 */
export interface MediaCondition extends ASTNode {
  type: 'media-condition';
  feature: string;
  value?: Value;
}

/**
 * @media rule
 */
export interface MediaRule extends ASTNode {
  type: 'media';
  conditions: MediaCondition[];
  rules: (Rule | VariableDefinition)[];
}

/**
 * Stylesheet (root node)
 */
export interface Stylesheet extends ASTNode {
  type: 'stylesheet';
  rules: (Rule | VariableDefinition | ImportRule | MediaRule)[];
}

// =============================================================================
// Parser Error
// =============================================================================

export interface ParserError {
  message: string;
  line: number;
  column: number;
  token?: Token;
}

// =============================================================================
// Parser Result
// =============================================================================

export interface ParseResult {
  ast: Stylesheet;
  errors: ParserError[];
}

// =============================================================================
// Parser Options
// =============================================================================

export interface ParserOptions {
  /**
   * Whether to continue parsing after errors
   * @default true
   */
  tolerant?: boolean;
}

// =============================================================================
// Parser Class
// =============================================================================

export class Parser {
  private tokens: Token[] = [];
  private current: number = 0;
  private errors: ParserError[] = [];
  private options: Required<ParserOptions>;

  constructor(options: ParserOptions = {}) {
    this.options = {
      tolerant: options.tolerant ?? true,
    };
  }

  /**
   * Parse TCSS source into AST
   */
  parse(source: string): ParseResult {
    this.tokens = tokenize(source);
    this.current = 0;
    this.errors = [];

    const ast = this.parseStylesheet();

    return { ast, errors: this.errors };
  }

  /**
   * Parse from tokens directly
   */
  parseTokens(tokens: Token[]): ParseResult {
    this.tokens = tokens;
    this.current = 0;
    this.errors = [];

    const ast = this.parseStylesheet();

    return { ast, errors: this.errors };
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekNext(): Token | undefined {
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkValue(type: TokenType, value: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    return token.type === type && token.value === value;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.error(message);
  }

  private error(message: string): ParserError {
    const token = this.peek();
    const error: ParserError = {
      message,
      line: token.line,
      column: token.column,
      token,
    };
    this.errors.push(error);
    return error;
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      // Stop at statement boundaries
      if (this.previous().type === TokenType.RBRACE) return;
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.AT_KEYWORD:
        case TokenType.VARIABLE:
        case TokenType.IDENT:
        case TokenType.DOT:
        case TokenType.HASH:
        case TokenType.STAR:
          return;
      }

      this.advance();
    }
  }

  // ===========================================================================
  // Parsing Methods
  // ===========================================================================

  private parseStylesheet(): Stylesheet {
    const startToken = this.peek();
    const rules: (Rule | VariableDefinition | ImportRule | MediaRule)[] = [];

    while (!this.isAtEnd()) {
      try {
        const rule = this.parseTopLevel();
        if (rule) {
          rules.push(rule);
        }
      } catch {
        if (this.options.tolerant) {
          this.synchronize();
        } else {
          break;
        }
      }
    }

    return {
      type: 'stylesheet',
      rules,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseTopLevel(): Rule | VariableDefinition | ImportRule | MediaRule | null {
    // Skip any stray semicolons
    while (this.match(TokenType.SEMICOLON)) {}

    if (this.isAtEnd()) return null;

    // @import
    if (this.check(TokenType.AT_KEYWORD) && this.peek().value === '@import') {
      return this.parseImport();
    }

    // @media
    if (this.check(TokenType.AT_KEYWORD) && this.peek().value === '@media') {
      return this.parseMedia();
    }

    // Variable definition
    if (this.check(TokenType.VARIABLE)) {
      return this.parseVariableDefinition();
    }

    // Rule
    return this.parseRule();
  }

  private parseImport(): ImportRule {
    const startToken = this.advance(); // consume @import

    // Expect a string
    const pathToken = this.consume(TokenType.STRING, 'Expected import path string');

    // Optional semicolon
    this.match(TokenType.SEMICOLON);

    return {
      type: 'import',
      path: pathToken.value,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseMedia(): MediaRule {
    const startToken = this.advance(); // consume @media

    // Parse media conditions
    const conditions: MediaCondition[] = [];

    // Expect opening paren for condition
    if (this.match(TokenType.LPAREN)) {
      conditions.push(this.parseMediaCondition());
      this.consume(TokenType.RPAREN, 'Expected ) after media condition');

      // Handle additional conditions with 'and'
      while (this.check(TokenType.IDENT) && this.peek().value === 'and') {
        this.advance(); // consume 'and'
        this.consume(TokenType.LPAREN, 'Expected ( after "and"');
        conditions.push(this.parseMediaCondition());
        this.consume(TokenType.RPAREN, 'Expected ) after media condition');
      }
    }

    // Expect opening brace
    this.consume(TokenType.LBRACE, 'Expected { after media query');

    // Parse rules inside media
    const rules: (Rule | VariableDefinition)[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      try {
        if (this.check(TokenType.VARIABLE)) {
          rules.push(this.parseVariableDefinition());
        } else {
          rules.push(this.parseRule());
        }
      } catch {
        if (this.options.tolerant) {
          this.synchronize();
        } else {
          break;
        }
      }
    }

    this.consume(TokenType.RBRACE, 'Expected } after media rules');

    return {
      type: 'media',
      conditions,
      rules,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseMediaCondition(): MediaCondition {
    const startToken = this.peek();

    // Feature name (e.g., min-width)
    const featureToken = this.consume(TokenType.IDENT, 'Expected media feature name');

    let value: Value | undefined;

    // Check for colon + value
    if (this.match(TokenType.COLON)) {
      value = this.parseValue();
    }

    return {
      type: 'media-condition',
      feature: featureToken.value,
      value,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseVariableDefinition(): VariableDefinition {
    const startToken = this.advance(); // consume $variable

    this.consume(TokenType.COLON, 'Expected : after variable name');

    const values = this.parseValueList();

    // Optional semicolon
    this.match(TokenType.SEMICOLON);

    return {
      type: 'variable-definition',
      name: startToken.value,
      values,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseRule(): Rule {
    const startToken = this.peek();

    // Parse selectors
    const selectors = this.parseSelectorList();

    // Expect opening brace
    this.consume(TokenType.LBRACE, 'Expected { after selector');

    // Parse declarations
    const declarations = this.parseDeclarations();

    // Expect closing brace
    this.consume(TokenType.RBRACE, 'Expected } after declarations');

    return {
      type: 'rule',
      selectors,
      declarations,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseSelectorList(): SelectorList {
    const startToken = this.peek();
    const selectors: (CompoundSelector | ComplexSelector)[] = [];

    selectors.push(this.parseComplexSelector());

    while (this.match(TokenType.COMMA)) {
      selectors.push(this.parseComplexSelector());
    }

    return {
      type: 'selector-list',
      selectors,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseComplexSelector(): CompoundSelector | ComplexSelector {
    let left: CompoundSelector | ComplexSelector = this.parseCompoundSelector();

    while (true) {
      const combinator = this.parseCombinator();
      if (!combinator) break;

      const right = this.parseCompoundSelector();

      left = {
        type: 'complex-selector',
        left,
        combinator,
        right,
        line: left.line,
        column: left.column,
      };
    }

    return left;
  }

  private parseCombinator(): CombinatorType | null {
    // Check for explicit combinators
    if (this.match(TokenType.GREATER)) {
      return 'child';
    }
    if (this.match(TokenType.PLUS)) {
      return 'adjacent';
    }
    if (this.match(TokenType.TILDE)) {
      return 'sibling';
    }

    // Check for descendant combinator (implicit - space between selectors)
    // We need to check if next token can start a selector
    if (this.canStartSelector()) {
      return 'descendant';
    }

    return null;
  }

  private canStartSelector(): boolean {
    const type = this.peek().type;
    return (
      type === TokenType.IDENT ||
      type === TokenType.DOT ||
      type === TokenType.HASH ||
      type === TokenType.STAR ||
      type === TokenType.COLON ||
      type === TokenType.DOUBLE_COLON ||
      type === TokenType.LBRACKET
    );
  }

  private parseCompoundSelector(): CompoundSelector {
    const startToken = this.peek();
    const selectors: SimpleSelector[] = [];

    // First selector can be IDENT, STAR, or any other selector starter
    if (this.canStartSimpleSelector()) {
      selectors.push(this.parseSimpleSelector());
    }

    // Subsequent selectors can only be class, id, pseudo, attribute
    // (not type or universal - those would indicate a new selector with descendant combinator)
    while (this.canContinueCompoundSelector()) {
      selectors.push(this.parseSimpleSelector());
    }

    if (selectors.length === 0) {
      throw this.error('Expected selector');
    }

    return {
      type: 'compound-selector',
      selectors,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private canStartSimpleSelector(): boolean {
    const type = this.peek().type;
    return (
      type === TokenType.IDENT ||
      type === TokenType.DOT ||
      type === TokenType.HASH ||
      type === TokenType.STAR ||
      type === TokenType.COLON ||
      type === TokenType.DOUBLE_COLON ||
      type === TokenType.LBRACKET
    );
  }

  /**
   * Check if current token can continue a compound selector.
   * Unlike canStartSimpleSelector, this excludes IDENT and STAR
   * because those would indicate a new selector (descendant combinator).
   */
  private canContinueCompoundSelector(): boolean {
    const type = this.peek().type;
    return (
      type === TokenType.DOT ||
      type === TokenType.HASH ||
      type === TokenType.COLON ||
      type === TokenType.DOUBLE_COLON ||
      type === TokenType.LBRACKET
    );
  }

  private parseSimpleSelector(): SimpleSelector {
    const startToken = this.peek();

    // Universal selector: *
    if (this.match(TokenType.STAR)) {
      return {
        type: 'simple-selector',
        selectorType: 'universal',
        name: '*',
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Type selector: Box, Text
    if (this.check(TokenType.IDENT)) {
      const token = this.advance();
      return {
        type: 'simple-selector',
        selectorType: 'type',
        name: token.value,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Class selector: .primary
    if (this.match(TokenType.DOT)) {
      const ident = this.consume(TokenType.IDENT, 'Expected class name after .');
      return {
        type: 'simple-selector',
        selectorType: 'class',
        name: ident.value,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // ID selector: #header (hash token includes the name)
    if (this.check(TokenType.HASH)) {
      const token = this.advance();
      // Hash token value is like '#header', remove the #
      const name = token.value.startsWith('#') ? token.value.slice(1) : token.value;
      return {
        type: 'simple-selector',
        selectorType: 'id',
        name,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Pseudo-element: ::before
    if (this.match(TokenType.DOUBLE_COLON)) {
      const ident = this.consume(TokenType.IDENT, 'Expected pseudo-element name after ::');
      let argument: string | undefined;

      // Check for function-like pseudo-element
      if (this.match(TokenType.LPAREN)) {
        argument = this.parseArgumentString();
        this.consume(TokenType.RPAREN, 'Expected ) after pseudo-element argument');
      }

      return {
        type: 'simple-selector',
        selectorType: 'pseudo-element',
        name: ident.value,
        argument,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Pseudo-class: :focus, :hover, :not(), :nth-child()
    if (this.match(TokenType.COLON)) {
      let name: string;
      let argument: string | undefined;

      // Check for function-like pseudo-class (tokenizer creates FUNCTION token for name()
      if (this.check(TokenType.FUNCTION)) {
        const func = this.advance();
        // Function token value is like 'nth-child(' - extract name
        name = func.value.slice(0, -1);

        // Parse arguments
        argument = this.parseArgumentString();
        this.consume(TokenType.RPAREN, 'Expected ) after pseudo-class argument');
      } else {
        const ident = this.consume(TokenType.IDENT, 'Expected pseudo-class name after :');
        name = ident.value;

        // Check for function-like pseudo-class with separate LPAREN
        if (this.match(TokenType.LPAREN)) {
          argument = this.parseArgumentString();
          this.consume(TokenType.RPAREN, 'Expected ) after pseudo-class argument');
        }
      }

      return {
        type: 'simple-selector',
        selectorType: 'pseudo-class',
        name,
        argument,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Attribute selector: [attr=value]
    if (this.match(TokenType.LBRACKET)) {
      const attr = this.parseAttributeSelector();
      this.consume(TokenType.RBRACKET, 'Expected ] after attribute selector');
      return {
        type: 'simple-selector',
        selectorType: 'attribute',
        name: attr.name,
        argument: attr.argument,
        line: startToken.line,
        column: startToken.column,
      };
    }

    throw this.error('Expected selector');
  }

  private parseArgumentString(): string {
    // Collect tokens until closing paren
    const parts: string[] = [];
    let depth = 1;

    while (!this.isAtEnd() && depth > 0) {
      if (this.check(TokenType.LPAREN)) {
        depth++;
        parts.push(this.advance().value);
      } else if (this.check(TokenType.RPAREN)) {
        depth--;
        if (depth > 0) {
          parts.push(this.advance().value);
        }
      } else {
        parts.push(this.advance().value);
      }
    }

    return parts.join(' ').trim();
  }

  private parseAttributeSelector(): { name: string; argument?: string } {
    const attrName = this.consume(TokenType.IDENT, 'Expected attribute name');

    // Check for operator
    if (
      this.check(TokenType.IDENT) ||
      this.check(TokenType.STRING) ||
      this.check(TokenType.NUMBER)
    ) {
      // Simple [attr value] - this is wrong, need operator
      throw this.error('Expected attribute operator (=, ~=, |=, ^=, $=, *=)');
    }

    // Check for = or other operators
    // For now, just handle simple [attr] or [attr=value]
    if (this.peek().value === '=' || this.peek().value.endsWith('=')) {
      this.advance(); // consume operator

      // Get value
      if (this.check(TokenType.STRING)) {
        const val = this.advance();
        return { name: attrName.value, argument: val.value };
      } else if (this.check(TokenType.IDENT)) {
        const val = this.advance();
        return { name: attrName.value, argument: val.value };
      }
    }

    return { name: attrName.value };
  }

  private parseDeclarations(): Declaration[] {
    const declarations: Declaration[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      try {
        const decl = this.parseDeclaration();
        if (decl) {
          declarations.push(decl);
        }
      } catch {
        if (this.options.tolerant) {
          // Skip to next semicolon or closing brace
          while (
            !this.isAtEnd() &&
            !this.check(TokenType.SEMICOLON) &&
            !this.check(TokenType.RBRACE)
          ) {
            this.advance();
          }
          this.match(TokenType.SEMICOLON);
        } else {
          throw this.errors[this.errors.length - 1];
        }
      }
    }

    return declarations;
  }

  private parseDeclaration(): Declaration | null {
    // Skip any stray semicolons
    while (this.match(TokenType.SEMICOLON)) {}

    if (this.check(TokenType.RBRACE) || this.isAtEnd()) {
      return null;
    }

    const startToken = this.peek();

    // Property name
    const propertyToken = this.consume(TokenType.IDENT, 'Expected property name');

    this.consume(TokenType.COLON, 'Expected : after property name');

    // Values
    const values = this.parseValueList();

    // Check for !important
    let important = false;
    if (this.match(TokenType.IMPORTANT)) {
      important = true;
    }

    // Optional semicolon
    this.match(TokenType.SEMICOLON);

    return {
      type: 'declaration',
      property: propertyToken.value,
      values,
      important,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseValueList(): Value[] {
    const values: Value[] = [];

    while (!this.isValueListEnd()) {
      values.push(this.parseValue());
    }

    if (values.length === 0) {
      throw this.error('Expected value');
    }

    return values;
  }

  private isValueListEnd(): boolean {
    return (
      this.isAtEnd() ||
      this.check(TokenType.SEMICOLON) ||
      this.check(TokenType.RBRACE) ||
      this.check(TokenType.IMPORTANT)
    );
  }

  private parseValue(): Value {
    const startToken = this.peek();

    // Variable reference
    if (this.check(TokenType.VARIABLE)) {
      const token = this.advance();
      return {
        type: 'value',
        valueType: 'variable',
        value: token.value,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Function
    if (this.check(TokenType.FUNCTION)) {
      return this.parseFunctionValue();
    }

    // Hex color
    if (this.check(TokenType.HEX_COLOR)) {
      const token = this.advance();
      return {
        type: 'value',
        valueType: 'color',
        value: '#' + token.value,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // String
    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return {
        type: 'value',
        valueType: 'string',
        value: token.value,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Number
    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      return {
        type: 'value',
        valueType: 'number',
        value: token.value,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Percentage
    if (this.check(TokenType.PERCENTAGE)) {
      const token = this.advance();
      // Extract number and %
      const num = token.value.replace('%', '');
      return {
        type: 'value',
        valueType: 'percentage',
        value: num,
        unit: '%',
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Dimension (number with unit)
    if (this.check(TokenType.DIMENSION)) {
      const token = this.advance();
      // Extract number and unit
      const match = token.value.match(/^(-?[\d.]+)([a-zA-Z%]+)$/);
      if (match) {
        return {
          type: 'value',
          valueType: 'dimension',
          value: match[1],
          unit: match[2],
          line: startToken.line,
          column: startToken.column,
        };
      }
      return {
        type: 'value',
        valueType: 'dimension',
        value: token.value,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Keyword (identifier)
    if (this.check(TokenType.IDENT)) {
      const token = this.advance();
      return {
        type: 'value',
        valueType: 'keyword',
        value: token.value,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Comma (for multi-value properties)
    if (this.check(TokenType.COMMA)) {
      this.advance();
      return this.parseValue();
    }

    throw this.error(`Unexpected token: ${this.peek().value}`);
  }

  private parseFunctionValue(): Value {
    const startToken = this.peek();
    const token = this.advance(); // consume function token (includes opening paren)

    // Function name is the value without the trailing (
    const name = token.value.slice(0, -1);

    // Parse arguments
    const args: Value[] = [];

    while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
      args.push(this.parseValue());

      // Allow commas between arguments
      this.match(TokenType.COMMA);
    }

    this.consume(TokenType.RPAREN, 'Expected ) after function arguments');

    return {
      type: 'value',
      valueType: 'function',
      value: name,
      arguments: args,
      line: startToken.line,
      column: startToken.column,
    };
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Parse TCSS source into AST
 */
export function parse(source: string, options?: ParserOptions): ParseResult {
  const parser = new Parser(options);
  return parser.parse(source);
}

/**
 * Parse TCSS and throw on errors
 */
export function parseStrict(source: string): Stylesheet {
  const result = parse(source, { tolerant: false });
  if (result.errors.length > 0) {
    const err = result.errors[0];
    throw new Error(`Parse error at line ${err.line}, column ${err.column}: ${err.message}`);
  }
  return result.ast;
}

// =============================================================================
// AST Utilities
// =============================================================================

/**
 * Visit all nodes in the AST
 */
export function visitAST(
  node: ASTNode,
  visitor: (node: ASTNode, parent?: ASTNode) => void,
  parent?: ASTNode
): void {
  visitor(node, parent);

  switch (node.type) {
    case 'stylesheet': {
      const stylesheet = node as Stylesheet;
      for (const rule of stylesheet.rules) {
        visitAST(rule, visitor, node);
      }
      break;
    }

    case 'rule': {
      const rule = node as Rule;
      visitAST(rule.selectors, visitor, node);
      for (const decl of rule.declarations) {
        visitAST(decl, visitor, node);
      }
      break;
    }

    case 'selector-list': {
      const list = node as SelectorList;
      for (const selector of list.selectors) {
        visitAST(selector, visitor, node);
      }
      break;
    }

    case 'complex-selector': {
      const complex = node as ComplexSelector;
      visitAST(complex.left, visitor, node);
      visitAST(complex.right, visitor, node);
      break;
    }

    case 'compound-selector': {
      const compound = node as CompoundSelector;
      for (const selector of compound.selectors) {
        visitAST(selector, visitor, node);
      }
      break;
    }

    case 'declaration': {
      const decl = node as Declaration;
      for (const value of decl.values) {
        visitAST(value, visitor, node);
      }
      break;
    }

    case 'value': {
      const val = node as Value;
      if (val.arguments) {
        for (const arg of val.arguments) {
          visitAST(arg, visitor, node);
        }
      }
      break;
    }

    case 'variable-definition': {
      const varDef = node as VariableDefinition;
      for (const value of varDef.values) {
        visitAST(value, visitor, node);
      }
      break;
    }

    case 'media': {
      const media = node as MediaRule;
      for (const condition of media.conditions) {
        visitAST(condition, visitor, node);
      }
      for (const rule of media.rules) {
        visitAST(rule, visitor, node);
      }
      break;
    }

    case 'media-condition': {
      const condition = node as MediaCondition;
      if (condition.value) {
        visitAST(condition.value, visitor, node);
      }
      break;
    }

    // Leaf nodes: simple-selector, import
    default:
      break;
  }
}

/**
 * Stringify selector for debugging
 */
export function stringifySelector(selector: CompoundSelector | ComplexSelector): string {
  if (selector.type === 'compound-selector') {
    return selector.selectors
      .map(s => {
        switch (s.selectorType) {
          case 'type':
            return s.name;
          case 'class':
            return '.' + s.name;
          case 'id':
            return '#' + s.name;
          case 'universal':
            return '*';
          case 'pseudo-class':
            return ':' + s.name + (s.argument ? `(${s.argument})` : '');
          case 'pseudo-element':
            return '::' + s.name + (s.argument ? `(${s.argument})` : '');
          case 'attribute':
            return '[' + s.name + (s.argument ? `="${s.argument}"` : '') + ']';
          default:
            return s.name;
        }
      })
      .join('');
  }

  const combinatorMap: Record<CombinatorType, string> = {
    descendant: ' ',
    child: ' > ',
    adjacent: ' + ',
    sibling: ' ~ ',
  };

  return (
    stringifySelector(selector.left) +
    combinatorMap[selector.combinator] +
    stringifySelector(selector.right)
  );
}

/**
 * Stringify value for debugging
 */
export function stringifyValue(value: Value): string {
  switch (value.valueType) {
    case 'function':
      return value.value + '(' + (value.arguments?.map(stringifyValue).join(', ') ?? '') + ')';
    case 'dimension':
    case 'percentage':
      return value.value + (value.unit ?? '');
    case 'string':
      return `"${value.value}"`;
    default:
      return value.value;
  }
}
