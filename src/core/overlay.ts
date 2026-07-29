/**
 * Overlay System
 *
 * Features:
 * - Layer stack management with z-index ordering
 * - Modal dialogs with backdrop
 * - Toast notifications with auto-dismiss
 * - Popup menus and dropdowns
 * - Tooltips with positioning
 * - Focus trap integration
 *
 * 
 */

import {
  getDefaultRuntimeResource,
  getDefaultRuntimeScope,
  getRuntimeResource,
  getRuntimeScope,
  RUNTIME_RESOURCE_DISPOSE,
  type RuntimeScope,
} from './runtime-scope.js';
import {
  padTextToWidth,
  stringWidth,
  truncateText,
  wrapText as wrapTextByColumns,
} from '../utils/text-utils.js';
import { sanitizeInlineInput } from '../utils/terminal-sanitize.js';

// =============================================================================
// Types
// =============================================================================

/** Overlay layer type */
export type OverlayType = 'modal' | 'toast' | 'popup' | 'tooltip' | 'menu' | 'custom';

/** Position for overlays */
export interface OverlayPosition {
  x: number;
  y: number;
}

/** Anchor position for relative positioning */
export type AnchorPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

/** Size constraints */
export interface OverlaySize {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/** Overlay layer */
export interface OverlayLayer {
  /** Unique layer ID */
  id: string;
  /** Layer type */
  type: OverlayType;
  /** Z-index for stacking order */
  zIndex: number;
  /** Position on screen */
  position: OverlayPosition;
  /** Size constraints */
  size: OverlaySize;
  /** Content to render (callback returning string lines) */
  content: () => string[];
  /** Whether layer is visible */
  visible: boolean;
  /** Whether to show backdrop */
  backdrop?: boolean;
  /** Backdrop opacity (0-1) */
  backdropOpacity?: number;
  /** Whether to trap focus */
  trapFocus?: boolean;
  /** Auto-dismiss timeout (ms) */
  autoDismiss?: number;
  /** Dismiss timer handle */
  dismissTimer?: ReturnType<typeof setTimeout>;
  /** Callback when layer is dismissed */
  onDismiss?: () => void;
  /** Custom data */
  data?: unknown;
}

/** Modal options */
export interface ModalOptions {
  /** Modal ID (auto-generated if not provided) */
  id?: string;
  /** Modal title */
  title?: string;
  /** Modal content lines */
  content: string[] | (() => string[]);
  /** Position (default: center) */
  position?: 'center' | OverlayPosition;
  /** Size constraints */
  size?: OverlaySize;
  /** Show backdrop (default: true) */
  backdrop?: boolean;
  /** Trap focus (default: true) */
  trapFocus?: boolean;
  /** Close on backdrop click (default: true) */
  closeOnBackdrop?: boolean;
  /** Close on escape key (default: true) */
  closeOnEscape?: boolean;
  /** Callback when closed */
  onClose?: () => void;
  /** Z-index (default: auto) */
  zIndex?: number;
}

/** Toast options */
export interface ToastOptions {
  /** Toast message */
  message: string;
  /** Toast type for styling */
  type?: 'info' | 'success' | 'warning' | 'error';
  /** Duration in ms (default: 3000) */
  duration?: number;
  /** Position (default: bottom-right) */
  position?: AnchorPosition;
  /** Toast ID */
  id?: string;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

/** Popup options */
export interface PopupOptions {
  /** Popup ID */
  id?: string;
  /** Content lines */
  content: string[] | (() => string[]);
  /** Anchor position relative to target */
  anchor?: AnchorPosition;
  /** Target position to anchor to */
  target: OverlayPosition;
  /** Offset from target */
  offset?: { x?: number; y?: number };
  /** Auto-close when clicking outside */
  closeOnClickOutside?: boolean;
  /** Callback when closed */
  onClose?: () => void;
}

/** Tooltip options */
export interface TooltipOptions {
  /** Tooltip text */
  text: string;
  /** Target position */
  target: OverlayPosition;
  /** Preferred position (default: top) */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing (ms) */
  delay?: number;
  /** Max width for wrapping */
  maxWidth?: number;
}

/** Menu item */
export interface MenuItem {
  /** Item label */
  label: string;
  /** Item value (returned on selection) */
  value?: string;
  /** Shortcut key display */
  shortcut?: string;
  /** Is item disabled */
  disabled?: boolean;
  /** Is separator */
  separator?: boolean;
  /** Submenu items */
  submenu?: MenuItem[];
  /** Icon character */
  icon?: string;
}

/** Menu options */
export interface MenuOptions {
  /** Menu items */
  items: MenuItem[];
  /** Menu position */
  position: OverlayPosition;
  /** Initial selected index */
  selectedIndex?: number;
  /** Callback when item selected */
  onSelect?: (item: MenuItem, index: number) => void;
  /** Callback when closed */
  onClose?: () => void;
  /** Min width */
  minWidth?: number;
}

// =============================================================================
// Overlay Manager
// =============================================================================

/** Overlay manager state */
interface OverlayManagerState {
  layers: Map<string, OverlayLayer>;
  nextZIndex: number;
  terminalSize: { width: number; height: number };
  idCounter: number;
  toastQueue: string[];
  activeTooltip: string | null;
  tooltipTimer: ReturnType<typeof setTimeout> | null;
  [RUNTIME_RESOURCE_DISPOSE](): void;
}

const OVERLAY_RUNTIME_STATE = Symbol('tuiuiu.overlay-runtime-state');

function clearOverlayTimers(state: OverlayManagerState): void {
  for (const layer of state.layers.values()) {
    if (layer.dismissTimer) clearTimeout(layer.dismissTimer);
  }
  if (state.tooltipTimer) clearTimeout(state.tooltipTimer);
  state.tooltipTimer = null;
}

function createOverlayRuntimeState(scope: RuntimeScope): OverlayManagerState {
  const defaults = scope.id === 0
    ? null
    : getDefaultRuntimeResource(
        OVERLAY_RUNTIME_STATE,
        () => createOverlayRuntimeState(getDefaultRuntimeScope()),
      );
  const state: OverlayManagerState = {
    layers: new Map(),
    nextZIndex: 100,
    terminalSize: {
      width: defaults?.terminalSize.width ?? 80,
      height: defaults?.terminalSize.height ?? 24,
    },
    idCounter: 0,
    toastQueue: [],
    activeTooltip: null,
    tooltipTimer: null,
    [RUNTIME_RESOURCE_DISPOSE]() {
      clearOverlayTimers(state);
      state.layers.clear();
      state.toastQueue = [];
      state.activeTooltip = null;
    },
  };
  return state;
}

function getOverlayRuntimeState(): OverlayManagerState {
  const scope = getRuntimeScope();
  return getRuntimeResource(
    OVERLAY_RUNTIME_STATE,
    () => createOverlayRuntimeState(scope),
    scope,
  );
}

/**
 * Generate unique overlay ID
 */
function generateId(prefix = 'overlay'): string {
  const state = getOverlayRuntimeState();
  return `${prefix}-${++state.idCounter}`;
}

/**
 * Reset overlay manager state (for testing)
 */
export function resetOverlayManager(): void {
  const state = getOverlayRuntimeState();
  clearOverlayTimers(state);
  state.layers.clear();
  state.nextZIndex = 100;
  state.terminalSize = { width: 80, height: 24 };
  state.idCounter = 0;
  state.toastQueue = [];
  state.activeTooltip = null;
}

/**
 * Set terminal size for overlay calculations
 */
export function setOverlayTerminalSize(width: number, height: number): void {
  const state = getOverlayRuntimeState();
  state.terminalSize = { width, height };
}

/**
 * Get terminal size
 */
export function getOverlayTerminalSize(): { width: number; height: number } {
  const state = getOverlayRuntimeState();
  return { ...state.terminalSize };
}

// =============================================================================
// Layer Management
// =============================================================================

/**
 * Add overlay layer
 */
export function addLayer(layer: Omit<OverlayLayer, 'zIndex'> & { zIndex?: number }): OverlayLayer {
  const state = getOverlayRuntimeState();
  const zIndex = layer.zIndex ?? state.nextZIndex++;

  const newLayer: OverlayLayer = {
    ...layer,
    zIndex,
    visible: layer.visible ?? true,
  };

  state.layers.set(layer.id, newLayer);

  // Set up auto-dismiss timer
  if (newLayer.autoDismiss && newLayer.autoDismiss > 0) {
    newLayer.dismissTimer = setTimeout(() => {
      removeLayer(newLayer.id);
    }, newLayer.autoDismiss);
  }

  return newLayer;
}

/**
 * Remove overlay layer
 */
export function removeLayer(id: string): boolean {
  const state = getOverlayRuntimeState();
  const layer = state.layers.get(id);

  if (!layer) {
    return false;
  }

  // Clear dismiss timer
  if (layer.dismissTimer) {
    clearTimeout(layer.dismissTimer);
  }

  // Call dismiss callback
  if (layer.onDismiss) {
    layer.onDismiss();
  }

  state.layers.delete(id);
  return true;
}

/**
 * Get layer by ID
 */
export function getLayer(id: string): OverlayLayer | undefined {
  return getOverlayRuntimeState().layers.get(id);
}

/**
 * Get all layers sorted by z-index (ascending)
 */
export function getLayers(): OverlayLayer[] {
  return Array.from(getOverlayRuntimeState().layers.values())
    .sort((a, b) => a.zIndex - b.zIndex);
}

/**
 * Get visible layers sorted by z-index
 */
export function getVisibleLayers(): OverlayLayer[] {
  return getLayers().filter((layer) => layer.visible);
}

/**
 * Get topmost layer
 */
export function getTopLayer(): OverlayLayer | undefined {
  const layers = getLayers();
  return layers[layers.length - 1];
}

/**
 * Check if any layer has backdrop
 */
export function hasBackdrop(): boolean {
  return getVisibleLayers().some((layer) => layer.backdrop);
}

/**
 * Update layer properties
 */
export function updateLayer(id: string, updates: Partial<OverlayLayer>): boolean {
  const state = getOverlayRuntimeState();
  const layer = state.layers.get(id);

  if (!layer) {
    return false;
  }

  Object.assign(layer, updates);
  return true;
}

/**
 * Show layer
 */
export function showLayer(id: string): boolean {
  return updateLayer(id, { visible: true });
}

/**
 * Hide layer
 */
export function hideLayer(id: string): boolean {
  return updateLayer(id, { visible: false });
}

/**
 * Bring layer to front
 */
export function bringToFront(id: string): boolean {
  const state = getOverlayRuntimeState();
  const layer = state.layers.get(id);

  if (!layer) {
    return false;
  }

  layer.zIndex = state.nextZIndex++;
  return true;
}

/**
 * Get layer count
 */
export function getLayerCount(): number {
  return getOverlayRuntimeState().layers.size;
}

/**
 * Check if layer exists
 */
export function hasLayer(id: string): boolean {
  return getOverlayRuntimeState().layers.has(id);
}

// =============================================================================
// Modal
// =============================================================================

/**
 * Show modal dialog
 */
export function showModal(options: ModalOptions): string {
  const state = getOverlayRuntimeState();
  const id = options.id ?? generateId('modal');
  const contentFn =
    typeof options.content === 'function'
      ? options.content
      : () => buildModalContent(options.title, options.content as string[], options.size?.width);
  const initialContent = contentFn();
  const contentWidth = Math.max(0, ...initialContent.map(stringWidth));
  const measuredWidth = Number.isFinite(options.size?.width)
    ? Math.max(0, Math.trunc(options.size!.width!))
    : contentWidth;
  const measuredHeight = Number.isFinite(options.size?.height)
    ? Math.max(0, Math.trunc(options.size!.height!))
    : initialContent.length;

  // Calculate position
  let position: OverlayPosition;
  if (options.position === 'center' || !options.position) {
    position = {
      x: Math.max(0, Math.floor((state.terminalSize.width - measuredWidth) / 2)),
      y: Math.max(0, Math.floor((state.terminalSize.height - measuredHeight) / 2)),
    };
  } else {
    position = options.position;
  }

  addLayer({
    id,
    type: 'modal',
    position,
    size: {
      ...options.size,
      width: measuredWidth,
      height: measuredHeight,
    },
    content: contentFn,
    visible: true,
    backdrop: options.backdrop ?? true,
    backdropOpacity: 0.5,
    trapFocus: options.trapFocus ?? true,
    zIndex: options.zIndex,
    onDismiss: options.onClose,
    data: {
      closeOnBackdrop: options.closeOnBackdrop ?? true,
      closeOnEscape: options.closeOnEscape ?? true,
    },
  });

  return id;
}

/**
 * Close modal
 */
export function closeModal(id: string): boolean {
  return removeLayer(id);
}

/**
 * Close topmost modal
 */
export function closeTopModal(): boolean {
  const modals = getLayers().filter((l) => l.type === 'modal' && l.visible);

  if (modals.length === 0) {
    return false;
  }

  const topModal = modals[modals.length - 1];
  return removeLayer(topModal.id);
}

/**
 * Build modal content with border
 */
function buildModalContent(
  title: string | undefined,
  content: string[],
  width?: number
): string[] {
  const safeTitle = title ? sanitizeInlineInput(title) : undefined;
  const safeContent = content.map(sanitizeInlineInput);
  const naturalWidth =
    Math.max(
      0,
      ...safeContent.map(stringWidth),
      safeTitle ? stringWidth(safeTitle) : 0,
    ) + 4;
  const contentWidth = Number.isFinite(width)
    ? Math.max(2, Math.trunc(width!))
    : naturalWidth;
  const innerWidth = contentWidth - 2;
  const lines: string[] = [];

  // Top border with title
  if (safeTitle) {
    const fittedTitle = truncateText(safeTitle, Math.max(0, innerWidth - 2), {
      truncationCharacter: '',
    });
    const titlePadded = innerWidth >= 2 ? ` ${fittedTitle} ` : '';
    const remaining = Math.max(0, innerWidth - stringWidth(titlePadded));
    const left = Math.floor(remaining / 2);
    const right = remaining - left;
    lines.push('┌' + '─'.repeat(left) + titlePadded + '─'.repeat(right) + '┐');
  } else {
    lines.push('┌' + '─'.repeat(innerWidth) + '┐');
  }

  // Content
  for (const line of safeContent) {
    lines.push('│' + padTextToWidth(line, innerWidth) + '│');
  }

  // Bottom border
  lines.push('└' + '─'.repeat(innerWidth) + '┘');

  return lines;
}

// =============================================================================
// Toast
// =============================================================================

/**
 * Show toast notification
 */
export function showToast(options: ToastOptions): string {
  const state = getOverlayRuntimeState();
  const id = options.id ?? generateId('toast');
  const duration = options.duration ?? 3000;
  const position = options.position ?? 'bottom-right';

  // Build toast content and calculate its terminal-column width.
  const content = buildToastContent(options.message, options.type, options.dismissible);
  const width = Math.max(0, ...content.map(stringWidth));

  // Calculate position based on anchor and existing toasts
  const toastIndex = state.toastQueue.length;
  const { x, y } = calculateToastPosition(position, toastIndex, width);

  addLayer({
    id,
    type: 'toast',
    position: { x, y },
    size: { width },
    content: () => content,
    visible: true,
    backdrop: false,
    autoDismiss: duration,
    onDismiss: () => {
      // Remove from queue
      state.toastQueue = state.toastQueue.filter((tid) => tid !== id);
      options.onDismiss?.();
    },
  });

  state.toastQueue.push(id);
  return id;
}

/**
 * Dismiss toast
 */
export function dismissToast(id: string): boolean {
  return removeLayer(id);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts(): void {
  const state = getOverlayRuntimeState();
  const toasts = getLayers().filter((l) => l.type === 'toast');
  for (const toast of toasts) {
    removeLayer(toast.id);
  }
  state.toastQueue = [];
}

/**
 * Calculate toast position
 */
function calculateToastPosition(
  anchor: AnchorPosition,
  index: number,
  width: number
): OverlayPosition {
  const state = getOverlayRuntimeState();
  const { width: termWidth, height: termHeight } = state.terminalSize;
  const offset = index * 3; // Stack toasts vertically

  let position: OverlayPosition;
  switch (anchor) {
    case 'top':
      position = { x: Math.floor((termWidth - width) / 2), y: 1 + offset };
      break;
    case 'top-left':
      position = { x: 1, y: 1 + offset };
      break;
    case 'top-right':
      position = { x: termWidth - width - 1, y: 1 + offset };
      break;
    case 'bottom':
      position = { x: Math.floor((termWidth - width) / 2), y: termHeight - 3 - offset };
      break;
    case 'bottom-left':
      position = { x: 1, y: termHeight - 3 - offset };
      break;
    case 'bottom-right':
    default:
      position = { x: termWidth - width - 1, y: termHeight - 3 - offset };
      break;
    case 'center':
      position = { x: Math.floor((termWidth - width) / 2), y: Math.floor(termHeight / 2) };
      break;
    case 'left':
      position = { x: 1, y: Math.floor(termHeight / 2) + offset };
      break;
    case 'right':
      position = { x: termWidth - width - 1, y: Math.floor(termHeight / 2) + offset };
      break;
  }

  return {
    x: Math.max(0, Math.min(position.x, Math.max(0, termWidth - width))),
    y: Math.max(0, Math.min(position.y, Math.max(0, termHeight - 3))),
  };
}

/**
 * Build toast content
 */
function buildToastContent(
  message: string,
  type?: string,
  dismissible?: boolean
): string[] {
  const icon = getToastIcon(type);
  const dismissBtn = dismissible ? ' ✕' : '';
  const content = `${icon} ${sanitizeInlineInput(message)}${dismissBtn}`;
  const width = stringWidth(content);

  return [`╭${'─'.repeat(width)}╮`, `│${content}│`, `╰${'─'.repeat(width)}╯`];
}

/**
 * Get toast icon based on type
 */
function getToastIcon(type?: string): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✗';
    case 'warning':
      return '⚠';
    case 'info':
    default:
      return 'ℹ';
  }
}

// =============================================================================
// Popup
// =============================================================================

/**
 * Show popup
 */
export function showPopup(options: PopupOptions): string {
  const id = options.id ?? generateId('popup');
  const anchor = options.anchor ?? 'bottom';
  const offset = options.offset ?? { x: 0, y: 0 };

  // Get content
  const content =
    typeof options.content === 'function' ? options.content() : options.content;

  // Calculate position based on anchor
  const position = calculateAnchoredPosition(
    options.target,
    anchor,
    Math.max(0, ...content.map(stringWidth)),
    content.length,
    offset.x ?? 0,
    offset.y ?? 0
  );

  const contentFn =
    typeof options.content === 'function'
      ? options.content
      : () => options.content as string[];

  addLayer({
    id,
    type: 'popup',
    position,
    size: {},
    content: contentFn,
    visible: true,
    backdrop: false,
    onDismiss: options.onClose,
    data: { closeOnClickOutside: options.closeOnClickOutside ?? true },
  });

  return id;
}

/**
 * Close popup
 */
export function closePopup(id: string): boolean {
  return removeLayer(id);
}

/**
 * Calculate anchored position
 */
function calculateAnchoredPosition(
  target: OverlayPosition,
  anchor: AnchorPosition,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number
): OverlayPosition {
  const state = getOverlayRuntimeState();
  let x = target.x + offsetX;
  let y = target.y + offsetY;

  switch (anchor) {
    case 'top':
      x = target.x - Math.floor(width / 2);
      y = target.y - height;
      break;
    case 'bottom':
      x = target.x - Math.floor(width / 2);
      y = target.y + 1;
      break;
    case 'left':
      x = target.x - width;
      y = target.y - Math.floor(height / 2);
      break;
    case 'right':
      x = target.x + 1;
      y = target.y - Math.floor(height / 2);
      break;
    case 'top-left':
      x = target.x - width;
      y = target.y - height;
      break;
    case 'top-right':
      x = target.x + 1;
      y = target.y - height;
      break;
    case 'bottom-left':
      x = target.x - width;
      y = target.y + 1;
      break;
    case 'bottom-right':
      x = target.x + 1;
      y = target.y + 1;
      break;
    case 'center':
      x = target.x - Math.floor(width / 2);
      y = target.y - Math.floor(height / 2);
      break;
  }

  // Clamp to screen bounds
  x = Math.max(0, Math.min(x, state.terminalSize.width - width));
  y = Math.max(0, Math.min(y, state.terminalSize.height - height));

  return { x: x + offsetX, y: y + offsetY };
}

// =============================================================================
// Tooltip
// =============================================================================

/**
 * Show tooltip
 */
export function showTooltip(options: TooltipOptions): string {
  const state = getOverlayRuntimeState();
  // Clear any pending tooltip
  hideTooltip();

  const id = generateId('tooltip');
  const delay = options.delay ?? 500;

  const show = () => {
    const maxWidth = Number.isFinite(options.maxWidth)
      ? Math.max(1, Math.trunc(options.maxWidth!))
      : 40;
    const lines = wrapTextByColumns(
      sanitizeInlineInput(options.text),
      maxWidth,
    ).split('\n');
    const width = Math.max(0, ...lines.map(stringWidth)) + 2;
    const height = lines.length + 2;

    const position = calculateTooltipPosition(
      options.target,
      options.position ?? 'top',
      width,
      height
    );

    addLayer({
      id,
      type: 'tooltip',
      position,
      size: { width, height },
      content: () => buildTooltipContent(lines),
      visible: true,
      backdrop: false,
    });

    state.activeTooltip = id;
  };

  if (delay > 0) {
    state.tooltipTimer = setTimeout(show, delay);
  } else {
    show();
  }

  return id;
}

/**
 * Hide tooltip
 */
export function hideTooltip(): void {
  const state = getOverlayRuntimeState();
  if (state.tooltipTimer) {
    clearTimeout(state.tooltipTimer);
    state.tooltipTimer = null;
  }

  if (state.activeTooltip) {
    removeLayer(state.activeTooltip);
    state.activeTooltip = null;
  }
}

/**
 * Calculate tooltip position
 */
function calculateTooltipPosition(
  target: OverlayPosition,
  preferred: 'top' | 'bottom' | 'left' | 'right',
  width: number,
  height: number
): OverlayPosition {
  const state = getOverlayRuntimeState();
  const { width: termWidth, height: termHeight } = state.terminalSize;
  let x: number;
  let y: number;

  switch (preferred) {
    case 'top':
      x = target.x - Math.floor(width / 2);
      y = target.y - height;
      break;
    case 'bottom':
      x = target.x - Math.floor(width / 2);
      y = target.y + 1;
      break;
    case 'left':
      x = target.x - width - 1;
      y = target.y - Math.floor(height / 2);
      break;
    case 'right':
      x = target.x + 1;
      y = target.y - Math.floor(height / 2);
      break;
  }

  // Flip if would go off screen
  if (y < 0 && preferred === 'top') {
    y = target.y + 1;
  } else if (y + height > termHeight && preferred === 'bottom') {
    y = target.y - height;
  }

  if (x < 0) {
    x = 0;
  } else if (x + width > termWidth) {
    x = Math.max(0, termWidth - width);
  }

  return { x, y };
}

/**
 * Build tooltip content with border
 */
function buildTooltipContent(lines: string[]): string[] {
  const width = Math.max(0, ...lines.map(stringWidth));
  const result: string[] = [];

  result.push('╭' + '─'.repeat(width) + '╮');
  for (const line of lines) {
    result.push('│' + padTextToWidth(line, width) + '│');
  }
  result.push('╰' + '─'.repeat(width) + '╯');

  return result;
}

// =============================================================================
// Menu
// =============================================================================

/**
 * Show context menu
 */
export function showMenu(options: MenuOptions): string {
  const id = generateId('menu');

  const content = buildMenuContent(options.items, options.minWidth, options.selectedIndex);

  addLayer({
    id,
    type: 'menu',
    position: options.position,
    size: {},
    content: () => content,
    visible: true,
    backdrop: false,
    trapFocus: true,
    onDismiss: options.onClose,
    data: {
      items: options.items,
      selectedIndex: options.selectedIndex ?? 0,
      onSelect: options.onSelect,
    },
  });

  return id;
}

/**
 * Close menu
 */
export function closeMenu(id: string): boolean {
  return removeLayer(id);
}

/**
 * Update menu selection
 */
export function updateMenuSelection(id: string, selectedIndex: number): boolean {
  const layer = getLayer(id);
  if (!layer || layer.type !== 'menu') {
    return false;
  }

  const data = layer.data as {
    items: MenuItem[];
    selectedIndex: number;
    onSelect?: (item: MenuItem, index: number) => void;
  };

  data.selectedIndex = selectedIndex;

  // Rebuild content
  layer.content = () => buildMenuContent(data.items, undefined, selectedIndex);

  return true;
}

/**
 * Select menu item
 */
export function selectMenuItem(id: string): MenuItem | undefined {
  const layer = getLayer(id);
  if (!layer || layer.type !== 'menu') {
    return undefined;
  }

  const data = layer.data as {
    items: MenuItem[];
    selectedIndex: number;
    onSelect?: (item: MenuItem, index: number) => void;
  };

  const item = data.items[data.selectedIndex];
  if (item && !item.disabled && !item.separator) {
    data.onSelect?.(item, data.selectedIndex);
    closeMenu(id);
    return item;
  }

  return undefined;
}

/**
 * Build menu content
 */
function buildMenuContent(
  items: MenuItem[],
  minWidth?: number,
  selectedIndex = 0
): string[] {
  const safeMinWidth = Number.isFinite(minWidth)
    ? Math.max(0, Math.trunc(minWidth!))
    : 0;
  const maxLabelLen = Math.max(
    safeMinWidth,
    ...items.map((item) => {
      if (item.separator) return 0;
      const icon = item.icon ? `${sanitizeInlineInput(item.icon)} ` : '';
      const label = sanitizeInlineInput(item.label);
      const shortcut = item.shortcut
        ? ` ${sanitizeInlineInput(item.shortcut)}`
        : '';
      return stringWidth(icon + label + shortcut);
    })
  );

  const width = maxLabelLen + 4;
  const lines: string[] = [];

  lines.push('┌' + '─'.repeat(width) + '┐');

  let itemIndex = 0;
  for (const item of items) {
    if (item.separator) {
      lines.push('├' + '─'.repeat(width) + '┤');
    } else {
      const isSelected = itemIndex === selectedIndex;
      const prefix = isSelected ? '▸ ' : '  ';
      const icon = item.icon ? sanitizeInlineInput(item.icon) + ' ' : '';
      const shortcut = item.shortcut
        ? ` ${sanitizeInlineInput(item.shortcut)}`
        : '';
      const label = icon + sanitizeInlineInput(item.label);
      const padding = width - stringWidth(label) - stringWidth(shortcut) - 2;

      let line = prefix + label + ' '.repeat(Math.max(0, padding)) + shortcut;

      if (item.disabled) {
        // Could add dim styling marker
        line = '  ' + truncateText(label, Math.max(0, width - 2), {
          truncationCharacter: '',
        });
      }

      lines.push('│' + padTextToWidth(line, width) + '│');
      itemIndex++;
    }
  }

  lines.push('└' + '─'.repeat(width) + '┘');

  return lines;
}

// =============================================================================
// Rendering
// =============================================================================

/**
 * Render all visible overlays onto a buffer
 * Returns array of { x, y, line } for each overlay line
 */
export function renderOverlays(): Array<{ x: number; y: number; line: string }> {
  const result: Array<{ x: number; y: number; line: string }> = [];
  const layers = getVisibleLayers();

  for (const layer of layers) {
    // Render backdrop if present
    if (layer.backdrop) {
      // Backdrop would be rendered differently in actual terminal
      // Here we just note it exists
    }

    // Get content
    const content = layer.content();

    // Add each line with position
    for (let i = 0; i < content.length; i++) {
      result.push({
        x: layer.position.x,
        y: layer.position.y + i,
        line: content[i],
      });
    }
  }

  return result;
}

/**
 * Check if point is inside any overlay
 */
export function isPointInOverlay(x: number, y: number): OverlayLayer | undefined {
  const layers = getVisibleLayers().reverse(); // Check top-to-bottom

  for (const layer of layers) {
    const content = layer.content();
    const width = Math.max(0, ...content.map(stringWidth));
    const height = content.length;

    if (
      x >= layer.position.x &&
      x < layer.position.x + width &&
      y >= layer.position.y &&
      y < layer.position.y + height
    ) {
      return layer;
    }
  }

  return undefined;
}

/**
 * Handle click at position
 * Returns true if click was handled by an overlay
 */
export function handleOverlayClick(x: number, y: number): boolean {
  const layer = isPointInOverlay(x, y);

  if (!layer) {
    // Click was outside all overlays
    // Check if any overlay should close on outside click
    const popups = getVisibleLayers().filter((l) => {
      const data = l.data as { closeOnClickOutside?: boolean } | undefined;
      return data?.closeOnClickOutside;
    });

    for (const popup of popups) {
      removeLayer(popup.id);
    }

    // Close modals if backdrop was clicked
    const modals = getVisibleLayers().filter((l) => {
      return l.type === 'modal' && l.backdrop;
    });

    for (const modal of modals) {
      const data = modal.data as { closeOnBackdrop?: boolean } | undefined;
      if (data?.closeOnBackdrop) {
        removeLayer(modal.id);
      }
    }

    return popups.length > 0 || modals.length > 0;
  }

  return true;
}

/**
 * Handle escape key
 * Returns true if escape was handled
 */
export function handleOverlayEscape(): boolean {
  const state = getOverlayRuntimeState();
  // First try to close tooltip
  if (state.activeTooltip) {
    hideTooltip();
    return true;
  }

  // Then try menus
  const menus = getVisibleLayers().filter((l) => l.type === 'menu');
  if (menus.length > 0) {
    removeLayer(menus[menus.length - 1].id);
    return true;
  }

  // Then popups
  const popups = getVisibleLayers().filter((l) => l.type === 'popup');
  if (popups.length > 0) {
    removeLayer(popups[popups.length - 1].id);
    return true;
  }

  // Finally modals (if closeOnEscape is enabled)
  const modals = getVisibleLayers().filter((l) => {
    if (l.type !== 'modal') return false;
    const data = l.data as { closeOnEscape?: boolean } | undefined;
    return data?.closeOnEscape;
  });

  if (modals.length > 0) {
    removeLayer(modals[modals.length - 1].id);
    return true;
  }

  return false;
}
