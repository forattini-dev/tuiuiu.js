import { describe, it, expect, vi } from 'vitest';
import {
  Modal,
  ConfirmDialog,
  AlertBox,
  Toast,
  Window,
  createModal,
  createConfirmDialog,
  type ModalProps,
  type ConfirmDialogProps,
  type AlertBoxProps,
  type ToastProps,
  type WindowProps,
} from '../../src/organisms/modal.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { renderOnce } from '../../src/app/render-loop.js';
import { stringWidth, stripAnsi } from '../../src/utils/text-utils.js';

describe('Modal', () => {
  // ==========================================================================
  // Modal Component
  // ==========================================================================
  describe('Modal component', () => {
    it('should render without errors', () => {
      const output = renderOnce(Modal({
        content: Text({}, 'Modal content'),
      }));
      expect(output).toBeDefined();
    });

    it('should render with title', () => {
      const node = Modal({
        title: 'Test Modal',
        content: Text({}, 'Content'),
      });
      expect(node).toBeDefined();
    });

    it('should render with different sizes', () => {
      const sizes: Array<'small' | 'medium' | 'large' | 'fullscreen'> = [
        'small', 'medium', 'large', 'fullscreen',
      ];
      sizes.forEach((size) => {
        const node = Modal({
          size,
          content: Text({}, 'Content'),
        });
        expect(node).toBeDefined();
      });
    });

    it('should render with custom dimensions', () => {
      const node = Modal({
        size: { width: 50, height: 20 },
        content: Text({}, 'Content'),
      });
      expect(node).toBeDefined();
    });

    it('should render with different positions', () => {
      const positions: Array<'center' | 'top' | 'bottom'> = ['center', 'top', 'bottom'];
      positions.forEach((position) => {
        const node = Modal({
          position,
          content: Text({}, 'Content'),
        });
        expect(node).toBeDefined();
      });
    });

    it('should render with custom position', () => {
      const node = Modal({
        position: { x: 10, y: 5 },
        content: Text({}, 'Content'),
      });
      expect(node).toBeDefined();
    });

    it('should render with different border styles', () => {
      const styles: Array<'single' | 'double' | 'round' | 'heavy' | 'none'> = [
        'single', 'double', 'round', 'heavy', 'none',
      ];
      styles.forEach((borderStyle) => {
        const node = Modal({
          borderStyle,
          content: Text({}, 'Content'),
        });
        expect(node).toBeDefined();
      });
    });

    it('should render with backdrop', () => {
      const node = Modal({
        backdrop: true,
        backdropChar: '░',
        content: Text({}, 'Content'),
      });
      expect(node).toBeDefined();
    });

    it('should render with footer', () => {
      const node = Modal({
        content: Text({}, 'Content'),
        footer: Text({}, 'Footer'),
      });
      expect(node).toBeDefined();
    });

    it('should render with close hint', () => {
      const node = Modal({
        showCloseHint: true,
        closeHint: 'Press Esc to close',
        content: Text({}, 'Content'),
      });
      expect(node).toBeDefined();
    });

    it('should render with close button', () => {
      const onClose = vi.fn();
      const node = Modal({
        showCloseButton: true,
        onClose,
        content: Text({}, 'Content'),
      });
      expect(node).toBeDefined();
    });

    it('should accept custom colors', () => {
      const node = Modal({
        borderColor: 'cyan',
        titleColor: 'yellow',
        title: 'Colored Modal',
        content: Text({}, 'Content'),
      });
      expect(node).toBeDefined();
    });

    it('should accept padding option', () => {
      const node = Modal({
        padding: 2,
        content: Text({}, 'Content'),
      });
      expect(node).toBeDefined();
    });

    it('fits wide Unicode titles and hints to the requested columns', () => {
      const output = stripAnsi(renderOnce(Modal({
        title: '设置👩‍💻设置👩‍💻',
        closeHint: '按下 ESC 关闭界面',
        showCloseButton: true,
        onClose: vi.fn(),
        size: { width: 20, height: 6 },
        content: Text({}, 'Content'),
      }), 40));

      expect(output.split('\n').every((line) => stringWidth(line) <= 20)).toBe(true);
      expect(output).not.toContain('\uFFFD');
    });

    it('normalizes invalid custom dimensions and padding', () => {
      expect(() => renderOnce(Modal({
        size: { width: Number.NaN, height: -5 },
        padding: Number.POSITIVE_INFINITY,
        content: Text({}, 'Content'),
      }), 20)).not.toThrow();
    });

    it('should handle closeOnBackdrop', () => {
      const onClose = vi.fn();
      const node = Modal({
        backdrop: true,
        closeOnBackdrop: true,
        onClose,
        content: Text({}, 'Content'),
      });
      expect(node).toBeDefined();
    });
  });

  // ==========================================================================
  // createModal Factory
  // ==========================================================================
  describe('createModal', () => {
    it('should create modal state', () => {
      const state = createModal();
      expect(state.open).toBeDefined();
      expect(state.close).toBeDefined();
      expect(state.toggle).toBeDefined();
    });

    it('should start closed', () => {
      const state = createModal();
      expect(state.isOpen).toBe(false);
    });

    it('should open modal', () => {
      const state = createModal();
      state.open();
      expect(state.isOpen).toBe(true);
    });

    it('should close modal', () => {
      const state = createModal();
      state.open();
      state.close();
      expect(state.isOpen).toBe(false);
    });

    it('should toggle modal', () => {
      const state = createModal();
      state.toggle();
      expect(state.isOpen).toBe(true);
      state.toggle();
      expect(state.isOpen).toBe(false);
    });

    it('should accept focusTrap option', () => {
      const state = createModal({ focusTrap: true });
      expect(state.zoneId).toBeDefined();
    });

    it('should accept hotkeyScope option', () => {
      const state = createModal({ hotkeyScope: 'modal' });
      state.open();
      state.close();
      expect(state.isOpen).toBe(false);
    });
  });

  // ==========================================================================
  // ConfirmDialog
  // ==========================================================================
  describe('ConfirmDialog', () => {
    it('should render without errors', () => {
      const node = ConfirmDialog({
        title: 'Confirm',
        message: 'Are you sure?',
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(node).toBeDefined();
    });

    it('should render with custom button labels', () => {
      const node = ConfirmDialog({
        title: 'Delete',
        message: 'Delete this item?',
        confirmLabel: 'Yes, Delete',
        cancelLabel: 'No, Keep',
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(node).toBeDefined();
    });

    it('should render with danger style', () => {
      const node = ConfirmDialog({
        title: 'Danger',
        message: 'This is dangerous!',
        danger: true,
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(node).toBeDefined();
    });
  });

  // ==========================================================================
  // createConfirmDialog
  // ==========================================================================
  describe('createConfirmDialog', () => {
    it('should create confirm dialog state', () => {
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test message',
      });
      expect(state.props).toBeDefined();
      expect(state.toggle).toBeDefined();
      expect(state.confirm).toBeDefined();
      expect(state.cancel).toBeDefined();
    });

    it('should toggle selected button', () => {
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test',
      });
      expect(state.selected).toBe(0);
      state.toggle();
      expect(state.selected).toBe(1);
      state.toggle();
      expect(state.selected).toBe(0);
    });

    it('should select cancel', () => {
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test',
      });
      state.toggle(); // Select confirm
      state.selectCancel();
      expect(state.selected).toBe(0);
    });

    it('should select confirm', () => {
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test',
      });
      state.selectConfirm();
      expect(state.selected).toBe(1);
    });

    it('should call onConfirm callback when confirm selected', () => {
      const onConfirm = vi.fn();
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test',
        onConfirm,
      });
      state.selectConfirm(); // Select confirm button first
      state.confirm();
      expect(onConfirm).toHaveBeenCalled();
    });

    it('should call onCancel callback when cancel selected', () => {
      const onCancel = vi.fn();
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test',
        onCancel,
      });
      state.selectCancel(); // Ensure cancel is selected
      state.cancel();
      expect(onCancel).toHaveBeenCalled();
    });

    it('should return correct props', () => {
      const state = createConfirmDialog({
        title: 'My Title',
        message: 'My Message',
        confirmText: 'Yes',
        cancelText: 'No',
        type: 'danger',
      });
      expect(state.props.title).toBe('My Title');
      expect(state.props.message).toBe('My Message');
      expect(state.props.confirmText).toBe('Yes');
      expect(state.props.cancelText).toBe('No');
      expect(state.props.type).toBe('danger');
    });
  });

  // ==========================================================================
  // AlertBox
  // ==========================================================================
  describe('AlertBox', () => {
    it('should render without errors', () => {
      const node = AlertBox({
        type: 'info',
        message: 'Information message',
      });
      expect(node).toBeDefined();
    });

    it('should render different types', () => {
      const types: Array<'success' | 'error' | 'warning' | 'info'> = [
        'success', 'error', 'warning', 'info',
      ];
      types.forEach((type) => {
        const node = AlertBox({ type, message: `${type} message` });
        expect(node).toBeDefined();
      });
    });

    it('should render with title', () => {
      const node = AlertBox({
        type: 'success',
        title: 'Success!',
        message: 'Operation completed',
      });
      expect(node).toBeDefined();
    });

    it('should render with close button', () => {
      const onClose = vi.fn();
      const node = AlertBox({
        type: 'info',
        message: 'Info',
        showClose: true,
        onClose,
      });
      expect(node).toBeDefined();
    });
  });

  // ==========================================================================
  // Toast
  // ==========================================================================
  describe('Toast', () => {
    it('should render without errors', () => {
      const node = Toast({
        type: 'success',
        message: 'Success!',
      });
      expect(node).toBeDefined();
    });

    it('should render different types', () => {
      const types: Array<'success' | 'error' | 'warning' | 'info'> = [
        'success', 'error', 'warning', 'info',
      ];
      types.forEach((type) => {
        const node = Toast({ type, message: `${type} toast` });
        expect(node).toBeDefined();
      });
    });

    it('should render at different positions', () => {
      const positions: Array<'top' | 'bottom'> = ['top', 'bottom'];
      positions.forEach((position) => {
        const node = Toast({ type: 'info', message: 'Toast', position });
        expect(node).toBeDefined();
      });
    });

    it('should accept duration', () => {
      const node = Toast({
        type: 'info',
        message: 'Toast',
        duration: 3000,
      });
      expect(node).toBeDefined();
    });
  });

  // ==========================================================================
  // Window
  // ==========================================================================
  describe('Window', () => {
    it('should render without errors', () => {
      const node = Window({
        title: 'Window Title',
        content: Text({}, 'Window content'),
        x: 5,
        y: 5,
        width: 40,
        height: 10,
      });
      expect(node).toBeDefined();
    });

    it('should render with different border styles', () => {
      const node = Window({
        title: 'Window',
        content: Text({}, 'Content'),
        x: 0,
        y: 0,
        width: 30,
        height: 10,
        borderStyle: 'double',
      });
      expect(node).toBeDefined();
    });

    it('should render as active', () => {
      const node = Window({
        title: 'Active Window',
        content: Text({}, 'Content'),
        x: 0,
        y: 0,
        width: 30,
        height: 10,
        isActive: true,
      });
      expect(node).toBeDefined();
    });

    it('should render as inactive', () => {
      const node = Window({
        title: 'Inactive Window',
        content: Text({}, 'Content'),
        x: 0,
        y: 0,
        width: 30,
        height: 10,
        isActive: false,
      });
      expect(node).toBeDefined();
    });

    it('should render with status bar', () => {
      const node = Window({
        title: 'Window',
        content: Text({}, 'Content'),
        x: 0,
        y: 0,
        width: 30,
        height: 10,
        statusBar: 'Status: Ready',
      });
      expect(node).toBeDefined();
    });
  });
});
