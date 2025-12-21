/**
 * Advanced Focus Management System
 *
 * Features:
 * - Focus Zones (isolated focus contexts)
 * - Focus Traps (keep focus within region)
 * - Focus Stack (modal patterns)
 * - Programmatic focus control
 * - Tab order management
 *
 * Inspired by: Ink (focus management), Textual (focus zones)
 */

import type { VNode } from '../utils/types.js';

// =============================================================================
// Types
// =============================================================================

/** Focus zone configuration */
export interface FocusZoneOptions {
  /** Unique identifier for the zone */
  id?: string;
  /** Whether to trap focus within this zone */
  trap?: boolean;
  /** Auto-focus first element on activation */
  autoFocus?: boolean;
  /** Wrap focus when reaching boundaries */
  wrap?: boolean;
  /** Direction of focus navigation */
  direction?: 'horizontal' | 'vertical' | 'both';
  /** Enable/disable the zone */
  disabled?: boolean;
  /** Restore focus when deactivated */
  restoreFocus?: boolean;
}

/** Focusable element registration */
export interface FocusableElement {
  /** Unique identifier */
  id: string;
  /** Display order (lower = first) */
  order: number;
  /** Whether currently active */
  isActive: boolean;
  /** Tab index override (-1 = not tabbable) */
  tabIndex?: number;
  /** Callback when focus changes */
  onFocus?: (focused: boolean) => void;
  /** Associated VNode if available */
  node?: VNode;
  /** Group ID for grouping */
  group?: string;
}

/** Focus zone state */
export interface FocusZoneState {
  /** Zone identifier */
  id: string;
  /** Registered focusable elements */
  elements: Map<string, FocusableElement>;
  /** Ordered element IDs */
  order: string[];
  /** Currently focused element ID */
  activeId: string | null;
  /** Previous active ID (for restoration) */
  previousActiveId: string | null;
  /** Zone options */
  options: FocusZoneOptions;
  /** Parent zone ID */
  parentId: string | null;
  /** Whether zone is currently active */
  isActive: boolean;
}

/** Focus stack entry */
export interface FocusStackEntry {
  /** Zone being pushed */
  zoneId: string;
  /** Element that had focus before push */
  previousFocusId: string | null;
  /** Previous zone ID */
  previousZoneId: string | null;
  /** Timestamp for ordering */
  timestamp: number;
}

/** Focus zone event data */
export interface FocusZoneEventData {
  /** Element receiving focus */
  elementId: string | null;
  /** Element losing focus */
  previousElementId: string | null;
  /** Zone containing focused element */
  zoneId: string;
  /** Whether this is initial focus */
  isInitial: boolean;
}

// =============================================================================
// Focus Zone Manager (Singleton)
// =============================================================================

let zoneIdCounter = 0;

class FocusZoneManager {
  private static instance: FocusZoneManager | null = null;

  /** All registered zones */
  private zones: Map<string, FocusZoneState> = new Map();
  /** Focus stack for modal patterns */
  private stack: FocusStackEntry[] = [];
  /** Currently active zone */
  private activeZoneId: string | null = null;
  /** Root zone ID */
  private rootZoneId: string | null = null;
  /** Maximum stack depth */
  private maxStackDepth = 10;
  /** Focus change listeners */
  private listeners: Set<(event: FocusZoneEventData) => void> = new Set();

  private constructor() {
    // Create root zone
    this.createZone({ id: '__root__' });
    this.rootZoneId = '__root__';
    this.activeZoneId = '__root__';
  }

  static getInstance(): FocusZoneManager {
    if (!FocusZoneManager.instance) {
      FocusZoneManager.instance = new FocusZoneManager();
    }
    return FocusZoneManager.instance;
  }

  static reset(): void {
    FocusZoneManager.instance = null;
  }

  // ===========================================================================
  // Zone Management
  // ===========================================================================

  /**
   * Create a new focus zone
   */
  createZone(options: FocusZoneOptions = {}): string {
    const id = options.id || `zone_${zoneIdCounter++}`;

    const zone: FocusZoneState = {
      id,
      elements: new Map(),
      order: [],
      activeId: null,
      previousActiveId: null,
      options: {
        trap: false,
        autoFocus: true,
        wrap: true,
        direction: 'vertical',
        disabled: false,
        restoreFocus: true,
        ...options,
      },
      parentId: this.activeZoneId,
      isActive: false,
    };

    this.zones.set(id, zone);
    return id;
  }

  /**
   * Destroy a focus zone
   */
  destroyZone(zoneId: string): void {
    if (zoneId === this.rootZoneId) return; // Can't destroy root

    const zone = this.zones.get(zoneId);
    if (!zone) return;

    // Deactivate if active
    if (this.activeZoneId === zoneId) {
      this.deactivateZone(zoneId);
    }

    // Remove from stack
    this.stack = this.stack.filter((entry) => entry.zoneId !== zoneId);

    // Remove zone
    this.zones.delete(zoneId);
  }

  /**
   * Activate a focus zone (push to stack)
   */
  activateZone(zoneId: string): void {
    const zone = this.zones.get(zoneId);
    if (!zone || zone.options.disabled) return;

    const currentZone = this.getActiveZone();
    const previousFocusId = currentZone?.activeId ?? null;

    // Check stack depth
    if (this.stack.length >= this.maxStackDepth) {
      console.warn(`Focus stack overflow: ${this.stack.length} zones stacked`);
    }

    // Push current state to stack
    if (this.activeZoneId && this.activeZoneId !== zoneId) {
      this.stack.push({
        zoneId: this.activeZoneId,
        previousFocusId,
        previousZoneId: this.activeZoneId,
        timestamp: Date.now(),
      });
    }

    // Activate new zone
    this.activeZoneId = zoneId;
    zone.isActive = true;

    // Auto-focus first element if enabled
    if (zone.options.autoFocus && zone.order.length > 0) {
      this.focusElement(zone.order[0]!, zoneId);
    }
  }

  /**
   * Deactivate a focus zone (pop from stack)
   */
  deactivateZone(zoneId: string): void {
    const zone = this.zones.get(zoneId);
    if (!zone) return;

    zone.isActive = false;

    // Pop from stack
    const entry = this.stack.pop();
    if (entry) {
      this.activeZoneId = entry.previousZoneId;

      // Restore focus if enabled
      if (zone.options.restoreFocus && entry.previousFocusId) {
        const parentZone = this.zones.get(entry.previousZoneId!);
        if (parentZone) {
          this.focusElement(entry.previousFocusId, entry.previousZoneId!);
        }
      }
    } else {
      this.activeZoneId = this.rootZoneId;
    }
  }

  /**
   * Get active zone
   */
  getActiveZone(): FocusZoneState | null {
    return this.activeZoneId ? this.zones.get(this.activeZoneId) ?? null : null;
  }

  /**
   * Get zone by ID
   */
  getZone(zoneId: string): FocusZoneState | null {
    return this.zones.get(zoneId) ?? null;
  }

  // ===========================================================================
  // Element Registration
  // ===========================================================================

  /**
   * Register a focusable element
   */
  registerElement(
    elementId: string,
    zoneId: string = this.activeZoneId || '__root__',
    options: Partial<FocusableElement> = {}
  ): void {
    const zone = this.zones.get(zoneId);
    if (!zone) return;

    const element: FocusableElement = {
      id: elementId,
      order: options.order ?? zone.order.length,
      isActive: options.isActive ?? true,
      tabIndex: options.tabIndex,
      onFocus: options.onFocus,
      node: options.node,
      group: options.group,
    };

    zone.elements.set(elementId, element);

    // Maintain sorted order
    this.updateOrder(zone);
  }

  /**
   * Unregister a focusable element
   */
  unregisterElement(elementId: string, zoneId?: string): void {
    const searchZones = zoneId ? [this.zones.get(zoneId)] : Array.from(this.zones.values());

    for (const zone of searchZones) {
      if (!zone) continue;

      if (zone.elements.has(elementId)) {
        // If this element was focused, move focus
        if (zone.activeId === elementId) {
          this.focusNextInZone(zone.id);
        }

        zone.elements.delete(elementId);
        this.updateOrder(zone);
        return;
      }
    }
  }

  /**
   * Update element options
   */
  updateElement(elementId: string, updates: Partial<FocusableElement>, zoneId?: string): void {
    const searchZones = zoneId ? [this.zones.get(zoneId)] : Array.from(this.zones.values());

    for (const zone of searchZones) {
      if (!zone) continue;

      const element = zone.elements.get(elementId);
      if (element) {
        Object.assign(element, updates);
        if (updates.order !== undefined) {
          this.updateOrder(zone);
        }
        return;
      }
    }
  }

  private updateOrder(zone: FocusZoneState): void {
    const activeElements = Array.from(zone.elements.entries())
      .filter(([, el]) => el.isActive && el.tabIndex !== -1)
      .sort((a, b) => a[1].order - b[1].order);

    zone.order = activeElements.map(([id]) => id);
  }

  // ===========================================================================
  // Focus Navigation
  // ===========================================================================

  /**
   * Focus a specific element
   */
  focusElement(elementId: string, zoneId?: string): boolean {
    const zone = zoneId ? this.zones.get(zoneId) : this.getActiveZone();
    if (!zone) return false;

    const element = zone.elements.get(elementId);
    if (!element || !element.isActive) return false;

    const previousId = zone.activeId;

    // Blur previous
    if (previousId && previousId !== elementId) {
      const prev = zone.elements.get(previousId);
      prev?.onFocus?.(false);
    }

    // Focus new
    zone.previousActiveId = previousId;
    zone.activeId = elementId;
    element.onFocus?.(true);

    // Notify listeners
    this.notifyFocusChange({
      elementId,
      previousElementId: previousId,
      zoneId: zone.id,
      isInitial: previousId === null,
    });

    return true;
  }

  /**
   * Focus next element in active zone
   */
  focusNext(): boolean {
    const zone = this.getActiveZone();
    if (!zone) return false;
    return this.focusNextInZone(zone.id);
  }

  /**
   * Focus previous element in active zone
   */
  focusPrevious(): boolean {
    const zone = this.getActiveZone();
    if (!zone) return false;
    return this.focusPreviousInZone(zone.id);
  }

  /**
   * Focus next element in specific zone
   */
  focusNextInZone(zoneId: string): boolean {
    const zone = this.zones.get(zoneId);
    if (!zone || zone.order.length === 0) return false;

    const currentIndex = zone.activeId ? zone.order.indexOf(zone.activeId) : -1;
    let nextIndex = currentIndex + 1;

    if (nextIndex >= zone.order.length) {
      if (zone.options.wrap) {
        nextIndex = 0;
      } else if (zone.options.trap) {
        return false; // Can't go further, trapped
      } else {
        // Try parent zone
        if (zone.parentId) {
          return this.focusNextInZone(zone.parentId);
        }
        return false;
      }
    }

    return this.focusElement(zone.order[nextIndex]!, zoneId);
  }

  /**
   * Focus previous element in specific zone
   */
  focusPreviousInZone(zoneId: string): boolean {
    const zone = this.zones.get(zoneId);
    if (!zone || zone.order.length === 0) return false;

    const currentIndex = zone.activeId ? zone.order.indexOf(zone.activeId) : zone.order.length;
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      if (zone.options.wrap) {
        prevIndex = zone.order.length - 1;
      } else if (zone.options.trap) {
        return false; // Can't go further, trapped
      } else {
        // Try parent zone
        if (zone.parentId) {
          return this.focusPreviousInZone(zone.parentId);
        }
        return false;
      }
    }

    return this.focusElement(zone.order[prevIndex]!, zoneId);
  }

  /**
   * Focus first element in zone
   */
  focusFirst(zoneId?: string): boolean {
    const zone = zoneId ? this.zones.get(zoneId) : this.getActiveZone();
    if (!zone || zone.order.length === 0) return false;
    return this.focusElement(zone.order[0]!, zone.id);
  }

  /**
   * Focus last element in zone
   */
  focusLast(zoneId?: string): boolean {
    const zone = zoneId ? this.zones.get(zoneId) : this.getActiveZone();
    if (!zone || zone.order.length === 0) return false;
    return this.focusElement(zone.order[zone.order.length - 1]!, zone.id);
  }

  /**
   * Blur current focus
   */
  blur(zoneId?: string): void {
    const zone = zoneId ? this.zones.get(zoneId) : this.getActiveZone();
    if (!zone || !zone.activeId) return;

    const element = zone.elements.get(zone.activeId);
    element?.onFocus?.(false);

    zone.previousActiveId = zone.activeId;
    zone.activeId = null;

    this.notifyFocusChange({
      elementId: null,
      previousElementId: zone.previousActiveId,
      zoneId: zone.id,
      isInitial: false,
    });
  }

  // ===========================================================================
  // Focus Queries
  // ===========================================================================

  /**
   * Get currently focused element ID
   */
  getActiveId(zoneId?: string): string | null {
    const zone = zoneId ? this.zones.get(zoneId) : this.getActiveZone();
    return zone?.activeId ?? null;
  }

  /**
   * Get focused element
   */
  getActiveElement(zoneId?: string): FocusableElement | null {
    const zone = zoneId ? this.zones.get(zoneId) : this.getActiveZone();
    if (!zone?.activeId) return null;
    return zone.elements.get(zone.activeId) ?? null;
  }

  /**
   * Check if element is focused
   */
  isFocused(elementId: string, zoneId?: string): boolean {
    const zone = zoneId ? this.zones.get(zoneId) : this.getActiveZone();
    return zone?.activeId === elementId;
  }

  /**
   * Get all focusable elements in order
   */
  getFocusOrder(zoneId?: string): string[] {
    const zone = zoneId ? this.zones.get(zoneId) : this.getActiveZone();
    return zone?.order ?? [];
  }

  /**
   * Get focus stack depth
   */
  getStackDepth(): number {
    return this.stack.length;
  }

  // ===========================================================================
  // Event Listeners
  // ===========================================================================

  /**
   * Add focus change listener
   */
  onFocusChange(listener: (event: FocusZoneEventData) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyFocusChange(event: FocusZoneEventData): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in focus change listener:', error);
      }
    }
  }

  // ===========================================================================
  // Group Navigation
  // ===========================================================================

  /**
   * Focus first element in a group
   */
  focusGroup(groupId: string, zoneId?: string): boolean {
    const zone = zoneId ? this.zones.get(zoneId) : this.getActiveZone();
    if (!zone) return false;

    for (const id of zone.order) {
      const element = zone.elements.get(id);
      if (element?.group === groupId) {
        return this.focusElement(id, zone.id);
      }
    }
    return false;
  }

  /**
   * Focus next group
   */
  focusNextGroup(zoneId?: string): boolean {
    const zone = zoneId ? this.zones.get(zoneId) : this.getActiveZone();
    if (!zone) return false;

    const currentElement = zone.activeId ? zone.elements.get(zone.activeId) : null;
    const currentGroup = currentElement?.group;

    // Find next element in different group
    const currentIndex = zone.activeId ? zone.order.indexOf(zone.activeId) : -1;
    for (let i = currentIndex + 1; i < zone.order.length; i++) {
      const element = zone.elements.get(zone.order[i]!);
      if (element?.group !== currentGroup) {
        return this.focusElement(zone.order[i]!, zone.id);
      }
    }

    // Wrap if enabled
    if (zone.options.wrap) {
      for (let i = 0; i <= currentIndex; i++) {
        const element = zone.elements.get(zone.order[i]!);
        if (element?.group !== currentGroup) {
          return this.focusElement(zone.order[i]!, zone.id);
        }
      }
    }

    return false;
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Get the focus zone manager
 */
export function getFocusZoneManager(): FocusZoneManager {
  return FocusZoneManager.getInstance();
}

/**
 * Reset focus zone manager (for testing)
 */
export function resetFocusZoneManager(): void {
  FocusZoneManager.reset();
}

// =============================================================================
// FocusZone Component Helper
// =============================================================================

/** Focus zone component options */
export interface FocusZoneComponentOptions extends FocusZoneOptions {
  /** Children to render */
  children?: VNode[];
  /** Callback when zone is activated */
  onActivate?: () => void;
  /** Callback when zone is deactivated */
  onDeactivate?: () => void;
}

/**
 * Create a focus zone scope
 *
 * Use this to create isolated focus regions (modals, panels, etc.)
 */
export function createFocusZone(options: FocusZoneOptions = {}): {
  zoneId: string;
  activate: () => void;
  deactivate: () => void;
  destroy: () => void;
  focusFirst: () => boolean;
  focusLast: () => boolean;
} {
  const manager = getFocusZoneManager();
  const zoneId = manager.createZone(options);

  return {
    zoneId,
    activate: () => manager.activateZone(zoneId),
    deactivate: () => manager.deactivateZone(zoneId),
    destroy: () => manager.destroyZone(zoneId),
    focusFirst: () => manager.focusFirst(zoneId),
    focusLast: () => manager.focusLast(zoneId),
  };
}

// =============================================================================
// Focus Trap Helper
// =============================================================================

/**
 * Create a focus trap
 *
 * A focus trap keeps focus within a region, wrapping at boundaries.
 * Useful for modals and dialogs.
 */
export function createFocusTrap(options: Omit<FocusZoneOptions, 'trap'> = {}): {
  zoneId: string;
  activate: () => void;
  deactivate: () => void;
  destroy: () => void;
} {
  const manager = getFocusZoneManager();
  const zoneId = manager.createZone({
    ...options,
    trap: true,
    wrap: true,
  });

  return {
    zoneId,
    activate: () => manager.activateZone(zoneId),
    deactivate: () => manager.deactivateZone(zoneId),
    destroy: () => manager.destroyZone(zoneId),
  };
}

// =============================================================================
// Programmatic Focus Utilities
// =============================================================================

/**
 * Focus an element by ID
 */
export function focusElement(elementId: string): boolean {
  return getFocusZoneManager().focusElement(elementId);
}

/**
 * Focus next focusable element
 */
export function focusNext(): boolean {
  return getFocusZoneManager().focusNext();
}

/**
 * Focus previous focusable element
 */
export function focusPrevious(): boolean {
  return getFocusZoneManager().focusPrevious();
}

/**
 * Focus first focusable element
 */
export function focusFirst(): boolean {
  return getFocusZoneManager().focusFirst();
}

/**
 * Focus last focusable element
 */
export function focusLast(): boolean {
  return getFocusZoneManager().focusLast();
}

/**
 * Blur current focus
 */
export function blurFocus(): void {
  getFocusZoneManager().blur();
}

/**
 * Get currently focused element ID
 */
export function getActiveId(): string | null {
  return getFocusZoneManager().getActiveId();
}

/**
 * Check if element is focused
 */
export function isFocused(elementId: string): boolean {
  return getFocusZoneManager().isFocused(elementId);
}

/**
 * Register a focusable element
 */
export function registerFocusable(
  elementId: string,
  options?: Partial<FocusableElement> & { zoneId?: string }
): () => void {
  const manager = getFocusZoneManager();
  manager.registerElement(elementId, options?.zoneId, options);
  return () => manager.unregisterElement(elementId, options?.zoneId);
}

/**
 * Add focus change listener
 */
export function onFocusChange(listener: (event: FocusZoneEventData) => void): () => void {
  return getFocusZoneManager().onFocusChange(listener);
}
