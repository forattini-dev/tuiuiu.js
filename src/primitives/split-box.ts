/**
 * SplitBox - bordered flex container with connected vertical divisions.
 *
 * Sections remain VNodes in the main layout tree. This preserves input,
 * focus, hit-testing, queries, layout refs, and reactive updates.
 */

import { getTheme } from '../core/theme.js';
import { Box } from './nodes.js';
import type { BoxStyle, ColorValue, VNode } from '../utils/types.js';

export interface SplitBoxSection {
  /** Fixed width in characters */
  width?: number;
  /** Flex grow factor used when width is omitted */
  flexGrow?: number;
  /** Content to render in this section */
  content: VNode;
  /** Horizontal alignment of content */
  align?: 'left' | 'center' | 'right';
  /** Vertical alignment of content */
  valign?: 'top' | 'middle' | 'bottom';
}

export interface SplitBoxProps {
  /** Sections to render. At least one section is required. */
  sections: SplitBoxSection[];
  /** Border style */
  borderStyle?: 'single' | 'round' | 'double' | 'bold';
  /** Border color */
  borderColor?: ColorValue;
  /** Total width. Defaults to the available parent width. */
  width?: number;
  /** Minimum content height, excluding the outer border */
  minHeight?: number;
  /** Padding inside each section */
  padding?: number;
  /** Horizontal padding inside each section */
  paddingX?: number;
  /** Vertical padding inside each section */
  paddingY?: number;
}

interface SplitDividerMetadata {
  top: string;
  bottom: string;
}

function normalizeNonNegativeInteger(
  value: number,
  name: string,
): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
  return value;
}

function normalizePositiveInteger(
  value: number,
  name: string,
): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
  return value;
}

function normalizeFlexGrow(value: number | undefined): number {
  if (value === undefined) return 1;
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError('section.flexGrow must be a positive finite number');
  }
  return value;
}

function getSectionAlignment(
  align: SplitBoxSection['align'],
): BoxStyle['alignItems'] {
  if (align === 'center') return 'center';
  if (align === 'right') return 'flex-end';
  return 'flex-start';
}

function getSectionVerticalAlignment(
  valign: SplitBoxSection['valign'],
): BoxStyle['justifyContent'] {
  if (valign === 'middle') return 'center';
  if (valign === 'bottom') return 'flex-end';
  return 'flex-start';
}

function getDividerCharacters(
  style: NonNullable<SplitBoxProps['borderStyle']>,
): { vertical: string; top: string; bottom: string } {
  if (style === 'double') {
    return { vertical: '\u2551', top: '\u2566', bottom: '\u2569' };
  }
  if (style === 'bold') {
    return { vertical: '\u2503', top: '\u2533', bottom: '\u253b' };
  }

  return {
    vertical: '\u2502',
    top: '\u252c',
    bottom: '\u2534',
  };
}

function createSplitDivider(
  style: NonNullable<SplitBoxProps['borderStyle']>,
  color: ColorValue,
): VNode {
  const divider = getDividerCharacters(style);
  const metadata: SplitDividerMetadata = {
    top: divider.top,
    bottom: divider.bottom,
  };

  return {
    type: 'text',
    props: {
      children: divider.vertical,
      color,
      width: 1,
      alignSelf: 'stretch',
      __divider: 'vertical',
      __splitDivider: metadata,
    },
    children: [],
  };
}

/**
 * Creates a split container without pre-rendering section content to strings.
 */
export function SplitBox(props: SplitBoxProps): VNode {
  const {
    sections,
    borderStyle = 'single',
    borderColor,
    width,
    minHeight = 1,
    padding = 0,
    paddingX = padding,
    paddingY = padding,
  } = props;

  if (sections.length === 0) {
    throw new RangeError('SplitBox requires at least one section');
  }

  const normalizedMinHeight = normalizeNonNegativeInteger(minHeight, 'minHeight');
  const normalizedPaddingX = normalizeNonNegativeInteger(paddingX, 'paddingX');
  const normalizedPaddingY = normalizeNonNegativeInteger(paddingY, 'paddingY');
  if (width !== undefined) {
    normalizePositiveInteger(width, 'width');
    const minimumWidth = sections.length * 2 + 1;
    if (width < minimumWidth) {
      throw new RangeError(
        `width must be at least ${minimumWidth} for ${sections.length} sections`,
      );
    }
  }

  const theme = getTheme();
  const color = borderColor ?? theme.borders.default;
  const children: VNode[] = [];

  sections.forEach((section, index) => {
    if (section.width !== undefined) {
      normalizePositiveInteger(section.width, `sections[${index}].width`);
    }

    const sectionStyle: BoxStyle = {
      flexDirection: 'column',
      flexGrow: section.width === undefined
        ? normalizeFlexGrow(section.flexGrow)
        : 0,
      flexShrink: 1,
      ...(section.width !== undefined ? { width: section.width } : undefined),
      minWidth: normalizedPaddingX * 2,
      paddingX: normalizedPaddingX,
      paddingY: normalizedPaddingY,
      alignItems: getSectionAlignment(section.align),
      justifyContent: getSectionVerticalAlignment(section.valign),
    };

    children.push(Box(sectionStyle, section.content));
    if (index < sections.length - 1) {
      children.push(createSplitDivider(borderStyle, color));
    }
  });

  return Box(
    {
      flexDirection: 'row',
      alignItems: 'stretch',
      width: width ?? 'fill',
      minHeight: normalizedMinHeight + 2,
      borderStyle,
      borderColor: color,
    },
    ...children,
  );
}

export default SplitBox;
