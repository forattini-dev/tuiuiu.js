/**
 * AppendList - Append-only list helper for log-style output
 */

import type { BoxStyle, VNode } from '../utils/types.js';
import { Box, Static } from './nodes.js';
import { useState } from '../hooks/use-state.js';

export interface AppendListProps<T> {
  /** Items to render (append-only) */
  items: T[];
  /** Render function for each item */
  children: (item: T, index: number) => VNode;
  /** Optional container styles for fallback rendering */
  style?: BoxStyle;
}

function isPrefixMatch<T>(prev: T[], next: T[]): boolean {
  if (next.length < prev.length) {
    return false;
  }
  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== next[i]) {
      return false;
    }
  }
  return true;
}

function isSameList<T>(prev: T[], next: T[]): boolean {
  if (prev.length !== next.length) {
    return false;
  }
  return isPrefixMatch(prev, next);
}

export function AppendList<T>(props: AppendListProps<T>): VNode {
  const { items, children: renderItem, style } = props;
  const [prevItems, setPrevItems] = useState<T[]>([]);
  const [appendOnly, setAppendOnly] = useState(true);

  const prev = prevItems();
  const allowAppendOnly = appendOnly();
  const appendOnlyMatch = isPrefixMatch(prev, items);
  const sameList = isSameList(prev, items);

  if (!sameList) {
    setPrevItems(items);
  }

  if (allowAppendOnly && !appendOnlyMatch) {
    setAppendOnly(false);
  }

  if (!allowAppendOnly || !appendOnlyMatch) {
    return Box(
      { flexDirection: 'column', ...style },
      ...items.map((item, index) => renderItem(item, index))
    );
  }

  const newItems = items.slice(prev.length);
  return Static({
    items: newItems,
    children: (item, index) => renderItem(item, prev.length + index),
    style,
  });
}
