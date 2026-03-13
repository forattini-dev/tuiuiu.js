/**
 * Tuiuiu Layout Engine - Simplified flexbox for terminals
 *
 * ~300 lines of TypeScript handling 90% of terminal UI needs
 */

import type { VNode, BoxStyle, LayoutNode, RenderContext } from '../utils/types.js';
import { stringWidth } from '../utils/text-utils.js';
import { fingerprintValue } from './structural-fingerprint.js';
import {
  DirtyFlags,
  beginDirtyFrame,
  canReuseSubtree,
  markLayoutClean,
  markDirty,
  noteDirtyFresh,
  noteDirtyReuse,
  registerDirtyNode,
} from './dirty.js';

/**
 * Text measurement cache
 * Caches text dimensions to avoid recalculating for the same text
 */
const textMeasureCache = new Map<string, { width: number; height: number }>();
const TEXT_CACHE_MAX_SIZE = 1000;

interface LayoutCacheEntry {
  ctxKey: string;
  propsKey: string;
  childRefs: VNode[];
  layout: LayoutNode;
}

let layoutReuseCache = new WeakMap<VNode, LayoutCacheEntry>();

const resolveMarginValue = (value: number | 'auto' | undefined): number =>
  value === 'auto' ? 0 : (value ?? 0);

const LAYOUT_REF_KEYS = new Set(['layoutRef', '__scrollQuery']);
const BOX_LAYOUT_KEYS = new Set([
  'display',
  'position',
  'flexDirection',
  'flexWrap',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'flex',
  'justifyContent',
  'alignItems',
  'alignSelf',
  'alignContent',
  'padding',
  'paddingX',
  'paddingY',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'margin',
  'marginX',
  'marginY',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'gap',
  'columnGap',
  'rowGap',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'top',
  'bottom',
  'left',
  'right',
  'borderStyle',
  'borderTop',
  'borderBottom',
  'borderLeft',
  'borderRight',
  'overflow',
  'overflowX',
  'overflowY',
]);
const TEXT_LAYOUT_KEYS = new Set([
  'children',
  'wrap',
]);

function clearLayoutReuseCache(): void {
  layoutReuseCache = new WeakMap<VNode, LayoutCacheEntry>();
}

function createContextKey(ctx: RenderContext): string {
  return `${ctx.x}:${ctx.y}:${ctx.width}:${ctx.height}`;
}

function createLayoutPropsKey(node: VNode): string {
  const props = node.props ?? {};
  const sourceKeys = node.type === 'text' ? TEXT_LAYOUT_KEYS : BOX_LAYOUT_KEYS;
  const filtered: Record<string, unknown> = {};

  for (const key of sourceKeys) {
    if (key in props) {
      filtered[key] = (props as Record<string, unknown>)[key];
    }
  }

  return fingerprintValue(filtered, {
    ignoreKeys: LAYOUT_REF_KEYS,
  });
}

function hasSameChildRefs(node: VNode, childRefs: readonly VNode[]): boolean {
  if (node.children.length !== childRefs.length) {
    return false;
  }

  for (let index = 0; index < childRefs.length; index++) {
    if (node.children[index] !== childRefs[index]) {
      return false;
    }
  }

  return true;
}

function getCachedLayout(node: VNode, ctxKey: string): LayoutNode | undefined {
  if (!canReuseSubtree(node)) {
    noteDirtyFresh('layout');
    return undefined;
  }

  const cached = layoutReuseCache.get(node);
  if (!cached) {
    noteDirtyFresh('layout');
    return undefined;
  }

  if (cached.ctxKey !== ctxKey) {
    markDirty(node, DirtyFlags.LAYOUT);
    noteDirtyFresh('layout');
    return undefined;
  }

  const propsKey = createLayoutPropsKey(node);
  if (
    cached.propsKey !== propsKey ||
    !hasSameChildRefs(node, cached.childRefs)
  ) {
    markDirty(
      node,
      cached.propsKey !== propsKey ? DirtyFlags.LAYOUT : DirtyFlags.CHILDREN,
    );
    noteDirtyFresh('layout');
    return undefined;
  }

  noteDirtyReuse('layout');
  return cached.layout;
}

function setCachedLayout(
  node: VNode,
  ctxKey: string,
  propsKey: string,
  layout: LayoutNode,
): void {
  layoutReuseCache.set(node, {
    ctxKey,
    propsKey,
    childRefs: [...node.children],
    layout,
  });
  markLayoutClean(node);
}

function cloneLayoutWith(
  layout: LayoutNode,
  patch: Partial<Pick<LayoutNode, 'x' | 'y' | 'width' | 'height'>>,
): LayoutNode {
  const x = patch.x ?? layout.x;
  const y = patch.y ?? layout.y;
  const width = patch.width ?? layout.width;
  const height = patch.height ?? layout.height;

  if (x === layout.x && y === layout.y && width === layout.width && height === layout.height) {
    return layout;
  }

  return {
    x,
    y,
    width,
    height,
    node: layout.node,
    children: layout.children,
  };
}

function updateLayoutRef(node: VNode, layout: LayoutNode): void {
  const style = node.props as BoxStyle;
  const layoutRef = style.layoutRef as
    | { __update?: (rect: { x: number; y: number; width: number; height: number }) => void }
    | undefined;

  layoutRef?.__update?.({
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
  });
}

/**
 * Clear the text measurement cache
 * Call this when you want to free memory or reset measurements
 */
export function clearTextMeasureCache(): void {
  textMeasureCache.clear();
  clearLayoutReuseCache();
}

/**
 * Calculate layout for a VNode tree
 */
export function calculateLayout(
  node: VNode,
  availableWidth: number,
  availableHeight: number = Infinity
): LayoutNode {
  beginDirtyFrame(node);
  return layoutNode(node, { x: 0, y: 0, width: availableWidth, height: availableHeight }, null);
}

function layoutTextNode(node: VNode, ctx: RenderContext): LayoutNode {
  const measurement = measureText(String(node.props.children ?? ''));

  return {
    x: ctx.x,
    y: ctx.y,
    width: Math.min(measurement.width, ctx.width),
    height: Math.min(measurement.height, ctx.height),
    node,
    children: [],
  };
}

function layoutSpacerNode(node: VNode, ctx: RenderContext): LayoutNode {
  return {
    x: ctx.x,
    y: ctx.y,
    width: ctx.width,
    height: Math.min(1, ctx.height),
    node,
    children: [],
  };
}

function layoutNewlineNode(node: VNode, ctx: RenderContext): LayoutNode {
  return {
    x: ctx.x,
    y: ctx.y,
    width: 0,
    height: Math.min(node.props.count ?? 1, ctx.height),
    node,
    children: [],
  };
}

/**
 * Layout a single node and its children
 */
function layoutNode(node: VNode, ctx: RenderContext, parentNode: VNode | null): LayoutNode {
  registerDirtyNode(node, parentNode);
  const ctxKey = createContextKey(ctx);
  const cached = getCachedLayout(node, ctxKey);

  if (cached) {
    updateLayoutRef(node, cached);
    return cached;
  }

  let layout: LayoutNode;

  if (node.type === 'text') {
    layout = layoutTextNode(node, ctx);
    setCachedLayout(node, ctxKey, createLayoutPropsKey(node), layout);
    return layout;
  }

  if (node.type === 'spacer') {
    layout = layoutSpacerNode(node, ctx);
    setCachedLayout(node, ctxKey, createLayoutPropsKey(node), layout);
    return layout;
  }

  if (node.type === 'newline') {
    layout = layoutNewlineNode(node, ctx);
    setCachedLayout(node, ctxKey, createLayoutPropsKey(node), layout);
    return layout;
  }

  const style = node.props as BoxStyle;

  // Handle display: 'none' - return zero-sized layout
  if (style.display === 'none') {
    layout = {
      x: ctx.x,
      y: ctx.y,
      width: 0,
      height: 0,
      node,
      children: [],
    };
    updateLayoutRef(node, layout);
    setCachedLayout(node, ctxKey, createLayoutPropsKey(node), layout);
    return layout;
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

  // Separate absolute and normal children
  const absoluteChildren: VNode[] = [];
  const normalChildren: VNode[] = [];

  if (node.children.length > 0) {
    // Separate absolute positioned children from normal flow
    for (const child of node.children) {
      const childStyle = child.props as BoxStyle;
      if (childStyle.position === 'absolute') {
        absoluteChildren.push(child);
      } else {
        normalChildren.push(child);
      }
    }

    // Get normal children, reversing order if needed
    const orderedChildren = isReverse ? [...normalChildren].reverse() : normalChildren;

    const hasExplicitHeight = style.height !== undefined && style.height !== 'auto';

    if (isRow) {
      childLayouts.push(...layoutRow(orderedChildren, contentWidth, contentHeight, currentGap, style, hasExplicitHeight, node));
    } else {
      childLayouts.push(...layoutColumn(orderedChildren, contentWidth, contentHeight, currentGap, style, node));
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

  // Check if element should fill available space
  const flexGrow = style.flexGrow ?? 0;
  const shouldFillWidth = flexGrow > 0 || style.width === 'fill';

  // Final size
  // If flexGrow > 0, use context width (fill available space)
  // Otherwise, use content width
  const contentBasedWidth = totalWidth + paddingLeft + paddingRight + borderSize * 2;
  const width = explicitWidth || (shouldFillWidth ? ctx.width : contentBasedWidth);
  const height = explicitHeight || (totalHeight + paddingTop + paddingBottom + borderSize * 2);

  const layoutX = ctx.x + marginLeft;
  const layoutY = ctx.y + marginTop;
  const layoutWidth = Math.min(width, ctx.width - marginLeft - marginRight);
  const layoutHeight = Math.min(height, ctx.height - marginTop - marginBottom);

  // Layout absolute positioned children
  // They are positioned relative to this container's content area
  for (const absChild of absoluteChildren) {
    const absStyle = absChild.props as BoxStyle;

    // First, layout the child to get its natural size
    const absLayout = layoutNode(absChild, {
      x: 0,
      y: 0,
      width: contentWidth,
      height: contentHeight,
    }, node);

    // Calculate position based on top/left/right/bottom
    let absX = layoutX + paddingLeft + borderSize;
    let absY = layoutY + paddingTop + borderSize;

    // Horizontal positioning
    if (absStyle.left !== undefined) {
      absX = layoutX + paddingLeft + borderSize + absStyle.left;
    } else if (absStyle.right !== undefined) {
      absX = layoutX + layoutWidth - paddingRight - borderSize - absLayout.width - absStyle.right;
    }

    // Vertical positioning
    if (absStyle.top !== undefined) {
      absY = layoutY + paddingTop + borderSize + absStyle.top;
    } else if (absStyle.bottom !== undefined) {
      absY = layoutY + layoutHeight - paddingBottom - borderSize - absLayout.height - absStyle.bottom;
    }

    // Update the layout position
    const positionedLayout = cloneLayoutWith(absLayout, { x: absX, y: absY });
    updateLayoutRef(absChild, positionedLayout);
    childLayouts.push(positionedLayout);
  }

  layout = {
    x: layoutX,
    y: layoutY,
    width: layoutWidth,
    height: layoutHeight,
    node,
    children: childLayouts,
  };

  updateLayoutRef(node, layout);
  setCachedLayout(node, ctxKey, createLayoutPropsKey(node), layout);

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
  hasExplicitHeight: boolean,
  parentNode: VNode,
): LayoutNode[] {
  const results: LayoutNode[] = [];

  // First pass: calculate fixed sizes and count flexible children
  let fixedWidth = 0;
  let flexTotal = 0;
  const childInfos: {
    node: VNode;
    flex: number;
    minWidth: number;
    marginLeft: number;
    marginRight: number;
    layout?: LayoutNode;
    measuredCtxWidth?: number;
  }[] = [];

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
      const hasReusableExplicitWidth =
        style.width !== undefined &&
        style.width !== 'auto' &&
        style.width !== 'fill';
      const measuredCtxWidth = hasReusableExplicitWidth
        ? resolveSize(style.width, width) + marginLeft + marginRight
        : width;
      // Fixed width child - layout to get its natural size.
      // If the child already has an explicit width, this pass uses the final width so
      // the second pass can reposition it without recomputing the subtree.
      const layout = layoutNode(child, { x: 0, y: 0, width: measuredCtxWidth, height }, parentNode);
      fixedWidth += layout.width + marginLeft + marginRight;
      childInfos.push({
        node: child,
        flex: 0,
        minWidth: layout.width,
        marginLeft,
        marginRight,
        layout,
        measuredCtxWidth,
      });
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
    const layout = info.layout && info.measuredCtxWidth === allocatedWidth
      ? cloneLayoutWith(info.layout, { x: info.layout.x + x })
      : layoutNode(info.node, { x, y: 0, width: allocatedWidth, height }, parentNode);

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
    const { style } = entry;
    let { layout } = entry;
    const alignSelf = style.alignSelf;
    const alignItems = alignSelf !== 'auto' && alignSelf ? alignSelf : (parentStyle.alignItems ?? 'flex-start');
    let nextY = layout.y;
    let nextHeight = layout.height;

    if (alignItems === 'stretch') {
      if (style.height === undefined) {
        nextHeight = Math.max(layout.height, alignHeight);
      }
      nextY = 0;
    } else if (alignItems === 'center') {
      nextY = Math.floor((alignHeight - layout.height) / 2);
    } else if (alignItems === 'flex-end') {
      nextY = alignHeight - layout.height;
    } else if (alignItems === 'baseline') {
      // For baseline, align to top (simplified - true baseline needs font metrics)
      nextY = 0;
    }

    layout = cloneLayoutWith(layout, { y: nextY, height: nextHeight });
    updateLayoutRef(layout.node, layout);
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
  parentStyle: BoxStyle,
  parentNode: VNode,
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
        const layout = layoutNode(child, { x: 0, y: 0, width, height }, parentNode);
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

          layout = layoutNode(info.node, { x: 0, y, width, height: allocatedHeight }, parentNode);
          layout = cloneLayoutWith(layout, { height: allocatedHeight });
        }

        if (!layout) {
          layout = layoutNode(info.node, { x: 0, y, width, height }, parentNode);
        }

        // Fix: Update y position for non-flex children (they were pre-calculated with y=0)
        let nextX = layout.x;
        let nextWidth = layout.width;

        if (alignItems === 'center') {
          nextX = Math.floor((width - layout.width) / 2);
        } else if (alignItems === 'flex-end') {
          nextX = width - layout.width;
        } else if (alignItems === 'stretch') {
          nextWidth = width;
        }

        layout = cloneLayoutWith(layout, { x: nextX, y, width: nextWidth });
        updateLayoutRef(layout.node, layout);
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
    const layout = layoutNode(child, { x: 0, y, width, height: height - y }, parentNode);

    // Adjust x based on alignItems (or alignSelf if set on child)
    const alignSelf = childStyle.alignSelf;
    const alignItems = alignSelf !== 'auto' && alignSelf ? alignSelf : (parentStyle.alignItems ?? 'flex-start');
    let nextX = layout.x;
    let nextWidth = layout.width;

    if (alignItems === 'center') {
      nextX = Math.floor((width - layout.width) / 2);
    } else if (alignItems === 'flex-end') {
      nextX = width - layout.width;
    } else if (alignItems === 'stretch') {
      nextWidth = width;
    }

    const alignedLayout = cloneLayoutWith(layout, { x: nextX, width: nextWidth });
    updateLayoutRef(alignedLayout.node, alignedLayout);
    results.push(alignedLayout);

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
        results[i] = cloneLayoutWith(results[i], {
          y: results[i].y + Math.floor(spaceBetween * i),
        });
        updateLayoutRef(results[i].node, results[i]);
      }
      return results;
    } else if (justifyContent === 'space-around') {
      const spaceAround = remainingSpace / (results.length * 2);
      for (let i = 0; i < results.length; i++) {
        results[i] = cloneLayoutWith(results[i], {
          y: results[i].y + Math.floor(spaceAround * (2 * i + 1)),
        });
        updateLayoutRef(results[i].node, results[i]);
      }
      return results;
    } else if (justifyContent === 'space-evenly') {
      const spaceEvenly = remainingSpace / (results.length + 1);
      for (let i = 0; i < results.length; i++) {
        results[i] = cloneLayoutWith(results[i], {
          y: results[i].y + Math.floor(spaceEvenly * (i + 1)),
        });
        updateLayoutRef(results[i].node, results[i]);
      }
      return results;
    }

    // Apply simple offset for flex-end and center
    if (offset > 0) {
      for (let i = 0; i < results.length; i++) {
        results[i] = cloneLayoutWith(results[i], { y: results[i].y + offset });
        updateLayoutRef(results[i].node, results[i]);
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
