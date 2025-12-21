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
}

let state: OverlayManagerState = {
  layers: new Map(),
  nextZIndex: 100,
  terminalSize: { width: 80, height: 24 },
};

let idCounter = 0;

/**
 * Generate unique overlay ID
 */
function generateId(prefix = 'overlay'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Reset overlay manager state (for testing)
 */
export function resetOverlayManager(): void {
  // Clear all timers
  for (const layer of state.layers.values()) {
    if (layer.dismissTimer) {
      clearTimeout(layer.dismissTimer);
    }
  }

  state = {
    layers: new Map(),
    nextZIndex: 100,
    terminalSize: { width: 80, height: 24 },
  };
  idCounter = 0;
}

/**
 * Set terminal size for overlay calculations
 */
export function setOverlayTerminalSize(width: number, height: number): void {
  state.terminalSize = { width, height };
}

/**
 * Get terminal size
 */
export function getOverlayTerminalSize(): { width: number; height: number } {
  return { ...state.terminalSize };
}

// =============================================================================
// Layer Management
// =============================================================================

/**
 * Add overlay layer
 */
export function addLayer(layer: Omit<OverlayLayer, 'zIndex'> & { zIndex?: number }): OverlayLayer {
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
  return state.layers.get(id);
}

/**
 * Get all layers sorted by z-index (ascending)
 */
export function getLayers(): OverlayLayer[] {
  return Array.from(state.layers.values()).sort((a, b) => a.zIndex - b.zIndex);
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
  return state.layers.size;
}

/**
 * Check if layer exists
 */
export function hasLayer(id: string): boolean {
  return state.layers.has(id);
}

// =============================================================================
// Modal
// =============================================================================

/**
 * Show modal dialog
 */
export function showModal(options: ModalOptions): string {
  const id = options.id ?? generateId('modal');

  // Calculate position
  let position: OverlayPosition;
  if (options.position === 'center' || !options.position) {
    const width = options.size?.width ?? 40;
    const height = options.content.length + (options.title ? 2 : 0) + 2; // Add border

    position = {
      x: Math.floor((state.terminalSize.width - width) / 2),
      y: Math.floor((state.terminalSize.height - height) / 2),
    };
  } else {
    position = options.position;
  }

  // Create content function
  const contentFn =
    typeof options.content === 'function'
      ? options.content
      : () => buildModalContent(options.title, options.content as string[], options.size?.width);

  addLayer({
    id,
    type: 'modal',
    position,
    size: options.size ?? {},
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
  const contentWidth = width ?? Math.max(...content.map((l) => l.length), title?.length ?? 0) + 4;
  const innerWidth = contentWidth - 2;
  const lines: string[] = [];

  // Top border with title
  if (title) {
    const titlePadded = ` ${title} `;
    const remaining = innerWidth - titlePadded.length;
    const left = Math.floor(remaining / 2);
    const right = remaining - left;
    lines.push('┌' + '─'.repeat(left) + titlePadded + '─'.repeat(right) + '┐');
  } else {
    lines.push('┌' + '─'.repeat(innerWidth) + '┐');
  }

  // Content
  for (const line of content) {
    const padded = line.padEnd(innerWidth);
    lines.push('│' + padded.slice(0, innerWidth) + '│');
  }

  // Bottom border
  lines.push('└' + '─'.repeat(innerWidth) + '┘');

  return lines;
}

// =============================================================================
// Toast
// =============================================================================

/** Toast queue for stacking */
let toastQueue: string[] = [];

/**
 * Show toast notification
 */
export function showToast(options: ToastOptions): string {
  const id = options.id ?? generateId('toast');
  const duration = options.duration ?? 3000;
  const position = options.position ?? 'bottom-right';

  // Calculate position based on anchor and existing toasts
  const toastIndex = toastQueue.length;
  const { x, y } = calculateToastPosition(position, toastIndex, options.message.length + 4);

  // Build toast content
  const content = buildToastContent(options.message, options.type, options.dismissible);

  addLayer({
    id,
    type: 'toast',
    position: { x, y },
    size: { width: options.message.length + 4 },
    content: () => content,
    visible: true,
    backdrop: false,
    autoDismiss: duration,
    onDismiss: () => {
      // Remove from queue
      toastQueue = toastQueue.filter((tid) => tid !== id);
      options.onDismiss?.();
    },
  });

  toastQueue.push(id);
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
  const toasts = getLayers().filter((l) => l.type === 'toast');
  for (const toast of toasts) {
    removeLayer(toast.id);
  }
  toastQueue = [];
}

/**
 * Calculate toast position
 */
function calculateToastPosition(
  anchor: AnchorPosition,
  index: number,
  width: number
): OverlayPosition {
  const { width: termWidth, height: termHeight } = state.terminalSize;
  const offset = index * 3; // Stack toasts vertically

  switch (anchor) {
    case 'top':
      return { x: Math.floor((termWidth - width) / 2), y: 1 + offset };
    case 'top-left':
      return { x: 1, y: 1 + offset };
    case 'top-right':
      return { x: termWidth - width - 1, y: 1 + offset };
    case 'bottom':
      return { x: Math.floor((termWidth - width) / 2), y: termHeight - 3 - offset };
    case 'bottom-left':
      return { x: 1, y: termHeight - 3 - offset };
    case 'bottom-right':
    default:
      return { x: termWidth - width - 1, y: termHeight - 3 - offset };
    case 'center':
      return { x: Math.floor((termWidth - width) / 2), y: Math.floor(termHeight / 2) };
    case 'left':
      return { x: 1, y: Math.floor(termHeight / 2) + offset };
    case 'right':
      return { x: termWidth - width - 1, y: Math.floor(termHeight / 2) + offset };
  }
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
  const content = `${icon} ${message}${dismissBtn}`;

  return [`╭${'─'.repeat(content.length)}╮`, `│${content}│`, `╰${'─'.repeat(content.length)}╯`];
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
    Math.max(...content.map((l) => l.length)),
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

/** Active tooltip ID */
let activeTooltip: string | null = null;
let tooltipTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Show tooltip
 */
export function showTooltip(options: TooltipOptions): string {
  // Clear any pending tooltip
  hideTooltip();

  const id = generateId('tooltip');
  const delay = options.delay ?? 500;

  const show = () => {
    const lines = wrapText(options.text, options.maxWidth ?? 40);
    const width = Math.max(...lines.map((l) => l.length)) + 2;
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

    activeTooltip = id;
  };

  if (delay > 0) {
    tooltipTimer = setTimeout(show, delay);
  } else {
    show();
  }

  return id;
}

/**
 * Hide tooltip
 */
export function hideTooltip(): void {
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }

  if (activeTooltip) {
    removeLayer(activeTooltip);
    activeTooltip = null;
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
    x = termWidth - width;
  }

  return { x, y };
}

/**
 * Build tooltip content with border
 */
function buildTooltipContent(lines: string[]): string[] {
  const width = Math.max(...lines.map((l) => l.length));
  const result: string[] = [];

  result.push('╭' + '─'.repeat(width) + '╮');
  for (const line of lines) {
    result.push('│' + line.padEnd(width) + '│');
  }
  result.push('╰' + '─'.repeat(width) + '╯');

  return result;
}

/**
 * Simple text wrapping
 */
function wrapText(text: string, maxWidth: number): string[] {
  if (text.length <= maxWidth) {
    return [text];
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
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
  const maxLabelLen = Math.max(
    minWidth ?? 0,
    ...items.map((item) => {
      if (item.separator) return 0;
      const iconLen = item.icon ? 2 : 0;
      const shortcutLen = item.shortcut ? item.shortcut.length + 2 : 0;
      return iconLen + item.label.length + shortcutLen;
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
      const icon = item.icon ? item.icon + ' ' : '';
      const shortcut = item.shortcut ? ` ${item.shortcut}` : '';
      const label = icon + item.label;
      const padding = width - label.length - shortcut.length - 2;

      let line = prefix + label + ' '.repeat(Math.max(0, padding)) + shortcut;

      if (item.disabled) {
        // Could add dim styling marker
        line = '  ' + label.slice(0, width - 2);
      }

      lines.push('│' + line.slice(0, width) + '│');
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
    const width = Math.max(...content.map((l) => l.length));
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
  // First try to close tooltip
  if (activeTooltip) {
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
