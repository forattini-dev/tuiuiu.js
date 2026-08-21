import { describe, it, expect, vi } from 'vitest';
import {
  Modal,
  openModal,
  ConfirmDialog,
  AlertBox,
  Toast,
  Window,
  createConfirmDialog,
  type ModalProps,
  type ConfirmDialogProps,
  type AlertBoxProps,
  type ToastProps,
  type WindowProps,
} from '../../src/organisms/modal.js';
import { createOverlayHost } from '../../src/interaction/overlay.js';
import { createInteractionRuntime } from '../../src/interaction/runtime.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import type { VNode } from '../../src/utils/types.js';
import { createEffect } from '../../src/primitives/signal.js';
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

      // Modal owns the viewport now, so centered content may have leading
      // columns; no rendered row may exceed the requested viewport.
      expect(output.split('\n').every((line) => stringWidth(line) <= 40)).toBe(true);
      expect(output).not.toContain('\uFFFD');
    });

    it('rejects invalid custom dimensions and padding', () => {
      expect(() => renderOnce(Modal({
        size: { width: Number.NaN, height: -5 },
        padding: Number.POSITIVE_INFINITY,
        content: Text({}, 'Content'),
      }), 20)).toThrow(RangeError);
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

    it('builds a clickable full-viewport backdrop and a centered layer', () => {
      const onClose = vi.fn();
      const node = Modal({
        backdrop: true,
        backdropChar: '.',
        closeOnBackdrop: true,
        onClose,
        content: Text({}, 'Content'),
      });

      expect(node.props).toMatchObject({
        position: 'relative',
        width: 'fill',
        height: 'fill',
      });
      expect(node.children[0]?.props).toMatchObject({
        position: 'absolute',
        width: 'fill',
        height: 'fill',
        __fillChar: '.',
      });
      expect(node.children[1]?.props).toMatchObject({
        alignItems: 'center',
        justifyContent: 'center',
      });

      node.children[0]?.props.onClick();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('uses top, bottom, and custom positions in the viewport layer', () => {
      const top = Modal({
        position: 'top',
        backdrop: false,
        content: Text({}, 'Top'),
      });
      const bottom = Modal({
        position: 'bottom',
        backdrop: false,
        content: Text({}, 'Bottom'),
      });
      const custom = Modal({
        position: { x: 7, y: 3 },
        backdrop: false,
        size: { width: 20, height: 6 },
        content: Text({}, 'Custom'),
      });

      expect(top.children[0]?.props.justifyContent).toBe('flex-start');
      expect(bottom.children[0]?.props.justifyContent).toBe('flex-end');
      expect(custom.children[0]?.props).toMatchObject({
        left: 7,
        top: 3,
        width: 20,
        height: 6,
      });
    });

    it('rejects invalid backdrop characters and positions', () => {
      expect(() => Modal({
        backdropChar: 'ab',
        content: Text({}, 'Content'),
      })).toThrow(/backdropChar/);
      expect(() => Modal({
        position: { x: -1, y: 0 },
        content: Text({}, 'Content'),
      })).toThrow(/position/);
    });
  });

  describe('openModal', () => {
    it('adapts Modal presentation to an OverlayHost session', async () => {
      const runtime = createInteractionRuntime();
      const host = createOverlayHost<VNode | null>({ runtime });
      const onClose = vi.fn();
      const session = openModal({
        id: 'settings',
        host,
        title: 'Settings',
        content: Text({}, 'Preferences'),
        onClose,
      });

      expect(host.snapshot()).toMatchObject({
        activeId: 'settings',
        backdropId: 'settings',
      });
      expect(runtime.inspect()).toMatchObject({ mode: 'overlay', target: 'settings' });

      await session.close();
      expect(host.snapshot().entries).toEqual([]);
      expect(onClose).toHaveBeenCalledOnce();
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
        confirmText: 'Yes, Delete',
        cancelText: 'No, Keep',
        onConfirm: () => {},
        onCancel: () => {},
      });
      const output = renderOnce(node, 60);
      expect(output).toContain('Yes, Delete');
      expect(output).toContain('No, Keep');
    });

    it('should render with danger style', () => {
      const node = ConfirmDialog({
        title: 'Danger',
        message: 'This is dangerous!',
        type: 'danger',
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
      expect(state.activateSelected).toBeDefined();
      expect(state.activateSelected).toBeDefined();
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

    it('should notify reactive consumers when the selected button changes', () => {
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test',
      });
      let observed = -1;
      const dispose = createEffect(() => {
        observed = state.props.selected ?? -1;
      });

      expect(observed).toBe(0);
      state.selectConfirm();
      expect(observed).toBe(1);

      dispose();
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
      state.activateSelected();
      expect(onConfirm).toHaveBeenCalled();
    });

    it('activates the selected action with an unambiguous method', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test',
        onConfirm,
        onCancel,
      });

      state.activateSelected();
      state.selectConfirm();
      state.activateSelected();

      expect(onCancel).toHaveBeenCalledOnce();
      expect(onConfirm).toHaveBeenCalledOnce();
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
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const state = createConfirmDialog({
        title: 'My Title',
        message: 'My Message',
        confirmText: 'Yes',
        cancelText: 'No',
        type: 'danger',
        onConfirm,
        onCancel,
      });
      expect(state.props.title).toBe('My Title');
      expect(state.props.message).toBe('My Message');
      expect(state.props.confirmText).toBe('Yes');
      expect(state.props.cancelText).toBe('No');
      expect(state.props.type).toBe('danger');
      expect(state.props.onConfirm).toBe(onConfirm);
      expect(state.props.onCancel).toBe(onCancel);

      state.selectConfirm();
      expect(state.props.selected).toBe(1);
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

    it('should render without an icon', () => {
      const node = AlertBox({
        type: 'info',
        message: 'Info',
        showIcon: false,
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
        expect(node.props.position).toBe('absolute');
        expect(position === 'top' ? node.props.top : node.props.bottom).toBe(0);
      });
    });

    it('should support full-width layout', () => {
      const node = Toast({
        type: 'info',
        message: 'Toast',
        fullWidth: true,
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
        children: Text({}, 'Window content'),
        width: 40,
        height: 10,
      });
      expect(node).toBeDefined();
    });

    it('should render with a custom color', () => {
      const node = Window({
        title: 'Window',
        children: Text({}, 'Content'),
        width: 30,
        height: 10,
        color: 'cyan',
      });
      expect(node).toBeDefined();
    });

    it('should render a primary variant', () => {
      const node = Window({
        title: 'Active Window',
        children: Text({}, 'Content'),
        width: 30,
        height: 10,
        variant: 'primary',
      });
      expect(node).toBeDefined();
    });

    it('should render a danger variant', () => {
      const node = Window({
        title: 'Inactive Window',
        children: Text({}, 'Content'),
        width: 30,
        height: 10,
        variant: 'danger',
      });
      expect(node).toBeDefined();
    });

    it('should render title-bar controls', () => {
      const node = Window({
        title: 'Window',
        children: Text({}, 'Content'),
        width: 30,
        height: 10,
        showMinimize: true,
        showMaximize: true,
      });
      expect(node).toBeDefined();
    });

    it('wires the visible close control to onClose', () => {
      const onClose = vi.fn();
      const node = Window({
        title: 'Closable',
        children: Text({}, 'Content'),
        onClose,
      });
      const titleBar = node.children[0]!;
      const buttons = titleBar.children[1]!;
      const closeButton = buttons.children[0]!;

      expect(closeButton.props['aria-label']).toBe('Close window');
      closeButton.props.onClick?.({} as never);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
