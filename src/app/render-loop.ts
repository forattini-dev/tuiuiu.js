/**
 * Reck App - Main render loop and app lifecycle
 *
 * This is the entry point for Reck applications
 */

import type { VNode, BoxStyle, LayoutNode } from '../utils/types.js';
import { renderToString } from '../design-system/core/renderer.js';
import { calculateLayout } from '../design-system/core/layout.js';
import { createEffect } from '../primitives/signal.js';
import { initializeApp, cleanupApp, enableMouseTracking, disableMouseTracking } from '../hooks/index.js';
import { beginRender, endRender, resetHookState } from '../hooks/context.js';
import { createLogUpdate, type LogUpdate } from '../utils/log-update.js';
import { getHitTestRegistry, registerHitTestFromLayout } from '../core/hit-test.js';

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
}

export interface ReckInstance {
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
 * Render a Reck app to the terminal
 *
 * @example
 * const { waitUntilExit } = render(() => App());
 * await waitUntilExit();
 */
export function render(nodeOrFn: VNode | (() => VNode), options: RenderOptions = {}): ReckInstance {
  const {
    stdout = process.stdout,
    stdin = process.stdin,
    debug = false,
    exitOnCtrlC = true,
    maxFps = 30,
    clearOnStart = true,
    showCursor = false,
    autoTabNavigation = true,
  } = options;

  // Initialize app context FIRST (before calling component functions)
  const appContext = initializeApp(stdin, stdout, { autoTabNavigation });

  // Store the component function for re-evaluation
  const componentFn = typeof nodeOrFn === 'function' ? nodeOrFn : () => nodeOrFn;

  // Create log updater for efficient incremental rendering
  // Uses line-diffing to reduce flickering
  const logUpdate: LogUpdate = createLogUpdate(stdout, {
    showCursor,
    incremental: !debug, // Use incremental rendering unless in debug mode
  });

  // State
  let currentNode: VNode | null = null;
  let lastOutput = '';
  let isUnmounted = false;
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

  // Mouse tracking state
  let mouseTrackingEnabled = false;

  // Initial setup
  if (clearOnStart && !debug) {
    stdout.write(ansi.clearTerminal);
  }

  // Handle resize - need to re-evaluate component for new dimensions
  const handleResize = () => {
    if (!isUnmounted) {
      beginRender();
      currentNode = componentFn();
      endRender();
      scheduleRender();
    }
  };

  stdout.on('resize', handleResize);

  // Cleanup on exit
  appContext.onExit(() => {
    cleanup();
  });

  /**
   * Schedule a render (with throttling)
   */
  function scheduleRender(): void {
    if (pendingRender || isUnmounted) return;

    const now = Date.now();
    const elapsed = now - lastRenderTime;

    if (elapsed >= minRenderInterval) {
      doRender();
    } else {
      pendingRender = true;
      setTimeout(() => {
        pendingRender = false;
        if (!isUnmounted) {
          doRender();
        }
      }, minRenderInterval - elapsed);
    }
  }

  /**
   * Perform actual render
   */
  function doRender(): void {
    if (isUnmounted || !currentNode) return;

    lastRenderTime = Date.now();

    const width = stdout.columns || 80;
    const height = stdout.rows || 24;

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
          stdout.write(staticOutput + '\n');
          staticLineCount += staticOutput.split('\n').length;

          renderedStaticIds.add(staticId);
        }
      }
    }

    // Calculate layout for hit testing (use full screen dimensions)
    const layout = calculateLayout(interactiveNode, width, height);

    // Register elements in hit-test registry for mouse events
    registerHitTestFromLayout(layout);

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
    const output = renderToString(interactiveNode, width);

    if (output === lastOutput && !debug) {
      return; // No changes
    }

    if (debug) {
      // Debug mode: append output instead of replacing
      stdout.write(output + '\n');
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

    // Disable mouse tracking if enabled
    if (mouseTrackingEnabled) {
      disableMouseTracking();
      mouseTrackingEnabled = false;
    }

    stdout.off('resize', handleResize);
    logUpdate.done(); // Restore cursor and cleanup

    resetHookState(); // Clear all hook state
    cleanupApp();
  }

  // Create reactive render effect
  // This will re-run whenever any signal used in the component changes
  const disposeRender = createEffect(() => {
    // Call componentFn inside the effect to track signal dependencies
    // When any signal read during component evaluation changes, this effect re-runs
    beginRender();
    currentNode = componentFn();
    endRender();
    scheduleRender();
  });

  return {
    rerender: (newNode: VNode) => {
      currentNode = newNode;
      scheduleRender();
    },

    unmount: () => {
      cleanup();
      disposeRender();

      // Final render
      if (!debug) {
        stdout.write('\n');
      }

      resolveExit();
    },

    waitUntilExit: () => exitPromise,

    clear: () => {
      if (!debug) {
        logUpdate.clear();
        stdout.write(ansi.clearTerminal);
        lastOutput = '';
        doRender();
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
