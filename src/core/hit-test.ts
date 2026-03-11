/**
 * Hit Testing System
 *
 * Tracks rendered element positions and dispatches mouse events
 * to the correct handlers. Inspired by blessed's clickable tracking.
 *
 * Features:
 * - Tracks element bounds during render
 * - Z-order aware (topmost element receives event first)
 * - Event bubbling support
 * - Double-click detection
 * - Mouse enter/leave tracking
 */

import type { VNode, LayoutNode, MouseEventData, MouseEventHandler, MouseButton } from '../utils/types.js';
import { parseMouseEvent, enableMouseTracking, disableMouseTracking, type MouseEvent as RawMouseEvent } from '../hooks/use-mouse.js';

// =============================================================================
// Types
// =============================================================================

/** Rendered element bounds */
export interface ElementBounds {
  /** VNode reference */
  node: VNode;
  /** Left edge (x) */
  x: number;
  /** Top edge (y) */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Z-index (render order, higher = on top) */
  zIndex: number;
}

/** Hit test result */
export interface HitTestResult {
  /** Element that was hit */
  node: VNode;
  /** Relative x position within element */
  relativeX: number;
  /** Relative y position within element */
  relativeY: number;
  /** Absolute screen position */
  absoluteX: number;
  /** Absolute screen position */
  absoluteY: number;
}

function hasMouseHandlers(node: VNode): boolean {
  const props = node.props;

  return !!(
    props.onClick ||
    props.onDoubleClick ||
    props.onMouseDown ||
    props.onMouseUp ||
    props.onMouseMove ||
    props.onMouseEnter ||
    props.onMouseLeave ||
    props.onContextMenu ||
    props.onScroll
  );
}

function walkHitTestLayout(
  layout: LayoutNode,
  visitor: (node: VNode, x: number, y: number, width: number, height: number, parent: VNode | null) => void,
  offsetX = 0,
  offsetY = 0,
  parentNode: VNode | null = null,
): void {
  const { node, x, y, width, height, children } = layout;
  const absX = offsetX + x;
  const absY = offsetY + y;

  visitor(node, absX, absY, width, height, parentNode);

  const style = node.props;
  const paddingTop = style.paddingTop ?? style.paddingY ?? style.padding ?? 0;
  const paddingLeft = style.paddingLeft ?? style.paddingX ?? style.padding ?? 0;
  const borderSize = style.borderStyle && style.borderStyle !== 'none' ? 1 : 0;
  const contentOffsetX = absX + paddingLeft + borderSize;
  const contentOffsetY = absY + paddingTop + borderSize;

  for (const child of children) {
    walkHitTestLayout(child, visitor, contentOffsetX, contentOffsetY, node);
  }
}

export function collectHitTestTargetsFromLayout(layout: LayoutNode): ElementBounds[] {
  const elements: ElementBounds[] = [];
  let zCounter = 0;

  walkHitTestLayout(layout, (node, x, y, width, height) => {
    if (!hasMouseHandlers(node)) return;

    elements.push({
      node,
      x,
      y,
      width,
      height,
      zIndex: zCounter++,
    });
  });

  return elements;
}

// =============================================================================
// Hit Test Registry
// =============================================================================

/**
 * Registry for tracking clickable elements
 */
class HitTestRegistry {
  private elements: ElementBounds[] = [];
  private boundsByNode: Map<VNode, ElementBounds> = new Map();
  private parentMap: Map<VNode, VNode | null> = new Map();
  private zCounter = 0;
  private hoveredElement: VNode | null = null;
  private lastClickTime = 0;
  private lastClickPos = { x: -1, y: -1 };
  private lastClickButton: MouseButton = 'none';
  private mouseTrackingEnabled = false;
  private inputHandler: ((data: string) => void) | null = null;

  /**
   * Clear all registered elements (call before each render)
   */
  clear(): void {
    this.elements = [];
    this.boundsByNode.clear();
    this.parentMap.clear();
    this.zCounter = 0;
  }

  /**
   * Register an element's bounds
   */
  register(node: VNode, x: number, y: number, width: number, height: number, parent: VNode | null): void {
    this.parentMap.set(node, parent);
    if (hasMouseHandlers(node)) {
      const bounds = {
        node,
        x,
        y,
        width,
        height,
        zIndex: this.zCounter++,
      };
      this.elements.push(bounds);
      this.boundsByNode.set(node, bounds);
    }
  }

  /**
   * Register from layout node (recursive)
   */
  registerFromLayout(layout: LayoutNode, offsetX = 0, offsetY = 0, parentNode: VNode | null = null): void {
    walkHitTestLayout(layout, (node, x, y, width, height, parent) => {
      this.register(node, x, y, width, height, parent);
    }, offsetX, offsetY, parentNode);
  }

  /**
   * Find element at position (topmost first)
   */
  hitTest(screenX: number, screenY: number): HitTestResult | null {
    // Search from highest z-index to lowest
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const bounds = this.elements[i];
      if (
        screenX >= bounds.x &&
        screenX < bounds.x + bounds.width &&
        screenY >= bounds.y &&
        screenY < bounds.y + bounds.height
      ) {
        return {
          node: bounds.node,
          relativeX: screenX - bounds.x,
          relativeY: screenY - bounds.y,
          absoluteX: screenX,
          absoluteY: screenY,
        };
      }
    }
    return null;
  }

  /**
   * Handle raw mouse event from terminal
   */
  handleMouseEvent(rawEvent: RawMouseEvent): void {
    const hit = this.hitTest(rawEvent.x, rawEvent.y);
    const now = Date.now();

    // Create event data
    let propagationStopped = false;
    const createEventData = (target: VNode | null): MouseEventData => ({
      x: hit?.relativeX ?? 0,
      y: hit?.relativeY ?? 0,
      absoluteX: rawEvent.x,
      absoluteY: rawEvent.y,
      button: rawEvent.button,
      modifiers: rawEvent.modifiers,
      target,
      stopPropagation: () => {
        propagationStopped = true;
      },
    });

    // Handle mouse enter/leave
    const currentHovered = hit?.node ?? null;
    if (currentHovered !== this.hoveredElement) {
      // Mouse leave old element
      if (this.hoveredElement?.props.onMouseLeave) {
        const leaveEvent = createEventData(this.hoveredElement);
        (this.hoveredElement.props.onMouseLeave as MouseEventHandler)(leaveEvent);
      }
      // Mouse enter new element
      if (currentHovered?.props.onMouseEnter) {
        const enterEvent = createEventData(currentHovered);
        (currentHovered.props.onMouseEnter as MouseEventHandler)(enterEvent);
      }
      this.hoveredElement = currentHovered;
    }

    if (!hit) return;

    const eventData = createEventData(hit.node);
    const props = hit.node.props;

    // Dispatch based on action
    switch (rawEvent.action) {
      case 'click':
        // Check for double-click
        const isDoubleClick =
          now - this.lastClickTime < 300 &&
          Math.abs(rawEvent.x - this.lastClickPos.x) <= 2 &&
          Math.abs(rawEvent.y - this.lastClickPos.y) <= 2 &&
          rawEvent.button === this.lastClickButton;

        if (isDoubleClick && props.onDoubleClick) {
          (props.onDoubleClick as MouseEventHandler)(eventData);
        } else if (rawEvent.button === 'left' && props.onClick) {
          (props.onClick as MouseEventHandler)(eventData);
        } else if (rawEvent.button === 'right' && props.onContextMenu) {
          (props.onContextMenu as MouseEventHandler)(eventData);
        } else if (rawEvent.button === 'scroll-up' || rawEvent.button === 'scroll-down') {
          if (props.onScroll) {
            (props.onScroll as MouseEventHandler)(eventData);
          }
        }

        // Track for double-click detection
        if (!isDoubleClick) {
          this.lastClickTime = now;
          this.lastClickPos = { x: rawEvent.x, y: rawEvent.y };
          this.lastClickButton = rawEvent.button;
        } else {
          // Reset after double-click
          this.lastClickTime = 0;
        }

        // Also trigger mouseDown
        if (props.onMouseDown) {
          (props.onMouseDown as MouseEventHandler)(eventData);
        }
        break;

      case 'release':
        if (props.onMouseUp) {
          (props.onMouseUp as MouseEventHandler)(eventData);
        }
        break;

      case 'drag':
      case 'move':
        if (props.onMouseMove) {
          (props.onMouseMove as MouseEventHandler)(eventData);
        }
        break;

      case 'double-click':
        if (props.onDoubleClick) {
          (props.onDoubleClick as MouseEventHandler)(eventData);
        }
        break;
    }

    // Bubble up to parent if not stopped
    if (!propagationStopped) {
      this.bubbleEvent(hit.node, rawEvent, eventData);
    }
  }

  /**
   * Bubble event to parent elements
   */
  private bubbleEvent(startNode: VNode, rawEvent: RawMouseEvent, eventData: MouseEventData): void {
    let stopped = false;
    let current = this.parentMap.get(startNode) ?? null;

    while (current && !stopped) {
      const bounds = this.boundsByNode.get(current);
      if (bounds) {
        const props = bounds.node.props;
        const parentEventData: MouseEventData = {
          x: eventData.absoluteX - bounds.x,
          y: eventData.absoluteY - bounds.y,
          absoluteX: eventData.absoluteX,
          absoluteY: eventData.absoluteY,
          button: eventData.button,
          modifiers: eventData.modifiers,
          target: bounds.node,
          stopPropagation: () => {
            stopped = true;
          },
        };

        // Only trigger click handlers during bubbling
        if (rawEvent.action === 'click') {
          if (rawEvent.button === 'left' && props.onClick) {
            (props.onClick as MouseEventHandler)(parentEventData);
          }
        }
      }

      current = this.parentMap.get(current) ?? null;
    }
  }

  /**
   * Enable mouse tracking and start listening
   */
  enable(onInput: (handler: (data: string) => void) => void): void {
    if (this.mouseTrackingEnabled) return;

    this.mouseTrackingEnabled = true;
    enableMouseTracking();

    this.inputHandler = (data: string) => {
      const result = parseMouseEvent(data);
      if (result) {
        this.handleMouseEvent(result.event);
      }
    };

    onInput(this.inputHandler);
  }

  /**
   * Disable mouse tracking
   */
  disable(): void {
    if (!this.mouseTrackingEnabled) return;

    this.mouseTrackingEnabled = false;
    disableMouseTracking();
    this.inputHandler = null;
  }

  /**
   * Check if any elements have mouse handlers
   */
  hasClickableElements(): boolean {
    return this.elements.length > 0;
  }

  /**
   * Get count of registered elements
   */
  get count(): number {
    return this.elements.length;
  }

  /**
   * Get all registered element bounds (for debugging/testing)
   */
  getElements(): ElementBounds[] {
    return [...this.elements];
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let registryInstance: HitTestRegistry | null = null;

/**
 * Get the global hit test registry
 */
export function getHitTestRegistry(): HitTestRegistry {
  if (!registryInstance) {
    registryInstance = new HitTestRegistry();
  }
  return registryInstance;
}

/**
 * Reset the registry (for testing)
 */
export function resetHitTestRegistry(): void {
  if (registryInstance) {
    registryInstance.disable();
  }
  registryInstance = null;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Register elements from a layout tree
 */
export function registerHitTestFromLayout(layout: LayoutNode): void {
  const registry = getHitTestRegistry();
  registry.clear();
  registry.registerFromLayout(layout);
}

/**
 * Perform a hit test at screen coordinates
 */
export function hitTestAt(x: number, y: number): HitTestResult | null {
  return getHitTestRegistry().hitTest(x, y);
}

/**
 * Enable mouse event handling
 */
export function enableHitTesting(onInput: (handler: (data: string) => void) => void): void {
  getHitTestRegistry().enable(onInput);
}

/**
 * Disable mouse event handling
 */
export function disableHitTesting(): void {
  getHitTestRegistry().disable();
}
