/**
 * Tree - Hierarchical data display component
 *
 * @layer Molecule
 * @description Expandable tree view with keyboard navigation
 *
 * Features:
 * - Expandable/collapsible nodes
 * - Keyboard navigation
 * - Custom icons and colors
 * - Multiple selection modes
 * - Search/filter
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal, createMemo } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { getChars, getRenderMode } from '../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export interface TreeNode<T = unknown> {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: string;
  /** Child nodes */
  children?: TreeNode<T>[];
  /** Associated data */
  data?: T;
  /** Disabled state */
  disabled?: boolean;
  /** Custom color */
  color?: ColorValue;
}

export interface TreeOptions<T = unknown> {
  /** Root nodes */
  nodes: TreeNode<T>[];
  /** Initially expanded node IDs */
  initialExpanded?: string[];
  /** Initially selected node IDs */
  initialSelected?: string[];
  /** Selection mode */
  selectionMode?: 'none' | 'single' | 'multiple';
  /** Show guides/lines */
  showGuides?: boolean;
  /** Indentation size */
  indentSize?: number;
  /** Max visible depth */
  maxDepth?: number;
  /** Colors */
  activeColor?: ColorValue;
  selectedColor?: ColorValue;
  guideColor?: ColorValue;
  /** Callbacks */
  onSelect?: (node: TreeNode<T>) => void;
  onExpand?: (node: TreeNode<T>) => void;
  onCollapse?: (node: TreeNode<T>) => void;
  /** Is active */
  isActive?: boolean;
}

export interface FlattenedNode<T = unknown> {
  node: TreeNode<T>;
  depth: number;
  isLast: boolean;
  parentPath: boolean[];
  hasChildren: boolean;
  isExpanded: boolean;
}

export interface TreeState<T = unknown> {
  cursorIndex: () => number;
  expanded: () => Set<string>;
  selected: () => Set<string>;
  flatNodes: () => FlattenedNode<T>[];
  // Navigation
  moveUp: () => void;
  moveDown: () => void;
  moveTo: (id: string) => void;
  // Expansion
  expand: (id: string) => void;
  collapse: (id: string) => void;
  toggle: (id: string) => void;
  toggleCurrent: () => void;
  expandAll: () => void;
  collapseAll: () => void;
  // Selection
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggleSelect: (id: string) => void;
  toggleSelectCurrent: () => void;
  getCurrentNode: () => TreeNode<T> | undefined;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Collect all node IDs recursively
 */
function collectAllIds<T>(nodes: TreeNode<T>[]): string[] {
  const ids: string[] = [];

  function traverse(node: TreeNode<T>) {
    ids.push(node.id);
    node.children?.forEach(traverse);
  }

  nodes.forEach(traverse);
  return ids;
}

/**
 * Flatten tree for display
 */
function flattenTree<T>(
  nodes: TreeNode<T>[],
  expanded: Set<string>,
  depth: number = 0,
  parentPath: boolean[] = [],
  maxDepth: number = Infinity
): FlattenedNode<T>[] {
  if (depth > maxDepth) return [];

  const result: FlattenedNode<T>[] = [];

  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isExpanded = expanded.has(node.id);

    result.push({
      node,
      depth,
      isLast,
      parentPath: [...parentPath],
      hasChildren,
      isExpanded,
    });

    if (hasChildren && isExpanded && node.children) {
      const childPath = [...parentPath, !isLast];
      const children = flattenTree(
        node.children,
        expanded,
        depth + 1,
        childPath,
        maxDepth
      );
      result.push(...children);
    }
  });

  return result;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a Tree state manager
 */
export function createTree<T = unknown>(options: TreeOptions<T>): TreeState<T> {
  const {
    nodes,
    initialExpanded = [],
    initialSelected = [],
    selectionMode = 'single',
    maxDepth = Infinity,
    onSelect,
    onExpand,
    onCollapse,
  } = options;

  const [cursorIndex, setCursorIndex] = createSignal(0);
  const [expanded, setExpanded] = createSignal(new Set(initialExpanded));
  const [selected, setSelected] = createSignal(new Set(initialSelected));

  // Memoized flattened tree
  const flatNodes = createMemo(() =>
    flattenTree(nodes, expanded(), 0, [], maxDepth)
  );

  // Navigation
  const moveUp = () => {
    setCursorIndex((i) => Math.max(0, i - 1));
  };

  const moveDown = () => {
    setCursorIndex((i) => Math.min(flatNodes().length - 1, i + 1));
  };

  const moveTo = (id: string) => {
    const flat = flatNodes();
    const index = flat.findIndex((f) => f.node.id === id);
    if (index >= 0) setCursorIndex(index);
  };

  // Expansion
  const expand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const flat = flatNodes();
    const found = flat.find((f) => f.node.id === id);
    if (found) onExpand?.(found.node);
  };

  const collapse = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const flat = flatNodes();
    const found = flat.find((f) => f.node.id === id);
    if (found) onCollapse?.(found.node);
  };

  const toggle = (id: string) => {
    if (expanded().has(id)) {
      collapse(id);
    } else {
      expand(id);
    }
  };

  const toggleCurrent = () => {
    const flat = flatNodes();
    const current = flat[cursorIndex()];
    if (current?.hasChildren) {
      toggle(current.node.id);
    }
  };

  const expandAll = () => {
    const allIds = collectAllIds(nodes);
    setExpanded(new Set(allIds));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  // Selection
  const select = (id: string) => {
    if (selectionMode === 'none') return;

    setSelected((prev) => {
      if (selectionMode === 'single') {
        return new Set([id]);
      }
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const flat = flatNodes();
    const found = flat.find((f) => f.node.id === id);
    if (found) onSelect?.(found.node);
  };

  const deselect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    if (selected().has(id)) {
      deselect(id);
    } else {
      select(id);
    }
  };

  const toggleSelectCurrent = () => {
    const flat = flatNodes();
    const current = flat[cursorIndex()];
    if (current && !current.node.disabled) {
      toggleSelect(current.node.id);
    }
  };

  const getCurrentNode = (): TreeNode<T> | undefined => {
    const flat = flatNodes();
    return flat[cursorIndex()]?.node;
  };

  return {
    cursorIndex,
    expanded,
    selected,
    flatNodes,
    moveUp,
    moveDown,
    moveTo,
    expand,
    collapse,
    toggle,
    toggleCurrent,
    expandAll,
    collapseAll,
    select,
    deselect,
    toggleSelect,
    toggleSelectCurrent,
    getCurrentNode,
  };
}

// =============================================================================
// Component
// =============================================================================

export interface TreeProps<T = unknown> extends TreeOptions<T> {
  /** Pre-created state */
  state?: TreeState<T>;
  /** Label/title */
  label?: string;
}

/**
 * Tree - Hierarchical data display
 *
 * @example
 * // Basic tree
 * Tree({
 *   nodes: [
 *     {
 *       id: 'root',
 *       label: 'Root',
 *       children: [
 *         { id: 'child1', label: 'Child 1' },
 *         { id: 'child2', label: 'Child 2' },
 *       ],
 *     },
 *   ],
 *   onSelect: (node) => console.log(node.label),
 * })
 *
 * @example
 * // File tree with icons
 * Tree({
 *   nodes: [
 *     {
 *       id: 'src',
 *       label: 'src',
 *       icon: '📁',
 *       children: [
 *         { id: 'index.ts', label: 'index.ts', icon: '📄' },
 *         { id: 'utils.ts', label: 'utils.ts', icon: '📄' },
 *       ],
 *     },
 *   ],
 *   showGuides: true,
 *   selectionMode: 'single',
 * })
 */
export function Tree<T = unknown>(props: TreeProps<T>): VNode {
  const {
    showGuides = true,
    indentSize = 2,
    activeColor = 'primary',
    selectedColor = 'success',
    guideColor = 'mutedForeground',
    selectionMode = 'single',
    isActive = true,
    label,
    state: externalState,
  } = props;

  const state = externalState || createTree(props);
  const isAscii = getRenderMode() === 'ascii';
  const chars = getChars();

  // Tree guide characters
  const treeChars = isAscii
    ? { branch: '|-- ', last: '`-- ', pipe: '|   ', space: '    ' }
    : { branch: '├── ', last: '└── ', pipe: '│   ', space: '    ' };

  // Expand/collapse characters
  const expandChars = isAscii
    ? { expanded: '[-]', collapsed: '[+]', leaf: ' - ' }
    : { expanded: '▼ ', collapsed: '▶ ', leaf: '  ' };

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.upArrow || input === 'k') {
        state.moveUp();
      } else if (key.downArrow || input === 'j') {
        state.moveDown();
      } else if (key.rightArrow || input === 'l') {
        const current = state.getCurrentNode();
        if (current) {
          const flat = state.flatNodes();
          const currentFlat = flat.find((f) => f.node.id === current.id);
          if (currentFlat?.hasChildren && !currentFlat.isExpanded) {
            state.expand(current.id);
          }
        }
      } else if (key.leftArrow || input === 'h') {
        const current = state.getCurrentNode();
        if (current) {
          const flat = state.flatNodes();
          const currentFlat = flat.find((f) => f.node.id === current.id);
          if (currentFlat?.hasChildren && currentFlat.isExpanded) {
            state.collapse(current.id);
          }
        }
      } else if (key.return || input === ' ') {
        if (selectionMode !== 'none') {
          state.toggleSelectCurrent();
        } else {
          state.toggleCurrent();
        }
      } else if (input === 'e') {
        state.expandAll();
      } else if (input === 'c') {
        state.collapseAll();
      }
    },
    { isActive }
  );

  const flat = state.flatNodes();
  const cursor = state.cursorIndex();
  const selectedSet = state.selected();

  // Build tree rows
  const treeNodes = flat.map((flatNode, index) => {
    const { node, depth, isLast, parentPath, hasChildren, isExpanded } = flatNode;
    const isCursor = index === cursor;
    const isSelected = selectedSet.has(node.id);

    // Build guide prefix
    let prefix = '';
    if (showGuides && depth > 0) {
      // Parent guides
      for (let i = 0; i < parentPath.length; i++) {
        prefix += parentPath[i] ? treeChars.pipe : treeChars.space;
      }
      // Current branch
      prefix += isLast ? treeChars.last : treeChars.branch;
    } else if (depth > 0) {
      prefix = ' '.repeat(depth * indentSize);
    }

    // Expand/collapse indicator
    let expandIndicator = expandChars.leaf;
    if (hasChildren) {
      expandIndicator = isExpanded ? expandChars.expanded : expandChars.collapsed;
    }

    // Icon
    const icon = node.icon ? node.icon + ' ' : '';

    // Determine colors
    const labelColor = node.disabled
      ? 'mutedForeground'
      : isCursor
        ? activeColor
        : isSelected
          ? selectedColor
          : node.color ?? 'foreground';

    // Selection indicator
    let selectionIndicator = '';
    if (selectionMode !== 'none') {
      if (isSelected) {
        selectionIndicator = isAscii ? '[x] ' : '● ';
      } else {
        selectionIndicator = isAscii ? '[ ] ' : '○ ';
      }
    }

    // Cursor indicator
    const cursorIndicator = isCursor ? chars.arrows.right + ' ' : '  ';

    return Box(
      { flexDirection: 'row' },
      Text({ color: isCursor ? activeColor : 'mutedForeground' }, cursorIndicator),
      showGuides ? Text({ color: guideColor, dim: true }, prefix) : null,
      Text({ color: hasChildren ? (isExpanded ? 'warning' : 'info') : 'mutedForeground' }, expandIndicator),
      selectionMode !== 'none'
        ? Text({ color: isSelected ? selectedColor : 'mutedForeground' }, selectionIndicator)
        : null,
      icon ? Text({}, icon) : null,
      Text({ color: labelColor, bold: isCursor, dim: node.disabled }, node.label)
    );
  });

  // Build full component
  const parts: (VNode | null)[] = [];

  if (label) {
    parts.push(Box({ marginBottom: 1 }, Text({ bold: true }, label)));
  }

  parts.push(Box({ flexDirection: 'column' }, ...treeNodes));

  return Box({ flexDirection: 'column' }, ...parts);
}

// =============================================================================
// DirectoryTree (specialized for file systems)
// =============================================================================

export interface DirectoryNode extends TreeNode<{ type: 'file' | 'directory'; size?: number }> {
  children?: DirectoryNode[];
}

export interface DirectoryTreeOptions extends Omit<TreeOptions<{ type: 'file' | 'directory'; size?: number }>, 'nodes'> {
  /** Directory nodes */
  nodes: DirectoryNode[];
  /** Show file sizes */
  showSizes?: boolean;
  /** Show hidden files */
  showHidden?: boolean;
}

/**
 * Get icon for file type
 */
function getFileIcon(name: string, isDirectory: boolean): string {
  if (isDirectory) return '📁';

  const ext = name.split('.').pop()?.toLowerCase();

  const icons: Record<string, string> = {
    ts: '📘',
    tsx: '📘',
    js: '📙',
    jsx: '📙',
    json: '📋',
    md: '📝',
    css: '🎨',
    html: '🌐',
    png: '🖼️',
    jpg: '🖼️',
    svg: '🖼️',
    git: '🔧',
    env: '🔒',
    lock: '🔒',
  };

  return icons[ext || ''] || '📄';
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}M`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}G`;
}

/**
 * DirectoryTree - File system tree browser
 *
 * @example
 * DirectoryTree({
 *   nodes: [
 *     {
 *       id: 'src',
 *       label: 'src',
 *       data: { type: 'directory' },
 *       children: [
 *         { id: 'index.ts', label: 'index.ts', data: { type: 'file', size: 1024 } },
 *       ],
 *     },
 *   ],
 *   showSizes: true,
 * })
 */
export function DirectoryTree(props: DirectoryTreeOptions): VNode {
  const { nodes, showSizes = false, showHidden = false, ...rest } = props;

  // Add icons to nodes recursively
  function addIcons(node: DirectoryNode): TreeNode<{ type: 'file' | 'directory'; size?: number }> {
    const isDir = node.data?.type === 'directory';
    const icon = node.icon ?? getFileIcon(node.label, isDir);

    let label = node.label;
    if (showSizes && node.data?.size !== undefined) {
      label = `${label} (${formatSize(node.data.size)})`;
    }

    return {
      ...node,
      icon,
      label,
      children: node.children?.map(addIcons),
    };
  }

  // Filter hidden files if needed
  const filteredNodes = showHidden
    ? nodes
    : nodes.filter((n) => !n.label.startsWith('.'));

  const processedNodes = filteredNodes.map(addIcons);

  return Tree({
    ...rest,
    nodes: processedNodes,
    showGuides: true,
  });
}
