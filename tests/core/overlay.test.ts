/**
 * Overlay System Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  resetOverlayManager,
  setOverlayTerminalSize,
  getOverlayTerminalSize,
  addLayer,
  removeLayer,
  getLayer,
  getLayers,
  getVisibleLayers,
  getTopLayer,
  hasBackdrop,
  updateLayer,
  showLayer,
  hideLayer,
  bringToFront,
  getLayerCount,
  hasLayer,
  showModal,
  closeModal,
  closeTopModal,
  showToast,
  dismissToast,
  dismissAllToasts,
  showPopup,
  closePopup,
  showTooltip,
  hideTooltip,
  showMenu,
  closeMenu,
  updateMenuSelection,
  selectMenuItem,
  renderOverlays,
  isPointInOverlay,
  handleOverlayClick,
  handleOverlayEscape,
} from '../../src/core/overlay.js';

// =============================================================================
// Test Setup
// =============================================================================

beforeEach(() => {
  resetOverlayManager();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// =============================================================================
// Overlay Manager
// =============================================================================

describe('Overlay Manager', () => {
  it('should set terminal size', () => {
    setOverlayTerminalSize(100, 50);
    const size = getOverlayTerminalSize();

    expect(size.width).toBe(100);
    expect(size.height).toBe(50);
  });

  it('should reset manager state', () => {
    addLayer({
      id: 'test',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => ['test'],
      visible: true,
    });

    expect(getLayerCount()).toBe(1);

    resetOverlayManager();

    expect(getLayerCount()).toBe(0);
  });
});

// =============================================================================
// Layer Management
// =============================================================================

describe('Layer Management', () => {
  it('should add layer', () => {
    const layer = addLayer({
      id: 'layer1',
      type: 'custom',
      position: { x: 10, y: 5 },
      size: { width: 20 },
      content: () => ['Hello'],
      visible: true,
    });

    expect(layer.id).toBe('layer1');
    expect(layer.zIndex).toBeGreaterThan(0);
    expect(getLayerCount()).toBe(1);
  });

  it('should remove layer', () => {
    addLayer({
      id: 'layer1',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
    });

    expect(getLayerCount()).toBe(1);

    const removed = removeLayer('layer1');

    expect(removed).toBe(true);
    expect(getLayerCount()).toBe(0);
  });

  it('should return false when removing non-existent layer', () => {
    const removed = removeLayer('nonexistent');
    expect(removed).toBe(false);
  });

  it('should get layer by ID', () => {
    addLayer({
      id: 'myLayer',
      type: 'popup',
      position: { x: 5, y: 5 },
      size: {},
      content: () => ['content'],
      visible: true,
    });

    const layer = getLayer('myLayer');

    expect(layer).toBeDefined();
    expect(layer?.type).toBe('popup');
  });

  it('should get all layers sorted by z-index', () => {
    addLayer({
      id: 'low',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
      zIndex: 10,
    });

    addLayer({
      id: 'high',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
      zIndex: 50,
    });

    const layers = getLayers();

    expect(layers[0].id).toBe('low');
    expect(layers[1].id).toBe('high');
  });

  it('should get visible layers only', () => {
    addLayer({
      id: 'visible',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
    });

    addLayer({
      id: 'hidden',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: false,
    });

    const visible = getVisibleLayers();

    expect(visible.length).toBe(1);
    expect(visible[0].id).toBe('visible');
  });

  it('should get top layer', () => {
    addLayer({
      id: 'first',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
    });

    addLayer({
      id: 'second',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
    });

    const top = getTopLayer();

    expect(top?.id).toBe('second');
  });

  it('should check for backdrop', () => {
    expect(hasBackdrop()).toBe(false);

    addLayer({
      id: 'modal',
      type: 'modal',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
      backdrop: true,
    });

    expect(hasBackdrop()).toBe(true);
  });

  it('should update layer properties', () => {
    addLayer({
      id: 'layer',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
    });

    const updated = updateLayer('layer', { position: { x: 10, y: 10 } });

    expect(updated).toBe(true);
    expect(getLayer('layer')?.position).toEqual({ x: 10, y: 10 });
  });

  it('should show/hide layer', () => {
    addLayer({
      id: 'layer',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: false,
    });

    expect(getLayer('layer')?.visible).toBe(false);

    showLayer('layer');
    expect(getLayer('layer')?.visible).toBe(true);

    hideLayer('layer');
    expect(getLayer('layer')?.visible).toBe(false);
  });

  it('should bring layer to front', () => {
    addLayer({
      id: 'back',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
    });

    addLayer({
      id: 'front',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
    });

    bringToFront('back');

    const top = getTopLayer();
    expect(top?.id).toBe('back');
  });

  it('should check if layer exists', () => {
    addLayer({
      id: 'exists',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
    });

    expect(hasLayer('exists')).toBe(true);
    expect(hasLayer('nonexistent')).toBe(false);
  });

  it('should call onDismiss callback when removing layer', () => {
    const onDismiss = vi.fn();

    addLayer({
      id: 'layer',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
      onDismiss,
    });

    removeLayer('layer');

    expect(onDismiss).toHaveBeenCalled();
  });

  it('should auto-dismiss layer after timeout', () => {
    addLayer({
      id: 'auto',
      type: 'toast',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [],
      visible: true,
      autoDismiss: 1000,
    });

    expect(getLayerCount()).toBe(1);

    vi.advanceTimersByTime(1000);

    expect(getLayerCount()).toBe(0);
  });
});

// =============================================================================
// Modal
// =============================================================================

describe('Modal', () => {
  it('should show modal', () => {
    setOverlayTerminalSize(80, 24);

    const id = showModal({
      title: 'Test Modal',
      content: ['Line 1', 'Line 2'],
    });

    expect(id).toContain('modal');
    expect(getLayerCount()).toBe(1);

    const layer = getLayer(id);
    expect(layer?.type).toBe('modal');
    expect(layer?.backdrop).toBe(true);
  });

  it('should close modal', () => {
    const id = showModal({ content: ['Test'] });

    expect(getLayerCount()).toBe(1);

    const closed = closeModal(id);

    expect(closed).toBe(true);
    expect(getLayerCount()).toBe(0);
  });

  it('should close top modal', () => {
    showModal({ content: ['Modal 1'] });
    showModal({ content: ['Modal 2'] });

    expect(getLayerCount()).toBe(2);

    closeTopModal();

    expect(getLayerCount()).toBe(1);
  });

  it('should use custom position', () => {
    const id = showModal({
      content: ['Test'],
      position: { x: 10, y: 5 },
    });

    const layer = getLayer(id);
    expect(layer?.position).toEqual({ x: 10, y: 5 });
  });

  it('should call onClose callback', () => {
    const onClose = vi.fn();

    const id = showModal({
      content: ['Test'],
      onClose,
    });

    closeModal(id);

    expect(onClose).toHaveBeenCalled();
  });

  it('should generate modal content with title', () => {
    setOverlayTerminalSize(80, 24);

    const id = showModal({
      title: 'My Title',
      content: ['Content here'],
    });

    const layer = getLayer(id);
    const content = layer?.content();

    expect(content).toBeDefined();
    expect(content?.some((line) => line.includes('My Title'))).toBe(true);
  });
});

// =============================================================================
// Toast
// =============================================================================

describe('Toast', () => {
  it('should show toast', () => {
    setOverlayTerminalSize(80, 24);

    const id = showToast({
      message: 'Hello Toast!',
    });

    expect(id).toContain('toast');
    expect(getLayerCount()).toBe(1);
  });

  it('should auto-dismiss after duration', () => {
    showToast({
      message: 'Auto dismiss',
      duration: 3000,
    });

    expect(getLayerCount()).toBe(1);

    vi.advanceTimersByTime(3000);

    expect(getLayerCount()).toBe(0);
  });

  it('should dismiss toast manually', () => {
    const id = showToast({ message: 'Test' });

    const dismissed = dismissToast(id);

    expect(dismissed).toBe(true);
    expect(getLayerCount()).toBe(0);
  });

  it('should dismiss all toasts', () => {
    showToast({ message: 'Toast 1' });
    showToast({ message: 'Toast 2' });
    showToast({ message: 'Toast 3' });

    expect(getLayerCount()).toBe(3);

    dismissAllToasts();

    expect(getLayerCount()).toBe(0);
  });

  it('should position toast based on anchor', () => {
    setOverlayTerminalSize(80, 24);

    const id = showToast({
      message: 'Test',
      position: 'top-left',
    });

    const layer = getLayer(id);
    expect(layer?.position.x).toBe(1);
    expect(layer?.position.y).toBe(1);
  });

  it('should include type icon', () => {
    setOverlayTerminalSize(80, 24);

    const id = showToast({
      message: 'Success!',
      type: 'success',
    });

    const layer = getLayer(id);
    const content = layer?.content().join('');

    expect(content).toContain('✓');
  });

  it('should call onDismiss callback', () => {
    const onDismiss = vi.fn();

    const id = showToast({
      message: 'Test',
      duration: 100,
      onDismiss,
    });

    vi.advanceTimersByTime(100);

    expect(onDismiss).toHaveBeenCalled();
  });
});

// =============================================================================
// Popup
// =============================================================================

describe('Popup', () => {
  it('should show popup', () => {
    const id = showPopup({
      content: ['Popup content'],
      target: { x: 20, y: 10 },
    });

    expect(id).toContain('popup');
    expect(getLayerCount()).toBe(1);
  });

  it('should close popup', () => {
    const id = showPopup({
      content: ['Test'],
      target: { x: 0, y: 0 },
    });

    const closed = closePopup(id);

    expect(closed).toBe(true);
    expect(getLayerCount()).toBe(0);
  });

  it('should position popup based on anchor', () => {
    setOverlayTerminalSize(80, 24);

    const id = showPopup({
      content: ['Line 1', 'Line 2'],
      target: { x: 40, y: 12 },
      anchor: 'bottom',
    });

    const layer = getLayer(id);
    expect(layer?.position.y).toBeGreaterThan(12);
  });

  it('should use content function', () => {
    let counter = 0;
    const id = showPopup({
      content: () => [`Counter: ${++counter}`],
      target: { x: 0, y: 0 },
    });

    // Content is called once during showPopup to calculate position
    const layer = getLayer(id);
    layer?.content(); // Additional call 1
    layer?.content(); // Additional call 2

    expect(counter).toBe(3); // 1 during setup + 2 manual calls
  });
});

// =============================================================================
// Tooltip
// =============================================================================

describe('Tooltip', () => {
  it('should show tooltip after delay', () => {
    showTooltip({
      text: 'Tooltip text',
      target: { x: 20, y: 10 },
      delay: 500,
    });

    // Before delay
    expect(getLayerCount()).toBe(0);

    vi.advanceTimersByTime(500);

    // After delay
    expect(getLayerCount()).toBe(1);
  });

  it('should show tooltip immediately with delay 0', () => {
    showTooltip({
      text: 'Immediate',
      target: { x: 0, y: 0 },
      delay: 0,
    });

    expect(getLayerCount()).toBe(1);
  });

  it('should hide tooltip', () => {
    showTooltip({
      text: 'Test',
      target: { x: 0, y: 0 },
      delay: 0,
    });

    expect(getLayerCount()).toBe(1);

    hideTooltip();

    expect(getLayerCount()).toBe(0);
  });

  it('should cancel pending tooltip', () => {
    showTooltip({
      text: 'First',
      target: { x: 0, y: 0 },
      delay: 1000,
    });

    hideTooltip();

    vi.advanceTimersByTime(1000);

    expect(getLayerCount()).toBe(0);
  });

  it('should wrap long text', () => {
    setOverlayTerminalSize(80, 24);

    showTooltip({
      text: 'This is a very long tooltip text that should be wrapped to multiple lines',
      target: { x: 40, y: 12 },
      maxWidth: 20,
      delay: 0,
    });

    const layers = getLayers();
    const content = layers[0]?.content();

    expect(content?.length).toBeGreaterThan(2); // Multiple lines + borders
  });
});

// =============================================================================
// Menu
// =============================================================================

describe('Menu', () => {
  it('should show menu', () => {
    const id = showMenu({
      items: [
        { label: 'Item 1', value: '1' },
        { label: 'Item 2', value: '2' },
      ],
      position: { x: 10, y: 10 },
    });

    expect(id).toContain('menu');
    expect(getLayerCount()).toBe(1);
  });

  it('should close menu', () => {
    const id = showMenu({
      items: [{ label: 'Test' }],
      position: { x: 0, y: 0 },
    });

    closeMenu(id);

    expect(getLayerCount()).toBe(0);
  });

  it('should update selection', () => {
    const id = showMenu({
      items: [
        { label: 'First' },
        { label: 'Second' },
        { label: 'Third' },
      ],
      position: { x: 0, y: 0 },
      selectedIndex: 0,
    });

    updateMenuSelection(id, 2);

    const layer = getLayer(id);
    const data = layer?.data as { selectedIndex: number };

    expect(data.selectedIndex).toBe(2);
  });

  it('should select menu item', () => {
    const onSelect = vi.fn();

    const id = showMenu({
      items: [
        { label: 'One', value: '1' },
        { label: 'Two', value: '2' },
      ],
      position: { x: 0, y: 0 },
      selectedIndex: 1,
      onSelect,
    });

    const item = selectMenuItem(id);

    expect(item?.value).toBe('2');
    expect(onSelect).toHaveBeenCalledWith({ label: 'Two', value: '2' }, 1);
    expect(getLayerCount()).toBe(0); // Menu should close
  });

  it('should not select disabled item', () => {
    const onSelect = vi.fn();

    const id = showMenu({
      items: [{ label: 'Disabled', disabled: true }],
      position: { x: 0, y: 0 },
      onSelect,
    });

    const item = selectMenuItem(id);

    expect(item).toBeUndefined();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should render separators', () => {
    const id = showMenu({
      items: [
        { label: 'Item 1' },
        { label: '', separator: true },
        { label: 'Item 2' },
      ],
      position: { x: 0, y: 0 },
    });

    const layer = getLayer(id);
    const content = layer?.content().join('\n');

    expect(content).toContain('├');
    expect(content).toContain('┤');
  });
});

// =============================================================================
// Rendering
// =============================================================================

describe('Rendering', () => {
  it('should render overlays', () => {
    addLayer({
      id: 'layer1',
      type: 'custom',
      position: { x: 5, y: 3 },
      size: {},
      content: () => ['Line 1', 'Line 2'],
      visible: true,
    });

    const rendered = renderOverlays();

    expect(rendered.length).toBe(2);
    expect(rendered[0]).toEqual({ x: 5, y: 3, line: 'Line 1' });
    expect(rendered[1]).toEqual({ x: 5, y: 4, line: 'Line 2' });
  });

  it('should render in z-order', () => {
    addLayer({
      id: 'back',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => ['Back'],
      visible: true,
      zIndex: 10,
    });

    addLayer({
      id: 'front',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => ['Front'],
      visible: true,
      zIndex: 20,
    });

    const rendered = renderOverlays();

    // Front should come after back (rendered on top)
    expect(rendered[0].line).toBe('Back');
    expect(rendered[1].line).toBe('Front');
  });

  it('should not render hidden layers', () => {
    addLayer({
      id: 'hidden',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => ['Hidden'],
      visible: false,
    });

    const rendered = renderOverlays();

    expect(rendered.length).toBe(0);
  });
});

// =============================================================================
// Hit Testing
// =============================================================================

describe('Hit Testing', () => {
  it('should detect point in overlay', () => {
    addLayer({
      id: 'box',
      type: 'custom',
      position: { x: 10, y: 5 },
      size: {},
      content: () => ['XXXXX', 'XXXXX', 'XXXXX'],
      visible: true,
    });

    const hit = isPointInOverlay(12, 6);
    expect(hit?.id).toBe('box');

    const miss = isPointInOverlay(0, 0);
    expect(miss).toBeUndefined();
  });

  it('should return topmost layer at point', () => {
    addLayer({
      id: 'back',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => ['XXXXX'],
      visible: true,
      zIndex: 10,
    });

    addLayer({
      id: 'front',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => ['XXXXX'],
      visible: true,
      zIndex: 20,
    });

    const hit = isPointInOverlay(2, 0);
    expect(hit?.id).toBe('front');
  });
});

// =============================================================================
// Event Handling
// =============================================================================

describe('Event Handling', () => {
  it('should handle escape to close tooltip', () => {
    showTooltip({
      text: 'Test',
      target: { x: 0, y: 0 },
      delay: 0,
    });

    expect(getLayerCount()).toBe(1);

    const handled = handleOverlayEscape();

    expect(handled).toBe(true);
    expect(getLayerCount()).toBe(0);
  });

  it('should handle escape to close menu', () => {
    showMenu({
      items: [{ label: 'Test' }],
      position: { x: 0, y: 0 },
    });

    expect(getLayerCount()).toBe(1);

    handleOverlayEscape();

    expect(getLayerCount()).toBe(0);
  });

  it('should handle escape to close modal', () => {
    showModal({
      content: ['Test'],
      closeOnEscape: true,
    });

    expect(getLayerCount()).toBe(1);

    handleOverlayEscape();

    expect(getLayerCount()).toBe(0);
  });

  it('should not close modal if closeOnEscape is false', () => {
    showModal({
      content: ['Test'],
      closeOnEscape: false,
    });

    expect(getLayerCount()).toBe(1);

    handleOverlayEscape();

    expect(getLayerCount()).toBe(1);
  });

  it('should handle click outside to close popup', () => {
    setOverlayTerminalSize(80, 24);

    showPopup({
      content: ['Popup'],
      target: { x: 40, y: 12 },
      closeOnClickOutside: true,
    });

    expect(getLayerCount()).toBe(1);

    // Click outside
    handleOverlayClick(0, 0);

    expect(getLayerCount()).toBe(0);
  });

  it('should return true for click inside overlay', () => {
    addLayer({
      id: 'box',
      type: 'custom',
      position: { x: 10, y: 10 },
      size: {},
      content: () => ['XXXXX'],
      visible: true,
    });

    const handled = handleOverlayClick(12, 10);

    expect(handled).toBe(true);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty terminal size', () => {
    setOverlayTerminalSize(0, 0);

    const id = showModal({ content: ['Test'] });

    expect(getLayer(id)).toBeDefined();
  });

  it('should handle very long toast message', () => {
    setOverlayTerminalSize(80, 24);

    const id = showToast({
      message: 'A'.repeat(100),
    });

    expect(getLayer(id)).toBeDefined();
  });

  it('should handle menu with no items', () => {
    const id = showMenu({
      items: [],
      position: { x: 0, y: 0 },
    });

    const layer = getLayer(id);
    const content = layer?.content();

    expect(content).toBeDefined();
  });

  it('should handle multiple overlays of same type', () => {
    showModal({ content: ['Modal 1'] });
    showModal({ content: ['Modal 2'] });
    showToast({ message: 'Toast 1' });
    showToast({ message: 'Toast 2' });

    expect(getLayerCount()).toBe(4);
  });

  it('should handle rapid show/hide cycles', () => {
    for (let i = 0; i < 10; i++) {
      const id = showToast({ message: `Toast ${i}`, duration: 100 });
      dismissToast(id);
    }

    expect(getLayerCount()).toBe(0);
  });
});

// =============================================================================
// Visual Overlay Tests
// =============================================================================

describe('Visual Overlay Rendering', () => {
  it('should render modal over base content', () => {
    setOverlayTerminalSize(40, 10);

    // Add base content layer
    addLayer({
      id: 'base',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => [
        'Base content line 1',
        'Base content line 2',
        'Base content line 3',
      ],
      visible: true,
      zIndex: 1,
    });

    // Add modal on top
    addLayer({
      id: 'modal',
      type: 'modal',
      position: { x: 10, y: 3 },
      size: {},
      content: () => [
        '┌────────────┐',
        '│   Modal    │',
        '└────────────┘',
      ],
      visible: true,
      zIndex: 100,
    });

    const rendered = renderOverlays();

    // Should have both layers rendered
    expect(rendered.length).toBe(6);

    // Base content should be first (lower z-index)
    expect(rendered[0].line).toBe('Base content line 1');
    expect(rendered[1].line).toBe('Base content line 2');
    expect(rendered[2].line).toBe('Base content line 3');

    // Modal should be rendered after (higher z-index = on top)
    // rendered[3] = top border, rendered[4] = Modal content, rendered[5] = bottom border
    expect(rendered[4].line).toContain('Modal');
  });

  it('should render fullscreen modal covering entire screen', () => {
    setOverlayTerminalSize(20, 5);

    // Add fullscreen modal
    addLayer({
      id: 'fullscreen',
      type: 'modal',
      position: { x: 0, y: 0 },
      size: { width: 20, height: 5 },
      content: () => [
        '═'.repeat(20),
        '║ FULLSCREEN MODAL ║',
        '║                  ║',
        '║ [OK]  [Cancel]   ║',
        '═'.repeat(20),
      ],
      visible: true,
      zIndex: 1000,
    });

    const rendered = renderOverlays();

    // All 5 lines should be rendered
    expect(rendered.length).toBe(5);

    // Verify fullscreen dimensions
    expect(rendered[0].x).toBe(0);
    expect(rendered[0].y).toBe(0);
    expect(rendered[4].y).toBe(4);

    // Verify content
    expect(rendered[1].line).toContain('FULLSCREEN MODAL');
    expect(rendered[3].line).toContain('OK');
    expect(rendered[3].line).toContain('Cancel');
  });

  it('should overlay popup over base content at correct position', () => {
    setOverlayTerminalSize(50, 20);

    // Base content
    addLayer({
      id: 'base',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => ['Background', 'Content'],
      visible: true,
      zIndex: 1,
    });

    // Popup at specific position
    addLayer({
      id: 'popup',
      type: 'popup',
      position: { x: 20, y: 5 },
      size: {},
      content: () => ['[Popup Menu]', ' Option 1  ', ' Option 2  '],
      visible: true,
      zIndex: 50,
    });

    const rendered = renderOverlays();

    // Find popup lines
    const popupLines = rendered.filter((r) => r.x === 20);
    expect(popupLines.length).toBe(3);
    expect(popupLines[0].y).toBe(5);
    expect(popupLines[0].line).toContain('Popup Menu');
  });

  it('should render toast notification at top of screen', () => {
    setOverlayTerminalSize(60, 20);

    // Show toast (toasts typically appear at top)
    showToast({
      message: 'Operation successful!',
      position: 'top',
    });

    const rendered = renderOverlays();

    // Toast should be rendered
    expect(rendered.length).toBeGreaterThan(0);

    // Should contain the message
    const toastContent = rendered.map((r) => r.line).join('');
    expect(toastContent).toContain('Operation successful!');
  });

  it('should render multiple overlays in correct z-order', () => {
    setOverlayTerminalSize(40, 20);

    // Backdrop (lowest z-index)
    addLayer({
      id: 'backdrop',
      type: 'custom',
      position: { x: 0, y: 0 },
      size: {},
      content: () => ['░'.repeat(40)],
      visible: true,
      zIndex: 10,
    });

    // Dialog (middle z-index)
    addLayer({
      id: 'dialog',
      type: 'modal',
      position: { x: 5, y: 5 },
      size: {},
      content: () => ['┌─ Dialog ─┐', '│ Content  │', '└──────────┘'],
      visible: true,
      zIndex: 50,
    });

    // Tooltip (highest z-index)
    addLayer({
      id: 'tooltip',
      type: 'tooltip',
      position: { x: 15, y: 10 },
      size: {},
      content: () => ['[Tooltip: Help text]'],
      visible: true,
      zIndex: 100,
    });

    const rendered = renderOverlays();

    // Verify z-order: backdrop → dialog → tooltip
    const backdropIdx = rendered.findIndex((r) => r.line.includes('░'));
    const dialogIdx = rendered.findIndex((r) => r.line.includes('Dialog'));
    const tooltipIdx = rendered.findIndex((r) => r.line.includes('Tooltip'));

    expect(backdropIdx).toBeLessThan(dialogIdx);
    expect(dialogIdx).toBeLessThan(tooltipIdx);
  });

  it('should render dialog with buttons correctly positioned', () => {
    setOverlayTerminalSize(50, 15);

    addLayer({
      id: 'confirm-dialog',
      type: 'modal',
      position: { x: 5, y: 3 },
      size: {},
      content: () => [
        '╔════════════════════════════╗',
        '║     Confirm Action?        ║',
        '║                            ║',
        '║  Are you sure you want to  ║',
        '║  proceed with this action? ║',
        '║                            ║',
        '║    [Cancel]    [Confirm]   ║',
        '╚════════════════════════════╝',
      ],
      visible: true,
      zIndex: 100,
    });

    const rendered = renderOverlays();

    // Verify dialog structure
    expect(rendered.length).toBe(8);

    // Find button line
    const buttonLine = rendered.find((r) => r.line.includes('[Cancel]'));
    expect(buttonLine).toBeDefined();
    expect(buttonLine?.line).toContain('[Confirm]');

    // Buttons should be on line y=3+6=9
    expect(buttonLine?.y).toBe(9);
  });
});
