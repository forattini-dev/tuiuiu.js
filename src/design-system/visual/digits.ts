/**
 * Digits - LCD-style numeric display
 *
 * Features:
 * - LCD-style numbers (7-segment display)
 * - Block style
 * - Dot matrix style
 * - Time/clock format
 * - Color support
 */

import { Box, Text } from '../../primitives/nodes.js';
import type { VNode, ColorValue } from '../../utils/types.js';
import { getRenderMode } from '../../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export type DigitsStyle = 'lcd' | 'block' | 'dotmatrix' | 'minimal';

export interface DigitsOptions {
  /** Value to display (number or string like "12:34") */
  value: number | string;
  /** Display style */
  style?: DigitsStyle;
  /** Number of digits to show (left-pad with zeros) */
  digits?: number;
  /** Color */
  color?: ColorValue;
  /** Background color (for LCD style) */
  backgroundColor?: ColorValue;
  /** Show leading zeros */
  leadingZeros?: boolean;
  /** Separator character for time (default: ":") */
  separator?: string;
}

// =============================================================================
// Font Definitions - LCD Style (7-segment display simulation)
// =============================================================================

// LCD uses segments: top, top-left, top-right, middle, bottom-left, bottom-right, bottom
// Represented as 3x5 character grid

const LCD_DIGITS: Record<string, string[]> = {
  '0': ['┌─┐', '│ │', '│ │', '│ │', '└─┘'],
  '1': ['   ', '  │', '  │', '  │', '  │'],
  '2': ['┌─┐', '  │', '┌─┘', '│  ', '└─┘'],
  '3': ['┌─┐', '  │', '├─┤', '  │', '└─┘'],
  '4': ['   ', '│ │', '└─┤', '  │', '  │'],
  '5': ['┌─┐', '│  ', '└─┐', '  │', '└─┘'],
  '6': ['┌─┐', '│  ', '├─┐', '│ │', '└─┘'],
  '7': ['┌─┐', '  │', '  │', '  │', '  │'],
  '8': ['┌─┐', '│ │', '├─┤', '│ │', '└─┘'],
  '9': ['┌─┐', '│ │', '└─┤', '  │', '└─┘'],
  ':': ['   ', ' ● ', '   ', ' ● ', '   '],
  '.': ['   ', '   ', '   ', '   ', ' ● '],
  '-': ['   ', '   ', '───', '   ', '   '],
  ' ': ['   ', '   ', '   ', '   ', '   '],
};

// Block style - uses solid block characters
const BLOCK_DIGITS: Record<string, string[]> = {
  '0': ['███', '█ █', '█ █', '█ █', '███'],
  '1': [' █ ', '██ ', ' █ ', ' █ ', '███'],
  '2': ['███', '  █', '███', '█  ', '███'],
  '3': ['███', '  █', '███', '  █', '███'],
  '4': ['█ █', '█ █', '███', '  █', '  █'],
  '5': ['███', '█  ', '███', '  █', '███'],
  '6': ['███', '█  ', '███', '█ █', '███'],
  '7': ['███', '  █', '  █', '  █', '  █'],
  '8': ['███', '█ █', '███', '█ █', '███'],
  '9': ['███', '█ █', '███', '  █', '███'],
  ':': ['   ', ' █ ', '   ', ' █ ', '   '],
  '.': ['   ', '   ', '   ', '   ', ' █ '],
  '-': ['   ', '   ', '███', '   ', '   '],
  ' ': ['   ', '   ', '   ', '   ', '   '],
};

// Dot matrix style - 5x5 dots
const DOTMATRIX_DIGITS: Record<string, string[]> = {
  '0': ['⬤⬤⬤', '⬤ ⬤', '⬤ ⬤', '⬤ ⬤', '⬤⬤⬤'],
  '1': [' ⬤ ', '⬤⬤ ', ' ⬤ ', ' ⬤ ', '⬤⬤⬤'],
  '2': ['⬤⬤⬤', '  ⬤', '⬤⬤⬤', '⬤  ', '⬤⬤⬤'],
  '3': ['⬤⬤⬤', '  ⬤', '⬤⬤⬤', '  ⬤', '⬤⬤⬤'],
  '4': ['⬤ ⬤', '⬤ ⬤', '⬤⬤⬤', '  ⬤', '  ⬤'],
  '5': ['⬤⬤⬤', '⬤  ', '⬤⬤⬤', '  ⬤', '⬤⬤⬤'],
  '6': ['⬤⬤⬤', '⬤  ', '⬤⬤⬤', '⬤ ⬤', '⬤⬤⬤'],
  '7': ['⬤⬤⬤', '  ⬤', '  ⬤', '  ⬤', '  ⬤'],
  '8': ['⬤⬤⬤', '⬤ ⬤', '⬤⬤⬤', '⬤ ⬤', '⬤⬤⬤'],
  '9': ['⬤⬤⬤', '⬤ ⬤', '⬤⬤⬤', '  ⬤', '⬤⬤⬤'],
  ':': ['   ', ' ⬤ ', '   ', ' ⬤ ', '   '],
  '.': ['   ', '   ', '   ', '   ', ' ⬤ '],
  '-': ['   ', '   ', '⬤⬤⬤', '   ', '   '],
  ' ': ['   ', '   ', '   ', '   ', '   '],
};

// Minimal style - smaller 3x3
const MINIMAL_DIGITS: Record<string, string[]> = {
  '0': ['▄█▄', '█ █', '▀█▀'],
  '1': ['▄█ ', ' █ ', '▄█▄'],
  '2': ['▀█▄', ' █ ', '▄█▀'],
  '3': ['▀█▄', ' █▄', '▀█▀'],
  '4': ['▄ ▄', '▀█▀', '  █'],
  '5': ['▄█▀', '▀█▄', '▄█▀'],
  '6': ['▄█▄', '█▄ ', '▀█▀'],
  '7': ['▀▀█', '  █', '  █'],
  '8': ['▄█▄', '▄█▄', '▀█▀'],
  '9': ['▄█▄', '▀█▀', '▄█▀'],
  ':': ['   ', ' ▪ ', ' ▪ '],
  '.': ['   ', '   ', ' ▄ '],
  '-': ['   ', '▀▀▀', '   '],
  ' ': ['   ', '   ', '   '],
};

// ASCII fallback for LCD
const ASCII_DIGITS: Record<string, string[]> = {
  '0': [' _ ', '| |', '|_|'],
  '1': ['   ', '  |', '  |'],
  '2': [' _ ', ' _|', '|_ '],
  '3': [' _ ', ' _|', ' _|'],
  '4': ['   ', '|_|', '  |'],
  '5': [' _ ', '|_ ', ' _|'],
  '6': [' _ ', '|_ ', '|_|'],
  '7': [' _ ', '  |', '  |'],
  '8': [' _ ', '|_|', '|_|'],
  '9': [' _ ', '|_|', ' _|'],
  ':': ['   ', ' . ', ' . '],
  '.': ['   ', '   ', ' . '],
  '-': ['   ', '---', '   '],
  ' ': ['   ', '   ', '   '],
};

// Font map
const DIGIT_FONTS: Record<DigitsStyle, Record<string, string[]>> = {
  lcd: LCD_DIGITS,
  block: BLOCK_DIGITS,
  dotmatrix: DOTMATRIX_DIGITS,
  minimal: MINIMAL_DIGITS,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get digit definition
 */
function getDigit(char: string, style: DigitsStyle, useAscii: boolean): string[] {
  if (useAscii && style === 'lcd') {
    return ASCII_DIGITS[char] || ASCII_DIGITS[' ']!;
  }
  const font = DIGIT_FONTS[style];
  return font[char] || font[' ']!;
}

/**
 * Format number with leading zeros
 */
function formatValue(
  value: number | string,
  digits?: number,
  leadingZeros?: boolean
): string {
  const str = String(value);

  if (digits && leadingZeros) {
    // Only pad numeric parts
    if (str.includes(':')) {
      // Time format
      return str;
    }
    return str.padStart(digits, '0');
  }

  return str;
}

// =============================================================================
// Components
// =============================================================================

/**
 * Digits - LCD-style numeric display
 *
 * @example
 * // Simple number
 * Digits({ value: 1234, style: 'lcd', color: 'green' })
 *
 * @example
 * // Time display
 * Digits({ value: '12:34', style: 'block', color: 'cyan' })
 *
 * @example
 * // With leading zeros
 * Digits({ value: 42, digits: 4, leadingZeros: true })
 */
export function Digits(props: DigitsOptions): VNode {
  const {
    value,
    style = 'lcd',
    digits,
    color = 'success',
    leadingZeros = false,
  } = props;

  const isAscii = getRenderMode() === 'ascii';
  const formatted = formatValue(value, digits, leadingZeros);
  const chars = formatted.split('');

  // Get height of font
  const sampleDigit = getDigit('0', style, isAscii);
  const height = sampleDigit.length;

  // Build each line
  const lines: VNode[] = [];

  for (let row = 0; row < height; row++) {
    const lineParts: VNode[] = [];

    chars.forEach((char, i) => {
      const digitDef = getDigit(char, style, isAscii);
      const digitLine = digitDef[row] || '';

      lineParts.push(Text({ color }, digitLine));

      // Add small gap between digits (except for separators)
      if (i < chars.length - 1 && char !== ':' && chars[i + 1] !== ':') {
        lineParts.push(Text({}, ' '));
      }
    });

    lines.push(Box({ flexDirection: 'row' }, ...lineParts));
  }

  return Box({ flexDirection: 'column' }, ...lines);
}

// =============================================================================
// Clock - Real-time clock display
// =============================================================================

export interface ClockOptions {
  /** Clock format */
  format?: '12h' | '24h';
  /** Show seconds */
  showSeconds?: boolean;
  /** Style */
  style?: DigitsStyle;
  /** Color */
  color?: ColorValue;
  /** Blink separator */
  blinkSeparator?: boolean;
}

/**
 * Clock - Time display (requires external time update)
 *
 * @example
 * // Use with a time signal
 * const [time, setTime] = createSignal(new Date());
 * setInterval(() => setTime(new Date()), 1000);
 *
 * Clock({ time: time(), format: '24h', showSeconds: true })
 */
export function Clock(
  props: ClockOptions & { time: Date }
): VNode {
  const {
    time,
    format = '24h',
    showSeconds = false,
    style = 'lcd',
    color = 'success',
  } = props;

  let hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // 12-hour format
  let suffix = '';
  if (format === '12h') {
    suffix = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12 || 12;
  }

  // Build time string
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  let timeStr = `${hoursStr}:${minutesStr}`;
  if (showSeconds) {
    timeStr += `:${secondsStr}`;
  }

  return Box(
    { flexDirection: 'row' },
    Digits({ value: timeStr, style, color }),
    suffix ? Text({ color }, suffix) : null
  );
}

// =============================================================================
// Counter - Animated counter display
// =============================================================================

export interface CounterOptions {
  /** Current value */
  value: number;
  /** Number of digits */
  digits?: number;
  /** Style */
  style?: DigitsStyle;
  /** Color */
  color?: ColorValue;
  /** Show +/- sign */
  showSign?: boolean;
}

/**
 * Counter - Numeric counter display
 *
 * @example
 * const [count, setCount] = createSignal(0);
 * Counter({ value: count(), digits: 4, color: 'cyan' })
 */
export function Counter(props: CounterOptions): VNode {
  const {
    value,
    digits = 4,
    style = 'lcd',
    color = 'success',
    showSign = false,
  } = props;

  let displayValue = Math.abs(value);
  const sign = value < 0 ? '-' : value > 0 ? '+' : ' ';

  const valueStr = String(displayValue).padStart(digits, '0');

  if (showSign) {
    return Box(
      { flexDirection: 'row' },
      Digits({ value: sign, style, color }),
      Digits({ value: valueStr, style, color })
    );
  }

  return Digits({ value: valueStr, style, color });
}

// =============================================================================
// Countdown - Countdown timer display
// =============================================================================

export interface CountdownOptions {
  /** Remaining seconds */
  seconds: number;
  /** Style */
  style?: DigitsStyle;
  /** Color */
  color?: ColorValue;
  /** Color when low (< 10 seconds) */
  lowColor?: ColorValue;
  /** Show hours */
  showHours?: boolean;
}

/**
 * Countdown - Countdown timer display
 *
 * @example
 * Countdown({ seconds: 125, style: 'block', color: 'green', lowColor: 'red' })
 */
export function Countdown(props: CountdownOptions): VNode {
  const {
    seconds,
    style = 'lcd',
    color = 'success',
    lowColor = 'destructive',
    showHours = false,
  } = props;

  const isLow = seconds <= 10;
  const displayColor = isLow ? lowColor : color;

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  let timeStr: string;
  if (showHours || hours > 0) {
    timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else {
    timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return Digits({ value: timeStr, style, color: displayColor });
}

// =============================================================================
// Stopwatch - Stopwatch display
// =============================================================================

export interface StopwatchOptions {
  /** Elapsed milliseconds */
  milliseconds: number;
  /** Style */
  style?: DigitsStyle;
  /** Color */
  color?: ColorValue;
  /** Show milliseconds */
  showMilliseconds?: boolean;
}

/**
 * Stopwatch - Stopwatch display
 *
 * @example
 * Stopwatch({ milliseconds: 62345, showMilliseconds: true })
 */
export function Stopwatch(props: StopwatchOptions): VNode {
  const {
    milliseconds,
    style = 'lcd',
    color = 'success',
    showMilliseconds = false,
  } = props;

  const totalSeconds = Math.floor(milliseconds / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const ms = Math.floor((milliseconds % 1000) / 10);

  let timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  if (showMilliseconds) {
    timeStr += `.${String(ms).padStart(2, '0')}`;
  }

  return Digits({ value: timeStr, style, color });
}

// =============================================================================
// DigitRoll - Odometer-style rolling digit
// =============================================================================

export interface DigitRollOptions {
  /** Target value */
  value: number;
  /** Number of digits */
  digits?: number;
  /** Style */
  style?: DigitsStyle;
  /** Color */
  color?: ColorValue;
}

/**
 * DigitRoll - Displays number (animation would require external timer)
 */
export function DigitRoll(props: DigitRollOptions): VNode {
  const { value, digits = 4, style = 'lcd', color = 'success' } = props;

  const displayValue = String(Math.floor(value)).padStart(digits, '0');

  return Digits({ value: displayValue, style, color });
}

// =============================================================================
// Score - Game score display
// =============================================================================

export interface ScoreOptions {
  /** Score value */
  score: number;
  /** Label */
  label?: string;
  /** Style */
  style?: DigitsStyle;
  /** Color */
  color?: ColorValue;
  /** Label color */
  labelColor?: ColorValue;
}

/**
 * Score - Game score display with label
 *
 * @example
 * Score({ score: 12500, label: 'SCORE', style: 'block', color: 'yellow' })
 */
export function Score(props: ScoreOptions): VNode {
  const {
    score,
    label = 'SCORE',
    style = 'lcd',
    color = 'success',
    labelColor = 'mutedForeground',
  } = props;

  return Box(
    { flexDirection: 'column' },
    label ? Text({ color: labelColor, bold: true }, label) : null,
    Digits({ value: score, style, color, digits: 6, leadingZeros: true })
  );
}
