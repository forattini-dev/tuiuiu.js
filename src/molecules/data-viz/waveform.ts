/**
 * Waveform Component - Audio Visualization
 *
 * Renders audio waveforms, spectrum analyzers, and equalizer-style
 * visualizations using Unicode block characters.
 */

import type { VNode, ColorValue } from '../../utils/types.js';
import { Box, Text } from '../../primitives/nodes.js';
import { getRenderMode } from '../../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export type WaveformStyle = 'bars' | 'waveform' | 'mirrored' | 'spectrum' | 'oscilloscope';

export interface WaveformOptions {
  /** Amplitude data (0-1 range or will be normalized) */
  data: number[];
  /** Width in characters */
  width?: number;
  /** Height in rows (default: 8) */
  height?: number;
  /** Visualization style */
  style?: WaveformStyle;
  /** Primary color for bars/waveform */
  color?: ColorValue;
  /** Secondary color for gradient effect (top of bars) */
  colorHigh?: ColorValue;
  /** Background color for empty space */
  background?: ColorValue;
  /** Show peak indicators */
  showPeaks?: boolean;
  /** Peak color */
  peakColor?: ColorValue;
  /** Minimum value (for normalization) */
  min?: number;
  /** Maximum value (for normalization) */
  max?: number;
  /** Gap between bars (for 'bars' style) */
  barGap?: number;
  /** Fill character for bars */
  fillChar?: string;
  /** Empty character */
  emptyChar?: string;
  /** Border around the visualization */
  border?: boolean;
  /** Border color */
  borderColor?: ColorValue;
}

export interface WaveformBufferOptions {
  /** Number of frequency bins/bars */
  bins?: number;
  /** Smoothing factor (0-1, higher = smoother) */
  smoothing?: number;
  /** Peak decay rate (0-1, per frame) */
  peakDecay?: number;
}

// =============================================================================
// Character Sets
// =============================================================================

/** Vertical block characters for different fill levels */
const VBLOCK_CHARS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/** ASCII fallback */
const ASCII_FILL = ['_', '.', '-', '=', '#', '@', '█'];

/** Full block */
const FULL_BLOCK = '█';
const EMPTY_BLOCK = ' ';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize data to 0-1 range
 */
function normalizeData(data: number[], min?: number, max?: number): number[] {
  if (data.length === 0) return [];

  const validData = data.filter((v) => typeof v === 'number' && isFinite(v));
  if (validData.length === 0) return data.map(() => 0);

  const actualMin = min ?? Math.min(...validData);
  const actualMax = max ?? Math.max(...validData);
  const range = actualMax - actualMin || 1;

  return data.map((v) => {
    if (typeof v !== 'number' || !isFinite(v)) return 0;
    return Math.max(0, Math.min(1, (v - actualMin) / range));
  });
}

/**
 * Resample data to fit target width
 */
function resampleData(data: number[], targetWidth: number): number[] {
  if (data.length === 0) return [];
  if (data.length === targetWidth) return data;

  const result: number[] = [];
  const ratio = data.length / targetWidth;

  for (let i = 0; i < targetWidth; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);

    let sum = 0;
    let count = 0;
    for (let j = start; j < end && j < data.length; j++) {
      if (typeof data[j] === 'number' && !isNaN(data[j]!)) {
        sum += data[j]!;
        count++;
      }
    }

    result.push(count > 0 ? sum / count : 0);
  }

  return result;
}

/**
 * Get fill character based on level (0-8)
 */
// =============================================================================
// Rendering Functions
// =============================================================================

/**
 * Render vertical bars style (equalizer)
 */
function renderBars(
  data: number[],
  width: number,
  height: number,
  options: {
    color?: ColorValue;
    colorHigh?: ColorValue;
    background?: ColorValue;
    showPeaks?: boolean;
    peakColor?: ColorValue;
    min?: number;
    max?: number;
    barGap?: number;
    peaks?: number[];
    fillChar?: string;
    emptyChar?: string;
  }
): VNode[] {
  const {
    color = 'success',
    colorHigh = 'warning',
    background,
    showPeaks = false,
    peakColor = 'error',
    min,
    max,
    barGap = 0,
    peaks = [],
    fillChar,
    emptyChar,
  } = options;

  const normalized = normalizeData(data, min, max);
  const resampled = resampleData(normalized, width);
  const ascii = getRenderMode() === 'ascii';
  const resolvedFillChar = fillChar ?? (ascii ? ASCII_FILL[4]! : VBLOCK_CHARS[8]!);
  const resolvedEmptyChar = emptyChar ?? VBLOCK_CHARS[0]!;

  const rows: VNode[] = [];

  // Render from top to bottom
  for (let row = 0; row < height; row++) {
    const rowThreshold = 1 - (row + 1) / height;
    const segments: { text: string; color: ColorValue }[] = [];
    let currentSegment = { text: '', color: background || 'background' as ColorValue };

    for (let col = 0; col < resampled.length; col++) {
      const value = resampled[col] ?? 0;
      const peakValue = peaks[col] ?? 0;
      const isBarGap = barGap > 0 && (col + 1) % (barGap + 1) === 0;

      let char: string;
      let charColor: ColorValue;

      if (isBarGap) {
        char = resolvedEmptyChar;
        charColor = background || 'background';
      } else if (showPeaks && row === Math.floor((1 - peakValue) * height)) {
        char = '▀';
        charColor = peakColor;
      } else if (value > rowThreshold) {
        // Calculate sub-character fill level
        const fillLevel = Math.min(1, (value - rowThreshold) * height);
        const charIndex = Math.floor(fillLevel * 8);
        char = fillChar
          ? resolvedFillChar
          : ascii
            ? ASCII_FILL[Math.min(ASCII_FILL.length - 1, Math.floor(fillLevel * ASCII_FILL.length))]!
            : VBLOCK_CHARS[charIndex]!;

        // Color gradient: colorHigh at top, color at bottom
        const heightRatio = row / height;
        charColor = heightRatio < 0.3 ? (colorHigh || color) : color;
      } else {
        char = resolvedEmptyChar;
        charColor = background || 'background';
      }

      // Accumulate segments for efficient rendering
      if (charColor === currentSegment.color) {
        currentSegment.text += char;
      } else {
        if (currentSegment.text) {
          segments.push({ ...currentSegment });
        }
        currentSegment = { text: char, color: charColor };
      }
    }

    if (currentSegment.text) {
      segments.push(currentSegment);
    }

    rows.push(
      Box(
        { flexDirection: 'row' },
        ...segments.map((seg) => Text({ color: seg.color, backgroundColor: background }, seg.text))
      )
    );
  }

  return rows;
}

/**
 * Render classic waveform style (centered line)
 */
function renderWaveform(
  data: number[],
  width: number,
  height: number,
  options: {
    color?: ColorValue;
    background?: ColorValue;
    min?: number;
    max?: number;
  }
): VNode[] {
  const { color = 'primary', background, min, max } = options;

  const normalized = normalizeData(data, min, max);
  const resampled = resampleData(normalized, width);
  const ascii = getRenderMode() === 'ascii';

  const rows: VNode[] = [];
  const centerRow = Math.floor(height / 2);

  for (let row = 0; row < height; row++) {
    let line = '';

    for (let col = 0; col < resampled.length; col++) {
      const value = resampled[col] ?? 0;
      // Map value to row offset from center (-height/2 to +height/2)
      const amplitude = (value - 0.5) * height;
      const targetRow = centerRow - Math.round(amplitude);

      if (row === targetRow) {
        line += ascii ? '*' : '█';
      } else if (row === centerRow) {
        line += ascii ? '-' : '─';
      } else {
        line += EMPTY_BLOCK;
      }
    }

    rows.push(
      Text(
        {
          color: row === centerRow ? 'muted' : color,
          backgroundColor: background,
        },
        line,
      )
    );
  }

  return rows;
}

/**
 * Render mirrored waveform style (Soundcloud-like)
 */
function renderMirrored(
  data: number[],
  width: number,
  height: number,
  options: {
    color?: ColorValue;
    colorHigh?: ColorValue;
    background?: ColorValue;
    min?: number;
    max?: number;
  }
): VNode[] {
  const { color = 'primary', colorHigh, background, min, max } = options;

  const normalized = normalizeData(data, min, max);
  const resampled = resampleData(normalized, width);
  const ascii = getRenderMode() === 'ascii';

  const rows: VNode[] = [];
  const halfHeight = Math.floor(height / 2);

  for (let row = 0; row < height; row++) {
    const segments: { text: string; color: ColorValue }[] = [];
    let currentSegment = { text: '', color: color };

    for (let col = 0; col < resampled.length; col++) {
      const value = resampled[col] ?? 0;
      const barHeight = Math.floor(value * halfHeight);

      // Distance from center line
      const distFromCenter = Math.abs(row - halfHeight);
      const isInBar = distFromCenter <= barHeight;

      let char: string;
      let charColor: ColorValue;

      if (isInBar) {
        char = ascii ? '#' : FULL_BLOCK;
        // Color intensity based on distance from center
        charColor = distFromCenter < barHeight * 0.5 ? (colorHigh || color) : color;
      } else {
        char = EMPTY_BLOCK;
        charColor = background || 'background';
      }

      if (charColor === currentSegment.color) {
        currentSegment.text += char;
      } else {
        if (currentSegment.text) segments.push({ ...currentSegment });
        currentSegment = { text: char, color: charColor };
      }
    }

    if (currentSegment.text) segments.push(currentSegment);

    rows.push(
      Box(
        { flexDirection: 'row' },
        ...segments.map((seg) => Text({ color: seg.color, backgroundColor: background }, seg.text))
      )
    );
  }

  return rows;
}

/**
 * Render spectrum analyzer style
 */
function renderSpectrum(
  data: number[],
  width: number,
  height: number,
  options: {
    color?: ColorValue;
    colorHigh?: ColorValue;
    background?: ColorValue;
    min?: number;
    max?: number;
  }
): VNode[] {
  const { color = 'cyan', colorHigh = 'magenta', background, min, max } = options;

  // Spectrum uses gradient coloring based on frequency
  const normalized = normalizeData(data, min, max);
  const resampled = resampleData(normalized, width);
  const ascii = getRenderMode() === 'ascii';

  const rows: VNode[] = [];

  // Color gradient for spectrum (low freq -> high freq)
  const getSpectrumColor = (col: number, width: number): ColorValue => {
    const ratio = col / width;
    if (ratio < 0.33) return 'success';      // Low frequencies - green
    if (ratio < 0.66) return color;           // Mid frequencies - cyan
    return colorHigh;                          // High frequencies - magenta
  };

  for (let row = 0; row < height; row++) {
    const rowThreshold = 1 - (row + 1) / height;
    const segments: { text: string; color: ColorValue }[] = [];
    let currentSegment = { text: '', color: background || 'background' as ColorValue };

    for (let col = 0; col < resampled.length; col++) {
      const value = resampled[col] ?? 0;

      let char: string;
      let charColor: ColorValue;

      if (value > rowThreshold) {
        char = ascii ? '#' : FULL_BLOCK;
        charColor = getSpectrumColor(col, resampled.length);
      } else {
        char = EMPTY_BLOCK;
        charColor = background || 'background';
      }

      if (charColor === currentSegment.color) {
        currentSegment.text += char;
      } else {
        if (currentSegment.text) segments.push({ ...currentSegment });
        currentSegment = { text: char, color: charColor };
      }
    }

    if (currentSegment.text) segments.push(currentSegment);

    rows.push(
      Box(
        { flexDirection: 'row' },
        ...segments.map((seg) => Text({ color: seg.color, backgroundColor: background }, seg.text))
      )
    );
  }

  return rows;
}

/**
 * Render oscilloscope style (continuous line)
 */
function renderOscilloscope(
  data: number[],
  width: number,
  height: number,
  options: {
    color?: ColorValue;
    background?: ColorValue;
    min?: number;
    max?: number;
  }
): VNode[] {
  const { color = 'success', background, min, max } = options;

  const normalized = normalizeData(data, min, max);
  const resampled = resampleData(normalized, width);
  const ascii = getRenderMode() === 'ascii';

  // Build a 2D grid
  const grid: string[][] = Array.from({ length: height }, () =>
    Array(width).fill(EMPTY_BLOCK)
  );

  // Plot the waveform
  for (let col = 0; col < resampled.length; col++) {
    const value = resampled[col] ?? 0.5;
    const row = Math.floor((1 - value) * (height - 1));

    // Use line-drawing characters for smooth lines
    if (col > 0) {
      const prevValue = resampled[col - 1] ?? 0.5;
      const prevRow = Math.floor((1 - prevValue) * (height - 1));

      // Draw line segment between points
      const minRow = Math.min(row, prevRow);
      const maxRow = Math.max(row, prevRow);

      for (let r = minRow; r <= maxRow; r++) {
        if (r >= 0 && r < height) {
          grid[r]![col] = ascii ? '*' : '│';
        }
      }
    }

    // Draw the point
    if (row >= 0 && row < height) {
      grid[row]![col] = ascii ? 'o' : '●';
    }
  }

  return grid.map((rowChars) => Text({ color, backgroundColor: background }, rowChars.join('')));
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Waveform - Audio visualization component
 *
 * @example
 * // Basic equalizer bars
 * Waveform({
 *   data: audioLevels,
 *   width: 40,
 *   height: 8,
 *   style: 'bars',
 *   color: 'success',
 *   colorHigh: 'warning',
 * })
 *
 * @example
 * // Soundcloud-style mirrored waveform
 * Waveform({
 *   data: waveformData,
 *   width: 60,
 *   height: 10,
 *   style: 'mirrored',
 *   color: 'primary',
 * })
 *
 * @example
 * // Spectrum analyzer
 * Waveform({
 *   data: fftData,
 *   width: 32,
 *   height: 8,
 *   style: 'spectrum',
 * })
 */
export function Waveform(options: WaveformOptions): VNode {
  const {
    data,
    width = 40,
    height = 8,
    style = 'bars',
    color = 'success',
    colorHigh,
    background,
    showPeaks = false,
    peakColor = 'error',
    min,
    max,
    barGap = 0,
    fillChar,
    emptyChar,
    border = false,
    borderColor = 'border',
  } = options;

  if (!Number.isInteger(width) || width <= 0) {
    throw new RangeError('Waveform width must be a positive integer');
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new RangeError('Waveform height must be a positive integer');
  }
  if (!Number.isInteger(barGap) || barGap < 0) {
    throw new RangeError('Waveform barGap must be a non-negative integer');
  }
  if (min !== undefined && !Number.isFinite(min)) {
    throw new RangeError('Waveform min must be finite');
  }
  if (max !== undefined && !Number.isFinite(max)) {
    throw new RangeError('Waveform max must be finite');
  }
  if (min !== undefined && max !== undefined && max <= min) {
    throw new RangeError('Waveform max must be greater than min');
  }

  let rows: VNode[];

  switch (style) {
    case 'waveform':
      rows = renderWaveform(data, width, height, { color, background, min, max });
      break;
    case 'mirrored':
      rows = renderMirrored(data, width, height, { color, colorHigh, background, min, max });
      break;
    case 'spectrum':
      rows = renderSpectrum(data, width, height, { color, colorHigh, background, min, max });
      break;
    case 'oscilloscope':
      rows = renderOscilloscope(data, width, height, { color, background, min, max });
      break;
    case 'bars':
    default:
      rows = renderBars(data, width, height, {
        color,
        colorHigh,
        background,
        showPeaks,
        peakColor,
        min,
        max,
        barGap,
        fillChar,
        emptyChar,
      });
      break;
  }

  const content = Box({ flexDirection: 'column' }, ...rows);

  if (border) {
    return Box(
      {
        borderStyle: 'round',
        borderColor,
        paddingX: 1,
      },
      content
    );
  }

  return content;
}

// =============================================================================
// Audio Buffer (for real-time visualization)
// =============================================================================

/**
 * WaveformBuffer - Rolling buffer for audio visualization
 *
 * Maintains frequency bins with smoothing and peak detection.
 *
 * @example
 * const buffer = createWaveformBuffer({ bins: 32, smoothing: 0.8 });
 *
 * // Update with new audio data
 * buffer.update(fftData);
 *
 * // Render
 * Waveform({
 *   data: buffer.data(),
 *   width: 32,
 *   height: 8,
 *   showPeaks: true,
 * })
 */
export class WaveformBuffer {
  private _bins: number;
  private _smoothing: number;
  private _peakDecay: number;
  private _data: number[];
  private _peaks: number[];
  private _history: number[][] = [];
  private _maxHistory = 60;

  constructor(options: WaveformBufferOptions = {}) {
    this._bins = options.bins ?? 32;
    this._smoothing = options.smoothing ?? 0.8;
    this._peakDecay = options.peakDecay ?? 0.95;
    this._data = new Array(this._bins).fill(0);
    this._peaks = new Array(this._bins).fill(0);
  }

  /**
   * Update with new audio data
   */
  update(newData: number[]): void {
    // Resample to match bins
    const resampled = resampleData(newData, this._bins);

    // Apply smoothing
    for (let i = 0; i < this._bins; i++) {
      const newValue = resampled[i] ?? 0;
      this._data[i] = this._data[i]! * this._smoothing + newValue * (1 - this._smoothing);

      // Update peaks
      if (this._data[i]! > this._peaks[i]!) {
        this._peaks[i] = this._data[i]!;
      } else {
        this._peaks[i] = this._peaks[i]! * this._peakDecay;
      }
    }

    // Store in history
    this._history.push([...this._data]);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }
  }

  /**
   * Get current data
   */
  data(): number[] {
    return [...this._data];
  }

  /**
   * Get peak data
   */
  peaks(): number[] {
    return [...this._peaks];
  }

  /**
   * Get history for waveform display
   */
  history(): number[] {
    return this._history.flatMap((frame) => {
      // Average each frame to a single value for waveform
      const sum = frame.reduce((a, b) => a + b, 0);
      return sum / frame.length;
    });
  }

  /**
   * Reset peaks
   */
  resetPeaks(): void {
    this._peaks = new Array(this._bins).fill(0);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this._data = new Array(this._bins).fill(0);
    this._peaks = new Array(this._bins).fill(0);
    this._history = [];
  }

  /**
   * Create VNode with current data
   */
  toVNode(options: Omit<WaveformOptions, 'data'> = {}): VNode {
    return Waveform({
      data: this._data,
      ...options,
    });
  }
}

/**
 * Factory function to create a WaveformBuffer
 */
export function createWaveformBuffer(
  options: WaveformBufferOptions = {}
): WaveformBuffer {
  return new WaveformBuffer(options);
}

// =============================================================================
// Utility: Generate test/demo data
// =============================================================================

/**
 * Generate random audio-like data for testing
 */
export function generateWaveformData(
  length: number,
  options: {
    /** Base frequency for sine wave */
    frequency?: number;
    /** Add random noise (0-1) */
    noise?: number;
    /** Amplitude (0-1) */
    amplitude?: number;
  } = {}
): number[] {
  const { frequency = 0.1, noise = 0.2, amplitude = 0.8 } = options;

  return Array.from({ length }, (_, i) => {
    const sine = Math.sin(i * frequency * Math.PI * 2) * amplitude;
    const randomNoise = (Math.random() - 0.5) * noise;
    return Math.max(0, Math.min(1, 0.5 + sine * 0.5 + randomNoise));
  });
}

/**
 * Generate spectrum-like data (higher frequencies = lower amplitude)
 */
export function generateSpectrumData(
  bins: number,
  options: {
    /** Peak frequency bin (0 to bins-1) */
    peakBin?: number;
    /** Spread of the peak */
    spread?: number;
    /** Random variation */
    variation?: number;
  } = {}
): number[] {
  const { peakBin = Math.floor(bins * 0.2), spread = bins * 0.3, variation = 0.3 } = options;

  return Array.from({ length: bins }, (_, i) => {
    // Gaussian distribution around peak
    const distance = Math.abs(i - peakBin);
    const gaussian = Math.exp(-(distance * distance) / (2 * spread * spread));
    const randomVariation = (Math.random() - 0.5) * variation;
    return Math.max(0, Math.min(1, gaussian + randomVariation));
  });
}
