/**
 * Shared helpers for primitive components
 */

import type { VNode, ReckNode } from '../../utils/types.js';

// Forward declaration to avoid circular dependency
let TextComponent: ((props: any, ...children: any[]) => VNode) | null = null;

export function setTextComponent(fn: (props: any, ...children: any[]) => VNode) {
  TextComponent = fn;
}

/**
 * Normalize children into VNode array
 */
export function normalizeChildren(children: ReckNode): VNode[] {
  if (children === null || children === undefined || children === false || children === true) {
    return [];
  }

  if (Array.isArray(children)) {
    return children.flatMap(normalizeChildren);
  }

  if (typeof children === 'string' || typeof children === 'number') {
    if (!TextComponent) {
      throw new Error('Text component not initialized. Import text.ts first.');
    }
    return [TextComponent({ children: String(children) })];
  }

  return [children as VNode];
}
