/**
 * Computed Node - Fine-grained reactive VNode (inspired by arrow-js)
 *
 * A `Computed` wraps a reactive expression that produces a VNode subtree.
 * When signals read inside the expression change, only this subtree
 * re-evaluates — not the entire component.
 *
 * This is the foundation for fine-grained rendering in tuiuiu.
 *
 * @example
 * function Dashboard() {
 *   const [count, setCount] = useState(0);
 *   const [name, setName] = useState('Alice');
 *
 *   useHotkeys('up', () => setCount(c => c + 1));
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

import type { VNode, TuiChild, TextProps } from '../utils/types.js';
import { useComputed } from '../hooks/use-computed.js';
import { useMemo } from '../hooks/use-memo.js';
import { isRenderingHooks } from '../hooks/context.js';

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
  /** Dispose function for the internal effect */
  __dispose?: () => void;
}

/**
 * Computed - Create a fine-grained reactive VNode.
 *
 * The provided function is wrapped in a reactive effect.
 * When signals read inside it change, only this node's output
 * is re-computed — the parent component does NOT re-run.
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
  // Inside a component render: use hook-based caching (persists between re-renders)
  if (isRenderingHooks()) {
    const result = useComputed(fn);
    if (!result) return { type: 'box', props: {}, children: [] };
    return result;
  }

  // Outside render context: evaluate eagerly (tests, standalone usage)
  const initialResult = fn();
  const node: ReactiveVNode = {
    type: 'box',
    props: {},
    children: initialResult ? [initialResult] : [],
    __reactive: fn,
    __cachedResult: initialResult,
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
 * Returns true if the result changed.
 */
export function refreshReactiveVNode(node: ReactiveVNode): boolean {
  const newResult = node.__reactive();
  const changed = newResult !== node.__cachedResult;
  node.__cachedResult = newResult;
  node.children = newResult ? [newResult] : [];
  return changed;
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
  // Use useComputed directly (one hook) instead of nesting via Computed
  if (isRenderingHooks()) {
    const result = useComputed(() => ({
      type: 'text' as const,
      props: { ...props, children: fn() },
      children: [],
    }));
    return result ?? { type: 'text', props: { children: '' }, children: [] };
  }

  // Outside render context: evaluate eagerly and wrap in ReactiveVNode (like Computed)
  const textFn = () => ({
    type: 'text' as const,
    props: { ...props, children: fn() },
    children: [] as VNode[],
  });
  const initialResult = textFn();
  const node: ReactiveVNode = {
    type: 'box',
    props: {},
    children: [initialResult],
    __reactive: textFn,
    __cachedResult: initialResult,
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
  // Inside a component render: use hook-based caching (persists between re-renders)
  if (isRenderingHooks()) {
    const result = useMemo<VNode | null>(deps, fn);
    if (!result) return { type: 'box', props: {}, children: [] };
    return result;
  }

  // Outside render context: evaluate eagerly (tests, standalone usage)
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
// PreText - Pre-built ANSI content (skip renderer processing)
// =============================================================================

/**
 * PreText - Render pre-built ANSI content directly.
 *
 * When you've already built ANSI-escaped strings (common in games),
 * PreText tells the renderer to output them as-is without re-processing.
 * This skips the ANSI encoding phase entirely.
 *
 * @param content - A string with ANSI escape codes already applied
 * @param props - Optional layout props (width, height)
 *
 * @example
 * // Game board with pre-built ANSI colors
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
export function PreText(content: string, props: Partial<TextProps> = {}): VNode {
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
