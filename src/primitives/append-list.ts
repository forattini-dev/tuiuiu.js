/**
 * AppendList - Append-only list helper for log-style output
 */

import type { BoxStyle, VNode } from '../utils/types.js';
import { Box } from './nodes.js';
import { isRenderingHooks } from '../hooks/context.js';
import { useConst } from '../hooks/use-const.js';

export interface AppendListProps<T> {
  /** Items to render (append-only) */
  items: T[];
  /** Render function for each item */
  children: (item: T, index: number) => VNode;
  /** Optional container styles for fallback rendering */
  style?: BoxStyle;
  /** Stable identity for each item (defaults to its absolute index) */
  getKey?: (item: T, index: number) => string | number;
  /** Stable list identity when output must survive remounts */
  id?: string;
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

let nextAppendListInstanceId = 1;

export function AppendList<T>(props: AppendListProps<T>): VNode {
  const { items, children: renderItem, style, getKey, id } = props;
  const state = isRenderingHooks()
    ? useConst(() => ({
        instanceId: nextAppendListInstanceId++,
        prevItems: [] as T[],
        appendOnly: true,
      }))
    : {
        instanceId: nextAppendListInstanceId++,
        prevItems: [] as T[],
        appendOnly: true,
      };

  const prev = state.prevItems;
  const allowAppendOnly = state.appendOnly;
  const appendOnlyMatch = isPrefixMatch(prev, items);
  const sameList = isSameList(prev, items);

  if (!sameList) {
    state.prevItems = [...items];
  }

  if (allowAppendOnly && !appendOnlyMatch) {
    state.appendOnly = false;
  }

  if (!allowAppendOnly || !appendOnlyMatch) {
    return Box(
      { flexDirection: 'column', ...style },
      ...items.map((item, index) => renderItem(item, index))
    );
  }

  const newItems = items.slice(prev.length);
  const startIndex = prev.length;
  const keys = newItems.map((item, index) => {
    const absoluteIndex = startIndex + index;
    const key = getKey?.(item, absoluteIndex) ?? absoluteIndex;
    return `${typeof key}:${String(key)}`;
  });
  if (new Set(keys).size !== keys.length) {
    throw new Error('AppendList item keys must be unique within an appended batch');
  }
  const identity = id ?? `append-list-${state.instanceId}`;

  return {
    type: 'box',
    props: {
      ...style,
      flexDirection: 'column',
      __static: true,
      __staticId: `${identity}:${keys.join('|') || 'empty'}`,
    },
    children: newItems.map((item, index) =>
      renderItem(item, startIndex + index)
    ),
  };
}
