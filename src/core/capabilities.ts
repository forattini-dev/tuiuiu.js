/**
 * Terminal Capabilities Detection and ASCII Fallback System
 *
 * Auto-detects terminal capabilities and provides character sets
 * for both Unicode-capable and ASCII-only terminals.
 */

import { createSignal, untrack } from '../primitives/signal.js';
import type { TerminalProfile, MultiplexerInfo, NotificationProtocol } from './terminal-profile.js';
import { detectTerminalProfile, detectMultiplexer } from './terminal-profile.js';
import { getProgressiveOverrides, getProgressiveVersion, hasNerdFonts } from './progressive.js';
import {
  getRuntimeResource,
  getDefaultRuntimeResource,
  getDefaultRuntimeScope,
  getRuntimeScope,
  RUNTIME_RESOURCE_DISPOSE,
  runInRuntimeScope,
  type RuntimeScope,
} from './runtime-scope.js';

// =============================================================================
// Types
// =============================================================================

export type RenderMode = 'unicode' | 'ascii' | 'auto';
export type ColorSupport = 16 | 256 | 'truecolor';

export interface TerminalCapabilitySource {
  /** Environment used for profile detection (default: process.env). */
  env?: NodeJS.ProcessEnv;
  /** Output stream that owns terminal dimensions and resize events. */
  stdout?: NodeJS.WriteStream;
}

export interface TerminalCapabilities {
  /** Terminal supports Unicode characters */
  unicode: boolean;
  /** Level of color support */
  colors: ColorSupport;
  /** Terminal supports mouse input */
  mouse: boolean;
  /** Terminal supports 24-bit (true color) */
  trueColor: boolean;
  /** Terminal supports italic text */
  italic: boolean;
  /** Terminal supports strikethrough */
  strikethrough: boolean;
  /** Terminal supports hyperlinks (OSC 8) */
  hyperlinks: boolean;
  /** Terminal name */
  terminalName: string;
  /** Is running in CI environment */
  isCI: boolean;
  /** Terminal width */
  columns: number;
  /** Terminal height */
  rows: number;

  // === Extended capabilities (Phase 1+) ===

  /** Detected terminal profile with known capabilities */
  profile?: TerminalProfile;
  /** Terminal supports synchronized output (DEC mode 2026) */
  synchronizedOutput?: boolean;
  /** Terminal supports styled underlines (curly, dotted, dashed) */
  styledUnderlines?: boolean;
  /** Terminal supports colored underlines (SGR 58) */
  coloredUnderlines?: boolean;
  /** Terminal supports clipboard via OSC 52 */
  clipboard?: boolean;
  /** Terminal notification protocol (OSC 9/99/777) or false */
  notifications?: NotificationProtocol | false;
  /** Multiplexer info if running inside tmux/screen/zellij */
  multiplexer?: MultiplexerInfo | null;
  /** Terminal supports cursor style control (DECSCUSR) */
  cursorStyleControl?: boolean;
  /** Terminal supports setting window title (OSC 0/2) */
  windowTitle?: boolean;
  /** Terminal is GPU-accelerated */
  gpuAccelerated?: boolean;
  /** Terminal supports Kitty keyboard protocol */
  kittyKeyboard?: boolean;
  /** Terminal supports focus in/out reporting */
  focusEvents?: boolean;
  /** Nerd Fonts available */
  nerdFonts?: boolean;
}

// =============================================================================
// Character Sets
// =============================================================================

export interface CharacterSet {
  // Sparkline characters (8 levels)
  sparkline: string;

  // Progress bar
  progressFilled: string;
  progressEmpty: string;
  progressPartial: string[];

  // Borders
  border: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
    horizontal: string;
    vertical: string;
    teeLeft: string;
    teeRight: string;
    teeUp: string;
    teeDown: string;
    cross: string;
  };

  // Rounded borders
  borderRound: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };

  // Tree connectors
  tree: {
    branch: string;
    last: string;
    pipe: string;
    dash: string;
    empty: string;
  };

  // Checkbox/Radio
  checkbox: {
    checked: string;
    unchecked: string;
    indeterminate: string;
  };
  radio: {
    selected: string;
    unselected: string;
  };

  // Switch/Toggle
  switch: {
    on: string;
    off: string;
    thumb: string;
  };

  // Arrows
  arrows: {
    up: string;
    down: string;
    left: string;
    right: string;
    upDown: string;
    leftRight: string;
  };

  // Expand/Collapse
  expand: {
    expanded: string;
    collapsed: string;
  };

  // Scrollbar
  scrollbar: {
    track: string;
    thumb: string;
  };

  // Bullets
  bullet: string;
  bulletHollow: string;

  // Ellipsis
  ellipsis: string;

  // Line drawing for charts
  chart: {
    horizontal: string;
    vertical: string;
    corner: {
      topLeft: string;
      topRight: string;
      bottomLeft: string;
      bottomRight: string;
    };
    point: string;
  };

  // Gauge
  gauge: {
    filled: string;
    empty: string;
    start: string;
    end: string;
  };

  // Spinner frames
  spinner: string[];
}

/**
 * Unicode character set (default)
 */
export const unicodeChars: CharacterSet = {
  sparkline: '▁▂▃▄▅▆▇█',

  progressFilled: '━',
  progressEmpty: '─',
  progressPartial: ['╸', '━'],

  border: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    teeLeft: '├',
    teeRight: '┤',
    teeUp: '┴',
    teeDown: '┬',
    cross: '┼',
  },

  borderRound: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
  },

  tree: {
    branch: '├──',
    last: '└──',
    pipe: '│  ',
    dash: '───',
    empty: '   ',
  },

  checkbox: {
    checked: '◉',
    unchecked: '○',
    indeterminate: '◐',
  },
  radio: {
    selected: '●',
    unselected: '○',
  },

  switch: {
    on: '●━━',
    off: '━━○',
    thumb: '●',
  },

  arrows: {
    up: '▲',
    down: '▼',
    left: '◀',
    right: '▶',
    upDown: '↕',
    leftRight: '↔',
  },

  expand: {
    expanded: '▼',
    collapsed: '▶',
  },

  scrollbar: {
    track: '│',
    thumb: '█',
  },

  bullet: '•',
  bulletHollow: '◦',

  ellipsis: '…',

  chart: {
    horizontal: '─',
    vertical: '│',
    corner: {
      topLeft: '╭',
      topRight: '╮',
      bottomLeft: '╰',
      bottomRight: '╯',
    },
    point: '●',
  },

  gauge: {
    filled: '█',
    empty: '░',
    start: '▐',
    end: '▌',
  },

  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
};

/**
 * ASCII-only character set
 */
export const asciiChars: CharacterSet = {
  sparkline: '_.-:=*#@',

  progressFilled: '=',
  progressEmpty: '-',
  progressPartial: ['>', '='],

  border: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
    teeLeft: '+',
    teeRight: '+',
    teeUp: '+',
    teeDown: '+',
    cross: '+',
  },

  borderRound: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
  },

  tree: {
    branch: '|--',
    last: '`--',
    pipe: '|  ',
    dash: '---',
    empty: '   ',
  },

  checkbox: {
    checked: '[x]',
    unchecked: '[ ]',
    indeterminate: '[-]',
  },
  radio: {
    selected: '(*)',
    unselected: '( )',
  },

  switch: {
    on: '[ON ]',
    off: '[OFF]',
    thumb: 'O',
  },

  arrows: {
    up: '^',
    down: 'v',
    left: '<',
    right: '>',
    upDown: '|',
    leftRight: '-',
  },

  expand: {
    expanded: 'v',
    collapsed: '>',
  },

  scrollbar: {
    track: '|',
    thumb: '#',
  },

  bullet: '*',
  bulletHollow: 'o',

  ellipsis: '...',

  chart: {
    horizontal: '-',
    vertical: '|',
    corner: {
      topLeft: '+',
      topRight: '+',
      bottomLeft: '+',
      bottomRight: '+',
    },
    point: '*',
  },

  gauge: {
    filled: '#',
    empty: '-',
    start: '[',
    end: ']',
  },

  spinner: ['|', '/', '-', '\\'],
};

// =============================================================================
// Capability Detection
// =============================================================================

/**
 * Detect terminal capabilities
 */
export function detectTerminalCapabilities(
  source: TerminalCapabilitySource = {},
): TerminalCapabilities {
  const env = source.env ?? process.env;
  const term = env.TERM || '';
  const colorTerm = env.COLORTERM || '';
  const termProgram = env.TERM_PROGRAM || '';
  const termProgramVersion = env.TERM_PROGRAM_VERSION || '';

  // Detect terminal profile and multiplexer
  const profile = detectTerminalProfile(env);
  const multiplexer = detectMultiplexer(env);
  const caps = profile.knownCaps;

  // Detect CI environment
  const isCI = !!(
    env.CI ||
    env.CONTINUOUS_INTEGRATION ||
    env.GITHUB_ACTIONS ||
    env.GITLAB_CI ||
    env.CIRCLECI ||
    env.TRAVIS ||
    env.JENKINS_URL ||
    env.BUILDKITE
  );

  // Detect terminal name (use profile name, with version if available)
  let terminalName = profile.name;
  if (profile.version) {
    terminalName = `${profile.name} ${profile.version}`;
  }
  // Fallback for unknown terminals
  if (profile.id === 'unknown') {
    terminalName = termProgram || term || 'Unknown';
  }

  // Detect Unicode support
  const unicode = !(
    term === 'linux' ||
    term === 'dumb' ||
    term.startsWith('vt') ||
    isCI
  );

  // Detect color support — use profile hint, then env var heuristics
  let colors: ColorSupport = 16;
  if (caps.trueColor || colorTerm === 'truecolor' || colorTerm === '24bit') {
    colors = 'truecolor';
  } else if (
    term.includes('256color') ||
    termProgram === 'iTerm.app' ||
    termProgram === 'Hyper' ||
    env.WT_SESSION
  ) {
    colors = 256;
  }
  // Override with FORCE_COLOR if set
  if (env.FORCE_COLOR === '0') {
    colors = 16;
  } else if (env.FORCE_COLOR === '3') {
    colors = 'truecolor';
  }

  // Detect mouse support — profile-aware + legacy heuristics
  const mouse =
    caps.mouse ||
    term.includes('xterm') ||
    term.includes('screen') ||
    term.includes('tmux') ||
    term.includes('rxvt') ||
    term.includes('kitty') ||
    term.includes('alacritty') ||
    termProgram === 'iTerm.app' ||
    termProgram === 'Hyper' ||
    !!env.WT_SESSION;

  // Detect true color
  const trueColor = colors === 'truecolor';

  // Detect italic support — profile-aware + legacy heuristics
  const italic =
    caps.italic ||
    term.includes('xterm') ||
    term.includes('kitty') ||
    term.includes('alacritty') ||
    termProgram === 'iTerm.app' ||
    termProgram === 'Hyper';

  // Detect strikethrough support
  const strikethrough = caps.strikethrough || italic;

  // Detect hyperlink support (OSC 8) — profile-aware + legacy
  const hyperlinks =
    caps.hyperlinks ||
    termProgram === 'iTerm.app' ||
    term.includes('kitty') ||
    !!env.WT_SESSION ||
    (termProgram === 'vscode' && parseInt(termProgramVersion, 10) >= 1);

  // Get terminal size
  const stdout = source.stdout ?? process.stdout;
  const columns = stdout.columns || 80;
  const rows = stdout.rows || 24;

  // Nerd Fonts detection
  const nerdFonts = hasNerdFonts();

  // Build extended capabilities from profile
  const result: TerminalCapabilities = {
    unicode,
    colors,
    mouse,
    trueColor,
    italic,
    strikethrough,
    hyperlinks,
    terminalName,
    isCI,
    columns,
    rows,
    // Extended capabilities
    profile,
    synchronizedOutput: caps.synchronizedOutput,
    styledUnderlines: caps.styledUnderlines,
    coloredUnderlines: caps.coloredUnderlines,
    clipboard: caps.clipboard,
    notifications: caps.notifications,
    multiplexer,
    cursorStyleControl: caps.cursorStyleControl,
    windowTitle: caps.windowTitle,
    gpuAccelerated: profile.gpuAccelerated,
    kittyKeyboard: caps.kittyKeyboard,
    focusEvents: caps.focusEvents,
    nerdFonts,
  };

  // Apply progressive overrides if configured
  const overrides = getProgressiveOverrides();
  if (overrides) {
    Object.assign(result, overrides);
  }

  return result;
}

// =============================================================================
// Render Mode State
// =============================================================================

type ResizeHandler = (size: { columns: number; rows: number }) => void;

interface CapabilityRuntimeState {
  renderModeSignal: () => RenderMode;
  setRenderModeSignal: (
    value: RenderMode | ((previous: RenderMode) => RenderMode)
  ) => void;
  cachedCapabilities: TerminalCapabilities | null;
  cachedProgressiveVersion: number;
  source: TerminalCapabilitySource;
  resizeHandlers: Set<ResizeHandler>;
  resizeListener: (() => void) | null;
  scope: RuntimeScope;
  [RUNTIME_RESOURCE_DISPOSE](): void;
}

const CAPABILITY_RUNTIME_STATE = Symbol('tuiuiu.capability-runtime-state');

function createCapabilityRuntimeState(scope: RuntimeScope): CapabilityRuntimeState {
  const inheritedMode = scope.id === 0
    ? 'auto'
    : untrack(
        getDefaultRuntimeResource(
          CAPABILITY_RUNTIME_STATE,
          () => createCapabilityRuntimeState(getDefaultRuntimeScope()),
        ).renderModeSignal,
      );
  const [renderModeSignal, setRenderModeSignal] =
    createSignal<RenderMode>(inheritedMode);
  const state: CapabilityRuntimeState = {
    renderModeSignal,
    setRenderModeSignal,
    cachedCapabilities: null,
    cachedProgressiveVersion: -1,
    source: {},
    resizeHandlers: new Set(),
    resizeListener: null,
    scope,
    [RUNTIME_RESOURCE_DISPOSE]() {
      const stdout = state.source.stdout ?? process.stdout;
      if (state.resizeListener) stdout.off('resize', state.resizeListener);
      state.resizeListener = null;
      state.resizeHandlers.clear();
    },
  };
  return state;
}

function getCapabilityRuntimeState(
  explicitScope?: RuntimeScope,
): CapabilityRuntimeState {
  const scope = getRuntimeScope(explicitScope);
  return getRuntimeResource(
    CAPABILITY_RUNTIME_STATE,
    () => createCapabilityRuntimeState(scope),
    scope,
  );
}

function readTerminalSize(
  state: CapabilityRuntimeState,
): { columns: number; rows: number } {
  const stdout = state.source.stdout ?? process.stdout;
  return {
    columns: stdout.columns || 80,
    rows: stdout.rows || 24,
  };
}

function detectForState(state: CapabilityRuntimeState): TerminalCapabilities {
  return detectTerminalCapabilities({
    env: state.source.env,
    stdout: state.source.stdout ?? process.stdout,
  });
}

function refreshCapabilityState(
  state: CapabilityRuntimeState,
): TerminalCapabilities {
  state.cachedCapabilities = detectForState(state);
  state.cachedProgressiveVersion = getProgressiveVersion();
  return state.cachedCapabilities;
}

function attachResizeListener(state: CapabilityRuntimeState): void {
  if (state.resizeListener || state.resizeHandlers.size === 0) return;
  const stdout = state.source.stdout ?? process.stdout;
  state.resizeListener = () => runInRuntimeScope(state.scope, () => {
    refreshCapabilityState(state);
    const size = readTerminalSize(state);
    for (const handler of [...state.resizeHandlers]) {
      handler(size);
    }
  });
  stdout.on('resize', state.resizeListener);
}

/**
 * Bind capability detection and resize subscriptions to the app's output
 * stream. Calling this again moves existing resize ownership to the new
 * stream and invalidates the per-runtime cache.
 */
export function configureTerminalCapabilitySource(
  source: TerminalCapabilitySource,
): void {
  const state = getCapabilityRuntimeState();
  const previousStdout = state.source.stdout ?? process.stdout;
  if (state.resizeListener) {
    previousStdout.off('resize', state.resizeListener);
    state.resizeListener = null;
  }
  state.source = { ...source };
  state.cachedCapabilities = null;
  state.cachedProgressiveVersion = -1;
  attachResizeListener(state);
}

/**
 * Set the render mode
 */
export function setRenderMode(mode: RenderMode): void {
  getCapabilityRuntimeState().setRenderModeSignal(mode);
}

/**
 * Get the current render mode setting
 */
export function getRenderModeSetting(): RenderMode {
  return getCapabilityRuntimeState().renderModeSignal();
}

/**
 * Get the effective render mode (resolves 'auto')
 */
export function getRenderMode(): 'unicode' | 'ascii' {
  const mode = untrack(getCapabilityRuntimeState().renderModeSignal);
  if (mode !== 'auto') return mode;

  const caps = getCapabilities();
  return caps.unicode ? 'unicode' : 'ascii';
}

/**
 * Get cached terminal capabilities
 */
export function getCapabilities(): TerminalCapabilities {
  const state = getCapabilityRuntimeState();
  const currentProgressiveVersion = getProgressiveVersion();
  if (
    !state.cachedCapabilities ||
    state.cachedProgressiveVersion !== currentProgressiveVersion
  ) {
    refreshCapabilityState(state);
  }
  return state.cachedCapabilities ?? refreshCapabilityState(state);
}

/**
 * Refresh cached capabilities (e.g., after terminal resize)
 */
export function refreshCapabilities(): TerminalCapabilities {
  return refreshCapabilityState(getCapabilityRuntimeState());
}

/**
 * Get the appropriate character set based on render mode
 */
export function getChars(): CharacterSet {
  return getRenderMode() === 'unicode' ? unicodeChars : asciiChars;
}

/**
 * Get a specific character, respecting render mode
 */
export function char<K extends keyof CharacterSet>(key: K): CharacterSet[K] {
  return getChars()[key];
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if terminal supports a specific capability
 */
export function supports(capability: keyof TerminalCapabilities): boolean {
  const caps = getCapabilities();
  const value = caps[capability];
  return typeof value === 'boolean' ? value : !!value;
}

/**
 * Check if terminal supports true color
 */
export function supportsTrueColor(): boolean {
  return getCapabilities().colors === 'truecolor';
}

/**
 * Check if terminal supports 256 colors
 */
export function supports256Colors(): boolean {
  const colors = getCapabilities().colors;
  return colors === 256 || colors === 'truecolor';
}

/**
 * Get terminal dimensions
 */
export function getTerminalSize(): { columns: number; rows: number } {
  return readTerminalSize(getCapabilityRuntimeState());
}

// =============================================================================
// Process Resize Handler
// =============================================================================

/**
 * Subscribe to terminal resize events
 */
export function onResize(handler: ResizeHandler): () => void {
  const state = getCapabilityRuntimeState();
  state.resizeHandlers.add(handler);
  attachResizeListener(state);

  return () => {
    state.resizeHandlers.delete(handler);
    if (state.resizeHandlers.size === 0 && state.resizeListener) {
      const stdout = state.source.stdout ?? process.stdout;
      stdout.off('resize', state.resizeListener);
      state.resizeListener = null;
    }
  };
}
