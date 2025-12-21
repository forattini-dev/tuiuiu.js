/**
 * Query API - CSS-like selector system for VNodes
 *
 * Features:
 * - Type selectors: Box, Text
 * - Class selectors: .primary
 * - ID selectors: #header
 * - Pseudo-classes: :focus, :first-child, :last-child
 * - Combinators: descendant (space), child (>)
 * - Multiple selectors: Box.primary, Text#title
 *
 * @example
 * // Query first matching element
 * const box = query(root, 'Box.primary');
 *
 * // Query all matching elements
 * const texts = queryAll(root, 'Text');
 *
 * // Complex selector
 * const items = queryAll(root, 'Box#container > Box.item:first-child');
 */

import type { VNode } from '../utils/types.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Parsed selector part
 */
interface SelectorPart {
  type?: string;           // Element type (Box, Text, etc.)
  id?: string;             // ID selector (#id)
  classes: string[];       // Class selectors (.class)
  pseudoClasses: string[]; // Pseudo-classes (:focus, :first-child)
  attributes: AttributeMatcher[]; // Attribute selectors [attr=value]
}

/**
 * Attribute matcher
 */
interface AttributeMatcher {
  name: string;
  operator?: '=' | '~=' | '|=' | '^=' | '$=' | '*=';
  value?: string;
}

/**
 * Combinator between selector parts
 */
type Combinator = 'descendant' | 'child' | 'adjacent' | 'sibling';

/**
 * Full parsed selector
 */
interface ParsedSelector {
  parts: SelectorPart[];
  combinators: Combinator[];
}

/**
 * Query options
 */
export interface QueryOptions {
  /** Include text nodes in results */
  includeText?: boolean;
  /** Debug mode - log matches */
  debug?: boolean;
}

/**
 * Query result with metadata
 */
export interface QueryResult {
  node: VNode;
  path: number[];     // Index path to this node
  parent?: VNode;     // Parent node
  index: number;      // Index in parent
  depth: number;      // Nesting depth
}

// =============================================================================
// Selector Parser
// =============================================================================

/**
 * Tokenize a selector string
 */
function tokenizeSelector(selector: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inBracket = false;
  let inQuote: string | null = null;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i]!;

    // Handle quotes
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = char;
      current += char;
      continue;
    }
    if (char === inQuote) {
      inQuote = null;
      current += char;
      continue;
    }
    if (inQuote) {
      current += char;
      continue;
    }

    // Handle attribute brackets
    if (char === '[') {
      inBracket = true;
      current += char;
      continue;
    }
    if (char === ']') {
      inBracket = false;
      current += char;
      continue;
    }
    if (inBracket) {
      current += char;
      continue;
    }

    // Handle combinators
    if (char === ' ' || char === '>' || char === '+' || char === '~') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      // Skip whitespace before combinators
      if (char !== ' ' || tokens.length === 0 || tokens[tokens.length - 1] === ' ') {
        if (char !== ' ' || (selector[i + 1] && selector[i + 1] !== ' ')) {
          tokens.push(char);
        }
      } else if (char === ' ') {
        // Check if this is just whitespace before a combinator
        let j = i + 1;
        while (j < selector.length && selector[j] === ' ') j++;
        if (j < selector.length && ['>', '+', '~'].includes(selector[j]!)) {
          // Skip this space, the combinator follows
          continue;
        }
        // Also skip whitespace after a combinator
        if (tokens.length > 0 && ['>', '+', '~'].includes(tokens[tokens.length - 1]!)) {
          continue;
        }
        tokens.push(' ');
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  // Clean up whitespace tokens
  return tokens.filter((t, i, arr) => {
    if (t !== ' ') return true;
    // Remove leading/trailing spaces
    if (i === 0 || i === arr.length - 1) return false;
    // Remove duplicate spaces
    if (arr[i - 1] === ' ') return false;
    return true;
  });
}

/**
 * Parse a single selector part (e.g., "Box.primary#header:focus")
 */
function parseSelectorPart(part: string): SelectorPart {
  const result: SelectorPart = {
    classes: [],
    pseudoClasses: [],
    attributes: [],
  };

  // Extract attributes first [attr=value]
  const attrRegex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(part)) !== null) {
    const attrContent = match[1]!;
    const operatorMatch = attrContent.match(/([~|^$*]?=)/);

    if (operatorMatch) {
      const [name, value] = attrContent.split(operatorMatch[0]);
      result.attributes.push({
        name: name!.trim(),
        operator: operatorMatch[0] as AttributeMatcher['operator'],
        value: value?.replace(/^["']|["']$/g, ''),
      });
    } else {
      result.attributes.push({ name: attrContent.trim() });
    }
  }
  part = part.replace(attrRegex, '');

  // Extract pseudo-classes :focus, :first-child
  const pseudoRegex = /:([a-zA-Z-]+)(?:\([^)]*\))?/g;
  while ((match = pseudoRegex.exec(part)) !== null) {
    result.pseudoClasses.push(match[1]!);
  }
  part = part.replace(pseudoRegex, '');

  // Extract ID #header
  const idMatch = part.match(/#([a-zA-Z_-][a-zA-Z0-9_-]*)/);
  if (idMatch) {
    result.id = idMatch[1];
    part = part.replace(/#[a-zA-Z_-][a-zA-Z0-9_-]*/, '');
  }

  // Extract classes .primary.secondary
  const classRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  while ((match = classRegex.exec(part)) !== null) {
    result.classes.push(match[1]!);
  }
  part = part.replace(/\.[a-zA-Z_-][a-zA-Z0-9_-]*/g, '');

  // Remaining is the type selector
  const type = part.trim();
  if (type && type !== '*') {
    result.type = type.toLowerCase();
  }

  return result;
}

/**
 * Parse a full selector string
 */
function parseSelector(selector: string): ParsedSelector {
  const tokens = tokenizeSelector(selector.trim());
  const parts: SelectorPart[] = [];
  const combinators: Combinator[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;

    if (token === ' ') {
      combinators.push('descendant');
    } else if (token === '>') {
      combinators.push('child');
    } else if (token === '+') {
      combinators.push('adjacent');
    } else if (token === '~') {
      combinators.push('sibling');
    } else {
      parts.push(parseSelectorPart(token));
    }
  }

  return { parts, combinators };
}

// =============================================================================
// Matcher Functions
// =============================================================================

/**
 * Get the classes from a VNode
 */
function getNodeClasses(node: VNode): string[] {
  const className = node.props.className || node.props.class || '';
  if (typeof className === 'string') {
    return className.split(/\s+/).filter(Boolean);
  }
  if (Array.isArray(className)) {
    return className.filter(Boolean);
  }
  return [];
}

/**
 * Check if a node matches a selector part
 */
function matchesSelectorPart(
  node: VNode,
  part: SelectorPart,
  context: { index: number; siblings: VNode[]; focused?: VNode }
): boolean {
  // Type selector
  if (part.type && node.type.toLowerCase() !== part.type) {
    return false;
  }

  // ID selector
  if (part.id && node.props.id !== part.id) {
    return false;
  }

  // Class selectors
  const nodeClasses = getNodeClasses(node);
  for (const cls of part.classes) {
    if (!nodeClasses.includes(cls)) {
      return false;
    }
  }

  // Attribute selectors
  for (const attr of part.attributes) {
    const value = node.props[attr.name];
    if (value === undefined) {
      return false;
    }
    if (attr.value !== undefined) {
      const strValue = String(value);
      switch (attr.operator) {
        case '=':
          if (strValue !== attr.value) return false;
          break;
        case '~=':
          if (!strValue.split(/\s+/).includes(attr.value)) return false;
          break;
        case '|=':
          if (strValue !== attr.value && !strValue.startsWith(attr.value + '-')) return false;
          break;
        case '^=':
          if (!strValue.startsWith(attr.value)) return false;
          break;
        case '$=':
          if (!strValue.endsWith(attr.value)) return false;
          break;
        case '*=':
          if (!strValue.includes(attr.value)) return false;
          break;
      }
    }
  }

  // Pseudo-class selectors
  for (const pseudo of part.pseudoClasses) {
    switch (pseudo) {
      case 'first-child':
        if (context.index !== 0) return false;
        break;
      case 'last-child':
        if (context.index !== context.siblings.length - 1) return false;
        break;
      case 'only-child':
        if (context.siblings.length !== 1) return false;
        break;
      case 'nth-child':
        // TODO: Implement nth-child(n) parsing
        break;
      case 'focus':
        if (context.focused !== node) return false;
        break;
      case 'disabled':
        if (!node.props.disabled) return false;
        break;
      case 'enabled':
        if (node.props.disabled) return false;
        break;
      case 'checked':
        if (!node.props.checked) return false;
        break;
      case 'empty':
        if (node.children.length > 0) return false;
        break;
      case 'not-empty':
        if (node.children.length === 0) return false;
        break;
    }
  }

  return true;
}

// =============================================================================
// Query Implementation
// =============================================================================

/**
 * Find all nodes matching the first selector part
 */
function findInitialMatches(
  root: VNode,
  part: SelectorPart,
  options: QueryOptions
): QueryResult[] {
  const results: QueryResult[] = [];

  function traverse(node: VNode, path: number[], parent?: VNode, index = 0, depth = 0): void {
    const context = {
      index,
      siblings: parent?.children || [node],
    };

    if (matchesSelectorPart(node, part, context)) {
      results.push({ node, path: [...path], parent, index, depth });
    }

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]!;
      traverse(child, [...path, i], node, i, depth + 1);
    }
  }

  traverse(root, [], undefined, 0, 0);
  return results;
}

/**
 * Filter results based on combinator and next part
 */
function applyCombinator(
  results: QueryResult[],
  combinator: Combinator,
  nextPart: SelectorPart,
  _options: QueryOptions
): QueryResult[] {
  const filtered: QueryResult[] = [];

  for (const result of results) {
    const { node } = result;

    switch (combinator) {
      case 'descendant':
        // Find any descendant matching nextPart
        function findDescendants(current: VNode, path: number[], parentNode: VNode | undefined, idx: number, depth: number): void {
          for (let i = 0; i < current.children.length; i++) {
            const child = current.children[i];
            if (!child) continue;

            const childPath = [...path, i];
            const context = {
              index: i,
              siblings: current.children,
            };

            if (matchesSelectorPart(child, nextPart, context)) {
              filtered.push({
                node: child,
                path: childPath,
                parent: current,
                index: i,
                depth: depth + 1,
              });
            }

            findDescendants(child, childPath, current, i, depth + 1);
          }
        }
        findDescendants(node, result.path, result.parent, result.index, result.depth);
        break;

      case 'child':
        // Find direct children matching nextPart
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (!child) continue;

          const context = {
            index: i,
            siblings: node.children,
          };

          if (matchesSelectorPart(child, nextPart, context)) {
            filtered.push({
              node: child,
              path: [...result.path, i],
              parent: node,
              index: i,
              depth: result.depth + 1,
            });
          }
        }
        break;

      case 'adjacent':
        // Find next sibling matching nextPart
        if (result.parent) {
          const nextIndex = result.index + 1;
          if (nextIndex < result.parent.children.length) {
            const sibling = result.parent.children[nextIndex]!;
            const context = {
              index: nextIndex,
              siblings: result.parent.children,
            };

            if (matchesSelectorPart(sibling, nextPart, context)) {
              const newPath = [...result.path];
              newPath[newPath.length - 1] = nextIndex;
              filtered.push({
                node: sibling,
                path: newPath,
                parent: result.parent,
                index: nextIndex,
                depth: result.depth,
              });
            }
          }
        }
        break;

      case 'sibling':
        // Find any following sibling matching nextPart
        if (result.parent) {
          for (let i = result.index + 1; i < result.parent.children.length; i++) {
            const sibling = result.parent.children[i]!;
            const context = {
              index: i,
              siblings: result.parent.children,
            };

            if (matchesSelectorPart(sibling, nextPart, context)) {
              const newPath = [...result.path];
              newPath[newPath.length - 1] = i;
              filtered.push({
                node: sibling,
                path: newPath,
                parent: result.parent,
                index: i,
                depth: result.depth,
              });
            }
          }
        }
        break;
    }
  }

  return filtered;
}

/**
 * Execute a parsed selector against a VNode tree
 */
function executeSelector(
  root: VNode,
  selector: ParsedSelector,
  options: QueryOptions
): QueryResult[] {
  if (selector.parts.length === 0) {
    return [];
  }

  // Find initial matches for first part
  let results = findInitialMatches(root, selector.parts[0]!, options);

  // Apply combinators and remaining parts
  for (let i = 0; i < selector.combinators.length; i++) {
    const combinator = selector.combinators[i]!;
    const nextPart = selector.parts[i + 1]!;
    results = applyCombinator(results, combinator, nextPart, options);
  }

  return results;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Query the first matching VNode
 *
 * @example
 * const box = query(root, 'Box.primary');
 * const header = query(root, '#header');
 * const firstItem = query(root, 'Box > Text:first-child');
 */
export function query(root: VNode, selector: string, options: QueryOptions = {}): VNode | null {
  const parsed = parseSelector(selector);
  const results = executeSelector(root, parsed, options);

  if (options.debug && results.length > 0) {
    console.log(`[query] Found match for "${selector}":`, results[0]?.node);
  }

  return results.length > 0 ? results[0]!.node : null;
}

/**
 * Query all matching VNodes
 *
 * @example
 * const boxes = queryAll(root, 'Box');
 * const items = queryAll(root, '.item');
 */
export function queryAll(root: VNode, selector: string, options: QueryOptions = {}): VNode[] {
  const parsed = parseSelector(selector);
  const results = executeSelector(root, parsed, options);

  if (options.debug) {
    console.log(`[queryAll] Found ${results.length} matches for "${selector}"`);
  }

  return results.map(r => r.node);
}

/**
 * Query with full result metadata
 *
 * @example
 * const results = queryResults(root, 'Box.item');
 * results.forEach(r => {
 *   console.log(`Found at depth ${r.depth}, index ${r.index}`);
 * });
 */
export function queryResults(root: VNode, selector: string, options: QueryOptions = {}): QueryResult[] {
  const parsed = parseSelector(selector);
  return executeSelector(root, parsed, options);
}

/**
 * Check if a VNode matches a selector
 *
 * @example
 * if (matches(node, 'Box.primary:focus')) {
 *   // Node matches!
 * }
 */
export function matches(node: VNode, selector: string, context?: { index?: number; siblings?: VNode[] }): boolean {
  const parsed = parseSelector(selector);

  // For simple selectors (no combinators), just match the last part
  if (parsed.parts.length === 1 && parsed.combinators.length === 0) {
    const ctx = {
      index: context?.index ?? 0,
      siblings: context?.siblings ?? [node],
    };
    return matchesSelectorPart(node, parsed.parts[0]!, ctx);
  }

  // For complex selectors, we'd need the full tree context
  // For now, just match against the final part
  const lastPart = parsed.parts[parsed.parts.length - 1]!;
  const ctx = {
    index: context?.index ?? 0,
    siblings: context?.siblings ?? [node],
  };
  return matchesSelectorPart(node, lastPart, ctx);
}

/**
 * Get the closest ancestor matching a selector
 *
 * @example
 * const container = closest(node, 'Box.container');
 */
export function closest(
  node: VNode,
  selector: string,
  root: VNode
): VNode | null {
  // Build path to node
  const path: VNode[] = [];

  function findPath(current: VNode, target: VNode): boolean {
    if (current === target) {
      path.push(current);
      return true;
    }
    for (const child of current.children) {
      if (findPath(child, target)) {
        path.unshift(current);
        return true;
      }
    }
    return false;
  }

  if (!findPath(root, node)) {
    return null;
  }

  // Check each ancestor from closest to furthest
  const parsed = parseSelector(selector);
  for (let i = path.length - 2; i >= 0; i--) {
    const ancestor = path[i]!;
    const parent = i > 0 ? path[i - 1] : undefined;
    const siblings = parent?.children || [ancestor];
    const index = siblings.indexOf(ancestor);

    const ctx = { index, siblings };
    if (parsed.parts.length === 1 && matchesSelectorPart(ancestor, parsed.parts[0]!, ctx)) {
      return ancestor;
    }
  }

  return null;
}

/**
 * Find all VNodes by type
 *
 * @example
 * const allBoxes = findByType(root, 'box');
 */
export function findByType(root: VNode, type: string): VNode[] {
  return queryAll(root, type);
}

/**
 * Find all VNodes with a specific class
 *
 * @example
 * const items = findByClass(root, 'item');
 */
export function findByClass(root: VNode, className: string): VNode[] {
  return queryAll(root, `.${className}`);
}

/**
 * Find a VNode by ID
 *
 * @example
 * const header = findById(root, 'header');
 */
export function findById(root: VNode, id: string): VNode | null {
  return query(root, `#${id}`);
}

/**
 * Count nodes matching a selector
 *
 * @example
 * const count = countMatches(root, 'Box.item'); // 5
 */
export function countMatches(root: VNode, selector: string): number {
  return queryAll(root, selector).length;
}

/**
 * Check if any node matches a selector
 *
 * @example
 * if (hasMatch(root, '.error')) {
 *   // There's at least one error element
 * }
 */
export function hasMatch(root: VNode, selector: string): boolean {
  return query(root, selector) !== null;
}

// =============================================================================
// Exports
// =============================================================================

export type {
  SelectorPart,
  ParsedSelector,
  Combinator,
};
