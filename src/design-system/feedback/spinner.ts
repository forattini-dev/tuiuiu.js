/**
 * Spinner - Advanced loading indicator
 *
 * Features:
 * - 15+ animation styles (dots, line, arc, circle, bounce, etc.)
 * - Customizable speed
 * - Status text with rotation
 * - Progress mode (percentage)
 * - Time elapsed display
 * - Token/byte counters
 * - Color gradients
 * - Success/failure states
 */

import { Box, Text } from '../../primitives/index.js';
import type { VNode } from '../../utils/types.js';
import { createSignal, createEffect } from '../../primitives/signal.js';
import { themeColor } from '../../core/theme.js';
import { getChars, getRenderMode } from '../../core/capabilities.js';

/** Available spinner styles - 60+ options */
export type SpinnerStyle =
  // Dots family (braille-based)
  | 'dots'
  | 'dots2'
  | 'dots3'
  | 'dots4'
  | 'dots5'
  | 'dots6'
  | 'dots7'
  | 'dots8'
  | 'dots9'
  | 'dots10'
  | 'dots11'
  | 'dots12'
  // Line-based
  | 'line'
  | 'line2'
  | 'pipe'
  // Shape-based
  | 'arc'
  | 'circle'
  | 'circleQuarters'
  | 'circleHalves'
  | 'square'
  | 'squareCorners'
  | 'triangle'
  // Movement-based
  | 'bounce'
  | 'bouncingBar'
  | 'bouncingBall'
  // Arrow-based
  | 'arrow'
  | 'arrow2'
  | 'arrow3'
  // Toggle-based
  | 'toggle'
  | 'toggle2'
  | 'toggle3'
  | 'toggle4'
  | 'toggle5'
  | 'toggle6'
  | 'toggle7'
  | 'toggle8'
  | 'toggle9'
  | 'toggle10'
  | 'toggle11'
  | 'toggle12'
  | 'toggle13'
  // Emoji-based
  | 'clock'
  | 'earth'
  | 'moon'
  | 'runner'
  | 'hearts'
  | 'smiley'
  | 'monkey'
  | 'weather'
  | 'christmas'
  // Game-based
  | 'pong'
  | 'shark'
  // Progress-style
  | 'growVertical'
  | 'growHorizontal'
  | 'material'
  | 'aesthetic'
  // Other
  | 'star'
  | 'star2'
  | 'flip'
  | 'hamburger'
  | 'balloon'
  | 'balloon2'
  | 'noise'
  | 'boxBounce'
  | 'boxBounce2'
  | 'squish'
  | 'simpleDots'
  | 'simpleDotsScrolling'
  | 'point'
  | 'layer'
  | 'betaWave'
  | 'grenade'
  | 'dqpb'
  | 'binary';

/** ASCII-safe spinner styles (don't need fallback) */
const ASCII_SAFE_STYLES: Set<SpinnerStyle> = new Set([
  'line', 'bouncingBar', 'shark', 'binary', 'flip', 'star2', 'simpleDots', 'simpleDotsScrolling', 'toggle13', 'dqpb',
]);

/** Get the appropriate spinner style based on render mode */
function getEffectiveStyle(style: SpinnerStyle): SpinnerStyle {
  if (getRenderMode() === 'ascii' && !ASCII_SAFE_STYLES.has(style)) {
    return 'line'; // Fallback to ASCII-safe style
  }
  return style;
}

/** Spinner frame sequences - 60+ styles from cli-spinners */
const SPINNERS: Record<SpinnerStyle, { frames: string[]; interval: number }> = {
  // ==========================================================================
  // Dots family (braille-based)
  // ==========================================================================
  dots: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
  },
  dots2: {
    frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
    interval: 80,
  },
  dots3: {
    frames: ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'],
    interval: 80,
  },
  dots4: {
    frames: ['⠄', '⠆', '⠇', '⠋', '⠙', '⠸', '⠰', '⠠', '⠰', '⠸', '⠙', '⠋', '⠇', '⠆'],
    interval: 80,
  },
  dots5: {
    frames: ['⠋', '⠙', '⠚', '⠒', '⠂', '⠂', '⠒', '⠲', '⠴', '⠦', '⠖', '⠒', '⠐', '⠐', '⠒', '⠓', '⠋'],
    interval: 80,
  },
  dots6: {
    frames: ['⠁', '⠉', '⠙', '⠚', '⠒', '⠂', '⠂', '⠒', '⠲', '⠴', '⠤', '⠄', '⠄', '⠤', '⠴', '⠲', '⠒', '⠂', '⠂', '⠒', '⠚', '⠙', '⠉', '⠁'],
    interval: 80,
  },
  dots7: {
    frames: ['⠈', '⠉', '⠋', '⠓', '⠒', '⠐', '⠐', '⠒', '⠖', '⠦', '⠤', '⠠', '⠠', '⠤', '⠦', '⠖', '⠒', '⠐', '⠐', '⠒', '⠓', '⠋', '⠉', '⠈'],
    interval: 80,
  },
  dots8: {
    frames: ['⠁', '⠁', '⠉', '⠙', '⠚', '⠒', '⠂', '⠂', '⠒', '⠲', '⠴', '⠤', '⠄', '⠄', '⠤', '⠠', '⠠', '⠤', '⠦', '⠖', '⠒', '⠐', '⠐', '⠒', '⠓', '⠋', '⠉', '⠈', '⠈'],
    interval: 80,
  },
  dots9: {
    frames: ['⢹', '⢺', '⢼', '⣸', '⣇', '⡧', '⡗', '⡏'],
    interval: 80,
  },
  dots10: {
    frames: ['⢄', '⢂', '⢁', '⡁', '⡈', '⡐', '⡠'],
    interval: 80,
  },
  dots11: {
    frames: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'],
    interval: 100,
  },
  dots12: {
    frames: ['⢀⠀', '⡀⠀', '⠄⠀', '⢂⠀', '⡂⠀', '⠅⠀', '⢃⠀', '⡃⠀', '⠍⠀', '⢋⠀', '⡋⠀', '⠍⠁', '⢋⠁', '⡋⠁', '⠍⠉', '⠋⠉', '⠋⠉', '⠉⠙', '⠉⠙', '⠉⠩', '⠈⢙', '⠈⡙', '⢈⠩', '⡀⢙', '⠄⡙', '⢂⠩', '⡂⢘', '⠅⡘', '⢃⠨', '⡃⢐', '⠍⡐', '⢋⠠', '⡋⢀', '⠍⡁', '⢋⠁', '⡋⠁', '⠍⠉', '⠋⠉', '⠋⠉', '⠉⠙', '⠉⠙', '⠉⠩', '⠈⢙', '⠈⡙', '⠈⠩', '⠀⢙', '⠀⡙', '⠀⠩', '⠀⢘', '⠀⡘', '⠀⠨', '⠀⢐', '⠀⡐', '⠀⠠', '⠀⢀', '⠀⡀'],
    interval: 80,
  },

  // ==========================================================================
  // Line-based
  // ==========================================================================
  line: {
    frames: ['-', '\\', '|', '/'],
    interval: 130,
  },
  line2: {
    frames: ['⠂', '-', '–', '—', '–', '-'],
    interval: 100,
  },
  pipe: {
    frames: ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐'],
    interval: 100,
  },

  // ==========================================================================
  // Shape-based
  // ==========================================================================
  arc: {
    frames: ['◜', '◠', '◝', '◞', '◡', '◟'],
    interval: 100,
  },
  circle: {
    frames: ['◡', '⊙', '◠'],
    interval: 120,
  },
  circleQuarters: {
    frames: ['◴', '◷', '◶', '◵'],
    interval: 120,
  },
  circleHalves: {
    frames: ['◐', '◓', '◑', '◒'],
    interval: 50,
  },
  square: {
    frames: ['◰', '◳', '◲', '◱'],
    interval: 100,
  },
  squareCorners: {
    frames: ['◰', '◳', '◲', '◱'],
    interval: 180,
  },
  triangle: {
    frames: ['◢', '◣', '◤', '◥'],
    interval: 50,
  },

  // ==========================================================================
  // Movement-based
  // ==========================================================================
  bounce: {
    frames: ['⠁', '⠂', '⠄', '⠂'],
    interval: 120,
  },
  bouncingBar: {
    frames: [
      '[    ]',
      '[=   ]',
      '[==  ]',
      '[=== ]',
      '[ ===]',
      '[  ==]',
      '[   =]',
      '[    ]',
      '[   =]',
      '[  ==]',
      '[ ===]',
      '[====]',
      '[=== ]',
      '[==  ]',
      '[=   ]',
    ],
    interval: 80,
  },
  bouncingBall: {
    frames: [
      '( ●    )',
      '(  ●   )',
      '(   ●  )',
      '(    ● )',
      '(     ●)',
      '(    ● )',
      '(   ●  )',
      '(  ●   )',
      '( ●    )',
      '(●     )',
    ],
    interval: 80,
  },

  // ==========================================================================
  // Arrow-based
  // ==========================================================================
  arrow: {
    frames: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
    interval: 100,
  },
  arrow2: {
    frames: ['⬆️ ', '↗️ ', '➡️ ', '↘️ ', '⬇️ ', '↙️ ', '⬅️ ', '↖️ '],
    interval: 80,
  },
  arrow3: {
    frames: ['▹▹▹▹▹', '▸▹▹▹▹', '▹▸▹▹▹', '▹▹▸▹▹', '▹▹▹▸▹', '▹▹▹▹▸'],
    interval: 120,
  },

  // ==========================================================================
  // Toggle-based
  // ==========================================================================
  toggle: {
    frames: ['⊶', '⊷'],
    interval: 250,
  },
  toggle2: {
    frames: ['▫', '▪'],
    interval: 80,
  },
  toggle3: {
    frames: ['□', '■'],
    interval: 120,
  },
  toggle4: {
    frames: ['■', '□', '▪', '▫'],
    interval: 100,
  },
  toggle5: {
    frames: ['▮', '▯'],
    interval: 100,
  },
  toggle6: {
    frames: ['ဝ', '၀'],
    interval: 300,
  },
  toggle7: {
    frames: ['⦾', '⦿'],
    interval: 80,
  },
  toggle8: {
    frames: ['◍', '◌'],
    interval: 100,
  },
  toggle9: {
    frames: ['◉', '◎'],
    interval: 100,
  },
  toggle10: {
    frames: ['㊂', '㊀', '㊁'],
    interval: 100,
  },
  toggle11: {
    frames: ['⧇', '⧆'],
    interval: 50,
  },
  toggle12: {
    frames: ['☗', '☖'],
    interval: 120,
  },
  toggle13: {
    frames: ['=', '*', '-'],
    interval: 80,
  },

  // ==========================================================================
  // Emoji-based
  // ==========================================================================
  clock: {
    frames: ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'],
    interval: 100,
  },
  earth: {
    frames: ['🌍', '🌎', '🌏'],
    interval: 180,
  },
  moon: {
    frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
    interval: 80,
  },
  runner: {
    frames: ['🚶', '🏃'],
    interval: 140,
  },
  hearts: {
    frames: ['💛', '💙', '💜', '💚', '❤️'],
    interval: 100,
  },
  smiley: {
    frames: ['😄', '😝'],
    interval: 200,
  },
  monkey: {
    frames: ['🙈', '🙈', '🙉', '🙊'],
    interval: 300,
  },
  weather: {
    frames: ['☀️', '☀️', '☀️', '🌤', '⛅️', '🌥', '☁️', '🌧', '🌨', '🌧', '🌨', '🌧', '🌨', '⛈', '🌨', '🌧', '🌨', '☁️', '🌥', '⛅️', '🌤', '☀️', '☀️'],
    interval: 100,
  },
  christmas: {
    frames: ['🌲', '🎄'],
    interval: 400,
  },

  // ==========================================================================
  // Game-based
  // ==========================================================================
  pong: {
    frames: [
      // Left to right
      '▐⠂    ▌',
      '▐⠈    ▌',
      '▐ ⠂   ▌',
      '▐ ⠠   ▌',
      '▐  ⡀  ▌',
      '▐  ⠠  ▌',
      '▐   ⠂ ▌',
      '▐   ⠈ ▌',
      '▐    ⠂▌',
      // Right to left
      '▐    ⠠▌',
      '▐    ⡀▌',
      '▐   ⠠ ▌',
      '▐   ⠂ ▌',
      '▐  ⠈  ▌',
      '▐  ⠂  ▌',
      '▐ ⠠   ▌',
      '▐ ⡀   ▌',
      '▐⠠    ▌',
    ],
    interval: 80,
  },
  shark: {
    frames: [
      '▐|\\____________▌',
      '▐_|\\___________▌',
      '▐__|\\__________▌',
      '▐___|\\_________▌',
      '▐____|\\________▌',
      '▐_____|\\_______▌',
      '▐______|\\______▌',
      '▐_______|\\_____▌',
      '▐________|\\____▌',
      '▐_________|\\___▌',
      '▐__________|\\__▌',
      '▐___________|\\_▌',
      '▐____________|\\▌',
      '▐____________/|▌',
      '▐___________/|_▌',
      '▐__________/|__▌',
      '▐_________/|___▌',
      '▐________/|____▌',
      '▐_______/|_____▌',
      '▐______/|______▌',
      '▐_____/|_______▌',
      '▐____/|________▌',
      '▐___/|_________▌',
      '▐__/|__________▌',
      '▐_/|___________▌',
      '▐/|____________▌',
    ],
    interval: 120,
  },

  // ==========================================================================
  // Progress-style
  // ==========================================================================
  growVertical: {
    frames: ['▁', '▃', '▄', '▅', '▆', '▇', '▆', '▅', '▄', '▃'],
    interval: 120,
  },
  growHorizontal: {
    frames: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '▊', '▋', '▌', '▍', '▎'],
    interval: 120,
  },
  material: {
    frames: [
      '█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '███▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '███████▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '████████▁▁▁▁▁▁▁▁▁▁▁▁',
      '█████████▁▁▁▁▁▁▁▁▁▁▁',
      '██████████▁▁▁▁▁▁▁▁▁▁',
      '███████████▁▁▁▁▁▁▁▁▁',
      '█████████████▁▁▁▁▁▁▁',
      '██████████████▁▁▁▁▁▁',
      '▁██████████████▁▁▁▁▁',
      '▁▁██████████████▁▁▁▁',
      '▁▁▁██████████████▁▁▁',
      '▁▁▁▁█████████████▁▁▁',
      '▁▁▁▁██████████████▁▁',
      '▁▁▁▁▁██████████████▁',
      '▁▁▁▁▁▁██████████████',
      '▁▁▁▁▁▁▁█████████████',
      '▁▁▁▁▁▁▁▁████████████',
      '▁▁▁▁▁▁▁▁▁███████████',
      '▁▁▁▁▁▁▁▁▁▁██████████',
      '▁▁▁▁▁▁▁▁▁▁▁▁████████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁███████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁██████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████',
      '█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████',
      '██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███',
      '███▁▁▁▁▁▁▁▁▁▁▁▁▁▁███',
      '████▁▁▁▁▁▁▁▁▁▁▁▁▁▁██',
      '█████▁▁▁▁▁▁▁▁▁▁▁▁▁▁█',
      '██████▁▁▁▁▁▁▁▁▁▁▁▁▁█',
      '████████▁▁▁▁▁▁▁▁▁▁▁▁',
      '█████████▁▁▁▁▁▁▁▁▁▁▁',
      '███████████▁▁▁▁▁▁▁▁▁',
      '████████████▁▁▁▁▁▁▁▁',
      '██████████████▁▁▁▁▁▁',
      '▁██████████████▁▁▁▁▁',
      '▁▁▁█████████████▁▁▁▁',
      '▁▁▁▁▁████████████▁▁▁',
      '▁▁▁▁▁▁███████████▁▁▁',
      '▁▁▁▁▁▁▁▁█████████▁▁▁',
      '▁▁▁▁▁▁▁▁▁█████████▁▁',
      '▁▁▁▁▁▁▁▁▁▁█████████▁',
      '▁▁▁▁▁▁▁▁▁▁▁████████▁',
      '▁▁▁▁▁▁▁▁▁▁▁▁███████▁',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁███████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
    ],
    interval: 17,
  },
  aesthetic: {
    frames: [
      '▰▱▱▱▱▱▱',
      '▰▰▱▱▱▱▱',
      '▰▰▰▱▱▱▱',
      '▰▰▰▰▱▱▱',
      '▰▰▰▰▰▱▱',
      '▰▰▰▰▰▰▱',
      '▰▰▰▰▰▰▰',
      '▰▱▱▱▱▱▱',
    ],
    interval: 80,
  },

  // ==========================================================================
  // Other styles
  // ==========================================================================
  star: {
    frames: ['✶', '✸', '✹', '✺', '✹', '✷'],
    interval: 70,
  },
  star2: {
    frames: ['+', 'x', '*'],
    interval: 80,
  },
  flip: {
    frames: ['_', '_', '_', '-', '`', '`', "'", '´', '-', '_', '_', '_'],
    interval: 70,
  },
  hamburger: {
    frames: ['☱', '☲', '☴'],
    interval: 100,
  },
  balloon: {
    frames: [' ', '.', 'o', 'O', '@', '*', ' '],
    interval: 140,
  },
  balloon2: {
    frames: ['.', 'o', 'O', '°', 'O', 'o', '.'],
    interval: 120,
  },
  noise: {
    frames: ['▓', '▒', '░'],
    interval: 100,
  },
  boxBounce: {
    frames: ['▖', '▘', '▝', '▗'],
    interval: 120,
  },
  boxBounce2: {
    frames: ['▌', '▀', '▐', '▄'],
    interval: 100,
  },
  squish: {
    frames: ['╫', '╪'],
    interval: 100,
  },
  simpleDots: {
    frames: ['.  ', '.. ', '...', '   '],
    interval: 400,
  },
  simpleDotsScrolling: {
    frames: ['.  ', '.. ', '...', ' ..', '  .', '   '],
    interval: 200,
  },
  point: {
    frames: ['∙∙∙', '●∙∙', '∙●∙', '∙∙●', '∙∙∙'],
    interval: 125,
  },
  layer: {
    frames: ['-', '=', '≡'],
    interval: 150,
  },
  betaWave: {
    frames: ['ρββββββ', 'βρβββββ', 'ββρββββ', 'βββρβββ', 'ββββρββ', 'βββββρβ', 'ββββββρ'],
    interval: 80,
  },
  grenade: {
    frames: ['،  ', '′  ', ' ´ ', ' ‾ ', '  ⸌', '  ⸊', '  |', '  ⁎', '  ⁕', ' ෴ ', '  ⁓', '   ', '   ', '   '],
    interval: 80,
  },
  dqpb: {
    frames: ['d', 'q', 'p', 'b'],
    interval: 100,
  },
  binary: {
    frames: ['010010', '001100', '100101', '111010', '001011', '010111', '101100', '110001'],
    interval: 100,
  },
};

/** Loading text options */
const LOADING_TEXTS = [
  'Thinking...',
  'Processing...',
  'Analyzing...',
  'Computing...',
  'Calculating...',
  'Synthesizing...',
  'Optimizing...',
  'Evaluating...',
  'Generating...',
  'Reasoning...',
  'Understanding...',
  'Connecting dots...',
  'Almost there...',
  'Working on it...',
];

export interface SpinnerOptions {
  /** Spinner animation style */
  style?: SpinnerStyle;
  /** Text to show next to spinner */
  text?: string;
  /** Rotate through loading texts */
  rotateText?: boolean;
  /** Text rotation interval (ms) */
  textRotateInterval?: number;
  /** Show elapsed time */
  showTime?: boolean;
  /** Show token count */
  showTokens?: boolean;
  /** Current token count */
  tokens?: number;
  /** Show progress percentage */
  showProgress?: boolean;
  /** Progress (0-100) */
  progress?: number;
  /** Spinner color */
  color?: string;
  /** Text color */
  textColor?: string;
  /** Secondary info color */
  infoColor?: string;
  /** Custom speed multiplier */
  speed?: number;
  /** Hint text (e.g., "esc to cancel") */
  hint?: string;
}

/**
 * Create a spinner state
 */
export function createSpinner(options: SpinnerOptions = {}) {
  const {
    style = 'dots',
    text = '',
    rotateText = true,
    textRotateInterval = 3000,
    speed = 1,
  } = options;

  const effectiveStyle = getEffectiveStyle(style);
  const spinner = SPINNERS[effectiveStyle];
  const [frame, setFrame] = createSignal(0);
  const [textIndex, setTextIndex] = createSignal(0);
  const [startTime] = createSignal(Date.now());
  const [isActive, setIsActive] = createSignal(true);

  let frameTimer: NodeJS.Timeout | null = null;
  let textTimer: NodeJS.Timeout | null = null;

  const start = () => {
    if (frameTimer) return;
    setIsActive(true);

    // Frame animation
    frameTimer = setInterval(() => {
      setFrame((f) => (f + 1) % spinner.frames.length);
    }, spinner.interval / speed);

    // Text rotation
    if (rotateText && !text) {
      textTimer = setInterval(() => {
        setTextIndex((i) => (i + 1) % LOADING_TEXTS.length);
      }, textRotateInterval);
    }
  };

  const stop = () => {
    setIsActive(false);
    if (frameTimer) {
      clearInterval(frameTimer);
      frameTimer = null;
    }
    if (textTimer) {
      clearInterval(textTimer);
      textTimer = null;
    }
  };

  // Auto-start
  start();

  return {
    frame,
    textIndex,
    startTime,
    isActive,
    start,
    stop,
    getFrame: () => spinner.frames[frame()],
    getText: () => (text || LOADING_TEXTS[textIndex()]),
    getElapsed: () => Math.floor((Date.now() - startTime()) / 1000),
  };
}

/**
 * Render a spinner
 */
export function renderSpinner(
  state: ReturnType<typeof createSpinner>,
  options: SpinnerOptions = {}
): VNode {
  const {
    showTime = true,
    showTokens = false,
    tokens = 0,
    showProgress = false,
    progress = 0,
    color = themeColor('info'),
    textColor = themeColor('text'),
    infoColor = themeColor('textMuted'),
    hint = 'esc to interrupt',
  } = options;

  if (!state.isActive()) {
    return Box({});
  }

  const frame = state.getFrame();
  const text = state.getText();
  const elapsed = state.getElapsed();

  // Build info parts
  const infoParts: string[] = [];

  if (showTime) {
    infoParts.push(`${elapsed}s`);
  }

  if (showTokens && tokens > 0) {
    infoParts.push(`↑ ${formatNumber(tokens)} tokens`);
  }

  if (showProgress) {
    infoParts.push(`${progress.toFixed(0)}%`);
  }

  if (hint) {
    infoParts.push(hint);
  }

  const infoText = infoParts.length > 0 ? `(${infoParts.join(' · ')})` : '';

  return Box(
    { flexDirection: 'row', gap: 1 },
    Text({ color }, frame),
    Text({ color: textColor }, text),
    infoText ? Text({ color: infoColor, dim: true }, infoText) : Text({}, '')
  );
}

/**
 * Simple standalone spinner component
 */
export function Spinner(options: SpinnerOptions & { isActive?: boolean }): VNode {
  const { isActive = true, ...rest } = options;

  if (!isActive) {
    return Box({});
  }

  // For simple usage, create inline state
  const style = options.style || 'dots';
  const effectiveStyle = getEffectiveStyle(style);
  const spinner = SPINNERS[effectiveStyle];
  const frameIndex = Math.floor(Date.now() / spinner.interval) % spinner.frames.length;
  const textIndex = Math.floor(Date.now() / 3000) % LOADING_TEXTS.length;

  const frame = spinner.frames[frameIndex];
  const text = options.text || LOADING_TEXTS[textIndex];
  const elapsed = 0; // Would need state for real tracking

  const infoParts: string[] = [];
  if (options.showTime) infoParts.push(`${elapsed}s`);
  if (options.showTokens && options.tokens) infoParts.push(`↑ ${formatNumber(options.tokens)} tokens`);
  if (options.showProgress && options.progress !== undefined) infoParts.push(`${options.progress.toFixed(0)}%`);
  if (options.hint) infoParts.push(options.hint);

  const infoText = infoParts.length > 0 ? `(${infoParts.join(' · ')})` : '';

  return Box(
    { flexDirection: 'row', gap: 1 },
    Text({ color: options.color || 'cyan' }, frame),
    Text({ color: options.textColor || 'white' }, text),
    infoText ? Text({ color: options.infoColor || 'gray', dim: true }, infoText) : Text({}, '')
  );
}

/**
 * Format number with K/M suffixes
 */
function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/**
 * List all available spinner style names.
 */
export function listSpinnerStyles(): SpinnerStyle[] {
  return Object.keys(SPINNERS) as SpinnerStyle[];
}

/**
 * Get spinner configuration for a style.
 */
export function getSpinnerConfig(style: SpinnerStyle): { frames: string[]; interval: number } {
  const effectiveStyle = getEffectiveStyle(style);
  return SPINNERS[effectiveStyle];
}

/**
 * Get the total number of available spinner styles.
 */
export function getSpinnerCount(): number {
  return Object.keys(SPINNERS).length;
}
