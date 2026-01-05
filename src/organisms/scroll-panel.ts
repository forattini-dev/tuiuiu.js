/**
 * ScrollPanel - Panel with a scrollable body
 */

import { Box, Text } from '../primitives/nodes.js';
import { ScrollArea, type ScrollAreaHeight } from './scroll-area.js';
import type { ColorValue, BoxStyle, VNode } from '../utils/types.js';

export interface ScrollPanelProps {
  /** Panel title */
  title?: string;
  /** Scrollable content */
  content: string[] | VNode[];
  /** Panel width */
  width?: BoxStyle['width'];
  /** Panel height (defaults to fill) */
  height?: ScrollAreaHeight;
  /** Minimum panel height */
  minHeight?: number;
  /** Maximum panel height */
  maxHeight?: number;
  /** Flex grow for layout */
  flexGrow?: number;
  /** Panel border style */
  borderStyle?: BoxStyle['borderStyle'];
  /** Panel border color */
  borderColor?: ColorValue;
  /** Title color */
  titleColor?: ColorValue;
  /** Show scrollbar */
  showScrollbar?: boolean;
  /** Scrollbar color */
  scrollbarColor?: ColorValue;
  /** Track color */
  trackColor?: ColorValue;
  /** Is active */
  isActive?: boolean;
}

export function ScrollPanel(props: ScrollPanelProps): VNode {
  const {
    title,
    content,
    width,
    height,
    minHeight,
    maxHeight,
    flexGrow,
    borderStyle = 'round',
    borderColor = 'muted',
    titleColor = 'mutedForeground',
    showScrollbar = true,
    scrollbarColor = borderColor,
    trackColor,
    isActive = true,
  } = props;

  const autoHeight = height === undefined || height === 'auto' || height === 'fill';

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      width,
      height: typeof height === 'number' ? height : undefined,
      minHeight,
      maxHeight,
      flexGrow: autoHeight ? (flexGrow ?? 1) : flexGrow,
      borderStyle,
      borderColor,
      paddingX: 1,
      paddingBottom: 1,
    },
    title
      ? Box(
          { marginBottom: 1 },
          Text({ color: titleColor, dim: true }, title)
        )
      : null,
    ScrollArea({
      height: 'fill',
      content,
      showScrollbar,
      scrollbarColor,
      trackColor,
      isActive,
    })
  );
}
