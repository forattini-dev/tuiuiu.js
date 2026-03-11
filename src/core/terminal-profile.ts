/**
 * Terminal Profile Database
 *
 * Static database of terminal emulators and their known capabilities.
 * Detection is sync and zero-cost (env var lookups only).
 *
 *
 */

// =============================================================================
// Types
// =============================================================================

export type TerminalId =
  | 'kitty'
  | 'alacritty'
  | 'ghostty'
  | 'wezterm'
  | 'rio'
  | 'warp'
  | 'foot'
  | 'contour'
  | 'hyper'
  | 'vscode'
  | 'iterm2'
  | 'terminal-app'
  | 'windows-terminal'
  | 'konsole'
  | 'gnome-terminal'
  | 'tilix'
  | 'terminology'
  | 'mlterm'
  | 'black-box'
  | 'bobcat'
  | 'st'
  | 'rxvt-unicode'
  | 'unknown';

export type MultiplexerType = 'tmux' | 'screen' | 'zellij';

export type NotificationProtocol = 'osc9' | 'osc99' | 'osc777';

export type UnderlineStyle = 'single' | 'double' | 'curly' | 'dotted' | 'dashed';

export type CursorStyle = 'block' | 'underline' | 'beam';

export interface MultiplexerInfo {
  type: MultiplexerType;
  version?: string;
  needsPassthrough: boolean;
}

export type GraphicsProtocolId = 'kitty' | 'iterm2' | 'sixel';

export interface KnownTerminalCaps {
  synchronizedOutput: boolean;
  styledUnderlines: boolean;
  coloredUnderlines: boolean;
  clipboard: boolean;
  notifications: NotificationProtocol | false;
  cursorStyleControl: boolean;
  windowTitle: boolean;
  kittyKeyboard: boolean;
  kittyGraphics: boolean;
  sixel: boolean;
  iterm2Graphics: boolean;
  /** Preferred graphics protocol (the most reliable one) */
  preferredGraphics: GraphicsProtocolId | false;
  hyperlinks: boolean;
  trueColor: boolean;
  mouse: boolean;
  italic: boolean;
  strikethrough: boolean;
  focusEvents: boolean;
  nerdFonts: false; // always runtime-detected
}

export interface TerminalProfile {
  id: TerminalId;
  name: string;
  version?: string;
  gpuAccelerated: boolean;
  knownCaps: KnownTerminalCaps;
}

// =============================================================================
// Default Caps (conservative baseline)
// =============================================================================

const DEFAULT_CAPS: KnownTerminalCaps = {
  synchronizedOutput: false,
  styledUnderlines: false,
  coloredUnderlines: false,
  clipboard: false,
  notifications: false,
  cursorStyleControl: false,
  windowTitle: false,
  kittyKeyboard: false,
  kittyGraphics: false,
  sixel: false,
  iterm2Graphics: false,
  preferredGraphics: false,
  hyperlinks: false,
  trueColor: false,
  mouse: false,
  italic: false,
  strikethrough: false,
  focusEvents: false,
  nerdFonts: false,
};

const COMMON_INTERACTIVE_CAPS: Pick<KnownTerminalCaps, 'mouse' | 'italic' | 'strikethrough'> = {
  mouse: true,
  italic: true,
  strikethrough: true,
};

// =============================================================================
// Terminal Capability Database
// =============================================================================

const TERMINAL_PROFILES: Record<TerminalId, Omit<TerminalProfile, 'version'>> = {
  kitty: {
    id: 'kitty',
    name: 'Kitty',
    gpuAccelerated: true,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      clipboard: true,
      notifications: 'osc99',
      cursorStyleControl: true,
      windowTitle: true,
      kittyKeyboard: true,
      kittyGraphics: true,
      preferredGraphics: 'kitty', // Reference Kitty protocol (requires 0.28.0+)
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  alacritty: {
    id: 'alacritty',
    name: 'Alacritty',
    gpuAccelerated: true,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      cursorStyleControl: true,
      windowTitle: true,
      // No graphics: sixel fork exists but won't merge, doesn't clear properly
      preferredGraphics: false,
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  ghostty: {
    id: 'ghostty',
    name: 'Ghostty',
    gpuAccelerated: true,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      clipboard: true,
      notifications: 'osc99',
      cursorStyleControl: true,
      windowTitle: true,
      kittyKeyboard: true,
      kittyGraphics: true,
      preferredGraphics: 'kitty', // Kitty with unicode placeholders, QA-verified
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  wezterm: {
    id: 'wezterm',
    name: 'WezTerm',
    gpuAccelerated: true,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      clipboard: true,
      notifications: 'osc9',
      cursorStyleControl: true,
      windowTitle: true,
      kittyKeyboard: true,
      // WezTerm supports all three protocols but only iTerm2 is bug-free.
      // Kitty/Sixel have known issues.
      kittyGraphics: false,
      sixel: false,
      iterm2Graphics: true,
      preferredGraphics: 'iterm2',
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  rio: {
    id: 'rio',
    name: 'Rio',
    gpuAccelerated: true,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      clipboard: true,
      cursorStyleControl: true,
      windowTitle: true,
      kittyKeyboard: true,
      // Rio supports iTerm2 (QA-verified) and Sixel (has glitches)
      iterm2Graphics: true,
      sixel: false, // glitchy
      preferredGraphics: 'iterm2',
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  warp: {
    id: 'warp',
    name: 'Warp',
    gpuAccelerated: true,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      cursorStyleControl: true,
      windowTitle: true,
      // Warp: iTerm2 doesn't clear, Kitty unicode-placeholders not implemented
      preferredGraphics: false,
      hyperlinks: true,
      trueColor: true,
    },
  },

  foot: {
    id: 'foot',
    name: 'Foot',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      clipboard: true,
      notifications: 'osc777',
      cursorStyleControl: true,
      windowTitle: true,
      kittyKeyboard: true,
      sixel: true,
      preferredGraphics: 'sixel', // QA-verified, Wayland
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  contour: {
    id: 'contour',
    name: 'Contour',
    gpuAccelerated: true,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      clipboard: true,
      cursorStyleControl: true,
      windowTitle: true,
      kittyKeyboard: true,
      sixel: false, // Does not clear graphics properly
      preferredGraphics: false,
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  hyper: {
    id: 'hyper',
    name: 'Hyper',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      cursorStyleControl: true,
      windowTitle: true,
      preferredGraphics: false,
      hyperlinks: true,
      trueColor: true,
    },
  },

  vscode: {
    id: 'vscode',
    name: 'VS Code Terminal',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      cursorStyleControl: true,
      windowTitle: true,
      preferredGraphics: false,
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  iterm2: {
    id: 'iterm2',
    name: 'iTerm2',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      clipboard: true,
      notifications: 'osc9',
      cursorStyleControl: true,
      windowTitle: true,
      iterm2Graphics: true,
      preferredGraphics: 'iterm2', // Reference iTerm2 protocol. Mac only.
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  'terminal-app': {
    id: 'terminal-app',
    name: 'Terminal.app',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      cursorStyleControl: true,
      windowTitle: true,
      preferredGraphics: false,
      trueColor: false,
    },
  },

  'windows-terminal': {
    id: 'windows-terminal',
    name: 'Windows Terminal',
    gpuAccelerated: true,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      cursorStyleControl: true,
      windowTitle: true,
      preferredGraphics: false,
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  konsole: {
    id: 'konsole',
    name: 'Konsole',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      synchronizedOutput: true,
      styledUnderlines: true,
      coloredUnderlines: true,
      clipboard: true,
      cursorStyleControl: true,
      windowTitle: true,
      sixel: false, // Not really fixed in 24.12
      preferredGraphics: false,
      hyperlinks: true,
      trueColor: true,
      focusEvents: true,
    },
  },

  'gnome-terminal': {
    id: 'gnome-terminal',
    name: 'GNOME Terminal',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      cursorStyleControl: true,
      windowTitle: true,
      preferredGraphics: false,
      hyperlinks: true,
      trueColor: true,
    },
  },

  tilix: {
    id: 'tilix',
    name: 'Tilix',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      notifications: 'osc777',
      cursorStyleControl: true,
      windowTitle: true,
      preferredGraphics: false,
      hyperlinks: true,
      trueColor: true,
    },
  },

  terminology: {
    id: 'terminology',
    name: 'Terminology',
    gpuAccelerated: true,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      cursorStyleControl: true,
      windowTitle: true,
      preferredGraphics: false,
      trueColor: true,
    },
  },

  mlterm: {
    id: 'mlterm',
    name: 'mlterm',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      cursorStyleControl: true,
      windowTitle: true,
      sixel: true,
      preferredGraphics: 'sixel', // QA-verified, slow but no glitches
      trueColor: true,
    },
  },

  'black-box': {
    id: 'black-box',
    name: 'Black Box',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      cursorStyleControl: true,
      windowTitle: true,
      // Sixel confirmed only in flatpak, most distro packages don't enable it
      sixel: true,
      preferredGraphics: 'sixel',
      trueColor: true,
    },
  },

  bobcat: {
    id: 'bobcat',
    name: 'Bobcat',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      cursorStyleControl: true,
      windowTitle: true,
      iterm2Graphics: true,
      sixel: true,
      // iTerm2 on all versions, falls back to Sixel if TERM_PROGRAM not set
      preferredGraphics: 'iterm2',
      trueColor: true,
    },
  },

  st: {
    id: 'st',
    name: 'st (suckless)',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      cursorStyleControl: true,
      preferredGraphics: false,
      trueColor: true,
    },
  },

  'rxvt-unicode': {
    id: 'rxvt-unicode',
    name: 'rxvt-unicode',
    gpuAccelerated: false,
    knownCaps: {
      ...DEFAULT_CAPS,
      ...COMMON_INTERACTIVE_CAPS,
      cursorStyleControl: true,
      windowTitle: true,
      preferredGraphics: false,
      trueColor: false,
    },
  },

  unknown: {
    id: 'unknown',
    name: 'Unknown',
    gpuAccelerated: false,
    knownCaps: DEFAULT_CAPS,
  },
};

// =============================================================================
// Terminal Detection
// =============================================================================

/**
 * Detect which terminal emulator is running via environment variables.
 * Sync, zero-cost — no escape sequence queries needed.
 */
export function detectTerminalId(env: Record<string, string | undefined> = process.env): TerminalId {
  const termProgram = env.TERM_PROGRAM || '';
  const term = env.TERM || '';

  // Specific env vars (most reliable)
  if (env.KITTY_WINDOW_ID) return 'kitty';
  if (env.ALACRITTY_WINDOW_ID || env.ALACRITTY_LOG) return 'alacritty';
  if (env.GHOSTTY_RESOURCES_DIR) return 'ghostty';
  if (env.WEZTERM_PANE || termProgram === 'WezTerm') return 'wezterm';
  if (termProgram === 'rio') return 'rio';
  if (env.WARP_IS_LOCAL_SHELL_SESSION) return 'warp';
  if (term.startsWith('foot') || term === 'foot') return 'foot';
  if (env.CONTOUR_TERMINAL_ID) return 'contour';
  if (env.VSCODE_PID || termProgram === 'vscode') return 'vscode';
  if (termProgram === 'iTerm.app') return 'iterm2';
  if (termProgram === 'Apple_Terminal') return 'terminal-app';
  if (env.WT_SESSION) return 'windows-terminal';
  if (env.KONSOLE_VERSION) return 'konsole';

  // VTE-based terminals (GNOME Terminal, Tilix, etc.)
  if (env.VTE_VERSION) {
    // Tilix sets TILIX_ID
    if (env.TILIX_ID) return 'tilix';
    return 'gnome-terminal';
  }

  if (termProgram === 'Hyper') return 'hyper';
  if (env.TERMINOLOGY) return 'terminology';
  if (termProgram === 'mlterm') return 'mlterm';
  if (termProgram === 'blackbox' || env.BLACKBOX_THEMES_DIR) return 'black-box';
  if (termProgram === 'Bobcat') return 'bobcat';

  // TERM-based fallbacks
  if (term.includes('rxvt-unicode') || term.includes('rxvt')) return 'rxvt-unicode';
  if (term.includes('mlterm')) return 'mlterm';
  if (term === 'st-256color' || term === 'st') return 'st';

  return 'unknown';
}

/**
 * Detect if running inside a multiplexer
 */
export function detectMultiplexer(env: Record<string, string | undefined> = process.env): MultiplexerInfo | null {
  if (env.TMUX) {
    return {
      type: 'tmux',
      version: env.TMUX?.split(',')[1],
      needsPassthrough: true,
    };
  }

  if (env.STY) {
    return {
      type: 'screen',
      version: undefined,
      needsPassthrough: true,
    };
  }

  if (env.ZELLIJ) {
    return {
      type: 'zellij',
      version: env.ZELLIJ_SESSION_NAME ? undefined : undefined,
      needsPassthrough: false,
    };
  }

  return null;
}

/**
 * Get the full terminal profile with known capabilities.
 */
export function detectTerminalProfile(env: Record<string, string | undefined> = process.env): TerminalProfile {
  const id = detectTerminalId(env);
  const base = TERMINAL_PROFILES[id];

  // Attempt to extract version
  let version: string | undefined;

  switch (id) {
    case 'iterm2':
      version = env.TERM_PROGRAM_VERSION;
      break;
    case 'konsole':
      version = env.KONSOLE_VERSION;
      break;
    case 'vscode':
      version = env.TERM_PROGRAM_VERSION;
      break;
    case 'wezterm':
      version = env.TERM_PROGRAM_VERSION;
      break;
    default:
      version = undefined;
  }

  return {
    ...base,
    version,
  };
}

/**
 * Get the static capability profile for a known terminal ID.
 */
export function getTerminalProfileById(id: TerminalId): Omit<TerminalProfile, 'version'> {
  return TERMINAL_PROFILES[id];
}

/**
 * List all known terminal IDs.
 */
export function listTerminalIds(): TerminalId[] {
  return Object.keys(TERMINAL_PROFILES) as TerminalId[];
}
