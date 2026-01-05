/**
 * Reck Layout Engine - Simplified flexbox for terminals
 *
 * ~300 lines of TypeScript handling 90% of terminal UI needs
 */

import type { VNode, BoxStyle, LayoutNode, RenderContext } from '../utils/types.js';
import { stringWidth, stripAnsi } from '../utils/text-utils.js';

/**
 * Text measurement cache
 * Caches text dimensions to avoid recalculating for the same text
 */
const textMeasureCache = new Map<string, { width: number; height: number }>();
const TEXT_CACHE_MAX_SIZE = 1000;
const resolveMarginValue = (value: number | 'auto' | undefined): number =>
  value === 'auto' ? 0 : (value ?? 0);

/**
 * Clear the text measurement cache
 * Call this when you want to free memory or reset measurements
 */
export function clearTextMeasureCache(): void {
  textMeasureCache.clear();
}

/**
 * Calculate layout for a VNode tree
 */
export function calculateLayout(
  node: VNode,
  availableWidth: number,
  availableHeight: number = Infinity
): LayoutNode {
  return layoutNode(node, { x: 0, y: 0, width: availableWidth, height: availableHeight });
}

/**
 * Layout a single node and its children
 */
function layoutNode(node: VNode, ctx: RenderContext): LayoutNode {
  const style = node.props as BoxStyle;

  // Handle display: 'none' - return zero-sized layout
  if (style.display === 'none') {
    return {
      x: ctx.x,
      y: ctx.y,
      width: 0,
      height: 0,
      node,
      children: [],
    };
  }

  // Calculate padding
  const paddingTop = style.paddingTop ?? style.paddingY ?? style.padding ?? 0;
  const paddingBottom = style.paddingBottom ?? style.paddingY ?? style.padding ?? 0;
  const paddingLeft = style.paddingLeft ?? style.paddingX ?? style.padding ?? 0;
  const paddingRight = style.paddingRight ?? style.paddingX ?? style.padding ?? 0;

  // Calculate margin (handle 'auto' as 0 for now, centering would need parent context)
  // IMPORTANT: Resolve shorthand FIRST with ??, THEN handle 'auto' conversion
  // This fixes the bug where resolveMargin(undefined) returns 0, breaking the ?? chain
  const marginTop = resolveMarginValue(style.marginTop ?? style.marginY ?? style.margin);
  const marginBottom = resolveMarginValue(style.marginBottom ?? style.marginY ?? style.margin);
  const marginLeft = resolveMarginValue(style.marginLeft ?? style.marginX ?? style.margin);
  const marginRight = resolveMarginValue(style.marginRight ?? style.marginX ?? style.margin);

  // Border takes 1 char each side if present
  const borderSize = style.borderStyle && style.borderStyle !== 'none' ? 1 : 0;

  // Available space for content (use ctx.width/height when no explicit size set)
  const explicitWidth = resolveSize(style.width, ctx.width);
  const explicitHeight = resolveSize(style.height, ctx.height);
  const contentWidth = (explicitWidth || ctx.width) - paddingLeft - paddingRight - borderSize * 2;
  const contentHeight = (explicitHeight || ctx.height) - paddingTop - paddingBottom - borderSize * 2;

  // Layout children
  const childLayouts: LayoutNode[] = [];
  const direction = style.flexDirection ?? 'column';
  const isRow = direction === 'row' || direction === 'row-reverse';
  const isReverse = direction === 'row-reverse' || direction === 'column-reverse';

  // Use columnGap/rowGap if specified, otherwise fall back to gap
  const currentGap = isRow
    ? (style.columnGap ?? style.gap ?? 0)
    : (style.rowGap ?? style.gap ?? 0);

  if (node.type === 'text' || node.type === 'spacer' || node.type === 'newline') {
    // Leaf nodes - no children to layout
  } else if (node.children.length > 0) {
    // Get children, reversing order if needed
    const orderedChildren = isReverse ? [...node.children].reverse() : node.children;

    const hasExplicitHeight = style.height !== undefined && style.height !== 'auto';

    if (isRow) {
      childLayouts.push(...layoutRow(orderedChildren, contentWidth, contentHeight, currentGap, style, hasExplicitHeight));
    } else {
      childLayouts.push(...layoutColumn(orderedChildren, contentWidth, contentHeight, currentGap, style));
    }
  }

  // Calculate total content size from children
  let totalWidth = 0;
  let totalHeight = 0;

  if (isRow) {
    for (const child of childLayouts) {
      const childStyle = child.node.props as BoxStyle;
      const childMarginLeft = resolveMarginValue(childStyle.marginLeft ?? childStyle.marginX ?? childStyle.margin);
      const childMarginRight = resolveMarginValue(childStyle.marginRight ?? childStyle.marginX ?? childStyle.margin);
      totalWidth += child.width + childMarginLeft + childMarginRight;
      totalHeight = Math.max(totalHeight, child.height);
    }
    totalWidth += currentGap * Math.max(0, childLayouts.length - 1);
  } else {
    // For column layout, use the maximum extent (y + height) of children
    // This correctly accounts for child margins which offset their y position
    for (const child of childLayouts) {
      const childStyle = child.node.props as BoxStyle;
      const childMarginBottom = resolveMarginValue(childStyle.marginBottom ?? childStyle.marginY ?? childStyle.margin);
      totalWidth = Math.max(totalWidth, child.width);
      totalHeight = Math.max(totalHeight, child.y + child.height + childMarginBottom);
    }
    // Gap is already handled by layoutColumn which adds it to child.y positions
  }

  // Handle text node sizing
  if (node.type === 'text') {
    const text = String(node.props.children ?? '');
    const lines = text.split('\n');
    totalWidth = Math.max(...lines.map(l => stringWidth(l)));
    totalHeight = lines.length;
  }

  // Handle spacer - takes all available space
  if (node.type === 'spacer') {
    totalWidth = ctx.width;
    totalHeight = 1;
  }

  // Handle newline
  if (node.type === 'newline') {
    totalWidth = 0;
    totalHeight = node.props.count ?? 1;
  }

  // Check if element should fill available space
  const flexGrow = style.flexGrow ?? 0;
  const shouldFillWidth = flexGrow > 0 || style.width === 'fill';

  // Final size
  // If flexGrow > 0, use context width (fill available space)
  // Otherwise, use content width
  const contentBasedWidth = totalWidth + paddingLeft + paddingRight + borderSize * 2;
  const width = explicitWidth || (shouldFillWidth ? ctx.width : contentBasedWidth);
  const height = explicitHeight || (totalHeight + paddingTop + paddingBottom + borderSize * 2);

  const layout = {
    x: ctx.x + marginLeft,
    y: ctx.y + marginTop,
    width: Math.min(width, ctx.width - marginLeft - marginRight),
    height: Math.min(height, ctx.height - marginTop - marginBottom),
    node,
    children: childLayouts,
  };

  const layoutRef = style.layoutRef as { __update?: (rect: { x: number; y: number; width: number; height: number }) => void } | undefined;
  layoutRef?.__update?.({ x: layout.x, y: layout.y, width: layout.width, height: layout.height });

  return layout;
}

/**
 * Layout children in a row (horizontal)
 */
function layoutRow(
  children: VNode[],
  width: number,
  height: number,
  gap: number,
  parentStyle: BoxStyle,
  hasExplicitHeight: boolean
): LayoutNode[] {
  const results: LayoutNode[] = [];

  // First pass: calculate fixed sizes and count flexible children
  let fixedWidth = 0;
  let flexTotal = 0;
  const childInfos: { node: VNode; flex: number; minWidth: number; marginLeft: number; marginRight: number }[] = [];

  for (const child of children) {
    const style = child.props as BoxStyle;
    let flex = style.flexGrow;
    if (flex === undefined) {
      flex = style.width === 'fill' ? 1 : (child.type === 'spacer' ? 1 : 0);
    }
    const minWidth = style.minWidth ?? 0;
    const marginLeft = resolveMarginValue(style.marginLeft ?? style.marginX ?? style.margin);
    const marginRight = resolveMarginValue(style.marginRight ?? style.marginX ?? style.margin);

    if (flex > 0) {
      flexTotal += flex;
      fixedWidth += marginLeft + marginRight;
      childInfos.push({ node: child, flex, minWidth, marginLeft, marginRight });
    } else {
      // Fixed width child - layout to get its natural size
      const layout = layoutNode(child, { x: 0, y: 0, width, height });
      fixedWidth += layout.width + marginLeft + marginRight;
      childInfos.push({ node: child, flex: 0, minWidth: layout.width, marginLeft, marginRight });
    }
  }

  // Add gaps to fixed width
  fixedWidth += gap * Math.max(0, children.length - 1);

  // Calculate flexible space
  const flexSpace = Math.max(0, width - fixedWidth);
  const flexUnit = flexTotal > 0 ? flexSpace / flexTotal : 0;

  // Second pass: layout with final sizes
  let x = 0;
  const justifyContent = parentStyle.justifyContent ?? 'flex-start';
  const usedWidth = fixedWidth + (flexTotal > 0 ? flexSpace : 0);
  const remainingSpace = width - usedWidth;

  // Calculate spacing for space-between, space-around, space-evenly
  let spaceBetween = 0;
  let spaceAround = 0;

  if (flexTotal === 0 && childInfos.length > 0) {
    if (justifyContent === 'space-between' && childInfos.length > 1) {
      spaceBetween = remainingSpace / (childInfos.length - 1);
    } else if (justifyContent === 'space-around') {
      spaceAround = remainingSpace / (childInfos.length * 2);
      x = spaceAround;
    } else if (justifyContent === 'space-evenly') {
      spaceBetween = remainingSpace / (childInfos.length + 1);
      x = spaceBetween;
    } else if (justifyContent === 'flex-end') {
      x = remainingSpace;
    } else if (justifyContent === 'center') {
      x = remainingSpace / 2;
    }
  }

  let rowHeight = 0;
  const pendingLayouts: { layout: LayoutNode; style: BoxStyle }[] = [];

  for (let i = 0; i < childInfos.length; i++) {
    const info = childInfos[i];
    const childWidth = info.flex > 0 ? Math.floor(flexUnit * info.flex) : info.minWidth;
    const allocatedWidth = childWidth + info.marginLeft + info.marginRight;
    const layout = layoutNode(info.node, { x, y: 0, width: allocatedWidth, height });

    const childStyle = info.node.props as BoxStyle;
    rowHeight = Math.max(rowHeight, layout.height);
    pendingLayouts.push({ layout, style: childStyle });

    // Calculate next x position
    x += info.marginLeft + layout.width + info.marginRight;
    if (justifyContent === 'space-between' && i < childInfos.length - 1) {
      x += spaceBetween;
    } else if (justifyContent === 'space-around') {
      x += spaceAround * 2;
    } else if (justifyContent === 'space-evenly') {
      x += spaceBetween;
    } else {
      x += gap;
    }
  }

  const alignHeight = hasExplicitHeight ? height : rowHeight;

  for (const entry of pendingLayouts) {
    const { layout, style } = entry;
    const alignSelf = style.alignSelf;
    const alignItems = alignSelf !== 'auto' && alignSelf ? alignSelf : (parentStyle.alignItems ?? 'flex-start');

    if (alignItems === 'stretch') {
      if (style.height === undefined) {
        layout.height = Math.max(layout.height, alignHeight);
      }
      layout.y = 0;
    } else if (alignItems === 'center') {
      layout.y = Math.floor((alignHeight - layout.height) / 2);
    } else if (alignItems === 'flex-end') {
      layout.y = alignHeight - layout.height;
    } else if (alignItems === 'baseline') {
      // For baseline, align to top (simplified - true baseline needs font metrics)
      layout.y = 0;
    }

    results.push(layout);
  }

  return results;
}

/**
 * Layout children in a column (vertical)
 */
function layoutColumn(
  children: VNode[],
  width: number,
  height: number,
  gap: number,
  parentStyle: BoxStyle
): LayoutNode[] {
  const results: LayoutNode[] = [];
  const hasExplicitHeight = parentStyle.height !== undefined && parentStyle.height !== 'auto';

  if (hasExplicitHeight) {
    let fixedHeight = 0;
    let flexTotal = 0;
    const childInfos: {
      node: VNode;
      flex: number;
      minHeight: number;
      maxHeight?: number;
      marginTop: number;
      marginBottom: number;
      layout?: LayoutNode;
    }[] = [];

    for (const child of children) {
      const childStyle = child.props as BoxStyle;
      const marginTop = resolveMarginValue(childStyle.marginTop ?? childStyle.marginY ?? childStyle.margin);
      const marginBottom = resolveMarginValue(childStyle.marginBottom ?? childStyle.marginY ?? childStyle.margin);
      let flex = childStyle.flexGrow;
      if (flex === undefined) {
        flex = childStyle.height === 'fill' ? 1 : (child.type === 'spacer' ? 1 : 0);
      }
      const minHeight = childStyle.minHeight ?? 0;
      const maxHeight = childStyle.maxHeight;

      if (flex > 0) {
        flexTotal += flex;
        fixedHeight += marginTop + marginBottom;
        childInfos.push({ node: child, flex, minHeight, maxHeight, marginTop, marginBottom });
      } else {
        const layout = layoutNode(child, { x: 0, y: 0, width, height });
        fixedHeight += layout.height + marginTop + marginBottom;
        childInfos.push({ node: child, flex: 0, minHeight, maxHeight, marginTop, marginBottom, layout });
      }
    }

    fixedHeight += gap * Math.max(0, children.length - 1);

    if (flexTotal > 0) {
      const availableHeight = Math.max(0, height - fixedHeight);
      const flexUnit = availableHeight / flexTotal;
      let y = 0;

      for (let i = 0; i < childInfos.length; i++) {
        const info = childInfos[i];
        const childStyle = info.node.props as BoxStyle;
        const alignSelf = childStyle.alignSelf;
        const alignItems = alignSelf !== 'auto' && alignSelf ? alignSelf : (parentStyle.alignItems ?? 'flex-start');

        let layout = info.layout;
        if (info.flex > 0) {
          let allocatedHeight = Math.floor(flexUnit * info.flex);
          allocatedHeight = Math.max(info.minHeight, allocatedHeight);
          if (info.maxHeight !== undefined) {
            allocatedHeight = Math.min(info.maxHeight, allocatedHeight);
          }

          layout = layoutNode(info.node, { x: 0, y, width, height: allocatedHeight });
          layout.height = allocatedHeight;
        }

        if (!layout) {
          layout = layoutNode(info.node, { x: 0, y, width, height });
        }

        if (alignItems === 'center') {
          layout.x = Math.floor((width - layout.width) / 2);
        } else if (alignItems === 'flex-end') {
          layout.x = width - layout.width;
        } else if (alignItems === 'stretch') {
          layout.width = width;
        }

        results.push(layout);

        y += info.marginTop + layout.height + info.marginBottom;
        if (i < childInfos.length - 1) {
          y += gap;
        }
      }

      return results;
    }
  }

  let y = 0;

  // First pass: layout all children normally
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childStyle = child.props as BoxStyle;
    const marginTop = resolveMarginValue(childStyle.marginTop ?? childStyle.marginY ?? childStyle.margin);
    const marginBottom = resolveMarginValue(childStyle.marginBottom ?? childStyle.marginY ?? childStyle.margin);
    const layout = layoutNode(child, { x: 0, y, width, height: height - y });

    // Adjust x based on alignItems (or alignSelf if set on child)
    const alignSelf = childStyle.alignSelf;
    const alignItems = alignSelf !== 'auto' && alignSelf ? alignSelf : (parentStyle.alignItems ?? 'flex-start');

    if (alignItems === 'center') {
      layout.x = Math.floor((width - layout.width) / 2);
    } else if (alignItems === 'flex-end') {
      layout.x = width - layout.width;
    } else if (alignItems === 'stretch') {
      layout.width = width;
    }

    results.push(layout);

    // Add child's height plus its marginBottom to position next sibling correctly
    y += marginTop + layout.height + marginBottom;

    if (i < children.length - 1) {
      y += gap;
    }
  }

  // Calculate total content height
  const contentHeight = y;
  const effectiveHeight = parentStyle.height !== undefined ? height : contentHeight;
  const remainingSpace = Math.max(0, effectiveHeight - contentHeight);

  // Apply justifyContent by offsetting all results
  const justifyContent = parentStyle.justifyContent ?? 'flex-start';

  if (remainingSpace > 0 && results.length > 0) {
    let offset = 0;

    if (justifyContent === 'flex-end') {
      offset = remainingSpace;
    } else if (justifyContent === 'center') {
      offset = Math.floor(remainingSpace / 2);
    } else if (justifyContent === 'space-between' && results.length > 1) {
      const spaceBetween = remainingSpace / (results.length - 1);
      for (let i = 0; i < results.length; i++) {
        results[i].y += Math.floor(spaceBetween * i);
      }
      return results;
    } else if (justifyContent === 'space-around') {
      const spaceAround = remainingSpace / (results.length * 2);
      for (let i = 0; i < results.length; i++) {
        results[i].y += Math.floor(spaceAround * (2 * i + 1));
      }
      return results;
    } else if (justifyContent === 'space-evenly') {
      const spaceEvenly = remainingSpace / (results.length + 1);
      for (let i = 0; i < results.length; i++) {
        results[i].y += Math.floor(spaceEvenly * (i + 1));
      }
      return results;
    }

    // Apply simple offset for flex-end and center
    if (offset > 0) {
      for (const layout of results) {
        layout.y += offset;
      }
    }
  }

  return results;
}

/**
 * Resolve a size value (number, percentage, or undefined)
 */
function resolveSize(size: number | string | undefined, available: number): number {
  if (size === undefined) return 0;
  if (size === 'auto') return 0;
  if (size === 'fill') return available;
  if (typeof size === 'number') return size;
  if (size.endsWith('%')) {
    return Math.floor((parseFloat(size) / 100) * available);
  }
  return parseInt(size, 10) || 0;
}

/**
 * Get visible width of text (accounting for ANSI codes and wide chars)
 */
export function getVisibleWidth(text: string): number {
  return stringWidth(text);
}

/**
 * Measure text dimensions (with caching for performance)
 *
 * @param text - The text to measure (may contain ANSI codes)
 * @returns Object with width (max line length) and height (line count)
 */
export function measureText(text: string): { width: number; height: number } {
  // Check cache first
  const cached = textMeasureCache.get(text);
  if (cached) {
    return cached;
  }

  // Calculate dimensions
  const lines = text.split('\n');
  const result = {
    width: Math.max(0, ...lines.map(l => stringWidth(l))),
    height: lines.length,
  };

  // Store in cache (with size limit to prevent memory issues)
  if (textMeasureCache.size >= TEXT_CACHE_MAX_SIZE) {
    // Remove oldest entry (first key in Map iteration order)
    const firstKey = textMeasureCache.keys().next().value;
    if (firstKey !== undefined) {
      textMeasureCache.delete(firstKey);
    }
  }
  textMeasureCache.set(text, result);

  return result;
}
