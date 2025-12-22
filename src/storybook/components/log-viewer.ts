/**
 * LogViewer Component
 *
 * Displays logs captured from console.log/warn/error.
 * Open by default, toggled with F12.
 * Takes the bottom 6 lines of the screen.
 */

import { Box, Text, Spacer } from '../../primitives/nodes.js';
import { storybookStore, type LogEntry } from '../store.js';
import { themeColor } from '../../core/theme.js';

/** Height of log viewer in lines (including border) */
const LOG_VIEWER_HEIGHT = 6;

/** Number of visible log entries (height minus header and borders) */
const VISIBLE_LOG_COUNT = LOG_VIEWER_HEIGHT - 2;

export function LogViewer() {
  const state = storybookStore.state();

  if (!state.isLogOpen) {
    return null; // Don't render anything if closed
  }

  // Styles based on log level
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return themeColor('error');
      case 'warn': return themeColor('warning');
      case 'debug': return themeColor('mutedForeground');
      default: return themeColor('foreground');
    }
  };

  // Show the latest logs that fit in the visible area
  const visibleLogs = state.logs.slice(-VISIBLE_LOG_COUNT);

  return Box(
    {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: LOG_VIEWER_HEIGHT,
      borderStyle: 'single',
      borderColor: themeColor('border'),
      backgroundColor: themeColor('background'),
      flexDirection: 'column'
    },
    // Header
    Box(
      { flexDirection: 'row', borderBottom: true, borderStyle: 'single', borderColor: themeColor('border'), paddingX: 1 },
      Text({ bold: true, color: themeColor('primary') }, 'Console'),
      Spacer(),
      Text({ color: themeColor('mutedForeground'), dim: true }, `${state.logs.length} logs`),
      Text({ color: themeColor('mutedForeground'), dim: true }, ' | F12 close | C clear')
    ),
    // Logs Content
    Box(
      { flexDirection: 'column', paddingX: 1 },
      ...visibleLogs.map((log) =>
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: themeColor('mutedForeground'), dim: true }, new Date(log.timestamp).toLocaleTimeString().split(' ')[0]),
          Text({ color: getLevelColor(log.level), bold: log.level === 'error' }, `[${log.level.toUpperCase().padEnd(5)}]`),
          Text({ color: themeColor('foreground') }, log.message.join(' '))
        )
      )
    )
  );
}
