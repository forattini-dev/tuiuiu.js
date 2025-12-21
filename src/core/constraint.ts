/**
 * Constraint-Based Layout System
 *
 * A simplified constraint solver for terminal UI layouts.
 * Provides an alternative to flexbox for complex layout relationships.
 *
 * Features:
 * - Expression-based constraints (==, <=, >=)
 * - Three priority levels (required, strong, weak)
 * - Common convenience constraints
 * - Efficient solving for typical UI patterns
 *
 * 
 */

// =============================================================================
// Types
// =============================================================================

/** Constraint priority levels */
export type ConstraintPriority = 'required' | 'strong' | 'weak';

/** Constraint operator */
export type ConstraintOperator = '==' | '<=' | '>=';

/** A constraint variable (represents a dimension) */
export interface ConstraintVariable {
  /** Unique identifier */
  id: string;
  /** Variable name (e.g., 'width', 'height', 'x', 'y') */
  name: string;
  /** Current value */
  value: number;
  /** Whether this variable is fixed (external) */
  isFixed: boolean;
}

/** A linear expression: coefficient * variable + constant */
export interface ConstraintTerm {
  /** The variable (null for constant term) */
  variable: ConstraintVariable | null;
  /** Coefficient multiplier */
  coefficient: number;
}

/** A linear expression composed of terms */
export interface ConstraintExpression {
  /** Terms in the expression */
  terms: ConstraintTerm[];
  /** Constant offset */
  constant: number;
}

/** A single constraint */
export interface Constraint {
  /** Unique identifier */
  id: string;
  /** Left side expression */
  left: ConstraintExpression;
  /** Operator */
  operator: ConstraintOperator;
  /** Right side expression */
  right: ConstraintExpression;
  /** Priority level */
  priority: ConstraintPriority;
  /** Whether constraint is active */
  isActive: boolean;
  /** Error margin for solving */
  strength: number;
}

/** Constraint solution result */
export interface ConstraintSolution {
  /** Variable values */
  values: Map<string, number>;
  /** Whether solution was found */
  isSatisfied: boolean;
  /** Unsatisfied constraints */
  unsatisfied: Constraint[];
  /** Iterations taken */
  iterations: number;
}

/** Layout element with constraint variables */
export interface ConstraintElement {
  /** Unique identifier */
  id: string;
  /** X position variable */
  x: ConstraintVariable;
  /** Y position variable */
  y: ConstraintVariable;
  /** Width variable */
  width: ConstraintVariable;
  /** Height variable */
  height: ConstraintVariable;
  /** Right edge (derived: x + width) */
  right: ConstraintExpression;
  /** Bottom edge (derived: y + height) */
  bottom: ConstraintExpression;
  /** Center X (derived: x + width/2) */
  centerX: ConstraintExpression;
  /** Center Y (derived: y + height/2) */
  centerY: ConstraintExpression;
}

// =============================================================================
// Variable Creation
// =============================================================================

let variableIdCounter = 0;

/**
 * Create a constraint variable
 */
export function createVariable(name: string, value = 0, isFixed = false): ConstraintVariable {
  return {
    id: `var_${variableIdCounter++}`,
    name,
    value,
    isFixed,
  };
}

// =============================================================================
// Expression Building
// =============================================================================

/**
 * Create an expression from a variable
 */
export function expr(variable: ConstraintVariable): ConstraintExpression {
  return {
    terms: [{ variable, coefficient: 1 }],
    constant: 0,
  };
}

/**
 * Create a constant expression
 */
export function constant(value: number): ConstraintExpression {
  return {
    terms: [],
    constant: value,
  };
}

/**
 * Add two expressions
 */
export function add(a: ConstraintExpression, b: ConstraintExpression): ConstraintExpression {
  return {
    terms: [...a.terms, ...b.terms],
    constant: a.constant + b.constant,
  };
}

/**
 * Subtract two expressions (a - b)
 */
export function subtract(a: ConstraintExpression, b: ConstraintExpression): ConstraintExpression {
  const negatedTerms = b.terms.map(t => ({
    variable: t.variable,
    coefficient: -t.coefficient,
  }));
  return {
    terms: [...a.terms, ...negatedTerms],
    constant: a.constant - b.constant,
  };
}

/**
 * Multiply expression by a constant
 */
export function multiply(expression: ConstraintExpression, factor: number): ConstraintExpression {
  return {
    terms: expression.terms.map(t => ({
      variable: t.variable,
      coefficient: t.coefficient * factor,
    })),
    constant: expression.constant * factor,
  };
}

/**
 * Divide expression by a constant
 */
export function divide(expression: ConstraintExpression, divisor: number): ConstraintExpression {
  if (divisor === 0) throw new Error('Division by zero');
  return multiply(expression, 1 / divisor);
}

/**
 * Add a constant to an expression
 */
export function addConstant(expression: ConstraintExpression, value: number): ConstraintExpression {
  return {
    terms: expression.terms,
    constant: expression.constant + value,
  };
}

// =============================================================================
// Constraint Creation
// =============================================================================

let constraintIdCounter = 0;

const priorityStrength: Record<ConstraintPriority, number> = {
  required: 1000000,
  strong: 1000,
  weak: 1,
};

/**
 * Create an equality constraint: left == right
 */
export function eq(
  left: ConstraintExpression | ConstraintVariable,
  right: ConstraintExpression | ConstraintVariable | number,
  priority: ConstraintPriority = 'required'
): Constraint {
  const leftExpr = 'id' in left && 'name' in left ? expr(left as ConstraintVariable) : left as ConstraintExpression;
  const rightExpr = typeof right === 'number'
    ? constant(right)
    : 'id' in right && 'name' in right
      ? expr(right as ConstraintVariable)
      : right as ConstraintExpression;

  return {
    id: `constraint_${constraintIdCounter++}`,
    left: leftExpr,
    operator: '==',
    right: rightExpr,
    priority,
    isActive: true,
    strength: priorityStrength[priority],
  };
}

/**
 * Create a less-than-or-equal constraint: left <= right
 */
export function lte(
  left: ConstraintExpression | ConstraintVariable,
  right: ConstraintExpression | ConstraintVariable | number,
  priority: ConstraintPriority = 'required'
): Constraint {
  const leftExpr = 'id' in left && 'name' in left ? expr(left as ConstraintVariable) : left as ConstraintExpression;
  const rightExpr = typeof right === 'number'
    ? constant(right)
    : 'id' in right && 'name' in right
      ? expr(right as ConstraintVariable)
      : right as ConstraintExpression;

  return {
    id: `constraint_${constraintIdCounter++}`,
    left: leftExpr,
    operator: '<=',
    right: rightExpr,
    priority,
    isActive: true,
    strength: priorityStrength[priority],
  };
}

/**
 * Create a greater-than-or-equal constraint: left >= right
 */
export function gte(
  left: ConstraintExpression | ConstraintVariable,
  right: ConstraintExpression | ConstraintVariable | number,
  priority: ConstraintPriority = 'required'
): Constraint {
  const leftExpr = 'id' in left && 'name' in left ? expr(left as ConstraintVariable) : left as ConstraintExpression;
  const rightExpr = typeof right === 'number'
    ? constant(right)
    : 'id' in right && 'name' in right
      ? expr(right as ConstraintVariable)
      : right as ConstraintExpression;

  return {
    id: `constraint_${constraintIdCounter++}`,
    left: leftExpr,
    operator: '>=',
    right: rightExpr,
    priority,
    isActive: true,
    strength: priorityStrength[priority],
  };
}

// =============================================================================
// Constraint Element
// =============================================================================

/**
 * Create a constraint element for layout
 */
export function createElement(id: string): ConstraintElement {
  const x = createVariable(`${id}.x`);
  const y = createVariable(`${id}.y`);
  const width = createVariable(`${id}.width`);
  const height = createVariable(`${id}.height`);

  return {
    id,
    x,
    y,
    width,
    height,
    // Derived expressions
    right: add(expr(x), expr(width)),
    bottom: add(expr(y), expr(height)),
    centerX: add(expr(x), divide(expr(width), 2)),
    centerY: add(expr(y), divide(expr(height), 2)),
  };
}

// =============================================================================
// Convenience Constraints
// =============================================================================

/**
 * Equal widths constraint
 */
export function equalWidths(elements: ConstraintElement[], priority: ConstraintPriority = 'required'): Constraint[] {
  if (elements.length < 2) return [];

  const constraints: Constraint[] = [];
  for (let i = 1; i < elements.length; i++) {
    constraints.push(eq(expr(elements[0].width), expr(elements[i].width), priority));
  }
  return constraints;
}

/**
 * Equal heights constraint
 */
export function equalHeights(elements: ConstraintElement[], priority: ConstraintPriority = 'required'): Constraint[] {
  if (elements.length < 2) return [];

  const constraints: Constraint[] = [];
  for (let i = 1; i < elements.length; i++) {
    constraints.push(eq(expr(elements[0].height), expr(elements[i].height), priority));
  }
  return constraints;
}

/**
 * Equal sizes (width and height) constraint
 */
export function equalSizes(elements: ConstraintElement[], priority: ConstraintPriority = 'required'): Constraint[] {
  return [...equalWidths(elements, priority), ...equalHeights(elements, priority)];
}

/**
 * Percentage width of parent
 */
export function percentWidth(element: ConstraintElement, parent: ConstraintElement, percent: number, priority: ConstraintPriority = 'required'): Constraint {
  return eq(expr(element.width), multiply(expr(parent.width), percent / 100), priority);
}

/**
 * Percentage height of parent
 */
export function percentHeight(element: ConstraintElement, parent: ConstraintElement, percent: number, priority: ConstraintPriority = 'required'): Constraint {
  return eq(expr(element.height), multiply(expr(parent.height), percent / 100), priority);
}

/**
 * Aspect ratio constraint
 */
export function aspectRatio(element: ConstraintElement, ratio: number, priority: ConstraintPriority = 'required'): Constraint {
  // width = height * ratio
  return eq(expr(element.width), multiply(expr(element.height), ratio), priority);
}

/**
 * Center horizontally in parent
 */
export function centerHorizontally(element: ConstraintElement, parent: ConstraintElement, priority: ConstraintPriority = 'required'): Constraint {
  return eq(element.centerX, parent.centerX, priority);
}

/**
 * Center vertically in parent
 */
export function centerVertically(element: ConstraintElement, parent: ConstraintElement, priority: ConstraintPriority = 'required'): Constraint {
  return eq(element.centerY, parent.centerY, priority);
}

/**
 * Center in parent
 */
export function center(element: ConstraintElement, parent: ConstraintElement, priority: ConstraintPriority = 'required'): Constraint[] {
  return [
    centerHorizontally(element, parent, priority),
    centerVertically(element, parent, priority),
  ];
}

/**
 * Pin to edges of parent
 */
export function pinToEdges(element: ConstraintElement, parent: ConstraintElement, padding = 0, priority: ConstraintPriority = 'required'): Constraint[] {
  return [
    eq(expr(element.x), addConstant(expr(parent.x), padding), priority),
    eq(expr(element.y), addConstant(expr(parent.y), padding), priority),
    eq(element.right, addConstant(parent.right, -padding), priority),
    eq(element.bottom, addConstant(parent.bottom, -padding), priority),
  ];
}

/**
 * Stack elements horizontally with gap
 */
export function stackHorizontally(elements: ConstraintElement[], gap = 0, priority: ConstraintPriority = 'required'): Constraint[] {
  if (elements.length < 2) return [];

  const constraints: Constraint[] = [];
  for (let i = 1; i < elements.length; i++) {
    constraints.push(eq(expr(elements[i].x), addConstant(elements[i - 1].right, gap), priority));
  }
  return constraints;
}

/**
 * Stack elements vertically with gap
 */
export function stackVertically(elements: ConstraintElement[], gap = 0, priority: ConstraintPriority = 'required'): Constraint[] {
  if (elements.length < 2) return [];

  const constraints: Constraint[] = [];
  for (let i = 1; i < elements.length; i++) {
    constraints.push(eq(expr(elements[i].y), addConstant(elements[i - 1].bottom, gap), priority));
  }
  return constraints;
}

/**
 * Align tops of elements
 */
export function alignTops(elements: ConstraintElement[], priority: ConstraintPriority = 'required'): Constraint[] {
  if (elements.length < 2) return [];

  const constraints: Constraint[] = [];
  for (let i = 1; i < elements.length; i++) {
    constraints.push(eq(expr(elements[i].y), expr(elements[0].y), priority));
  }
  return constraints;
}

/**
 * Align lefts of elements
 */
export function alignLefts(elements: ConstraintElement[], priority: ConstraintPriority = 'required'): Constraint[] {
  if (elements.length < 2) return [];

  const constraints: Constraint[] = [];
  for (let i = 1; i < elements.length; i++) {
    constraints.push(eq(expr(elements[i].x), expr(elements[0].x), priority));
  }
  return constraints;
}

/**
 * Distribute elements evenly horizontally
 */
export function distributeHorizontally(
  elements: ConstraintElement[],
  container: ConstraintElement,
  priority: ConstraintPriority = 'required'
): Constraint[] {
  if (elements.length < 1) return [];

  const constraints: Constraint[] = [];
  const n = elements.length;

  // Total width of elements
  let totalWidth: ConstraintExpression = constant(0);
  for (const el of elements) {
    totalWidth = add(totalWidth, expr(el.width));
  }

  // Available space = container.width - totalWidth
  // Gap = availableSpace / (n + 1)

  // For simplicity, set equal gaps between all elements
  // This is a simplified version - full implementation would need auxiliary variables
  if (n === 1) {
    constraints.push(centerHorizontally(elements[0], container, priority));
  } else {
    // First element at left edge
    constraints.push(eq(expr(elements[0].x), expr(container.x), priority));
    // Last element at right edge
    constraints.push(eq(elements[n - 1].right, container.right, priority));
    // Equal spacing between middle elements
    for (let i = 1; i < n - 1; i++) {
      // Position i at i/(n-1) of the available space
      const fraction = i / (n - 1);
      const startX = add(expr(container.x), multiply(subtract(container.right, expr(container.x)), fraction));
      constraints.push(eq(elements[i].centerX, startX, priority));
    }
  }

  return constraints;
}

// =============================================================================
// Constraint Solver
// =============================================================================

/**
 * Simple constraint solver using iterative relaxation
 *
 * This is a simplified solver suitable for typical UI layouts.
 * It handles most common cases efficiently but may not find solutions
 * for complex over-constrained systems.
 */
export class ConstraintSolver {
  private variables: Map<string, ConstraintVariable> = new Map();
  private constraints: Constraint[] = [];
  private maxIterations = 200;
  private tolerance = 0.01;

  /**
   * Add a variable to the solver
   */
  addVariable(variable: ConstraintVariable): void {
    this.variables.set(variable.id, variable);
  }

  /**
   * Add a constraint to the solver
   */
  addConstraint(constraint: Constraint): void {
    // Register all variables in the constraint
    for (const term of constraint.left.terms) {
      if (term.variable) {
        this.variables.set(term.variable.id, term.variable);
      }
    }
    for (const term of constraint.right.terms) {
      if (term.variable) {
        this.variables.set(term.variable.id, term.variable);
      }
    }
    this.constraints.push(constraint);
  }

  /**
   * Add multiple constraints
   */
  addConstraints(constraints: Constraint[]): void {
    for (const c of constraints) {
      this.addConstraint(c);
    }
  }

  /**
   * Remove a constraint
   */
  removeConstraint(constraintId: string): void {
    this.constraints = this.constraints.filter(c => c.id !== constraintId);
  }

  /**
   * Clear all constraints and variables
   */
  clear(): void {
    this.variables.clear();
    this.constraints = [];
  }

  /**
   * Evaluate an expression with current variable values
   */
  private evaluate(expression: ConstraintExpression): number {
    let value = expression.constant;
    for (const term of expression.terms) {
      if (term.variable) {
        value += term.coefficient * term.variable.value;
      }
    }
    return value;
  }

  /**
   * Calculate error for a constraint
   */
  private getError(constraint: Constraint): number {
    const leftValue = this.evaluate(constraint.left);
    const rightValue = this.evaluate(constraint.right);
    const diff = leftValue - rightValue;

    switch (constraint.operator) {
      case '==':
        return Math.abs(diff);
      case '<=':
        return diff > 0 ? diff : 0;
      case '>=':
        return diff < 0 ? -diff : 0;
    }
  }

  /**
   * Solve the constraint system
   */
  solve(): ConstraintSolution {
    // Sort constraints by priority (required first)
    const sortedConstraints = [...this.constraints]
      .filter(c => c.isActive)
      .sort((a, b) => b.strength - a.strength);

    let iterations = 0;
    let improved = true;

    while (improved && iterations < this.maxIterations) {
      improved = false;
      iterations++;

      for (const constraint of sortedConstraints) {
        const error = this.getError(constraint);
        if (error <= this.tolerance) continue;

        // Try to reduce the error by adjusting variables
        const adjusted = this.adjustForConstraint(constraint, error);
        if (adjusted) {
          improved = true;
        }
      }
    }

    // Collect results
    const values = new Map<string, number>();
    for (const [id, variable] of this.variables) {
      values.set(id, variable.value);
    }

    // Check for unsatisfied constraints
    const unsatisfied = sortedConstraints.filter(c => this.getError(c) > this.tolerance);

    return {
      values,
      isSatisfied: unsatisfied.length === 0,
      unsatisfied,
      iterations,
    };
  }

  /**
   * Adjust variables to satisfy a constraint
   */
  private adjustForConstraint(constraint: Constraint, error: number): boolean {
    // Find non-fixed variables in the constraint
    const adjustableTerms: ConstraintTerm[] = [];

    for (const term of constraint.left.terms) {
      if (term.variable && !term.variable.isFixed && term.coefficient !== 0) {
        adjustableTerms.push(term);
      }
    }
    for (const term of constraint.right.terms) {
      if (term.variable && !term.variable.isFixed && term.coefficient !== 0) {
        adjustableTerms.push({ ...term, coefficient: -term.coefficient });
      }
    }

    if (adjustableTerms.length === 0) return false;

    // Distribute the error across adjustable variables
    const leftValue = this.evaluate(constraint.left);
    const rightValue = this.evaluate(constraint.right);
    let diff = leftValue - rightValue;

    // Adjust based on operator
    if (constraint.operator === '<=') {
      if (diff <= 0) return false;
      diff = Math.min(diff, error);
    } else if (constraint.operator === '>=') {
      if (diff >= 0) return false;
      diff = -Math.min(-diff, error);
    }

    // Divide adjustment among variables (weighted by coefficient)
    const totalCoeff = adjustableTerms.reduce((sum, t) => sum + Math.abs(t.coefficient), 0);
    if (totalCoeff === 0) return false;

    // Use a higher adjustment factor for faster convergence
    // and a minimum threshold much smaller than tolerance
    const adjustmentFactor = 0.8;
    const minAdjustment = this.tolerance * 0.001;
    let madeAdjustment = false;

    for (const term of adjustableTerms) {
      const adjustment = (diff * Math.abs(term.coefficient) / totalCoeff) * adjustmentFactor;
      const signedAdjustment = term.coefficient > 0 ? -adjustment : adjustment;

      // Use a much smaller threshold to ensure we converge
      if (Math.abs(signedAdjustment) > minAdjustment) {
        term.variable!.value += signedAdjustment;
        madeAdjustment = true;
      }
    }

    return madeAdjustment;
  }

  /**
   * Set a variable to a fixed value
   */
  suggest(variable: ConstraintVariable, value: number): void {
    variable.value = value;
  }
}

// =============================================================================
// Constraint Layout Manager
// =============================================================================

export interface ConstraintLayoutOptions {
  /** Container width */
  width: number;
  /** Container height */
  height: number;
  /** Padding */
  padding?: number | { top: number; right: number; bottom: number; left: number };
}

/**
 * High-level layout manager using constraints
 */
export class ConstraintLayoutManager {
  private solver: ConstraintSolver;
  private elements: Map<string, ConstraintElement> = new Map();
  private container: ConstraintElement;

  constructor(options: ConstraintLayoutOptions) {
    this.solver = new ConstraintSolver();

    // Create container element with fixed dimensions
    this.container = createElement('__container__');
    this.container.x.isFixed = true;
    this.container.y.isFixed = true;
    this.container.width.isFixed = true;
    this.container.height.isFixed = true;

    // Set container values
    const padding = typeof options.padding === 'number'
      ? { top: options.padding, right: options.padding, bottom: options.padding, left: options.padding }
      : options.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };

    this.container.x.value = padding.left;
    this.container.y.value = padding.top;
    this.container.width.value = options.width - padding.left - padding.right;
    this.container.height.value = options.height - padding.top - padding.bottom;

    this.solver.addVariable(this.container.x);
    this.solver.addVariable(this.container.y);
    this.solver.addVariable(this.container.width);
    this.solver.addVariable(this.container.height);
  }

  /**
   * Get the container element
   */
  getContainer(): ConstraintElement {
    return this.container;
  }

  /**
   * Create and register an element
   */
  addElement(id: string): ConstraintElement {
    const element = createElement(id);
    this.elements.set(id, element);

    this.solver.addVariable(element.x);
    this.solver.addVariable(element.y);
    this.solver.addVariable(element.width);
    this.solver.addVariable(element.height);

    // Add basic constraints: x >= 0, y >= 0, width >= 0, height >= 0
    this.solver.addConstraint(gte(element.x, 0));
    this.solver.addConstraint(gte(element.y, 0));
    this.solver.addConstraint(gte(element.width, 0));
    this.solver.addConstraint(gte(element.height, 0));

    return element;
  }

  /**
   * Get an element by ID
   */
  getElement(id: string): ConstraintElement | undefined {
    return this.elements.get(id);
  }

  /**
   * Add a constraint
   */
  addConstraint(constraint: Constraint): void {
    this.solver.addConstraint(constraint);
  }

  /**
   * Add multiple constraints
   */
  addConstraints(constraints: Constraint[]): void {
    this.solver.addConstraints(constraints);
  }

  /**
   * Solve the layout
   */
  solve(): Map<string, { x: number; y: number; width: number; height: number }> {
    const solution = this.solver.solve();
    const layouts = new Map<string, { x: number; y: number; width: number; height: number }>();

    for (const [id, element] of this.elements) {
      layouts.set(id, {
        x: Math.round(element.x.value),
        y: Math.round(element.y.value),
        width: Math.round(element.width.value),
        height: Math.round(element.height.value),
      });
    }

    return layouts;
  }

  /**
   * Update container size
   */
  resize(width: number, height: number, padding?: number | { top: number; right: number; bottom: number; left: number }): void {
    const p = typeof padding === 'number'
      ? { top: padding, right: padding, bottom: padding, left: padding }
      : padding ?? { top: 0, right: 0, bottom: 0, left: 0 };

    this.container.x.value = p.left;
    this.container.y.value = p.top;
    this.container.width.value = width - p.left - p.right;
    this.container.height.value = height - p.top - p.bottom;
  }
}

// =============================================================================
// Exports
// =============================================================================

export {
  // Solver
  ConstraintSolver as Solver,
};
