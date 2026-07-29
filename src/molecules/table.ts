/**
 * Table - Rich data table component
 *
 * @layer Molecule
 * @description Data display with rows, columns, and formatting
 *
 * Features:
 * - Multiple border styles (single, double, rounded, bold, ascii, none)
 * - Column alignment (left, center, right)
 * - Auto-width calculation
 * - Fixed column widths
 * - Header row styling
 * - Row striping (zebra)
 * - Cell padding
 * - Truncation with ellipsis
 * - Word wrapping
 * - Sortable columns
 * - Cell colors and styles
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import {
  fitTextToWidth,
  stringWidth,
  truncateText as truncateTextToWidth,
} from '../utils/text-utils.js';

export type TableBorderStyle = 'single' | 'double' | 'round' | 'bold' | 'ascii' | 'none';
export type TextAlign = 'left' | 'center' | 'right';

/** Border character sets */
const TABLE_BORDERS: Record<TableBorderStyle, {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
  topMid: string;
  bottomMid: string;
  leftMid: string;
  rightMid: string;
  midMid: string;
}> = {
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    topMid: '┬',
    bottomMid: '┴',
    leftMid: '├',
    rightMid: '┤',
    midMid: '┼',
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    topMid: '╦',
    bottomMid: '╩',
    leftMid: '╠',
    rightMid: '╣',
    midMid: '╬',
  },
  round: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    topMid: '┬',
    bottomMid: '┴',
    leftMid: '├',
    rightMid: '┤',
    midMid: '┼',
  },
  bold: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
    topMid: '┳',
    bottomMid: '┻',
    leftMid: '┣',
    rightMid: '┫',
    midMid: '╋',
  },
  ascii: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
    topMid: '+',
    bottomMid: '+',
    leftMid: '+',
    rightMid: '+',
    midMid: '+',
  },
  none: {
    topLeft: '',
    topRight: '',
    bottomLeft: '',
    bottomRight: '',
    horizontal: '',
    vertical: '',
    topMid: '',
    bottomMid: '',
    leftMid: '',
    rightMid: '',
    midMid: '',
  },
};

export interface TableColumn {
  /** Column key (for data access) */
  key: string;
  /** Header label */
  header: string;
  /** Fixed width (characters) */
  width?: number;
  /** Minimum width */
  minWidth?: number;
  /** Maximum width */
  maxWidth?: number;
  /**
   * Flex grow factor for distributing remaining space.
   * - `true` is equivalent to `flex: 1`
   * - Higher numbers get proportionally more space
   * - Columns with flex expand to fill available width
   *
   * @example
   * { key: 'id', header: 'ID', width: 6 }           // fixed: 6 chars
   * { key: 'name', header: 'Name', flex: 1 }        // gets 1 part of remaining
   * { key: 'desc', header: 'Description', flex: 2 } // gets 2 parts of remaining
   */
  flex?: number | boolean;
  /** Text alignment */
  align?: TextAlign;
  /** Header alignment (defaults to align) */
  headerAlign?: TextAlign;
  /** Cell color */
  color?: string;
  /** Header color */
  headerColor?: string;
  /** Format function */
  format?: (value: any, row: any) => string;
  /** Truncate long values */
  truncate?: boolean;
  /** Word wrap */
  wrap?: boolean;
}

export interface TableOptions {
  /** Column definitions */
  columns: TableColumn[];
  /** Data rows */
  data: Record<string, any>[];
  /** Border style */
  borderStyle?: TableBorderStyle;
  /** Border color */
  borderColor?: string;
  /** Show header row */
  showHeader?: boolean;
  /** Header row style */
  headerStyle?: { color?: string; bold?: boolean; backgroundColor?: string };
  /** Zebra striping */
  striped?: boolean;
  /** Stripe color */
  stripeColor?: string;
  /** Cell padding (horizontal) */
  padding?: number;
  /** Show row separator lines */
  rowSeparator?: boolean;
  /** Max total width (also used as ceiling when shrinking) */
  maxWidth?: number;
  /**
   * Available width for the table. Flex columns will expand to fill this space.
   * If not provided, defaults to process.stdout.columns or 80.
   */
  availableWidth?: number;
  /** Compact mode (minimal padding) */
  compact?: boolean;
  /** Semantic label exposed to accessibility tooling and alternative renderers. */
  accessibilityLabel?: string;
}

function finiteNonNegativeInteger(value: number | undefined, fallback: number): number {
  return Number.isFinite(value)
    ? Math.max(0, Math.trunc(value!))
    : fallback;
}

/**
 * Get the flex value for a column (0 if not flex)
 */
export function getFlexValue(col: TableColumn): number {
  if (col.flex === true) return 1;
  if (
    typeof col.flex === 'number' &&
    Number.isFinite(col.flex) &&
    col.flex > 0
  ) {
    return col.flex;
  }
  return 0;
}

/**
 * Calculate column widths with flex support
 */
export function calculateColumnWidths(
  columns: TableColumn[],
  data: Record<string, any>[],
  maxWidth?: number,
  padding: number = 1,
  availableWidth?: number
): number[] {
  const widths: number[] = [];
  const normalizedPadding = finiteNonNegativeInteger(padding, 1);
  const normalizedAvailableWidth = availableWidth === undefined
    ? undefined
    : finiteNonNegativeInteger(availableWidth, 0);

  // Step 1: Calculate base widths for all columns
  for (const col of columns) {
    // Start with header width
    let width = stringWidth(col.header);

    // Check all data values
    for (const row of data) {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value, row);
      }
      const strValue = String(value ?? '');
      width = Math.max(width, stringWidth(strValue));
    }

    // Apply constraints (flex columns get minWidth as base)
    const flexValue = getFlexValue(col);
    if (col.width !== undefined) {
      width = finiteNonNegativeInteger(col.width, width);
    } else if (flexValue > 0) {
      // Flex columns start with minWidth as their base
      width = col.minWidth === undefined
        ? Math.max(width, 3)
        : finiteNonNegativeInteger(col.minWidth, Math.max(width, 3));
    } else {
      if (col.minWidth !== undefined) {
        width = Math.max(width, finiteNonNegativeInteger(col.minWidth, 0));
      }
      if (col.maxWidth !== undefined) {
        width = Math.min(width, finiteNonNegativeInteger(col.maxWidth, width));
      }
    }

    widths.push(width);
  }

  // Step 2: Calculate flex distribution
  const flexColumns = columns.map((col, i) => ({ index: i, flex: getFlexValue(col), col }))
    .filter(item => item.flex > 0);

  if (flexColumns.length > 0 && normalizedAvailableWidth !== undefined) {
    const totalPadding = columns.length * normalizedPadding * 2;
    const borders = columns.length + 1;
    const fixedWidth = widths.reduce((sum, w, i) => {
      // Only count non-flex columns
      return sum + (getFlexValue(columns[i]!) > 0 ? 0 : w);
    }, 0);

    // Base width already assigned to flex columns
    const flexBaseWidth = flexColumns.reduce((sum, item) => sum + widths[item.index]!, 0);

    const usedWidth = fixedWidth + flexBaseWidth + totalPadding + borders;
    const remainingSpace = Math.max(0, normalizedAvailableWidth - usedWidth);

    if (remainingSpace > 0) {
      const totalFlex = flexColumns.reduce((sum, item) => sum + item.flex, 0);

      for (const item of flexColumns) {
        const extraSpace = Math.floor((item.flex / totalFlex) * remainingSpace);
        widths[item.index] = widths[item.index]! + extraSpace;

        // Respect maxWidth if set
        if (item.col.maxWidth !== undefined) {
          widths[item.index] = Math.min(
            widths[item.index]!,
            finiteNonNegativeInteger(item.col.maxWidth, widths[item.index]!),
          );
        }
      }
    }
  }

  // Step 3: Shrink if exceeds maxWidth (same as before)
  if (maxWidth !== undefined) {
    const normalizedMaxWidth = finiteNonNegativeInteger(maxWidth, 0);
    const totalPadding = columns.length * normalizedPadding * 2;
    const borders = columns.length + 1;
    const totalWidth = widths.reduce((a, b) => a + b, 0) + totalPadding + borders;

    if (totalWidth > normalizedMaxWidth) {
      const overflow = totalWidth - normalizedMaxWidth;
      const shrinkable = widths.map((w, i) => {
        const min = finiteNonNegativeInteger(columns[i]!.minWidth, 3);
        return Math.max(0, w - min);
      });
      const totalShrinkable = shrinkable.reduce((a, b) => a + b, 0);

      if (totalShrinkable > 0) {
        for (let i = 0; i < widths.length; i++) {
          const shrinkAmount = Math.floor((shrinkable[i]! / totalShrinkable) * overflow);
          widths[i] = Math.max(
            finiteNonNegativeInteger(columns[i]!.minWidth, 3),
            widths[i]! - shrinkAmount,
          );
        }
      }
    }
  }

  return widths;
}

/**
 * Align text within a fixed width
 */
function alignText(text: string, width: number, align: TextAlign): string {
  const fitted = truncateTextToWidth(text.replace(/\r?\n/g, ' '), width, {
    truncationCharacter: '',
  });
  const len = stringWidth(fitted);
  if (len >= width) return fitted;

  const space = width - len;
  switch (align) {
    case 'right':
      return ' '.repeat(space) + fitted;
    case 'center':
      const left = Math.floor(space / 2);
      const right = space - left;
      return ' '.repeat(left) + fitted + ' '.repeat(right);
    default:
      return fitted + ' '.repeat(space);
  }
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  return truncateTextToWidth(text, maxLength, {
    truncationCharacter: '…',
  });
}

/**
 * Get terminal width with fallback
 */
export function getTerminalWidth(): number {
  try {
    return process.stdout.columns || 80;
  } catch {
    return 80;
  }
}

/**
 * Render a table
 */
export function Table(options: TableOptions): VNode {
  const {
    columns,
    data,
    borderStyle = 'single',
    borderColor = 'border',
    showHeader = true,
    headerStyle = { color: 'foreground', bold: true },
    striped = false,
    stripeColor = 'mutedForeground',
    padding = 1,
    rowSeparator = false,
    maxWidth,
    availableWidth,
    compact = false,
    accessibilityLabel = 'Data table',
  } = options;

  const actualPadding = compact
    ? 0
    : finiteNonNegativeInteger(padding, 1);
  const borders = TABLE_BORDERS[borderStyle];
  const hasBorders = borderStyle !== 'none';

  // Determine available width for flex calculation
  const effectiveAvailableWidth = availableWidth ?? getTerminalWidth();

  const widths = calculateColumnWidths(columns, data, maxWidth, actualPadding, effectiveAvailableWidth);

  const rows: VNode[] = [];

  // Helper to create a horizontal line
  const horizontalLine = (
    left: string,
    mid: string,
    right: string,
    fill: string
  ): VNode => {
    if (!hasBorders) return Box({});

    const parts: string[] = [left];
    for (let i = 0; i < widths.length; i++) {
      parts.push(fill.repeat(widths[i] + actualPadding * 2));
      if (i < widths.length - 1) parts.push(mid);
    }
    parts.push(right);

    return Box(
      { flexDirection: 'row' },
      Text({ color: borderColor }, parts.join(''))
    );
  };

  // Top border
  if (hasBorders) {
    rows.push(horizontalLine(
      borders.topLeft,
      borders.topMid,
      borders.topRight,
      borders.horizontal
    ));
  }

  // Header row
  if (showHeader) {
    const headerCells: VNode[] = [];

    if (hasBorders) {
      headerCells.push(Text({ color: borderColor }, borders.vertical));
    }

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const padStr = ' '.repeat(actualPadding);
      const align = col.headerAlign ?? col.align ?? 'left';
      const cellContent = alignText(col.header, widths[i], align);

      headerCells.push(
        Text({ color: borderColor }, padStr),
        Text({
          color: headerStyle.color ?? col.headerColor ?? 'foreground',
          bold: headerStyle.bold,
          backgroundColor: headerStyle.backgroundColor,
          role: 'columnheader',
          'aria-colindex': i + 1,
        }, cellContent),
        Text({ color: borderColor }, padStr)
      );

      if (hasBorders) {
        headerCells.push(Text({ color: borderColor }, borders.vertical));
      }
    }

    rows.push(Box(
      { flexDirection: 'row', role: 'row', 'aria-rowindex': 1 },
      ...headerCells,
    ));

    // Header separator
    if (hasBorders) {
      rows.push(horizontalLine(
        borders.leftMid,
        borders.midMid,
        borders.rightMid,
        borders.horizontal
      ));
    }
  }

  // Data rows
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const isStriped = striped && rowIndex % 2 === 1;
    const cellLines = columns.map((col, colIndex) => {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value, row);
      }
      const text = String(value ?? '');
      if (col.wrap) {
        return fitTextToWidth(text, widths[colIndex], 'wrap');
      }
      const singleLine = text.replace(/\r?\n/g, ' ');
      return [
        col.truncate === false
          ? truncateTextToWidth(singleLine, widths[colIndex], {
              truncationCharacter: '',
            })
          : truncateText(singleLine, widths[colIndex]),
      ];
    });
    const visualHeight = Math.max(1, ...cellLines.map(lines => lines.length));
    const visualLines: VNode[] = [];

    for (let lineIndex = 0; lineIndex < visualHeight; lineIndex++) {
      const dataCells: VNode[] = [];
      if (hasBorders) {
        dataCells.push(Text({ color: borderColor }, borders.vertical));
      }

      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const col = columns[colIndex];
        const padStr = ' '.repeat(actualPadding);
        const cellContent = alignText(
          cellLines[colIndex]?.[lineIndex] ?? '',
          widths[colIndex],
          col.align ?? 'left',
        );
        const cellColor = col.color ?? (isStriped ? stripeColor : undefined);

        dataCells.push(
          Text({ color: borderColor }, padStr),
          Text({
            color: cellColor,
            dim: isStriped,
            role: lineIndex === 0 ? 'cell' : undefined,
            'aria-colindex': lineIndex === 0 ? colIndex + 1 : undefined,
          }, cellContent),
          Text({ color: borderColor }, padStr),
        );

        if (hasBorders) {
          dataCells.push(Text({ color: borderColor }, borders.vertical));
        }
      }

      visualLines.push(Box({ flexDirection: 'row' }, ...dataCells));
    }

    rows.push(Box(
      {
        flexDirection: 'column',
        role: 'row',
        'aria-rowindex': rowIndex + (showHeader ? 2 : 1),
      },
      ...visualLines,
    ));

    // Row separator
    if (rowSeparator && rowIndex < data.length - 1 && hasBorders) {
      rows.push(horizontalLine(
        borders.leftMid,
        borders.midMid,
        borders.rightMid,
        borders.horizontal
      ));
    }
  }

  // Bottom border
  if (hasBorders) {
    rows.push(horizontalLine(
      borders.bottomLeft,
      borders.bottomMid,
      borders.bottomRight,
      borders.horizontal
    ));
  }

  return Box(
    {
      flexDirection: 'column',
      role: 'table',
      'aria-label': accessibilityLabel,
      'aria-rowcount': data.length + (showHeader ? 1 : 0),
      'aria-colcount': columns.length,
    },
    ...rows,
  );
}

/**
 * Simple table from 2D array
 */
export function SimpleTable(options: {
  headers?: string[];
  rows: (string | number)[][];
  borderStyle?: TableBorderStyle;
  align?: TextAlign | TextAlign[];
}): VNode {
  const { headers, rows, borderStyle = 'single', align = 'left' } = options;

  // Convert to column format
  const numCols = Math.max(
    headers?.length ?? 0,
    ...rows.map((r) => r.length)
  );

  const columns: TableColumn[] = [];
  for (let i = 0; i < numCols; i++) {
    columns.push({
      key: `col${i}`,
      header: headers?.[i] ?? `Column ${i + 1}`,
      align: Array.isArray(align) ? align[i] ?? 'left' : align,
    });
  }

  // Convert rows to data format
  const data = rows.map((row) => {
    const obj: Record<string, any> = {};
    for (let i = 0; i < row.length; i++) {
      obj[`col${i}`] = row[i];
    }
    return obj;
  });

  return Table({
    columns,
    data,
    borderStyle,
    showHeader: !!headers,
  });
}

/**
 * Key-value pairs table
 */
export function KeyValueTable(options: {
  entries: Array<{ key: string; value: any; color?: string }> | Record<string, any>;
  keyWidth?: number;
  borderStyle?: TableBorderStyle;
  keyColor?: string;
  valueColor?: string;
}): VNode {
  const {
    entries,
    keyWidth,
    borderStyle = 'none',
    keyColor = 'primary',
    valueColor = 'foreground',
  } = options;

  // Convert object to array if needed
  const entryArray = Array.isArray(entries)
    ? entries
    : Object.entries(entries).map(([key, value]) => ({ key, value }));

  const columns: TableColumn[] = [
    {
      key: 'key',
      header: 'Key',
      align: 'right',
      color: keyColor,
      width: keyWidth,
    },
    {
      key: 'value',
      header: 'Value',
      align: 'left',
      color: valueColor,
    },
  ];

  const data = entryArray.map((e) => ({
    key: e.key,
    value: String(e.value ?? ''),
    _color: e.color,
  }));

  return Table({
    columns,
    data,
    borderStyle,
    showHeader: false,
    padding: 1,
  });
}
