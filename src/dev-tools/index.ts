/**
 * Developer Tools - Debugging and testing utilities for tuiuiu
 *
 * Debugging:
 * - Layout Inspector
 * - Event Log
 * - Performance Monitor
 * - Component Tree
 * - Signal Graph
 * - Dev Mode Toggle
 *
 * Testing:
 * - Terminal Simulator
 * - Snapshot Testing
 * - Event Simulation
 * - Accessibility Checker
 * - Test Harness
 */

// =============================================================================
// Debugger exports
// =============================================================================

export {
  // Dev mode control
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
  // Types
  type DevToolsConfig,
  type LayoutInfo,
  type EventLogEntry,
  type PerformanceMetrics,
  type FrameStats,
  type ComponentTreeNode,
  type SignalNode,
  type SignalGraph,
  type DebugPanelData,
} from './debugger.js';

// =============================================================================
// Testing exports
// =============================================================================

export {
  // Terminal simulator
  TerminalSimulator,
  // Snapshot testing
  createSnapshot,
  compareSnapshots,
  formatSnapshotDiff,
  stripAnsi,
  // Event simulation
  createEventSimulator,
  // Accessibility
  checkAccessibility,
  formatAccessibilityReport,
  // Test harness
  createTestHarness,
  // Types
  type TerminalSize,
  type CursorPosition,
  type TerminalCell,
  type TerminalState,
  type KeyEvent,
  type MouseEvent,
  type SnapshotOptions,
  type SnapshotDiff,
  type AccessibilityIssue,
  type AccessibilityReport,
  type EventSimulator,
  type TestHarnessOptions,
  type TestHarness,
} from './testing.js';

// =============================================================================
// Mouse Simulator exports
// =============================================================================

export {
  // Class
  MouseSimulator,
  // Factory
  createMouseSimulator,
  // Convenience functions
  simulateClick,
  simulateRightClick,
  simulateDoubleClick,
  simulateScroll,
  simulateDrag,
  // Sequence generators
  generateSGRMouseSequence,
  generateX10MouseSequence,
  // Types
  type MouseSimulatorOptions,
  type ClickOptions,
  type DragOptions,
} from './mouse-simulator.js';
