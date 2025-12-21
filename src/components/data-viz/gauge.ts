/**
 * Gauge Component - Progress and Value Gauges
 *
 * Renders various gauge styles for displaying progress or values:
 * - Linear (horizontal/vertical bars)
 * - Arc (semicircle using Unicode)
 * - Meter (segmented display)
 */

import type { VNode, ColorValue } from '../../utils/types.js';
import { Box, Text } from '../components.js';
import { getRenderMode } from '../../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export type GaugeStyle = 'linear' | 'arc' | 'meter' | 'dial';

export interface GaugeZone {
  /** Start value (percentage 0-100) */
  start: number;
  /** End value (percentage 0-100) */
  end: number;
  /** Zone color */
  color: ColorValue;
  /** Optional label */
  label?: string;
}

export interface GaugeOptions {
  /** Current value (0-100 by default) */
  value: number;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Gauge style */
  style?: GaugeStyle;
  /** Width in characters (default: 30 for linear, 15 for arc) */
  width?: number;
  /** Height in rows (for vertical linear or arc) */
  height?: number;
  /** Show value label */
  showValue?: boolean;
  /** Value formatter */
  formatValue?: (value: number) => string;
  /** Value position */
  valuePosition?: 'left' | 'right' | 'center' | 'inside' | 'below';
  /** Show min/max labels */
  showMinMax?: boolean;
  /** Filled color */
  color?: ColorValue;
  /** Background color */
  backgroundColor?: ColorValue;
  /** Color zones (override single color) */
  zones?: GaugeZone[];
  /** Label */
  label?: string;
  /** Label color */
  labelColor?: ColorValue;
  /** Animation (requires useAnimation) */
  animated?: boolean;
}

export interface MeterOptions extends Omit<GaugeOptions, 'style'> {
  /** Number of segments (default: 10) */
  segments?: number;
  /** Segment character */
  segmentChar?: string;
  /** Empty segment character */
  emptyChar?: string;
}

// =============================================================================
// Character Sets
// =============================================================================

const GAUGE_CHARS = {
  unicode: {
    filled: '█',
    empty: '░',
    partial: ['▏', '▎', '▍', '▌', '▋', '▊', '▉'],
    verticalFilled: '█',
    verticalEmpty: '░',
    verticalPartial: ['▁', '▂', '▃', '▄', '▅', '▆', '▇'],
    arcTop: ['╭', '─', '╮'],
    arcBottom: ['╰', '─', '╯'],
    dialPointer: '▲',
    meterFilled: '●',
    meterEmpty: '○',
  },
  ascii: {
    filled: '#',
    empty: '-',
    partial: ['>'],
    verticalFilled: '#',
    verticalEmpty: '-',
    verticalPartial: ['_', '.', 'o', 'O'],
    arcTop: ['+', '-', '+'],
    arcBottom: ['+', '-', '+'],
    dialPointer: '^',
    meterFilled: '[*]',
    meterEmpty: '[ ]',
  },
};

function getGaugeChars() {
  return getRenderMode() === 'ascii' ? GAUGE_CHARS.ascii : GAUGE_CHARS.unicode;
}

// =============================================================================
// Default Color Zones
// =============================================================================

const DEFAULT_ZONES: GaugeZone[] = [
  { start: 0, end: 60, color: 'green' },
  { start: 60, end: 85, color: 'yellow' },
  { start: 85, end: 100, color: 'red' },
];

/**
 * Get color for value based on zones
 */
function getZoneColor(
  value: number,
  zones: GaugeZone[],
  defaultColor: ColorValue = 'cyan'
): ColorValue {
  for (const zone of zones) {
    if (value >= zone.start && value <= zone.end) {
      return zone.color;
    }
  }
  return defaultColor;
}

// =============================================================================
// Linear Gauge
// =============================================================================

/**
 * Render a linear gauge string
 */
export function renderLinearGaugeString(
  value: number,
  options: {
    width?: number;
    min?: number;
    max?: number;
    showBackground?: boolean;
  } = {}
): string {
  const { width = 30, min = 0, max = 100, showBackground = true } = options;

  const chars = getGaugeChars();
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const filledLength = normalized * width;
  const fullBlocks = Math.floor(filledLength);
  const partialFraction = filledLength - fullBlocks;

  let bar = chars.filled.repeat(fullBlocks);

  // Add partial block
  if (partialFraction > 0 && chars.partial.length > 0) {
    const partialIndex = Math.min(
      Math.floor(partialFraction * chars.partial.length),
      chars.partial.length - 1
    );
    bar += chars.partial[partialIndex] || '';
  }

  // Add background
  if (showBackground) {
    const emptyLength = width - bar.length;
    bar += chars.empty.repeat(Math.max(0, emptyLength));
  }

  return bar.slice(0, width);
}

/**
 * LinearGauge component
 */
export function LinearGauge(options: GaugeOptions): VNode {
  const {
    value,
    min = 0,
    max = 100,
    width: totalWidth = 30, // Treat as total width goal
    showValue = true,
    formatValue,
    valuePosition = 'right',
    showMinMax = false,
    color = 'cyan',
    backgroundColor = 'gray',
    zones,
    label,
    labelColor = 'white',
  } = options;

  const chars = getGaugeChars();
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const percentage = normalized * 100;

  // Format value to determine width
  const valueStr = formatValue
    ? formatValue(value)
    : `${Math.round(percentage)}%`;
  
  // Calculate peripheral widths
  let extrasWidth = 0;
  
  if (label) extrasWidth += label.length + 1; // + margin
  if (showMinMax) {
    extrasWidth += String(min).length + 1;
    extrasWidth += String(max).length + 1;
  }
  if (showValue && (valuePosition === 'left' || valuePosition === 'right')) {
    extrasWidth += valueStr.length + 1; // + margin
  }

  // Calculate bar width
  const barWidth = Math.max(1, totalWidth - extrasWidth);

  const filledLength = normalized * barWidth;
  const fullBlocks = Math.floor(filledLength);
  const partialFraction = filledLength - fullBlocks;

  // Determine color based on zones
  const barColor = zones
    ? getZoneColor(percentage, zones, color)
    : color;

  // Build bar segments
  const barParts: VNode[] = [];

  // Filled portion
  if (fullBlocks > 0) {
    barParts.push(Text({ color: barColor }, chars.filled.repeat(fullBlocks)));
  }

  // Partial block
  if (partialFraction > 0 && chars.partial.length > 0) {
    const partialIndex = Math.min(
      Math.floor(partialFraction * chars.partial.length),
      chars.partial.length - 1
    );
    barParts.push(Text({ color: barColor }, chars.partial[partialIndex] || ''));
  }

  // Empty portion
  const filledLen = fullBlocks + (partialFraction > 0 ? 1 : 0);
  const emptyLen = Math.max(0, barWidth - filledLen);
  if (emptyLen > 0) {
    barParts.push(
      Text({ color: backgroundColor, dim: true }, chars.empty.repeat(emptyLen))
    );
  }

  // Build layout based on value position
  const parts: (VNode | null)[] = [];

  // Label
  if (label) {
    parts.push(Box({ marginRight: 1 }, Text({ color: labelColor }, label)));
  }

  // Min label
  if (showMinMax) {
    parts.push(Box({ marginRight: 1 }, Text({ color: 'gray', dim: true }, String(min))));
  }

  // Value left
  if (showValue && valuePosition === 'left') {
    parts.push(Box({ marginRight: 1 }, Text({ color: barColor }, valueStr)));
  }

  // Bar
  parts.push(Box({ flexDirection: 'row' }, ...barParts));

  // Value right
  if (showValue && valuePosition === 'right') {
    parts.push(Box({ marginLeft: 1 }, Text({ color: barColor }, valueStr)));
  }

  // Max label
  if (showMinMax) {
    parts.push(Box({ marginLeft: 1 }, Text({ color: 'gray', dim: true }, String(max))));
  }

  // Value inside (overlay - show at end of filled section)
  if (showValue && valuePosition === 'inside') {
    // Not ideal for terminals, fallback to right
    parts.push(Box({ marginLeft: 1 }, Text({ color: 'white' }, valueStr)));
  }

  const mainRow = Box({ flexDirection: 'row', alignItems: 'center' }, ...parts);

  // Value below
  if (showValue && valuePosition === 'below') {
    return Box(
      { flexDirection: 'column' },
      mainRow,
      Box(
        { flexDirection: 'row', justifyContent: 'center', width: totalWidth },
        Text({ color: barColor }, valueStr)
      )
    );
  }

  // Value center (below bar, centered)
  if (showValue && valuePosition === 'center') {
    return Box(
      { flexDirection: 'column' },
      mainRow,
      Box({ justifyContent: 'center' }, Text({ color: barColor }, valueStr))
    );
  }

  return mainRow;
}

// =============================================================================
// Meter Gauge (Segmented)
// =============================================================================

/**
 * MeterGauge - Segmented gauge display
 *
 * @example
 * MeterGauge({
 *   value: 7,
 *   min: 0,
 *   max: 10,
 *   segments: 10,
 *   color: 'green',
 * })
 */
export function MeterGauge(options: MeterOptions): VNode {
  const {
    value,
    min = 0,
    max = 100,
    segments = 10,
    showValue = true,
    formatValue,
    color = 'cyan',
    backgroundColor = 'gray',
    zones,
    label,
    labelColor = 'white',
    segmentChar,
    emptyChar,
  } = options;

  const chars = getGaugeChars();
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const filledSegments = Math.round(normalized * segments);
  const percentage = normalized * 100;

  const filled = segmentChar ?? chars.meterFilled;
  const empty = emptyChar ?? chars.meterEmpty;

  const segmentNodes: VNode[] = [];

  for (let i = 0; i < segments; i++) {
    const segmentPercentage = ((i + 0.5) / segments) * 100;
    const isFilled = i < filledSegments;
    const segmentColor = zones
      ? getZoneColor(segmentPercentage, zones, color)
      : color;

    segmentNodes.push(
      Text(
        { color: isFilled ? segmentColor : backgroundColor, dim: !isFilled },
        isFilled ? filled : empty
      )
    );
  }

  const valueStr = formatValue
    ? formatValue(value)
    : `${Math.round(percentage)}%`;

  const parts: (VNode | null)[] = [];

  if (label) {
    parts.push(Box({ marginRight: 1 }, Text({ color: labelColor }, label)));
  }

  parts.push(Box({ flexDirection: 'row', gap: 0 }, ...segmentNodes));

  if (showValue) {
    parts.push(Box({ marginLeft: 1 }, Text({ color }, valueStr)));
  }

  return Box({ flexDirection: 'row', alignItems: 'center' }, ...parts);
}

// =============================================================================
// Arc Gauge (Semicircle)
// =============================================================================

/**
 * Render arc gauge as ASCII art
 */
function renderArcGaugeLines(
  value: number,
  options: {
    width?: number;
    min?: number;
    max?: number;
  } = {}
): string[] {
  const { width = 15, min = 0, max = 100 } = options;

  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const isAscii = getRenderMode() === 'ascii';

  // Simple ASCII arc representation
  const arcWidth = width;
  const half = Math.floor(arcWidth / 2);

  if (isAscii) {
    // ASCII arc:
    //   /-----\
    //  |   ^   |
    //  +-------+
    const pointerPos = Math.round(normalized * (arcWidth - 2));
    const topLine = ' ' + '/'.padStart(half, ' ') + '-'.repeat(arcWidth - 2) + '\\';
    const midLine = '|' + ' '.repeat(pointerPos) + '^' + ' '.repeat(arcWidth - 2 - pointerPos) + '|';
    const bottomLine = '+' + '-'.repeat(arcWidth) + '+';

    return [topLine, midLine, bottomLine];
  }

  // Unicode arc (simplified semicircle):
  //    ╭───────╮
  //   ╱         ╲
  //  ▕    ▲     ▏
  //  └─────────┘
  const lines: string[] = [];

  // Top curve
  const topPadding = Math.floor((arcWidth - 3) / 2);
  lines.push(' '.repeat(topPadding) + '╭' + '─'.repeat(arcWidth - topPadding * 2 - 2) + '╮');

  // Middle with pointer
  const pointerPos = Math.round(normalized * (arcWidth - 2));
  lines.push('│' + ' '.repeat(pointerPos) + '▲' + ' '.repeat(arcWidth - 2 - pointerPos) + '│');

  // Bottom
  lines.push('└' + '─'.repeat(arcWidth - 2) + '┘');

  return lines;
}

/**
 * ArcGauge - Semicircle gauge
 *
 * @example
 * ArcGauge({
 *   value: 65,
 *   showValue: true,
 *   color: 'cyan',
 * })
 */
export function ArcGauge(options: GaugeOptions): VNode {
  const {
    value,
    min = 0,
    max = 100,
    width = 15,
    showValue = true,
    formatValue,
    color = 'cyan',
    zones,
    label,
    labelColor = 'white',
  } = options;

  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const percentage = normalized * 100;

  const arcLines = renderArcGaugeLines(value, { width, min, max });
  const barColor = zones ? getZoneColor(percentage, zones, color) : color;

  const valueStr = formatValue
    ? formatValue(value)
    : `${Math.round(percentage)}%`;

  const arcNodes = arcLines.map((line) => Text({ color: barColor }, line));

  const parts: VNode[] = [];

  if (label) {
    parts.push(
      Box({ marginBottom: 1, justifyContent: 'center' }, Text({ color: labelColor }, label))
    );
  }

  parts.push(...arcNodes);

  if (showValue) {
    parts.push(
      Box({ marginTop: 1, justifyContent: 'center' }, Text({ color: barColor }, valueStr))
    );
  }

  return Box({ flexDirection: 'column', alignItems: 'center' }, ...parts);
}

// =============================================================================
// Dial Gauge
// =============================================================================

/**
 * DialGauge - Circular dial with pointer (simplified for terminal)
 *
 * @example
 * DialGauge({
 *   value: 75,
 *   zones: [
 *     { start: 0, end: 50, color: 'green' },
 *     { start: 50, end: 80, color: 'yellow' },
 *     { start: 80, end: 100, color: 'red' },
 *   ],
 * })
 */
export function DialGauge(options: GaugeOptions): VNode {
  const {
    value,
    min = 0,
    max = 100,
    width = 11,
    showValue = true,
    formatValue,
    showMinMax = true,
    color = 'cyan',
    zones = DEFAULT_ZONES,
    label,
    labelColor = 'white',
  } = options;

  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const percentage = normalized * 100;
  const barColor = getZoneColor(percentage, zones, color);
  const isAscii = getRenderMode() === 'ascii';

  // Build dial segments
  const segments = 10;
  const filledSegments = Math.round(normalized * segments);

  const segmentChars = isAscii ? '-' : '━';
  const pointerChar = isAscii ? '^' : '▲';

  // Dial arc (top half of circle, simplified)
  //     ━━━▲━━━
  //    ╱       ╲
  //   0        100
  const pointerPos = Math.round(normalized * (segments - 1));
  let dialLine = '';

  for (let i = 0; i < segments; i++) {
    if (i === pointerPos) {
      dialLine += pointerChar;
    } else {
      const segPct = (i / segments) * 100;
      const segColor = getZoneColor(segPct, zones, color);
      dialLine += segmentChars;
    }
  }

  const valueStr = formatValue
    ? formatValue(value)
    : `${Math.round(percentage)}%`;

  const parts: VNode[] = [];

  if (label) {
    parts.push(
      Box({ marginBottom: 1, justifyContent: 'center' }, Text({ color: labelColor }, label))
    );
  }

  // Build colored dial
  const dialParts: VNode[] = [];
  for (let i = 0; i < segments; i++) {
    const segPct = (i / segments) * 100;
    const segColor = getZoneColor(segPct, zones, color);
    const char = i === pointerPos ? pointerChar : segmentChars;
    dialParts.push(Text({ color: i === pointerPos ? barColor : segColor }, char));
  }

  parts.push(Box({ flexDirection: 'row' }, ...dialParts));

  if (showMinMax) {
    parts.push(
      Box(
        { flexDirection: 'row', justifyContent: 'space-between', width: segments },
        Text({ color: 'gray', dim: true }, String(min)),
        Text({ color: 'gray', dim: true }, String(max))
      )
    );
  }

  if (showValue) {
    parts.push(
      Box({ marginTop: 1, justifyContent: 'center' }, Text({ color: barColor }, valueStr))
    );
  }

  return Box({ flexDirection: 'column', alignItems: 'center' }, ...parts);
}

// =============================================================================
// Main Gauge Component (Dispatcher)
// =============================================================================

/**
 * Gauge - Main gauge component
 *
 * Dispatches to specific gauge implementations based on style.
 *
 * @example
 * // Linear gauge
 * Gauge({ value: 75, style: 'linear' })
 *
 * @example
 * // Meter gauge with zones
 * Gauge({
 *   value: 85,
 *   style: 'meter',
 *   zones: [
 *     { start: 0, end: 60, color: 'green' },
 *     { start: 60, end: 85, color: 'yellow' },
 *     { start: 85, end: 100, color: 'red' },
 *   ],
 * })
 *
 * @example
 * // Arc gauge
 * Gauge({ value: 50, style: 'arc', label: 'Progress' })
 */
export function Gauge(options: GaugeOptions): VNode {
  const { style = 'linear' } = options;

  switch (style) {
    case 'meter':
      return MeterGauge(options as MeterOptions);
    case 'arc':
      return ArcGauge(options);
    case 'dial':
      return DialGauge(options);
    case 'linear':
    default:
      return LinearGauge(options);
  }
}

// =============================================================================
// Battery Gauge (Special Case)
// =============================================================================

export interface BatteryGaugeOptions {
  /** Charge level (0-100) */
  level: number;
  /** Show percentage */
  showLevel?: boolean;
  /** Is charging */
  charging?: boolean;
  /** Width */
  width?: number;
}

/**
 * BatteryGauge - Battery-style indicator
 *
 * @example
 * BatteryGauge({ level: 75, charging: true })
 */
export function BatteryGauge(options: BatteryGaugeOptions): VNode {
  const { level, showLevel = true, charging = false, width = 10 } = options;

  const normalized = Math.max(0, Math.min(1, level / 100));
  const isAscii = getRenderMode() === 'ascii';
  const chars = getGaugeChars();

  // Determine color based on level
  let color: ColorValue = 'green';
  if (level <= 20) color = 'red';
  else if (level <= 50) color = 'yellow';

  const innerWidth = width - 2; // Account for battery borders
  const filledWidth = Math.round(normalized * innerWidth);
  const emptyWidth = innerWidth - filledWidth;

  const batteryBody = chars.filled.repeat(filledWidth) + ' '.repeat(emptyWidth);

  const parts: VNode[] = [];

  if (isAscii) {
    // ASCII: [####    ]+
    parts.push(Text({}, '['));
    parts.push(Text({ color }, batteryBody));
    parts.push(Text({}, ']+'));
  } else {
    // Unicode: ▐████░░░░▌╸
    parts.push(Text({}, '▐'));
    parts.push(
      Text({ color }, chars.filled.repeat(filledWidth)),
      Text({ color: 'gray', dim: true }, chars.empty.repeat(emptyWidth))
    );
    parts.push(Text({}, '▌'));
    parts.push(Text({ dim: true }, '╸')); // Battery tip
  }

  if (charging) {
    parts.push(Text({ color: 'yellow' }, ' ⚡'));
  }

  if (showLevel) {
    parts.push(Box({ marginLeft: 1 }, Text({ color }, `${Math.round(level)}%`)));
  }

  return Box({ flexDirection: 'row', alignItems: 'center' }, ...parts);
}

// =============================================================================
// Exports
// =============================================================================

export { DEFAULT_ZONES, getZoneColor };
