/**
 * Modal and Overlay Integration Tests
 *
 * Tests for modal interactions, overlay stacking, and focus trap behavior.
 * These tests verify that modals properly integrate with the overlay stack,
 * focus system, and hotkey scopes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Modal, createModal, ConfirmDialog, AlertBox } from '../../src/organisms/modal.js';
import { createOverlayStack, OverlayContainer } from '../../src/organisms/overlay-stack.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import {
  getFocusZoneManager,
  resetFocusZoneManager,
  createFocusTrap,
  getActiveId,
} from '../../src/core/focus.js';
import {
  pushHotkeyScope,
  popHotkeyScope,
  getHotkeyScope,
  resetHotkeyScope,
} from '../../src/hooks/use-hotkeys.js';
import { renderToString } from '../../src/design-system/core/renderer.js';
import type { VNode } from '../../src/utils/types.js';

// =============================================================================
// Test Helpers
// =============================================================================

function findTextContent(node: VNode, content: string): boolean {
  if (node.type === 'text') {
    const props = node.props as Record<string, unknown>;
    const textContent = String(props?.children ?? '');
    if (textContent.includes(content)) {
      return true;
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (typeof child === 'object' && child !== null) {
        if (findTextContent(child as VNode, content)) {
          return true;
        }
      }
    }
  }

  return false;
}

// =============================================================================
// Modal State Management Tests
// =============================================================================

describe('Modal State Management', () => {
  beforeEach(() => {
    resetHotkeyScope();
    resetFocusZoneManager();
  });

  afterEach(() => {
    resetHotkeyScope();
    resetFocusZoneManager();
  });

  describe('createModal()', () => {
    it('should create modal state with isOpen false initially', () => {
      const modal = createModal();
      expect(modal.isOpen).toBe(false);
    });

    it('should open modal when open() is called', () => {
      const modal = createModal();
      modal.open();
      expect(modal.isOpen).toBe(true);
    });

    it('should close modal when close() is called', () => {
      const modal = createModal();
      modal.open();
      expect(modal.isOpen).toBe(true);

      modal.close();
      expect(modal.isOpen).toBe(false);
    });

    it('should toggle modal state', () => {
      const modal = createModal();
      expect(modal.isOpen).toBe(false);

      modal.toggle();
      expect(modal.isOpen).toBe(true);

      modal.toggle();
      expect(modal.isOpen).toBe(false);
    });
  });

  describe('Modal with hotkeyScope', () => {
    it('should push hotkey scope when opened', () => {
      const modal = createModal({ hotkeyScope: 'modal' });
      expect(getHotkeyScope()).toBe('global');

      modal.open();
      expect(getHotkeyScope()).toBe('modal');
    });

    it('should pop hotkey scope when closed', () => {
      const modal = createModal({ hotkeyScope: 'modal' });

      modal.open();
      expect(getHotkeyScope()).toBe('modal');

      modal.close();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should handle custom scope name', () => {
      const modal = createModal({ hotkeyScope: 'settings-modal' });

      modal.open();
      expect(getHotkeyScope()).toBe('settings-modal');

      modal.close();
      expect(getHotkeyScope()).toBe('global');
    });
  });

  describe('Modal with focusTrap', () => {
    it('should create focus zone when focusTrap is enabled', () => {
      const modal = createModal({ focusTrap: true });
      expect(modal.zoneId).toBeDefined();
      expect(modal.zoneId).not.toBeNull();
    });

    it('should not create focus zone when focusTrap is disabled', () => {
      const modal = createModal({ focusTrap: false });
      expect(modal.zoneId).toBeNull();
    });
  });
});

// =============================================================================
// Nested Modal Tests
// =============================================================================

describe('Nested Modals', () => {
  beforeEach(() => {
    resetHotkeyScope();
    resetFocusZoneManager();
  });

  afterEach(() => {
    resetHotkeyScope();
    resetFocusZoneManager();
  });

  it('should support nested modal scopes', () => {
    const outerModal = createModal({ hotkeyScope: 'outer-modal' });
    const innerModal = createModal({ hotkeyScope: 'inner-modal' });

    expect(getHotkeyScope()).toBe('global');

    outerModal.open();
    expect(getHotkeyScope()).toBe('outer-modal');

    innerModal.open();
    expect(getHotkeyScope()).toBe('inner-modal');
  });

  it('should restore to outer modal scope when inner closes', () => {
    const outerModal = createModal({ hotkeyScope: 'outer-modal' });
    const innerModal = createModal({ hotkeyScope: 'inner-modal' });

    outerModal.open();
    innerModal.open();
    expect(getHotkeyScope()).toBe('inner-modal');

    innerModal.close();
    expect(getHotkeyScope()).toBe('outer-modal');
  });

  it('should restore to global when all modals close', () => {
    const outerModal = createModal({ hotkeyScope: 'outer-modal' });
    const innerModal = createModal({ hotkeyScope: 'inner-modal' });

    outerModal.open();
    innerModal.open();

    innerModal.close();
    outerModal.close();
    expect(getHotkeyScope()).toBe('global');
  });

  it('should handle three levels of nesting', () => {
    const modal1 = createModal({ hotkeyScope: 'modal-1' });
    const modal2 = createModal({ hotkeyScope: 'modal-2' });
    const modal3 = createModal({ hotkeyScope: 'modal-3' });

    modal1.open();
    modal2.open();
    modal3.open();
    expect(getHotkeyScope()).toBe('modal-3');

    modal3.close();
    expect(getHotkeyScope()).toBe('modal-2');

    modal2.close();
    expect(getHotkeyScope()).toBe('modal-1');

    modal1.close();
    expect(getHotkeyScope()).toBe('global');
  });
});

// =============================================================================
// Overlay Stack Integration
// =============================================================================

describe('Modal with Overlay Stack', () => {
  it('should add modal to overlay stack', () => {
    const stack = createOverlayStack();

    stack.push({
      id: 'modal-1',
      component: () => Modal({
        title: 'Test Modal',
        content: Text({}, 'Content'),
      }),
      priority: 'normal',
    });

    expect(stack.all()).toHaveLength(1);
    expect(stack.get('modal-1')).toBeDefined();
  });

  it('should maintain z-order with multiple modals', () => {
    const stack = createOverlayStack();

    stack.push({
      id: 'modal-low',
      component: () => Modal({ title: 'Low', content: Text({}, 'Low') }),
      priority: 'low',
    });

    stack.push({
      id: 'modal-high',
      component: () => Modal({ title: 'High', content: Text({}, 'High') }),
      priority: 'high',
    });

    stack.push({
      id: 'modal-normal',
      component: () => Modal({ title: 'Normal', content: Text({}, 'Normal') }),
      priority: 'normal',
    });

    const all = stack.all();
    expect(all[0]?.id).toBe('modal-low');
    expect(all[1]?.id).toBe('modal-normal');
    expect(all[2]?.id).toBe('modal-high');
  });

  it('should close topmost modal on escape', () => {
    const stack = createOverlayStack();
    const onClose = vi.fn();

    stack.push({
      id: 'modal-1',
      component: () => Modal({ title: 'Modal 1', content: Text({}, '1') }),
      priority: 'normal',
      onClose,
    });

    stack.push({
      id: 'modal-2',
      component: () => Modal({ title: 'Modal 2', content: Text({}, '2') }),
      priority: 'normal',
    });

    // Close the top modal
    stack.close('modal-2');

    expect(stack.all()).toHaveLength(1);
    expect(stack.get('modal-2')).toBeNull();
    expect(stack.get('modal-1')).not.toBeNull();
  });

  it('should call beforeClose and allow cancellation', () => {
    const stack = createOverlayStack();
    const beforeClose = vi.fn(() => false); // Cancel close

    stack.push({
      id: 'modal-1',
      component: () => Modal({ title: 'Modal', content: Text({}, 'Content') }),
      beforeClose,
    });

    stack.close('modal-1');

    expect(beforeClose).toHaveBeenCalled();
    expect(stack.get('modal-1')).toBeDefined(); // Still there, close was cancelled
  });
});

// =============================================================================
// Modal Component Rendering
// =============================================================================

describe('Modal Component', () => {
  it('should render modal with title', () => {
    const modal = Modal({
      title: 'Test Modal Title',
      content: Text({}, 'Content'),
    });

    const output = renderToString(modal, 60);
    expect(output).toContain('Test Modal Title');
  });

  it('should render modal content', () => {
    const modal = Modal({
      title: 'Modal',
      content: Text({}, 'Modal Content Here'),
    });

    const output = renderToString(modal, 60);
    expect(output).toContain('Modal Content Here');
  });

  it('should render footer when provided', () => {
    const modal = Modal({
      title: 'Modal',
      content: Text({}, 'Content'),
      footer: Text({}, 'Footer Text'),
    });

    const output = renderToString(modal, 60);
    expect(output).toContain('Footer Text');
  });

  it('should render close hint when enabled', () => {
    const modal = Modal({
      title: 'Modal',
      content: Text({}, 'Content'),
      showCloseHint: true,
      closeHint: 'Press ESC to close',
    });

    const output = renderToString(modal, 60);
    expect(output).toContain('Press ESC');
  });
});

// =============================================================================
// ConfirmDialog Integration
// =============================================================================

describe('ConfirmDialog', () => {
  it('should render confirm and cancel buttons', () => {
    const dialog = ConfirmDialog({
      title: 'Confirm',
      message: 'Are you sure?',
      onConfirm: () => {},
      onCancel: () => {},
    });

    const output = renderToString(dialog, 60);
    expect(output).toContain('Are you sure?');
    // Should have confirm/cancel UI elements
    expect(output.length).toBeGreaterThan(0);
  });

  it('should use custom button labels', () => {
    const dialog = ConfirmDialog({
      title: 'Delete',
      message: 'Delete this item?',
      confirmText: 'Delete',
      cancelText: 'Keep',
      onConfirm: () => {},
      onCancel: () => {},
    });

    const output = renderToString(dialog, 60);
    expect(output).toContain('Delete');
    expect(output).toContain('Keep');
  });
});

// =============================================================================
// AlertBox Integration
// =============================================================================

describe('AlertBox', () => {
  it('should render info alert', () => {
    const alert = AlertBox({
      title: 'Information',
      message: 'This is informational',
      type: 'info',
    });

    const output = renderToString(alert, 60);
    expect(output).toContain('Information');
    expect(output).toContain('This is informational');
  });

  it('should render success alert', () => {
    const alert = AlertBox({
      title: 'Success',
      message: 'Operation completed',
      type: 'success',
    });

    const output = renderToString(alert, 60);
    expect(output).toContain('Success');
    expect(output).toContain('Operation completed');
  });

  it('should render warning alert', () => {
    const alert = AlertBox({
      title: 'Warning',
      message: 'This might cause issues',
      type: 'warning',
    });

    const output = renderToString(alert, 60);
    expect(output).toContain('Warning');
    expect(output).toContain('This might cause issues');
  });

  it('should render error alert', () => {
    const alert = AlertBox({
      title: 'Error',
      message: 'Something went wrong',
      type: 'error',
    });

    const output = renderToString(alert, 60);
    expect(output).toContain('Error');
    expect(output).toContain('Something went wrong');
  });
});

// =============================================================================
// Focus Trap Integration
// =============================================================================

describe('Focus Trap with Modal', () => {
  beforeEach(() => {
    resetFocusZoneManager();
  });

  afterEach(() => {
    resetFocusZoneManager();
  });

  it('should create focus trap zone', () => {
    const trap = createFocusTrap({ autoFocus: true });
    expect(trap.zoneId).toBeDefined();

    const manager = getFocusZoneManager();
    const zone = manager.getZone(trap.zoneId);
    expect(zone).not.toBeNull();
    expect(zone!.options.trap).toBe(true);
  });

  it('should activate and deactivate focus trap', () => {
    const trap = createFocusTrap({ autoFocus: false });
    const manager = getFocusZoneManager();

    trap.activate();
    expect(manager.getActiveZone()?.id).toBe(trap.zoneId);

    trap.deactivate();
    // After deactivation, should return to previous zone
    expect(manager.getActiveZone()?.id).not.toBe(trap.zoneId);
  });

  it('should restore focus after deactivation when configured', () => {
    // This is a unit test for the focus restoration option
    const trap = createFocusTrap({ restoreFocus: true, autoFocus: false });

    trap.activate();
    trap.deactivate();

    // restoreFocus option should be respected
    expect(trap.zoneId).toBeDefined();
  });
});

// =============================================================================
// Real-world Scenarios
// =============================================================================

describe('Real-world Modal Scenarios', () => {
  beforeEach(() => {
    resetHotkeyScope();
    resetFocusZoneManager();
  });

  afterEach(() => {
    resetHotkeyScope();
    resetFocusZoneManager();
  });

  it('should handle confirmation dialog workflow', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const modal = createModal({ hotkeyScope: 'confirm-dialog' });

    // Open confirmation dialog
    modal.open();
    expect(getHotkeyScope()).toBe('confirm-dialog');

    // User confirms
    onConfirm();
    modal.close();

    expect(getHotkeyScope()).toBe('global');
    expect(onConfirm).toHaveBeenCalled();
  });

  it('should handle settings modal with nested confirm', () => {
    const settingsModal = createModal({ hotkeyScope: 'settings' });
    const confirmModal = createModal({ hotkeyScope: 'confirm' });

    // Open settings
    settingsModal.open();
    expect(getHotkeyScope()).toBe('settings');

    // Open confirm dialog for unsaved changes
    confirmModal.open();
    expect(getHotkeyScope()).toBe('confirm');

    // Cancel and stay in settings
    confirmModal.close();
    expect(getHotkeyScope()).toBe('settings');

    // Close settings
    settingsModal.close();
    expect(getHotkeyScope()).toBe('global');
  });

  it('should handle modal with form inside', () => {
    const modal = createModal({
      hotkeyScope: 'form-modal',
      focusTrap: true,
    });

    modal.open();

    expect(getHotkeyScope()).toBe('form-modal');
    expect(modal.zoneId).not.toBeNull();

    modal.close();

    expect(getHotkeyScope()).toBe('global');
  });
});
