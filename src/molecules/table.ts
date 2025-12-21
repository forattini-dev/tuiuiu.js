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
  /** Max total width */
  maxWidth?: number;
  /** Compact mode (minimal padding) */
  compact?: boolean;
}

/**
 * Calculate column widths
 */
function calculateColumnWidths(
  columns: TableColumn[],
  data: Record<string, any>[],
  maxWidth?: number,
  padding: number = 1
): number[] {
  const widths: number[] = [];

  for (const col of columns) {
    // Start with header width
    let width = col.header.length;

    // Check all data values
    for (const row of data) {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value, row);
      }
      const strValue = String(value ?? '');
      width = Math.max(width, strValue.length);
    }

    // Apply constraints
    if (col.width) {
      width = col.width;
    } else {
      if (col.minWidth) width = Math.max(width, col.minWidth);
      if (col.maxWidth) width = Math.min(width, col.maxWidth);
    }

    widths.push(width);
  }

  // Adjust for max total width
  if (maxWidth) {
    const totalPadding = columns.length * padding * 2;
    const borders = columns.length + 1;
    const totalWidth = widths.reduce((a, b) => a + b, 0) + totalPadding + borders;

    if (totalWidth > maxWidth) {
      const overflow = totalWidth - maxWidth;
      const shrinkable = widths.map((w, i) => {
        const min = columns[i].minWidth ?? 3;
        return Math.max(0, w - min);
      });
      const totalShrinkable = shrinkable.reduce((a, b) => a + b, 0);

      if (totalShrinkable > 0) {
        for (let i = 0; i < widths.length; i++) {
          const shrinkAmount = Math.floor((shrinkable[i] / totalShrinkable) * overflow);
          widths[i] = Math.max(columns[i].minWidth ?? 3, widths[i] - shrinkAmount);
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
  const len = text.length;
  if (len >= width) return text.slice(0, width);

  const space = width - len;
  switch (align) {
    case 'right':
      return ' '.repeat(space) + text;
    case 'center':
      const left = Math.floor(space / 2);
      const right = space - left;
      return ' '.repeat(left) + text + ' '.repeat(right);
    default:
      return text + ' '.repeat(space);
  }
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return text.slice(0, maxLength);
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Render a table
 */
export function Table(options: TableOptions): VNode {
  const {
    columns,
    data,
    borderStyle = 'single',
    borderColor = 'gray',
    showHeader = true,
    headerStyle = { color: 'white', bold: true },
    striped = false,
    stripeColor = 'gray',
    padding = 1,
    rowSeparator = false,
    maxWidth,
    compact = false,
  } = options;

  const actualPadding = compact ? 0 : padding;
  const borders = TABLE_BORDERS[borderStyle];
  const hasBorders = borderStyle !== 'none';
  const widths = calculateColumnWidths(columns, data, maxWidth, actualPadding);

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
          color: headerStyle.color ?? col.headerColor ?? 'white',
          bold: headerStyle.bold,
          backgroundColor: headerStyle.backgroundColor,
        }, cellContent),
        Text({ color: borderColor }, padStr)
      );

      if (hasBorders) {
        headerCells.push(Text({ color: borderColor }, borders.vertical));
      }
    }

    rows.push(Box({ flexDirection: 'row' }, ...headerCells));

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
    const dataCells: VNode[] = [];

    if (hasBorders) {
      dataCells.push(Text({ color: borderColor }, borders.vertical));
    }

    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const col = columns[colIndex];
      const padStr = ' '.repeat(actualPadding);
      const align = col.align ?? 'left';

      let value = row[col.key];
      if (col.format) {
        value = col.format(value, row);
      }
      let cellText = String(value ?? '');

      // Truncate if needed
      if (col.truncate !== false) {
        cellText = truncateText(cellText, widths[colIndex]);
      }

      const cellContent = alignText(cellText, widths[colIndex], align);
      const cellColor = col.color ?? (isStriped ? stripeColor : undefined);

      dataCells.push(
        Text({ color: borderColor }, padStr),
        Text({
          color: cellColor,
          dim: isStriped,
        }, cellContent),
        Text({ color: borderColor }, padStr)
      );

      if (hasBorders) {
        dataCells.push(Text({ color: borderColor }, borders.vertical));
      }
    }

    rows.push(Box({ flexDirection: 'row' }, ...dataCells));

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

  return Box({ flexDirection: 'column' }, ...rows);
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
    keyColor = 'cyan',
    valueColor = 'white',
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
