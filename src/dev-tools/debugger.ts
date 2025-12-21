/**
 * Developer Tools - Debugging utilities for tuiuiu applications
 *
 * Provides:
 * - Layout Inspector: Visualize layout tree with dimensions
 * - Event Log: Track events as they occur
 * - Performance Monitor: Frame times and render stats
 * - Component Tree: VNode hierarchy visualization
 * - Signal Graph: Dependency tracking
 * - Dev Mode: Global toggle for debug features
 */

import type { VNode } from '../utils/types.js';

// =============================================================================
// Types
// =============================================================================

export interface DevToolsConfig {
  enabled: boolean;
  showLayoutBounds: boolean;
  showEventLog: boolean;
  showPerformance: boolean;
  showComponentTree: boolean;
  showSignalGraph: boolean;
  maxEventLogSize: number;
  performanceWarningThreshold: number; // ms
}

export interface LayoutInfo {
  type: string;
  id?: string;
  className?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
  children: LayoutInfo[];
}

export interface EventLogEntry {
  id: number;
  timestamp: number;
  type: string;
  target?: string;
  data?: unknown;
  phase?: 'capture' | 'bubble';
}

export interface PerformanceMetrics {
  frameCount: number;
  lastFrameTime: number;
  averageFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  fps: number;
  renderCount: number;
  layoutCount: number;
  signalUpdateCount: number;
  memoryUsage?: number;
}

export interface FrameStats {
  startTime: number;
  endTime: number;
  duration: number;
  renderTime: number;
  layoutTime: number;
  signalTime: number;
}

export interface ComponentTreeNode {
  type: string;
  id?: string;
  className?: string;
  props: Record<string, unknown>;
  children: ComponentTreeNode[];
  depth: number;
  path: string;
}

export interface SignalNode {
  id: string;
  name: string;
  value: unknown;
  dependencies: string[];
  dependents: string[];
  updateCount: number;
  lastUpdate: number;
}

export interface SignalGraph {
  nodes: SignalNode[];
  edges: Array<{ from: string; to: string }>;
}

// =============================================================================
// Dev Mode State
// =============================================================================

let devModeEnabled = false;
let config: DevToolsConfig = {
  enabled: false,
  showLayoutBounds: false,
  showEventLog: false,
  showPerformance: false,
  showComponentTree: false,
  showSignalGraph: false,
  maxEventLogSize: 100,
  performanceWarningThreshold: 16.67, // 60fps target
};

const eventLog: EventLogEntry[] = [];
let eventIdCounter = 0;

const performanceMetrics: PerformanceMetrics = {
  frameCount: 0,
  lastFrameTime: 0,
  averageFrameTime: 0,
  minFrameTime: Infinity,
  maxFrameTime: 0,
  fps: 0,
  renderCount: 0,
  layoutCount: 0,
  signalUpdateCount: 0,
};

const frameTimes: number[] = [];
const MAX_FRAME_SAMPLES = 60;

const signalRegistry = new Map<string, SignalNode>();
let signalIdCounter = 0;

// =============================================================================
// Dev Mode Control
// =============================================================================

/**
 * Enable or disable dev mode globally
 */
export function setDevMode(enabled: boolean): void {
  devModeEnabled = enabled;
  config.enabled = enabled;
}

/**
 * Check if dev mode is enabled
 */
export function isDevMode(): boolean {
  return devModeEnabled;
}

/**
 * Configure dev tools options
 */
export function configureDevTools(options: Partial<DevToolsConfig>): void {
  config = { ...config, ...options };
  if (options.enabled !== undefined) {
    devModeEnabled = options.enabled;
  }
}

/**
 * Get current dev tools configuration
 */
export function getDevToolsConfig(): Readonly<DevToolsConfig> {
  return { ...config };
}

// =============================================================================
// Layout Inspector
// =============================================================================

/**
 * Extract layout information from a VNode tree
 */
export function inspectLayout(
  node: VNode,
  x = 0,
  y = 0,
  width = 80,
  height = 24
): LayoutInfo {
  const props = node.props || {};

  const padding = normalizePadding(props.padding, props.paddingX, props.paddingY);
  const margin = normalizeMargin(props.margin, props.marginX, props.marginY);

  const info: LayoutInfo = {
    type: typeof node.type === 'string' ? node.type : (node.type as { name?: string } | undefined)?.name || 'Component',
    id: props.id as string | undefined,
    className: props.className as string | undefined,
    x,
    y,
    width: (props.width as number) || width,
    height: (props.height as number) || height,
    padding,
    margin,
    children: [],
  };

  // Process children
  const children = node.children || [];
  let childY = y + padding.top;

  for (const child of children) {
    if (child && typeof child === 'object' && 'type' in child) {
      const childInfo = inspectLayout(
        child as VNode,
        x + padding.left,
        childY,
        width - padding.left - padding.right,
        height - padding.top - padding.bottom
      );
      info.children.push(childInfo);
      childY += childInfo.height;
    }
  }

  return info;
}

/**
 * Format layout info as a string tree
 */
export function formatLayoutTree(info: LayoutInfo, indent = 0): string {
  const prefix = '  '.repeat(indent);
  const id = info.id ? `#${info.id}` : '';
  const cls = info.className ? `.${info.className.split(' ').join('.')}` : '';

  let result = `${prefix}${info.type}${id}${cls} `;
  result += `[${info.x},${info.y} ${info.width}x${info.height}]`;

  if (info.padding.top || info.padding.right || info.padding.bottom || info.padding.left) {
    result += ` p(${info.padding.top},${info.padding.right},${info.padding.bottom},${info.padding.left})`;
  }

  result += '\n';

  for (const child of info.children) {
    result += formatLayoutTree(child, indent + 1);
  }

  return result;
}

function normalizePadding(
  padding?: number,
  paddingX?: number,
  paddingY?: number
): { top: number; right: number; bottom: number; left: number } {
  return {
    top: (paddingY as number) ?? (padding as number) ?? 0,
    right: (paddingX as number) ?? (padding as number) ?? 0,
    bottom: (paddingY as number) ?? (padding as number) ?? 0,
    left: (paddingX as number) ?? (padding as number) ?? 0,
  };
}

function normalizeMargin(
  margin?: number,
  marginX?: number,
  marginY?: number
): { top: number; right: number; bottom: number; left: number } {
  return {
    top: (marginY as number) ?? (margin as number) ?? 0,
    right: (marginX as number) ?? (margin as number) ?? 0,
    bottom: (marginY as number) ?? (margin as number) ?? 0,
    left: (marginX as number) ?? (margin as number) ?? 0,
  };
}

// =============================================================================
// Event Log
// =============================================================================

/**
 * Log an event to the dev tools event log
 */
export function logEvent(
  type: string,
  target?: string,
  data?: unknown,
  phase?: 'capture' | 'bubble'
): void {
  if (!config.enabled || !config.showEventLog) return;

  const entry: EventLogEntry = {
    id: eventIdCounter++,
    timestamp: Date.now(),
    type,
    target,
    data,
    phase,
  };

  eventLog.push(entry);

  // Trim log if too large
  while (eventLog.length > config.maxEventLogSize) {
    eventLog.shift();
  }
}

/**
 * Get the current event log
 */
export function getEventLog(): readonly EventLogEntry[] {
  return [...eventLog];
}

/**
 * Clear the event log
 */
export function clearEventLog(): void {
  eventLog.length = 0;
}

/**
 * Format event log as string
 */
export function formatEventLog(limit = 20): string {
  const entries = eventLog.slice(-limit);
  return entries
    .map((e) => {
      const time = new Date(e.timestamp).toISOString().slice(11, 23);
      const phase = e.phase ? ` [${e.phase}]` : '';
      const target = e.target ? ` → ${e.target}` : '';
      return `${time} ${e.type}${phase}${target}`;
    })
    .join('\n');
}

// =============================================================================
// Performance Monitor
// =============================================================================

/**
 * Start timing a frame
 */
export function startFrame(): { end: () => FrameStats } {
  const startTime = performance.now();
  let renderStart = 0;
  let renderEnd = 0;
  let layoutStart = 0;
  let layoutEnd = 0;
  let signalStart = 0;
  let signalEnd = 0;

  return {
    end(): FrameStats {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Update metrics
      performanceMetrics.frameCount++;
      performanceMetrics.lastFrameTime = duration;

      // Track frame times for average
      frameTimes.push(duration);
      if (frameTimes.length > MAX_FRAME_SAMPLES) {
        frameTimes.shift();
      }

      // Calculate stats
      performanceMetrics.averageFrameTime =
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      performanceMetrics.minFrameTime = Math.min(
        performanceMetrics.minFrameTime,
        duration
      );
      performanceMetrics.maxFrameTime = Math.max(
        performanceMetrics.maxFrameTime,
        duration
      );
      performanceMetrics.fps = 1000 / performanceMetrics.averageFrameTime;

      return {
        startTime,
        endTime,
        duration,
        renderTime: renderEnd - renderStart,
        layoutTime: layoutEnd - layoutStart,
        signalTime: signalEnd - signalStart,
      };
    },
  };
}

/**
 * Record a render operation
 */
export function recordRender(): void {
  if (!config.enabled) return;
  performanceMetrics.renderCount++;
}

/**
 * Record a layout operation
 */
export function recordLayout(): void {
  if (!config.enabled) return;
  performanceMetrics.layoutCount++;
}

/**
 * Record a signal update
 */
export function recordSignalUpdate(): void {
  if (!config.enabled) return;
  performanceMetrics.signalUpdateCount++;
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): Readonly<PerformanceMetrics> {
  return { ...performanceMetrics };
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  performanceMetrics.frameCount = 0;
  performanceMetrics.lastFrameTime = 0;
  performanceMetrics.averageFrameTime = 0;
  performanceMetrics.minFrameTime = Infinity;
  performanceMetrics.maxFrameTime = 0;
  performanceMetrics.fps = 0;
  performanceMetrics.renderCount = 0;
  performanceMetrics.layoutCount = 0;
  performanceMetrics.signalUpdateCount = 0;
  frameTimes.length = 0;
}

/**
 * Format performance metrics as string
 */
export function formatPerformanceMetrics(): string {
  const m = performanceMetrics;
  const lines = [
    `Frames: ${m.frameCount}`,
    `FPS: ${m.fps.toFixed(1)}`,
    `Frame Time: ${m.lastFrameTime.toFixed(2)}ms (avg: ${m.averageFrameTime.toFixed(2)}ms)`,
    `Min/Max: ${m.minFrameTime === Infinity ? '-' : m.minFrameTime.toFixed(2)}ms / ${m.maxFrameTime.toFixed(2)}ms`,
    `Renders: ${m.renderCount}`,
    `Layouts: ${m.layoutCount}`,
    `Signal Updates: ${m.signalUpdateCount}`,
  ];

  if (m.averageFrameTime > config.performanceWarningThreshold) {
    lines.push(`⚠️ Above ${config.performanceWarningThreshold}ms target`);
  }

  return lines.join('\n');
}

// =============================================================================
// Component Tree
// =============================================================================

/**
 * Build a component tree from a VNode
 */
export function buildComponentTree(
  node: VNode,
  depth = 0,
  path = '0'
): ComponentTreeNode {
  const props = node.props || {};
  const type = typeof node.type === 'string' ? node.type : (node.type as { name?: string } | undefined)?.name || 'Component';

  // Filter out children from props display
  const displayProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key !== 'children' && typeof value !== 'function') {
      displayProps[key] = value;
    }
  }

  const treeNode: ComponentTreeNode = {
    type,
    id: props.id as string | undefined,
    className: props.className as string | undefined,
    props: displayProps,
    children: [],
    depth,
    path,
  };

  const children = node.children || [];
  let childIndex = 0;

  for (const child of children) {
    if (child && typeof child === 'object' && 'type' in child) {
      const childPath = `${path}.${childIndex}`;
      treeNode.children.push(
        buildComponentTree(child as VNode, depth + 1, childPath)
      );
      childIndex++;
    }
  }

  return treeNode;
}

/**
 * Format component tree as string
 */
export function formatComponentTree(
  node: ComponentTreeNode,
  options: { showProps?: boolean; maxDepth?: number } = {}
): string {
  const { showProps = false, maxDepth = Infinity } = options;

  function format(n: ComponentTreeNode, indent: number): string {
    if (n.depth > maxDepth) return '';

    const prefix = '  '.repeat(indent);
    const connector = indent > 0 ? '├─ ' : '';
    const id = n.id ? `#${n.id}` : '';
    const cls = n.className ? `.${n.className.split(' ')[0]}` : '';

    let line = `${prefix}${connector}${n.type}${id}${cls}`;

    if (showProps && Object.keys(n.props).length > 0) {
      const propsStr = Object.entries(n.props)
        .filter(([k]) => k !== 'id' && k !== 'className')
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(' ');
      if (propsStr) {
        line += ` { ${propsStr} }`;
      }
    }

    line += '\n';

    for (const child of n.children) {
      line += format(child, indent + 1);
    }

    return line;
  }

  return format(node, 0);
}

/**
 * Find component by path
 */
export function findComponentByPath(
  tree: ComponentTreeNode,
  path: string
): ComponentTreeNode | null {
  if (tree.path === path) return tree;

  for (const child of tree.children) {
    const found = findComponentByPath(child, path);
    if (found) return found;
  }

  return null;
}

/**
 * Count components in tree
 */
export function countComponents(tree: ComponentTreeNode): number {
  let count = 1;
  for (const child of tree.children) {
    count += countComponents(child);
  }
  return count;
}

// =============================================================================
// Signal Dependency Graph
// =============================================================================

/**
 * Register a signal for tracking
 */
export function registerSignal(name: string, value: unknown): string {
  const id = `signal_${signalIdCounter++}`;

  signalRegistry.set(id, {
    id,
    name,
    value,
    dependencies: [],
    dependents: [],
    updateCount: 0,
    lastUpdate: Date.now(),
  });

  return id;
}

/**
 * Update signal value and track
 */
export function updateSignalValue(id: string, value: unknown): void {
  const signal = signalRegistry.get(id);
  if (signal) {
    signal.value = value;
    signal.updateCount++;
    signal.lastUpdate = Date.now();
    recordSignalUpdate();
  }
}

/**
 * Add dependency between signals
 */
export function addSignalDependency(dependentId: string, dependencyId: string): void {
  const dependent = signalRegistry.get(dependentId);
  const dependency = signalRegistry.get(dependencyId);

  if (dependent && dependency) {
    if (!dependent.dependencies.includes(dependencyId)) {
      dependent.dependencies.push(dependencyId);
    }
    if (!dependency.dependents.includes(dependentId)) {
      dependency.dependents.push(dependentId);
    }
  }
}

/**
 * Get signal graph
 */
export function getSignalGraph(): SignalGraph {
  const nodes = Array.from(signalRegistry.values());
  const edges: Array<{ from: string; to: string }> = [];

  for (const node of nodes) {
    for (const depId of node.dependencies) {
      edges.push({ from: depId, to: node.id });
    }
  }

  return { nodes, edges };
}

/**
 * Format signal graph as string
 */
export function formatSignalGraph(): string {
  const graph = getSignalGraph();
  const lines: string[] = ['Signal Dependency Graph:', ''];

  for (const node of graph.nodes) {
    const valueStr =
      typeof node.value === 'object'
        ? JSON.stringify(node.value).slice(0, 30)
        : String(node.value);

    lines.push(`${node.name} (${node.id})`);
    lines.push(`  Value: ${valueStr}`);
    lines.push(`  Updates: ${node.updateCount}`);

    if (node.dependencies.length > 0) {
      lines.push(`  Depends on: ${node.dependencies.join(', ')}`);
    }
    if (node.dependents.length > 0) {
      lines.push(`  Used by: ${node.dependents.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Clear signal registry
 */
export function clearSignalRegistry(): void {
  signalRegistry.clear();
  signalIdCounter = 0;
}

// =============================================================================
// Debug Panel Component Data
// =============================================================================

export interface DebugPanelData {
  layout?: LayoutInfo;
  componentTree?: ComponentTreeNode;
  eventLog: readonly EventLogEntry[];
  performance: Readonly<PerformanceMetrics>;
  signalGraph: SignalGraph;
  config: Readonly<DevToolsConfig>;
}

/**
 * Get all debug panel data
 */
export function getDebugPanelData(rootNode?: VNode): DebugPanelData {
  return {
    layout: rootNode ? inspectLayout(rootNode) : undefined,
    componentTree: rootNode ? buildComponentTree(rootNode) : undefined,
    eventLog: getEventLog(),
    performance: getPerformanceMetrics(),
    signalGraph: getSignalGraph(),
    config: getDevToolsConfig(),
  };
}
