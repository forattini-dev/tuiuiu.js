/**
 * ProgressBar - Visual progress indicator
 *
 * Features:
 * - Multiple bar styles (block, smooth, line, dots, braille)
 * - Percentage display
 * - ETA calculation
 * - Speed/rate display
 * - Custom colors and gradients
 * - Indeterminate mode (animated)
 * - Multi-segment support
 * - Label and description
 */

import { Box, Text } from '../../components/components.js';
import type { VNode } from '../../utils/types.js';
import { createSignal } from '../../primitives/signal.js';
import { themeColor } from '../../core/theme.js';
import { getChars, getRenderMode } from '../../core/capabilities.js';

export type ProgressBarStyle = 'block' | 'smooth' | 'line' | 'dots' | 'braille' | 'ascii';

/** Get effective style based on render mode */
function getEffectiveBarStyle(style: ProgressBarStyle): ProgressBarStyle {
  if (getRenderMode() === 'ascii' && style !== 'ascii') {
    return 'ascii';
  }
  return style;
}

/** Bar character sets */
const BAR_STYLES: Record<ProgressBarStyle, { filled: string; empty: string; partial?: string[] }> = {
  block: {
    filled: '█',
    empty: '░',
    partial: ['▏', '▎', '▍', '▌', '▋', '▊', '▉'],
  },
  smooth: {
    filled: '━',
    empty: '─',
  },
  line: {
    filled: '═',
    empty: '─',
  },
  dots: {
    filled: '●',
    empty: '○',
  },
  braille: {
    filled: '⣿',
    empty: '⣀',
    partial: ['⣀', '⣄', '⣤', '⣦', '⣶', '⣷', '⣿'],
  },
  ascii: {
    filled: '#',
    empty: '-',
  },
};

/** Indeterminate animation frames - Unicode */
const INDETERMINATE_FRAMES_UNICODE = [
  '▐    ▌',
  '▐=   ▌',
  '▐==  ▌',
  '▐=== ▌',
  '▐ ===▌',
  '▐  ==▌',
  '▐   =▌',
  '▐    ▌',
];

/** Indeterminate animation frames - ASCII */
const INDETERMINATE_FRAMES_ASCII = [
  '[    ]',
  '[=   ]',
  '[==  ]',
  '[=== ]',
  '[ ===]',
  '[  ==]',
  '[   =]',
  '[    ]',
];

/** Get indeterminate frames based on render mode */
function getIndeterminateFrames(): string[] {
  return getRenderMode() === 'ascii' ? INDETERMINATE_FRAMES_ASCII : INDETERMINATE_FRAMES_UNICODE;
}

export interface ProgressBarOptions {
  /** Current progress (0-1 or 0-100) */
  value?: number;
  /** Maximum value (default: 1 if value <= 1, else 100) */
  max?: number;
  /** Width in characters */
  width?: number;
  /** Bar style */
  style?: ProgressBarStyle;
  /** Show percentage */
  showPercentage?: boolean;
  /** Show value (e.g., "50/100") */
  showValue?: boolean;
  /** Show ETA */
  showEta?: boolean;
  /** Show speed/rate */
  showSpeed?: boolean;
  /** Speed unit (e.g., "MB/s", "items/s") */
  speedUnit?: string;
  /** Current speed value */
  speed?: number;
  /** Estimated time remaining in seconds */
  eta?: number;
  /** Progress bar color */
  color?: string;
  /** Empty bar color */
  emptyColor?: string;
  /** Use gradient (multiple colors) */
  gradient?: string[];
  /** Label (left side) */
  label?: string;
  /** Description (right side) */
  description?: string;
  /** Indeterminate mode (unknown progress) */
  indeterminate?: boolean;
  /** Border style */
  borderStyle?: 'none' | 'brackets' | 'pipes' | 'arrows';
}

/**
 * Create a progress bar state manager
 */
export function createProgressBar(options: ProgressBarOptions = {}) {
  const { value = 0, max = value > 1 ? 100 : 1 } = options;

  const [progress, setProgress] = createSignal(value / max);
  const [startTime] = createSignal(Date.now());
  const [processedItems, setProcessedItems] = createSignal(0);

  return {
    progress,
    startTime,
    processedItems,
    setProgress: (v: number, maxVal?: number) => {
      const m = maxVal ?? max;
      setProgress(Math.min(1, Math.max(0, v / m)));
    },
    increment: (amount: number = 1, maxVal?: number) => {
      const m = maxVal ?? max;
      setProgress((p) => Math.min(1, p + amount / m));
      setProcessedItems((i) => i + amount);
    },
    getElapsed: () => (Date.now() - startTime()) / 1000,
    getEta: () => {
      const p = progress();
      if (p <= 0) return Infinity;
      const elapsed = (Date.now() - startTime()) / 1000;
      return (elapsed / p) * (1 - p);
    },
    getSpeed: () => {
      const elapsed = (Date.now() - startTime()) / 1000;
      if (elapsed <= 0) return 0;
      return processedItems() / elapsed;
    },
    reset: () => {
      setProgress(0);
      setProcessedItems(0);
    },
  };
}

/**
 * Render a progress bar
 */
export function renderProgressBar(
  state: ReturnType<typeof createProgressBar>,
  options: ProgressBarOptions = {}
): VNode {
  const {
    width = 40,
    style = 'block',
    showPercentage = true,
    showValue = false,
    showEta = false,
    showSpeed = false,
    speedUnit = '/s',
    color = themeColor('info'),
    emptyColor = themeColor('textMuted'),
    gradient,
    label,
    description,
    indeterminate = false,
    borderStyle = 'none',
  } = options;

  const progress = state.progress();
  const effectiveStyle = getEffectiveBarStyle(style);
  const barStyle = BAR_STYLES[effectiveStyle];

  // Build the bar
  let barContent: string;

  if (indeterminate) {
    const frames = getIndeterminateFrames();
    const frame = Math.floor(Date.now() / 100) % frames.length;
    barContent = frames[frame];
  } else {
    const filledWidth = Math.floor(progress * width);
    const partialWidth = (progress * width) - filledWidth;

    let filled = barStyle.filled.repeat(filledWidth);

    // Add partial character for smooth progress
    if (barStyle.partial && partialWidth > 0 && filledWidth < width) {
      const partialIndex = Math.floor(partialWidth * barStyle.partial.length);
      filled += barStyle.partial[Math.min(partialIndex, barStyle.partial.length - 1)];
    }

    const emptyWidth = Math.max(0, width - filled.length);
    const empty = barStyle.empty.repeat(emptyWidth);

    barContent = filled + empty;
  }

  // Apply gradient if specified
  let coloredBar: VNode;
  if (gradient && gradient.length > 1 && !indeterminate) {
    // Split bar into gradient segments
    const segments: VNode[] = [];
    const charsPerSegment = Math.ceil(width / gradient.length);

    for (let i = 0; i < barContent.length; i++) {
      const segmentIndex = Math.min(Math.floor(i / charsPerSegment), gradient.length - 1);
      const char = barContent[i];
      const isFilled = char !== barStyle.empty;
      segments.push(
        Text({ color: isFilled ? gradient[segmentIndex] : emptyColor }, char)
      );
    }
    coloredBar = Box({ flexDirection: 'row' }, ...segments);
  } else {
    // Simple two-color bar
    const filledLen = barContent.replace(new RegExp(`[${barStyle.empty}]`, 'g'), '').length;
    const filledPart = barContent.slice(0, filledLen);
    const emptyPart = barContent.slice(filledLen);

    coloredBar = Box(
      { flexDirection: 'row' },
      Text({ color: indeterminate ? color : color }, filledPart),
      Text({ color: emptyColor, dim: true }, emptyPart)
    );
  }

  // Build border
  const chars = getChars();
  let leftBorder = '';
  let rightBorder = '';
  switch (borderStyle) {
    case 'brackets':
      leftBorder = '[';
      rightBorder = ']';
      break;
    case 'pipes':
      leftBorder = '|';
      rightBorder = '|';
      break;
    case 'arrows':
      leftBorder = chars.gauge.start;
      rightBorder = chars.gauge.end;
      break;
  }

  // Build info parts
  const infoParts: VNode[] = [];

  if (showPercentage && !indeterminate) {
    infoParts.push(Text({ color: themeColor('text') }, ` ${(progress * 100).toFixed(0)}%`));
  }

  if (showValue && options.value !== undefined && options.max !== undefined) {
    infoParts.push(Text({ color: themeColor('textMuted') }, ` ${options.value}/${options.max}`));
  }

  if (showEta && !indeterminate) {
    const eta = state.getEta();
    if (isFinite(eta) && eta > 0) {
      infoParts.push(Text({ color: themeColor('textMuted'), dim: true }, ` ETA: ${formatTime(eta)}`));
    }
  }

  if (showSpeed) {
    const speed = options.speed ?? state.getSpeed();
    if (speed > 0) {
      infoParts.push(Text({ color: themeColor('textMuted'), dim: true }, ` ${formatNumber(speed)}${speedUnit}`));
    }
  }

  return Box(
    { flexDirection: 'row', gap: 1 },
    label ? Text({ color: themeColor('text') }, `${label} `) : Text({}, ''),
    Text({}, leftBorder),
    coloredBar,
    Text({}, rightBorder),
    ...infoParts,
    description ? Text({ color: themeColor('textMuted'), dim: true }, ` ${description}`) : Text({}, '')
  );
}

/**
 * Simple standalone progress bar component
 */
export function ProgressBar(options: ProgressBarOptions): VNode {
  const {
    value = 0,
    max = value > 1 ? 100 : 1,
    width = 40,
    style = 'block',
    showPercentage = true,
    color = themeColor('info'),
    emptyColor = themeColor('textMuted'),
    label,
    indeterminate = false,
    borderStyle = 'brackets',
  } = options;

  const progress = Math.min(1, Math.max(0, value / max));
  const effectiveStyle = getEffectiveBarStyle(style);
  const barStyle = BAR_STYLES[effectiveStyle];

  let barContent: string;

  if (indeterminate) {
    const frames = getIndeterminateFrames();
    const frame = Math.floor(Date.now() / 100) % frames.length;
    barContent = frames[frame];
  } else {
    const filledWidth = Math.floor(progress * width);

    let filled = barStyle.filled.repeat(filledWidth);
    if (barStyle.partial) {
      const partialWidth = (progress * width) - filledWidth;
      if (partialWidth > 0 && filledWidth < width) {
        const partialIndex = Math.floor(partialWidth * barStyle.partial.length);
        filled += barStyle.partial[Math.min(partialIndex, barStyle.partial.length - 1)];
      }
    }

    const emptyWidth = Math.max(0, width - filled.length);
    barContent = filled + barStyle.empty.repeat(emptyWidth);
  }

  const chars = getChars();
  let leftBorder = '';
  let rightBorder = '';
  switch (borderStyle) {
    case 'brackets':
      leftBorder = '[';
      rightBorder = ']';
      break;
    case 'pipes':
      leftBorder = '|';
      rightBorder = '|';
      break;
    case 'arrows':
      leftBorder = chars.gauge.start;
      rightBorder = chars.gauge.end;
      break;
  }

  const filledLen = Math.floor(progress * width);
  const filledPart = barContent.slice(0, filledLen);
  const emptyPart = barContent.slice(filledLen);

  return Box(
    { flexDirection: 'row', gap: 1 },
    label ? Text({ color: themeColor('text') }, `${label} `) : Text({}, ''),
    Text({}, leftBorder),
    Text({ color }, filledPart),
    Text({ color: emptyColor, dim: true }, emptyPart),
    Text({}, rightBorder),
    showPercentage && !indeterminate
      ? Text({ color: themeColor('text') }, ` ${(progress * 100).toFixed(0)}%`)
      : Text({}, '')
  );
}

/**
 * Multi-segment progress bar (for showing multiple parts)
 */
export function MultiProgressBar(options: {
  segments: Array<{ value: number; color: string; label?: string }>;
  total: number;
  width?: number;
  showLegend?: boolean;
}): VNode {
  const { segments, total, width = 40, showLegend = true } = options;
  const chars = getChars();

  // Calculate segment widths
  const barParts: VNode[] = [];
  let usedWidth = 0;

  for (const segment of segments) {
    const segmentWidth = Math.floor((segment.value / total) * width);
    if (segmentWidth > 0) {
      barParts.push(Text({ color: segment.color }, chars.gauge.filled.repeat(segmentWidth)));
      usedWidth += segmentWidth;
    }
  }

  // Fill remaining with empty
  const emptyWidth = width - usedWidth;
  if (emptyWidth > 0) {
    barParts.push(Text({ color: themeColor('textMuted'), dim: true }, chars.gauge.empty.repeat(emptyWidth)));
  }

  // Build legend
  const legendParts: VNode[] = [];
  if (showLegend) {
    for (const segment of segments) {
      if (segment.label) {
        legendParts.push(
          Box(
            { flexDirection: 'row', marginRight: 2 },
            Text({ color: segment.color }, `${chars.bullet} `),
            Text({ color: themeColor('textMuted') }, `${segment.label}: ${segment.value}`)
          )
        );
      }
    }
  }

  return Box(
    { flexDirection: 'column' },
    Box({ flexDirection: 'row' }, Text({}, '['), ...barParts, Text({}, ']')),
    legendParts.length > 0 ? Box({ flexDirection: 'row', marginTop: 1 }, ...legendParts) : Box({})
  );
}

/**
 * Format time in human readable format
 */
function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Format number with K/M suffixes
 */
function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(1);
}
