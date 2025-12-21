/**
 * Styling module exports
 *
 * TCSS (Terminal CSS) - A CSS-like styling system for TUI applications.
 */

// Tokenizer
export {
  TokenType,
  Tokenizer,
  tokenize,
  tokenizeWithErrors,
} from './tokenizer.js';

export type {
  Token,
  TokenizerError,
  TokenizerOptions,
} from './tokenizer.js';

// Parser
export {
  Parser,
  parse,
  parseStrict,
  visitAST,
  stringifySelector,
  stringifyValue,
} from './parser.js';

export type {
  ASTNode,
  SelectorType,
  CombinatorType,
  SimpleSelector,
  CompoundSelector,
  ComplexSelector,
  SelectorList,
  Value,
  Declaration,
  Rule,
  VariableDefinition,
  ImportRule,
  MediaCondition,
  MediaRule,
  Stylesheet,
  ParserError,
  ParseResult,
  ParserOptions,
} from './parser.js';

// Resolver
export {
  // Specificity
  calculateSpecificity,
  compareSpecificity,
  specificityToNumber,
  specificityToString,
  getSpecificity,
  // Matching
  matchSelector,
  // Inheritance
  isInheritable,
  // Value utilities
  valueToString,
  // StyleSheet
  StyleSheet,
  createStyleSheet,
  // Style application
  resolvedStylesToProps,
  applyStyles,
} from './resolver.js';

export type {
  Specificity,
  MatchElement,
  ResolvedValue,
  ResolvedStyles,
  VariableScope,
  MatchedRule,
  StyleSheetOptions,
  MediaContext,
  BoxStyleProps,
  TextStyleProps,
  StyleProps,
} from './resolver.js';
