/**
 * Console Accordion Component
 *
 * Displays logs captured from console.log/warn/error.
 * Accordion pattern: collapsed shows summary, F12 expands upward.
 * Positioned in footer area (not overlay).
 */

import { Box, Text, Spacer } from '../../primitives/nodes.js';
import { storybookStore, type LogEntry } from '../store.js';
import { getTheme } from '../../core/theme.js';
import type { VNode } from '../../utils/types.js';

// =============================================================================
// Constants
// =============================================================================

/** Maximum visible log entries when expanded */
const MAX_VISIBLE_LOGS = 8;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get color for log level
 */
function getLevelColor(level: string, theme: ReturnType<typeof getTheme>): string {
  switch (level) {
    case 'error': return theme.accents.critical;
    case 'warn': return theme.accents.warning;
    case 'debug': return theme.foreground.muted;
    case 'info': return theme.accents.info;
    default: return theme.foreground.primary;
  }
}

/**
 * Get icon for log level
 */
function getLevelIcon(level: string): string {
  switch (level) {
    case 'error': return '✖';
    case 'warn': return '⚠';
    case 'debug': return '○';
    case 'info': return 'ℹ';
    default: return '●';
  }
}

/**
 * Format timestamp as HH:MM:SS
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false }).split(' ')[0] || '';
}

// =============================================================================
// Component
// =============================================================================

/**
 * Console accordion - collapsed or expanded based on store state
 */
export function ConsoleAccordion(): VNode {
  const theme = getTheme();
  const state = storybookStore.state();
  const { logs, isLogOpen } = state;
  const logCount = logs.length;

  // Count by level for summary
  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  // Collapsed state: single line summary
  if (!isLogOpen) {
    return Box(
      {
        flexDirection: 'row',
        paddingX: 1,
        borderStyle: 'single',
        borderColor: theme.borders.default,
        backgroundColor: theme.background.subtle,
      },
      // Expand indicator
      Text({ color: theme.foreground.muted }, '▶ '),
      Text({ color: theme.palette.primary[500], bold: true }, 'Console'),
      Text({ color: theme.foreground.muted }, ` (${logCount} entries)`),

      // Error/warn counts if any
      errorCount > 0 ? Box(
        { flexDirection: 'row', marginLeft: 1 },
        Text({ color: theme.accents.critical }, ` ${errorCount} errors`),
      ) : null,
      warnCount > 0 ? Box(
        { flexDirection: 'row', marginLeft: 1 },
        Text({ color: theme.accents.warning }, ` ${warnCount} warnings`),
      ) : null,

      Spacer(),
      Text({ color: theme.foreground.muted, dim: true }, '[F12 expand]'),
    );
  }

  // Expanded state: show log entries
  const visibleLogs = logs.slice(-MAX_VISIBLE_LOGS);

  const children: VNode[] = [
    // Header
    Box(
      {
        flexDirection: 'row',
        borderStyle: 'single',
        borderColor: theme.borders.default,
        paddingX: 1,
        backgroundColor: theme.background.surface,
      },
      Text({ color: theme.foreground.muted }, '▼ '),
      Text({ color: theme.palette.primary[500], bold: true }, 'Console'),
      Text({ color: theme.foreground.muted }, ` (${logCount})`),
      Spacer(),
      Text({ color: theme.foreground.muted, dim: true }, '[F12 collapse] [C clear]'),
    ),
  ];

  // Log entries
  if (visibleLogs.length === 0) {
    children.push(
      Box(
        { paddingX: 2, paddingY: 1 },
        Text({ color: theme.foreground.muted, dim: true }, 'No log entries'),
      ),
    );
  } else {
    children.push(
      Box(
        { flexDirection: 'column', paddingX: 1 },
        ...visibleLogs.map((log) =>
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: theme.foreground.muted, dim: true }, formatTime(log.timestamp)),
            Text({ color: getLevelColor(log.level, theme) }, getLevelIcon(log.level)),
            Text({
              color: getLevelColor(log.level, theme),
              bold: log.level === 'error',
            }, log.message.join(' ').slice(0, 80)),
          ),
        ),
      ),
    );
  }

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'single',
      borderColor: theme.borders.default,
      backgroundColor: theme.background.base,
    },
    ...children,
  );
}

// Keep old export for backwards compatibility
export const LogViewer = ConsoleAccordion;
