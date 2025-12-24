/**
 * SplitBox - Box with internal divisions and connected borders
 *
 * Creates bordered containers with vertical divisions where the divider
 * characters properly connect to the outer border using junction characters.
 *
 * @example
 * ```typescript
 * // Simple two-column split
 * SplitBox({
 *   borderStyle: 'round',
 *   sections: [
 *     { width: 15, content: Picture({ art: logo }) },
 *     { flexGrow: 1, content: Text({}, 'Content here') },
 *   ]
 * })
 *
 * // Result:
 * // ╭─────────────┬────────────────────╮
 * // │ ASCII LOGO  │ Content here       │
 * // │ LINE 2      │                    │
 * // │ LINE 3      │                    │
 * // ╰─────────────┴────────────────────╯
 * ```
 */

import { getChars } from '../core/capabilities.js';
import { getTheme } from '../core/theme.js';
import { renderToString } from '../core/renderer.js';
import { Box, Text } from './nodes.js';
import type { VNode } from '../utils/types.js';
import { stringWidth, sliceAnsi } from '../utils/text-utils.js';

// =============================================================================
// Types
// =============================================================================

export interface SplitBoxSection {
  /** Fixed width in characters */
  width?: number;
  /** Flex grow factor (like CSS flex-grow) */
  flexGrow?: number;
  /** Content to render in this section */
  content: VNode;
  /** Horizontal alignment of content */
  align?: 'left' | 'center' | 'right';
  /** Vertical alignment of content */
  valign?: 'top' | 'middle' | 'bottom';
}

export interface SplitBoxProps {
  /** Sections to render */
  sections: SplitBoxSection[];
  /** Border style */
  borderStyle?: 'single' | 'round' | 'double' | 'bold';
  /** Border color */
  borderColor?: string;
  /** Total width (defaults to terminal width) */
  width?: number;
  /** Minimum height (content may expand beyond this) */
  minHeight?: number;
  /** Padding inside each section */
  padding?: number;
  /** Horizontal padding inside each section */
  paddingX?: number;
  /** Vertical padding inside each section */
  paddingY?: number;
}

// =============================================================================
// Border Character Sets
// =============================================================================

interface BorderChars {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
  teeDown: string;  // ┬
  teeUp: string;    // ┴
  teeRight: string; // ├
  teeLeft: string;  // ┤
  cross: string;    // ┼
}

function getBorderChars(style: SplitBoxProps['borderStyle']): BorderChars {
  const chars = getChars();

  // Base characters from capabilities
  const base: BorderChars = {
    topLeft: chars.border.topLeft,
    topRight: chars.border.topRight,
    bottomLeft: chars.border.bottomLeft,
    bottomRight: chars.border.bottomRight,
    horizontal: chars.border.horizontal,
    vertical: chars.border.vertical,
    teeDown: chars.border.teeDown,
    teeUp: chars.border.teeUp,
    teeRight: chars.border.teeRight,
    teeLeft: chars.border.teeLeft,
    cross: chars.border.cross,
  };

  // Override for specific styles
  switch (style) {
    case 'round':
      return {
        ...base,
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯',
      };
    case 'double':
      return {
        topLeft: '╔',
        topRight: '╗',
        bottomLeft: '╚',
        bottomRight: '╝',
        horizontal: '═',
        vertical: '║',
        teeDown: '╦',
        teeUp: '╩',
        teeRight: '╠',
        teeLeft: '╣',
        cross: '╬',
      };
    case 'bold':
      return {
        topLeft: '┏',
        topRight: '┓',
        bottomLeft: '┗',
        bottomRight: '┛',
        horizontal: '━',
        vertical: '┃',
        teeDown: '┳',
        teeUp: '┻',
        teeRight: '┣',
        teeLeft: '┫',
        cross: '╋',
      };
    default:
      return base;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Render a VNode to an array of plain text lines
 */
function renderContentToLines(content: VNode, width: number, height: number): string[] {
  try {
    const rendered = renderToString(content, width, height);
    // Split by newlines and handle empty content
    const lines = rendered.split('\n');
    return lines.length > 0 ? lines : [''];
  } catch {
    // Fallback: simple text extraction
    return [''];
  }
}

/**
 * Pad or truncate a line to exact width (ANSI-aware)
 */
function fitLine(line: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string {
  const currentWidth = stringWidth(line);

  if (currentWidth > width) {
    // Truncate using ANSI-aware slicing
    return sliceAnsi(line, 0, width);
  }

  if (currentWidth === width) {
    return line;
  }

  const padding = width - currentWidth;

  switch (align) {
    case 'center': {
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return ' '.repeat(leftPad) + line + ' '.repeat(rightPad);
    }
    case 'right':
      return ' '.repeat(padding) + line;
    default:
      return line + ' '.repeat(padding);
  }
}

/**
 * Vertically align lines within a height
 */
function valignLines(
  lines: string[],
  height: number,
  width: number,
  valign: 'top' | 'middle' | 'bottom' = 'top'
): string[] {
  if (lines.length >= height) {
    return lines.slice(0, height);
  }

  const emptyLine = ' '.repeat(width);
  const padding = height - lines.length;

  switch (valign) {
    case 'middle': {
      const topPad = Math.floor(padding / 2);
      const bottomPad = padding - topPad;
      return [
        ...Array(topPad).fill(emptyLine),
        ...lines,
        ...Array(bottomPad).fill(emptyLine),
      ];
    }
    case 'bottom':
      return [...Array(padding).fill(emptyLine), ...lines];
    default:
      return [...lines, ...Array(padding).fill(emptyLine)];
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * SplitBox - Box with internal divisions and connected borders
 */
export function SplitBox(props: SplitBoxProps): VNode {
  const {
    sections,
    borderStyle = 'single',
    borderColor,
    width: totalWidth,
    minHeight = 1,
    padding = 0,
    paddingX = padding,
    paddingY = padding,
  } = props;

  const theme = getTheme();
  const chars = getBorderChars(borderStyle);
  const color = borderColor ?? theme.borders.default;

  // Calculate total available width
  const termWidth = totalWidth ?? (process.stdout.columns || 80);

  // Account for outer borders (2) and dividers between sections (sections.length - 1)
  const dividerCount = sections.length - 1;
  const availableWidth = termWidth - 2 - dividerCount;

  // Calculate section widths
  const sectionWidths: number[] = [];
  let fixedWidth = 0;
  let totalFlexGrow = 0;

  for (const section of sections) {
    if (section.width !== undefined) {
      sectionWidths.push(section.width);
      fixedWidth += section.width;
    } else {
      sectionWidths.push(-1); // Placeholder for flex
      totalFlexGrow += section.flexGrow ?? 1;
    }
  }

  // Distribute remaining width to flex sections
  const remainingWidth = availableWidth - fixedWidth;
  for (let i = 0; i < sectionWidths.length; i++) {
    if (sectionWidths[i] === -1) {
      const flexGrow = sections[i].flexGrow ?? 1;
      sectionWidths[i] = Math.floor((remainingWidth * flexGrow) / totalFlexGrow);
    }
  }

  // Adjust for rounding errors
  const totalCalculatedWidth = sectionWidths.reduce((a, b) => a + b, 0);
  if (totalCalculatedWidth < availableWidth && sectionWidths.length > 0) {
    sectionWidths[sectionWidths.length - 1] += availableWidth - totalCalculatedWidth;
  }

  // Inner widths (accounting for padding)
  const innerWidths = sectionWidths.map(w => Math.max(0, w - paddingX * 2));

  // Render each section's content and find max height
  const renderedSections: string[][] = [];
  let maxHeight = minHeight;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const innerWidth = innerWidths[i];

    // Render content to lines
    let lines = renderContentToLines(section.content, innerWidth, 100);

    // Apply horizontal alignment and padding
    lines = lines.map(line => {
      const fitted = fitLine(line, innerWidth, section.align);
      return ' '.repeat(paddingX) + fitted + ' '.repeat(paddingX);
    });

    // Add vertical padding
    const emptyLine = ' '.repeat(sectionWidths[i]);
    for (let p = 0; p < paddingY; p++) {
      lines.unshift(emptyLine);
      lines.push(emptyLine);
    }

    renderedSections.push(lines);
    maxHeight = Math.max(maxHeight, lines.length);
  }

  // Normalize all sections to same height with valign
  for (let i = 0; i < renderedSections.length; i++) {
    renderedSections[i] = valignLines(
      renderedSections[i],
      maxHeight,
      sectionWidths[i],
      sections[i].valign
    );
  }

  // Build the output lines
  const outputLines: string[] = [];

  // Top border
  let topBorder = chars.topLeft;
  for (let i = 0; i < sectionWidths.length; i++) {
    topBorder += chars.horizontal.repeat(sectionWidths[i]);
    if (i < sectionWidths.length - 1) {
      topBorder += chars.teeDown;
    }
  }
  topBorder += chars.topRight;
  outputLines.push(topBorder);

  // Content rows
  for (let row = 0; row < maxHeight; row++) {
    let line = chars.vertical;
    for (let i = 0; i < renderedSections.length; i++) {
      line += renderedSections[i][row] || ' '.repeat(sectionWidths[i]);
      if (i < renderedSections.length - 1) {
        line += chars.vertical;
      }
    }
    line += chars.vertical;
    outputLines.push(line);
  }

  // Bottom border
  let bottomBorder = chars.bottomLeft;
  for (let i = 0; i < sectionWidths.length; i++) {
    bottomBorder += chars.horizontal.repeat(sectionWidths[i]);
    if (i < sectionWidths.length - 1) {
      bottomBorder += chars.teeUp;
    }
  }
  bottomBorder += chars.bottomRight;
  outputLines.push(bottomBorder);

  // Return as a pre-rendered text block
  return Box(
    { flexDirection: 'column' },
    Text({ color }, outputLines.join('\n'))
  );
}

export default SplitBox;
