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

import { Box, Text } from './components.js';
import type { VNode } from '../utils/types.js';
import { createSignal, createEffect } from '../primitives/signal.js';

/** Available spinner styles */
export type SpinnerStyle =
  | 'dots'
  | 'dots2'
  | 'dots3'
  | 'line'
  | 'arc'
  | 'circle'
  | 'square'
  | 'bounce'
  | 'bouncingBar'
  | 'arrow'
  | 'clock'
  | 'earth'
  | 'moon'
  | 'runner'
  | 'pong'
  | 'shark'
  | 'hearts'
  | 'binary';

/** Spinner frame sequences */
const SPINNERS: Record<SpinnerStyle, { frames: string[]; interval: number }> = {
  dots: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
  },
  dots2: {
    frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
    interval: 80,
  },
  dots3: {
    frames: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'],
    interval: 80,
  },
  line: {
    frames: ['-', '\\', '|', '/'],
    interval: 100,
  },
  arc: {
    frames: ['◜', '◠', '◝', '◞', '◡', '◟'],
    interval: 100,
  },
  circle: {
    frames: ['◐', '◓', '◑', '◒'],
    interval: 100,
  },
  square: {
    frames: ['◰', '◳', '◲', '◱'],
    interval: 100,
  },
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
  arrow: {
    frames: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
    interval: 100,
  },
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
    interval: 150,
  },
  runner: {
    frames: ['🚶', '🏃'],
    interval: 200,
  },
  pong: {
    frames: [
      '▐⠂       ▌',
      '▐⠈       ▌',
      '▐ ⠂      ▌',
      '▐ ⠠      ▌',
      '▐  ⡀     ▌',
      '▐  ⠠     ▌',
      '▐   ⠂    ▌',
      '▐   ⠈    ▌',
      '▐    ⠂   ▌',
      '▐    ⠠   ▌',
      '▐     ⡀  ▌',
      '▐     ⠠  ▌',
      '▐      ⠂ ▌',
      '▐      ⠈ ▌',
      '▐       ⠂▌',
      '▐       ⠠▌',
      '▐       ⡀▌',
      '▐      ⠠ ▌',
      '▐      ⠂ ▌',
      '▐     ⠈  ▌',
      '▐     ⠂  ▌',
      '▐    ⠠   ▌',
      '▐    ⡀   ▌',
      '▐   ⠠    ▌',
      '▐   ⠂    ▌',
      '▐  ⠈     ▌',
      '▐  ⠂     ▌',
      '▐ ⠠      ▌',
      '▐ ⡀      ▌',
      '▐⠠       ▌',
    ],
    interval: 80,
  },
  shark: {
    frames: [
      '|\\____________|',
      '_|\\__________|_',
      '__|\\________|__',
      '___|\\_______|___',
      '____|\\_____|____',
      '_____|\\___|_____',
      '______|\\_|______',
      '_______|_|______',
      '________/|______',
      '_______/_|______',
      '______/__|______',
      '_____/___|______',
      '____/____|______',
      '___/_____|______',
      '__/______|______',
      '_/_______|______',
      '/________|______',
    ],
    interval: 80,
  },
  hearts: {
    frames: ['💛', '💙', '💜', '💚', '❤️'],
    interval: 150,
  },
  binary: {
    frames: [
      '010010',
      '001100',
      '100101',
      '111010',
      '001011',
      '010111',
      '101100',
      '110001',
    ],
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

  const spinner = SPINNERS[style];
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
    color = 'cyan',
    textColor = 'white',
    infoColor = 'gray',
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
  const spinner = SPINNERS[style];
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
