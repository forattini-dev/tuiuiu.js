/**
 * Enhanced Navbar Component
 *
 * Professional branded header with Tuiuiu.js identity.
 * Metrics are now in the separate StatusBar component.
 */

import { Box, Text } from '../../primitives/nodes.js';
import { getTheme } from '../../core/theme.js';
import { getVersionSync } from '../../version.js';
import type { VNode } from '../../utils/types.js';

// =============================================================================
// Types
// =============================================================================

export interface NavbarProps {
  componentCount: number;
}

// =============================================================================
// Constants
// =============================================================================

const TUIUIU_LOGO = '🐦';

// =============================================================================
// Component
// =============================================================================

/**
 * Enhanced Navbar with branding
 *
 * Layout: [Logo] Tuiuiu.js Storybook     v1.0.0  |  85 components
 */
export function Navbar({ componentCount }: NavbarProps): VNode {
  const version = getVersionSync();
  const theme = getTheme();
  const termWidth = process.stdout.columns || 80;

  // Build title section
  const logoSection = `${TUIUIU_LOGO} `;
  const titleText = 'Tuiuiu.js';
  const subtitleText = ' Storybook';

  // Build info section
  const versionText = `v${version}`;
  const componentText = `${componentCount} components`;
  const separator = '  │  ';

  // Calculate spacing
  const leftContent = logoSection + titleText + subtitleText;
  const rightContent = versionText + separator + componentText;
  const padding = Math.max(1, termWidth - leftContent.length - rightContent.length - 4);

  return Box(
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderStyle: 'round',
      borderColor: theme.palette.primary[500],
      paddingX: 1,
    },
    // Left: Logo + Title
    Box(
      { flexDirection: 'row' },
      Text({}, logoSection),
      Text({ color: theme.palette.primary[500], bold: true }, titleText),
      Text({ color: theme.foreground.muted }, subtitleText),
    ),
    // Spacer
    Text({}, ' '.repeat(padding)),
    // Right: Version + Component count
    Box(
      { flexDirection: 'row' },
      Text({ color: theme.foreground.muted, dim: true }, versionText),
      Text({ color: theme.borders.default }, separator),
      Text({ color: theme.accents.highlight, bold: true }, componentText),
    ),
  );
}
