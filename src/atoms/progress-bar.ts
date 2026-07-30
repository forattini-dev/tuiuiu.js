/**
 * ProgressBar - Visual progress indicator
 *
 * @layer Atom
 * @description Visual progress with multiple styles and states
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

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { createSignal } from '../primitives/signal.js';
import { getTheme } from '../core/theme.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { stringWidth, truncateText } from '../utils/text-utils.js';

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
  background?: string;
  /** Use gradient (multiple colors) */
  gradient?: string[];
  /** Label (left side) */
  label?: string;
  /** Description (right side) */
  description?: string;
  /** Indeterminate mode (unknown progress) */
  indeterminate?: boolean;
  /** Indeterminate animation style */
  indeterminateStyle?: 'classic' | 'marquee' | 'fill-and-clear';
  /** Step size for 'fill-and-clear' animation (default: 1) */
  fillStep?: number;
  /** Border style */
  borderStyle?: 'none' | 'brackets' | 'pipes' | 'arrows';
}

interface ProgressRenderState {
  progress: () => number;
  getEta: () => number;
  getSpeed: () => number;
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
  state: ProgressRenderState,
  options: ProgressBarOptions = {}
): VNode {
  const theme = getTheme();
  const {
    width = 40,
    style = 'block',
    showPercentage = true,
    showValue = false,
    showEta = false,
    showSpeed = false,
    speedUnit = '/s',
    color = theme.accents.info,
    background = theme.foreground.muted,
    gradient,
    label,
    description,
    indeterminate = false,
    indeterminateStyle = 'classic',
    fillStep = 1,
    borderStyle = 'none',
  } = options;

  const progress = state.progress();
  const effectiveStyle = getEffectiveBarStyle(style);
  const barStyle = BAR_STYLES[effectiveStyle];

  // Build the bar
  let barContent: string;

  if (indeterminate) {
    if (indeterminateStyle === 'marquee') {
      const blockWidth = Math.max(3, Math.floor(width * 0.25));
      const totalWidth = width + blockWidth;
      // Use a slower speed for marquee so it's readable
      const pos = Math.floor(Date.now() / 80) % totalWidth;

      const start = Math.max(0, pos - blockWidth);
      const end = Math.min(width, pos);
      const length = Math.max(0, end - start);

      const emptyLeft = Math.max(0, start);
      const emptyRight = Math.max(0, width - end);

      // If pos is very small (entering) or very large (leaving), we might need adjustments
      // But standard logic:
      // [   ###      ]
      // start=3, end=6, len=3. emptyLeft=3, emptyRight=width-6.

      barContent = barStyle.empty.repeat(emptyLeft) +
                   barStyle.filled.repeat(length) +
                   barStyle.empty.repeat(emptyRight);

    } else if (indeterminateStyle === 'fill-and-clear') {
      // Cycle: 0 -> width (fill), width -> 2*width (clear)
      // Use fillStep to control speed/granularity visually if we wanted blocky steps,
      // but here it controls the speed of the fill relative to time.
      // If fillStep is larger, we multiply the time factor.

      const totalSteps = Math.ceil(width / fillStep);
      const t = Math.floor(Date.now() / 50);

      // We want the cycle to go from 0 to width (fill) then width to 2*width (clear)
      // But in steps of 'fillStep'.

      const rawCycle = t % ((totalSteps * 2) + 4); // +4 for pause

      // Map rawCycle (which is in steps) back to width
      let effectiveCycle = rawCycle * fillStep;

      if (rawCycle < totalSteps) {
        // Filling phase
        const filledLen = Math.min(width, effectiveCycle);
        barContent = barStyle.filled.repeat(filledLen) + barStyle.empty.repeat(width - filledLen);
      } else {
        // Clearing phase
        // effectiveCycle goes from width to 2*width
        const emptyLeftLen = Math.min(width, effectiveCycle - width);
        const filledLen = Math.max(0, width - emptyLeftLen);
        barContent = barStyle.empty.repeat(emptyLeftLen) + barStyle.filled.repeat(filledLen);
      }
    } else {
      // Classic
      const frames = getIndeterminateFrames();
      const frame = Math.floor(Date.now() / 100) % frames.length;
      barContent = frames[frame];
    }
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
        Text({ color: isFilled ? gradient[segmentIndex] : background }, char)
      );
    }
    coloredBar = Box({ flexDirection: 'row' }, ...segments);
  } else {
    // Simple two-color bar
    const filledLen = barContent.replace(new RegExp(`[${barStyle.empty}]`, 'g'), '').length;

    // For fill-and-clear, we need to handle "empty at start" correctly for coloring
    // The previous logic assumed filled is always at the start.
    // Let's rebuild the colored bar more robustly for all cases.

    if (indeterminate && indeterminateStyle === 'fill-and-clear') {
        // We have to iterate to color correctly because we might have [empty, filled]
        // Actually, barContent is composed of filled and empty chars.
        // We can just map over chars.
        const segments: VNode[] = [];
        for (const char of barContent) {
            const isFilled = char !== barStyle.empty;
            segments.push(Text({ color: isFilled ? color : background, dim: !isFilled }, char));
        }
        coloredBar = Box({ flexDirection: 'row' }, ...segments);
    } else if (indeterminate && indeterminateStyle === 'marquee') {
         const segments: VNode[] = [];
        for (const char of barContent) {
            const isFilled = char !== barStyle.empty;
            segments.push(Text({ color: isFilled ? color : background, dim: !isFilled }, char));
        }
        coloredBar = Box({ flexDirection: 'row' }, ...segments);
    } else {
        const filledPart = barContent.slice(0, filledLen);
        const emptyPart = barContent.slice(filledLen);

        coloredBar = Box(
        { flexDirection: 'row' },
        Text({ color: indeterminate ? color : color }, filledPart),
        Text({ color: background, dim: true }, emptyPart)
        );
    }
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
    infoParts.push(Text({ color: theme.foreground.primary }, ` ${(progress * 100).toFixed(0)}%`));
  }

  if (showValue && options.value !== undefined && options.max !== undefined) {
    infoParts.push(Text({ color: theme.foreground.muted }, ` ${options.value}/${options.max}`));
  }

  if (showEta && !indeterminate) {
    const eta = options.eta ?? state.getEta();
    if (isFinite(eta) && eta > 0) {
      infoParts.push(Text({ color: theme.foreground.muted, dim: true }, ` ETA: ${formatTime(eta)}`));
    }
  }

  if (showSpeed) {
    const speed = options.speed ?? state.getSpeed();
    if (speed > 0) {
      infoParts.push(Text({ color: theme.foreground.muted, dim: true }, ` ${formatNumber(speed)}${speedUnit}`));
    }
  }

  return Box(
    { flexDirection: 'row', gap: 1 },
    label ? Text({ color: theme.foreground.primary }, `${label} `) : Text({}, ''),
    Text({}, leftBorder),
    coloredBar,
    Text({}, rightBorder),
    ...infoParts,
    description ? Text({ color: theme.foreground.muted, dim: true }, ` ${description}`) : Text({}, '')
  );
}

/**
 * Simple standalone progress bar component
 */
export function ProgressBar(options: ProgressBarOptions): VNode {
  const value = options.value ?? 0;
  const max = options.max ?? (value > 1 ? 100 : 1);
  const progress = Math.min(1, Math.max(0, value / max));

  return renderProgressBar(
    {
      progress: () => progress,
      getEta: () => options.eta ?? Infinity,
      getSpeed: () => options.speed ?? 0,
    },
    {
      ...options,
      value,
      max,
      borderStyle: options.borderStyle ?? 'brackets',
    }
  );
}

/**
 * Multi-segment progress bar (for showing multiple parts)
 */
export interface MultiProgressBarSegment {
  value: number;
  color: string;
  label?: string;
}

export interface MultiProgressBarOptions {
  segments: MultiProgressBarSegment[];
  total: number;
  /** Maximum rendered width, including borders and legend */
  width?: number;
  showLegend?: boolean;
}

export function MultiProgressBar(options: MultiProgressBarOptions): VNode {
  const { segments, total, width = 40, showLegend = true } = options;
  const chars = getChars();
  const componentWidth = Math.max(2, Math.floor(width));
  const barWidth = componentWidth - 2;
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;

  // Calculate segment widths
  const barParts: VNode[] = [];
  let usedWidth = 0;

  for (const segment of segments) {
    const value = Number.isFinite(segment.value) ? Math.max(0, segment.value) : 0;
    const proportionalWidth = safeTotal > 0
      ? Math.floor((value / safeTotal) * barWidth)
      : 0;
    const segmentWidth = Math.min(barWidth - usedWidth, proportionalWidth);
    if (segmentWidth > 0) {
      barParts.push(Text({ color: segment.color }, chars.gauge.filled.repeat(segmentWidth)));
      usedWidth += segmentWidth;
    }
  }

  // Fill remaining with empty
  const emptyWidth = barWidth - usedWidth;
  const theme = getTheme();
  if (emptyWidth > 0) {
    barParts.push(Text({ color: theme.foreground.muted, dim: true }, chars.gauge.empty.repeat(emptyWidth)));
  }

  const legendChunks: Array<{ text: string; color: string }> = [];
  if (showLegend) {
    for (const segment of segments) {
      if (!segment.label) {
        continue;
      }
      if (legendChunks.length > 0) {
        legendChunks.push({ text: '  ', color: theme.foreground.muted });
      }
      legendChunks.push(
        { text: `${chars.bullet} `, color: segment.color },
        { text: `${segment.label}: ${segment.value}`, color: theme.foreground.muted }
      );
    }
  }

  const legendWidth = legendChunks.reduce(
    (total, chunk) => total + stringWidth(chunk.text),
    0
  );
  const renderedLegendChunks = legendWidth <= componentWidth
    ? legendChunks
    : (() => {
      const ellipsis = '…';
      let remaining = Math.max(0, componentWidth - stringWidth(ellipsis));
      const truncated: Array<{ text: string; color: string }> = [];

      for (const chunk of legendChunks) {
        if (remaining <= 0) {
          break;
        }
        const visible = truncateText(chunk.text, remaining, {
          truncationCharacter: '',
        });
        if (visible) {
          truncated.push({ ...chunk, text: visible });
          remaining -= stringWidth(visible);
        }
        if (visible !== chunk.text) {
          break;
        }
      }

      truncated.push({ text: ellipsis, color: theme.foreground.muted });
      return truncated;
    })();

  return Box(
    { flexDirection: 'column', width: componentWidth },
    Box({ flexDirection: 'row' }, Text({}, '['), ...barParts, Text({}, ']')),
    renderedLegendChunks.length > 0
      ? Box(
        { flexDirection: 'row', marginTop: 1 },
        ...renderedLegendChunks.map((chunk) =>
          Text({ color: chunk.color }, chunk.text)
        )
      )
      : null
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
