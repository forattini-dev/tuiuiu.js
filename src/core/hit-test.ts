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

// =============================================================================
// Hit Test Registry
// =============================================================================

/**
 * Registry for tracking clickable elements
 */
class HitTestRegistry {
  private elements: ElementBounds[] = [];
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
    this.zCounter = 0;
  }

  /**
   * Register an element's bounds
   */
  register(node: VNode, x: number, y: number, width: number, height: number): void {
    // Only register if element has mouse handlers
    const props = node.props;
    if (
      props.onClick ||
      props.onDoubleClick ||
      props.onMouseDown ||
      props.onMouseUp ||
      props.onMouseMove ||
      props.onMouseEnter ||
      props.onMouseLeave ||
      props.onContextMenu ||
      props.onScroll
    ) {
      this.elements.push({
        node,
        x,
        y,
        width,
        height,
        zIndex: this.zCounter++,
      });
    }
  }

  /**
   * Register from layout node (recursive)
   */
  registerFromLayout(layout: LayoutNode, offsetX = 0, offsetY = 0): void {
    const { node, x, y, width, height, children } = layout;
    const absX = offsetX + x;
    const absY = offsetY + y;

    // Register this element
    this.register(node, absX, absY, width, height);

    // Calculate content offset for children
    const style = node.props;
    const paddingTop = style.paddingTop ?? style.paddingY ?? style.padding ?? 0;
    const paddingLeft = style.paddingLeft ?? style.paddingX ?? style.padding ?? 0;
    const borderSize = style.borderStyle && style.borderStyle !== 'none' ? 1 : 0;
    const contentOffsetX = absX + paddingLeft + borderSize;
    const contentOffsetY = absY + paddingTop + borderSize;

    // Register children
    for (const child of children) {
      this.registerFromLayout(child, contentOffsetX, contentOffsetY);
    }
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
  private bubbleEvent(startNode: VNode, rawEvent: RawMouseEvent, _eventData: MouseEventData): void {
    // Find parent elements that contain this position
    const parents = this.elements.filter(
      (bounds) =>
        bounds.node !== startNode &&
        _eventData.absoluteX >= bounds.x &&
        _eventData.absoluteX < bounds.x + bounds.width &&
        _eventData.absoluteY >= bounds.y &&
        _eventData.absoluteY < bounds.y + bounds.height
    );

    // Sort by z-index (lower first for bubbling up)
    parents.sort((a, b) => b.zIndex - a.zIndex);

    let stopped = false;

    for (const parent of parents) {
      if (stopped) break;

      const props = parent.node.props;
      const parentEventData: MouseEventData = {
        x: _eventData.absoluteX - parent.x,
        y: _eventData.absoluteY - parent.y,
        absoluteX: _eventData.absoluteX,
        absoluteY: _eventData.absoluteY,
        button: _eventData.button,
        modifiers: _eventData.modifiers,
        target: parent.node,
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
  }

  /**
   * Enable mouse tracking and start listening
   */
  enable(onInput: (handler: (data: string) => void) => void): void {
    if (this.mouseTrackingEnabled) return;

    this.mouseTrackingEnabled = true;
    enableMouseTracking();

    this.inputHandler = (data: string) => {
      const mouseEvent = parseMouseEvent(data);
      if (mouseEvent) {
        this.handleMouseEvent(mouseEvent);
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
