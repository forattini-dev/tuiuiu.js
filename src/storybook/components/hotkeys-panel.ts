/**
 * HotkeysPanel Component
 *
 * Displays available keyboard shortcuts in the footer area.
 * Provides discoverability for storybook navigation.
 */

import { Box, Text } from '../../primitives/nodes.js';
import { getTheme } from '../../core/theme.js';
import type { VNode } from '../../utils/types.js';

// =============================================================================
// Types
// =============================================================================

interface Hotkey {
  key: string;
  description: string;
}

// =============================================================================
// Data
// =============================================================================

const HOTKEYS: Hotkey[] = [
  { key: 'Esc', description: 'Back/Quit' },
  { key: 'Enter', description: 'Select' },
  { key: 'Tab', description: 'Focus' },
  { key: 'F1', description: 'Search' },
  { key: 'F2', description: 'Theme' },
  { key: 'F12', description: 'Console' },
  { key: '↑↓', description: 'Navigate' },
  { key: '←→', description: 'Category' },
];

// =============================================================================
// Component
// =============================================================================

/**
 * HotkeysPanel - displays available keyboard shortcuts
 */
export function HotkeysPanel(): VNode {
  const theme = getTheme();

  return Box(
    {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
      height: 1,
      paddingX: 1,
      backgroundColor: theme.background.subtle,
    },
    ...HOTKEYS.flatMap((hotkey, idx) => [
      // Key badge
      Box(
        { flexDirection: 'row' },
        Text({ color: theme.palette.primary[400], bold: true }, `[${hotkey.key}]`),
        Text({ color: theme.foreground.muted }, ` ${hotkey.description}`),
      ),
      // Separator (except last)
      idx < HOTKEYS.length - 1
        ? Text({ color: theme.borders.default }, '  │  ')
        : null,
    ]).filter(Boolean) as VNode[],
  );
}
