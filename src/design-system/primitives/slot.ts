/**
 * Slot - Reserved layout space for content that may appear/disappear
 */

import type { VNode, ReckChild } from '../../utils/types.js';
import { Box } from './box.js';

/**
 * Slot - Reserved layout space for content that may appear/disappear
 *
 * The Slot pattern prevents layout shifts by always reserving space,
 * even when content is hidden. This is crucial for stable UX.
 *
 * @example
 * // Job output area - always reserves 5 lines even when no output
 * Slot({ visible: hasOutput, height: 5 },
 *   Text({}, output)
 * )
 *
 * // Conditionally show input, but never shift layout
 * Slot({ visible: showInput, minHeight: 1 },
 *   TextInput({ value: input, onChange: setInput })
 * )
 */
export interface SlotProps {
  /** Whether content is visible */
  visible: boolean;
  /** Fixed height when hidden (in lines) */
  height?: number;
  /** Minimum height (used when visible too) */
  minHeight?: number;
  /** Flex grow factor */
  flexGrow?: number;
  /** Fixed width */
  width?: number;
}

export function Slot(props: SlotProps, ...children: ReckChild[]): VNode {
  const { visible, height = 0, minHeight, flexGrow, width } = props;

  if (visible) {
    // When visible, render children with optional minHeight
    return Box(
      { flexDirection: 'column', minHeight: minHeight ?? height, flexGrow, width },
      ...children
    );
  }

  // When hidden, still reserve the space
  if (height === 0 && !minHeight) {
    return Box({ height: 0 });
  }

  return Box({ height: minHeight ?? height, flexGrow, width });
}
