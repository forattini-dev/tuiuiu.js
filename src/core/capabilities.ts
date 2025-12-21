/**
 * Terminal Capabilities Detection and ASCII Fallback System
 *
 * Auto-detects terminal capabilities and provides character sets
 * for both Unicode-capable and ASCII-only terminals.
 */

import { createSignal, untrack } from '../primitives/signal.js';

// =============================================================================
// Types
// =============================================================================

export type RenderMode = 'unicode' | 'ascii' | 'auto';
export type ColorSupport = 16 | 256 | 'truecolor';

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
export function detectTerminalCapabilities(): TerminalCapabilities {
  const env = process.env;
  const term = env.TERM || '';
  const colorTerm = env.COLORTERM || '';
  const termProgram = env.TERM_PROGRAM || '';
  const termProgramVersion = env.TERM_PROGRAM_VERSION || '';

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

  // Detect terminal name
  let terminalName = termProgram || term;
  if (termProgram === 'iTerm.app') {
    terminalName = `iTerm2 ${termProgramVersion}`;
  } else if (termProgram === 'Apple_Terminal') {
    terminalName = 'Terminal.app';
  } else if (env.WT_SESSION) {
    terminalName = 'Windows Terminal';
  } else if (env.KONSOLE_VERSION) {
    terminalName = 'Konsole';
  }

  // Detect Unicode support
  const unicode = !(
    term === 'linux' ||
    term === 'dumb' ||
    term.startsWith('vt') ||
    isCI
  );

  // Detect color support
  let colors: ColorSupport = 16;
  if (colorTerm === 'truecolor' || colorTerm === '24bit') {
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

  // Detect mouse support
  const mouse =
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

  // Detect italic support (most modern terminals)
  const italic =
    term.includes('xterm') ||
    term.includes('kitty') ||
    term.includes('alacritty') ||
    termProgram === 'iTerm.app' ||
    termProgram === 'Hyper';

  // Detect strikethrough support
  const strikethrough = italic; // Generally same terminals

  // Detect hyperlink support (OSC 8)
  const hyperlinks =
    termProgram === 'iTerm.app' ||
    term.includes('kitty') ||
    !!env.WT_SESSION ||
    (termProgram === 'vscode' && parseInt(termProgramVersion, 10) >= 1);

  // Get terminal size
  const columns = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;

  return {
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
  };
}

// =============================================================================
// Render Mode State
// =============================================================================

const [renderModeSignal, setRenderModeSignal] = createSignal<RenderMode>('auto');
let cachedCapabilities: TerminalCapabilities | null = null;

/**
 * Set the render mode
 */
export function setRenderMode(mode: RenderMode): void {
  setRenderModeSignal(mode);
}

/**
 * Get the current render mode setting
 */
export function getRenderModeSetting(): RenderMode {
  return renderModeSignal();
}

/**
 * Get the effective render mode (resolves 'auto')
 */
export function getRenderMode(): 'unicode' | 'ascii' {
  const mode = untrack(renderModeSignal);
  if (mode !== 'auto') return mode;

  const caps = getCapabilities();
  return caps.unicode ? 'unicode' : 'ascii';
}

/**
 * Get cached terminal capabilities
 */
export function getCapabilities(): TerminalCapabilities {
  if (!cachedCapabilities) {
    cachedCapabilities = detectTerminalCapabilities();
  }
  return cachedCapabilities;
}

/**
 * Refresh cached capabilities (e.g., after terminal resize)
 */
export function refreshCapabilities(): TerminalCapabilities {
  cachedCapabilities = detectTerminalCapabilities();
  return cachedCapabilities;
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
  // Always get fresh size
  return {
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
  };
}

// =============================================================================
// Process Resize Handler
// =============================================================================

type ResizeHandler = (size: { columns: number; rows: number }) => void;
const resizeHandlers: Set<ResizeHandler> = new Set();

/**
 * Subscribe to terminal resize events
 */
export function onResize(handler: ResizeHandler): () => void {
  resizeHandlers.add(handler);

  // Set up listener if this is the first handler
  if (resizeHandlers.size === 1) {
    process.stdout.on('resize', handleResize);
  }

  return () => {
    resizeHandlers.delete(handler);
    if (resizeHandlers.size === 0) {
      process.stdout.off('resize', handleResize);
    }
  };
}

function handleResize() {
  refreshCapabilities();
  const size = getTerminalSize();
  for (const handler of resizeHandlers) {
    handler(size);
  }
}
