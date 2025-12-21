/**
 * Grid Layout System
 *
 * CSS Grid-inspired layout for terminal UIs.
 * Supports:
 * - Template-based grid definition (rows/columns)
 * - Named areas
 * - Gap control
 * - Auto-placement
 * - Span across cells
 * - Alignment (justify/align items)
 *
 * @example
 * ```typescript
 * Grid({
 *   columns: '1fr 2fr 1fr',
 *   rows: 'auto 1fr auto',
 *   gap: 1,
 *   areas: `
 *     "header header header"
 *     "nav    main   aside"
 *     "footer footer footer"
 *   `,
 * },
 *   GridItem({ area: 'header' }, Text({}, 'Header')),
 *   GridItem({ area: 'nav' }, Text({}, 'Nav')),
 *   GridItem({ area: 'main' }, Text({}, 'Main')),
 *   GridItem({ area: 'aside' }, Text({}, 'Aside')),
 *   GridItem({ area: 'footer' }, Text({}, 'Footer'))
 * )
 * ```
 */

import type { VNode, BoxStyle } from '../utils/types.js';
import { Box, Text } from '../design-system/primitives/index.js';

// =============================================================================
// Types
// =============================================================================

/** Track size specification */
export type TrackSize =
  | number // Fixed size in characters
  | `${number}fr` // Fractional unit
  | 'auto' // Content-sized
  | `minmax(${string},${string})` // Min-max range
  | 'min-content' // Minimum content size
  | 'max-content'; // Maximum content size

/** Parsed track definition */
export interface ParsedTrack {
  type: 'fixed' | 'fr' | 'auto' | 'minmax' | 'min-content' | 'max-content';
  value: number;
  min?: number;
  max?: number;
}

/** Grid template areas */
export interface GridArea {
  name: string;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
}

/** Alignment options */
export type JustifyItems = 'start' | 'end' | 'center' | 'stretch';
export type AlignItems = 'start' | 'end' | 'center' | 'stretch';
export type JustifyContent =
  | 'start'
  | 'end'
  | 'center'
  | 'stretch'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
export type AlignContent =
  | 'start'
  | 'end'
  | 'center'
  | 'stretch'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

/** Grid container options */
export interface GridOptions {
  /** Column track definition (e.g., '1fr 2fr 1fr' or [10, '1fr', 'auto']) */
  columns?: string | TrackSize[];
  /** Row track definition */
  rows?: string | TrackSize[];
  /** Gap between cells (or [rowGap, columnGap]) */
  gap?: number | [number, number];
  /** Row gap specifically */
  rowGap?: number;
  /** Column gap specifically */
  columnGap?: number;
  /** Named areas template */
  areas?: string;
  /** Auto-placement direction */
  autoFlow?: 'row' | 'column' | 'row dense' | 'column dense';
  /** Size for auto-generated rows */
  autoRows?: TrackSize;
  /** Size for auto-generated columns */
  autoColumns?: TrackSize;
  /** Justify items within cells */
  justifyItems?: JustifyItems;
  /** Align items within cells */
  alignItems?: AlignItems;
  /** Justify grid within container */
  justifyContent?: JustifyContent;
  /** Align grid within container */
  alignContent?: AlignContent;
  /** Container width (defaults to terminal width) */
  width?: number;
  /** Container height (defaults to auto) */
  height?: number;
  /** Border around grid */
  border?: boolean;
  /** Border style */
  borderStyle?: BoxStyle['borderStyle'];
  /** Border color */
  borderColor?: string;
  /** Padding inside container */
  padding?: number;
}

/** Grid item options */
export interface GridItemOptions {
  /** Named area to place in */
  area?: string;
  /** Starting column (1-based) */
  column?: number | `${number} / ${number}` | `span ${number}`;
  /** Starting row (1-based) */
  row?: number | `${number} / ${number}` | `span ${number}`;
  /** Column span */
  columnSpan?: number;
  /** Row span */
  rowSpan?: number;
  /** Column start (1-based) */
  columnStart?: number;
  /** Column end (1-based, exclusive) */
  columnEnd?: number;
  /** Row start (1-based) */
  rowStart?: number;
  /** Row end (1-based, exclusive) */
  rowEnd?: number;
  /** Override container's justifyItems for this item */
  justifySelf?: JustifyItems;
  /** Override container's alignItems for this item */
  alignSelf?: AlignItems;
  /** Order for auto-placement */
  order?: number;
}

/** Resolved cell position */
export interface CellPosition {
  row: number;
  column: number;
  rowSpan: number;
  columnSpan: number;
}

/** Grid layout result */
export interface GridLayout {
  columnSizes: number[];
  rowSizes: number[];
  cells: Map<VNode, CellPosition>;
  areas: Map<string, GridArea>;
}

// =============================================================================
// Track Parsing
// =============================================================================

/**
 * Parse a track size string into structured format
 */
export function parseTrackSize(size: TrackSize): ParsedTrack {
  if (typeof size === 'number') {
    return { type: 'fixed', value: size };
  }

  if (size === 'auto') {
    return { type: 'auto', value: 0 };
  }

  if (size === 'min-content') {
    return { type: 'min-content', value: 0 };
  }

  if (size === 'max-content') {
    return { type: 'max-content', value: 0 };
  }

  // Check for pure numeric string (fixed size)
  const numericMatch = size.match(/^(\d+(?:\.\d+)?)$/);
  if (numericMatch) {
    return { type: 'fixed', value: parseFloat(numericMatch[1]!) };
  }

  // Check for fr unit
  const frMatch = size.match(/^(\d+(?:\.\d+)?)fr$/);
  if (frMatch) {
    return { type: 'fr', value: parseFloat(frMatch[1]!) };
  }

  // Check for minmax - allow optional spaces around comma
  const minmaxMatch = size.match(/^minmax\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)$/);
  if (minmaxMatch) {
    const minTrack = parseTrackSize(minmaxMatch[1]!.trim() as TrackSize);
    const maxTrack = parseTrackSize(minmaxMatch[2]!.trim() as TrackSize);
    return {
      type: 'minmax',
      value: 0,
      min: minTrack.type === 'fixed' ? minTrack.value : 0,
      max: maxTrack.type === 'fixed' ? maxTrack.value : Infinity,
    };
  }

  // Default to auto
  return { type: 'auto', value: 0 };
}

/**
 * Parse track definition string into array
 * e.g., '1fr 2fr 1fr' -> [{ type: 'fr', value: 1 }, ...]
 */
export function parseTrackDefinition(definition: string | TrackSize[]): ParsedTrack[] {
  if (Array.isArray(definition)) {
    return definition.map(parseTrackSize);
  }

  // Handle repeat() function
  const repeatMatch = definition.match(/repeat\((\d+),\s*([^)]+)\)/);
  if (repeatMatch) {
    const count = parseInt(repeatMatch[1]!, 10);
    const trackDef = repeatMatch[2]!.trim();
    const parsed = parseTrackSize(trackDef as TrackSize);
    const result: ParsedTrack[] = [];
    for (let i = 0; i < count; i++) {
      result.push({ ...parsed });
    }
    // Replace repeat() with expansion and continue parsing
    const expanded = definition.replace(/repeat\(\d+,\s*[^)]+\)/, result.map(() => trackDef).join(' '));
    return parseTrackDefinition(expanded);
  }

  // Split by whitespace
  const parts = definition.trim().split(/\s+/);
  return parts.map((part) => parseTrackSize(part as TrackSize));
}

/**
 * Parse grid-template-areas string
 */
export function parseGridAreas(areasTemplate: string): Map<string, GridArea> {
  const areas = new Map<string, GridArea>();

  const rows = areasTemplate
    .trim()
    .split('\n')
    .map((row) =>
      row
        .trim()
        .replace(/^["']|["']$/g, '')
        .split(/\s+/)
    );

  // Track area positions
  const areaPositions = new Map<string, { minRow: number; maxRow: number; minCol: number; maxCol: number }>();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]!;
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const name = row[colIndex]!;
      if (name === '.') continue; // Empty cell

      const existing = areaPositions.get(name);
      if (existing) {
        existing.minRow = Math.min(existing.minRow, rowIndex);
        existing.maxRow = Math.max(existing.maxRow, rowIndex);
        existing.minCol = Math.min(existing.minCol, colIndex);
        existing.maxCol = Math.max(existing.maxCol, colIndex);
      } else {
        areaPositions.set(name, {
          minRow: rowIndex,
          maxRow: rowIndex,
          minCol: colIndex,
          maxCol: colIndex,
        });
      }
    }
  }

  // Convert to GridArea (1-based indices)
  for (const [name, pos] of areaPositions) {
    areas.set(name, {
      name,
      rowStart: pos.minRow + 1,
      rowEnd: pos.maxRow + 2,
      colStart: pos.minCol + 1,
      colEnd: pos.maxCol + 2,
    });
  }

  return areas;
}

// =============================================================================
// Track Size Calculation
// =============================================================================

/**
 * Calculate track sizes given available space
 */
export function calculateTrackSizes(
  tracks: ParsedTrack[],
  availableSpace: number,
  gap: number,
  contentSizes: number[]
): number[] {
  const sizes: number[] = new Array(tracks.length).fill(0);
  const totalGaps = Math.max(0, tracks.length - 1) * gap;
  let remainingSpace = availableSpace - totalGaps;
  let totalFr = 0;

  // First pass: calculate fixed and content-based sizes
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]!;
    switch (track.type) {
      case 'fixed':
        sizes[i] = track.value;
        remainingSpace -= track.value;
        break;
      case 'auto':
      case 'min-content':
      case 'max-content':
        sizes[i] = contentSizes[i] || 0;
        remainingSpace -= sizes[i]!;
        break;
      case 'minmax':
        // Start with minimum
        sizes[i] = track.min || 0;
        remainingSpace -= sizes[i]!;
        break;
      case 'fr':
        totalFr += track.value;
        break;
    }
  }

  // Second pass: distribute remaining space to fr units
  if (totalFr > 0 && remainingSpace > 0) {
    const frSize = remainingSpace / totalFr;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]!;
      if (track.type === 'fr') {
        sizes[i] = Math.floor(frSize * track.value);
      }
    }
  }

  // Third pass: handle minmax expansion
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]!;
    if (track.type === 'minmax' && track.max !== undefined) {
      const maxSize = track.max === Infinity ? availableSpace : track.max;
      // Could expand minmax tracks if there's leftover space
      // For simplicity, we'll leave them at their minimum for now
      sizes[i] = Math.min(Math.max(sizes[i]!, track.min || 0), maxSize);
    }
  }

  // Ensure no negative sizes
  return sizes.map((s) => Math.max(0, s!));
}

// =============================================================================
// Item Placement
// =============================================================================

/** Parse grid-column or grid-row shorthand */
function parseLineSpec(
  spec: number | string | undefined,
  defaultStart: number,
  trackCount: number
): { start: number; end: number } {
  if (spec === undefined) {
    return { start: defaultStart, end: defaultStart + 1 };
  }

  if (typeof spec === 'number') {
    return { start: spec, end: spec + 1 };
  }

  // Handle 'span N'
  const spanMatch = spec.match(/^span\s+(\d+)$/);
  if (spanMatch) {
    const span = parseInt(spanMatch[1]!, 10);
    return { start: defaultStart, end: defaultStart + span };
  }

  // Handle 'start / end'
  const rangeMatch = spec.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (rangeMatch) {
    return {
      start: parseInt(rangeMatch[1]!, 10),
      end: parseInt(rangeMatch[2]!, 10),
    };
  }

  // Handle 'start / span N'
  const startSpanMatch = spec.match(/^(\d+)\s*\/\s*span\s+(\d+)$/);
  if (startSpanMatch) {
    const start = parseInt(startSpanMatch[1]!, 10);
    const span = parseInt(startSpanMatch[2]!, 10);
    return { start, end: start + span };
  }

  return { start: defaultStart, end: defaultStart + 1 };
}

/**
 * Calculate cell position for a grid item
 */
export function calculateCellPosition(
  options: GridItemOptions,
  areas: Map<string, GridArea>,
  columnCount: number,
  rowCount: number,
  autoPlacement: { row: number; column: number }
): CellPosition {
  // Check for named area
  if (options.area) {
    const area = areas.get(options.area);
    if (area) {
      return {
        row: area.rowStart,
        column: area.colStart,
        rowSpan: area.rowEnd - area.rowStart,
        columnSpan: area.colEnd - area.colStart,
      };
    }
  }

  // Parse column spec
  const colSpec = parseLineSpec(
    options.column ?? options.columnStart,
    autoPlacement.column,
    columnCount
  );
  if (options.columnEnd !== undefined) {
    colSpec.end = options.columnEnd;
  }
  if (options.columnSpan !== undefined) {
    colSpec.end = colSpec.start + options.columnSpan;
  }

  // Parse row spec
  const rowSpec = parseLineSpec(options.row ?? options.rowStart, autoPlacement.row, rowCount);
  if (options.rowEnd !== undefined) {
    rowSpec.end = options.rowEnd;
  }
  if (options.rowSpan !== undefined) {
    rowSpec.end = rowSpec.start + options.rowSpan;
  }

  return {
    row: rowSpec.start,
    column: colSpec.start,
    rowSpan: rowSpec.end - rowSpec.start,
    columnSpan: colSpec.end - colSpec.start,
  };
}

// =============================================================================
// Grid Layout Calculation
// =============================================================================

/**
 * Calculate complete grid layout
 */
export function calculateGridLayout(
  options: GridOptions,
  items: { node: VNode; options: GridItemOptions }[],
  containerWidth: number,
  containerHeight?: number
): GridLayout {
  // Parse column and row definitions
  const columns = options.columns
    ? parseTrackDefinition(options.columns)
    : [{ type: 'fr' as const, value: 1 }];

  const rows: ParsedTrack[] = options.rows
    ? parseTrackDefinition(options.rows)
    : items.map(() => ({ type: 'auto' as const, value: 0 }));

  // Parse areas
  const areas = options.areas ? parseGridAreas(options.areas) : new Map<string, GridArea>();

  // Calculate gaps
  let rowGap = options.rowGap ?? 0;
  let columnGap = options.columnGap ?? 0;
  if (options.gap !== undefined) {
    if (Array.isArray(options.gap)) {
      [rowGap, columnGap] = options.gap;
    } else {
      rowGap = columnGap = options.gap;
    }
  }

  // Adjust for border/padding
  const borderOffset = options.border ? 2 : 0;
  const paddingOffset = (options.padding ?? 0) * 2;
  const effectiveWidth = containerWidth - borderOffset - paddingOffset;

  // Calculate column sizes (content sizes not yet known, use 0)
  const contentColSizes = new Array(columns.length).fill(0);
  const columnSizes = calculateTrackSizes(columns, effectiveWidth, columnGap, contentColSizes);

  // Auto-placement cursor
  const autoPlacement = { row: 1, column: 1 };
  const isDense = options.autoFlow?.includes('dense') ?? false;
  const isColumnFlow = options.autoFlow?.includes('column') ?? false;

  // Track occupied cells
  const occupied = new Set<string>();

  // Place items
  const cells = new Map<VNode, CellPosition>();

  // Sort by order if specified
  const sortedItems = [...items].sort((a, b) => (a.options.order ?? 0) - (b.options.order ?? 0));

  // First pass: place explicitly positioned items
  for (const item of sortedItems) {
    if (
      item.options.area ||
      item.options.column !== undefined ||
      item.options.row !== undefined ||
      item.options.columnStart !== undefined ||
      item.options.rowStart !== undefined
    ) {
      const position = calculateCellPosition(
        item.options,
        areas,
        columns.length,
        rows.length,
        autoPlacement
      );

      cells.set(item.node, position);

      // Mark cells as occupied
      for (let r = position.row; r < position.row + position.rowSpan; r++) {
        for (let c = position.column; c < position.column + position.columnSpan; c++) {
          occupied.add(`${r},${c}`);
        }
      }
    }
  }

  // Second pass: auto-place remaining items
  for (const item of sortedItems) {
    if (cells.has(item.node)) continue;

    // Find next available position
    if (isDense) {
      // Dense: start from beginning each time
      autoPlacement.row = 1;
      autoPlacement.column = 1;
    }

    // Find first available cell
    let placed = false;
    const maxRows = Math.max(rows.length, 100); // Limit search
    const maxCols = columns.length;

    outer: for (let r = autoPlacement.row; r <= maxRows && !placed; r++) {
      const startCol = r === autoPlacement.row ? autoPlacement.column : 1;
      for (let c = startCol; c <= maxCols && !placed; c++) {
        if (!occupied.has(`${r},${c}`)) {
          cells.set(item.node, {
            row: r,
            column: c,
            rowSpan: 1,
            columnSpan: 1,
          });
          occupied.add(`${r},${c}`);

          // Update cursor
          if (isColumnFlow) {
            autoPlacement.row = r + 1;
            if (autoPlacement.row > maxRows) {
              autoPlacement.row = 1;
              autoPlacement.column = c + 1;
            }
          } else {
            autoPlacement.column = c + 1;
            if (autoPlacement.column > maxCols) {
              autoPlacement.column = 1;
              autoPlacement.row = r + 1;
            }
          }
          placed = true;
          break outer;
        }
      }
    }
  }

  // Determine actual row count
  let maxRow = rows.length;
  for (const pos of cells.values()) {
    maxRow = Math.max(maxRow, pos.row + pos.rowSpan - 1);
  }

  // Extend rows array if needed
  const autoRowTrack = options.autoRows
    ? parseTrackSize(options.autoRows)
    : { type: 'auto' as const, value: 0 };

  while (rows.length < maxRow) {
    rows.push({ ...autoRowTrack });
  }

  // Calculate row sizes
  const contentRowSizes = new Array(rows.length).fill(1); // Default to 1 for now
  const effectiveHeight = containerHeight ? containerHeight - borderOffset - paddingOffset : 100;
  const rowSizes = calculateTrackSizes(rows, effectiveHeight, rowGap, contentRowSizes);

  return {
    columnSizes,
    rowSizes,
    cells,
    areas,
  };
}

// =============================================================================
// Grid Components
// =============================================================================

/** Grid item data attached to nodes */
const gridItemData = new WeakMap<VNode, GridItemOptions>();

/**
 * Grid container component
 */
export function Grid(options: GridOptions, ...children: (VNode | null)[]): VNode {
  const validChildren = children.filter((c): c is VNode => c !== null);

  // Extract item options
  const items = validChildren.map((node) => ({
    node,
    options: gridItemData.get(node) || {},
  }));

  // Calculate layout
  const containerWidth = options.width ?? 80;
  const layout = calculateGridLayout(options, items, containerWidth, options.height);

  // Calculate gaps
  let rowGap = options.rowGap ?? 0;
  let columnGap = options.columnGap ?? 0;
  if (options.gap !== undefined) {
    if (Array.isArray(options.gap)) {
      [rowGap, columnGap] = options.gap;
    } else {
      rowGap = columnGap = options.gap;
    }
  }

  // Build positioned children
  const rows: VNode[] = [];

  // Group items by row
  const itemsByRow = new Map<number, { node: VNode; position: CellPosition }[]>();
  for (const [node, position] of layout.cells) {
    for (let r = position.row; r < position.row + position.rowSpan; r++) {
      if (!itemsByRow.has(r)) {
        itemsByRow.set(r, []);
      }
      // Only add to first row of span
      if (r === position.row) {
        itemsByRow.get(r)!.push({ node, position });
      }
    }
  }

  // Create rows
  const rowIndices = [...itemsByRow.keys()].sort((a, b) => a - b);
  for (let i = 0; i < rowIndices.length; i++) {
    const rowIndex = rowIndices[i]!;
    const rowItems = itemsByRow.get(rowIndex) || [];
    const rowHeight = layout.rowSizes[rowIndex - 1] || 1;

    // Sort items by column
    rowItems.sort((a, b) => a.position.column - b.position.column);

    // Create cells for this row
    const cells: VNode[] = [];
    let currentCol = 1;

    for (const { node, position } of rowItems) {
      const itemOptions = gridItemData.get(node) || {};

      // Add spacer for gap before this cell
      if (position.column > currentCol) {
        const gapCols = position.column - currentCol;
        let spacerWidth = 0;
        for (let c = currentCol; c < position.column; c++) {
          spacerWidth += layout.columnSizes[c - 1] || 0;
          if (c > currentCol) spacerWidth += columnGap;
        }
        if (spacerWidth > 0) {
          cells.push(Box({ width: spacerWidth }));
        }
      }

      // Calculate cell width
      let cellWidth = 0;
      for (let c = position.column; c < position.column + position.columnSpan; c++) {
        cellWidth += layout.columnSizes[c - 1] || 0;
        if (c > position.column) cellWidth += columnGap;
      }

      // Calculate cell height
      let cellHeight = 0;
      for (let r = position.row; r < position.row + position.rowSpan; r++) {
        cellHeight += layout.rowSizes[r - 1] || 0;
        if (r > position.row) cellHeight += rowGap;
      }

      // Apply alignment
      const justifySelf = itemOptions.justifySelf ?? options.justifyItems ?? 'stretch';
      const alignSelf = itemOptions.alignSelf ?? options.alignItems ?? 'stretch';

      let justifyContent: BoxStyle['justifyContent'];
      let alignItems: BoxStyle['alignItems'];

      switch (justifySelf) {
        case 'start':
          justifyContent = 'flex-start';
          break;
        case 'end':
          justifyContent = 'flex-end';
          break;
        case 'center':
          justifyContent = 'center';
          break;
        case 'stretch':
        default:
          justifyContent = 'flex-start';
          break;
      }

      switch (alignSelf) {
        case 'start':
          alignItems = 'flex-start';
          break;
        case 'end':
          alignItems = 'flex-end';
          break;
        case 'center':
          alignItems = 'center';
          break;
        case 'stretch':
        default:
          alignItems = 'flex-start';
          break;
      }

      cells.push(
        Box(
          {
            width: cellWidth,
            height: cellHeight,
            justifyContent,
            alignItems,
          },
          node
        )
      );

      currentCol = position.column + position.columnSpan;
    }

    // Add row gap if not first row
    if (i > 0 && rowGap > 0) {
      rows.push(Box({ height: rowGap }));
    }

    rows.push(
      Box(
        {
          flexDirection: 'row',
          height: rowHeight,
        },
        ...cells
      )
    );
  }

  // Wrap in container
  const containerStyle: BoxStyle = {
    flexDirection: 'column',
    width: options.width,
    height: options.height,
    padding: options.padding,
  };

  if (options.border) {
    containerStyle.borderStyle = options.borderStyle ?? 'single';
    containerStyle.borderColor = options.borderColor;
  }

  return Box(containerStyle, ...rows);
}

/**
 * Grid item wrapper
 */
export function GridItem(options: GridItemOptions, ...children: (VNode | null)[]): VNode {
  const node = Box({}, ...children.filter((c): c is VNode => c !== null));
  gridItemData.set(node, options);
  return node;
}

// =============================================================================
// Convenience Components
// =============================================================================

/**
 * Simple row grid (equal columns)
 */
export function GridRow(
  options: Omit<GridOptions, 'columns' | 'rows'> & { columnCount?: number },
  ...children: (VNode | null)[]
): VNode {
  const validChildren = children.filter((c): c is VNode => c !== null);
  const columnCount = options.columnCount ?? validChildren.length;
  const columns = Array(columnCount).fill('1fr').join(' ');

  return Grid({ ...options, columns }, ...validChildren);
}

/**
 * Simple column grid (equal rows)
 */
export function GridColumn(
  options: Omit<GridOptions, 'columns' | 'rows'> & { rowCount?: number },
  ...children: (VNode | null)[]
): VNode {
  const validChildren = children.filter((c): c is VNode => c !== null);
  const rowCount = options.rowCount ?? validChildren.length;
  const rows = Array(rowCount).fill('1fr').join(' ');

  return Grid({ ...options, columns: '1fr', rows }, ...validChildren);
}

/**
 * Auto-fitting grid (responsive columns)
 */
export function AutoGrid(
  options: Omit<GridOptions, 'columns'> & { minColumnWidth: number },
  ...children: (VNode | null)[]
): VNode {
  const containerWidth = options.width ?? 80;
  const gap = typeof options.gap === 'number' ? options.gap : options.gap?.[1] ?? 0;
  const columnCount = Math.floor((containerWidth + gap) / (options.minColumnWidth + gap));
  const columns = Array(Math.max(1, columnCount)).fill('1fr').join(' ');

  return Grid({ ...options, columns }, ...children);
}

/**
 * Dashboard-style grid with named areas
 */
export function DashboardGrid(
  options: {
    width?: number;
    height?: number;
    gap?: number;
    headerHeight?: number;
    footerHeight?: number;
    sidebarWidth?: number;
    border?: boolean;
    borderStyle?: BoxStyle['borderStyle'];
    borderColor?: string;
  },
  areas: {
    header?: VNode;
    sidebar?: VNode;
    main: VNode;
    footer?: VNode;
  }
): VNode {
  const {
    width = 80,
    height,
    gap = 0,
    headerHeight = 3,
    footerHeight = 1,
    sidebarWidth = 20,
    border,
    borderStyle,
    borderColor,
  } = options;

  const hasHeader = areas.header !== undefined;
  const hasSidebar = areas.sidebar !== undefined;
  const hasFooter = areas.footer !== undefined;

  // Build columns
  const columns = hasSidebar ? `${sidebarWidth} 1fr` : '1fr';

  // Build rows
  const rowParts: string[] = [];
  if (hasHeader) rowParts.push(`${headerHeight}`);
  rowParts.push('1fr');
  if (hasFooter) rowParts.push(`${footerHeight}`);
  const rows = rowParts.join(' ');

  // Build areas template
  const areaRows: string[] = [];
  if (hasHeader) {
    areaRows.push(hasSidebar ? '"header header"' : '"header"');
  }
  areaRows.push(hasSidebar ? '"sidebar main"' : '"main"');
  if (hasFooter) {
    areaRows.push(hasSidebar ? '"footer footer"' : '"footer"');
  }
  const areasTemplate = areaRows.join('\n');

  const children: VNode[] = [];

  if (areas.header) {
    children.push(GridItem({ area: 'header' }, areas.header));
  }
  if (areas.sidebar) {
    children.push(GridItem({ area: 'sidebar' }, areas.sidebar));
  }
  children.push(GridItem({ area: 'main' }, areas.main));
  if (areas.footer) {
    children.push(GridItem({ area: 'footer' }, areas.footer));
  }

  return Grid(
    {
      width,
      height,
      columns,
      rows,
      areas: areasTemplate,
      gap,
      border,
      borderStyle,
      borderColor,
    },
    ...children
  );
}

/**
 * Masonry-style grid (variable height items)
 */
export function MasonryGrid(
  options: {
    columns: number;
    gap?: number;
    width?: number;
  },
  ...children: (VNode | null)[]
): VNode {
  const validChildren = children.filter((c): c is VNode => c !== null);
  const { columns: columnCount, gap = 0, width = 80 } = options;

  // Track column heights
  const columnHeights = new Array(columnCount).fill(0);

  // Place items in shortest column
  const placedItems: { node: VNode; column: number }[] = [];

  for (const child of validChildren) {
    // Find shortest column
    let shortestCol = 0;
    let shortestHeight = columnHeights[0]!;
    for (let i = 1; i < columnCount; i++) {
      if (columnHeights[i]! < shortestHeight) {
        shortestHeight = columnHeights[i]!;
        shortestCol = i;
      }
    }

    placedItems.push({ node: child, column: shortestCol });
    columnHeights[shortestCol]! += 1; // Assume height 1 for simplicity
  }

  // Build column containers
  const columnNodes: VNode[] = [];
  const columnWidth = Math.floor((width - (columnCount - 1) * gap) / columnCount);

  for (let col = 0; col < columnCount; col++) {
    const columnItems = placedItems.filter((item) => item.column === col).map((item) => item.node);

    columnNodes.push(
      Box(
        {
          flexDirection: 'column',
          width: columnWidth,
          gap,
        },
        ...columnItems
      )
    );
  }

  return Box(
    {
      flexDirection: 'row',
      gap,
      width,
    },
    ...columnNodes
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a repeat track definition
 */
export function repeat(count: number, track: TrackSize): string {
  if (typeof track === 'number') {
    return Array(count).fill(`${track}`).join(' ');
  }
  return Array(count).fill(track).join(' ');
}

/**
 * Create a minmax track
 */
export function minmax(min: TrackSize, max: TrackSize): `minmax(${string},${string})` {
  const minStr = typeof min === 'number' ? `${min}` : min;
  const maxStr = typeof max === 'number' ? `${max}` : max;
  return `minmax(${minStr},${maxStr})`;
}

/**
 * Calculate grid template from areas
 */
export function gridAreasToTemplate(areas: string[][]): string {
  return areas.map((row) => `"${row.join(' ')}"`).join('\n');
}
