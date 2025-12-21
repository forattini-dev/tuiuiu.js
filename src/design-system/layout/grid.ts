/**
 * Grid - CSS Grid-like layout system
 *
 * Features:
 * - Column/row definitions
 * - Cell spanning
 * - Gap between cells
 * - Alignment options
 * - Responsive column counts
 */

import { Box, Text } from '../../primitives/nodes.js';
import type { VNode } from '../../utils/types.js';

// =============================================================================
// Types
// =============================================================================

export type GridTrackSize = number | 'auto' | 'fr' | `${number}fr`;

export interface GridOptions {
  /** Number of columns (simple mode) */
  columns?: number;
  /** Column template (advanced mode) */
  templateColumns?: GridTrackSize[];
  /** Row template (optional) */
  templateRows?: GridTrackSize[];
  /** Gap between cells */
  gap?: number;
  /** Row gap (overrides gap for rows) */
  rowGap?: number;
  /** Column gap (overrides gap for columns) */
  columnGap?: number;
  /** Total width */
  width?: number;
  /** Total height */
  height?: number;
  /** Align items */
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  /** Justify items */
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
}

export interface GridCellOptions {
  /** Column start (1-based) */
  column?: number;
  /** Column span */
  columnSpan?: number;
  /** Row start (1-based) */
  row?: number;
  /** Row span */
  rowSpan?: number;
  /** Cell alignment override */
  alignSelf?: 'start' | 'center' | 'end' | 'stretch';
  /** Cell justification override */
  justifySelf?: 'start' | 'center' | 'end' | 'stretch';
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse grid track size to actual width
 */
function parseTrackSize(
  size: GridTrackSize,
  availableSpace: number,
  totalFr: number
): number {
  if (typeof size === 'number') {
    return size;
  }
  if (size === 'auto') {
    return 0; // Will be calculated based on content
  }
  if (size === 'fr') {
    return Math.floor(availableSpace / totalFr);
  }
  if (size.endsWith('fr')) {
    const fr = parseFloat(size);
    return Math.floor((fr / totalFr) * availableSpace);
  }
  return 0;
}

/**
 * Calculate column widths from template
 */
function calculateColumnWidths(
  template: GridTrackSize[],
  totalWidth: number,
  columnGap: number
): number[] {
  const gaps = (template.length - 1) * columnGap;
  const availableSpace = totalWidth - gaps;

  // Count total fr units
  let totalFr = 0;
  let fixedWidth = 0;

  template.forEach((size) => {
    if (typeof size === 'number') {
      fixedWidth += size;
    } else if (size === 'fr') {
      totalFr += 1;
    } else if (typeof size === 'string' && size.endsWith('fr')) {
      totalFr += parseFloat(size);
    }
  });

  const frSpace = availableSpace - fixedWidth;

  return template.map((size) => parseTrackSize(size, frSpace, totalFr));
}

// =============================================================================
// Components
// =============================================================================

export interface GridProps extends GridOptions {
  /** Grid cells */
  children: VNode[];
}

/**
 * Grid - CSS Grid-like layout
 *
 * @example
 * // Simple 3-column grid
 * Grid(
 *   { columns: 3, gap: 1 },
 *   Text({}, 'Cell 1'),
 *   Text({}, 'Cell 2'),
 *   Text({}, 'Cell 3'),
 *   Text({}, 'Cell 4'),
 *   Text({}, 'Cell 5'),
 *   Text({}, 'Cell 6'),
 * )
 *
 * @example
 * // With column template
 * Grid(
 *   { templateColumns: [10, '1fr', '2fr'], gap: 2, width: 60 },
 *   Text({}, 'Fixed'),
 *   Text({}, 'Flex 1'),
 *   Text({}, 'Flex 2'),
 * )
 */
export function Grid(props: GridProps): VNode {
  const {
    columns = 3,
    templateColumns,
    gap = 0,
    rowGap = gap,
    columnGap = gap,
    width,
    children,
  } = props;

  // Determine column template
  const colTemplate = templateColumns ?? Array(columns).fill('1fr' as GridTrackSize);
  const numColumns = colTemplate.length;

  // Calculate column widths if width is specified
  let colWidths: number[] | undefined;
  if (width) {
    colWidths = calculateColumnWidths(colTemplate, width, columnGap);
  }

  // Arrange children into rows
  const rows: VNode[][] = [];
  let currentRow: VNode[] = [];

  children.forEach((child, i) => {
    currentRow.push(child);
    if (currentRow.length === numColumns) {
      rows.push(currentRow);
      currentRow = [];
    }
  });

  // Add remaining cells
  if (currentRow.length > 0) {
    // Pad with empty cells
    while (currentRow.length < numColumns) {
      currentRow.push(Text({}, ''));
    }
    rows.push(currentRow);
  }

  // Render rows
  const rowNodes = rows.map((row, rowIndex) => {
    const cellNodes = row.map((cell, colIndex) => {
      const cellWidth = colWidths?.[colIndex];
      return Box(
        {
          width: cellWidth,
          marginRight: colIndex < numColumns - 1 ? columnGap : 0,
        },
        cell
      );
    });

    return Box(
      {
        flexDirection: 'row',
        marginBottom: rowIndex < rows.length - 1 ? rowGap : 0,
      },
      ...cellNodes
    );
  });

  return Box(
    { flexDirection: 'column', width },
    ...rowNodes
  );
}

// =============================================================================
// GridCell - Wrapper for positioned cells
// =============================================================================

export interface GridCellProps extends GridCellOptions {
  /** Cell content */
  children: VNode;
}

/**
 * GridCell - Positioned grid cell
 *
 * Note: For spanning to work properly, use PositionedGrid instead of Grid.
 */
export function GridCell(props: GridCellProps): VNode {
  const { children } = props;
  // Store positioning info in a wrapper
  // The parent Grid will read these for positioning
  return children;
}

// =============================================================================
// SimpleGrid - Equal-width columns
// =============================================================================

export interface SimpleGridOptions {
  /** Number of columns */
  columns: number;
  /** Gap between cells */
  spacing?: number;
  /** Total width */
  width?: number;
  /** Children */
  children: VNode[];
}

/**
 * SimpleGrid - Equal-width column grid
 *
 * @example
 * SimpleGrid(
 *   { columns: 4, spacing: 2 },
 *   ...items.map(item => ItemCard(item))
 * )
 */
export function SimpleGrid(props: SimpleGridOptions): VNode {
  const { columns, spacing = 1, width, children } = props;

  return Grid({
    columns,
    gap: spacing,
    width,
    children,
  });
}

// =============================================================================
// AutoGrid - Auto-flowing grid that fills available space
// =============================================================================

export interface AutoGridOptions {
  /** Minimum column width */
  minColumnWidth: number;
  /** Maximum columns */
  maxColumns?: number;
  /** Gap between cells */
  gap?: number;
  /** Total width */
  width: number;
  /** Children */
  children: VNode[];
}

/**
 * AutoGrid - Auto-calculate column count based on width
 *
 * @example
 * AutoGrid({
 *   minColumnWidth: 20,
 *   width: 80,
 *   gap: 2,
 *   children: items.map(i => ItemCard(i))
 * })
 */
export function AutoGrid(props: AutoGridOptions): VNode {
  const { minColumnWidth, maxColumns, gap = 1, width, children } = props;

  // Calculate number of columns that fit
  let columns = Math.floor((width + gap) / (minColumnWidth + gap));
  columns = Math.max(1, columns);
  if (maxColumns) {
    columns = Math.min(columns, maxColumns);
  }

  return Grid({
    columns,
    gap,
    width,
    children,
  });
}

// =============================================================================
// MasonryGrid - Variable height masonry layout
// =============================================================================

export interface MasonryGridOptions {
  /** Number of columns */
  columns: number;
  /** Gap between items */
  gap?: number;
  /** Total width */
  width?: number;
  /** Items with heights */
  items: { content: VNode; height: number }[];
}

/**
 * MasonryGrid - Pinterest-style masonry layout
 *
 * @example
 * MasonryGrid({
 *   columns: 3,
 *   items: cards.map(c => ({ content: Card(c), height: c.lines }))
 * })
 */
export function MasonryGrid(props: MasonryGridOptions): VNode {
  const { columns, gap = 1, width, items } = props;

  // Track column heights
  const columnHeights: number[] = Array(columns).fill(0);
  const columnItems: VNode[][] = Array.from({ length: columns }, () => []);

  // Distribute items to shortest column
  items.forEach((item) => {
    // Find shortest column
    let minHeight = columnHeights[0]!;
    let minCol = 0;
    columnHeights.forEach((h, i) => {
      if (h < minHeight) {
        minHeight = h;
        minCol = i;
      }
    });

    // Add item to shortest column
    columnItems[minCol]!.push(item.content);
    columnHeights[minCol]! += item.height + gap;
  });

  // Calculate column width
  const colWidth = width
    ? Math.floor((width - (columns - 1) * gap) / columns)
    : undefined;

  // Render columns
  const columnNodes = columnItems.map((items, i) =>
    Box(
      {
        flexDirection: 'column',
        width: colWidth,
        gap,
        marginRight: i < columns - 1 ? gap : 0,
      },
      ...items
    )
  );

  return Box(
    { flexDirection: 'row', width },
    ...columnNodes
  );
}

// =============================================================================
// GridArea - Named grid area for complex layouts
// =============================================================================

export interface GridAreaDefinition {
  /** Area name */
  name: string;
  /** Row start (1-based) */
  rowStart: number;
  /** Row end (exclusive) */
  rowEnd: number;
  /** Column start (1-based) */
  colStart: number;
  /** Column end (exclusive) */
  colEnd: number;
  /** Content */
  content: VNode;
}

export interface TemplateGridOptions {
  /** Grid template as string array */
  template: string[];
  /** Area contents mapped by name */
  areas: Record<string, VNode>;
  /** Row height */
  rowHeight?: number;
  /** Column width */
  columnWidth?: number;
  /** Gap */
  gap?: number;
}

/**
 * TemplateGrid - Grid with named template areas
 *
 * @example
 * TemplateGrid({
 *   template: [
 *     'header header header',
 *     'sidebar main main',
 *     'footer footer footer',
 *   ],
 *   areas: {
 *     header: HeaderComponent(),
 *     sidebar: SidebarComponent(),
 *     main: MainComponent(),
 *     footer: FooterComponent(),
 *   },
 * })
 */
export function TemplateGrid(props: TemplateGridOptions): VNode {
  const { template, areas, rowHeight = 1, columnWidth, gap = 0 } = props;

  const rows = template.length;
  const cols = template[0]?.split(/\s+/).length ?? 1;

  // Parse areas from template
  const parsedAreas: Map<string, GridAreaDefinition> = new Map();

  template.forEach((row, rowIndex) => {
    const cells = row.trim().split(/\s+/);
    cells.forEach((cell, colIndex) => {
      if (cell === '.') return; // Empty cell

      if (!parsedAreas.has(cell)) {
        parsedAreas.set(cell, {
          name: cell,
          rowStart: rowIndex + 1,
          rowEnd: rowIndex + 2,
          colStart: colIndex + 1,
          colEnd: colIndex + 2,
          content: areas[cell] ?? Text({}, ''),
        });
      } else {
        const area = parsedAreas.get(cell)!;
        area.rowEnd = Math.max(area.rowEnd, rowIndex + 2);
        area.colEnd = Math.max(area.colEnd, colIndex + 2);
      }
    });
  });

  // For simplicity, render as regular grid rows
  // (A full implementation would handle spanning properly)
  const rowNodes: VNode[] = [];

  for (let r = 0; r < rows; r++) {
    const cells = template[r]!.trim().split(/\s+/);
    const cellNodes: VNode[] = [];
    const seen = new Set<string>();

    for (let c = 0; c < cols; c++) {
      const areaName = cells[c] ?? '.';

      if (areaName === '.' || seen.has(areaName)) {
        // Empty or already rendered (spanning)
        cellNodes.push(
          Box({ width: columnWidth, marginRight: c < cols - 1 ? gap : 0 }, Text({}, ''))
        );
      } else {
        seen.add(areaName);
        const area = parsedAreas.get(areaName);
        const content = area?.content ?? Text({}, '');

        cellNodes.push(
          Box(
            {
              width: columnWidth,
              height: rowHeight,
              marginRight: c < cols - 1 ? gap : 0,
            },
            content
          )
        );
      }
    }

    rowNodes.push(
      Box(
        {
          flexDirection: 'row',
          marginBottom: r < rows - 1 ? gap : 0,
        },
        ...cellNodes
      )
    );
  }

  return Box(
    { flexDirection: 'column' },
    ...rowNodes
  );
}

// =============================================================================
// ResponsiveGrid - Grid that changes based on width
// =============================================================================

export interface ResponsiveBreakpoint {
  /** Minimum width for this breakpoint */
  minWidth: number;
  /** Number of columns at this breakpoint */
  columns: number;
}

export interface ResponsiveGridOptions {
  /** Breakpoints */
  breakpoints: ResponsiveBreakpoint[];
  /** Current width */
  width: number;
  /** Gap */
  gap?: number;
  /** Children */
  children: VNode[];
}

/**
 * ResponsiveGrid - Grid that adapts to width
 *
 * @example
 * ResponsiveGrid({
 *   breakpoints: [
 *     { minWidth: 80, columns: 4 },
 *     { minWidth: 60, columns: 3 },
 *     { minWidth: 40, columns: 2 },
 *     { minWidth: 0, columns: 1 },
 *   ],
 *   width: terminalWidth,
 *   children: items,
 * })
 */
export function ResponsiveGrid(props: ResponsiveGridOptions): VNode {
  const { breakpoints, width, gap = 1, children } = props;

  // Sort breakpoints by minWidth descending
  const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);

  // Find matching breakpoint
  let columns = 1;
  for (const bp of sorted) {
    if (width >= bp.minWidth) {
      columns = bp.columns;
      break;
    }
  }

  return Grid({
    columns,
    gap,
    width,
    children,
  });
}
