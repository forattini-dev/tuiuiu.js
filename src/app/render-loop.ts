/**
 * Tuiuiu App - Main render loop and app lifecycle
 *
 * This is the entry point for Tuiuiu applications
 */

import type { VNode, BoxStyle } from '../utils/types.js';
import { renderToString, renderFrameToString } from '../core/renderer.js';
import { batch, createEffect } from '../primitives/signal.js';
import { initializeApp, cleanupApp, enableMouseTracking, disableMouseTracking, setClearScreen } from '../hooks/index.js';
import { beginRender, endRender, resetHookState } from '../hooks/context.js';
import { createLogUpdate, type LogUpdate } from '../utils/log-update.js';
import { getHitTestRegistry, registerHitTestFromLayout } from '../core/hit-test.js';
import { createDeltaRenderer, type DeltaRenderer } from '../core/delta-render.js';
import {
  clearCommittedFrameSnapshot,
  createFrameSnapshot,
  getCommittedFrameSnapshot,
  setCommittedFrameSnapshot,
} from '../core/frame.js';

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
    maxFps = 30,
    clearOnStart = true,
    showCursor = false,
    autoTabNavigation = true,
    fullHeight = false,
    useDeltaRenderer = true,
    fixedStep,
  } = options;

  // Initialize app context FIRST (before calling component functions)
  const appContext = initializeApp(stdin, stdout, { autoTabNavigation });

  // Store the component function for re-evaluation
  const componentFn = typeof nodeOrFn === 'function' ? nodeOrFn : () => nodeOrFn;

  let outputBackpressured = false;

  const handleOutputDrain = () => {
    outputBackpressured = false;
    pendingRender = scheduledRenderCallback !== null;
    schedulePendingRenderCallback();
  };

  const writeOutput = (chunk: string | Uint8Array): boolean => {
    const canWrite = stdout.write(chunk as any);

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
  let lastRenderTime = 0;
  let pendingRender = false;
  let scheduledRender = false;
  let renderTimer: ReturnType<typeof setTimeout> | null = null;
  let scheduledRenderCallback: (() => void) | null = null;
  let fixedStepTimer: ReturnType<typeof setTimeout> | null = null;
  let fixedStepAccumulatorMs = 0;
  let fixedStepLastAt = 0;
  let fixedStepCount = 0;
  let fixedStepElapsedMs = 0;

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

  const evaluateTree = () => {
    beginRender();
    currentNode = componentFn();
    endRender();
  };

  const evaluateAndRender = () => {
    evaluateTree();
    doRender();
  };

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
    const delay = lastRenderTime === 0 || elapsed >= minRenderInterval ? 0 : minRenderInterval - elapsed;

    scheduledRender = true;
    pendingRender = delay > 0;
    renderTimer = setTimeout(() => {
      const flush = scheduledRenderCallback;
      scheduledRenderCallback = null;
      scheduledRender = false;
      pendingRender = false;
      renderTimer = null;

      if (!isUnmounted) {
        flush?.();
      }
    }, delay);
  }

  function scheduleFixedStepLoop(): void {
    if (!fixedStep || isUnmounted) {
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
  const handleResize = () => {
    if (!isUnmounted) {
      scheduleRenderCallback(evaluateAndRender);
    }
  };

  stdout.on('resize', handleResize);

  // Cleanup on exit
  appContext.onExit(() => {
    cleanup();
  });

  /**
   * Perform actual render
   */
  function doRender(): void {
    if (isUnmounted || !currentNode) return;

    lastRenderTime = Date.now();

    const width = stdout.columns || 80;
    const height = stdout.rows || 24;

    // Delta renderer path: optimized cell-level updates
    if (deltaRenderer && !debug) {
      const frame = createFrameSnapshot(currentNode, { width, height }, PRODUCTION_FRAME_OPTIONS);
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

      // Use delta renderer for optimized updates
      deltaRenderer.renderFrame(frame);
      return;
    }

    // Standard renderer path: string-based rendering
    // Separate static from interactive content
    const { staticNodes, interactiveNode } = separateStaticNodes(currentNode);

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

    // Render interactive content
    const output = renderFrameToString(frame, {
      fullHeight,
      previousFrame,
    });

    if (output === lastOutput && !debug) {
      return; // No changes
    }

    if (debug) {
      // Debug mode: append output instead of replacing
      writeOutput(output + '\n');
    } else {
      // Use incremental log updater for efficient rendering
      logUpdate(output);
    }

    lastOutput = output;
  }

  /**
   * Cleanup resources
   */
  function cleanup(): void {
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
    outputBackpressured = false;
    scheduledRenderCallback = null;
    scheduledRender = false;
    pendingRender = false;

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

    resetHookState(); // Clear all hook state
    cleanupApp();
    clearCommittedFrameSnapshot();
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
    scheduleFixedStepLoop();
  }

  return {
    rerender: (newNode: VNode) => {
      currentNode = newNode;
      scheduleRenderCallback(() => {
        doRender();
      });
    },

    unmount: () => {
      cleanup();
      disposeRender();

      // Final render
      if (!debug) {
        writeOutput('\n');
      }

      resolveExit();
    },

    waitUntilExit: () => exitPromise,

    clear: () => {
      if (!debug) {
        if (renderTimer) {
          clearTimeout(renderTimer);
          renderTimer = null;
        }
        scheduledRenderCallback = null;
        scheduledRender = false;
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
    },
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
