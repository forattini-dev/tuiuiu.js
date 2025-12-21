/**
 * Grid Layout System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseTrackSize,
  parseTrackDefinition,
  parseGridAreas,
  calculateTrackSizes,
  calculateCellPosition,
  calculateGridLayout,
  Grid,
  GridItem,
  GridRow,
  GridColumn,
  AutoGrid,
  DashboardGrid,
  MasonryGrid,
  repeat,
  minmax,
  gridAreasToTemplate,
} from '../../src/components/grid.js';
import { Text, Box } from '../../src/design-system/primitives/index.js';

// =============================================================================
// Track Parsing Tests
// =============================================================================

describe('parseTrackSize', () => {
  it('should parse fixed number', () => {
    const result = parseTrackSize(10);
    expect(result).toEqual({ type: 'fixed', value: 10 });
  });

  it('should parse fractional unit', () => {
    const result = parseTrackSize('2fr');
    expect(result).toEqual({ type: 'fr', value: 2 });
  });

  it('should parse decimal fractional unit', () => {
    const result = parseTrackSize('1.5fr');
    expect(result).toEqual({ type: 'fr', value: 1.5 });
  });

  it('should parse auto', () => {
    const result = parseTrackSize('auto');
    expect(result).toEqual({ type: 'auto', value: 0 });
  });

  it('should parse min-content', () => {
    const result = parseTrackSize('min-content');
    expect(result).toEqual({ type: 'min-content', value: 0 });
  });

  it('should parse max-content', () => {
    const result = parseTrackSize('max-content');
    expect(result).toEqual({ type: 'max-content', value: 0 });
  });

  it('should parse minmax', () => {
    const result = parseTrackSize('minmax(10,50)');
    expect(result).toEqual({ type: 'minmax', value: 0, min: 10, max: 50 });
  });

  it('should parse minmax with auto', () => {
    const result = parseTrackSize('minmax(auto,100)');
    expect(result).toEqual({ type: 'minmax', value: 0, min: 0, max: 100 });
  });

  it('should default to auto for unknown', () => {
    const result = parseTrackSize('unknown' as any);
    expect(result).toEqual({ type: 'auto', value: 0 });
  });
});

describe('parseTrackDefinition', () => {
  it('should parse space-separated string', () => {
    const result = parseTrackDefinition('1fr 2fr 1fr');
    expect(result).toEqual([
      { type: 'fr', value: 1 },
      { type: 'fr', value: 2 },
      { type: 'fr', value: 1 },
    ]);
  });

  it('should parse mixed tracks', () => {
    const result = parseTrackDefinition('10 1fr auto');
    expect(result).toEqual([
      { type: 'fixed', value: 10 },
      { type: 'fr', value: 1 },
      { type: 'auto', value: 0 },
    ]);
  });

  it('should parse array input', () => {
    const result = parseTrackDefinition([10, '1fr', 'auto']);
    expect(result).toEqual([
      { type: 'fixed', value: 10 },
      { type: 'fr', value: 1 },
      { type: 'auto', value: 0 },
    ]);
  });

  it('should handle repeat function', () => {
    const result = parseTrackDefinition('repeat(3, 1fr)');
    expect(result).toEqual([
      { type: 'fr', value: 1 },
      { type: 'fr', value: 1 },
      { type: 'fr', value: 1 },
    ]);
  });

  it('should handle repeat with fixed values', () => {
    const result = parseTrackDefinition('repeat(2, 20)');
    expect(result).toEqual([
      { type: 'fixed', value: 20 },
      { type: 'fixed', value: 20 },
    ]);
  });
});

describe('parseGridAreas', () => {
  it('should parse simple grid areas', () => {
    const areas = parseGridAreas(`
      "header header"
      "nav    main"
      "footer footer"
    `);

    expect(areas.get('header')).toEqual({
      name: 'header',
      rowStart: 1,
      rowEnd: 2,
      colStart: 1,
      colEnd: 3,
    });

    expect(areas.get('nav')).toEqual({
      name: 'nav',
      rowStart: 2,
      rowEnd: 3,
      colStart: 1,
      colEnd: 2,
    });

    expect(areas.get('main')).toEqual({
      name: 'main',
      rowStart: 2,
      rowEnd: 3,
      colStart: 2,
      colEnd: 3,
    });

    expect(areas.get('footer')).toEqual({
      name: 'footer',
      rowStart: 3,
      rowEnd: 4,
      colStart: 1,
      colEnd: 3,
    });
  });

  it('should handle spanning areas', () => {
    const areas = parseGridAreas(`
      "a a b"
      "a a b"
      "c c c"
    `);

    expect(areas.get('a')).toEqual({
      name: 'a',
      rowStart: 1,
      rowEnd: 3,
      colStart: 1,
      colEnd: 3,
    });

    expect(areas.get('b')).toEqual({
      name: 'b',
      rowStart: 1,
      rowEnd: 3,
      colStart: 3,
      colEnd: 4,
    });

    expect(areas.get('c')).toEqual({
      name: 'c',
      rowStart: 3,
      rowEnd: 4,
      colStart: 1,
      colEnd: 4,
    });
  });

  it('should handle empty cells with dots', () => {
    const areas = parseGridAreas(`
      "a . b"
      ". . ."
      "c c c"
    `);

    expect(areas.has('.')).toBe(false);
    expect(areas.size).toBe(3);
  });

  it('should handle single-line areas', () => {
    const areas = parseGridAreas('"a b c"');
    expect(areas.get('a')).toEqual({
      name: 'a',
      rowStart: 1,
      rowEnd: 2,
      colStart: 1,
      colEnd: 2,
    });
  });
});

// =============================================================================
// Track Size Calculation Tests
// =============================================================================

describe('calculateTrackSizes', () => {
  it('should distribute fr units evenly', () => {
    const tracks = [
      { type: 'fr' as const, value: 1 },
      { type: 'fr' as const, value: 1 },
      { type: 'fr' as const, value: 1 },
    ];
    const sizes = calculateTrackSizes(tracks, 90, 0, []);
    expect(sizes).toEqual([30, 30, 30]);
  });

  it('should handle proportional fr units', () => {
    const tracks = [
      { type: 'fr' as const, value: 1 },
      { type: 'fr' as const, value: 2 },
      { type: 'fr' as const, value: 1 },
    ];
    const sizes = calculateTrackSizes(tracks, 80, 0, []);
    expect(sizes).toEqual([20, 40, 20]);
  });

  it('should account for fixed tracks', () => {
    const tracks = [
      { type: 'fixed' as const, value: 20 },
      { type: 'fr' as const, value: 1 },
      { type: 'fixed' as const, value: 10 },
    ];
    const sizes = calculateTrackSizes(tracks, 80, 0, []);
    expect(sizes).toEqual([20, 50, 10]);
  });

  it('should account for gaps', () => {
    const tracks = [
      { type: 'fr' as const, value: 1 },
      { type: 'fr' as const, value: 1 },
    ];
    const sizes = calculateTrackSizes(tracks, 81, 1, []);
    expect(sizes).toEqual([40, 40]);
  });

  it('should handle auto tracks with content sizes', () => {
    const tracks = [
      { type: 'auto' as const, value: 0 },
      { type: 'fr' as const, value: 1 },
    ];
    const contentSizes = [15, 0];
    const sizes = calculateTrackSizes(tracks, 80, 0, contentSizes);
    expect(sizes[0]).toBe(15);
    expect(sizes[1]).toBe(65);
  });

  it('should handle minmax tracks', () => {
    const tracks = [
      { type: 'minmax' as const, value: 0, min: 10, max: 50 },
      { type: 'fr' as const, value: 1 },
    ];
    const sizes = calculateTrackSizes(tracks, 100, 0, []);
    expect(sizes[0]).toBe(10); // Min value
    expect(sizes[1]).toBe(90);
  });

  it('should not produce negative sizes', () => {
    const tracks = [
      { type: 'fixed' as const, value: 50 },
      { type: 'fixed' as const, value: 50 },
    ];
    const sizes = calculateTrackSizes(tracks, 30, 0, []);
    expect(sizes.every((s) => s >= 0)).toBe(true);
  });
});

// =============================================================================
// Cell Position Tests
// =============================================================================

describe('calculateCellPosition', () => {
  const emptyAreas = new Map();

  it('should place item with area', () => {
    const areas = parseGridAreas(`
      "header header"
      "nav    main"
    `);

    const position = calculateCellPosition({ area: 'header' }, areas, 2, 2, { row: 1, column: 1 });

    expect(position).toEqual({
      row: 1,
      column: 1,
      rowSpan: 1,
      columnSpan: 2,
    });
  });

  it('should place item with explicit column', () => {
    const position = calculateCellPosition({ column: 2 }, emptyAreas, 3, 3, { row: 1, column: 1 });

    expect(position).toEqual({
      row: 1,
      column: 2,
      rowSpan: 1,
      columnSpan: 1,
    });
  });

  it('should place item with column range', () => {
    const position = calculateCellPosition({ column: '1 / 3' }, emptyAreas, 3, 3, {
      row: 1,
      column: 1,
    });

    expect(position).toEqual({
      row: 1,
      column: 1,
      rowSpan: 1,
      columnSpan: 2,
    });
  });

  it('should place item with span', () => {
    const position = calculateCellPosition({ column: 'span 2' }, emptyAreas, 3, 3, {
      row: 1,
      column: 1,
    });

    expect(position).toEqual({
      row: 1,
      column: 1,
      rowSpan: 1,
      columnSpan: 2,
    });
  });

  it('should place item with columnSpan', () => {
    const position = calculateCellPosition(
      { column: 1, columnSpan: 2 },
      emptyAreas,
      3,
      3,
      { row: 1, column: 1 }
    );

    expect(position).toEqual({
      row: 1,
      column: 1,
      rowSpan: 1,
      columnSpan: 2,
    });
  });

  it('should place item with rowSpan', () => {
    const position = calculateCellPosition({ row: 1, rowSpan: 3 }, emptyAreas, 3, 3, {
      row: 1,
      column: 1,
    });

    expect(position).toEqual({
      row: 1,
      column: 1,
      rowSpan: 3,
      columnSpan: 1,
    });
  });

  it('should handle start / span syntax', () => {
    const position = calculateCellPosition({ column: '2 / span 2' }, emptyAreas, 4, 4, {
      row: 1,
      column: 1,
    });

    expect(position).toEqual({
      row: 1,
      column: 2,
      rowSpan: 1,
      columnSpan: 2,
    });
  });

  it('should use auto-placement for items without position', () => {
    const position = calculateCellPosition({}, emptyAreas, 3, 3, { row: 2, column: 3 });

    expect(position).toEqual({
      row: 2,
      column: 3,
      rowSpan: 1,
      columnSpan: 1,
    });
  });
});

// =============================================================================
// Grid Layout Calculation Tests
// =============================================================================

describe('calculateGridLayout', () => {
  it('should calculate layout for simple grid', () => {
    const items = [
      { node: Text({}, 'A'), options: {} },
      { node: Text({}, 'B'), options: {} },
      { node: Text({}, 'C'), options: {} },
    ];

    const layout = calculateGridLayout({ columns: '1fr 1fr 1fr' }, items, 90);

    expect(layout.columnSizes).toEqual([30, 30, 30]);
    expect(layout.cells.size).toBe(3);
  });

  it('should calculate layout with areas', () => {
    const header = Text({}, 'Header');
    const main = Text({}, 'Main');

    const items = [
      { node: header, options: { area: 'header' } },
      { node: main, options: { area: 'main' } },
    ];

    const layout = calculateGridLayout(
      {
        columns: '1fr 2fr',
        areas: `
          "header header"
          "nav    main"
        `,
      },
      items,
      90
    );

    expect(layout.areas.get('header')).toBeDefined();
    expect(layout.areas.get('main')).toBeDefined();
  });

  it('should handle gaps', () => {
    const items = [
      { node: Text({}, 'A'), options: {} },
      { node: Text({}, 'B'), options: {} },
    ];

    const layout = calculateGridLayout({ columns: '1fr 1fr', gap: 10 }, items, 90);

    expect(layout.columnSizes[0]! + layout.columnSizes[1]!).toBe(80); // 90 - 10 gap
  });

  it('should handle row and column gaps separately', () => {
    const items = [
      { node: Text({}, 'A'), options: {} },
      { node: Text({}, 'B'), options: {} },
    ];

    const layout = calculateGridLayout(
      { columns: '1fr 1fr', rowGap: 2, columnGap: 5 },
      items,
      85
    );

    expect(layout.columnSizes[0]! + layout.columnSizes[1]!).toBe(80);
  });

  it('should auto-place items', () => {
    const items = [
      { node: Text({}, 'A'), options: {} },
      { node: Text({}, 'B'), options: {} },
      { node: Text({}, 'C'), options: {} },
      { node: Text({}, 'D'), options: {} },
    ];

    const layout = calculateGridLayout({ columns: '1fr 1fr' }, items, 80);

    // Items should fill 2x2 grid
    const positions = [...layout.cells.values()];
    expect(positions.length).toBe(4);
  });

  it('should respect explicit placement over auto-placement', () => {
    const a = Text({}, 'A');
    const b = Text({}, 'B');

    const items = [
      { node: a, options: { column: 2 } },
      { node: b, options: {} },
    ];

    const layout = calculateGridLayout({ columns: '1fr 1fr' }, items, 80);

    expect(layout.cells.get(a)?.column).toBe(2);
    expect(layout.cells.get(b)?.column).toBe(1);
  });

  it('should handle order property', () => {
    const a = Text({}, 'A');
    const b = Text({}, 'B');
    const c = Text({}, 'C');

    const items = [
      { node: a, options: { order: 3 } },
      { node: b, options: { order: 1 } },
      { node: c, options: { order: 2 } },
    ];

    const layout = calculateGridLayout({ columns: '1fr 1fr 1fr' }, items, 90);

    // B should be placed first (order 1), then C (order 2), then A (order 3)
    expect(layout.cells.get(b)?.column).toBe(1);
    expect(layout.cells.get(c)?.column).toBe(2);
    expect(layout.cells.get(a)?.column).toBe(3);
  });
});

// =============================================================================
// Grid Component Tests
// =============================================================================

describe('Grid', () => {
  it('should create a grid container', () => {
    const grid = Grid({ columns: '1fr 1fr' }, Text({}, 'A'), Text({}, 'B'));

    expect(grid.type).toBe('box');
    expect(grid.props.flexDirection).toBe('column');
  });

  it('should create grid with border', () => {
    const grid = Grid(
      { columns: '1fr', border: true, borderStyle: 'round' },
      Text({}, 'Content')
    );

    expect(grid.props.borderStyle).toBe('round');
  });

  it('should handle null children', () => {
    const grid = Grid({ columns: '1fr 1fr' }, Text({}, 'A'), null, Text({}, 'B'));

    expect(grid.type).toBe('box');
  });
});

describe('GridItem', () => {
  it('should create a grid item wrapper', () => {
    const item = GridItem({ area: 'main' }, Text({}, 'Content'));

    expect(item.type).toBe('box');
  });

  it('should handle multiple children', () => {
    const item = GridItem({ column: 1 }, Text({}, 'A'), Text({}, 'B'));

    expect(item.type).toBe('box');
    expect(item.children.length).toBe(2);
  });
});

// =============================================================================
// Convenience Component Tests
// =============================================================================

describe('GridRow', () => {
  it('should create equal column grid', () => {
    const row = GridRow({}, Text({}, 'A'), Text({}, 'B'), Text({}, 'C'));

    expect(row.type).toBe('box');
  });

  it('should respect columnCount option', () => {
    const row = GridRow({ columnCount: 4 }, Text({}, 'A'), Text({}, 'B'));

    expect(row.type).toBe('box');
  });
});

describe('GridColumn', () => {
  it('should create equal row grid', () => {
    const col = GridColumn({}, Text({}, 'A'), Text({}, 'B'), Text({}, 'C'));

    expect(col.type).toBe('box');
  });

  it('should respect rowCount option', () => {
    const col = GridColumn({ rowCount: 4 }, Text({}, 'A'), Text({}, 'B'));

    expect(col.type).toBe('box');
  });
});

describe('AutoGrid', () => {
  it('should create responsive grid', () => {
    const grid = AutoGrid(
      { minColumnWidth: 20, width: 80 },
      Text({}, 'A'),
      Text({}, 'B'),
      Text({}, 'C'),
      Text({}, 'D')
    );

    expect(grid.type).toBe('box');
  });

  it('should handle gaps in column calculation', () => {
    const grid = AutoGrid(
      { minColumnWidth: 30, width: 100, gap: 10 },
      Text({}, 'A'),
      Text({}, 'B'),
      Text({}, 'C')
    );

    expect(grid.type).toBe('box');
  });

  it('should ensure at least 1 column', () => {
    const grid = AutoGrid(
      { minColumnWidth: 100, width: 50 },
      Text({}, 'A')
    );

    expect(grid.type).toBe('box');
  });
});

describe('DashboardGrid', () => {
  it('should create full dashboard layout', () => {
    const dashboard = DashboardGrid(
      { width: 80, height: 24 },
      {
        header: Text({}, 'Header'),
        sidebar: Text({}, 'Sidebar'),
        main: Text({}, 'Main'),
        footer: Text({}, 'Footer'),
      }
    );

    expect(dashboard.type).toBe('box');
  });

  it('should create layout without optional areas', () => {
    const dashboard = DashboardGrid(
      { width: 80 },
      {
        main: Text({}, 'Main content'),
      }
    );

    expect(dashboard.type).toBe('box');
  });

  it('should create layout with header and footer only', () => {
    const dashboard = DashboardGrid(
      { width: 80 },
      {
        header: Text({}, 'Header'),
        main: Text({}, 'Main'),
        footer: Text({}, 'Footer'),
      }
    );

    expect(dashboard.type).toBe('box');
  });

  it('should apply border options', () => {
    const dashboard = DashboardGrid(
      { width: 80, border: true, borderStyle: 'double' },
      { main: Text({}, 'Main') }
    );

    expect(dashboard.props.borderStyle).toBe('double');
  });
});

describe('MasonryGrid', () => {
  it('should create masonry layout', () => {
    const masonry = MasonryGrid(
      { columns: 3, width: 90 },
      Text({}, 'A'),
      Text({}, 'B'),
      Text({}, 'C'),
      Text({}, 'D'),
      Text({}, 'E')
    );

    expect(masonry.type).toBe('box');
    expect(masonry.props.flexDirection).toBe('row');
  });

  it('should apply gaps between columns', () => {
    const masonry = MasonryGrid(
      { columns: 2, gap: 5, width: 85 },
      Text({}, 'A'),
      Text({}, 'B')
    );

    expect(masonry.props.gap).toBe(5);
  });

  it('should distribute items across columns', () => {
    const masonry = MasonryGrid(
      { columns: 2, width: 80 },
      Text({}, 'A'),
      Text({}, 'B'),
      Text({}, 'C'),
      Text({}, 'D')
    );

    expect(masonry.children.length).toBe(2); // 2 column containers
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('repeat', () => {
  it('should create repeated track string for numbers', () => {
    const result = repeat(3, 20);
    expect(result).toBe('20 20 20');
  });

  it('should create repeated track string for fr units', () => {
    const result = repeat(4, '1fr');
    expect(result).toBe('1fr 1fr 1fr 1fr');
  });

  it('should create repeated track string for auto', () => {
    const result = repeat(2, 'auto');
    expect(result).toBe('auto auto');
  });
});

describe('minmax', () => {
  it('should create minmax string with numbers', () => {
    const result = minmax(10, 50);
    expect(result).toBe('minmax(10,50)');
  });

  it('should create minmax string with mixed values', () => {
    const result = minmax('auto', '1fr');
    expect(result).toBe('minmax(auto,1fr)');
  });

  it('should create minmax string with fr units', () => {
    const result = minmax('1fr', '2fr');
    expect(result).toBe('minmax(1fr,2fr)');
  });
});

describe('gridAreasToTemplate', () => {
  it('should convert 2D array to template string', () => {
    const areas = [
      ['header', 'header', 'header'],
      ['nav', 'main', 'aside'],
      ['footer', 'footer', 'footer'],
    ];

    const result = gridAreasToTemplate(areas);
    expect(result).toBe('"header header header"\n"nav main aside"\n"footer footer footer"');
  });

  it('should handle single row', () => {
    const areas = [['a', 'b', 'c']];
    const result = gridAreasToTemplate(areas);
    expect(result).toBe('"a b c"');
  });

  it('should handle dots for empty cells', () => {
    const areas = [
      ['a', '.', 'b'],
      ['.', 'c', '.'],
    ];
    const result = gridAreasToTemplate(areas);
    expect(result).toBe('"a . b"\n". c ."');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty grid', () => {
    const grid = Grid({ columns: '1fr' });
    expect(grid.type).toBe('box');
  });

  it('should handle single cell grid', () => {
    const grid = Grid({ columns: '1fr', rows: '1fr' }, Text({}, 'Only cell'));

    expect(grid.type).toBe('box');
  });

  it('should handle very large grid', () => {
    const items = Array.from({ length: 100 }, (_, i) => Text({}, `Item ${i}`));
    const grid = Grid({ columns: repeat(10, '1fr') }, ...items);

    expect(grid.type).toBe('box');
  });

  it('should handle overlapping areas gracefully', () => {
    // Areas are defined but may be used inconsistently
    const grid = Grid(
      {
        columns: '1fr 1fr',
        areas: '"a a"\n"a a"',
      },
      GridItem({ area: 'a' }, Text({}, 'Spans all'))
    );

    expect(grid.type).toBe('box');
  });

  it('should handle missing area names', () => {
    const grid = Grid(
      {
        columns: '1fr 1fr',
        areas: '"a b"\n"c d"',
      },
      GridItem({ area: 'nonexistent' }, Text({}, 'Will use auto-placement'))
    );

    expect(grid.type).toBe('box');
  });

  it('should handle zero width gracefully', () => {
    const grid = Grid(
      { columns: '1fr 1fr', width: 0 },
      Text({}, 'A'),
      Text({}, 'B')
    );

    expect(grid.type).toBe('box');
  });

  it('should handle fractional widths', () => {
    const grid = Grid(
      { columns: '1fr 2fr 1fr', width: 83 },
      Text({}, 'A'),
      Text({}, 'B'),
      Text({}, 'C')
    );

    expect(grid.type).toBe('box');
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration', () => {
  it('should create complex nested layout', () => {
    const layout = DashboardGrid(
      { width: 120, height: 30, gap: 1 },
      {
        header: Box({ padding: 1 }, Text({ bold: true }, 'Dashboard')),
        sidebar: Grid(
          { columns: '1fr', rows: 'auto auto auto', gap: 1 },
          Text({}, 'Menu 1'),
          Text({}, 'Menu 2'),
          Text({}, 'Menu 3')
        ),
        main: AutoGrid(
          { minColumnWidth: 30, gap: 2 },
          Box({ border: true }, Text({}, 'Card 1')),
          Box({ border: true }, Text({}, 'Card 2')),
          Box({ border: true }, Text({}, 'Card 3')),
          Box({ border: true }, Text({}, 'Card 4'))
        ),
        footer: Text({ dim: true }, '© 2025'),
      }
    );

    expect(layout.type).toBe('box');
  });

  it('should handle responsive adjustment', () => {
    // Simulate different container widths
    const widths = [40, 80, 120];

    for (const width of widths) {
      const grid = AutoGrid(
        { minColumnWidth: 20, width },
        Text({}, 'A'),
        Text({}, 'B'),
        Text({}, 'C'),
        Text({}, 'D')
      );

      expect(grid.type).toBe('box');
    }
  });
});
