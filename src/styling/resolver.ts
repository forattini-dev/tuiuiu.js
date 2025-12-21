/**
 * TCSS Style Resolution
 *
 * Implements CSS-like specificity, cascade, inheritance, and variable resolution.
 */

import {
  parse,
  type Stylesheet,
  type Rule,
  type Declaration,
  type Value,
  type VariableDefinition,
  type MediaRule,
  type ImportRule,
  type SelectorList,
  type CompoundSelector,
  type ComplexSelector,
  type SimpleSelector,
} from './parser.js';

// =============================================================================
// Specificity
// =============================================================================

/**
 * Specificity as [ids, classes, types]
 * Similar to CSS specificity [a, b, c]
 */
export type Specificity = [number, number, number];

/**
 * Calculate specificity for a simple selector
 */
function simpleSpecificity(selector: SimpleSelector): Specificity {
  switch (selector.selectorType) {
    case 'id':
      return [1, 0, 0];
    case 'class':
    case 'pseudo-class':
    case 'attribute':
      return [0, 1, 0];
    case 'type':
    case 'pseudo-element':
      return [0, 0, 1];
    case 'universal':
      return [0, 0, 0];
    default:
      return [0, 0, 0];
  }
}

/**
 * Add two specificities
 */
function addSpecificity(a: Specificity, b: Specificity): Specificity {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/**
 * Calculate specificity for a compound selector
 */
function compoundSpecificity(selector: CompoundSelector): Specificity {
  return selector.selectors.reduce(
    (acc, s) => addSpecificity(acc, simpleSpecificity(s)),
    [0, 0, 0] as Specificity
  );
}

/**
 * Calculate specificity for a complex selector
 */
function complexSpecificity(selector: ComplexSelector | CompoundSelector): Specificity {
  if (selector.type === 'compound-selector') {
    return compoundSpecificity(selector);
  }

  // For complex selectors, add specificity of left and right
  const leftSpec = complexSpecificity(selector.left);
  const rightSpec = compoundSpecificity(selector.right);
  return addSpecificity(leftSpec, rightSpec);
}

/**
 * Calculate specificity for a selector list (uses maximum specificity)
 */
export function calculateSpecificity(selectorList: SelectorList): Specificity {
  let max: Specificity = [0, 0, 0];

  for (const selector of selectorList.selectors) {
    const spec = complexSpecificity(selector);
    if (compareSpecificity(spec, max) > 0) {
      max = spec;
    }
  }

  return max;
}

/**
 * Compare two specificities
 * Returns: positive if a > b, negative if a < b, 0 if equal
 */
export function compareSpecificity(a: Specificity, b: Specificity): number {
  // Compare id count
  if (a[0] !== b[0]) return a[0] - b[0];
  // Compare class count
  if (a[1] !== b[1]) return a[1] - b[1];
  // Compare type count
  return a[2] - b[2];
}

/**
 * Convert specificity to a comparable number
 */
export function specificityToNumber(spec: Specificity): number {
  // Use base 100 (assuming no more than 99 of each)
  return spec[0] * 10000 + spec[1] * 100 + spec[2];
}

/**
 * Parse specificity from string (for debugging)
 */
export function specificityToString(spec: Specificity): string {
  return `(${spec[0]}, ${spec[1]}, ${spec[2]})`;
}

// =============================================================================
// Selector Matching
// =============================================================================

/**
 * Element to match against selectors
 */
export interface MatchElement {
  /** Element type (e.g., 'Box', 'Text') */
  type: string;
  /** Element classes */
  classes?: string[];
  /** Element ID */
  id?: string;
  /** Pseudo-classes like :focus, :hover */
  pseudoClasses?: string[];
  /** Attributes */
  attributes?: Record<string, string>;
  /** Parent element */
  parent?: MatchElement;
  /** Previous sibling */
  previousSibling?: MatchElement;
}

/**
 * Check if a simple selector matches an element
 */
function matchSimpleSelector(selector: SimpleSelector, element: MatchElement): boolean {
  switch (selector.selectorType) {
    case 'type':
      return element.type === selector.name;

    case 'class':
      return element.classes?.includes(selector.name) ?? false;

    case 'id':
      return element.id === selector.name;

    case 'universal':
      return true;

    case 'pseudo-class': {
      // Handle :not() specially
      if (selector.name === 'not' && selector.argument) {
        // Simple implementation: check if argument matches any class
        return !(element.classes?.some(c => selector.argument?.includes(c)) ?? false);
      }
      return element.pseudoClasses?.includes(selector.name) ?? false;
    }

    case 'pseudo-element':
      // Pseudo-elements don't really match elements, they're synthetic
      return false;

    case 'attribute': {
      if (!element.attributes) return false;
      const value = element.attributes[selector.name];
      if (value === undefined) return false;
      if (selector.argument === undefined) return true;
      return value === selector.argument;
    }

    default:
      return false;
  }
}

/**
 * Check if a compound selector matches an element
 */
function matchCompoundSelector(selector: CompoundSelector, element: MatchElement): boolean {
  return selector.selectors.every(s => matchSimpleSelector(s, element));
}

/**
 * Check if a complex selector matches an element
 */
function matchComplexSelector(
  selector: ComplexSelector | CompoundSelector,
  element: MatchElement
): boolean {
  if (selector.type === 'compound-selector') {
    return matchCompoundSelector(selector, element);
  }

  // For complex selectors, check right part against current element
  if (!matchCompoundSelector(selector.right, element)) {
    return false;
  }

  // Check left part based on combinator
  switch (selector.combinator) {
    case 'descendant': {
      // Any ancestor must match
      let ancestor = element.parent;
      while (ancestor) {
        if (matchComplexSelector(selector.left, ancestor)) {
          return true;
        }
        ancestor = ancestor.parent;
      }
      return false;
    }

    case 'child':
      // Direct parent must match
      return element.parent ? matchComplexSelector(selector.left, element.parent) : false;

    case 'adjacent':
      // Immediate previous sibling must match
      return element.previousSibling
        ? matchComplexSelector(selector.left, element.previousSibling)
        : false;

    case 'sibling': {
      // Any previous sibling must match
      let sibling = element.previousSibling;
      while (sibling) {
        if (matchComplexSelector(selector.left, sibling)) {
          return true;
        }
        sibling = sibling.previousSibling;
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Check if a selector list matches an element
 */
export function matchSelector(selectorList: SelectorList, element: MatchElement): boolean {
  return selectorList.selectors.some(s => matchComplexSelector(s, element));
}

// =============================================================================
// Resolved Styles
// =============================================================================

/**
 * Resolved style value (after variable resolution)
 */
export interface ResolvedValue {
  value: string;
  unit?: string;
  important: boolean;
}

/**
 * Map of property names to resolved values
 */
export type ResolvedStyles = Map<string, ResolvedValue>;

/**
 * Properties that can be inherited
 */
const INHERITABLE_PROPERTIES = new Set([
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'text-align',
  'text-decoration',
  'text-transform',
  'letter-spacing',
  'word-spacing',
  'white-space',
  'visibility',
  'cursor',
  'direction',
  // TCSS-specific
  'bold',
  'italic',
  'underline',
  'dim',
  'strikethrough',
]);

/**
 * Check if a property is inheritable
 */
export function isInheritable(property: string): boolean {
  return INHERITABLE_PROPERTIES.has(property);
}

// =============================================================================
// Variable Resolution
// =============================================================================

/**
 * Variable scope for resolution
 */
export type VariableScope = Map<string, Value[]>;

/**
 * Resolve a value, substituting variables
 */
function resolveValue(value: Value, scope: VariableScope): Value {
  if (value.valueType === 'variable') {
    const resolved = scope.get(value.value);
    if (resolved && resolved.length > 0) {
      // Return first value, recursively resolve
      return resolveValue(resolved[0], scope);
    }
    // Variable not found, return as-is (will be handled as error or fallback)
    return value;
  }

  // For function values, resolve arguments
  if (value.valueType === 'function' && value.arguments) {
    return {
      ...value,
      arguments: value.arguments.map(arg => resolveValue(arg, scope)),
    };
  }

  return value;
}

/**
 * Convert a Value to a string representation
 */
export function valueToString(value: Value): string {
  switch (value.valueType) {
    case 'function':
      return `${value.value}(${value.arguments?.map(valueToString).join(', ') ?? ''})`;
    case 'dimension':
    case 'percentage':
      return value.value + (value.unit ?? '');
    case 'string':
      return value.value;
    default:
      return value.value;
  }
}

// =============================================================================
// Matched Rule
// =============================================================================

/**
 * A rule that matched an element, with its specificity
 */
export interface MatchedRule {
  rule: Rule;
  specificity: Specificity;
  order: number;
}

// =============================================================================
// StyleSheet Class
// =============================================================================

/**
 * Options for creating a StyleSheet
 */
export interface StyleSheetOptions {
  /** Name for debugging */
  name?: string;
  /** Base path for @import resolution */
  basePath?: string;
  /** Parent stylesheet (for imported sheets) */
  parent?: StyleSheet;
}

/**
 * Media query context for conditional rules
 */
export interface MediaContext {
  /** Terminal width in columns */
  width?: number;
  /** Terminal height in rows */
  height?: number;
  /** Color scheme: 'light' or 'dark' */
  colorScheme?: 'light' | 'dark';
  /** True color support */
  trueColor?: boolean;
}

/**
 * Manages a parsed stylesheet with caching and resolution
 */
export class StyleSheet {
  private ast: Stylesheet;
  private variables: VariableScope = new Map();
  private rules: Rule[] = [];
  private mediaRules: MediaRule[] = [];
  private imports: ImportRule[] = [];
  private options: StyleSheetOptions;
  private ruleOrder: number = 0;

  constructor(source: string, options: StyleSheetOptions = {}) {
    this.options = options;
    const { ast, errors } = parse(source);

    if (errors.length > 0 && options.parent === undefined) {
      console.warn(`TCSS parse errors in ${options.name ?? 'stylesheet'}:`, errors);
    }

    this.ast = ast;
    this.processAST();
  }

  private processAST(): void {
    for (const node of this.ast.rules) {
      switch (node.type) {
        case 'variable-definition':
          this.variables.set(node.name, node.values);
          break;

        case 'rule':
          this.rules.push(node);
          break;

        case 'media':
          this.mediaRules.push(node);
          break;

        case 'import':
          this.imports.push(node);
          break;
      }
    }
  }

  /**
   * Get all matching rules for an element
   */
  getMatchingRules(element: MatchElement, mediaContext?: MediaContext): MatchedRule[] {
    const matched: MatchedRule[] = [];

    // Regular rules
    for (const rule of this.rules) {
      if (matchSelector(rule.selectors, element)) {
        matched.push({
          rule,
          specificity: calculateSpecificity(rule.selectors),
          order: this.ruleOrder++,
        });
      }
    }

    // Media rules (if context provided)
    if (mediaContext) {
      for (const media of this.mediaRules) {
        if (this.matchMediaConditions(media, mediaContext)) {
          for (const rule of media.rules) {
            if (rule.type === 'rule' && matchSelector(rule.selectors, element)) {
              matched.push({
                rule,
                specificity: calculateSpecificity(rule.selectors),
                order: this.ruleOrder++,
              });
            }
          }
        }
      }
    }

    return matched;
  }

  private matchMediaConditions(media: MediaRule, context: MediaContext): boolean {
    for (const condition of media.conditions) {
      if (!this.matchMediaCondition(condition.feature, condition.value, context)) {
        return false;
      }
    }
    return true;
  }

  private matchMediaCondition(
    feature: string,
    value: Value | undefined,
    context: MediaContext
  ): boolean {
    switch (feature) {
      case 'min-width':
        if (context.width === undefined || !value) return false;
        return context.width >= parseFloat(value.value);

      case 'max-width':
        if (context.width === undefined || !value) return false;
        return context.width <= parseFloat(value.value);

      case 'min-height':
        if (context.height === undefined || !value) return false;
        return context.height >= parseFloat(value.value);

      case 'max-height':
        if (context.height === undefined || !value) return false;
        return context.height <= parseFloat(value.value);

      case 'color-scheme':
        if (context.colorScheme === undefined || !value) return false;
        return context.colorScheme === value.value;

      case 'true-color':
        return context.trueColor ?? false;

      default:
        return true; // Unknown features pass by default
    }
  }

  /**
   * Resolve styles for an element
   */
  resolveStyles(
    element: MatchElement,
    inheritedStyles?: ResolvedStyles,
    mediaContext?: MediaContext
  ): ResolvedStyles {
    const styles = new Map<string, ResolvedValue>();

    // Apply inherited styles first (for inheritable properties)
    if (inheritedStyles) {
      for (const [prop, value] of inheritedStyles) {
        if (isInheritable(prop)) {
          styles.set(prop, value);
        }
      }
    }

    // Get matching rules and sort by specificity/order (cascade)
    const matchedRules = this.getMatchingRules(element, mediaContext);
    matchedRules.sort((a, b) => {
      const specComp = compareSpecificity(a.specificity, b.specificity);
      if (specComp !== 0) return specComp;
      return a.order - b.order;
    });

    // Build combined variable scope
    const scope = new Map(this.variables);

    // Add variables from media rules if applicable
    if (mediaContext) {
      for (const media of this.mediaRules) {
        if (this.matchMediaConditions(media, mediaContext)) {
          for (const rule of media.rules) {
            if (rule.type === 'variable-definition') {
              scope.set(rule.name, rule.values);
            }
          }
        }
      }
    }

    // Apply declarations in cascade order
    for (const { rule } of matchedRules) {
      for (const decl of rule.declarations) {
        const existing = styles.get(decl.property);

        // !important always wins, otherwise later declarations win
        if (existing?.important && !decl.important) {
          continue;
        }

        // Resolve values with variables
        const resolvedValues = decl.values.map(v => resolveValue(v, scope));

        // Convert to string
        const valueStr = resolvedValues.map(valueToString).join(' ');

        styles.set(decl.property, {
          value: valueStr,
          unit: resolvedValues[0]?.unit,
          important: decl.important,
        });
      }
    }

    return styles;
  }

  /**
   * Get the variable scope
   */
  getVariables(): VariableScope {
    return this.variables;
  }

  /**
   * Set a variable value
   */
  setVariable(name: string, values: Value[]): void {
    this.variables.set(name, values);
  }

  /**
   * Get all rules
   */
  getRules(): Rule[] {
    return this.rules;
  }

  /**
   * Get imports
   */
  getImports(): ImportRule[] {
    return this.imports;
  }
}

// =============================================================================
// Style Application
// =============================================================================

/**
 * Style properties that map to VNode BoxStyle
 */
export interface BoxStyleProps {
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: number;
  borderStyle?:
    | 'single'
    | 'double'
    | 'round'
    | 'bold'
    | 'singleDouble'
    | 'doubleSingle'
    | 'classic'
    | 'arrow'
    | 'none';
  borderColor?: string;
  borderTopColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  borderRightColor?: string;
}

/**
 * Style properties that map to VNode TextStyle
 */
export interface TextStyleProps {
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  dim?: boolean;
  inverse?: boolean;
}

/**
 * Combined style props
 */
export interface StyleProps extends BoxStyleProps, TextStyleProps {}

/**
 * Convert resolved styles to style props
 */
export function resolvedStylesToProps(styles: ResolvedStyles): StyleProps {
  const props: StyleProps = {};

  for (const [property, { value }] of styles) {
    switch (property) {
      // Padding
      case 'padding':
        props.padding = parseNumberValue(value);
        break;
      case 'padding-top':
        props.paddingTop = parseNumberValue(value);
        break;
      case 'padding-bottom':
        props.paddingBottom = parseNumberValue(value);
        break;
      case 'padding-left':
        props.paddingLeft = parseNumberValue(value);
        break;
      case 'padding-right':
        props.paddingRight = parseNumberValue(value);
        break;

      // Margin
      case 'margin':
        props.margin = parseNumberValue(value);
        break;
      case 'margin-top':
        props.marginTop = parseNumberValue(value);
        break;
      case 'margin-bottom':
        props.marginBottom = parseNumberValue(value);
        break;
      case 'margin-left':
        props.marginLeft = parseNumberValue(value);
        break;
      case 'margin-right':
        props.marginRight = parseNumberValue(value);
        break;

      // Dimensions
      case 'width':
        props.width = parseDimensionValue(value);
        break;
      case 'height':
        props.height = parseDimensionValue(value);
        break;
      case 'min-width':
        props.minWidth = parseNumberValue(value);
        break;
      case 'min-height':
        props.minHeight = parseNumberValue(value);
        break;
      case 'max-width':
        props.maxWidth = parseNumberValue(value);
        break;
      case 'max-height':
        props.maxHeight = parseNumberValue(value);
        break;

      // Flexbox
      case 'flex-direction':
        props.flexDirection = value as BoxStyleProps['flexDirection'];
        break;
      case 'justify-content':
        props.justifyContent = value as BoxStyleProps['justifyContent'];
        break;
      case 'align-items':
        props.alignItems = value as BoxStyleProps['alignItems'];
        break;
      case 'flex-grow':
        props.flexGrow = parseNumberValue(value);
        break;
      case 'flex-shrink':
        props.flexShrink = parseNumberValue(value);
        break;
      case 'flex-basis':
        props.flexBasis = parseDimensionValue(value);
        break;
      case 'flex-wrap':
        props.flexWrap = value as BoxStyleProps['flexWrap'];
        break;
      case 'gap':
        props.gap = parseNumberValue(value);
        break;

      // Border
      case 'border-style':
        props.borderStyle = value as BoxStyleProps['borderStyle'];
        break;
      case 'border-color':
        props.borderColor = value;
        break;
      case 'border-top-color':
        props.borderTopColor = value;
        break;
      case 'border-bottom-color':
        props.borderBottomColor = value;
        break;
      case 'border-left-color':
        props.borderLeftColor = value;
        break;
      case 'border-right-color':
        props.borderRightColor = value;
        break;

      // Text
      case 'color':
        props.color = value;
        break;
      case 'background-color':
      case 'background':
        props.backgroundColor = value;
        break;
      case 'bold':
      case 'font-weight':
        props.bold = value === 'bold' || value === 'true' || value === '700';
        break;
      case 'italic':
      case 'font-style':
        props.italic = value === 'italic' || value === 'true';
        break;
      case 'underline':
      case 'text-decoration':
        props.underline = value === 'underline' || value === 'true';
        break;
      case 'strikethrough':
        props.strikethrough = value === 'true' || value === 'line-through';
        break;
      case 'dim':
        props.dim = value === 'true';
        break;
      case 'inverse':
        props.inverse = value === 'true';
        break;
    }
  }

  return props;
}

/**
 * Parse a number value (e.g., "10", "10px")
 */
function parseNumberValue(value: string): number | undefined {
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse a dimension value (number or percentage)
 */
function parseDimensionValue(value: string): number | string | undefined {
  if (value.endsWith('%')) {
    return value;
  }
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Create a stylesheet from source
 */
export function createStyleSheet(source: string, options?: StyleSheetOptions): StyleSheet {
  return new StyleSheet(source, options);
}

/**
 * Quick function to apply styles to an element
 */
export function applyStyles(
  source: string | StyleSheet,
  element: MatchElement,
  inheritedStyles?: ResolvedStyles,
  mediaContext?: MediaContext
): StyleProps {
  const sheet = typeof source === 'string' ? new StyleSheet(source) : source;
  const resolved = sheet.resolveStyles(element, inheritedStyles, mediaContext);
  return resolvedStylesToProps(resolved);
}

/**
 * Get the specificity of a selector string
 */
export function getSpecificity(selectorStr: string): Specificity {
  // Quick parse just the selector
  const { ast } = parse(`${selectorStr} {}`);
  if (ast.rules.length === 0) return [0, 0, 0];

  const rule = ast.rules[0];
  if (rule.type !== 'rule') return [0, 0, 0];

  return calculateSpecificity(rule.selectors);
}
