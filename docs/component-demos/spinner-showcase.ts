/**
 * Spinner Showcase - For documentation GIF
 * Shows multiple spinner styles in a clean layout
 */

import { render, Box, Text, Spinner, type VNode } from '../../src/index.js';

function SpinnerShowcase(): VNode {
  const styles = ['dots', 'line', 'arc', 'circle', 'bounce', 'arrow', 'clock', 'earth'] as const;

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '🔄 Spinner Styles'),
    Box({ height: 1 }),
    Box(
      { flexDirection: 'row', gap: 3 },
      ...styles.map(style =>
        Box(
          { flexDirection: 'column', alignItems: 'center', minWidth: 8 },
          Spinner({ style, color: 'cyan', text: '' }),
          Text({ color: 'gray', dim: true }, style)
        )
      )
    )
  );
}

render(() => SpinnerShowcase());
