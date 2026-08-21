/**
 * Computed Node - Fine-grained reactive VNode (inspired by arrow-js)
 *
 * A `Computed` wraps a reactive expression that produces a memoized VNode
 * subtree. Signals read inside the expression invalidate that expression;
 * the host component may still be evaluated by the frame scheduler.
 *
 * This avoids rebuilding expensive regions for unrelated parent renders
 * without pretending that tuiuiu has a fiber-per-node renderer.
 *
 * @example
 * function Dashboard() {
 *   const [count, setCount] = useState(0);
 *   const [name, setName] = useState('Alice');
 *
 *   useShortcut('up', () => setCount(c => c + 1));
 *
 *   return Box({ flexDirection: 'column' },
 *     // This Text only re-evaluates when count changes
 *     Computed(() => Text({}, `Count: ${count()}`)),
 *     // This Text only re-evaluates when name changes
 *     Computed(() => Text({}, `Name: ${name()}`)),
 *     // This never re-evaluates (no signals read)
 *     Text({}, 'Static content'),
 *   );
 * }
 */

import type { BoxStyle, VNode, TextProps } from '../utils/types.js';
import { createMemo } from '../primitives/signal.js';
import { fingerprintValue } from '../core/structural-fingerprint.js';

/**
 * A reactive VNode marker.
 * During rendering, the render loop detects these and sets up
 * per-node effects for fine-grained updates.
 */
export interface ReactiveVNode extends VNode {
  /** The reactive expression that produces the child VNode */
  __reactive: () => VNode | null;
  /** Cached last result */
  __cachedResult?: VNode | null;
  /** Cached structural fingerprint for change detection */
  __cachedFingerprint?: string;
  /** Dispose function for the internal effect */
  __dispose?: () => void;
}

/**
 * Computed - Create a signal-memoized VNode.
 *
 * The provided function is wrapped in a reactive effect.
 * When signals read inside it change, this expression is re-computed. The
 * renderer may also evaluate the host component while scheduling the frame.
 *
 * @param fn - A function that reads signals and returns a VNode
 * @returns A VNode that updates independently
 *
 * @example
 * // Only re-renders when `count` signal changes
 * Computed(() => Text({}, `Count: ${count()}`))
 *
 * // Can contain complex subtrees
 * Computed(() => {
 *   const items = list();
 *   return Box({},
 *     ...items.map(item => Text({}, item.name))
 *   );
 * })
 */
export function Computed(fn: () => VNode | null): VNode {
  // Reactive nodes own their memo directly and are disposed with the VNode tree.
  const memo = createMemo(fn);
  const initialResult = memo();
  const node: ReactiveVNode = {
    type: 'box',
    props: {},
    children: initialResult ? [initialResult] : [],
    __reactive: memo,
    __cachedResult: initialResult,
    __cachedFingerprint: fingerprintValue(initialResult),
    __dispose: memo.dispose,
  };
  return node;
}

/**
 * Check if a VNode is a reactive computed node
 */
export function isReactiveVNode(node: VNode): node is ReactiveVNode {
  return '__reactive' in node;
}

/**
 * Refresh a reactive VNode by re-evaluating its expression.
 * Returns true if the result structurally changed.
 */
export function refreshReactiveVNode(node: ReactiveVNode): boolean {
  const newResult = node.__reactive();
  const newFingerprint = fingerprintValue(newResult);
  const changed = newFingerprint !== node.__cachedFingerprint;
  node.__cachedResult = newResult;
  node.__cachedFingerprint = newFingerprint;
  node.children = newResult ? [newResult] : [];
  return changed;
}

/**
 * Refresh every standalone ReactiveVNode in a tree.
 *
 * Reading each memo accessor also connects pre-built Computed nodes to the
 * active render effect, which is what makes `render(prebuiltNode)` update.
 */
export function refreshReactiveVNodes(root: VNode): number {
  let changed = 0;
  const visit = (node: VNode): void => {
    if (isReactiveVNode(node)) {
      if (refreshReactiveVNode(node)) changed++;
    }
    for (const child of node.children) visit(child);
  };
  visit(root);
  return changed;
}

/** Dispose memo effects owned by standalone ReactiveVNodes in a tree. */
export function disposeReactiveVNodes(root: VNode): void {
  const visited = new Set<ReactiveVNode>();
  const visit = (node: VNode): void => {
    if (isReactiveVNode(node) && !visited.has(node)) {
      visited.add(node);
      node.__dispose?.();
      node.__dispose = undefined;
    }
    for (const child of node.children) visit(child);
  };
  visit(root);
}

/**
 * ComputedText - Shorthand for reactive text content.
 *
 * Even more concise than Computed for the common case of
 * a single Text node with reactive content.
 *
 * @example
 * ComputedText(() => `Count: ${count()}`)
 * ComputedText(() => `Score: ${score()}`, { color: 'green', bold: true })
 */
export function ComputedText(
  fn: () => string,
  props: Record<string, any> = {},
): VNode {
  // Reactive text uses the same owned-memo lifecycle as Computed.
  const textFn = () => ({
    type: 'text' as const,
    props: { ...props, children: fn() },
    children: [] as VNode[],
  });
  const memo = createMemo(textFn);
  const initialResult = memo();
  const node: ReactiveVNode = {
    type: 'box',
    props: {},
    children: [initialResult],
    __reactive: memo,
    __cachedResult: initialResult,
    __cachedFingerprint: fingerprintValue(initialResult),
    __dispose: memo.dispose,
  };
  return node;
}

// =============================================================================
// Memo - Cache a VNode subtree until deps change
// =============================================================================

/**
 * Memo - Cache an expensive VNode subtree.
 *
 * Only re-evaluates `fn` when the `deps` array changes (shallow comparison).
 * Use this to skip rebuilding large or expensive UI sections.
 *
 * @param deps - Values to watch. When any value changes, fn is re-called.
 * @param fn - Returns the VNode subtree to cache.
 *
 * @example
 * // Expensive map — only rebuilds when monsters or cursor move
 * Memo([monsters(), cursor()], () =>
 *   Box({ flexDirection: 'column' },
 *     ...renderMapRows(monsters(), cursor())
 *   )
 * )
 *
 * @example
 * // Static header — never rebuilds (empty deps)
 * Memo([], () =>
 *   Box({ flexDirection: 'row' },
 *     Text({ bold: true }, 'My App'),
 *     Text({ dim: true }, 'v1.0')
 *   )
 * )
 *
 * @example
 * // Score display — only rebuilds when score changes
 * Memo([score()], () =>
 *   Text({ color: 'warning', bold: true }, `Score: ${score()}`)
 * )
 */
export function Memo(deps: unknown[], fn: () => VNode | null): VNode {
  // Memo nodes are explicit VNodes and follow one lifecycle in every context.
  const result = fn();
  const node: MemoVNode = {
    type: 'box',
    props: {},
    children: result ? [result] : [],
    __memo: fn,
    __memoDeps: deps,
    __memoCached: result,
  };
  return node;
}

/** Internal marker for Memo nodes */
export interface MemoVNode extends VNode {
  __memo: () => VNode | null;
  __memoDeps: unknown[];
  __memoCached: VNode | null;
}

/** Check if a VNode is a Memo node */
export function isMemoVNode(node: VNode): node is MemoVNode {
  return '__memo' in node;
}

/** Refresh a Memo node — only re-evaluates if deps changed */
export function refreshMemoVNode(node: MemoVNode, newDeps: unknown[]): boolean {
  if (depsEqual(node.__memoDeps, newDeps)) {
    return false; // Cache hit — skip rebuild
  }
  const result = node.__memo();
  node.__memoDeps = newDeps;
  node.__memoCached = result;
  node.children = result ? [result] : [];
  return true;
}

function depsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

// =============================================================================
// PreText - Pre-styled SGR content
// =============================================================================

/**
 * PreText - Render content with pre-built SGR styling.
 *
 * When you've already built ANSI-escaped strings (common in games),
 * PreText ignores component-level text styling and derives structured cell
 * styles from validated SGR sequences. Cursor movement, OSC, DCS and other
 * terminal protocols are discarded rather than passed through.
 *
 * @param content - A string with SGR color/style codes already applied
 * @param props - Optional layout props (width, height)
 *
 * @example
 * // Game board with ANSI SGR styling
 * const row = '\x1b[32m███\x1b[0m \x1b[31m░░░\x1b[0m';
 * PreText(row)
 *
 * @example
 * // Map rendering — build ANSI once, render fast
 * function mapView() {
 *   const rows = buildMapRows(); // returns ANSI strings
 *   return Box({ flexDirection: 'column' },
 *     ...rows.map(row => PreText(row))
 *   );
 * }
 */
export type PreTextProps = Partial<
  TextProps & Pick<BoxStyle, 'width' | 'height' | 'minWidth' | 'maxWidth'>
>;

export function PreText(content: string, props: PreTextProps = {}): VNode {
  return {
    type: 'text',
    props: {
      ...props,
      children: content,
      __prebuiltAnsi: true,
    },
    children: [],
  };
}
