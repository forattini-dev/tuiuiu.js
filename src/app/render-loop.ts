/**
 * Tuiuiu App - Main render loop and app lifecycle
 *
 * This is the entry point for Tuiuiu applications
 */

import type { VNode } from '../utils/types.js';
import { renderToString, renderFrameToString } from '../core/renderer.js';
import { batch, createEffect } from '../primitives/signal.js';
import {
  initializeApp,
  enableMouseTracking,
  disableMouseTracking,
  setClearScreen,
  setOutputWriter,
  setExternalUpdateIngress,
} from '../hooks/index.js';
import { enableAlternateScreen, disableAlternateScreen } from '../core/input.js';
import {
  beginRender,
  abortRender,
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
  getCommittedFrameSnapshot,
  recordFramePhaseMetric,
  recordFrameStructuralMetric,
  type FrameSnapshot,
} from '../core/frame.js';
import { cleanLayoutTree, clearChanges } from '../core/dirty.js';
import { onTerminalFocusChange, readTerminalFocus } from '../core/terminal-focus.js';
import { invalidateCellSize } from '../core/graphics.js';
import {
  activateProductionFrame,
  commitProductionFrame,
  createProductionFrameSnapshot,
} from '../core/frame-lifecycle.js';
import { configureMotionRuntime } from '../core/motion-runtime.js';
import { installPanicHooks, onTerminalPanic } from '../core/terminal-panic.js';
import { refreshCapabilities } from '../core/capabilities.js';
import {
  bindRuntimeScope,
  destroyRuntimeScope,
  runInRuntimeScope,
} from '../core/runtime-scope.js';
import { sanitizeTerminalText } from '../utils/terminal-sanitize.js';
import {
  disposeReactiveVNodes,
  refreshReactiveVNodes,
} from '../primitives/computed-node.js';
import { Box } from '../primitives/nodes.js';
import { getOverlayHost } from '../interaction/overlay.js';
import { OverlayHostView } from '../organisms/overlay-host.js';
import { createVNodePromptRenderer } from '../organisms/prompt-host.js';
import { getPromptHost } from '../interaction/prompt.js';
import { getInteractionRuntime } from '../interaction/runtime.js';
import type { InteractionRuntime } from '../interaction/runtime.js';
import type { OverlayHost } from '../interaction/overlay.js';
import type { PromptHost } from '../interaction/prompt.js';
import {
  createContributionHost,
  type ContributionHost,
  type SlotDefinition,
  type SlotMap,
} from './contributions.js';
import {
  focusElement,
  focusNext,
  focusPrevious,
  blurFocus,
  getActiveId,
  onFocusChange,
  type FocusZoneEventData,
} from '../core/focus.js';

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
  if (typeof props.__staticId !== 'string' || props.__staticId.length === 0) {
    throw new Error(
      `[tuiuiu] Static node ${index} is missing renderer-owned identity. Use Static() or AppendList().`,
    );
  }
  return props.__staticId;
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

export interface RenderOptions<TSlots extends SlotMap = SlotMap> {
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
  /** Maximum FPS for background render throttling (default: 60). Input bypasses this cap. */
  maxFps?: number;
  /** Show the hardware cursor at the active CursorAnchor (default: false). */
  showHardwareCursor?: boolean;
  /** Enable automatic Tab/Shift+Tab navigation (default: true) */
  autoTabNavigation?: boolean;
  /** Use delta renderer for optimized cell-level updates (default: true).
   *  When enabled, only changed cells are redrawn instead of the entire screen.
   *  Set to false if you need Static component support or encounter rendering issues. */
  useDeltaRenderer?: boolean;
  /** Terminal ownership mode (default: alternate). */
  screen?: ScreenMode;
  /** Type declaration for application contribution slots. */
  slots?: SlotDefinition<TSlots>;
  /** Receives isolated host and contribution failures. */
  onError?: (error: unknown) => void;
  /** Optional fixed-step update loop for game-like workloads.
   *  Updates run at a fixed cadence while presentation remains capped by `maxFps`. */
  fixedStep?: FixedStepOptions;
}

/**
 * Terminal region used by the interactive renderer.
 *
 * - `inline`: keep scrollback; do not clear; render only content height
 * - `fullscreen`: use the primary buffer, clear it, and fill its height
 * - `alternate`: use the alternate buffer, clear it, and fill its height
 */
export type ScreenMode = 'inline' | 'fullscreen' | 'alternate';

interface ScreenPreset {
  clearOnStart: boolean;
  fullHeight: boolean;
  alternateScreen: boolean;
}

const SCREEN_PRESETS: Record<ScreenMode, ScreenPreset> = {
  inline: {
    clearOnStart: false,
    fullHeight: false,
    alternateScreen: false,
  },
  fullscreen: {
    clearOnStart: true,
    fullHeight: true,
    alternateScreen: false,
  },
  alternate: {
    clearOnStart: true,
    fullHeight: true,
    alternateScreen: true,
  },
};

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

export interface FocusHost {
  focus(id: string): boolean;
  next(): boolean;
  previous(): boolean;
  blur(): void;
  activeId(): string | null;
  subscribe(listener: (event: FocusZoneEventData) => void): () => void;
}

export interface AppHandle<TSlots extends SlotMap = SlotMap> {
  /** Unmount the app */
  unmount: () => void;
  /** Wait for the app to exit */
  waitUntilExit: () => Promise<void>;
  /** Clear the output */
  clear: () => void;
  /**
   * Write trusted application text above the live UI. Unsafe terminal control
   * protocols are stripped while SGR color sequences are preserved.
   */
  writeLine: (text: string) => void;
  /** Explicitly invalidate the application. Urgent invalidation bypasses the FPS cap. */
  invalidate: (priority?: 'normal' | 'urgent') => void;
  readonly commands: InteractionRuntime;
  readonly focus: FocusHost;
  readonly overlays: OverlayHost<VNode | null>;
  readonly prompts: PromptHost;
  readonly contributions: ContributionHost<TSlots>;
}

/**
 * Render a Tuiuiu app to the terminal
 *
 * @example
 * const { waitUntilExit } = render(() => App());
 * await waitUntilExit();
 */
export function render<TSlots extends SlotMap = SlotMap>(
  nodeOrFn: VNode | (() => VNode),
  options: RenderOptions<TSlots> = {},
): AppHandle<TSlots> {
  const screenPreset = SCREEN_PRESETS[options.screen ?? 'alternate'];
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
    maxFps = 60,
    showHardwareCursor = false,
    autoTabNavigation = true,
    useDeltaRenderer = true,
    fixedStep,
  } = options;
  const { clearOnStart, fullHeight, alternateScreen } = screenPreset;

  if (!Number.isFinite(maxFps) || maxFps < 0) {
    throw new Error('[tuiuiu] maxFps must be a finite non-negative number');
  }
  if (fixedStep) {
    if (!Number.isFinite(fixedStep.updateFps) || fixedStep.updateFps <= 0) {
      throw new Error('[tuiuiu] fixedStep.updateFps must be a finite positive number');
    }
    if (
      fixedStep.maxCatchUpUpdates !== undefined
      && (!Number.isSafeInteger(fixedStep.maxCatchUpUpdates) || fixedStep.maxCatchUpUpdates < 1)
    ) {
      throw new Error(
        '[tuiuiu] fixedStep.maxCatchUpUpdates must be a positive safe integer',
      );
    }
  }

  // Initialize app context FIRST (before calling component functions)
  const appContext = initializeApp(stdin, stdout, {
    autoTabNavigation,
    exitOnCtrlC,
    exitProcess,
    maxPasteBytes,
    maxPendingEscapeBytes,
    escapeSequenceTimeoutMs,
    pasteTimeoutMs,
    onInteraction: () => requestUrgentRender(),
  });
  const resolvedRuntimeScope = getRuntimeScopeForApp(appContext);
  if (!resolvedRuntimeScope) {
    appContext.dispose();
    throw new Error('[tuiuiu] Failed to create the app runtime scope');
  }
  const runtimeScope = resolvedRuntimeScope;
  const interactionRuntime = runInRuntimeScope(runtimeScope, getInteractionRuntime);
  const promptHost = runInRuntimeScope(runtimeScope, getPromptHost);
  const contributionHost = createContributionHost<TSlots>({
    onError: (error) => options.onError?.(error),
  });
  const focusHost: FocusHost = {
    focus: (id) => runInRuntimeScope(runtimeScope, () => focusElement(id)),
    next: () => runInRuntimeScope(runtimeScope, focusNext),
    previous: () => runInRuntimeScope(runtimeScope, focusPrevious),
    blur: () => runInRuntimeScope(runtimeScope, blurFocus),
    activeId: () => runInRuntimeScope(runtimeScope, getActiveId),
    subscribe: (listener) => runInRuntimeScope(runtimeScope, () => onFocusChange(listener)),
  };
  // Install centralized panic hooks to restore terminal on crash
  let releasePanicHooks: () => void = () => {};
  const unregisterPanicCleanups: Array<() => void> = [];
  try {
    releasePanicHooks = installPanicHooks();
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
  } catch (error) {
    for (const unregister of unregisterPanicCleanups.splice(0)) {
      try {
        unregister();
      } catch {
        // Preserve the original startup error.
      }
    }
    try {
      releasePanicHooks();
    } catch {
      // Preserve the original startup error.
    }
    appContext.dispose();
    destroyRuntimeScope(runtimeScope);
    throw error;
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

    if (!canWrite && !outputBackpressured && !isUnmounted) {
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
    showCursor: false,
    incremental: false,
    fullScreen: fullHeight, // Use simple clear-and-redraw for fullHeight mode
    topOffset: 0,
  });
  let logUpdateTopOffset = 0;

  // State
  let currentNode: VNode | null = null;
  let lastOutput = '';
  let ansiHardwareCursorVisible = false;
  let isUnmounted = false;
  let pendingOutputLines: string[] = [];

  let exitPromise: Promise<void>;
  let resolveExit: () => void;
  let rejectExit: (error: Error) => void;

  // Static content tracking
  const renderedStaticIds = new Set<string>();
  let staticLineCount = 0; // Track how many lines of static content we've written

  const recreateLogUpdate = (): void => {
    logUpdateTopOffset = staticLineCount;
    logUpdate = createLogUpdate(outputStream, {
      showCursor: false,
      incremental: false,
      fullScreen: fullHeight,
      topOffset: logUpdateTopOffset,
    });
    lastOutput = '';
  };

  const resetOutputState = (): void => {
    logUpdate.clear();
    writeOutput(ansi.clearTerminal);
    lastOutput = '';
    renderedStaticIds.clear();
    staticLineCount = 0;
    pendingOutputLines = [];
    recreateLogUpdate();
  };

  const appendPermanentOutput = (text: string): void => {
    logUpdate.clear();
    writeOutput(`${text}\n`);
    staticLineCount += text.split('\n').length;
    recreateLogUpdate();
  };

  // Expose clearScreen to app context for splash->main transitions.
  runInRuntimeScope(runtimeScope, () => setClearScreen(resetOutputState));

  // Create exit promise
  exitPromise = new Promise((resolve, reject) => {
    resolveExit = resolve;
    rejectExit = reject;
  });

  // AppContext.dispose() is public and may be called directly by an embedded
  // host. Route that path through render cleanup as well, so waitUntilExit()
  // never remains pending and renderer-owned listeners are not orphaned.
  const disposeAppContext = appContext.dispose;
  appContext.dispose = () => {
    if (isUnmounted) {
      disposeAppContext();
      return;
    }
    cleanup();
    resolveExit();
  };

  // Throttle rendering
  const minRenderInterval = maxFps > 0 ? Math.ceil(1000 / maxFps) : 0;
  runInRuntimeScope(runtimeScope, () => {
    configureMotionRuntime({
      targetFps: maxFps > 0 ? maxFps : 60,
      reducedFps: maxFps > 0 ? Math.max(1, Math.floor(maxFps / 2)) : 30,
      frameBudgetMs: minRenderInterval > 0 ? minRenderInterval : 16.67,
    });
  });
  let lastRenderTime = 0;
  let scheduledRender = false;
  let scheduledRenderUrgent = false;
  let renderTimer: ReturnType<typeof setTimeout> | null = null;
  let scheduledRenderCallback: (() => void) | null = null;
  let fixedStepTimer: ReturnType<typeof setTimeout> | null = null;
  let fixedStepAccumulatorMs = 0;
  let fixedStepLastAt = 0;
  let fixedStepCount = 0;
  let fixedStepElapsedMs = 0;
  let cleanupFixedStepFocus: (() => void) | null = null;
  let externalUpdateQueue: Array<() => void> = [];
  const overlayHost = runInRuntimeScope(
    runtimeScope,
    () => getOverlayHost<VNode | null>(),
  );
  overlayHost.setViewport(stdout.columns || 80, stdout.rows || 24);
  const unsubscribeOverlayHost = overlayHost.subscribe(() => {
    scheduleRenderCallback(evaluateAndRender);
  });
  const unsubscribeContributions = contributionHost.subscribe(() => {
    scheduleRenderCallback(evaluateAndRender);
  });
  const promptRendererRegistration = runInRuntimeScope(runtimeScope, () => (
    promptHost.setRenderer(createVNodePromptRenderer(overlayHost, interactionRuntime))
  ));

  // Mouse tracking state
  let mouseTrackingEnabled = false;

  // Delta renderer (optional, for optimized cell-level updates)
  let deltaRenderer: DeltaRenderer | null = null;
  if (useDeltaRenderer) {
    deltaRenderer = createDeltaRenderer({
      stdout: outputStream,
      showHardwareCursor,
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
  runInRuntimeScope(runtimeScope, () => setExternalUpdateIngress({
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
  }));

  const evaluateTree = () => {
    const evalStart = performance.now();
    pendingRuntimeStartAt = Date.now();
    beginRender('component');
    let committed = false;
    try {
      const appNode = componentFn();
      currentNode = overlayHost.snapshot().entries.length === 0
        ? appNode
        : Box(
            { position: 'relative', width: 'fill', height: 'fill' },
            appNode,
            OverlayHostView({ host: overlayHost }),
          );
      refreshReactiveVNodes(currentNode);
      committed = true;
    } finally {
      if (committed) endRender();
      else abortRender();
      pendingVNodeEvalMs = performance.now() - evalStart;
    }
  };

  const evaluateAndRender = () => runInRuntimeScope(runtimeScope, () => {
    evaluateTree();
    doRender();
  });

  /**
   * Schedule a render callback (with throttling and latest-state wins semantics)
   */
  function scheduleRenderCallback(
    callback: () => void,
    priority: 'normal' | 'urgent' = 'normal',
  ): void {
    if (isUnmounted) return;

    scheduledRenderCallback = callback;
    if (priority === 'urgent') {
      scheduledRenderUrgent = true;
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
        scheduledRender = false;
      }
    }

    if (outputBackpressured) {
      return;
    }

    schedulePendingRenderCallback();
  }

  /**
   * Input promotes an already scheduled reactive flush instead of replacing it.
   * Replacing an Effect flush would leave the effect marked as scheduled and
   * permanently disconnect later asynchronous state updates from rendering.
   */
  function requestUrgentRender(): void {
    if (!scheduledRenderCallback) {
      scheduleRenderCallback(evaluateAndRender, 'urgent');
      return;
    }

    scheduledRenderUrgent = true;
    if (renderTimer) {
      clearTimeout(renderTimer);
      renderTimer = null;
      scheduledRender = false;
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
      scheduledRenderUrgent || lastRenderTime === 0 || elapsed >= minRenderInterval
        ? 0
        : minRenderInterval - elapsed;

    const flushScheduledRender = () => {
      const flush = scheduledRenderCallback;
      scheduledRenderCallback = null;
      scheduledRender = false;
      scheduledRenderUrgent = false;
      renderTimer = null;

      if (!isUnmounted) {
        try {
          flush?.();
        } catch (error) {
          appContext.exit(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }
    };

    scheduledRender = true;

    if (delay === 0) {
      queueMicrotask(flushScheduledRender);
      return;
    }

    renderTimer = setTimeout(flushScheduledRender, delay);
  }

  const writeLine = (text: string): void => runInRuntimeScope(runtimeScope, () => {
    if (isUnmounted) {
      return;
    }

    const safeText = sanitizeTerminalText(String(text))
      .replace(/\r\n?/g, '\n')
      .replace(/\n+$/u, '');
    pendingOutputLines.push(safeText);
    scheduleRenderCallback(doRender);
  });

  runInRuntimeScope(runtimeScope, () => setOutputWriter(writeLine));

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

    try {
      const pauseWhenUnfocused = fixedStep.pauseWhenUnfocused ?? true;
      if (pauseWhenUnfocused && !readTerminalFocus()) {
        fixedStepTimer = null;
        fixedStepAccumulatorMs = 0;
        fixedStepLastAt = Date.now();
        return;
      }

      const stepMs = 1000 / fixedStep.updateFps;
      const maxCatchUpUpdates = fixedStep.maxCatchUpUpdates ?? 5;
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
    } catch (error) {
      fixedStepTimer = null;
      appContext.exit(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // Handle resize - need to re-evaluate component for new dimensions
  // Also invalidate cached cell size so image render planning uses fresh dimensions
  const handleResize = bindRuntimeScope(runtimeScope, () => {
    if (!isUnmounted) {
      refreshCapabilities();
      overlayHost.setViewport(stdout.columns || 80, stdout.rows || 24);
      invalidateCellSize();
      scheduleRenderCallback(evaluateAndRender);
    }
  });

  stdout.on('resize', handleResize);

  // Defined before the exit callback because a component may call app.exit()
  // during its first synchronous evaluation.
  let disposeRender: () => void = () => {};

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
    const terminalHeight = stdout.rows || 24;
    const staticSeparation = separateStaticNodes(currentNode);
    const switchToPermanentOutputRenderer = () => {
      if (!deltaRenderer) return;
      deltaRenderer.cleanup();
      deltaRenderer = null;
      writeOutput(ansi.clearTerminal);
      renderedStaticIds.clear();
      staticLineCount = 0;
      recreateLogUpdate();
    };

    if (pendingOutputLines.length > 0) {
      // Delta rendering assumes ownership of absolute screen coordinates. A
      // permanent output region needs a vertical origin, so switch once to the
      // string renderer, which supports top offsets explicitly.
      switchToPermanentOutputRenderer();

      const lines = pendingOutputLines;
      pendingOutputLines = [];
      appendPermanentOutput(lines.join('\n'));
    }

    // Delta frames redraw a fixed viewport and therefore cannot preserve
    // append-only rows above it. Switch once, before the first Static batch,
    // to the renderer that owns a permanent-output region.
    if (staticSeparation.staticNodes.length > 0) {
      switchToPermanentOutputRenderer();
    }

    const height = Math.max(1, terminalHeight - staticLineCount);
    const positionAnsiHardwareCursor = (frame: FrameSnapshot): void => {
      const anchor = frame.cursorAnchor;
      if (!anchor) {
        if (ansiHardwareCursorVisible) {
          writeOutput('\x1b[?25l');
          ansiHardwareCursorVisible = false;
        }
        return;
      }
      writeOutput(
        `\x1b[${anchor.y + staticLineCount + 1};${anchor.x + 1}H`
        + (showHardwareCursor ? '\x1b[?25h' : '\x1b[?25l'),
      );
      ansiHardwareCursorVisible = showHardwareCursor;
    };

    // Delta renderer path: optimized cell-level updates
    if (deltaRenderer && !debug) {
      const frame = createProductionFrameSnapshot(currentNode, { width, height });
      frame.metrics.runtimeStartAt = runtimeStartAt;
      if (pendingVNodeEvalMs !== undefined) {
        recordFramePhaseMetric(frame, 'vnodeEvalMs', pendingVNodeEvalMs);
      }
      const commitStart = performance.now();
      activateProductionFrame(frame);

      // Register elements in hit-test registry for mouse events
      registerHitTestFromLayout(frame.layout, staticLineCount);

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
    const { staticNodes, interactiveNode } = staticSeparation;
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
          appendPermanentOutput(staticOutput);

          renderedStaticIds.add(staticId);
        }
      }
    }

    const previousFrame = getCommittedFrameSnapshot();
    const frame = createProductionFrameSnapshot(interactiveNode, { width, height });
    frame.metrics.runtimeStartAt = runtimeStartAt;
    if (pendingVNodeEvalMs !== undefined) {
      recordFramePhaseMetric(frame, 'vnodeEvalMs', pendingVNodeEvalMs);
    }
    const staticRenderMs = performance.now() - staticRenderStart;
    recordFramePhaseMetric(frame, 'staticRenderMs', staticRenderMs);
    const commitStart = performance.now();
    activateProductionFrame(frame);

    // Register elements in hit-test registry for mouse events
    registerHitTestFromLayout(frame.layout, staticLineCount);

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
      positionAnsiHardwareCursor(frame);
      const outputCapture = endOutputCapture();
      recordFramePhaseMetric(frame, 'outputWriteMs', outputCapture.writeMs);
      recordFrameStructuralMetric(frame, 'outputByteCount', outputCapture.bytes);
      commitProductionFrame(frame, { renderer: 'ansi', runtimeStartAt });
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
      positionAnsiHardwareCursor(frame);
    }
    const outputCapture = endOutputCapture();
    recordFramePhaseMetric(frame, 'outputWriteMs', outputCapture.writeMs);
    recordFrameStructuralMetric(frame, 'outputByteCount', outputCapture.bytes);
    commitProductionFrame(frame, { renderer: 'ansi', runtimeStartAt });
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
    const attempt = (operation: () => void): void => {
      try {
        operation();
      } catch (error) {
        console.error('[tuiuiu] Error while cleaning up the render loop:', error);
      }
    };

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
    attempt(unsubscribeOverlayHost);
    attempt(unsubscribeContributions);
    attempt(() => promptRendererRegistration.dispose());
    attempt(() => contributionHost.dispose());
    outputBackpressured = false;
    attempt(() => stdout.off('drain', handleOutputDrain));
    scheduledRenderCallback = null;
    scheduledRender = false;
    scheduledRenderUrgent = false;
    externalUpdateBatcher.cancel();
    externalUpdateQueue = [];
    setExternalUpdateIngress(null);
    setOutputWriter(null);

    // Disable mouse tracking if enabled
    if (mouseTrackingEnabled) {
      attempt(() => disableMouseTracking());
      mouseTrackingEnabled = false;
    }

    attempt(() => stdout.off('resize', handleResize));

    // Cleanup renderer
    if (deltaRenderer) {
      attempt(() => deltaRenderer?.cleanup());
    } else {
      attempt(() => logUpdate.done()); // Restore cursor and cleanup
    }

    // Restore original screen buffer
    if (alternateScreen) {
      attempt(() => {
        stdout.write(disableAlternateScreen());
      });
    }
    outputBackpressured = false;
    attempt(() => stdout.off('drain', handleOutputDrain));

    attempt(() => resetHookState(runtimeScope)); // Clear all hook state and owned resources
    if (currentNode) {
      attempt(() => disposeReactiveVNodes(currentNode!));
    }
    attempt(() => appContext.dispose());
    for (const unregister of unregisterPanicCleanups.splice(0)) {
      attempt(unregister);
    }
    attempt(releasePanicHooks);
    attempt(() => clearCommittedFrameSnapshot());
    attempt(() => destroyRuntimeScope(runtimeScope));
  }

  // Create reactive render effect
  // This will re-run whenever any signal used in the component changes
  try {
    disposeRender = runInRuntimeScope(
      runtimeScope,
      () => createEffect(
        () => {
          // Call componentFn inside the effect to track signal dependencies.
          // Re-runs are scheduler-driven so bursty invalidations can collapse to one frame.
          evaluateAndRender();
        },
        {
          scheduler: scheduleRenderCallback,
        },
      ),
    );

    runInRuntimeScope(runtimeScope, () => {
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
    });
  } catch (error) {
    try {
      disposeRender();
    } catch (disposeError) {
      console.error('[tuiuiu] Error while rolling back the render effect:', disposeError);
    }
    cleanup();
    throw error;
  }

  return {
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
        resetOutputState();
        if (outputBackpressured) {
          scheduleRenderCallback(() => {
            doRender();
          });
        } else {
          doRender();
        }
      }
    }),

    writeLine,
    invalidate: (priority = 'normal') => runInRuntimeScope(runtimeScope, () => {
      scheduleRenderCallback(evaluateAndRender, priority);
    }),
    commands: interactionRuntime,
    focus: focusHost,
    overlays: overlayHost,
    prompts: promptHost,
    contributions: contributionHost,
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
