/**
 * TuiuiuHeader - Shared responsive header component
 *
 * Features:
 * - App title with emoji
 * - Theme-responsive colors
 * - FPS counter on the right
 * - Optional subtitle and status text
 */

import {
  Box,
  Text,
  createSignal,
  useTheme,
  resolveColor,
} from '../../src/index.js';
import type { VNode } from '../../src/utils/types.js';

// =============================================================================
// FPS & Frame Tracking
// =============================================================================

const [fps, setFps] = createSignal(0);
const [globalFrame, setGlobalFrame] = createSignal(0);
let frameCount = 0;
let lastFpsUpdate = Date.now();
let fpsInterval: NodeJS.Timeout | null = null;

/**
 * Call this in your render loop or effect to update FPS
 */
export function trackFrame(): void {
  frameCount++;
  setGlobalFrame(f => f + 1);
  const now = Date.now();
  const elapsed = now - lastFpsUpdate;

  // Update FPS every 500ms for smoother display
  if (elapsed >= 500) {
    const currentFps = Math.round((frameCount / elapsed) * 1000);
    setFps(currentFps);
    frameCount = 0;
    lastFpsUpdate = now;
  }
}

/**
 * Get current global frame count
 */
export function getFrameCount(): number {
  return globalFrame();
}

/**
 * Start automatic FPS tracking with an interval
 * Call stopFpsTracking() when done
 */
export function startFpsTracking(intervalMs: number = 100): void {
  if (fpsInterval) return;

  lastFpsUpdate = Date.now();
  frameCount = 0;

  fpsInterval = setInterval(() => {
    trackFrame();
  }, intervalMs);
}

/**
 * Stop automatic FPS tracking
 */
export function stopFpsTracking(): void {
  if (fpsInterval) {
    clearInterval(fpsInterval);
    fpsInterval = null;
  }
}

/**
 * Get current FPS value
 */
export function getFps(): number {
  return fps();
}

/**
 * Reset FPS counter and global frame count
 */
export function resetFps(): void {
  frameCount = 0;
  lastFpsUpdate = Date.now();
  setFps(0);
  setGlobalFrame(0);
}

// =============================================================================
// Header Component
// =============================================================================

export interface TuiuiuHeaderProps {
  /** App title (e.g., "htop", "ping", "dashboard") */
  title: string;
  /** Emoji to show before title */
  emoji?: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional status text (e.g., "connecting...", "3 hops") */
  status?: string;
  /** Show FPS counter (default: true) */
  showFps?: boolean;
  /** Show theme name (default: true) */
  showTheme?: boolean;
  /** Custom width (default: terminal width) */
  width?: number;
}

/**
 * TuiuiuHeader - A responsive header component
 *
 * Uses theme colors automatically:
 * - Background: primary color
 * - Title: primaryForeground
 * - Subtitle: accent
 * - Theme label: warning
 * - FPS: success/warning/error based on value
 */
export function TuiuiuHeader(props: TuiuiuHeaderProps): VNode {
  const {
    title,
    emoji = '🐦',
    subtitle,
    status,
    showFps = true,
    showTheme = true,
    width = process.stdout.columns || 80,
  } = props;

  const theme = useTheme();

  // Build fixed strings (always shown)
  const titleStr = ` ${emoji} tuiuiu.js ${title} `;
  const themeLabel = showTheme ? ` [${theme.name}] ` : '';

  // FPS and frame display (prioritized - always shown if enabled)
  const currentFps = fps();
  const currentFrame = globalFrame();
  const metricsStr = showFps ? ` F${currentFrame} | ${currentFps}fps ` : '';
  const fpsColor = currentFps >= 30
    ? resolveColor('success')
    : currentFps >= 15
      ? resolveColor('warning')
      : resolveColor('error');

  // Calculate fixed width (title + theme + metrics)
  const fixedWidth = titleStr.length + themeLabel.length + metricsStr.length;

  // Calculate available space for dynamic content (subtitle + status)
  const availableForDynamic = Math.max(0, width - fixedWidth - 1); // -1 for minimum padding

  // Build dynamic strings, truncating if needed
  let subtitleStr = subtitle ? ` ${subtitle} ` : '';
  let statusStr = status ? ` ${status} ` : '';

  // If combined dynamic content exceeds available space, truncate
  if (subtitleStr.length + statusStr.length > availableForDynamic) {
    // First, try keeping subtitle and truncating status
    const subtitleSpace = Math.min(subtitleStr.length, availableForDynamic);
    const statusSpace = availableForDynamic - subtitleSpace;

    if (subtitleSpace < subtitleStr.length) {
      // Truncate subtitle
      subtitleStr = subtitleStr.slice(0, Math.max(0, subtitleSpace - 1)) + (subtitleSpace > 2 ? '…' : '');
    }
    if (statusSpace < statusStr.length && statusSpace > 0) {
      // Truncate status
      statusStr = statusStr.slice(0, Math.max(0, statusSpace - 1)) + (statusSpace > 2 ? '…' : '');
    } else if (statusSpace <= 0) {
      // No room for status at all
      statusStr = '';
    }
  }

  // Calculate final padding
  const usedWidth = titleStr.length + subtitleStr.length + themeLabel.length + statusStr.length + metricsStr.length;
  const padding = Math.max(0, width - usedWidth);

  // Theme colors
  const headerBg = resolveColor('primary');
  const headerFg = resolveColor('primaryForeground');

  return Box(
    { flexDirection: 'row', backgroundColor: headerBg, width },
    // Title
    Text({ color: headerFg, backgroundColor: headerBg, bold: true }, titleStr),
    // Subtitle
    subtitleStr ? Text({ color: resolveColor('accent'), backgroundColor: headerBg }, subtitleStr) : null,
    // Theme label
    showTheme ? Text({ color: resolveColor('warning'), backgroundColor: headerBg, bold: true }, themeLabel) : null,
    // Status
    statusStr ? Text({ color: resolveColor('secondary'), backgroundColor: headerBg }, statusStr) : null,
    // Spacer
    Text({ color: headerFg, backgroundColor: headerBg }, ' '.repeat(padding)),
    // Frame count and FPS
    showFps ? Text({ color: fpsColor, backgroundColor: headerBg, bold: true }, metricsStr) : null
  );
}

// =============================================================================
// Compact Header Variant
// =============================================================================

export interface CompactHeaderProps {
  /** Left side content */
  left: string;
  /** Center content (optional) */
  center?: string;
  /** Right side content (optional, defaults to FPS) */
  right?: string;
  /** Show FPS if no right content provided (default: true) */
  showFps?: boolean;
  /** Custom width */
  width?: number;
}

/**
 * CompactHeader - A simpler header with left/center/right sections
 */
export function CompactHeader(props: CompactHeaderProps): VNode {
  const {
    left,
    center,
    showFps = true,
    width = process.stdout.columns || 80,
  } = props;

  const currentFps = fps();
  const right = props.right ?? (showFps ? `${currentFps} fps` : '');

  const fpsColor = currentFps >= 30
    ? resolveColor('success')
    : currentFps >= 15
      ? resolveColor('warning')
      : resolveColor('error');

  // Calculate spacing
  const centerPadding = center
    ? Math.max(0, Math.floor((width - left.length - center.length - right.length) / 2))
    : 0;
  const rightPadding = Math.max(0, width - left.length - (center?.length || 0) - right.length - centerPadding * 2);

  const headerBg = resolveColor('primary');
  const headerFg = resolveColor('primaryForeground');

  return Box(
    { flexDirection: 'row', backgroundColor: headerBg, width },
    Text({ color: headerFg, backgroundColor: headerBg, bold: true }, left),
    center ? Text({ color: headerFg, backgroundColor: headerBg }, ' '.repeat(centerPadding)) : null,
    center ? Text({ color: resolveColor('accent'), backgroundColor: headerBg }, center) : null,
    Text({ color: headerFg, backgroundColor: headerBg }, ' '.repeat(center ? centerPadding + rightPadding : rightPadding)),
    Text({ color: props.right ? headerFg : fpsColor, backgroundColor: headerBg, bold: !props.right }, right)
  );
}
