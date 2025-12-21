/**
 * Developer Tools - Debugger Tests
 *
 * Tests for debugging utilities: layout inspector, event log,
 * performance monitor, component tree, signal graph.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Dev mode
  setDevMode,
  isDevMode,
  configureDevTools,
  getDevToolsConfig,
  // Layout inspector
  inspectLayout,
  formatLayoutTree,
  // Event log
  logEvent,
  getEventLog,
  clearEventLog,
  formatEventLog,
  // Performance monitor
  startFrame,
  recordRender,
  recordLayout,
  recordSignalUpdate,
  getPerformanceMetrics,
  resetPerformanceMetrics,
  formatPerformanceMetrics,
  // Component tree
  buildComponentTree,
  formatComponentTree,
  findComponentByPath,
  countComponents,
  // Signal graph
  registerSignal,
  updateSignalValue,
  addSignalDependency,
  getSignalGraph,
  formatSignalGraph,
  clearSignalRegistry,
  // Debug panel
  getDebugPanelData,
} from '../../src/dev-tools/index.js';
import type { VNode } from '../../src/utils/types.js';

// Helper to create test VNodes
function createNode(
  type: string,
  props: Record<string, unknown> = {},
  children: VNode[] = []
): VNode {
  return { type, props, children };
}

describe('Dev Mode Control', () => {
  beforeEach(() => {
    setDevMode(false);
  });

  it('should start with dev mode disabled', () => {
    expect(isDevMode()).toBe(false);
  });

  it('should enable dev mode', () => {
    setDevMode(true);
    expect(isDevMode()).toBe(true);
  });

  it('should disable dev mode', () => {
    setDevMode(true);
    setDevMode(false);
    expect(isDevMode()).toBe(false);
  });

  it('should configure dev tools', () => {
    configureDevTools({
      enabled: true,
      showLayoutBounds: true,
      showEventLog: true,
      maxEventLogSize: 50,
    });

    const config = getDevToolsConfig();
    expect(config.enabled).toBe(true);
    expect(config.showLayoutBounds).toBe(true);
    expect(config.showEventLog).toBe(true);
    expect(config.maxEventLogSize).toBe(50);
  });

  it('should preserve unset config values', () => {
    const originalConfig = getDevToolsConfig();
    configureDevTools({ showPerformance: true });
    const newConfig = getDevToolsConfig();

    expect(newConfig.showPerformance).toBe(true);
    expect(newConfig.maxEventLogSize).toBe(originalConfig.maxEventLogSize);
  });
});

describe('Layout Inspector', () => {
  it('should inspect simple node', () => {
    const node = createNode('box', { id: 'root', width: 80, height: 24 });
    const layout = inspectLayout(node);

    expect(layout.type).toBe('box');
    expect(layout.id).toBe('root');
    expect(layout.width).toBe(80);
    expect(layout.height).toBe(24);
  });

  it('should extract className', () => {
    const node = createNode('box', { className: 'container primary' });
    const layout = inspectLayout(node);

    expect(layout.className).toBe('container primary');
  });

  it('should normalize padding', () => {
    const node = createNode('box', { padding: 2 });
    const layout = inspectLayout(node);

    expect(layout.padding.top).toBe(2);
    expect(layout.padding.right).toBe(2);
    expect(layout.padding.bottom).toBe(2);
    expect(layout.padding.left).toBe(2);
  });

  it('should handle paddingX and paddingY', () => {
    const node = createNode('box', { paddingX: 4, paddingY: 2 });
    const layout = inspectLayout(node);

    expect(layout.padding.top).toBe(2);
    expect(layout.padding.right).toBe(4);
    expect(layout.padding.bottom).toBe(2);
    expect(layout.padding.left).toBe(4);
  });

  it('should inspect children', () => {
    const node = createNode('box', { id: 'parent' }, [
      createNode('text', { id: 'child1' }),
      createNode('text', { id: 'child2' }),
    ]);
    const layout = inspectLayout(node);

    expect(layout.children.length).toBe(2);
    expect(layout.children[0]!.id).toBe('child1');
    expect(layout.children[1]!.id).toBe('child2');
  });

  it('should format layout tree', () => {
    const node = createNode('box', { id: 'root' }, [
      createNode('text', { className: 'title' }),
    ]);
    const layout = inspectLayout(node);
    const formatted = formatLayoutTree(layout);

    expect(formatted).toContain('box#root');
    expect(formatted).toContain('text.title');
  });
});

describe('Event Log', () => {
  beforeEach(() => {
    clearEventLog();
    configureDevTools({ enabled: true, showEventLog: true });
  });

  it('should start with empty log', () => {
    expect(getEventLog().length).toBe(0);
  });

  it('should log events when enabled', () => {
    logEvent('click', 'button', { x: 10, y: 20 });
    const log = getEventLog();

    expect(log.length).toBe(1);
    expect(log[0]!.type).toBe('click');
    expect(log[0]!.target).toBe('button');
    expect(log[0]!.data).toEqual({ x: 10, y: 20 });
  });

  it('should not log events when disabled', () => {
    configureDevTools({ showEventLog: false });
    logEvent('click', 'button');

    expect(getEventLog().length).toBe(0);
  });

  it('should include event phase', () => {
    logEvent('keydown', 'input', { key: 'a' }, 'capture');
    const log = getEventLog();

    expect(log[0]!.phase).toBe('capture');
  });

  it('should assign unique IDs', () => {
    logEvent('event1');
    logEvent('event2');
    const log = getEventLog();

    expect(log[0]!.id).not.toBe(log[1]!.id);
  });

  it('should include timestamp', () => {
    const before = Date.now();
    logEvent('test');
    const after = Date.now();
    const log = getEventLog();

    expect(log[0]!.timestamp).toBeGreaterThanOrEqual(before);
    expect(log[0]!.timestamp).toBeLessThanOrEqual(after);
  });

  it('should trim log when max size exceeded', () => {
    configureDevTools({ maxEventLogSize: 5 });

    for (let i = 0; i < 10; i++) {
      logEvent(`event${i}`);
    }

    const log = getEventLog();
    expect(log.length).toBe(5);
    expect(log[0]!.type).toBe('event5'); // First 5 were trimmed
  });

  it('should clear event log', () => {
    logEvent('test');
    clearEventLog();
    expect(getEventLog().length).toBe(0);
  });

  it('should format event log', () => {
    logEvent('click', 'button', null, 'bubble');
    const formatted = formatEventLog();

    expect(formatted).toContain('click');
    expect(formatted).toContain('[bubble]');
    expect(formatted).toContain('button');
  });
});

describe('Performance Monitor', () => {
  beforeEach(() => {
    resetPerformanceMetrics();
    configureDevTools({ enabled: true });
  });

  it('should start with zeroed metrics', () => {
    const metrics = getPerformanceMetrics();

    expect(metrics.frameCount).toBe(0);
    expect(metrics.renderCount).toBe(0);
    expect(metrics.layoutCount).toBe(0);
    expect(metrics.signalUpdateCount).toBe(0);
  });

  it('should track frame times', () => {
    const frame = startFrame();
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      Math.random();
    }
    frame.end();

    const metrics = getPerformanceMetrics();
    expect(metrics.frameCount).toBe(1);
    expect(metrics.lastFrameTime).toBeGreaterThanOrEqual(0);
  });

  it('should calculate average frame time', () => {
    for (let i = 0; i < 5; i++) {
      const frame = startFrame();
      frame.end();
    }

    const metrics = getPerformanceMetrics();
    expect(metrics.frameCount).toBe(5);
    expect(metrics.averageFrameTime).toBeGreaterThanOrEqual(0);
  });

  it('should track min/max frame times', () => {
    for (let i = 0; i < 3; i++) {
      const frame = startFrame();
      frame.end();
    }

    const metrics = getPerformanceMetrics();
    expect(metrics.minFrameTime).toBeLessThanOrEqual(metrics.maxFrameTime);
  });

  it('should calculate FPS', () => {
    for (let i = 0; i < 10; i++) {
      const frame = startFrame();
      frame.end();
    }

    const metrics = getPerformanceMetrics();
    expect(metrics.fps).toBeGreaterThan(0);
  });

  it('should record render operations', () => {
    recordRender();
    recordRender();
    recordRender();

    const metrics = getPerformanceMetrics();
    expect(metrics.renderCount).toBe(3);
  });

  it('should record layout operations', () => {
    recordLayout();
    recordLayout();

    const metrics = getPerformanceMetrics();
    expect(metrics.layoutCount).toBe(2);
  });

  it('should record signal updates', () => {
    recordSignalUpdate();

    const metrics = getPerformanceMetrics();
    expect(metrics.signalUpdateCount).toBe(1);
  });

  it('should not record when disabled', () => {
    configureDevTools({ enabled: false });
    recordRender();
    recordLayout();
    recordSignalUpdate();

    const metrics = getPerformanceMetrics();
    expect(metrics.renderCount).toBe(0);
    expect(metrics.layoutCount).toBe(0);
    expect(metrics.signalUpdateCount).toBe(0);
  });

  it('should reset metrics', () => {
    recordRender();
    recordLayout();
    startFrame().end();

    resetPerformanceMetrics();

    const metrics = getPerformanceMetrics();
    expect(metrics.frameCount).toBe(0);
    expect(metrics.renderCount).toBe(0);
    expect(metrics.layoutCount).toBe(0);
  });

  it('should format performance metrics', () => {
    recordRender();
    startFrame().end();

    const formatted = formatPerformanceMetrics();

    expect(formatted).toContain('Frames:');
    expect(formatted).toContain('FPS:');
    expect(formatted).toContain('Renders:');
  });
});

describe('Component Tree', () => {
  it('should build tree from simple node', () => {
    const node = createNode('box', { id: 'root' });
    const tree = buildComponentTree(node);

    expect(tree.type).toBe('box');
    expect(tree.id).toBe('root');
    expect(tree.depth).toBe(0);
    expect(tree.path).toBe('0');
  });

  it('should build tree with children', () => {
    const node = createNode('box', {}, [
      createNode('text', { id: 'child1' }),
      createNode('text', { id: 'child2' }),
    ]);
    const tree = buildComponentTree(node);

    expect(tree.children.length).toBe(2);
    expect(tree.children[0]!.id).toBe('child1');
    expect(tree.children[0]!.depth).toBe(1);
    expect(tree.children[0]!.path).toBe('0.0');
  });

  it('should extract props (excluding functions)', () => {
    const node = createNode('box', {
      id: 'test',
      color: 'red',
      onClick: () => {},
    });
    const tree = buildComponentTree(node);

    expect(tree.props.id).toBe('test');
    expect(tree.props.color).toBe('red');
    expect(tree.props.onClick).toBeUndefined();
  });

  it('should format component tree', () => {
    const node = createNode('box', { id: 'root', className: 'container' }, [
      createNode('text', { id: 'title' }),
    ]);
    const tree = buildComponentTree(node);
    const formatted = formatComponentTree(tree);

    expect(formatted).toContain('box#root.container');
    expect(formatted).toContain('text#title');
  });

  it('should format with props when requested', () => {
    const node = createNode('box', { color: 'cyan' });
    const tree = buildComponentTree(node);
    const formatted = formatComponentTree(tree, { showProps: true });

    expect(formatted).toContain('color="cyan"');
  });

  it('should respect maxDepth', () => {
    const node = createNode('box', {}, [
      createNode('box', {}, [
        createNode('text', { id: 'deep' }),
      ]),
    ]);
    const tree = buildComponentTree(node);
    const formatted = formatComponentTree(tree, { maxDepth: 1 });

    expect(formatted).not.toContain('deep');
  });

  it('should find component by path', () => {
    const node = createNode('box', {}, [
      createNode('text', { id: 'first' }),
      createNode('text', { id: 'second' }),
    ]);
    const tree = buildComponentTree(node);

    const found = findComponentByPath(tree, '0.1');
    expect(found).not.toBeNull();
    expect(found!.id).toBe('second');
  });

  it('should return null for non-existent path', () => {
    const node = createNode('box', {});
    const tree = buildComponentTree(node);

    const found = findComponentByPath(tree, '0.0.0');
    expect(found).toBeNull();
  });

  it('should count components', () => {
    const node = createNode('box', {}, [
      createNode('text', {}),
      createNode('box', {}, [
        createNode('text', {}),
        createNode('text', {}),
      ]),
    ]);
    const tree = buildComponentTree(node);

    expect(countComponents(tree)).toBe(5);
  });
});

describe('Signal Graph', () => {
  beforeEach(() => {
    clearSignalRegistry();
    configureDevTools({ enabled: true });
  });

  it('should register signals', () => {
    const id = registerSignal('count', 0);

    expect(id).toMatch(/^signal_\d+$/);
  });

  it('should update signal values', () => {
    const id = registerSignal('count', 0);
    updateSignalValue(id, 5);

    const graph = getSignalGraph();
    const signal = graph.nodes.find((n) => n.id === id);

    expect(signal).toBeDefined();
    expect(signal!.value).toBe(5);
    expect(signal!.updateCount).toBe(1);
  });

  it('should track signal dependencies', () => {
    const id1 = registerSignal('base', 10);
    const id2 = registerSignal('derived', 20);

    addSignalDependency(id2, id1);

    const graph = getSignalGraph();
    const derived = graph.nodes.find((n) => n.id === id2);
    const base = graph.nodes.find((n) => n.id === id1);

    expect(derived!.dependencies).toContain(id1);
    expect(base!.dependents).toContain(id2);
  });

  it('should build edge list', () => {
    const id1 = registerSignal('a', 1);
    const id2 = registerSignal('b', 2);
    addSignalDependency(id2, id1);

    const graph = getSignalGraph();

    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0]).toEqual({ from: id1, to: id2 });
  });

  it('should format signal graph', () => {
    const id = registerSignal('count', 42);
    updateSignalValue(id, 43);

    const formatted = formatSignalGraph();

    expect(formatted).toContain('count');
    expect(formatted).toContain('43');
    expect(formatted).toContain('Updates: 1');
  });

  it('should clear signal registry', () => {
    registerSignal('test', 1);
    clearSignalRegistry();

    const graph = getSignalGraph();
    expect(graph.nodes.length).toBe(0);
  });
});

describe('Debug Panel Data', () => {
  beforeEach(() => {
    clearEventLog();
    resetPerformanceMetrics();
    clearSignalRegistry();
    configureDevTools({ enabled: true, showEventLog: true });
  });

  it('should aggregate all debug data', () => {
    logEvent('test');
    recordRender();
    registerSignal('count', 0);

    const node = createNode('box', { id: 'root' });
    const data = getDebugPanelData(node);

    expect(data.layout).toBeDefined();
    expect(data.layout!.id).toBe('root');
    expect(data.componentTree).toBeDefined();
    expect(data.componentTree!.type).toBe('box');
    expect(data.eventLog.length).toBe(1);
    expect(data.performance.renderCount).toBe(1);
    expect(data.signalGraph.nodes.length).toBe(1);
    expect(data.config).toBeDefined();
  });

  it('should work without root node', () => {
    const data = getDebugPanelData();

    expect(data.layout).toBeUndefined();
    expect(data.componentTree).toBeUndefined();
    expect(data.eventLog).toBeDefined();
    expect(data.performance).toBeDefined();
    expect(data.signalGraph).toBeDefined();
  });
});
