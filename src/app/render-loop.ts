/**
 * Tuiuiu App - Main render loop and app lifecycle
 *
 * This is the entry point for Tuiuiu applications
 */

import type { VNode, BoxStyle } from '../utils/types.js';
import { renderToString, renderFrameToString } from '../core/renderer.js';
import { batch, createEffect } from '../primitives/signal.js';
import {
  initializeApp,
  enableMouseTracking,
  disableMouseTracking,
  setClearScreen,
  setExternalUpdateIngress,
} from '../hooks/index.js';
import { enableAlternateScreen, disableAlternateScreen } from '../core/input.js';
import {
  beginRender,
  endRender,
  getRuntimeScopeForApp,
  resetHookState,
} from '../hooks/context.js';
import { createLogUpdate, type LogUpdate } from '../utils/log-update.js';
import { createUpdateBatcher } from '../utils/batcher.js';
import { getHitTestRegistry, registerHitTestFromLayout } from '../core/hit-test.js';
import { createDeltaRenderer, type DeltaRenderer } from '../core/delta-render.js';
import {
  clearCommittedFrameSnapshot,
  createFrameSnapshot,
  finalizeFrameRuntimeMetrics,
  getCommittedFrameSnapshot,
  recordFramePhaseMetric,
  recordFrameStructuralMetric,
  setCommittedFrameSnapshot,
} from '../core/frame.js';
import { cleanLayoutTree, clearChanges } from '../core/dirty.js';
import { onTerminalFocusChange, readTerminalFocus } from '../core/terminal-focus.js';
import { invalidateCellSize } from '../core/graphics.js';
import { beginAppRenderSession, endAppRenderSession } from '../core/dev-warnings.js';
import { recordCommittedFrame } from '../core/perf-inspector.js';
import { configureMotionRuntime } from '../core/motion-runtime.js';
import { installPanicHooks, onTerminalPanic } from '../core/terminal-panic.js';
import {
  destroyRuntimeScope,
  runInRuntimeScope,
} from '../core/runtime-scope.js';

const PRODUCTION_FRAME_OPTIONS = {
  eagerHitTargets: false,
  eagerQueries: false,
  eagerWarnings: false,
} as const;

/**
 * Check if a VNode is marked as static
 */
function isStaticNode(node: VNode): boolean {
  return !!(node.props as any).__static;
}

/**
 * Generate a stable ID for a static node
 * Uses content hash if no explicit ID provided
 */
function getStaticNodeId(node: VNode, index: number): string {
  const props = node.props as any;
  if (props.__staticId) return props.__staticId;
  // Generate an ID based on position and content
  return `static-${index}-${JSON.stringify(node.children?.slice(0, 2) ?? []).slice(0, 50)}`;
}

/**
 * Extract static nodes from a VNode tree
 * Returns { staticNodes, interactiveNode }
 */
function separateStaticNodes(node: VNode): { staticNodes: VNode[]; interactiveNode: VNode } {
  const staticNodes: VNode[] = [];

  // Helper to recursively find and remove static nodes
  function processNode(n: VNode): VNode | null {
    if (isStaticNode(n)) {
      staticNodes.push(n);
      return null; // Remove from tree
    }

    // Process children
    if (n.children && n.children.length > 0) {
      const newChildren = n.children
        .map(child => (child && typeof child === 'object' && 'type' in child) ? processNode(child as VNode) : child)
        .filter((child): child is VNode => child !== null);

      return {
        ...n,
        children: newChildren,
      };
    }

    return n;
  }

  const interactiveNode = processNode(node) ?? {
    type: 'fragment' as const,
    props: {},
    children: [],
  };

  return { staticNodes, interactiveNode };
}

/** ANSI escape sequences */
const ansi = {
  clearTerminal: '\x1b[2J\x1b[3J\x1b[H',
};

export interface RenderOptions {
  /** Output stream (default: process.stdout) */
  stdout?: NodeJS.WriteStream;
  /** Input stream (default: process.stdin) */
  stdin?: NodeJS.ReadStream;
  /** Enable debug mode - prints each render as separate output */
  debug?: boolean;
  /** Exit on Ctrl+C (default: true) */
  exitOnCtrlC?: boolean;
  /** Allow app.exit() to terminate the Node.js process (default: false) */
  exitProcess?: boolean;
  /** Maximum accepted paste size in UTF-8 bytes (default: 1 MiB) */
  maxPasteBytes?: number;
  /** Maximum incomplete terminal sequence retained between chunks (default: 4 KiB) */
  maxPendingEscapeBytes?: number;
  /** Time to wait for the rest of a split escape sequence (default: 25ms) */
  escapeSequenceTimeoutMs?: number;
  /** Time to wait for a bracketed paste terminator (default: 30s) */
  pasteTimeoutMs?: number;
  /** Maximum FPS for render throttling (default: 30) */
  maxFps?: number;
  /** Clear screen on start (default: true) */
  clearOnStart?: boolean;
  /** Show cursor (default: false during render) */
  showCursor?: boolean;
  /** Enable automatic Tab/Shift+Tab navigation (default: true) */
  autoTabNavigation?: boolean;
  /** Fill entire terminal height (default: false). Use for full-screen apps. */
  fullHeight?: boolean;
  /** Use delta renderer for optimized cell-level updates (default: true).
   *  When enabled, only changed cells are redrawn instead of the entire screen.
   *  Set to false if you need Static component support or encounter rendering issues. */
  useDeltaRenderer?: boolean;
  /** Use alternate screen buffer (default: true).
   *  When enabled, the terminal switches to a separate screen on startup and
   *  restores the original screen on exit, preserving your scrollback history. */
  alternateScreen?: boolean;
  /** Optional fixed-step update loop for game-like workloads.
   *  Updates run at a fixed cadence while presentation remains capped by `maxFps`. */
  fixedStep?: FixedStepOptions;
}

export interface FixedStepUpdate {
  /** Fixed logical step size in milliseconds */
  deltaTimeMs: number;
  /** Monotonic update step count for the current render session */
  step: number;
  /** Total logical time advanced by the fixed-step loop */
  elapsedMs: number;
}

export interface FixedStepOptions {
  /** Fixed logical update rate in frames per second */
  updateFps: number;
  /** Max fixed steps to execute in one catch-up pass before dropping stale backlog (default: 5) */
  maxCatchUpUpdates?: number;
  /** Pause logical updates while the terminal is unfocused (default: true) */
  pauseWhenUnfocused?: boolean;
  /** Called for each fixed logical step */
  onUpdate: (update: FixedStepUpdate) => void;
}

export interface TuiInstance {
  /** Re-render with a new component */
  rerender: (node: VNode) => void;
  /** Unmount the app */
  unmount: () => void;
  /** Wait for the app to exit */
  waitUntilExit: () => Promise<void>;
  /** Clear the output */
  clear: () => void;
}

/**
 * Render a Tuiuiu app to the terminal
 *
 * @example
 * const { waitUntilExit } = render(() => App());
 * await waitUntilExit();
 */
export function render(nodeOrFn: VNode | (() => VNode), options: RenderOptions = {}): TuiInstance {
  const {
    stdout = process.stdout,
    stdin = process.stdin,
    debug = false,
    exitOnCtrlC = true,
    exitProcess = false,
    maxPasteBytes,
    maxPendingEscapeBytes,
    escapeSequenceTimeoutMs,
    pasteTimeoutMs,
    maxFps = 30,
    clearOnStart = true,
    showCursor = false,
    autoTabNavigation = true,
    fullHeight = false,
    useDeltaRenderer = true,
    alternateScreen = true,
    fixedStep,
  } = options;

  // Initialize app context FIRST (before calling component functions)
  const appContext = initializeApp(stdin, stdout, {
    autoTabNavigation,
    exitOnCtrlC,
    exitProcess,
    maxPasteBytes,
    maxPendingEscapeBytes,
    escapeSequenceTimeoutMs,
    pasteTimeoutMs,
  });
  const resolvedRuntimeScope = getRuntimeScopeForApp(appContext);
  if (!resolvedRuntimeScope) {
    appContext.dispose();
    throw new Error('[tuiuiu] Failed to create the app runtime scope');
  }
  const runtimeScope = resolvedRuntimeScope;
  beginAppRenderSession();

  // Install centralized panic hooks to restore terminal on crash
  const releasePanicHooks = installPanicHooks();
  const unregisterPanicCleanups: Array<() => void> = [];
  unregisterPanicCleanups.push(onTerminalPanic(() => {
    if (stdin.isTTY && (stdin as any).setRawMode) {
      (stdin as any).setRawMode(false);
    }
  }));
  unregisterPanicCleanups.push(onTerminalPanic(() => {
    stdout.write('\x1b[?1004l'); // disable focus events
  }));
  unregisterPanicCleanups.push(onTerminalPanic(() => {
    stdout.write('\x1b[?2004l'); // disable bracketed paste
  }));
  if (alternateScreen) {
    stdout.write(enableAlternateScreen());
    unregisterPanicCleanups.push(onTerminalPanic(() => {
      stdout.write(disableAlternateScreen());
    }));
  }

  // Store the component function for re-evaluation
  let componentFn = typeof nodeOrFn === 'function' ? nodeOrFn : () => nodeOrFn;

  let outputBackpressured = false;
  let outputCaptureDepth = 0;
  let capturedOutputBytes = 0;
  let capturedOutputMs = 0;
  let pendingVNodeEvalMs: number | undefined;
  let pendingRuntimeStartAt: number | undefined;

  const handleOutputDrain = () => {
    outputBackpressured = false;
    pendingRender = scheduledRenderCallback !== null;
    schedulePendingRenderCallback();
  };

  const beginOutputCapture = () => {
    outputCaptureDepth++;
    if (outputCaptureDepth === 1) {
      capturedOutputBytes = 0;
      capturedOutputMs = 0;
    }
  };

  const endOutputCapture = (): { bytes: number; writeMs: number } => {
    if (outputCaptureDepth === 0) {
      return { bytes: 0, writeMs: 0 };
    }

    outputCaptureDepth--;
    if (outputCaptureDepth === 0) {
      return {
        bytes: capturedOutputBytes,
        writeMs: capturedOutputMs,
      };
    }

    return {
      bytes: 0,
      writeMs: 0,
    };
  };

  const writeOutput = (chunk: string | Uint8Array): boolean => {
    const writeStart = outputCaptureDepth > 0 ? performance.now() : 0;
    const canWrite = stdout.write(chunk as any);

    if (outputCaptureDepth > 0) {
      capturedOutputMs += performance.now() - writeStart;
      capturedOutputBytes += typeof chunk === 'string'
        ? Buffer.byteLength(chunk)
        : chunk.byteLength;
    }

    if (!canWrite && !outputBackpressured) {
      outputBackpressured = true;
      stdout.once('drain', handleOutputDrain);
    }

    return canWrite;
  };

  const outputStream = {
    get columns() {
      return stdout.columns;
    },
    get rows() {
      return stdout.rows;
    },
    get isTTY() {
      return stdout.isTTY;
    },
    write(chunk: string | Uint8Array) {
      return writeOutput(chunk);
    },
    on: stdout.on.bind(stdout),
    off: stdout.off.bind(stdout),
    once: stdout.once.bind(stdout),
    emit: stdout.emit.bind(stdout),
  } as unknown as NodeJS.WriteStream;

  // Create log updater for efficient incremental rendering
  // Uses fullScreen mode when fullHeight is enabled for reliable clearing
  let logUpdate: LogUpdate = createLogUpdate(outputStream, {
    showCursor,
    incremental: false,
    fullScreen: fullHeight, // Use simple clear-and-redraw for fullHeight mode
    topOffset: 0,
  });
  let logUpdateTopOffset = 0;

  // State
  let currentNode: VNode | null = null;
  let lastOutput = '';
  let isUnmounted = false;

  // Expose clearScreen to app context for splash->main transitions
  // This properly resets logUpdate state to avoid incremental render corruption
  setClearScreen(() => {
    // 1. Clear logUpdate state first (sets previousOutput='' and previousLines=[])
    //    This ensures next render will be a full redraw since previousOutput.length === 0
    logUpdate.clear();
    // 2. Clear terminal completely (moves cursor to home position 0,0)
    writeOutput(ansi.clearTerminal);
    // 3. Reset render loop state
    lastOutput = '';
    renderedStaticIds.clear();
    staticLineCount = 0;
    logUpdateTopOffset = 0;
    logUpdate = createLogUpdate(outputStream, {
      showCursor,
      incremental: false,
      fullScreen: fullHeight,
      topOffset: 0,
    });
  });
  let exitPromise: Promise<void>;
  let resolveExit: () => void;
  let rejectExit: (error: Error) => void;

  // Static content tracking
  const renderedStaticIds = new Set<string>();
  let staticLineCount = 0; // Track how many lines of static content we've written

  // Create exit promise
  exitPromise = new Promise((resolve, reject) => {
    resolveExit = resolve;
    rejectExit = reject;
  });

  // Throttle rendering
  const minRenderInterval = maxFps > 0 ? Math.ceil(1000 / maxFps) : 0;
  configureMotionRuntime({
    targetFps: maxFps > 0 ? maxFps : 60,
    reducedFps: maxFps > 0 ? Math.max(1, Math.floor(maxFps / 2)) : 30,
    frameBudgetMs: minRenderInterval > 0 ? minRenderInterval : 16.67,
  });
  let lastRenderTime = 0;
  let pendingRender = false;
  let scheduledRender = false;
  let renderTimer: ReturnType<typeof setTimeout> | null = null;
  let renderMicrotaskQueued = false;
  let scheduledRenderCallback: (() => void) | null = null;
  let fixedStepTimer: ReturnType<typeof setTimeout> | null = null;
  let fixedStepAccumulatorMs = 0;
  let fixedStepLastAt = 0;
  let fixedStepCount = 0;
  let fixedStepElapsedMs = 0;
  let cleanupFixedStepFocus: (() => void) | null = null;
  let externalUpdateQueue: Array<() => void> = [];

  // Mouse tracking state
  let mouseTrackingEnabled = false;

  // Delta renderer (optional, for optimized cell-level updates)
  let deltaRenderer: DeltaRenderer | null = null;
  if (useDeltaRenderer) {
    deltaRenderer = createDeltaRenderer({
      stdout: outputStream,
      showCursor,
      useDelta: true,
    });
  }

  // Initial setup
  if (clearOnStart && !debug) {
    writeOutput(ansi.clearTerminal);
  }

  const externalUpdateWindowMs = minRenderInterval > 0 ? minRenderInterval : 16;
  const flushExternalUpdates = () => {
    if (externalUpdateQueue.length === 0) {
      return;
    }

    batch(() => {
      while (externalUpdateQueue.length > 0) {
        const updates = externalUpdateQueue;
        externalUpdateQueue = [];
        for (const update of updates) {
          update();
        }
      }
    });
  };
  const externalUpdateBatcher = createUpdateBatcher(flushExternalUpdates, externalUpdateWindowMs);
  setExternalUpdateIngress({
    enqueue(update) {
      if (isUnmounted) {
        return;
      }
      externalUpdateQueue.push(update);
      externalUpdateBatcher.schedule();
    },
    flush() {
      if (isUnmounted) {
        return;
      }
      externalUpdateBatcher.flush();
    },
    isPending() {
      return externalUpdateQueue.length > 0 || externalUpdateBatcher.isPending();
    },
  });

  const evaluateTree = () => {
    const evalStart = performance.now();
    pendingRuntimeStartAt = Date.now();
    beginRender('component');
    currentNode = componentFn();
    endRender();
    pendingVNodeEvalMs = performance.now() - evalStart;
  };

  const evaluateAndRender = () => runInRuntimeScope(runtimeScope, () => {
    evaluateTree();
    doRender();
  });

  /**
   * Schedule a render callback (with throttling and latest-state wins semantics)
   */
  function scheduleRenderCallback(callback: () => void): void {
    if (isUnmounted) return;

    scheduledRenderCallback = callback;

    if (outputBackpressured) {
      pendingRender = true;
      return;
    }

    schedulePendingRenderCallback();
  }

  function schedulePendingRenderCallback(): void {
    if (scheduledRender || isUnmounted || outputBackpressured || !scheduledRenderCallback) {
      return;
    }

    const now = Date.now();
    const elapsed = now - lastRenderTime;
    const delay =
      lastRenderTime === 0 || elapsed >= minRenderInterval
        ? 0
        : minRenderInterval - elapsed;

    const flushScheduledRender = () => {
      const flush = scheduledRenderCallback;
      scheduledRenderCallback = null;
      scheduledRender = false;
      renderMicrotaskQueued = false;
      pendingRender = false;
      renderTimer = null;

      if (!isUnmounted) {
        flush?.();
      }
    };

    scheduledRender = true;
    pendingRender = delay > 0;

    if (delay === 0) {
      renderMicrotaskQueued = true;
      queueMicrotask(flushScheduledRender);
      return;
    }

    renderTimer = setTimeout(flushScheduledRender, delay);
  }

  function scheduleFixedStepLoop(): void {
    if (!fixedStep || isUnmounted) {
      return;
    }

    const pauseWhenUnfocused = fixedStep.pauseWhenUnfocused ?? true;
    if (pauseWhenUnfocused && !readTerminalFocus()) {
      return;
    }

    const stepMs = 1000 / Math.max(1, fixedStep.updateFps);
    const delay = Math.max(0, Math.ceil(stepMs - fixedStepAccumulatorMs));

    fixedStepTimer = setTimeout(runFixedStepLoop, delay);
  }

  function runFixedStepLoop(): void {
    if (!fixedStep || isUnmounted) {
      return;
    }

    const pauseWhenUnfocused = fixedStep.pauseWhenUnfocused ?? true;
    if (pauseWhenUnfocused && !readTerminalFocus()) {
      fixedStepTimer = null;
      fixedStepAccumulatorMs = 0;
      fixedStepLastAt = Date.now();
      return;
    }

    const stepMs = 1000 / Math.max(1, fixedStep.updateFps);
    const maxCatchUpUpdates = Math.max(1, fixedStep.maxCatchUpUpdates ?? 5);
    const now = Date.now();
    fixedStepAccumulatorMs += now - fixedStepLastAt;
    fixedStepLastAt = now;

    let executed = 0;
    while (fixedStepAccumulatorMs >= stepMs && executed < maxCatchUpUpdates) {
      fixedStepAccumulatorMs -= stepMs;
      fixedStepCount++;
      fixedStepElapsedMs += stepMs;

      batch(() => {
        fixedStep.onUpdate({
          deltaTimeMs: stepMs,
          step: fixedStepCount,
          elapsedMs: fixedStepElapsedMs,
        });
      });

      executed++;
    }

    if (fixedStepAccumulatorMs >= stepMs) {
      // Drop stale backlog to avoid a catch-up spiral while preserving the latest remainder.
      fixedStepAccumulatorMs %= stepMs;
    }

    scheduleFixedStepLoop();
  }

  // Handle resize - need to re-evaluate component for new dimensions
  // Also invalidate cached cell size so image render planning uses fresh dimensions
  const handleResize = () => {
    if (!isUnmounted) {
      invalidateCellSize();
      scheduleRenderCallback(evaluateAndRender);
    }
  };

  stdout.on('resize', handleResize);

  // Cleanup on exit
  appContext.onExit((error) => runInRuntimeScope(runtimeScope, () => {
    cleanup();
    disposeRender();
    if (error) {
      rejectExit(error);
    } else {
      resolveExit();
    }
  }));

  /**
   * Perform actual render
   */
  function doRender(): void {
    if (isUnmounted || !currentNode) return;

    lastRenderTime = Date.now();
    const runtimeStartAt = pendingRuntimeStartAt ?? Date.now();

    const width = stdout.columns || 80;
    const height = stdout.rows || 24;

    // Delta renderer path: optimized cell-level updates
    if (deltaRenderer && !debug) {
      const frame = createFrameSnapshot(currentNode, { width, height }, PRODUCTION_FRAME_OPTIONS);
      frame.metrics.runtimeStartAt = runtimeStartAt;
      if (pendingVNodeEvalMs !== undefined) {
        recordFramePhaseMetric(frame, 'vnodeEvalMs', pendingVNodeEvalMs);
      }
      const commitStart = performance.now();
      setCommittedFrameSnapshot(frame);

      // Register elements in hit-test registry for mouse events
      registerHitTestFromLayout(frame.layout);

      // Enable/disable mouse tracking based on clickable elements
      const hitTestRegistry = getHitTestRegistry();
      if (hitTestRegistry.hasClickableElements() && !mouseTrackingEnabled) {
        enableMouseTracking();
        mouseTrackingEnabled = true;
      } else if (!hitTestRegistry.hasClickableElements() && mouseTrackingEnabled) {
        disableMouseTracking();
        mouseTrackingEnabled = false;
      }
      recordFramePhaseMetric(frame, 'frameCommitMs', performance.now() - commitStart);
      recordFrameStructuralMetric(frame, 'reservedRegionCount', frame.reservedRegions.length);

      // Use delta renderer for optimized updates
      deltaRenderer.renderFrame(frame);
      pendingVNodeEvalMs = undefined;
      pendingRuntimeStartAt = undefined;
      return;
    }

    // Standard renderer path: string-based rendering
    // Separate static from interactive content
    const { staticNodes, interactiveNode } = separateStaticNodes(currentNode);
    const staticRenderStart = performance.now();
    beginOutputCapture();

    // Render new static content first (above interactive content)
    for (let i = 0; i < staticNodes.length; i++) {
      const staticNode = staticNodes[i];
      const staticId = getStaticNodeId(staticNode, i);

      if (!renderedStaticIds.has(staticId)) {
        // Render this static node
        const staticOutput = renderToString(staticNode, width);

        if (staticOutput.trim()) {
          // Clear the interactive area before writing static
          logUpdate.clear();

          // Write static content (it becomes permanent)
          writeOutput(staticOutput + '\n');
          staticLineCount += staticOutput.split('\n').length;

          if (staticLineCount !== logUpdateTopOffset) {
            logUpdateTopOffset = staticLineCount;
            logUpdate = createLogUpdate(outputStream, {
              showCursor,
              incremental: false,
              topOffset: logUpdateTopOffset,
            });
            lastOutput = '';
          }

          renderedStaticIds.add(staticId);
        }
      }
    }

    const previousFrame = getCommittedFrameSnapshot();
    const frame = createFrameSnapshot(interactiveNode, { width, height }, PRODUCTION_FRAME_OPTIONS);
    frame.metrics.runtimeStartAt = runtimeStartAt;
    if (pendingVNodeEvalMs !== undefined) {
      recordFramePhaseMetric(frame, 'vnodeEvalMs', pendingVNodeEvalMs);
    }
    const staticRenderMs = performance.now() - staticRenderStart;
    recordFramePhaseMetric(frame, 'staticRenderMs', staticRenderMs);
    const commitStart = performance.now();
    setCommittedFrameSnapshot(frame);

    // Register elements in hit-test registry for mouse events
    registerHitTestFromLayout(frame.layout);

    // Enable/disable mouse tracking based on clickable elements
    const hitTestRegistry = getHitTestRegistry();
    if (hitTestRegistry.hasClickableElements() && !mouseTrackingEnabled) {
      enableMouseTracking();
      mouseTrackingEnabled = true;
    } else if (!hitTestRegistry.hasClickableElements() && mouseTrackingEnabled) {
      disableMouseTracking();
      mouseTrackingEnabled = false;
    }
    recordFramePhaseMetric(frame, 'frameCommitMs', performance.now() - commitStart);
    recordFrameStructuralMetric(frame, 'reservedRegionCount', frame.reservedRegions.length);

    // Render interactive content
    const output = renderFrameToString(frame, {
      fullHeight,
      previousFrame,
    });

    if (output === lastOutput && !debug) {
      const outputCapture = endOutputCapture();
      recordFramePhaseMetric(frame, 'outputWriteMs', outputCapture.writeMs);
      recordFrameStructuralMetric(frame, 'outputByteCount', outputCapture.bytes);
      finalizeFrameRuntimeMetrics(frame, runtimeStartAt);
      recordCommittedFrame(frame, { renderer: 'ansi' });
      cleanLayoutTree(frame.layout);
      clearChanges();
      pendingVNodeEvalMs = undefined;
      pendingRuntimeStartAt = undefined;
      return; // No changes
    }

    if (debug) {
      // Debug mode: append output instead of replacing
      writeOutput(output + '\n');
    } else {
      // Use incremental log updater for efficient rendering
      logUpdate(output);
    }
    const outputCapture = endOutputCapture();
    recordFramePhaseMetric(frame, 'outputWriteMs', outputCapture.writeMs);
    recordFrameStructuralMetric(frame, 'outputByteCount', outputCapture.bytes);
    finalizeFrameRuntimeMetrics(frame, runtimeStartAt);
    recordCommittedFrame(frame, { renderer: 'ansi' });
    cleanLayoutTree(frame.layout);
    clearChanges();

    lastOutput = output;
    pendingVNodeEvalMs = undefined;
    pendingRuntimeStartAt = undefined;
  }

  /**
   * Cleanup resources
   */
  function cleanup(): void {
    return runInRuntimeScope(runtimeScope, cleanupRuntime);
  }

  function cleanupRuntime(): void {
    if (isUnmounted) return;
    isUnmounted = true;

    if (renderTimer) {
      clearTimeout(renderTimer);
      renderTimer = null;
    }
    if (fixedStepTimer) {
      clearTimeout(fixedStepTimer);
      fixedStepTimer = null;
    }
    cleanupFixedStepFocus?.();
    cleanupFixedStepFocus = null;
    outputBackpressured = false;
    scheduledRenderCallback = null;
    scheduledRender = false;
    renderMicrotaskQueued = false;
    pendingRender = false;
    externalUpdateBatcher.cancel();
    externalUpdateQueue = [];
    setExternalUpdateIngress(null);

    // Disable mouse tracking if enabled
    if (mouseTrackingEnabled) {
      disableMouseTracking();
      mouseTrackingEnabled = false;
    }

    stdout.off('resize', handleResize);

    // Cleanup renderer
    if (deltaRenderer) {
      deltaRenderer.cleanup();
    } else {
      logUpdate.done(); // Restore cursor and cleanup
    }

    // Restore original screen buffer
    if (alternateScreen) {
      stdout.write(disableAlternateScreen());
    }

    resetHookState(runtimeScope); // Clear all hook state and owned resources
    appContext.dispose();
    for (const unregister of unregisterPanicCleanups.splice(0)) {
      unregister();
    }
    releasePanicHooks();
    clearCommittedFrameSnapshot();
    endAppRenderSession();
    destroyRuntimeScope(runtimeScope);
  }

  // Create reactive render effect
  // This will re-run whenever any signal used in the component changes
  const disposeRender = createEffect(
    () => {
      // Call componentFn inside the effect to track signal dependencies.
      // Re-runs are scheduler-driven so bursty invalidations can collapse to one frame.
      evaluateAndRender();
    },
    {
      scheduler: scheduleRenderCallback,
    }
  );

  if (fixedStep) {
    fixedStepLastAt = Date.now();
    if ((fixedStep.pauseWhenUnfocused ?? true)) {
      cleanupFixedStepFocus = onTerminalFocusChange((focused) => {
        if (isUnmounted || !fixedStep) {
          return;
        }

        if (!focused) {
          if (fixedStepTimer) {
            clearTimeout(fixedStepTimer);
            fixedStepTimer = null;
          }
          fixedStepAccumulatorMs = 0;
          fixedStepLastAt = Date.now();
          return;
        }

        fixedStepAccumulatorMs = 0;
        fixedStepLastAt = Date.now();
        if (!fixedStepTimer) {
          scheduleFixedStepLoop();
        }
      });
    }
    scheduleFixedStepLoop();
  }

  return {
    rerender: (newNode: VNode) => runInRuntimeScope(runtimeScope, () => {
      componentFn = () => newNode;
      scheduleRenderCallback(evaluateAndRender);
    }),

    unmount: () => runInRuntimeScope(runtimeScope, () => {
      cleanup();
      disposeRender();

      // Final render
      if (!debug) {
        writeOutput('\n');
      }

      resolveExit();
    }),

    waitUntilExit: () => exitPromise,

    clear: () => runInRuntimeScope(runtimeScope, () => {
      if (!debug) {
        if (renderTimer) {
          clearTimeout(renderTimer);
          renderTimer = null;
        }
        scheduledRenderCallback = null;
        scheduledRender = false;
        renderMicrotaskQueued = false;
        pendingRender = false;
        logUpdate.clear();
        writeOutput(ansi.clearTerminal);
        lastOutput = '';
        if (outputBackpressured) {
          scheduleRenderCallback(() => {
            doRender();
          });
        } else {
          doRender();
        }
      }
    }),
  };
}

/**
 * Render once and return the string (no interactivity)
 *
 * @example
 * const output = renderOnce(MyComponent());
 * console.log(output);
 */
export function renderOnce(node: VNode, width?: number): string {
  return renderToString(node, width ?? process.stdout.columns ?? 80);
}
