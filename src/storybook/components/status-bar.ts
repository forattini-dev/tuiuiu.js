/**
 * StatusBar Component
 *
 * Displays runtime metrics: theme, clicks, keystrokes, FPS.
 * Positioned below the Navbar.
 */

import { Box, Text } from '../../primitives/nodes.js';
import { getTheme } from '../../core/theme.js';
import type { VNode } from '../../utils/types.js';

// =============================================================================
// Types
// =============================================================================

export interface StatusBarProps {
  themeName: string;
  clicks: number;
  keystrokes: number;
  fps: number;
  elapsedSeconds: number;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format elapsed time as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Get FPS color based on performance
 */
function getFpsColor(fps: number, theme: ReturnType<typeof getTheme>): string {
  if (fps >= 30) return theme.accents.positive;
  if (fps >= 15) return theme.accents.warning;
  return theme.accents.critical;
}

// =============================================================================
// Component
// =============================================================================

/**
 * StatusBar with runtime metrics
 *
 * Layout: [Theme: dark]                    [⏱ 00:42 │ Clicks: 128 │ Keys: 456 │ 60 fps]
 * Theme on left, metrics on right, full width
 */
export function MetricsStatusBar({
  themeName,
  clicks,
  keystrokes,
  fps,
  elapsedSeconds,
}: StatusBarProps): VNode {
  const theme = getTheme();
  const fpsColor = getFpsColor(fps, theme);
  const separator = ' │ ';
  const sepColor = theme.borders.default;

  return Box(
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingX: 1,
      backgroundColor: theme.background.subtle,
    },
    // LEFT: Theme
    Box(
      { flexDirection: 'row' },
      Text({ color: theme.foreground.muted }, 'Theme: '),
      Text({ color: theme.palette.secondary[400], bold: true }, themeName),
    ),

    // RIGHT: Elapsed time, Clicks, Keystrokes, FPS
    Box(
      { flexDirection: 'row' },
      // Elapsed time
      Text({ color: theme.foreground.muted }, '⏱ '),
      Text({ color: theme.foreground.primary }, formatTime(elapsedSeconds)),
      Text({ color: sepColor }, separator),

      // Clicks
      Text({ color: theme.foreground.muted }, 'Clicks: '),
      Text({ color: theme.accents.warning }, String(clicks)),
      Text({ color: sepColor }, separator),

      // Keystrokes
      Text({ color: theme.foreground.muted }, 'Keys: '),
      Text({ color: theme.accents.positive }, String(keystrokes)),
      Text({ color: sepColor }, separator),

      // FPS
      Text({ color: fpsColor, bold: true }, `${fps} fps`),
    ),
  );
}
