/**
 * ShimmerText - Animated text with a sweeping highlight effect
 *
 * @layer Atom
 * @description A character-by-character shimmer wave for loading/thinking states
 *
 * Features:
 * - Bidirectional sweep (left→right→left)
 * - Configurable wave width and speed
 * - Stall detection with color shift
 * - Uses the runtime tick system (synchronized, focus-aware)
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { getTick } from '../core/tick.js';
import { getTheme } from '../core/theme.js';
import { getPrefersReducedMotion } from '../core/motion-runtime.js';
import { segmentGraphemes } from '../utils/grapheme.js';

export interface ShimmerTextProps {
  /** The text to animate */
  text: string;
  /** Base text color (default: theme foreground muted) */
  color?: ColorValue;
  /** Highlight color for the shimmer wave (default: theme accent info) */
  shimmerColor?: ColorValue;
  /** Ticks per character advance (default: 1) — lower = faster */
  speed?: number;
  /** Width of the shimmer highlight in characters (default: 3) */
  width?: number;
  /** Whether the shimmer is active (default: true) */
  active?: boolean;
  /** Time in ms before color shifts to warning (default: 10000) */
  stallThreshold?: number;
  /** Color to shift towards when stalled (default: theme warning) */
  stallColor?: ColorValue;
  /** Start time for stall calculation (default: component creation time) */
  startTime?: number;
}

// Module-level start time for standalone usage
let _shimmerStartTime = 0;

/**
 * Animated text with a sweeping shimmer highlight.
 *
 * A glowing wave moves across the text character by character,
 * creating a premium "thinking/loading" visual effect.
 *
 * @example
 * ShimmerText({ text: 'Thinking...' })
 *
 * @example
 * ShimmerText({
 *   text: 'Processing request',
 *   shimmerColor: 'cyan',
 *   speed: 2,
 *   stallThreshold: 5000,
 * })
 */
export function ShimmerText(props: ShimmerTextProps): VNode {
  const {
    text,
    active = true,
    speed = 1,
    width = 3,
    stallThreshold = 10000,
    startTime,
  } = props;

  const theme = getTheme();
  const baseColor = props.color ?? theme.foreground?.muted ?? 'gray';
  const shimmerColor = props.shimmerColor ?? theme.accents?.info ?? 'cyan';
  const stallColor = props.stallColor ?? theme.accents?.warning ?? 'yellow';

  // Reduced motion: render static text
  if (!active || getPrefersReducedMotion()) {
    return Text({ color: baseColor }, text);
  }

  // Track start time for stall detection
  if (_shimmerStartTime === 0) {
    _shimmerStartTime = Date.now();
  }
  const effectiveStartTime = startTime ?? _shimmerStartTime;

  const tick = getTick();
  const graphemes = segmentGraphemes(text);
  const textLen = graphemes.length;
  if (textLen === 0) return Text({}, '');

  // Bidirectional sweep: 0 → textLen → 0
  const cycleLength = textLen * 2;
  const rawPosition = Math.floor(tick / Math.max(1, speed)) % cycleLength;
  const focalPoint = rawPosition < textLen
    ? rawPosition
    : cycleLength - rawPosition;

  // Stall detection: shift shimmer color towards warning
  const elapsed = Date.now() - effectiveStartTime;
  const effectiveShimmerColor = elapsed >= stallThreshold ? stallColor : shimmerColor;

  // Render each character with distance-based coloring
  const chars: VNode[] = [];
  for (let i = 0; i < textLen; i++) {
    const distance = Math.abs(i - focalPoint);
    const isHighlighted = distance < width;
    const charColor = isHighlighted ? effectiveShimmerColor : baseColor;
    chars.push(Text({ color: charColor }, graphemes[i]!.segment));
  }

  return Box({ flexDirection: 'row' }, ...chars);
}

/** Reset shimmer start time (for when the shimmer is toggled off/on) */
export function resetShimmerStartTime(): void {
  _shimmerStartTime = 0;
}
