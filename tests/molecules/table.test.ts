/**
 * Table Tests
 *
 * Tests for the Table component and column width calculation:
 * - Fixed width columns
 * - Auto-sized columns
 * - Flex columns that expand to fill available space
 * - Mixed column types
 */

import { describe, it, expect } from 'vitest';
import {
  Table,
  SimpleTable,
  KeyValueTable,
  calculateColumnWidths,
  getFlexValue,
  getTerminalWidth,
  type TableColumn,
} from '../../src/molecules/table.js';
import { renderToString } from '../../src/core/renderer.js';
import { stringWidth } from '../../src/utils/text-utils.js';
import type { VNode } from '../../src/utils/types.js';

function findByRole(node: VNode, role: string): VNode[] {
  return [
    ...(node.props.role === role ? [node] : []),
    ...node.children.flatMap(child => findByRole(child, role)),
  ];
}

// =============================================================================
// Test Data
// =============================================================================

const testData = [
  { id: 1, name: 'Alice', email: 'alice@example.com', status: 'Active' },
  { id: 2, name: 'Bob', email: 'bob.smith@company.org', status: 'Inactive' },
  { id: 3, name: 'Charlie', email: 'charlie@test.net', status: 'Pending' },
];

// =============================================================================
// getFlexValue Tests
// =============================================================================

describe('getFlexValue()', () => {
  it('should return 0 for columns without flex', () => {
    expect(getFlexValue({ key: 'a', header: 'A' })).toBe(0);
    expect(getFlexValue({ key: 'a', header: 'A', width: 10 })).toBe(0);
    expect(getFlexValue({ key: 'a', header: 'A', minWidth: 5 })).toBe(0);
  });

  it('should return 1 for flex: true', () => {
    expect(getFlexValue({ key: 'a', header: 'A', flex: true })).toBe(1);
  });

  it('should return the number for flex: number', () => {
    expect(getFlexValue({ key: 'a', header: 'A', flex: 1 })).toBe(1);
    expect(getFlexValue({ key: 'a', header: 'A', flex: 2 })).toBe(2);
    expect(getFlexValue({ key: 'a', header: 'A', flex: 3 })).toBe(3);
  });

  it('should return 0 for flex: 0 or negative', () => {
    expect(getFlexValue({ key: 'a', header: 'A', flex: 0 })).toBe(0);
    expect(getFlexValue({ key: 'a', header: 'A', flex: -1 })).toBe(0);
    expect(getFlexValue({ key: 'a', header: 'A', flex: Number.POSITIVE_INFINITY })).toBe(0);
    expect(getFlexValue({ key: 'a', header: 'A', flex: Number.NaN })).toBe(0);
  });

  it('should return 0 for flex: false', () => {
    expect(getFlexValue({ key: 'a', header: 'A', flex: false })).toBe(0);
  });
});

// =============================================================================
// calculateColumnWidths Tests - Fixed Width
// =============================================================================

describe('calculateColumnWidths() - fixed width', () => {
  it('should use explicit width when provided', () => {
    const columns: TableColumn[] = [
      { key: 'id', header: 'ID', width: 5 },
      { key: 'name', header: 'Name', width: 20 },
    ];
    const widths = calculateColumnWidths(columns, testData, undefined, 1, 80);
    expect(widths[0]).toBe(5);
    expect(widths[1]).toBe(20);
  });

  it('should auto-size based on content when no width specified', () => {
    const columns: TableColumn[] = [
      { key: 'id', header: 'ID' },  // max content: "3" (1 char), header: "ID" (2 chars) -> 2
      { key: 'status', header: 'Status' },  // max content: "Inactive" (8 chars) -> 8
    ];
    const widths = calculateColumnWidths(columns, testData, undefined, 1, 80);
    expect(widths[0]).toBe(2);  // "ID"
    expect(widths[1]).toBe(8);  // "Inactive"
  });

  it('should respect minWidth constraint', () => {
    const columns: TableColumn[] = [
      { key: 'id', header: 'ID', minWidth: 10 },
    ];
    const widths = calculateColumnWidths(columns, testData, undefined, 1, 80);
    expect(widths[0]).toBe(10);
  });

  it('should respect maxWidth constraint', () => {
    const columns: TableColumn[] = [
      { key: 'email', header: 'Email', maxWidth: 15 },
    ];
    const widths = calculateColumnWidths(columns, testData, undefined, 1, 80);
    expect(widths[0]).toBe(15);  // capped at maxWidth
  });

  it('should measure Unicode graphemes in terminal columns', () => {
    expect(calculateColumnWidths(
      [{ key: 'value', header: '界' }],
      [{ value: '👩‍💻' }],
    )).toEqual([2]);
  });

  it('should normalize invalid dimensions before rendering', () => {
    const widths = calculateColumnWidths(
      [{ key: 'value', header: 'Value', width: -10 }],
      [{ value: 'x' }],
      Number.NaN,
      -2,
    );

    expect(widths).toEqual([0]);
    expect(() => Table({
      columns: [{ key: 'value', header: 'Value', width: -10 }],
      data: [{ value: 'x' }],
      padding: -5,
    })).not.toThrow();
  });
});

// =============================================================================
// calculateColumnWidths Tests - Flex Columns
// =============================================================================

describe('calculateColumnWidths() - flex columns', () => {
  it('should expand single flex column to fill remaining space', () => {
    const columns: TableColumn[] = [
      { key: 'id', header: 'ID', width: 5 },
      { key: 'name', header: 'Name', flex: 1 },
      { key: 'status', header: 'Status', width: 10 },
    ];
    // Available: 80
    // Fixed: 5 + 10 = 15
    // Borders: 4 (columns + 1)
    // Padding: 3 * 1 * 2 = 6
    // Used by fixed: 15 + 4 + 6 = 25
    // Flex base (header "Name"): 4
    // Remaining: 80 - 25 - 4 = 51
    const widths = calculateColumnWidths(columns, testData, undefined, 1, 80);
    expect(widths[0]).toBe(5);
    expect(widths[1]).toBeGreaterThan(4);  // Should expand
    expect(widths[2]).toBe(10);
  });

  it('should distribute space proportionally between multiple flex columns', () => {
    const columns: TableColumn[] = [
      { key: 'id', header: 'ID', width: 6 },
      { key: 'name', header: 'Name', flex: 1 },
      { key: 'email', header: 'Email', flex: 2 },
    ];
    const widths = calculateColumnWidths(columns, testData, undefined, 1, 90);

    // flex: 2 column should be roughly twice as wide as flex: 1 column
    // (accounting for base widths)
    const flexRatio = (widths[2]! - 5) / (widths[1]! - 4);  // subtract base widths
    expect(flexRatio).toBeGreaterThan(1.5);  // Should be close to 2
  });

  it('should treat flex: true as flex: 1', () => {
    const columnsWithTrue: TableColumn[] = [
      { key: 'id', header: 'ID', width: 6 },
      { key: 'name', header: 'Name', flex: true },
    ];
    const columnsWithOne: TableColumn[] = [
      { key: 'id', header: 'ID', width: 6 },
      { key: 'name', header: 'Name', flex: 1 },
    ];

    const widthsTrue = calculateColumnWidths(columnsWithTrue, testData, undefined, 1, 80);
    const widthsOne = calculateColumnWidths(columnsWithOne, testData, undefined, 1, 80);

    expect(widthsTrue[1]).toBe(widthsOne[1]);
  });

  it('should respect maxWidth on flex columns', () => {
    const columns: TableColumn[] = [
      { key: 'id', header: 'ID', width: 6 },
      { key: 'name', header: 'Name', flex: 1, maxWidth: 15 },
    ];
    const widths = calculateColumnWidths(columns, testData, undefined, 1, 200);
    expect(widths[1]).toBe(15);  // Capped at maxWidth
  });

  it('should use minWidth as base for flex columns', () => {
    const columns: TableColumn[] = [
      { key: 'id', header: 'ID', width: 6 },
      { key: 'name', header: 'Name', flex: 1, minWidth: 20 },
    ];
    const widths = calculateColumnWidths(columns, testData, undefined, 1, 80);
    expect(widths[1]).toBeGreaterThanOrEqual(20);
  });

  it('should not expand flex columns when no availableWidth provided', () => {
    const columns: TableColumn[] = [
      { key: 'id', header: 'ID', width: 6 },
      { key: 'name', header: 'Name', flex: 1 },
    ];
    // Without availableWidth, flex columns just use their base size
    const widths = calculateColumnWidths(columns, testData, undefined, 1, undefined);
    expect(widths[1]).toBe(7);  // "Charlie" is longest name (7 chars)
  });
});

// =============================================================================
// calculateColumnWidths Tests - Shrinking
// =============================================================================

describe('calculateColumnWidths() - maxWidth shrinking', () => {
  it('should shrink columns proportionally when exceeding maxWidth', () => {
    const columns: TableColumn[] = [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
    ];
    // Without maxWidth constraint
    const widthsUnlimited = calculateColumnWidths(columns, testData, undefined, 1, 80);
    // With maxWidth constraint that forces shrinking
    const widthsLimited = calculateColumnWidths(columns, testData, 40, 1, 80);

    // Limited widths should be smaller than unlimited
    expect(widthsLimited[0]).toBeLessThanOrEqual(widthsUnlimited[0]!);
    expect(widthsLimited[1]).toBeLessThanOrEqual(widthsUnlimited[1]!);
  });

  it('should respect minWidth when shrinking', () => {
    const columns: TableColumn[] = [
      { key: 'name', header: 'Name', minWidth: 10 },
      { key: 'email', header: 'Email', minWidth: 10 },
    ];
    const widths = calculateColumnWidths(columns, testData, 20, 1, 80);
    expect(widths[0]).toBeGreaterThanOrEqual(10);
    expect(widths[1]).toBeGreaterThanOrEqual(10);
  });
});

// =============================================================================
// getTerminalWidth Tests
// =============================================================================

describe('getTerminalWidth()', () => {
  it('should return a number', () => {
    const width = getTerminalWidth();
    expect(typeof width).toBe('number');
    expect(width).toBeGreaterThan(0);
  });

  it('should return 80 as fallback when no TTY', () => {
    // In test environment, usually no TTY
    const width = getTerminalWidth();
    expect(width).toBeGreaterThanOrEqual(80);
  });
});

// =============================================================================
// Table Component Tests
// =============================================================================

describe('Table()', () => {
  it('should render without errors', () => {
    const node = Table({
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'status', header: 'Status' },
      ],
      data: testData,
    });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('should render with flex columns', () => {
    const node = Table({
      columns: [
        { key: 'id', header: 'ID', width: 5 },
        { key: 'name', header: 'Name', flex: 1 },
        { key: 'status', header: 'Status', width: 10 },
      ],
      data: testData,
      availableWidth: 80,
    });
    expect(node).toBeDefined();
  });

  it('should render with different border styles', () => {
    const styles = ['single', 'double', 'round', 'bold', 'ascii', 'none'] as const;
    for (const style of styles) {
      const node = Table({
        columns: [{ key: 'name', header: 'Name' }],
        data: testData,
        borderStyle: style,
      });
      expect(node).toBeDefined();
    }
  });

  it('should truncate and align cells by display width', () => {
    const node = Table({
      columns: [{ key: 'value', header: 'Value', width: 2 }],
      data: [{ value: '👩‍💻X' }],
    });
    const cell = findByRole(node, 'cell')[0]!;

    expect(stringWidth(cell.props.children)).toBe(2);
    expect(cell.props.children).toBe('… ');
  });

  it('should expose table, row, header, and cell semantics', () => {
    const node = Table({
      columns: [{ key: 'name', header: 'Name' }],
      data: [{ name: 'Alice' }],
      accessibilityLabel: 'Users',
    });
    expect(node.props).toMatchObject({
      role: 'table',
      'aria-label': 'Users',
      'aria-rowcount': 2,
      'aria-colcount': 1,
    });
    expect(node.children.some(row => row.props.role === 'row')).toBe(true);
    expect(findByRole(node, 'columnheader')).toHaveLength(1);
    expect(findByRole(node, 'cell')).toHaveLength(1);
  });

  it('should wrap cells into bordered visual lines when requested', () => {
    const node = Table({
      columns: [{ key: 'value', header: 'Value', width: 5, wrap: true }],
      data: [{ value: 'alpha beta' }],
    });
    const output = renderToString(node, 40);

    expect(output).toContain('alpha');
    expect(output).toContain('beta');
    expect(findByRole(node, 'row')).toHaveLength(2);
    expect(findByRole(node, 'cell')).toHaveLength(1);
  });
});

// =============================================================================
// SimpleTable Tests
// =============================================================================

describe('SimpleTable()', () => {
  it('should render from 2D array', () => {
    const node = SimpleTable({
      headers: ['A', 'B'],
      rows: [
        ['1', '2'],
        ['3', '4'],
      ],
    });
    expect(node).toBeDefined();
  });
});

// =============================================================================
// KeyValueTable Tests
// =============================================================================

describe('KeyValueTable()', () => {
  it('should render key-value pairs', () => {
    const node = KeyValueTable({
      entries: {
        Name: 'Test',
        Value: '123',
      },
    });
    expect(node).toBeDefined();
  });

  it('should render from array of entries', () => {
    const node = KeyValueTable({
      entries: [
        { key: 'Name', value: 'Test' },
        { key: 'Value', value: 123 },
      ],
    });
    expect(node).toBeDefined();
  });
});
